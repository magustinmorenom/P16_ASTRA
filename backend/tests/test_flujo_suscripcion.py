"""Tests del flujo completo de suscripción con MercadoPago.

Cubre: listar países, planes multi-país, suscribirse, webhook con factura,
verificar estado, listar facturas, cancelar y degradar a gratis.
"""

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
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder, crear_aplicacion
from app.servicios.servicio_auth import ServicioAuth


# ── Helpers para crear mocks ────────────────────────────────────────


def _crear_usuario(uid=None, email="test@cosmic.com"):
    u = MagicMock(spec=Usuario)
    u.id = uid or uuid.uuid4()
    u.email = email
    u.nombre = "Test User"
    u.activo = True
    u.verificado = False
    u.proveedor_auth = "local"
    u.hash_contrasena = "hash"
    u.google_id = None
    u.ultimo_acceso = None
    u.creado_en = datetime.now(timezone.utc)
    return u


def _crear_plan(uid=None, nombre="Premium", slug="premium", precio_usd=900, activo=True):
    p = MagicMock(spec=Plan)
    p.id = uid or uuid.uuid4()
    p.nombre = nombre
    p.slug = slug
    p.descripcion = f"Plan {nombre}"
    p.precio_usd_centavos = precio_usd
    p.intervalo = "months"
    p.limite_perfiles = -1
    p.limite_calculos_dia = -1
    p.features = ["natal", "diseno_humano"]
    p.activo = activo
    p.orden = 1
    return p


def _crear_plan_gratis(uid=None):
    return _crear_plan(uid=uid, nombre="Gratis", slug="gratis", precio_usd=0)


def _crear_suscripcion(uid=None, usuario_id=None, plan_id=None, estado="activa", pais="AR", mp_preapproval_id=None):
    s = MagicMock(spec=Suscripcion)
    s.id = uid or uuid.uuid4()
    s.usuario_id = usuario_id or uuid.uuid4()
    s.plan_id = plan_id or uuid.uuid4()
    s.pais_codigo = pais
    s.estado = estado
    s.mp_preapproval_id = mp_preapproval_id
    s.fecha_inicio = datetime.now(timezone.utc) if estado == "activa" else None
    s.fecha_fin = None
    s.creado_en = datetime.now(timezone.utc)
    s.precio_plan_id = None
    s.referencia_externa = None
    s.datos_mp = None
    return s


def _crear_config_pais(pais="AR", moneda="ARS", tipo_cambio=1200.0):
    c = MagicMock(spec=ConfigPaisMp)
    c.id = uuid.uuid4()
    c.pais_codigo = pais
    c.pais_nombre = {"AR": "Argentina", "BR": "Brasil", "MX": "México"}.get(pais, pais)
    c.moneda = moneda
    c.tipo_cambio_usd = tipo_cambio
    c.mp_access_token = f"TEST-token-{pais.lower()}"
    c.mp_public_key = f"TEST-key-{pais.lower()}"
    c.mp_webhook_secret = None
    c.activo = True
    return c


def _crear_precio_plan(plan_id=None, pais="AR", moneda="ARS", precio_local=1080000):
    p = MagicMock(spec=PrecioPlan)
    p.id = uuid.uuid4()
    p.plan_id = plan_id or uuid.uuid4()
    p.pais_codigo = pais
    p.moneda = moneda
    p.precio_local = precio_local
    p.intervalo = "months"
    p.frecuencia = 1
    p.activo = True
    return p


def _crear_pago(uid=None, usuario_id=None, monto=1080000, moneda="ARS", estado="aprobado"):
    p = MagicMock(spec=Pago)
    p.id = uid or uuid.uuid4()
    p.usuario_id = usuario_id
    p.monto_centavos = monto
    p.moneda = moneda
    p.estado = estado
    p.metodo_pago = "credit_card"
    p.detalle_estado = "accredited"
    p.fecha_pago = datetime.now(timezone.utc)
    p.creado_en = datetime.now(timezone.utc)
    p.mp_pago_id = str(uuid.uuid4())
    return p


