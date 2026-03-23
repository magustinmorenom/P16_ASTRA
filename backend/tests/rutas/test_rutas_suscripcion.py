"""Tests para las rutas de suscripción y pagos."""

import hashlib
import hmac
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.modelos.config_pais_mp import ConfigPaisMp
from app.modelos.factura import Factura
from app.modelos.pago import Pago
from app.modelos.plan import Plan
from app.modelos.precio_plan import PrecioPlan
from app.modelos.suscripcion import Suscripcion
from app.modelos.usuario import Usuario
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)
from app.servicios.servicio_auth import ServicioAuth
from app.servicios.servicio_mercadopago import ServicioMercadoPago


# ── Helpers ────────────────────────────────────────────────────


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


def _crear_plan_mock(
    uid=None, nombre="Premium", slug="premium",
    precio_usd=900, activo=True, features=None,
):
    plan = MagicMock(spec=Plan)
    plan.id = uid or uuid.uuid4()
    plan.nombre = nombre
    plan.slug = slug
    plan.descripcion = f"Plan {nombre}"
    plan.precio_usd_centavos = precio_usd
    plan.intervalo = "months"
    plan.limite_perfiles = -1
    plan.limite_calculos_dia = -1
    plan.features = features or ["natal", "diseno_humano"]
    plan.activo = activo
    plan.orden = 1
    return plan


def _crear_precio_mock(plan_id=None, pais="AR", moneda="ARS", precio=1080000):
    precio_mock = MagicMock(spec=PrecioPlan)
    precio_mock.id = uuid.uuid4()
    precio_mock.plan_id = plan_id or uuid.uuid4()
    precio_mock.pais_codigo = pais
    precio_mock.moneda = moneda
    precio_mock.precio_local = precio
    precio_mock.intervalo = "months"
    precio_mock.frecuencia = 1
    precio_mock.activo = True
    return precio_mock


def _crear_config_pais_mock(pais="AR", moneda="ARS"):
    config = MagicMock(spec=ConfigPaisMp)
    config.id = uuid.uuid4()
    config.pais_codigo = pais
    config.pais_nombre = "Argentina"
    config.moneda = moneda
    config.tipo_cambio_usd = 1200.0
    config.mp_access_token = "TEST-token-ar"
    config.mp_public_key = "TEST-public-ar"
    config.mp_webhook_secret = None
    config.activo = True
    return config


def _crear_suscripcion_mock(
    uid=None, usuario_id=None, plan_id=None,
    estado="activa", pais="AR", mp_preapproval_id=None,
):
    sus = MagicMock(spec=Suscripcion)
    sus.id = uid or uuid.uuid4()
    sus.usuario_id = usuario_id or uuid.uuid4()
    sus.plan_id = plan_id or uuid.uuid4()
    sus.pais_codigo = pais
    sus.estado = estado
    sus.mp_preapproval_id = mp_preapproval_id
    sus.fecha_inicio = datetime.now(timezone.utc) if estado == "activa" else None
    sus.fecha_fin = None
    sus.creado_en = datetime.now(timezone.utc)
    sus.precio_plan_id = None
    sus.referencia_externa = None
    sus.datos_mp = None
    return sus


def _crear_pago_mock(uid=None, estado="aprobado", monto=1080000, moneda="ARS"):
    pago = MagicMock(spec=Pago)
    pago.id = uid or uuid.uuid4()
    pago.estado = estado
    pago.monto_centavos = monto
    pago.moneda = moneda
    pago.metodo_pago = "credit_card"
    pago.detalle_estado = "accredited"
    pago.fecha_pago = datetime.now(timezone.utc)
    pago.creado_en = datetime.now(timezone.utc)
    return pago


# ── Fixtures ───────────────────────────────────────────────────


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


# ── Tests: GET /suscripcion/planes ─────────────────────────────


