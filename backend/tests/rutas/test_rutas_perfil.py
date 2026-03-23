"""Tests para las rutas de perfil, incluyendo el endpoint PDF y actualización."""

import uuid
from datetime import date, time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.modelos.perfil import Perfil
from app.modelos.usuario import Usuario
from app.nucleo.servicio_geo import ResultadoGeo
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth


# ── Helpers ───────────────────────────────────────────────────


def _crear_usuario_mock(uid=None, email="test@test.com", nombre="Test", activo=True):
    """Crea un objeto Usuario mock."""
    usuario = MagicMock(spec=Usuario)
    usuario.id = uid or uuid.uuid4()
    usuario.email = email
    usuario.nombre = nombre
    usuario.activo = activo
    usuario.verificado = False
    usuario.proveedor_auth = "local"
    usuario.hash_contrasena = "hash"
    usuario.google_id = None
    usuario.ultimo_acceso = None
    usuario.creado_en = None
    return usuario


def _crear_perfil_mock(uid=None, usuario_id=None, nombre="Lucía García"):
    """Crea un objeto Perfil mock."""
    perfil = MagicMock(spec=Perfil)
    perfil.id = uid or uuid.uuid4()
    perfil.usuario_id = usuario_id
    perfil.nombre = nombre
    perfil.fecha_nacimiento = date(1990, 1, 15)
    perfil.hora_nacimiento = time(14, 30)
    perfil.ciudad_nacimiento = "Buenos Aires"
    perfil.pais_nacimiento = "Argentina"
    perfil.latitud = -34.6037
    perfil.longitud = -58.3816
    perfil.zona_horaria = "America/Argentina/Buenos_Aires"
    return perfil


CALCULOS_TEST = {
    "natal": {
        "ascendente": {"signo": "Géminis", "grado_en_signo": 12.34, "longitud": 72.34},
        "medio_cielo": {"signo": "Acuario", "grado_en_signo": 5.67, "longitud": 305.67},
        "planetas": [
            {
                "nombre": "Sol",
                "signo": "Capricornio",
                "grado_en_signo": 24.82,
                "longitud": 294.82,
                "latitud": 0.0,
                "casa": 8,
                "retrogrado": False,
                "velocidad": 1.019,
                "dignidad": None,
            },
        ],
        "casas": [
            {"numero": 1, "signo": "Géminis", "grado": 72.34, "grado_en_signo": 12.34},
        ],
        "aspectos": [],
    },
    "diseno_humano": {
        "tipo": "Generador",
        "autoridad": "Sacral",
        "perfil": "3/5",
        "definicion": "Simple",
        "cruz_encarnacion": {"puertas": [10, 15, 18, 17]},
        "centros": {"sacral": "definido", "cabeza": "abierto"},
        "canales": [],
        "activaciones_conscientes": [],
        "activaciones_inconscientes": [],
    },
    "numerologia": {
        "sistema": "pitagórico",
        "camino_de_vida": {"numero": 8, "descripcion": "Poder y logro."},
        "expresion": {"numero": 5, "descripcion": "Libertad."},
        "impulso_del_alma": {"numero": 3, "descripcion": "Creatividad."},
        "personalidad": {"numero": 2, "descripcion": "Diplomacia."},
        "numero_nacimiento": {"numero": 6, "descripcion": "Hogar."},
        "anio_personal": {"numero": 1, "descripcion": "Inicio."},
        "numeros_maestros_presentes": [],
    },
    "retorno_solar": None,
}

CALCULOS_VACIOS = {
    "natal": None,
    "diseno_humano": None,
    "numerologia": None,
    "retorno_solar": None,
}


# ── Fixtures ──────────────────────────────────────────────────