def _crear_factura(uid=None, usuario_id=None, pago_id=None, monto=1080000, moneda="ARS"):
    f = MagicMock(spec=Factura)
    f.id = uid or uuid.uuid4()
    f.usuario_id = usuario_id
    f.pago_id = pago_id
    f.numero_factura = "CE-202603-0001"
    f.estado = "emitida"
    f.monto_centavos = monto
    f.moneda = moneda
    f.concepto = "Suscripción ASTRA"
    f.pais_codigo = "AR"
    f.email_cliente = None
    f.nombre_cliente = None
    f.periodo_inicio = None
    f.periodo_fin = None
    f.creado_en = datetime.now(timezone.utc)
    return f


# ── Fixtures ────────────────────────────────────────────────────────


@pytest.fixture
def redis_falso():
    almacen = {}
    redis = AsyncMock()
    redis.get = AsyncMock(side_effect=lambda k: almacen.get(k))
    redis.set = AsyncMock(side_effect=lambda k, v: almacen.__setitem__(k, v))
    redis.setex = AsyncMock(side_effect=lambda k, t, v: almacen.__setitem__(k, v))
    redis.exists = AsyncMock(side_effect=lambda k: 1 if k in almacen else 0)
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


# ── Tests ───────────────────────────────────────────────────────────


class TestListarPaises:
    """Tests de GET /suscripcion/paises."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    async def test_listar_paises(self, MockRepo, cliente):
        paises = [
            _crear_config_pais("AR", "ARS", 1200.0),
            _crear_config_pais("BR", "BRL", 5.5),
            _crear_config_pais("MX", "MXN", 17.5),
        ]
        MockRepo.return_value.listar_paises_activos = AsyncMock(return_value=paises)

        resp = await cliente.get("/api/v1/suscripcion/paises")
        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert len(cuerpo["datos"]) == 3
        assert cuerpo["datos"][0]["pais_codigo"] == "AR"
        assert cuerpo["datos"][0]["moneda"] == "ARS"
        assert cuerpo["datos"][1]["pais_codigo"] == "BR"


class TestPlanesConPreciosPorPais:
    """Tests de GET /suscripcion/planes con precios_por_pais."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    async def test_planes_con_precios_por_pais(self, MockRepo, cliente):
        plan_premium = _crear_plan()
        precio_ar = _crear_precio_plan(plan_premium.id, "AR", "ARS", 1080000)
        precio_br = _crear_precio_plan(plan_premium.id, "BR", "BRL", 4950)

        repo = MockRepo.return_value
        repo.listar_activos = AsyncMock(return_value=[plan_premium])

        async def obtener_precios(plan_id, pais=None):
            todos = [precio_ar, precio_br]
            if pais:
                return [p for p in todos if p.pais_codigo == pais]
            return todos

        repo.obtener_precios_por_plan = AsyncMock(side_effect=obtener_precios)

        resp = await cliente.get("/api/v1/suscripcion/planes?pais_codigo=AR")
        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True

        plan_data = cuerpo["datos"][0]
        assert "precios_por_pais" in plan_data
        assert "AR" in plan_data["precios_por_pais"]
        assert plan_data["precios_por_pais"]["AR"]["moneda"] == "ARS"
        assert "BR" in plan_data["precios_por_pais"]