class TestListarPlanes:
    """Tests de GET /suscripcion/planes."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    async def test_listar_planes_exitoso(self, MockRepo, cliente):
        """Debe listar los planes activos con precios."""
        plan_gratis = _crear_plan_mock(
            nombre="Gratis", slug="gratis", precio_usd=0
        )
        plan_premium = _crear_plan_mock()
        precio_ar = _crear_precio_mock(plan_id=plan_premium.id)

        repo = MockRepo.return_value
        repo.listar_activos = AsyncMock(return_value=[plan_gratis, plan_premium])
        repo.obtener_precios_por_plan = AsyncMock(
            side_effect=lambda pid, pais=None: [precio_ar] if pid == plan_premium.id else []
        )

        resp = await cliente.get("/api/v1/suscripcion/planes?pais_codigo=AR")

        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert len(cuerpo["datos"]) == 2

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    async def test_listar_planes_sin_pais_usa_ar(self, MockRepo, cliente):
        """Sin pais_codigo, debe usar AR por defecto."""
        repo = MockRepo.return_value
        repo.listar_activos = AsyncMock(return_value=[])
        repo.obtener_precios_por_plan = AsyncMock(return_value=[])

        resp = await cliente.get("/api/v1/suscripcion/planes")

        assert resp.status_code == 200

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    async def test_listar_planes_pais_br(self, MockRepo, cliente):
        """Debe aceptar país BR."""
        plan = _crear_plan_mock()
        precio_br = _crear_precio_mock(plan_id=plan.id, pais="BR", moneda="BRL", precio=4950)

        repo = MockRepo.return_value
        repo.listar_activos = AsyncMock(return_value=[plan])
        repo.obtener_precios_por_plan = AsyncMock(return_value=[precio_br])

        resp = await cliente.get("/api/v1/suscripcion/planes?pais_codigo=BR")

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos[0]["moneda_local"] == "BRL"
        assert datos[0]["precio_local"] == 4950

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    async def test_listar_planes_sin_precio_local(self, MockRepo, cliente):
        """Plan sin precio local para el país debe tener precio_local=null."""
        plan = _crear_plan_mock()
        repo = MockRepo.return_value
        repo.listar_activos = AsyncMock(return_value=[plan])
        repo.obtener_precios_por_plan = AsyncMock(return_value=[])

        resp = await cliente.get("/api/v1/suscripcion/planes?pais_codigo=MX")

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos[0]["precio_local"] is None
        assert datos[0]["moneda_local"] is None


# ── Tests: GET /suscripcion/mi-suscripcion ─────────────────────


class TestMiSuscripcion:
    """Tests de GET /suscripcion/mi-suscripcion."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_mi_suscripcion_activa(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, cliente, redis_falso
    ):
        """Debe retornar la suscripción activa del usuario."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock()
        suscripcion = _crear_suscripcion_mock(usuario_id=uid, plan_id=plan.id)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=suscripcion)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/suscripcion/mi-suscripcion",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["estado"] == "activa"
        assert datos["plan_nombre"] == "Premium"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_mi_suscripcion_sin_suscripcion(
        self, MockRepoAuth, MockRepoSus, cliente, redis_falso
    ):
        """Sin suscripción activa, debe retornar datos=null."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/suscripcion/mi-suscripcion",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"] is None

    @pytest.mark.asyncio
    async def test_mi_suscripcion_sin_token(self, cliente):
        """Debe retornar 401 sin token."""
        resp = await cliente.get("/api/v1/suscripcion/mi-suscripcion")
        assert resp.status_code == 401


# ── Tests: POST /suscripcion/suscribirse ───────────────────────