@pytest.fixture
def redis_falso():
    """Redis falso basado en diccionario en memoria."""
    almacen = {}
    redis = AsyncMock()

    async def fake_get(clave):
        return almacen.get(clave)

    async def fake_set(clave, valor):
        almacen[clave] = valor

    async def fake_setex(clave, ttl, valor):
        almacen[clave] = valor

    async def fake_exists(clave):
        return 1 if clave in almacen else 0

    async def fake_delete(*claves):
        eliminadas = 0
        for clave in claves:
            if clave in almacen:
                del almacen[clave]
                eliminadas += 1
        return eliminadas

    redis.get = AsyncMock(side_effect=fake_get)
    redis.set = AsyncMock(side_effect=fake_set)
    redis.setex = AsyncMock(side_effect=fake_setex)
    redis.exists = AsyncMock(side_effect=fake_exists)
    redis.delete = AsyncMock(side_effect=fake_delete)
    redis._almacen = almacen

    return redis


@pytest.fixture
def db_falsa():
    """Sesión de DB falsa."""
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()
    sesion.execute = AsyncMock()
    return sesion


@pytest.fixture
def app_test(redis_falso, db_falsa):
    """Aplicación FastAPI con dependencias mockeadas."""
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
    """Cliente HTTP async."""
    transport = ASGITransport(app=app_test)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Tests: GET /profile/me ────────────────────────────────────


class TestObtenerMiPerfil:
    """Tests de GET /profile/me."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_obtener_perfil_exitoso(self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso):
        """Debe retornar el perfil del usuario autenticado."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()
        assert datos["exito"] is True
        assert datos["datos"]["nombre"] == "Lucía García"
        assert datos["datos"]["ciudad_nacimiento"] == "Buenos Aires"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_obtener_perfil_sin_perfil(self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso):
        """Debe retornar datos null si el usuario no tiene perfil."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"] is None

    @pytest.mark.asyncio
    async def test_obtener_perfil_sin_auth(self, cliente):
        """Debe retornar 401 sin token."""
        resp = await cliente.get("/api/v1/profile/me")
        assert resp.status_code == 401


# ── Tests: GET /profile/me/calculos ───────────────────────────


class TestObtenerMisCalculos:
    """Tests de GET /profile/me/calculos."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_calculos_con_datos(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente, redis_falso
    ):
        """Debe retornar los cálculos del usuario."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_todos_por_perfil = AsyncMock(return_value=CALCULOS_TEST)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me/calculos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["natal"] is not None
        assert datos["diseno_humano"] is not None
        assert datos["numerologia"] is not None

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_calculos_sin_perfil(self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso):
        """Debe retornar todo null si no hay perfil."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me/calculos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["natal"] is None
        assert datos["diseno_humano"] is None


# ── Tests: GET /profile/me/pdf ────────────────────────────────


class TestDescargarPerfilPDF:
    """Tests de GET /profile/me/pdf."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_descargar_pdf_exitoso(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente, redis_falso
    ):
        """Debe generar y retornar un PDF válido."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_todos_por_perfil = AsyncMock(return_value=CALCULOS_TEST)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me/pdf",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/pdf"
        assert "attachment" in resp.headers.get("content-disposition", "")
        assert "perfil_cosmico" in resp.headers.get("content-disposition", "")

        # Verificar que es un PDF válido
        assert resp.content[:5] == b"%PDF-"
        assert len(resp.content) > 1000

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_descargar_pdf_sin_calculos(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente, redis_falso
    ):
        """Debe generar PDF aunque no haya cálculos (secciones vacías)."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_todos_por_perfil = AsyncMock(return_value=CALCULOS_VACIOS)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me/pdf",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.content[:5] == b"%PDF-"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_descargar_pdf_sin_perfil_404(
        self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso
    ):
        """Debe retornar 404 si el usuario no tiene perfil."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me/pdf",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 404
        assert "Perfil no encontrado" in resp.json().get("detail", "")

    @pytest.mark.asyncio
    async def test_descargar_pdf_sin_auth(self, cliente):
        """Debe retornar 401 sin token de autenticación."""
        resp = await cliente.get("/api/v1/profile/me/pdf")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_nombre_archivo_pdf(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente, redis_falso
    ):
        """El nombre del archivo debe contener el nombre del usuario."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid, nombre="Ana López")

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoCalculo.return_value.obtener_todos_por_perfil = AsyncMock(return_value=CALCULOS_VACIOS)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/profile/me/pdf",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        disposition = resp.headers.get("content-disposition", "")
        assert "Ana_L" in disposition  # "Ana López" → "Ana_López"


# ── Tests: GET /profile/{perfil_id} ──────────────────────────


class TestObtenerPerfilPorId:
    """Tests de GET /profile/{perfil_id}."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    async def test_obtener_por_id_exitoso(self, MockRepoPerfil, cliente):
        """Debe retornar el perfil por su ID."""
        perfil_id = uuid.uuid4()
        perfil = _crear_perfil_mock(uid=perfil_id)

        MockRepoPerfil.return_value.obtener_por_id = AsyncMock(return_value=perfil)

        resp = await cliente.get(f"/api/v1/profile/{perfil_id}")

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["id"] == str(perfil_id)
        assert datos["nombre"] == "Lucía García"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    async def test_obtener_por_id_no_encontrado(self, MockRepoPerfil, cliente):
        """Debe retornar 404 si el perfil no existe."""
        perfil_id = uuid.uuid4()
        MockRepoPerfil.return_value.obtener_por_id = AsyncMock(return_value=None)

        resp = await cliente.get(f"/api/v1/profile/{perfil_id}")

        assert resp.status_code == 404


