"""Tests para las rutas de autenticación."""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import jwt as pyjwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.configuracion import obtener_configuracion
from app.modelos.usuario import Usuario
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth


# ── Tests unitarios del servicio ────────────────────────────────


class TestServicioAuth:
    """Tests unitarios del servicio de autenticación."""

    def test_hashear_y_verificar_contrasena(self):
        """Debe hashear y verificar correctamente una contraseña."""
        contrasena = "miContrasena123"
        hash_resultado = ServicioAuth.hashear_contrasena(contrasena)

        assert hash_resultado != contrasena
        assert ServicioAuth.verificar_contrasena(contrasena, hash_resultado)
        assert not ServicioAuth.verificar_contrasena("incorrecta", hash_resultado)

    def test_crear_token_acceso(self):
        """Debe crear un token de acceso válido."""
        uid = uuid.uuid4()
        email = "test@test.com"
        token = ServicioAuth.crear_token_acceso(uid, email)

        assert isinstance(token, str)
        assert len(token) > 0

        payload = ServicioAuth.decodificar_token(token)
        assert payload["sub"] == str(uid)
        assert payload["email"] == email
        assert payload["tipo"] == "acceso"
        assert "jti" in payload
        assert "exp" in payload

    def test_crear_token_refresco(self):
        """Debe crear un token de refresco válido."""
        uid = uuid.uuid4()
        token = ServicioAuth.crear_token_refresco(uid)

        payload = ServicioAuth.decodificar_token(token)
        assert payload["sub"] == str(uid)
        assert payload["tipo"] == "refresco"

    def test_generar_tokens(self):
        """Debe generar par de tokens."""
        uid = uuid.uuid4()
        email = "test@test.com"
        tokens = ServicioAuth.generar_tokens(uid, email)

        assert "token_acceso" in tokens
        assert "token_refresco" in tokens
        assert tokens["tipo"] == "bearer"

    def test_token_invalido_lanza_error(self):
        """Debe lanzar error al decodificar un token inválido."""
        import jwt

        with pytest.raises(jwt.PyJWTError):
            ServicioAuth.decodificar_token("token.invalido.aqui")


# ── Fixtures para tests de rutas ────────────────────────────────


def _crear_usuario_mock(
    uid=None, email="test@test.com", nombre="Test", activo=True,
    hash_contrasena=None, proveedor_auth="local",
):
    """Crea un objeto Usuario mock."""
    usuario = MagicMock(spec=Usuario)
    usuario.id = uid or uuid.uuid4()
    usuario.email = email
    usuario.nombre = nombre
    usuario.activo = activo
    usuario.verificado = False
    usuario.proveedor_auth = proveedor_auth
    usuario.hash_contrasena = hash_contrasena
    usuario.google_id = None
    usuario.ultimo_acceso = None
    usuario.creado_en = None
    return usuario


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

    redis.get = AsyncMock(side_effect=fake_get)
    redis.set = AsyncMock(side_effect=fake_set)
    redis.setex = AsyncMock(side_effect=fake_setex)
    redis.exists = AsyncMock(side_effect=fake_exists)
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


# ── Tests de endpoints ──────────────────────────────────────────


class TestRegistro:
    """Tests de POST /auth/registrar."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.obtener_configuracion")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_registrar_usuario_exitoso(self, MockRepo, MockConfig, cliente, db_falsa):
        """Debe crear usuario y retornar tokens."""
        config_mock = MagicMock()
        config_mock.verificacion_email_habilitada = False
        config_mock.asignar_premium_por_defecto = False
        MockConfig.return_value = config_mock
        uid = uuid.uuid4()
        usuario_mock = _crear_usuario_mock(
            uid=uid, email="nuevo@test.com", nombre="Nuevo",
            hash_contrasena=ServicioAuth.hashear_contrasena("segura12345"),
        )

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_email = AsyncMock(return_value=None)
        repo_instance.crear = AsyncMock(return_value=usuario_mock)
        repo_instance.marcar_verificado = AsyncMock()

        resp = await cliente.post(
            "/api/v1/auth/registrar",
            json={
                "email": "nuevo@test.com",
                "nombre": "Nuevo",
                "contrasena": "segura12345",
            },
        )

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert "token_acceso" in cuerpo["datos"]
        assert "token_refresco" in cuerpo["datos"]
        assert cuerpo["datos"]["usuario"]["email"] == "nuevo@test.com"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_registrar_email_duplicado(self, MockRepo, cliente):
        """No debe permitir registrar el mismo email dos veces."""
        usuario_existente = _crear_usuario_mock(email="dup@test.com")
        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_email = AsyncMock(return_value=usuario_existente)

        resp = await cliente.post(
            "/api/v1/auth/registrar",
            json={
                "email": "dup@test.com",
                "nombre": "Dup",
                "contrasena": "segura12345",
            },
        )

        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_registrar_contrasena_corta(self, cliente):
        """No debe permitir contraseñas menores a 8 caracteres."""
        resp = await cliente.post(
            "/api/v1/auth/registrar",
            json={
                "email": "test@test.com",
                "nombre": "Test",
                "contrasena": "corta",
            },
        )
        assert resp.status_code == 422


class TestLogin:
    """Tests de POST /auth/login."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_login_correcto(self, MockRepo, cliente):
        """Debe retornar tokens con credenciales válidas."""
        hash_pw = ServicioAuth.hashear_contrasena("segura12345")
        usuario = _crear_usuario_mock(
            email="login@test.com", hash_contrasena=hash_pw,
        )

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_email = AsyncMock(return_value=usuario)
        repo_instance.actualizar_ultimo_acceso = AsyncMock()

        resp = await cliente.post(
            "/api/v1/auth/login",
            json={"email": "login@test.com", "contrasena": "segura12345"},
        )

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert "token_acceso" in cuerpo["datos"]

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_login_contrasena_incorrecta(self, MockRepo, cliente):
        """Debe rechazar contraseña incorrecta."""
        hash_pw = ServicioAuth.hashear_contrasena("segura12345")
        usuario = _crear_usuario_mock(hash_contrasena=hash_pw)

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_email = AsyncMock(return_value=usuario)

        resp = await cliente.post(
            "/api/v1/auth/login",
            json={"email": "test@test.com", "contrasena": "incorrecta123"},
        )

        assert resp.status_code == 401

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_login_email_no_registrado(self, MockRepo, cliente):
        """Debe rechazar email no registrado."""
        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_email = AsyncMock(return_value=None)

        resp = await cliente.post(
            "/api/v1/auth/login",
            json={"email": "noexiste@test.com", "contrasena": "segura12345"},
        )

        assert resp.status_code == 401