class TestSuscribirse:
    """Tests de POST /suscripcion/suscribirse."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_exitoso(
        self, MockRepoAuth, MockRepoPlan, MockRepoSus, MockMP, cliente, redis_falso
    ):
        """Debe crear preapproval y retornar init_point."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock()
        precio = _crear_precio_mock(plan_id=plan.id)
        config_pais = _crear_config_pais_mock()

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)
        MockRepoPlan.return_value.obtener_precio = AsyncMock(return_value=precio)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.cancelar_pendientes_usuario = AsyncMock()

        suscripcion_creada = _crear_suscripcion_mock(
            usuario_id=uid, plan_id=plan.id, estado="pendiente"
        )
        MockRepoSus.return_value.crear = AsyncMock(return_value=suscripcion_creada)

        MockMP.crear_preapproval = AsyncMock(return_value={
            "id": "mp_preapproval_123",
            "init_point": "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=123",
            "status": "pending",
        })

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan.id), "pais_codigo": "AR"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert "init_point" in datos
        assert datos["mp_preapproval_id"] == "mp_preapproval_123"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_plan_no_encontrado(
        self, MockRepoAuth, MockRepoPlan, cliente, redis_falso
    ):
        """Debe retornar 404 si el plan no existe."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(uuid.uuid4()), "pais_codigo": "AR"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 404

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_plan_inactivo(
        self, MockRepoAuth, MockRepoPlan, cliente, redis_falso
    ):
        """Debe retornar 404 si el plan existe pero está inactivo."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan_inactivo = _crear_plan_mock(activo=False)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_inactivo)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan_inactivo.id), "pais_codigo": "AR"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 404

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_plan_gratis_rechazado(
        self, MockRepoAuth, MockRepoPlan, cliente, redis_falso
    ):
        """No debe permitir suscribirse al plan gratis vía checkout."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan_gratis = _crear_plan_mock(nombre="Gratis", slug="gratis", precio_usd=0)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan_gratis)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan_gratis.id), "pais_codigo": "AR"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 502

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_sin_precio_pais(
        self, MockRepoAuth, MockRepoPlan, MockRepoSus, cliente, redis_falso
    ):
        """Debe retornar 404 si no hay precio para el país."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock()

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)
        MockRepoPlan.return_value.obtener_precio = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan.id), "pais_codigo": "MX"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 404

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_sin_config_pais(
        self, MockRepoAuth, MockRepoPlan, MockRepoSus, cliente, redis_falso
    ):
        """Debe retornar 502 si no hay config MP para el país."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock()
        precio = _crear_precio_mock(plan_id=plan.id)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)
        MockRepoPlan.return_value.obtener_precio = AsyncMock(return_value=precio)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan.id), "pais_codigo": "AR"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 502

    @pytest.mark.asyncio
    async def test_suscribirse_sin_token(self, cliente):
        """Debe retornar 401 sin autenticación."""
        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(uuid.uuid4()), "pais_codigo": "AR"},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_suscribirse_pais_invalido(self, cliente, redis_falso):
        """Debe retornar 422 con país no válido."""
        uid = uuid.uuid4()
        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        # Patcheamos auth para que no falle allí
        with patch("app.dependencias_auth.RepositorioUsuario") as MockRepoAuth:
            usuario = _crear_usuario_mock(uid=uid)
            MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

            resp = await cliente.post(
                "/api/v1/suscripcion/suscribirse",
                json={"plan_id": str(uuid.uuid4()), "pais_codigo": "ZZ"},
                headers={"Authorization": f"Bearer {token}"},
            )

            assert resp.status_code == 422


# ── Tests: POST /suscripcion/cancelar ──────────────────────────


class TestCancelar:
    """Tests de POST /suscripcion/cancelar."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cancelar_exitoso(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, MockMP,
        cliente, redis_falso
    ):
        """Debe cancelar la suscripción y crear plan gratis."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan_gratis = _crear_plan_mock(nombre="Gratis", slug="gratis", precio_usd=0)

        suscripcion = _crear_suscripcion_mock(
            usuario_id=uid, mp_preapproval_id="mp_123"
        )
        config_pais = _crear_config_pais_mock()

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=suscripcion)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.crear = AsyncMock(
            return_value=_crear_suscripcion_mock(plan_id=plan_gratis.id)
        )
        MockRepoPlan.return_value.obtener_por_slug = AsyncMock(return_value=plan_gratis)
        MockMP.cancelar_preapproval = AsyncMock(return_value={"status": "cancelled"})

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/cancelar",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["exito"] is True

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cancelar_sin_suscripcion(
        self, MockRepoAuth, MockRepoSus, cliente, redis_falso
    ):
        """Debe retornar 404 si no hay suscripción activa."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/cancelar",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 404

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cancelar_fallo_mp_continua(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, MockMP,
        cliente, redis_falso
    ):
        """Si MP falla, debe cancelar localmente de todos modos."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan_gratis = _crear_plan_mock(nombre="Gratis", slug="gratis", precio_usd=0)
        suscripcion = _crear_suscripcion_mock(
            usuario_id=uid, mp_preapproval_id="mp_456"
        )
        config_pais = _crear_config_pais_mock()

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=suscripcion)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.crear = AsyncMock(
            return_value=_crear_suscripcion_mock(plan_id=plan_gratis.id)
        )
        MockRepoPlan.return_value.obtener_por_slug = AsyncMock(return_value=plan_gratis)

        from app.excepciones import ErrorPasarelaPago
        MockMP.cancelar_preapproval = AsyncMock(
            side_effect=ErrorPasarelaPago("Error MP")
        )

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/cancelar",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Debe ser exitoso a pesar del fallo de MP
        assert resp.status_code == 200

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cancelar_sin_preapproval_no_llama_mp(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, cliente, redis_falso
    ):
        """Suscripción local sin preapproval no debe llamar a MP."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan_gratis = _crear_plan_mock(nombre="Gratis", slug="gratis", precio_usd=0)

        # Suscripción sin mp_preapproval_id (plan gratis local)
        suscripcion = _crear_suscripcion_mock(
            usuario_id=uid, mp_preapproval_id=None
        )

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=suscripcion)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.crear = AsyncMock(
            return_value=_crear_suscripcion_mock(plan_id=plan_gratis.id)
        )
        MockRepoPlan.return_value.obtener_por_slug = AsyncMock(return_value=plan_gratis)

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        with patch("app.rutas.v1.suscripcion.ServicioMercadoPago") as MockMP:
            resp = await cliente.post(
                "/api/v1/suscripcion/cancelar",
                headers={"Authorization": f"Bearer {token}"},
            )

            # No debe haber llamado a cancelar_preapproval
            MockMP.cancelar_preapproval.assert_not_called()

        assert resp.status_code == 200
        assert resp.json()["exito"] is True

    @pytest.mark.asyncio
    async def test_cancelar_sin_token(self, cliente):
        """Debe retornar 401 sin autenticación."""
        resp = await cliente.post("/api/v1/suscripcion/cancelar")
        assert resp.status_code == 401


# ── Tests: POST /suscripcion/webhook ───────────────────────────