# ── Constantes para tests de actualización ────────────────────

GEO_CORDOBA = ResultadoGeo(
    latitud=-31.4201,
    longitud=-64.1888,
    direccion_completa="Córdoba, Argentina",
)


# ── Tests: PUT /profile/me ───────────────────────────────────


class TestActualizarMiPerfil:
    """Tests de PUT /profile/me."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_actualizar_solo_nombre_sin_recalculo(
        self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso
    ):
        """Cambiar solo el nombre no debe disparar recálculo."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid, nombre="Lucía García")

        perfil_actualizado = _crear_perfil_mock(usuario_id=uid, nombre="Lucía López")

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoPerfil.return_value.actualizar = AsyncMock(return_value=perfil_actualizado)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"nombre": "Lucía López"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["nombre"] == "Lucía López"
        assert datos["datos_nacimiento_cambiaron"] is False

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.GestorCache")
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.ServicioZonaHoraria")
    @patch("app.rutas.v1.perfil.ServicioGeo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cambiar_ciudad_re_geocodifica_y_elimina_calculos(
        self,
        MockRepoAuth,
        MockRepoPerfil,
        MockGeo,
        MockZona,
        MockRepoCalculo,
        MockCache,
        cliente,
        redis_falso,
    ):
        """Cambiar ciudad debe re-geocodificar, eliminar cálculos e invalidar cache."""
        uid = uuid.uuid4()
        perfil_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(uid=perfil_id, usuario_id=uid)

        perfil_nuevo = _crear_perfil_mock(uid=perfil_id, usuario_id=uid)
        perfil_nuevo.ciudad_nacimiento = "Córdoba"
        perfil_nuevo.latitud = -31.4201
        perfil_nuevo.longitud = -64.1888
        perfil_nuevo.zona_horaria = "America/Argentina/Cordoba"

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoPerfil.return_value.actualizar = AsyncMock(return_value=perfil_nuevo)

        MockGeo.geocodificar = AsyncMock(return_value=GEO_CORDOBA)
        MockZona.obtener_zona_horaria = MagicMock(return_value="America/Argentina/Cordoba")

        MockRepoCalculo.return_value.eliminar_todos_por_perfil = AsyncMock(
            return_value=["hash_natal_abc", "hash_hd_def"]
        )
        MockCache.return_value.invalidar_multiples = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"ciudad_nacimiento": "Córdoba"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["datos_nacimiento_cambiaron"] is True
        assert datos["ciudad_nacimiento"] == "Córdoba"

        # Verificar que se geocodificó
        MockGeo.geocodificar.assert_called_once_with("Córdoba", "Argentina")
        MockZona.obtener_zona_horaria.assert_called_once()

        # Verificar que se eliminaron cálculos
        MockRepoCalculo.return_value.eliminar_todos_por_perfil.assert_called_once_with(perfil_id)

        # Verificar que se invalidó cache
        MockCache.return_value.invalidar_multiples.assert_called_once_with(
            ["hash_natal_abc", "hash_hd_def"]
        )

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cambiar_hora_nacimiento_detecta_cambio(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente, redis_falso
    ):
        """Cambiar hora_nacimiento debe detectar cambio y eliminar cálculos."""
        uid = uuid.uuid4()
        perfil_id = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(uid=perfil_id, usuario_id=uid)
        # perfil tiene hora_nacimiento = time(14, 30) → "14:30"

        perfil_nuevo = _crear_perfil_mock(uid=perfil_id, usuario_id=uid)
        perfil_nuevo.hora_nacimiento = time(10, 0)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoPerfil.return_value.actualizar = AsyncMock(return_value=perfil_nuevo)
        MockRepoCalculo.return_value.eliminar_todos_por_perfil = AsyncMock(return_value=[])

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"hora_nacimiento": "10:00"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"]["datos_nacimiento_cambiaron"] is True
        MockRepoCalculo.return_value.eliminar_todos_por_perfil.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_enviar_misma_hora_no_detecta_cambio(
        self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso
    ):
        """Enviar la misma hora no debe disparar recálculo."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)
        # perfil tiene hora_nacimiento = time(14, 30)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoPerfil.return_value.actualizar = AsyncMock(return_value=perfil)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"hora_nacimiento": "14:30"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"]["datos_nacimiento_cambiaron"] is False

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cambiar_fecha_nacimiento_detecta_cambio(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente, redis_falso
    ):
        """Cambiar fecha_nacimiento debe detectar cambio."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)
        # perfil.fecha_nacimiento = date(1990, 1, 15)

        perfil_nuevo = _crear_perfil_mock(usuario_id=uid)
        perfil_nuevo.fecha_nacimiento = date(1991, 5, 20)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoPerfil.return_value.actualizar = AsyncMock(return_value=perfil_nuevo)
        MockRepoCalculo.return_value.eliminar_todos_por_perfil = AsyncMock(return_value=[])

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"fecha_nacimiento": "1991-05-20"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"]["datos_nacimiento_cambiaron"] is True

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sin_perfil_retorna_404(
        self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso
    ):
        """Debe retornar 404 si el usuario no tiene perfil."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"nombre": "Otro Nombre"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_sin_auth_retorna_401(self, cliente):
        """Debe retornar 401 sin token de autenticación."""
        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"nombre": "Test"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sin_campos_retorna_422(
        self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso
    ):
        """Debe retornar 422 si no se proporcionan campos."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 422

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioCalculo")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sin_hashes_no_invalida_cache(
        self, MockRepoAuth, MockRepoPerfil, MockRepoCalculo, cliente, redis_falso
    ):
        """Si no hay cálculos previos, no debe intentar invalidar cache."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        perfil_nuevo = _crear_perfil_mock(usuario_id=uid)
        perfil_nuevo.fecha_nacimiento = date(2000, 6, 1)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoPerfil.return_value.actualizar = AsyncMock(return_value=perfil_nuevo)
        MockRepoCalculo.return_value.eliminar_todos_por_perfil = AsyncMock(return_value=[])

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"fecha_nacimiento": "2000-06-01"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"]["datos_nacimiento_cambiaron"] is True
        # eliminar_todos_por_perfil fue llamado, pero retornó lista vacía
        MockRepoCalculo.return_value.eliminar_todos_por_perfil.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_actualizar_multiples_campos_a_la_vez(
        self, MockRepoAuth, MockRepoPerfil, cliente, redis_falso
    ):
        """Debe poder actualizar nombre y otros campos sin nacimiento."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        perfil = _crear_perfil_mock(usuario_id=uid)

        perfil_nuevo = _crear_perfil_mock(usuario_id=uid, nombre="Nombre Nuevo")

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil)
        MockRepoPerfil.return_value.actualizar = AsyncMock(return_value=perfil_nuevo)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.put(
            "/api/v1/profile/me",
            json={"nombre": "Nombre Nuevo"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["nombre"] == "Nombre Nuevo"
        assert datos["datos_nacimiento_cambiaron"] is False
        MockRepoPerfil.return_value.actualizar.assert_called_once()