class TestSuscribirse:
    """Tests de POST /suscripcion/suscribirse."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_suscribirse_crea_preapproval(
        self, MockRepoAuth, MockPlan, MockSus, MockMP, cliente, redis_falso
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan = _crear_plan()
        precio = _crear_precio_plan(plan.id)
        config_pais = _crear_config_pais()
        suscripcion = _crear_suscripcion(
            usuario_id=uid, plan_id=plan.id, estado="pendiente",
            mp_preapproval_id="preapproval_123"
        )

        MockPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)
        MockPlan.return_value.obtener_precio = AsyncMock(return_value=precio)
        MockSus.return_value.obtener_config_pais = AsyncMock(return_value=config_pais)
        MockSus.return_value.cancelar_pendientes_usuario = AsyncMock()
        MockSus.return_value.crear = AsyncMock(return_value=suscripcion)

        MockMP.crear_preapproval = AsyncMock(return_value={
            "id": "preapproval_123",
            "init_point": "https://www.mercadopago.com.ar/checkout/...",
        })

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.post(
            "/api/v1/suscripcion/suscribirse",
            json={"plan_id": str(plan.id), "pais_codigo": "AR"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert "init_point" in cuerpo["datos"]
        assert cuerpo["datos"]["mp_preapproval_id"] == "preapproval_123"


class TestWebhookConFactura:
    """Tests de POST /suscripcion/webhook — activación + factura."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.obtener_configuracion")
    async def test_webhook_activa_suscripcion_y_crea_factura(
        self, mock_config, MockPlan, MockSus, MockPago, MockMP, MockFactura, cliente
    ):
        config = MagicMock()
        config.mp_webhook_secret = ""
        mock_config.return_value = config

        usuario_id = uuid.uuid4()
        suscripcion = _crear_suscripcion(
            usuario_id=usuario_id, estado="pendiente", mp_preapproval_id="preapproval_xyz"
        )
        pago_mock = _crear_pago(usuario_id=usuario_id)

        repo_sus = MockSus.return_value
        repo_sus.evento_ya_procesado = AsyncMock(return_value=False)
        repo_sus.registrar_evento = AsyncMock()
        repo_sus.listar_paises_activos = AsyncMock(
            return_value=[_crear_config_pais("AR")]
        )
        repo_sus.obtener_por_preapproval_id = AsyncMock(return_value=suscripcion)
        repo_sus.actualizar_estado = AsyncMock()
        repo_sus.cancelar_gratis_usuario = AsyncMock()

        repo_pago = MockPago.return_value
        repo_pago.obtener_por_mp_pago_id = AsyncMock(return_value=None)
        repo_pago.crear = AsyncMock(return_value=pago_mock)

        repo_factura = MockFactura.return_value
        repo_factura.obtener_por_pago_id = AsyncMock(return_value=None)
        repo_factura.crear = AsyncMock(return_value=_crear_factura(
            usuario_id=usuario_id, pago_id=pago_mock.id
        ))

        MockMP.obtener_pago = AsyncMock(return_value={
            "status": "approved",
            "transaction_amount": 10800,
            "currency_id": "ARS",
            "external_reference": f"cosmic_{usuario_id}_premium_AR",
            "preapproval_id": "preapproval_xyz",
            "payment_method_id": "credit_card",
            "status_detail": "accredited",
            "date_approved": "2026-03-22T10:00:00Z",
        })

        resp = await cliente.post(
            "/api/v1/suscripcion/webhook",
            json={
                "id": "webhook_event_001",
                "type": "payment",
                "action": "payment.created",
                "data": {"id": "mp_pago_001"},
            },
        )
        assert resp.status_code == 200
        assert resp.json()["exito"] is True

        # Verificar que se creó el pago
        repo_pago.crear.assert_called_once()

        # Verificar que se creó la factura
        repo_factura.crear.assert_called_once()
        call_kwargs = repo_factura.crear.call_args
        assert call_kwargs.kwargs["usuario_id"] == usuario_id


