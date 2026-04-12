"""Tests para POST /chat/explicar — micro-chat sobre selección de texto."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.modelos.usuario import Usuario
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth


def _crear_usuario_mock(uid=None, email="test@test.com", nombre="Manuel"):
    usuario = MagicMock(spec=Usuario)
    usuario.id = uid or uuid.uuid4()
    usuario.email = email
    usuario.nombre = nombre
    usuario.activo = True
    usuario.verificado = False
    usuario.proveedor_auth = "local"
    usuario.hash_contrasena = "hash"
    usuario.google_id = None
    usuario.ultimo_acceso = None
    usuario.creado_en = None
    return usuario


@pytest.fixture
def redis_falso():
    """Redis falso en memoria — soporta get, set, exists, pipeline."""
    almacen: dict[str, str | int] = {}
    redis = AsyncMock()

    async def fake_get(clave):
        valor = almacen.get(clave)
        if valor is None:
            return None
        # Simular cómo redis-py devuelve bytes para strings
        if isinstance(valor, str):
            return valor.encode("utf-8")
        return str(valor).encode("utf-8")

    async def fake_set(clave, valor, ex=None):
        almacen[clave] = valor
        return True

    async def fake_exists(clave):
        return 1 if clave in almacen else 0

    def fake_pipeline():
        comandos = []

        class PipelineFalso:
            def incr(self, clave):
                comandos.append(("incr", clave))
                return self

            def expire(self, clave, ttl):
                comandos.append(("expire", clave, ttl))
                return self

            async def execute(self):
                for comando in comandos:
                    if comando[0] == "incr":
                        clave = comando[1]
                        valor = almacen.get(clave)
                        valor = int(valor) if valor else 0
                        almacen[clave] = valor + 1
                return [True for _ in comandos]

        return PipelineFalso()

    redis.get = AsyncMock(side_effect=fake_get)
    redis.set = AsyncMock(side_effect=fake_set)
    redis.exists = AsyncMock(side_effect=fake_exists)
    redis.pipeline = MagicMock(side_effect=fake_pipeline)
    redis._almacen = almacen
    return redis


@pytest.fixture
def db_falsa():
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()
    sesion.execute = AsyncMock()
    return sesion


@pytest.fixture
def app_test(redis_falso, db_falsa):
    app = crear_aplicacion()

    async def override_redis():
        return redis_falso

    async def override_db():
        return db_falsa

    app.dependency_overrides[_obtener_db_placeholder] = override_db
    app.dependency_overrides[_obtener_redis_placeholder] = override_redis
    return app


@pytest.fixture
async def cliente(app_test):
    transport = ASGITransport(app=app_test)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def _stub_perfil_y_suscripcion(
    MockRepoUsuario,
    MockRepoSuscripcion,
    MockRepoPerfil,
    usuario,
    *,
    es_premium: bool,
):
    """Configura los mocks comunes para el lookup de premium + perfil."""
    MockRepoUsuario.return_value.obtener_por_id = AsyncMock(return_value=usuario)
    if es_premium:
        sus = MagicMock()
        sus.plan_id = uuid.uuid4()
        MockRepoSuscripcion.return_value.obtener_activa = AsyncMock(return_value=sus)
    else:
        MockRepoSuscripcion.return_value.obtener_activa = AsyncMock(return_value=None)
    MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=None)


class TestExplicarSeleccion:
    """Tests de POST /chat/explicar."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.chat.RepositorioPlan")
    @patch("app.rutas.v1.chat.RepositorioPerfil")
    @patch("app.rutas.v1.chat.RepositorioSuscripcion")
    @patch("app.rutas.v1.chat.ServicioOraculo")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_premium_primer_request_llama_anthropic_y_guarda_cache(
        self,
        MockRepoUsuario,
        MockServicioOraculo,
        MockRepoSuscripcion,
        MockRepoPerfil,
        MockRepoPlan,
        cliente,
        redis_falso,
    ):
        """Premium sin cache → llama Haiku, guarda cache, mensajes_restantes=None."""
        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id)

        _stub_perfil_y_suscripcion(
            MockRepoUsuario, MockRepoSuscripcion, MockRepoPerfil, usuario, es_premium=True,
        )
        plan_premium = MagicMock()
        plan_premium.slug = "premium"
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_premium)

        MockServicioOraculo.explicar_seleccion = AsyncMock(
            return_value=("Manuel, Generador Manifestante combina vitalidad y velocidad.", 200, 150, 50),
        )

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")

        respuesta = await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": "Generador Manifestante", "contexto_seccion": "diseno-humano"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert respuesta.status_code == 200
        cuerpo = respuesta.json()
        assert cuerpo["exito"] is True
        datos = cuerpo["datos"]
        assert "Generador Manifestante" in datos["respuesta"]
        assert datos["desde_cache"] is False
        assert datos["mensajes_restantes"] is None  # premium = ilimitado
        # Verificar que el cache fue escrito
        assert any(k.startswith("explicar:") for k in redis_falso._almacen.keys())
        MockServicioOraculo.explicar_seleccion.assert_awaited_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.chat.RepositorioPlan")
    @patch("app.rutas.v1.chat.RepositorioPerfil")
    @patch("app.rutas.v1.chat.RepositorioSuscripcion")
    @patch("app.rutas.v1.chat.ServicioOraculo")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_segundo_request_mismo_texto_sirve_desde_cache(
        self,
        MockRepoUsuario,
        MockServicioOraculo,
        MockRepoSuscripcion,
        MockRepoPerfil,
        MockRepoPlan,
        cliente,
        redis_falso,
    ):
        """Mismo texto dos veces → segunda llamada NO toca Anthropic, desde_cache=True."""
        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id)

        _stub_perfil_y_suscripcion(
            MockRepoUsuario, MockRepoSuscripcion, MockRepoPerfil, usuario, es_premium=True,
        )
        plan_premium = MagicMock()
        plan_premium.slug = "premium"
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_premium)

        MockServicioOraculo.explicar_seleccion = AsyncMock(
            return_value=("Manuel, eso significa X.", 200, 150, 50),
        )

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")
        body = {"texto": "Sendero de vida 7", "contexto_seccion": "numerologia"}
        headers = {"Authorization": f"Bearer {token}"}

        # Primer request — cache miss
        primera = await cliente.post("/api/v1/chat/explicar", json=body, headers=headers)
        assert primera.status_code == 200
        assert primera.json()["datos"]["desde_cache"] is False

        # Segundo request idéntico — cache hit
        segunda = await cliente.post("/api/v1/chat/explicar", json=body, headers=headers)
        assert segunda.status_code == 200
        cuerpo2 = segunda.json()
        assert cuerpo2["datos"]["desde_cache"] is True
        assert cuerpo2["datos"]["respuesta"] == "Manuel, eso significa X."

        # Anthropic se llamó SOLO una vez (la primera)
        assert MockServicioOraculo.explicar_seleccion.await_count == 1

    @pytest.mark.asyncio
    @patch("app.rutas.v1.chat.RepositorioPlan")
    @patch("app.rutas.v1.chat.RepositorioPerfil")
    @patch("app.rutas.v1.chat.RepositorioSuscripcion")
    @patch("app.rutas.v1.chat.ServicioOraculo")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_gratis_descuenta_de_la_misma_cuota_del_chat(
        self,
        MockRepoUsuario,
        MockServicioOraculo,
        MockRepoSuscripcion,
        MockRepoPerfil,
        MockRepoPlan,
        cliente,
        redis_falso,
    ):
        """Usuario gratis → descuenta del límite diario, mensajes_restantes=2."""
        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id)

        _stub_perfil_y_suscripcion(
            MockRepoUsuario, MockRepoSuscripcion, MockRepoPerfil, usuario, es_premium=False,
        )

        MockServicioOraculo.explicar_seleccion = AsyncMock(
            return_value=("Respuesta corta.", 100, 80, 20),
        )

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")

        respuesta = await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": "Mercurio retrógrado", "contexto_seccion": "transitos"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert respuesta.status_code == 200
        datos = respuesta.json()["datos"]
        assert datos["desde_cache"] is False
        # Empezó con 3 disponibles, descontó 1 → quedan 2
        assert datos["mensajes_restantes"] == 2

    @pytest.mark.asyncio
    @patch("app.rutas.v1.chat.RepositorioPlan")
    @patch("app.rutas.v1.chat.RepositorioPerfil")
    @patch("app.rutas.v1.chat.RepositorioSuscripcion")
    @patch("app.rutas.v1.chat.ServicioOraculo")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_gratis_al_limite_devuelve_error_limite_excedido(
        self,
        MockRepoUsuario,
        MockServicioOraculo,
        MockRepoSuscripcion,
        MockRepoPerfil,
        MockRepoPlan,
        cliente,
        redis_falso,
    ):
        """Usuario gratis con límite consumido → 403 LimiteExcedido (mapeo del proyecto)."""
        from datetime import date

        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id)

        _stub_perfil_y_suscripcion(
            MockRepoUsuario, MockRepoSuscripcion, MockRepoPerfil, usuario, es_premium=False,
        )

        # Sembrar el contador en el límite (3/3)
        clave_limite = f"chat:limite:{usuario_id}:{date.today().isoformat()}"
        redis_falso._almacen[clave_limite] = 3

        MockServicioOraculo.explicar_seleccion = AsyncMock()

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")

        respuesta = await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": "Casa 10", "contexto_seccion": "carta-natal"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert respuesta.status_code == 403
        cuerpo = respuesta.json()
        assert cuerpo["exito"] is False
        assert cuerpo["error"] == "LimiteExcedido"
        # Anthropic NO se llamó
        MockServicioOraculo.explicar_seleccion.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.chat.RepositorioPlan")
    @patch("app.rutas.v1.chat.RepositorioPerfil")
    @patch("app.rutas.v1.chat.RepositorioSuscripcion")
    @patch("app.rutas.v1.chat.ServicioOraculo")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cache_hit_funciona_aun_al_limite(
        self,
        MockRepoUsuario,
        MockServicioOraculo,
        MockRepoSuscripcion,
        MockRepoPerfil,
        MockRepoPlan,
        cliente,
        redis_falso,
    ):
        """Si el texto está cacheado, sirve la respuesta aunque el usuario esté al límite."""
        from datetime import date

        from app.rutas.v1.chat import _clave_explicar

        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id)

        _stub_perfil_y_suscripcion(
            MockRepoUsuario, MockRepoSuscripcion, MockRepoPerfil, usuario, es_premium=False,
        )

        # Sembrar el contador en el límite
        clave_limite = f"chat:limite:{usuario_id}:{date.today().isoformat()}"
        redis_falso._almacen[clave_limite] = 3

        # Sembrar la respuesta cacheada para el texto que vamos a pedir
        texto = "Generador Manifestante"
        clave_cache = _clave_explicar(usuario_id, texto)
        redis_falso._almacen[clave_cache] = "Manuel, esto ya estaba cacheado."

        MockServicioOraculo.explicar_seleccion = AsyncMock()

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")

        respuesta = await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": texto, "contexto_seccion": "diseno-humano"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert respuesta.status_code == 200
        datos = respuesta.json()["datos"]
        assert datos["desde_cache"] is True
        assert datos["respuesta"] == "Manuel, esto ya estaba cacheado."
        # Anthropic NO se llamó
        MockServicioOraculo.explicar_seleccion.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_texto_muy_corto_o_muy_largo_devuelve_422(
        self, MockRepoUsuario, cliente,
    ):
        """Pydantic rechaza textos < 2 chars o > 600 chars."""
        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id)
        MockRepoUsuario.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Texto muy corto (1 char)
        r1 = await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": "x", "contexto_seccion": "x"},
            headers=headers,
        )
        assert r1.status_code == 422

        # Texto muy largo (>600 chars)
        r2 = await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": "a" * 601, "contexto_seccion": "x"},
            headers=headers,
        )
        assert r2.status_code == 422

    @pytest.mark.asyncio
    @patch("app.rutas.v1.chat.RepositorioPlan")
    @patch("app.rutas.v1.chat.RepositorioPerfil")
    @patch("app.rutas.v1.chat.RepositorioSuscripcion")
    @patch("app.rutas.v1.chat.ServicioOraculo")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_normalizacion_texto_comparte_cache(
        self,
        MockRepoUsuario,
        MockServicioOraculo,
        MockRepoSuscripcion,
        MockRepoPerfil,
        MockRepoPlan,
        cliente,
        redis_falso,
    ):
        """Variantes del mismo texto (mayúsculas/espacios) comparten cache."""
        usuario_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=usuario_id)

        _stub_perfil_y_suscripcion(
            MockRepoUsuario, MockRepoSuscripcion, MockRepoPerfil, usuario, es_premium=True,
        )
        plan_premium = MagicMock()
        plan_premium.slug = "premium"
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_premium)

        MockServicioOraculo.explicar_seleccion = AsyncMock(
            return_value=("Respuesta única.", 100, 80, 20),
        )

        token = ServicioAuth.crear_token_acceso(usuario_id, "test@test.com")
        headers = {"Authorization": f"Bearer {token}"}

        # Primera variante: minúsculas con espacios
        await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": "  generador manifestante  ", "contexto_seccion": "hd"},
            headers=headers,
        )

        # Segunda variante: misma palabra en mayúsculas
        segunda = await cliente.post(
            "/api/v1/chat/explicar",
            json={"texto": "GENERADOR MANIFESTANTE", "contexto_seccion": "hd"},
            headers=headers,
        )

        assert segunda.status_code == 200
        assert segunda.json()["datos"]["desde_cache"] is True
        # Anthropic se llamó solo en la primera
        assert MockServicioOraculo.explicar_seleccion.await_count == 1