class TestWebhook:
    """Tests de POST /suscripcion/webhook."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_preapproval_autorizado(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, cliente
    ):
        """Debe procesar webhook de preapproval autorizado."""
        plan_gratis = _crear_plan_mock(nombre="Gratis", slug="gratis")
        suscripcion = _crear_suscripcion_mock(mp_preapproval_id="preapp_001")
        config_pais = _crear_config_pais_mock()

        MockRepoSus.return_value.evento_ya_procesado = AsyncMock(return_value=False)
        MockRepoSus.return_value.registrar_evento = AsyncMock()
        MockRepoSus.return_value.obtener_por_preapproval_id = AsyncMock(return_value=suscripcion)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.crear = AsyncMock()
        MockRepoPlan.return_value.obtener_por_slug = AsyncMock(return_value=plan_gratis)

        with patch.object(
            ServicioMercadoPago, "obtener_preapproval",
            new_callable=AsyncMock,
            return_value={"status": "authorized", "id": "preapp_001"},
        ):
            resp = await cliente.post(
                "/api/v1/suscripcion/webhook",
                json={
                    "id": "evt_001",
                    "type": "subscription_preapproval",
                    "action": "updated",
                    "data": {"id": "preapp_001"},
                },
            )

        assert resp.status_code == 200
        assert resp.json()["exito"] is True

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_evento_duplicado(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, cliente
    ):
        """Evento duplicado debe ser ignorado (idempotencia)."""
        MockRepoSus.return_value.evento_ya_procesado = AsyncMock(return_value=True)

        resp = await cliente.post(
            "/api/v1/suscripcion/webhook",
            json={
                "id": "evt_dup",
                "type": "subscription_preapproval",
                "data": {"id": "preapp_dup"},
            },
        )

        assert resp.status_code == 200
        assert "ya procesado" in resp.json()["mensaje"]

    @pytest.mark.asyncio
    async def test_webhook_cuerpo_invalido(self, cliente):
        """Body inválido debe retornar 200 igualmente."""
        resp = await cliente.post(
            "/api/v1/suscripcion/webhook",
            content=b"no-json",
            headers={"Content-Type": "application/json"},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_sin_id_evento(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, cliente
    ):
        """Sin ID de evento debe retornar 200."""
        resp = await cliente.post(
            "/api/v1/suscripcion/webhook",
            json={"type": "payment", "data": {"id": "123"}},
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_pago(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, cliente
    ):
        """Debe procesar webhook de pago."""
        config_pais = _crear_config_pais_mock()
        suscripcion = _crear_suscripcion_mock(mp_preapproval_id="preapp_pago")

        MockRepoSus.return_value.evento_ya_procesado = AsyncMock(return_value=False)
        MockRepoSus.return_value.registrar_evento = AsyncMock()
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.obtener_por_preapproval_id = AsyncMock(return_value=suscripcion)
        MockRepoPago.return_value.obtener_por_mp_pago_id = AsyncMock(return_value=None)
        MockRepoPago.return_value.crear = AsyncMock(return_value=_crear_pago_mock())

        with patch.object(
            ServicioMercadoPago, "obtener_pago",
            new_callable=AsyncMock,
            return_value={
                "status": "approved",
                "transaction_amount": 10800.0,
                "currency_id": "ARS",
                "payment_method_id": "credit_card",
                "status_detail": "accredited",
                "external_reference": "cosmic_ref",
                "preapproval_id": "preapp_pago",
            },
        ):
            resp = await cliente.post(
                "/api/v1/suscripcion/webhook",
                json={
                    "id": "evt_pago_001",
                    "type": "payment",
                    "action": "payment.created",
                    "data": {"id": "pay_001"},
                },
            )

        assert resp.status_code == 200

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_preapproval_cancelado_degrada_gratis(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, cliente
    ):
        """Preapproval cancelado debe degradar a plan gratis."""
        plan_gratis = _crear_plan_mock(nombre="Gratis", slug="gratis", precio_usd=0)
        suscripcion = _crear_suscripcion_mock(mp_preapproval_id="preapp_cancel")
        config_pais = _crear_config_pais_mock()

        MockRepoSus.return_value.evento_ya_procesado = AsyncMock(return_value=False)
        MockRepoSus.return_value.registrar_evento = AsyncMock()
        MockRepoSus.return_value.obtener_por_preapproval_id = AsyncMock(return_value=suscripcion)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.crear = AsyncMock(
            return_value=_crear_suscripcion_mock(plan_id=plan_gratis.id)
        )
        MockRepoPlan.return_value.obtener_por_slug = AsyncMock(return_value=plan_gratis)

        with patch.object(
            ServicioMercadoPago, "obtener_preapproval",
            new_callable=AsyncMock,
            return_value={"status": "cancelled", "id": "preapp_cancel"},
        ):
            resp = await cliente.post(
                "/api/v1/suscripcion/webhook",
                json={
                    "id": "evt_cancel",
                    "type": "subscription_preapproval",
                    "action": "updated",
                    "data": {"id": "preapp_cancel"},
                },
            )

        assert resp.status_code == 200
        # Debe haber creado suscripción gratis
        MockRepoSus.return_value.crear.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.obtener_configuracion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_firma_invalida_rechazada(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, mock_config, cliente
    ):
        """Con webhook_secret configurado, firma inválida debe ser rechazada."""
        config = MagicMock()
        config.mp_webhook_secret = "mi_secreto_real"
        mock_config.return_value = config

        resp = await cliente.post(
            "/api/v1/suscripcion/webhook",
            json={
                "id": "evt_firma",
                "type": "payment",
                "data": {"id": "123"},
            },
            headers={
                "x-signature": "ts=123,v1=firma_falsa",
                "x-request-id": "req_test",
            },
        )

        assert resp.status_code == 200
        assert "inválida" in resp.json()["mensaje"].lower()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_pago_duplicado_ignorado(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, cliente
    ):
        """Pago ya registrado por mp_pago_id debe ser ignorado."""
        config_pais = _crear_config_pais_mock()
        pago_existente = _crear_pago_mock()

        MockRepoSus.return_value.evento_ya_procesado = AsyncMock(return_value=False)
        MockRepoSus.return_value.registrar_evento = AsyncMock()
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        # El pago ya existe
        MockRepoPago.return_value.obtener_por_mp_pago_id = AsyncMock(return_value=pago_existente)

        with patch.object(
            ServicioMercadoPago, "obtener_pago",
            new_callable=AsyncMock,
            return_value={
                "status": "approved",
                "transaction_amount": 10800.0,
                "currency_id": "ARS",
            },
        ):
            resp = await cliente.post(
                "/api/v1/suscripcion/webhook",
                json={
                    "id": "evt_pago_dup",
                    "type": "payment",
                    "data": {"id": "pay_existente"},
                },
            )

        assert resp.status_code == 200
        # No debe haber creado un pago nuevo
        MockRepoPago.return_value.crear.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_webhook_subscription_authorized_payment(
        self, MockRepoSus, MockRepoPago, MockRepoPlan, MockRepoFactura, cliente
    ):
        """Debe procesar webhook tipo subscription_authorized_payment."""
        config_pais = _crear_config_pais_mock()
        suscripcion = _crear_suscripcion_mock(mp_preapproval_id="preapp_auth_pay")

        MockRepoSus.return_value.evento_ya_procesado = AsyncMock(return_value=False)
        MockRepoSus.return_value.registrar_evento = AsyncMock()
        MockRepoSus.return_value.listar_paises_activos = AsyncMock(return_value=[config_pais])
        MockRepoSus.return_value.obtener_por_preapproval_id = AsyncMock(return_value=suscripcion)
        MockRepoPago.return_value.obtener_por_mp_pago_id = AsyncMock(return_value=None)
        MockRepoPago.return_value.crear = AsyncMock(return_value=_crear_pago_mock())
        MockRepoFactura.return_value.obtener_por_pago_id = AsyncMock(return_value=None)
        MockRepoFactura.return_value.crear = AsyncMock()

        with patch.object(
            ServicioMercadoPago, "obtener_pago",
            new_callable=AsyncMock,
            return_value={
                "status": "approved",
                "transaction_amount": 10800.0,
                "currency_id": "ARS",
                "payment_method_id": "debit_card",
                "status_detail": "accredited",
                "external_reference": "cosmic_ref",
                "preapproval_id": "preapp_auth_pay",
            },
        ):
            resp = await cliente.post(
                "/api/v1/suscripcion/webhook",
                json={
                    "id": "evt_auth_pay_001",
                    "type": "subscription_authorized_payment",
                    "action": "payment.created",
                    "data": {"id": "pay_auth_001"},
                },
            )

        assert resp.status_code == 200
        # Debe haber creado el pago
        MockRepoPago.return_value.crear.assert_called_once()


# ── Tests: GET /suscripcion/pagos ──────────────────────────────


class TestListarPagos:
    """Tests de GET /suscripcion/pagos."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_listar_pagos_exitoso(
        self, MockRepoAuth, MockRepoPago, MockRepoFactura, cliente, redis_falso
    ):
        """Debe retornar el historial de pagos del usuario."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        pago1 = _crear_pago_mock()
        pago2 = _crear_pago_mock(estado="rechazado", monto=500)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPago.return_value.listar_por_usuario = AsyncMock(
            return_value=[pago1, pago2]
        )
        MockRepoFactura.return_value.obtener_por_pago_ids = AsyncMock(return_value={})

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/suscripcion/pagos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert len(datos) == 2
        assert datos[0]["estado"] == "aprobado"
        assert datos[0]["factura_id"] is None
        assert datos[1]["estado"] == "rechazado"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_listar_pagos_vacio(
        self, MockRepoAuth, MockRepoPago, MockRepoFactura, cliente, redis_falso
    ):
        """Sin pagos, debe retornar lista vacía."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPago.return_value.listar_por_usuario = AsyncMock(return_value=[])
        MockRepoFactura.return_value.obtener_por_pago_ids = AsyncMock(return_value={})

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.get(
            "/api/v1/suscripcion/pagos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        assert resp.json()["datos"] == []

    @pytest.mark.asyncio
    async def test_listar_pagos_sin_token(self, cliente):
        """Debe retornar 401 sin token."""
        resp = await cliente.get("/api/v1/suscripcion/pagos")
        assert resp.status_code == 401


# ── Tests: Feature Gating (requiere_plan) ──────────────────────


class TestFeatureGating:
    """Tests de la dependencia requiere_plan."""

    @pytest.mark.asyncio
    @patch("app.dependencias_suscripcion.RepositorioPlan")
    @patch("app.dependencias_suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_requiere_plan_premium_con_premium(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, redis_falso
    ):
        """Usuario premium debe pasar el gating."""
        from app.dependencias_suscripcion import requiere_plan

        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock(slug="premium")
        suscripcion = _crear_suscripcion_mock(usuario_id=uid, plan_id=plan.id)

        db = AsyncMock()
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=suscripcion)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        verificar = requiere_plan("premium")
        resultado = await verificar(usuario=usuario, db=db)

        assert resultado == suscripcion

    @pytest.mark.asyncio
    @patch("app.dependencias_suscripcion.RepositorioPlan")
    @patch("app.dependencias_suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_requiere_plan_premium_con_gratis_rechaza(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, redis_falso
    ):
        """Usuario gratis debe ser rechazado al pedir premium."""
        from app.dependencias_suscripcion import requiere_plan
        from app.excepciones import LimiteExcedido

        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock(slug="gratis", nombre="Gratis", precio_usd=0)
        suscripcion = _crear_suscripcion_mock(usuario_id=uid, plan_id=plan.id)

        db = AsyncMock()
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=suscripcion)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        verificar = requiere_plan("premium")

        with pytest.raises(LimiteExcedido):
            await verificar(usuario=usuario, db=db)

    @pytest.mark.asyncio
    @patch("app.dependencias_suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_requiere_plan_sin_suscripcion(
        self, MockRepoAuth, MockRepoSus, redis_falso
    ):
        """Sin suscripción activa debe ser rechazado."""
        from app.dependencias_suscripcion import requiere_plan
        from app.excepciones import SuscripcionNoEncontrada

        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        db = AsyncMock()
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=None)

        verificar = requiere_plan("premium")

        with pytest.raises(SuscripcionNoEncontrada):
            await verificar(usuario=usuario, db=db)