class TestMe:
    """Tests de GET /auth/me."""

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_me_con_token_valido(self, MockRepo, cliente, redis_falso):
        """Debe retornar datos del usuario con token válido."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, email="me@test.com", nombre="Me")

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_id = AsyncMock(return_value=usuario)

        token = ServicioAuth.crear_token_acceso(uid, "me@test.com")

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert cuerpo["datos"]["email"] == "me@test.com"

    @pytest.mark.asyncio
    async def test_me_sin_token(self, cliente):
        """Debe retornar 401 sin token."""
        resp = await cliente.get("/api/v1/auth/me")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_me_token_invalido(self, cliente):
        """Debe retornar 401 con token inválido."""
        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer token_falso"},
        )
        assert resp.status_code == 401


class TestRenovarToken:
    """Tests de POST /auth/renovar."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_renovar_token_valido(self, MockRepo, cliente, redis_falso):
        """Debe generar nuevo token de acceso."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_id = AsyncMock(return_value=usuario)

        token_refresco = ServicioAuth.crear_token_refresco(uid)

        resp = await cliente.post(
            "/api/v1/auth/renovar",
            json={"token_refresco": token_refresco},
        )

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert "token_acceso" in cuerpo["datos"]

    @pytest.mark.asyncio
    async def test_renovar_con_token_acceso_falla(self, cliente):
        """No debe aceptar un token de acceso como token de refresco."""
        uid = uuid.uuid4()
        token_acceso = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/auth/renovar",
            json={"token_refresco": token_acceso},
        )

        assert resp.status_code == 401


class TestCambioContrasena:
    """Tests de POST /auth/cambiar-contrasena."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cambiar_contrasena_exitoso(
        self, MockRepoAuth, MockRepoRuta, cliente, redis_falso
    ):
        """Debe actualizar la contraseña."""
        uid = uuid.uuid4()
        hash_pw = ServicioAuth.hashear_contrasena("actual12345")
        usuario = _crear_usuario_mock(uid=uid, hash_contrasena=hash_pw)

        # Mock para dependencia de auth
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        # Mock para el endpoint
        MockRepoRuta.return_value.cambiar_contrasena = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/auth/cambiar-contrasena",
            json={
                "contrasena_actual": "actual12345",
                "contrasena_nueva": "nueva123456",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["exito"] is True

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cambiar_contrasena_actual_incorrecta(
        self, MockRepoAuth, cliente, redis_falso
    ):
        """Debe rechazar si la contraseña actual es incorrecta."""
        uid = uuid.uuid4()
        hash_pw = ServicioAuth.hashear_contrasena("actual12345")
        usuario = _crear_usuario_mock(uid=uid, hash_contrasena=hash_pw)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/auth/cambiar-contrasena",
            json={
                "contrasena_actual": "incorrecta123",
                "contrasena_nueva": "nueva123456",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 401


class TestLogout:
    """Tests de POST /auth/logout."""

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_logout_exitoso(self, MockRepo, cliente, redis_falso):
        """Debe invalidar el token de refresco."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepo.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        token_acceso = ServicioAuth.crear_token_acceso(uid, "test@test.com")
        token_refresco = ServicioAuth.crear_token_refresco(uid)

        resp = await cliente.post(
            "/api/v1/auth/logout",
            json={"token_refresco": token_refresco},
            headers={"Authorization": f"Bearer {token_acceso}"},
        )

        assert resp.status_code == 200
        assert resp.json()["exito"] is True

        # Verificar que el token fue añadido a la blacklist
        payload = ServicioAuth.decodificar_token(token_refresco)
        jti = payload["jti"]
        assert f"blacklist:{jti}" in redis_falso._almacen


# ── Gap #1: Login con usuario desactivado ───────────────────────


class TestLoginUsuarioDesactivado:
    """Tests de login con usuario inactivo."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_login_usuario_desactivado(self, MockRepo, cliente):
        """Debe rechazar login si usuario.activo=False."""
        hash_pw = ServicioAuth.hashear_contrasena("segura12345")
        usuario = _crear_usuario_mock(
            hash_contrasena=hash_pw, activo=False,
        )

        MockRepo.return_value.obtener_por_email = AsyncMock(return_value=usuario)

        resp = await cliente.post(
            "/api/v1/auth/login",
            json={"email": "test@test.com", "contrasena": "segura12345"},
        )

        assert resp.status_code == 401
        assert "desactivada" in resp.json()["detalle"].lower()


# ── Gap #2: Login con usuario Google (sin hash_contrasena) ──────


class TestLoginUsuarioGoogle:
    """Tests de login con usuario registrado vía Google."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_login_usuario_google_sin_contrasena(self, MockRepo, cliente):
        """Debe rechazar login si usuario tiene hash_contrasena=None (Google)."""
        usuario = _crear_usuario_mock(
            hash_contrasena=None, proveedor_auth="google",
        )

        MockRepo.return_value.obtener_por_email = AsyncMock(return_value=usuario)

        resp = await cliente.post(
            "/api/v1/auth/login",
            json={"email": "test@test.com", "contrasena": "segura12345"},
        )

        assert resp.status_code == 401


# ── Gap #3: Token de acceso expirado ────────────────────────────


class TestTokenExpirado:
    """Tests con token de acceso expirado."""

    @pytest.mark.asyncio
    async def test_me_con_token_expirado(self, cliente):
        """Debe retornar 401 si el token de acceso expiró."""
        config = obtener_configuracion()
        uid = uuid.uuid4()
        ahora = datetime.now(timezone.utc)
        payload = {
            "sub": str(uid),
            "email": "test@test.com",
            "tipo": "acceso",
            "jti": str(uuid.uuid4()),
            "iat": ahora - timedelta(hours=2),
            "exp": ahora - timedelta(hours=1),  # expiró hace 1 hora
        }
        token_expirado = pyjwt.encode(
            payload, config.clave_secreta, algorithm=config.algoritmo_jwt
        )

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token_expirado}"},
        )

        assert resp.status_code == 401
        assert "expirado" in resp.json()["detalle"].lower()


# ── Gap #4: Renovar con refresh token revocado ──────────────────


class TestRenovarTokenRevocado:
    """Tests de renovación con token en blacklist."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_renovar_con_refresh_revocado(
        self, MockRepo, cliente, redis_falso
    ):
        """Debe rechazar renovación si el refresh token está en blacklist."""
        uid = uuid.uuid4()
        token_refresco = ServicioAuth.crear_token_refresco(uid)

        # Revocar el token (meter en blacklist)
        payload = ServicioAuth.decodificar_token(token_refresco)
        jti = payload["jti"]
        redis_falso._almacen[f"blacklist:{jti}"] = "1"

        resp = await cliente.post(
            "/api/v1/auth/renovar",
            json={"token_refresco": token_refresco},
        )

        assert resp.status_code == 401
        assert "revocado" in resp.json()["detalle"].lower()


# ── Gap #5: Renovar con refresh token expirado ──────────────────


class TestRenovarTokenExpirado:
    """Tests de renovación con token expirado."""

    @pytest.mark.asyncio
    async def test_renovar_con_refresh_expirado(self, cliente):
        """Debe rechazar renovación si el refresh token expiró."""
        config = obtener_configuracion()
        uid = uuid.uuid4()
        ahora = datetime.now(timezone.utc)
        payload = {
            "sub": str(uid),
            "tipo": "refresco",
            "jti": str(uuid.uuid4()),
            "iat": ahora - timedelta(days=10),
            "exp": ahora - timedelta(days=1),
        }
        token_expirado = pyjwt.encode(
            payload, config.clave_secreta, algorithm=config.algoritmo_jwt
        )

        resp = await cliente.post(
            "/api/v1/auth/renovar",
            json={"token_refresco": token_expirado},
        )

        assert resp.status_code == 401
        assert "expirado" in resp.json()["detalle"].lower()

    @pytest.mark.asyncio
    async def test_renovar_con_token_invalido(self, cliente):
        """Debe rechazar renovación con token basura."""
        resp = await cliente.post(
            "/api/v1/auth/renovar",
            json={"token_refresco": "basura.total.invalido"},
        )

        assert resp.status_code == 401


# ── Gap #6: Renovar con usuario desactivado ─────────────────────


class TestRenovarUsuarioDesactivado:
    """Tests de renovación con usuario inactivo."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_renovar_usuario_desactivado(
        self, MockRepo, cliente, redis_falso
    ):
        """Debe rechazar renovación si el usuario fue desactivado."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, activo=False)

        MockRepo.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        token_refresco = ServicioAuth.crear_token_refresco(uid)

        resp = await cliente.post(
            "/api/v1/auth/renovar",
            json={"token_refresco": token_refresco},
        )

        assert resp.status_code == 401

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_renovar_usuario_no_encontrado(
        self, MockRepo, cliente, redis_falso
    ):
        """Debe rechazar renovación si el usuario ya no existe."""
        uid = uuid.uuid4()
        MockRepo.return_value.obtener_por_id = AsyncMock(return_value=None)

        token_refresco = ServicioAuth.crear_token_refresco(uid)

        resp = await cliente.post(
            "/api/v1/auth/renovar",
            json={"token_refresco": token_refresco},
        )

        assert resp.status_code == 401


# ── Gap #7: Cambiar contraseña usuario Google ───────────────────


class TestCambioContrasenaGoogle:
    """Tests de cambio de contraseña para usuario Google."""

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cambiar_contrasena_usuario_google_rechazado(
        self, MockRepoAuth, cliente, redis_falso
    ):
        """Debe rechazar cambio de contraseña si el usuario es de Google."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(
            uid=uid, hash_contrasena=None, proveedor_auth="google",
        )

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        token = ServicioAuth.crear_token_acceso(uid, "google@test.com")

        resp = await cliente.post(
            "/api/v1/auth/cambiar-contrasena",
            json={
                "contrasena_actual": "cualquiera",
                "contrasena_nueva": "nueva123456",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 401
        assert "google" in resp.json()["detalle"].lower()


# ── Gap #8: obtener_usuario_opcional — branches ─────────────────


class TestUsuarioOpcional:
    """Tests de la dependencia obtener_usuario_opcional."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.ServicioGeo")
    @patch("app.rutas.v1.perfil.ServicioZonaHoraria")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    async def test_perfil_sin_token_funciona(
        self, MockRepoPerfil, MockZona, MockGeo, cliente, db_falsa
    ):
        """Crear perfil sin token debe funcionar (usuario=None)."""
        from app.nucleo.servicio_geo import ResultadoGeo

        MockGeo.geocodificar = AsyncMock(return_value=ResultadoGeo(
            latitud=-34.6, longitud=-58.4, direccion_completa="Buenos Aires"
        ))
        MockZona.obtener_zona_horaria = MagicMock(return_value="America/Argentina/Buenos_Aires")

        perfil_mock = MagicMock()
        perfil_mock.id = uuid.uuid4()
        perfil_mock.nombre = "Test"
        perfil_mock.fecha_nacimiento = "1990-01-15"
        perfil_mock.hora_nacimiento = "14:30:00"
        perfil_mock.ciudad_nacimiento = "Buenos Aires"
        perfil_mock.pais_nacimiento = "Argentina"
        perfil_mock.latitud = -34.6
        perfil_mock.longitud = -58.4
        perfil_mock.zona_horaria = "America/Argentina/Buenos_Aires"
        MockRepoPerfil.return_value.crear = AsyncMock(return_value=perfil_mock)

        resp = await cliente.post(
            "/api/v1/profile",
            json={
                "nombre": "Test",
                "fecha_nacimiento": "1990-01-15",
                "hora_nacimiento": "14:30",
                "ciudad_nacimiento": "Buenos Aires",
                "pais_nacimiento": "Argentina",
            },
        )

        assert resp.status_code == 200
        # Verificar que se llamó crear con usuario_id=None
        call_kwargs = MockRepoPerfil.return_value.crear.call_args
        assert call_kwargs.kwargs.get("usuario_id") is None

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    @patch("app.rutas.v1.perfil.ServicioGeo")
    @patch("app.rutas.v1.perfil.ServicioZonaHoraria")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    async def test_perfil_con_token_vincula_usuario(
        self, MockRepoPerfil, MockZona, MockGeo, MockRepoUsuario,
        cliente, redis_falso, db_falsa
    ):
        """Crear perfil con token válido debe pasar usuario_id al repo."""
        from app.nucleo.servicio_geo import ResultadoGeo

        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        MockRepoUsuario.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        MockGeo.geocodificar = AsyncMock(return_value=ResultadoGeo(
            latitud=-34.6, longitud=-58.4, direccion_completa="Buenos Aires"
        ))
        MockZona.obtener_zona_horaria = MagicMock(return_value="America/Argentina/Buenos_Aires")

        perfil_mock = MagicMock()
        perfil_mock.id = uuid.uuid4()
        perfil_mock.nombre = "Test"
        perfil_mock.fecha_nacimiento = "1990-01-15"
        perfil_mock.hora_nacimiento = "14:30:00"
        perfil_mock.ciudad_nacimiento = "Buenos Aires"
        perfil_mock.pais_nacimiento = "Argentina"
        perfil_mock.latitud = -34.6
        perfil_mock.longitud = -58.4
        perfil_mock.zona_horaria = "America/Argentina/Buenos_Aires"
        MockRepoPerfil.return_value.crear = AsyncMock(return_value=perfil_mock)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/profile",
            json={
                "nombre": "Test",
                "fecha_nacimiento": "1990-01-15",
                "hora_nacimiento": "14:30",
                "ciudad_nacimiento": "Buenos Aires",
                "pais_nacimiento": "Argentina",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        call_kwargs = MockRepoPerfil.return_value.crear.call_args
        assert call_kwargs.kwargs.get("usuario_id") == uid

    @pytest.mark.asyncio
    @patch("app.rutas.v1.perfil.ServicioGeo")
    @patch("app.rutas.v1.perfil.ServicioZonaHoraria")
    @patch("app.rutas.v1.perfil.RepositorioPerfil")
    async def test_perfil_con_token_invalido_funciona_anonimo(
        self, MockRepoPerfil, MockZona, MockGeo, cliente, db_falsa
    ):
        """Token inválido en ruta con usuario_opcional debe seguir como anónimo."""
        from app.nucleo.servicio_geo import ResultadoGeo

        MockGeo.geocodificar = AsyncMock(return_value=ResultadoGeo(
            latitud=-34.6, longitud=-58.4, direccion_completa="Buenos Aires"
        ))
        MockZona.obtener_zona_horaria = MagicMock(return_value="America/Argentina/Buenos_Aires")

        perfil_mock = MagicMock()
        perfil_mock.id = uuid.uuid4()
        perfil_mock.nombre = "Test"
        perfil_mock.fecha_nacimiento = "1990-01-15"
        perfil_mock.hora_nacimiento = "14:30:00"
        perfil_mock.ciudad_nacimiento = "Buenos Aires"
        perfil_mock.pais_nacimiento = "Argentina"
        perfil_mock.latitud = -34.6
        perfil_mock.longitud = -58.4
        perfil_mock.zona_horaria = "America/Argentina/Buenos_Aires"
        MockRepoPerfil.return_value.crear = AsyncMock(return_value=perfil_mock)

        resp = await cliente.post(
            "/api/v1/profile",
            json={
                "nombre": "Test",
                "fecha_nacimiento": "1990-01-15",
                "hora_nacimiento": "14:30",
                "ciudad_nacimiento": "Buenos Aires",
                "pais_nacimiento": "Argentina",
            },
            headers={"Authorization": "Bearer token_basura"},
        )

        assert resp.status_code == 200
        call_kwargs = MockRepoPerfil.return_value.crear.call_args
        assert call_kwargs.kwargs.get("usuario_id") is None


# ── Gap #9: Google OAuth endpoints ──────────────────────────────


class TestGoogleOAuth:
    """Tests de endpoints Google OAuth."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.ServicioGoogleOAuth")
    async def test_google_url_retorna_url(self, MockOAuth, cliente):
        """GET /auth/google/url debe retornar una URL."""
        MockOAuth.obtener_url_autorizacion = MagicMock(
            return_value="https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx"
        )

        resp = await cliente.get("/api/v1/auth/google/url")

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert "url" in cuerpo["datos"]
        assert cuerpo["datos"]["url"].startswith("https://accounts.google.com")

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.rutas.v1.auth.ServicioGoogleOAuth")
    async def test_google_callback_usuario_nuevo(
        self, MockOAuth, MockRepo, cliente
    ):
        """Callback de Google debe crear usuario nuevo si no existe."""
        uid = uuid.uuid4()
        MockOAuth.obtener_datos_usuario = AsyncMock(return_value={
            "google_id": "google_123",
            "email": "nuevo@gmail.com",
            "nombre": "Usuario Google",
            "verificado": True,
        })

        usuario_nuevo = _crear_usuario_mock(
            uid=uid, email="nuevo@gmail.com", nombre="Usuario Google",
            proveedor_auth="google",
        )

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_google_id = AsyncMock(return_value=None)
        repo_instance.obtener_por_email = AsyncMock(return_value=None)
        repo_instance.crear = AsyncMock(return_value=usuario_nuevo)
        repo_instance.actualizar_ultimo_acceso = AsyncMock()

        resp = await cliente.get("/api/v1/auth/google/callback?code=auth_code_123")

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert "token_acceso" in cuerpo["datos"]
        assert cuerpo["datos"]["usuario"]["email"] == "nuevo@gmail.com"

        # Verificar que se creó con proveedor_auth="google"
        repo_instance.crear.assert_called_once()
        call_kwargs = repo_instance.crear.call_args
        assert call_kwargs.kwargs["proveedor_auth"] == "google"
        assert call_kwargs.kwargs["google_id"] == "google_123"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.rutas.v1.auth.ServicioGoogleOAuth")
    async def test_google_callback_usuario_existente(
        self, MockOAuth, MockRepo, cliente
    ):
        """Callback de Google debe autenticar usuario existente por google_id."""
        uid = uuid.uuid4()
        MockOAuth.obtener_datos_usuario = AsyncMock(return_value={
            "google_id": "google_456",
            "email": "existente@gmail.com",
            "nombre": "Existente",
            "verificado": True,
        })

        usuario_existente = _crear_usuario_mock(
            uid=uid, email="existente@gmail.com", proveedor_auth="google",
        )

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_google_id = AsyncMock(return_value=usuario_existente)
        repo_instance.actualizar_ultimo_acceso = AsyncMock()

        resp = await cliente.get("/api/v1/auth/google/callback?code=auth_code_456")

        assert resp.status_code == 200
        # No debe crear usuario nuevo
        repo_instance.crear.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.rutas.v1.auth.ServicioGoogleOAuth")
    async def test_google_callback_email_ya_registrado_local(
        self, MockOAuth, MockRepo, cliente
    ):
        """Callback de Google debe rechazar si email ya existe como local."""
        MockOAuth.obtener_datos_usuario = AsyncMock(return_value={
            "google_id": "google_789",
            "email": "local@test.com",
            "nombre": "Local",
            "verificado": True,
        })

        usuario_local = _crear_usuario_mock(
            email="local@test.com", proveedor_auth="local",
        )

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_google_id = AsyncMock(return_value=None)
        repo_instance.obtener_por_email = AsyncMock(return_value=usuario_local)

        resp = await cliente.get("/api/v1/auth/google/callback?code=auth_code_789")

        assert resp.status_code == 409

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.rutas.v1.auth.ServicioGoogleOAuth")
    async def test_google_callback_usuario_desactivado(
        self, MockOAuth, MockRepo, cliente
    ):
        """Callback de Google debe rechazar si usuario google está desactivado."""
        MockOAuth.obtener_datos_usuario = AsyncMock(return_value={
            "google_id": "google_inactivo",
            "email": "inactivo@gmail.com",
            "nombre": "Inactivo",
            "verificado": True,
        })

        usuario_inactivo = _crear_usuario_mock(
            email="inactivo@gmail.com", activo=False, proveedor_auth="google",
        )

        repo_instance = MockRepo.return_value
        repo_instance.obtener_por_google_id = AsyncMock(return_value=usuario_inactivo)

        resp = await cliente.get("/api/v1/auth/google/callback?code=auth_code_inactivo")

        assert resp.status_code == 401


# ── Gap #10: revocar_token con token inválido ───────────────────


class TestRevocarTokenInvalido:
    """Tests de revocar_token con edge cases."""

    @pytest.mark.asyncio
    async def test_revocar_token_invalido_no_lanza_error(self, redis_falso):
        """revocar_token con token basura no debe lanzar excepción."""
        # No debe lanzar excepción
        await ServicioAuth.revocar_token(redis_falso, "basura.total.invalido")

        # Redis no debe tener nada
        assert len(redis_falso._almacen) == 0

    @pytest.mark.asyncio
    async def test_revocar_token_valido_agrega_a_blacklist(self, redis_falso):
        """revocar_token con token válido debe agregarlo a la blacklist."""
        uid = uuid.uuid4()
        token = ServicioAuth.crear_token_refresco(uid)

        await ServicioAuth.revocar_token(redis_falso, token)

        payload = ServicioAuth.decodificar_token(token)
        jti = payload["jti"]
        assert f"blacklist:{jti}" in redis_falso._almacen

    @pytest.mark.asyncio
    async def test_token_revocado_retorna_true(self, redis_falso):
        """token_revocado debe retornar True si el jti está en blacklist."""
        jti = str(uuid.uuid4())
        redis_falso._almacen[f"blacklist:{jti}"] = "1"

        resultado = await ServicioAuth.token_revocado(redis_falso, jti)
        assert resultado is True

    @pytest.mark.asyncio
    async def test_token_no_revocado_retorna_false(self, redis_falso):
        """token_revocado debe retornar False si el jti no está."""
        jti = str(uuid.uuid4())

        resultado = await ServicioAuth.token_revocado(redis_falso, jti)
        assert resultado is False


# ── Gap #11: Access token revocado rechazado en /me ─────────────


class TestAccessTokenRevocado:
    """Tests de acceso con token de acceso en blacklist."""

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_me_con_access_token_revocado(
        self, MockRepo, cliente, redis_falso
    ):
        """GET /me debe rechazar un access token que fue revocado."""
        uid = uuid.uuid4()
        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        # Meter el jti del access token en blacklist
        payload = ServicioAuth.decodificar_token(token)
        jti = payload["jti"]
        redis_falso._almacen[f"blacklist:{jti}"] = "1"

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 401
        assert "revocado" in resp.json()["detalle"].lower()


# ── Gap #12: Dependencia obtener_usuario_actual — branches ──────


class TestObtenerUsuarioActualBranches:
    """Tests de branches específicos de obtener_usuario_actual."""

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_me_usuario_no_encontrado_en_db(
        self, MockRepo, cliente, redis_falso
    ):
        """Debe retornar 401 si el usuario del token ya no existe en DB."""
        uid = uuid.uuid4()
        MockRepo.return_value.obtener_por_id = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "borrado@test.com")

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 401

    @pytest.mark.asyncio
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_me_usuario_desactivado(
        self, MockRepo, cliente, redis_falso
    ):
        """Debe retornar 401 si el usuario tiene activo=False."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, activo=False)
        MockRepo.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        token = ServicioAuth.crear_token_acceso(uid, "inactivo@test.com")

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_me_con_token_refresco_rechazado(self, cliente):
        """Debe rechazar si se usa un token de refresco en lugar de acceso."""
        uid = uuid.uuid4()
        token_refresco = ServicioAuth.crear_token_refresco(uid)

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token_refresco}"},
        )

        assert resp.status_code == 401