class TestVerificarEstado:
    """Tests de GET /suscripcion/verificar-estado."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_verificar_estado_premium(
        self, MockRepoAuth, MockSus, MockPlan, cliente, redis_falso
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        plan = _crear_plan(slug="premium")
        suscripcion = _crear_suscripcion(
            usuario_id=uid, plan_id=plan.id, estado="activa"
        )

        MockSus.return_value.obtener_activa = AsyncMock(return_value=suscripcion)
        MockPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/suscripcion/verificar-estado",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["datos"]["es_premium"] is True
        assert cuerpo["datos"]["plan_slug"] == "premium"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioPlan")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_verificar_estado_sin_suscripcion(
        self, MockRepoAuth, MockSus, MockPlan, cliente, redis_falso
    ):
        uid = uuid.uuid4()
        usuario = _crear_usuario(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)
        MockSus.return_value.obtener_activa = AsyncMock(return_value=None)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/suscripcion/verificar-estado",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["datos"]["es_premium"] is False
        assert cuerpo["datos"]["estado"] == "sin_suscripcion"


class TestListarFacturas:
    """Tests de GET /suscripcion/facturas."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.RepositorioFactura")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_listar_facturas(self, MockRepoAuth, MockFactura, cliente, redis_falso):
        uid = uuid.uuid4()
        usuario = _crear_usuario(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        facturas = [
            _crear_factura(usuario_id=uid),
            _crear_factura(usuario_id=uid),
        ]
        MockFactura.return_value.listar_por_usuario = AsyncMock(return_value=facturas)

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.get(
            "/api/v1/suscripcion/facturas",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert len(cuerpo["datos"]) == 2
        assert cuerpo["datos"][0]["numero_factura"] == "CE-202603-0001"


class TestCancelarConGracia:
    """Tests de POST /suscripcion/cancelar — cancelación con período de gracia."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cancelar_programa_gracia(
        self, MockRepoAuth, MockSus, MockMP, cliente, redis_falso
    ):
        """Cancelar mantiene la suscripción activa con fecha_fin programada."""
        uid = uuid.uuid4()
        usuario = _crear_usuario(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        suscripcion = _crear_suscripcion(
            usuario_id=uid, estado="activa", mp_preapproval_id="preapproval_abc"
        )
        suscripcion.fecha_inicio = datetime.now(timezone.utc)

        repo_sus = MockSus.return_value
        repo_sus.obtener_activa = AsyncMock(return_value=suscripcion)
        repo_sus.obtener_config_pais = AsyncMock(return_value=_crear_config_pais())
        repo_sus.programar_cancelacion = AsyncMock()

        MockMP.obtener_preapproval = AsyncMock(return_value={
            "status": "authorized",
            "next_payment_date": "2026-04-22T10:00:00Z",
        })
        MockMP.cancelar_preapproval = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.post(
            "/api/v1/suscripcion/cancelar",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        cuerpo = resp.json()
        assert cuerpo["exito"] is True
        assert "activo hasta" in cuerpo["mensaje"].lower()

        # Verificar que se canceló en MP
        MockMP.cancelar_preapproval.assert_called_once()

        # Verificar que se programó la cancelación (NO actualizar_estado)
        repo_sus.programar_cancelacion.assert_called_once()
        fecha_fin_arg = repo_sus.programar_cancelacion.call_args.args[1]
        assert fecha_fin_arg.year == 2026
        assert fecha_fin_arg.month == 4

        # Verificar que NO se creó suscripción gratis
        repo_sus.crear.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.suscripcion.ServicioMercadoPago")
    @patch("app.rutas.v1.suscripcion.RepositorioSuscripcion")
    @patch("app.dependencias_auth.RepositorioUsuario")
    async def test_cancelar_fallback_30_dias(
        self, MockRepoAuth, MockSus, MockMP, cliente, redis_falso
    ):
        """Sin next_payment_date de MP, usa fecha_inicio + 30 días."""
        uid = uuid.uuid4()
        usuario = _crear_usuario(uid=uid)
        MockRepoAuth.return_value.obtener_por_id = AsyncMock(return_value=usuario)

        suscripcion = _crear_suscripcion(
            usuario_id=uid, estado="activa", mp_preapproval_id="preapproval_def"
        )
        suscripcion.fecha_inicio = datetime(2026, 3, 10, tzinfo=timezone.utc)

        repo_sus = MockSus.return_value
        repo_sus.obtener_activa = AsyncMock(return_value=suscripcion)
        repo_sus.obtener_config_pais = AsyncMock(return_value=_crear_config_pais())
        repo_sus.programar_cancelacion = AsyncMock()

        MockMP.obtener_preapproval = AsyncMock(return_value={"status": "authorized"})
        MockMP.cancelar_preapproval = AsyncMock()

        token = ServicioAuth.crear_token_acceso(uid, usuario.email)
        resp = await cliente.post(
            "/api/v1/suscripcion/cancelar",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200

        # Fallback: 10 marzo + 30 = 9 abril
        repo_sus.programar_cancelacion.assert_called_once()
        fecha_fin_arg = repo_sus.programar_cancelacion.call_args.args[1]
        assert fecha_fin_arg.day == 9
        assert fecha_fin_arg.month == 4