# ── Tests: Verificación firma webhook ──────────────────────────


class TestVerificacionFirma:
    """Tests de la verificación HMAC del webhook."""

    def test_firma_valida(self):
        """Firma HMAC correcta debe retornar True."""
        secret = "mi_secreto_webhook"
        data_id = "12345"
        request_id = "req_abc"
        ts = "1234567890"

        manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"
        v1 = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()

        x_signature = f"ts={ts},v1={v1}"

        assert ServicioMercadoPago.verificar_firma_webhook(
            x_signature=x_signature,
            x_request_id=request_id,
            data_id=data_id,
            webhook_secret=secret,
        ) is True

    def test_firma_invalida(self):
        """Firma HMAC incorrecta debe retornar False."""
        assert ServicioMercadoPago.verificar_firma_webhook(
            x_signature="ts=123,v1=firmafalsa",
            x_request_id="req_abc",
            data_id="12345",
            webhook_secret="mi_secreto_webhook",
        ) is False

    def test_firma_sin_secret(self):
        """Sin secret debe retornar False."""
        assert ServicioMercadoPago.verificar_firma_webhook(
            x_signature="ts=123,v1=algo",
            x_request_id="req",
            data_id="123",
            webhook_secret="",
        ) is False

    def test_firma_sin_x_signature(self):
        """Sin x-signature debe retornar False."""
        assert ServicioMercadoPago.verificar_firma_webhook(
            x_signature="",
            x_request_id="req",
            data_id="123",
            webhook_secret="secret",
        ) is False

    def test_firma_formato_incorrecto(self):
        """Formato de x-signature sin ts o v1 debe retornar False."""
        assert ServicioMercadoPago.verificar_firma_webhook(
            x_signature="malformato",
            x_request_id="req",
            data_id="123",
            webhook_secret="secret",
        ) is False