# ── Gap #13: Validaciones de esquemas ───────────────────────────


class TestValidacionesEsquemas:
    """Tests de validación Pydantic en los schemas de auth."""

    @pytest.mark.asyncio
    async def test_registrar_email_invalido(self, cliente):
        """Debe rechazar email con formato inválido."""
        resp = await cliente.post(
            "/api/v1/auth/registrar",
            json={
                "email": "no-es-email",
                "nombre": "Test",
                "contrasena": "segura12345",
            },
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_registrar_nombre_vacio(self, cliente):
        """Debe rechazar nombre vacío."""
        resp = await cliente.post(
            "/api/v1/auth/registrar",
            json={
                "email": "test@test.com",
                "nombre": "",
                "contrasena": "segura12345",
            },
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_registrar_contrasena_128_max(self, cliente):
        """Debe rechazar contraseña mayor a 128 caracteres."""
        resp = await cliente.post(
            "/api/v1/auth/registrar",
            json={
                "email": "test@test.com",
                "nombre": "Test",
                "contrasena": "a" * 129,
            },
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_login_sin_campos(self, cliente):
        """Debe rechazar login sin campos obligatorios."""
        resp = await cliente.post("/api/v1/auth/login", json={})
        assert resp.status_code == 422


# ── Plan gratis automático al registrar ──────────────────────


class TestPlanGratisAutoRegistro:
    """Tests de asignación automática de plan gratis al registrar."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.obtener_configuracion")
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    async def test_registrar_crea_suscripcion_gratis(
        self, MockRepoUsuario, MockRepoPlan, MockRepoSus, MockConfig, cliente
    ):
        """Al registrar, debe crear suscripción al plan gratis."""
        config_mock = MagicMock()
        config_mock.verificacion_email_habilitada = False
        config_mock.asignar_premium_por_defecto = False
        MockConfig.return_value = config_mock
        uid = uuid.uuid4()
        usuario_mock = _crear_usuario_mock(
            uid=uid, email="nuevo@test.com", nombre="Nuevo",
            hash_contrasena=ServicioAuth.hashear_contrasena("segura12345"),
        )

        MockRepoUsuario.return_value.obtener_por_email = AsyncMock(return_value=None)
        MockRepoUsuario.return_value.crear = AsyncMock(return_value=usuario_mock)
        MockRepoUsuario.return_value.marcar_verificado = AsyncMock()

        plan_gratis = MagicMock()
        plan_gratis.id = uuid.uuid4()
        plan_gratis.slug = "gratis"
        MockRepoPlan.return_value.obtener_por_slug = AsyncMock(return_value=plan_gratis)

        suscripcion_mock = MagicMock()
        suscripcion_mock.id = uuid.uuid4()
        MockRepoSus.return_value.crear = AsyncMock(return_value=suscripcion_mock)

        resp = await cliente.post(
            "/api/v1/auth/registrar",
            json={
                "email": "nuevo@test.com",
                "nombre": "Nuevo",
                "contrasena": "segura12345",
            },
        )

        assert resp.status_code == 200
        # Debe haber buscado el plan gratis
        MockRepoPlan.return_value.obtener_por_slug.assert_called_once_with("gratis")
        # Debe haber creado la suscripción
        MockRepoSus.return_value.crear.assert_called_once()
        call_kwargs = MockRepoSus.return_value.crear.call_args.kwargs
        assert call_kwargs["usuario_id"] == uid
        assert call_kwargs["plan_id"] == plan_gratis.id
        assert call_kwargs["estado"] == "activa"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.rutas.v1.auth.ServicioGoogleOAuth")
    async def test_google_callback_nuevo_crea_suscripcion_gratis(
        self, MockOAuth, MockRepoUsuario, MockRepoPlan, MockRepoSus, cliente
    ):
        """Al registrar vía Google, debe crear suscripción al plan gratis."""
        uid = uuid.uuid4()
        MockOAuth.obtener_datos_usuario = AsyncMock(return_value={
            "google_id": "google_plan_test",
            "email": "google_plan@gmail.com",
            "nombre": "Google Plan",
            "verificado": True,
        })

        usuario_nuevo = _crear_usuario_mock(
            uid=uid, email="google_plan@gmail.com", proveedor_auth="google",
        )

        repo_instance = MockRepoUsuario.return_value
        repo_instance.obtener_por_google_id = AsyncMock(return_value=None)
        repo_instance.obtener_por_email = AsyncMock(return_value=None)
        repo_instance.crear = AsyncMock(return_value=usuario_nuevo)
        repo_instance.actualizar_ultimo_acceso = AsyncMock()

        plan_gratis = MagicMock()
        plan_gratis.id = uuid.uuid4()
        plan_gratis.slug = "gratis"
        MockRepoPlan.return_value.obtener_por_slug = AsyncMock(return_value=plan_gratis)
        MockRepoSus.return_value.crear = AsyncMock(return_value=MagicMock())

        resp = await cliente.get("/api/v1/auth/google/callback?code=code_plan_test")

        assert resp.status_code == 200
        MockRepoPlan.return_value.obtener_por_slug.assert_called_once_with("gratis")
        MockRepoSus.return_value.crear.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.rutas.v1.auth.ServicioGoogleOAuth")
    async def test_google_callback_existente_no_crea_suscripcion(
        self, MockOAuth, MockRepoUsuario, MockRepoPlan, MockRepoSus, cliente
    ):
        """Al autenticar usuario Google existente, NO debe crear suscripción."""
        uid = uuid.uuid4()
        MockOAuth.obtener_datos_usuario = AsyncMock(return_value={
            "google_id": "google_existing",
            "email": "existing@gmail.com",
            "nombre": "Existing",
            "verificado": True,
        })

        usuario_existente = _crear_usuario_mock(
            uid=uid, email="existing@gmail.com", proveedor_auth="google",
        )

        repo_instance = MockRepoUsuario.return_value
        repo_instance.obtener_por_google_id = AsyncMock(return_value=usuario_existente)
        repo_instance.actualizar_ultimo_acceso = AsyncMock()

        resp = await cliente.get("/api/v1/auth/google/callback?code=code_existing")

        assert resp.status_code == 200
        # NO debe crear suscripción (usuario ya existe)
        MockRepoSus.return_value.crear.assert_not_called()


# ── Plan del usuario en /me ──────────────────────────────────


class TestMeConPlan:
    """Tests de GET /auth/me incluyendo datos del plan."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_me_retorna_plan_activo(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, cliente, redis_falso
    ):
        """GET /me debe incluir plan_slug y plan_nombre del usuario."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, email="plan@test.com", nombre="Plan")

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan_mock = MagicMock()
        plan_mock.id = uuid.uuid4()
        plan_mock.slug = "premium"
        plan_mock.nombre = "Premium"

        sus_mock = MagicMock()
        sus_mock.plan_id = plan_mock.id
        sus_mock.estado = "activa"

        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus_mock)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_mock)

        token = ServicioAuth.crear_token_acceso(uid, "plan@test.com")

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["plan_slug"] == "premium"
        assert datos["plan_nombre"] == "Premium"
        assert datos["suscripcion_estado"] == "activa"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_me_sin_suscripcion_retorna_null(
        self, MockRepoAuth, MockRepoSus, cliente, redis_falso
    ):
        """GET /me sin suscripción debe retornar plan_slug=null."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, email="noplan@test.com")

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "noplan@test.com")

        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["plan_slug"] is None
        assert datos["plan_nombre"] is None
        assert datos["suscripcion_estado"] is None


class TestMeBootstrapPodcast:
    """GET /auth/me debe encolar el bootstrap del podcast del día cuando corresponda."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.bootstrap_dia_podcast")
    @patch("app.rutas.v1.auth.RepositorioPerfil")
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_primer_acceso_del_dia_premium_con_perfil_encola_bootstrap(
        self,
        MockRepoAuth,
        MockRepoUsuarioActualizar,
        MockRepoSus,
        MockRepoPlan,
        MockRepoPerfil,
        mock_bootstrap,
        cliente,
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, email="premium@test.com")
        usuario.ultimo_acceso = datetime.now(timezone.utc) - timedelta(days=2)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan_mock = MagicMock()
        plan_mock.id = uuid.uuid4()
        plan_mock.slug = "premium"
        plan_mock.nombre = "Premium"
        sus_mock = MagicMock()
        sus_mock.plan_id = plan_mock.id
        sus_mock.estado = "activa"
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus_mock)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_mock)

        perfil_mock = MagicMock()
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(
            return_value=perfil_mock
        )
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, "premium@test.com")
        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        # BackgroundTasks ejecuta el task después de la respuesta.
        # Si está mockeado, la llamada es sincrónica vía add_task → await.
        # Validamos que la función fue registrada al menos una vez con el uid.
        assert mock_bootstrap.called or mock_bootstrap.await_count > 0
        argumentos_usados = (
            mock_bootstrap.call_args
            or (mock_bootstrap.await_args if hasattr(mock_bootstrap, "await_args") else None)
        )
        assert argumentos_usados is not None
        assert argumentos_usados.args[0] == uid
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso.assert_awaited_once_with(
            uid
        )

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.bootstrap_dia_podcast")
    @patch("app.rutas.v1.auth.RepositorioPerfil")
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_mismo_dia_no_encola_bootstrap(
        self,
        MockRepoAuth,
        MockRepoUsuarioActualizar,
        MockRepoSus,
        MockRepoPlan,
        MockRepoPerfil,
        mock_bootstrap,
        cliente,
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, email="repetido@test.com")
        # Último acceso hace 5 minutos → mismo día ARG
        usuario.ultimo_acceso = datetime.now(timezone.utc) - timedelta(minutes=5)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan_mock = MagicMock()
        plan_mock.id = uuid.uuid4()
        plan_mock.slug = "premium"
        plan_mock.nombre = "Premium"
        sus_mock = MagicMock()
        sus_mock.plan_id = plan_mock.id
        sus_mock.estado = "activa"
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus_mock)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_mock)

        perfil_mock = MagicMock()
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(
            return_value=perfil_mock
        )
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, "repetido@test.com")
        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        mock_bootstrap.assert_not_called()
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.bootstrap_dia_podcast")
    @patch("app.rutas.v1.auth.RepositorioPerfil")
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_plan_gratis_no_encola_bootstrap(
        self,
        MockRepoAuth,
        MockRepoUsuarioActualizar,
        MockRepoSus,
        MockRepoPlan,
        MockRepoPerfil,
        mock_bootstrap,
        cliente,
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, email="free@test.com")
        usuario.ultimo_acceso = None  # primer login absoluto
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan_mock = MagicMock()
        plan_mock.id = uuid.uuid4()
        plan_mock.slug = "gratis"
        plan_mock.nombre = "Gratis"
        sus_mock = MagicMock()
        sus_mock.plan_id = plan_mock.id
        sus_mock.estado = "activa"
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus_mock)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_mock)

        perfil_mock = MagicMock()
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(
            return_value=perfil_mock
        )
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, "free@test.com")
        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        mock_bootstrap.assert_not_called()
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.auth.bootstrap_dia_podcast")
    @patch("app.rutas.v1.auth.RepositorioPerfil")
    @patch("app.rutas.v1.auth.RepositorioPlan")
    @patch("app.rutas.v1.auth.RepositorioSuscripcion")
    @patch("app.rutas.v1.auth.RepositorioUsuario")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sin_perfil_no_encola_bootstrap(
        self,
        MockRepoAuth,
        MockRepoUsuarioActualizar,
        MockRepoSus,
        MockRepoPlan,
        MockRepoPerfil,
        mock_bootstrap,
        cliente,
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid, email="nuevo@test.com")
        usuario.ultimo_acceso = None
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan_mock = MagicMock()
        plan_mock.id = uuid.uuid4()
        plan_mock.slug = "premium"
        plan_mock.nombre = "Premium"
        sus_mock = MagicMock()
        sus_mock.plan_id = plan_mock.id
        sus_mock.estado = "activa"
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus_mock)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_mock)

        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=None)
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, "nuevo@test.com")
        resp = await cliente.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        mock_bootstrap.assert_not_called()
        MockRepoUsuarioActualizar.return_value.actualizar_ultimo_acceso.assert_not_called()