# ── Tests: Mapeo de estados ────────────────────────────────────


class TestMapeoEstados:
    """Tests de los mapeos de estados MP → local."""

    def test_mapeo_estados_suscripcion(self):
        """Debe mapear todos los estados de suscripción de MP."""
        from app.servicios.servicio_mercadopago import MAPA_ESTADOS_SUSCRIPCION

        assert MAPA_ESTADOS_SUSCRIPCION["pending"] == "pendiente"
        assert MAPA_ESTADOS_SUSCRIPCION["authorized"] == "activa"
        assert MAPA_ESTADOS_SUSCRIPCION["paused"] == "pausada"
        assert MAPA_ESTADOS_SUSCRIPCION["cancelled"] == "cancelada"

    def test_mapeo_estados_pago(self):
        """Debe mapear todos los estados de pago de MP."""
        from app.servicios.servicio_mercadopago import MAPA_ESTADOS_PAGO

        assert MAPA_ESTADOS_PAGO["approved"] == "aprobado"
        assert MAPA_ESTADOS_PAGO["pending"] == "pendiente"
        assert MAPA_ESTADOS_PAGO["rejected"] == "rechazado"
        assert MAPA_ESTADOS_PAGO["refunded"] == "reembolsado"
        assert MAPA_ESTADOS_PAGO["charged_back"] == "contracargo"


# ── Tests: Multi-país ──────────────────────────────────────────


class TestMultiPais:
    """Tests de soporte multi-país."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_brasil(
        self, MockRepoAuth, MockRepoPlan, MockRepoSus, MockMP,
        cliente, redis_falso
    ):
        """Debe poder suscribirse con país BR y moneda BRL."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock()
        precio_br = _crear_precio_mock(
            plan_id=plan.id, pais="BR", moneda="BRL", precio=4950
        )
        config_br = _crear_config_pais_mock(pais="BR", moneda="BRL")

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)
        MockRepoPlan.return_value.obtener_precio = AsyncMock(return_value=precio_br)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_br)
        MockRepoSus.return_value.cancelar_pendientes_usuario = AsyncMock()
        MockRepoSus.return_value.crear = AsyncMock(
            return_value=_crear_suscripcion_mock(
                usuario_id=uid, plan_id=plan.id, estado="pendiente", pais="BR"
            )
        )

        MockMP.crear_preapproval = AsyncMock(return_value={
            "id": "mp_preapproval_br",
            "init_point": "https://www.mercadopago.com.br/subscriptions/checkout?id=br",
            "status": "pending",
        })

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan.id), "pais_codigo": "BR"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert "mercadopago.com.br" in datos["init_point"]

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_mexico(
        self, MockRepoAuth, MockRepoPlan, MockRepoSus, MockMP,
        cliente, redis_falso
    ):
        """Debe poder suscribirse con país MX y moneda MXN."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        plan = _crear_plan_mock()
        precio_mx = _crear_precio_mock(
            plan_id=plan.id, pais="MX", moneda="MXN", precio=15750
        )
        config_mx = _crear_config_pais_mock(pais="MX", moneda="MXN")

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)
        MockRepoPlan.return_value.obtener_precio = AsyncMock(return_value=precio_mx)
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_mx)
        MockRepoSus.return_value.cancelar_pendientes_usuario = AsyncMock()
        MockRepoSus.return_value.crear = AsyncMock(
            return_value=_crear_suscripcion_mock(
                usuario_id=uid, plan_id=plan.id, estado="pendiente", pais="MX"
            )
        )

        MockMP.crear_preapproval = AsyncMock(return_value={
            "id": "mp_preapproval_mx",
            "init_point": "https://www.mercadopago.com.mx/subscriptions/checkout?id=mx",
            "status": "pending",
        })

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan.id), "pais_codigo": "MX"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert "mercadopago.com.mx" in datos["init_point"]


# ── Tests: POST /suscripcion/sincronizar-pagos ────────────────


def _crear_factura_mock(uid=None, pago_id=None, numero="CE-202603-0001"):
    factura = MagicMock(spec=Factura)
    factura.id = uid or uuid.uuid4()
    factura.pago_id = pago_id
    factura.numero_factura = numero
    factura.usuario_id = None
    factura.monto_centavos = 100000
    factura.moneda = "ARS"
    factura.concepto = "Test"
    factura.estado = "emitida"
    factura.creado_en = datetime.now(timezone.utc)
    return factura


class TestSincronizarPagos:
    """Tests de POST /suscripcion/sincronizar-pagos."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sincronizar_sin_suscripciones_mp(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, MockRepoPago,
        MockRepoFactura, MockMP, cliente, redis_falso,
    ):
        """Sin suscripciones vinculadas a MP, retorna sincronizados=0."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.listar_con_mp_por_usuario = AsyncMock(return_value=[])

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/sincronizar-pagos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["sincronizados"] == 0
        assert datos["estado_actualizado"] is False

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sincronizar_con_pago_aprobado(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, MockRepoPago,
        MockRepoFactura, MockMP, cliente, redis_falso,
    ):
        """Con un pago aprobado en MP, debe crear pago + factura y activar suscripción."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        config_pais = _crear_config_pais_mock()
        plan_premium = _crear_plan_mock(slug="premium")

        sus = _crear_suscripcion_mock(
            usuario_id=uid,
            plan_id=plan_premium.id,
            estado="cancelada",
            mp_preapproval_id="preapproval_test_123",
        )

        pago_creado = _crear_pago_mock()

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.listar_con_mp_por_usuario = AsyncMock(return_value=[sus])
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.cancelar_gratis_usuario = AsyncMock()
        MockRepoPago.return_value.obtener_por_mp_pago_id = AsyncMock(return_value=None)
        MockRepoPago.return_value.crear = AsyncMock(return_value=pago_creado)
        MockRepoFactura.return_value.obtener_por_pago_id = AsyncMock(return_value=None)
        MockRepoFactura.return_value.crear = AsyncMock(return_value=_crear_factura_mock())

        # MP devuelve preapproval authorized + 1 pago aprobado
        MockMP.obtener_preapproval = AsyncMock(return_value={
            "status": "authorized",
            "id": "preapproval_test_123",
        })
        MockMP.buscar_pagos_preapproval = AsyncMock(return_value=[{
            "preapproval_id": "preapproval_test_123",
            "id": 7026592884,
            "status": "processed",
            "transaction_amount": 1000.0,
            "currency_id": "ARS",
            "payment_method_id": "card",
            "external_reference": f"cosmic_{uid}_premium_AR",
            "debit_date": "2026-03-23T00:21:03.000-04:00",
            "payment": {
                "id": 150811843141,
                "status": "approved",
                "status_detail": "accredited",
            },
        }])

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/sincronizar-pagos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["sincronizados"] == 1
        assert datos["estado_actualizado"] is True

        # Verificar que se creó el pago
        MockRepoPago.return_value.crear.assert_called_once()
        args = MockRepoPago.return_value.crear.call_args
        assert args.kwargs["mp_pago_id"] == "150811843141"
        assert args.kwargs["estado"] == "aprobado"
        assert args.kwargs["monto_centavos"] == 100000

        # Verificar que se creó la factura
        MockRepoFactura.return_value.crear.assert_called_once()

        # Verificar que se actualizó el estado de la suscripción (authorized → activa)
        MockRepoSus.return_value.actualizar_estado.assert_called()

        # Verificar que se canceló la suscripción gratis
        MockRepoSus.return_value.cancelar_gratis_usuario.assert_called_with(uid)

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sincronizar_pago_ya_existente_no_duplica(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, MockRepoPago,
        MockRepoFactura, MockMP, cliente, redis_falso,
    ):
        """Si el pago ya existe en la DB, no lo duplica."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        config_pais = _crear_config_pais_mock()

        sus = _crear_suscripcion_mock(
            usuario_id=uid,
            estado="activa",
            mp_preapproval_id="preapproval_test_456",
        )

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.listar_con_mp_por_usuario = AsyncMock(return_value=[sus])
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.cancelar_gratis_usuario = AsyncMock()
        # El pago YA existe en DB
        MockRepoPago.return_value.obtener_por_mp_pago_id = AsyncMock(
            return_value=_crear_pago_mock()
        )

        MockMP.obtener_preapproval = AsyncMock(return_value={
            "status": "authorized",
        })
        MockMP.buscar_pagos_preapproval = AsyncMock(return_value=[{
            "id": 999,
            "status": "processed",
            "transaction_amount": 1000.0,
            "currency_id": "ARS",
            "payment": {"id": 12345, "status": "approved", "status_detail": "accredited"},
        }])

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/sincronizar-pagos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["sincronizados"] == 0
        # No se debe crear pago ni factura
        MockRepoPago.return_value.crear.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_sincronizar_actualiza_estado_suscripcion(
        self, MockRepoAuth, MockRepoSus, MockRepoPlan, MockRepoPago,
        MockRepoFactura, MockMP, cliente, redis_falso,
    ):
        """Si MP dice authorized pero local dice pendiente, actualiza a activa."""
        uid = uuid.uuid4()
        usuario = _crear_usuario_mock(uid=uid)
        config_pais = _crear_config_pais_mock()

        sus = _crear_suscripcion_mock(
            usuario_id=uid,
            estado="pendiente",
            mp_preapproval_id="preapproval_pendiente",
        )

        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockRepoSus.return_value.listar_con_mp_por_usuario = AsyncMock(return_value=[sus])
        MockRepoSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockRepoSus.return_value.actualizar_estado = AsyncMock()
        MockRepoSus.return_value.cancelar_gratis_usuario = AsyncMock()

        # Sin pagos, solo sync de estado
        MockMP.obtener_preapproval = AsyncMock(return_value={
            "status": "authorized",
        })
        MockMP.buscar_pagos_preapproval = AsyncMock(return_value=[])

        token = ServicioAuth.crear_token_acceso(uid, "test@test.com")

        resp = await cliente.post(
            "/api/v1/suscripcion/sincronizar-pagos",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert resp.status_code == 200
        datos = resp.json()["datos"]
        assert datos["estado_actualizado"] is True

        # Verificar que actualizó de pendiente → activa
        MockRepoSus.return_value.actualizar_estado.assert_called_once()
        args = MockRepoSus.return_value.actualizar_estado.call_args
        assert args.args[1] == "activa"

        # Verificar que canceló gratis
        MockRepoSus.return_value.cancelar_gratis_usuario.assert_called_with(uid)

    @pytest.mark.asyncio
    async def test_sincronizar_sin_token(self, cliente):
        """Debe retornar 401 sin token."""
        resp = await cliente.post("/api/v1/suscripcion/sincronizar-pagos")
        assert resp.status_code == 401
