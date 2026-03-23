"""Tests para el bot de Telegram — Oráculo ASTRA."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modelos.conversacion_oraculo import ConversacionOraculo
from app.modelos.plan import Plan
from app.modelos.suscripcion import Suscripcion
from app.modelos.vinculo_telegram import VinculoTelegram
from app.servicios.bot_telegram import BotTelegram


# ── Helpers ────────────────────────────────────────────────────


def _crear_update_mock(telegram_id=123456789, username="test_user", texto="Hola"):
    """Crea un mock de telegram.Update."""
    update = MagicMock()
    update.effective_user.id = telegram_id
    update.effective_user.username = username
    update.message.text = texto
    update.message.reply_text = AsyncMock()
    update.message.chat.send_action = AsyncMock()
    return update


def _crear_context_mock(args=None):
    """Crea un mock de ContextTypes.DEFAULT_TYPE."""
    context = MagicMock()
    context.args = args or []
    return context


def _crear_vinculo(usuario_id, telegram_id=123456789, activo=True):
    vinculo = MagicMock(spec=VinculoTelegram)
    vinculo.id = uuid.uuid4()
    vinculo.usuario_id = usuario_id
    vinculo.telegram_id = telegram_id
    vinculo.telegram_username = "test_user"
    vinculo.activo = activo
    return vinculo


def _crear_plan(slug="premium"):
    plan = MagicMock(spec=Plan)
    plan.id = uuid.uuid4()
    plan.slug = slug
    plan.nombre = slug.capitalize()
    return plan


def _crear_suscripcion(usuario_id, plan_id):
    sus = MagicMock(spec=Suscripcion)
    sus.id = uuid.uuid4()
    sus.usuario_id = usuario_id
    sus.plan_id = plan_id
    sus.estado = "activa"
    return sus


def _crear_conversacion(usuario_id, telegram_id=123456789):
    conv = MagicMock(spec=ConversacionOraculo)
    conv.id = uuid.uuid4()
    conv.usuario_id = usuario_id
    conv.telegram_id = telegram_id
    conv.mensajes = []
    conv.activa = True
    return conv


# ── Fixtures ───────────────────────────────────────────────────


@pytest.fixture
def redis_falso():
    redis = AsyncMock()
    redis.incr = AsyncMock(return_value=1)
    redis.expire = AsyncMock()
    return redis


@pytest.fixture
def sesion_factory_mock():
    """Crea un mock de async_sessionmaker que actúa como context manager."""
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()

    factory = MagicMock()
    factory.return_value.__aenter__ = AsyncMock(return_value=sesion)
    factory.return_value.__aexit__ = AsyncMock(return_value=False)
    return factory, sesion


@pytest.fixture
def bot(sesion_factory_mock, redis_falso):
    factory, _ = sesion_factory_mock
    with patch("app.servicios.bot_telegram.obtener_configuracion") as mock_config:
        config = MagicMock()
        config.telegram_bot_token = "TEST-TOKEN"
        mock_config.return_value = config
        with patch("app.servicios.bot_telegram.Application"):
            bot = BotTelegram(sesion_factory=factory, redis=redis_falso)
    return bot


# ── Tests: /start ─────────────────────────────────────────────


class TestCmdStart:
    @pytest.mark.asyncio
    async def test_start_envia_bienvenida(self, bot):
        update = _crear_update_mock()
        context = _crear_context_mock()
        await bot._cmd_start(update, context)
        update.message.reply_text.assert_called_once()
        texto = update.message.reply_text.call_args[0][0]
        assert "Bienvenido" in texto
        assert "/vincular" in texto


# ── Tests: /vincular ──────────────────────────────────────────


class TestCmdVincular:
    @pytest.mark.asyncio
    async def test_vincular_sin_codigo(self, bot):
        update = _crear_update_mock()
        context = _crear_context_mock(args=[])
        await bot._cmd_vincular(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "código" in texto.lower()

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_vincular_ya_vinculado(self, MockRepo, bot, sesion_factory_mock):
        _, sesion = sesion_factory_mock
        uid = uuid.uuid4()
        vinculo = _crear_vinculo(uid)
        MockRepo.return_value.obtener_por_telegram_id = AsyncMock(return_value=vinculo)

        update = _crear_update_mock()
        context = _crear_context_mock(args=["123456"])
        await bot._cmd_vincular(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "ya está vinculada" in texto

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_vincular_codigo_invalido(self, MockRepo, bot, sesion_factory_mock):
        MockRepo.return_value.obtener_por_telegram_id = AsyncMock(return_value=None)
        MockRepo.return_value.obtener_por_codigo = AsyncMock(return_value=None)

        update = _crear_update_mock()
        context = _crear_context_mock(args=["999999"])
        await bot._cmd_vincular(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "inválido" in texto.lower() or "expirado" in texto.lower()

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_vincular_exitoso(self, MockRepo, bot, sesion_factory_mock):
        uid = uuid.uuid4()
        vinculo = _crear_vinculo(uid, telegram_id=None)
        MockRepo.return_value.obtener_por_telegram_id = AsyncMock(return_value=None)
        MockRepo.return_value.obtener_por_codigo = AsyncMock(return_value=vinculo)
        MockRepo.return_value.vincular = AsyncMock(return_value=vinculo)

        update = _crear_update_mock()
        context = _crear_context_mock(args=["123456"])
        await bot._cmd_vincular(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "exitosa" in texto.lower()


# ── Tests: /nueva ─────────────────────────────────────────────


class TestCmdNueva:
    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioConversacion")
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_nueva_sin_vincular(self, MockRepoTg, MockRepoConv, bot, sesion_factory_mock):
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=None)

        update = _crear_update_mock()
        context = _crear_context_mock()
        await bot._cmd_nueva(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "vincular" in texto.lower()

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioConversacion")
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_nueva_exitoso(self, MockRepoTg, MockRepoConv, bot, sesion_factory_mock):
        uid = uuid.uuid4()
        vinculo = _crear_vinculo(uid)
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=vinculo)
        MockRepoConv.return_value.nueva_conversacion = AsyncMock()

        update = _crear_update_mock()
        context = _crear_context_mock()
        await bot._cmd_nueva(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "Nueva conversación" in texto


# ── Tests: /transitos ─────────────────────────────────────────


class TestCmdTransitos:
    @pytest.mark.asyncio
    async def test_transitos_retorna_planetas(self, bot):
        update = _crear_update_mock()
        context = _crear_context_mock()
        await bot._cmd_transitos(update, context)
        update.message.reply_text.assert_called_once()
        texto = update.message.reply_text.call_args[0][0]
        assert "Tránsitos" in texto
        assert "Sol" in texto


# ── Tests: /estado ────────────────────────────────────────────


class TestCmdEstado:
    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioPlan")
    @patch("app.servicios.bot_telegram.RepositorioSuscripcion")
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_estado_no_vinculado(
        self, MockRepoTg, MockRepoSus, MockRepoPlan, bot, sesion_factory_mock
    ):
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=None)

        update = _crear_update_mock()
        context = _crear_context_mock()
        await bot._cmd_estado(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "No vinculado" in texto

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioPlan")
    @patch("app.servicios.bot_telegram.RepositorioSuscripcion")
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_estado_vinculado_premium(
        self, MockRepoTg, MockRepoSus, MockRepoPlan, bot, sesion_factory_mock
    ):
        uid = uuid.uuid4()
        vinculo = _crear_vinculo(uid)
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=vinculo)

        plan = _crear_plan(slug="premium")
        sus = _crear_suscripcion(uid, plan.id)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        update = _crear_update_mock()
        context = _crear_context_mock()
        await bot._cmd_estado(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "Vinculado" in texto
        assert "Premium" in texto


# ── Tests: Mensajes de texto ──────────────────────────────────


class TestManejarMensaje:
    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_mensaje_sin_vincular(self, MockRepoTg, bot, sesion_factory_mock):
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=None)

        update = _crear_update_mock(texto="¿Cómo está mi energía?")
        context = _crear_context_mock()
        await bot._manejar_mensaje(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "vincular" in texto.lower() or "vinculada" in texto.lower()

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioPlan")
    @patch("app.servicios.bot_telegram.RepositorioSuscripcion")
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_mensaje_sin_premium(
        self, MockRepoTg, MockRepoSus, MockRepoPlan, bot, sesion_factory_mock
    ):
        uid = uuid.uuid4()
        vinculo = _crear_vinculo(uid)
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=vinculo)

        plan = _crear_plan(slug="gratis")
        sus = _crear_suscripcion(uid, plan.id)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        update = _crear_update_mock(texto="¿Qué me dicen los astros?")
        context = _crear_context_mock()
        await bot._manejar_mensaje(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "Premium" in texto

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.ServicioOraculo")
    @patch("app.servicios.bot_telegram.ServicioTransitos")
    @patch("app.servicios.bot_telegram.RepositorioConversacion")
    @patch("app.servicios.bot_telegram.RepositorioCalculo")
    @patch("app.servicios.bot_telegram.RepositorioPerfil")
    @patch("app.servicios.bot_telegram.RepositorioPlan")
    @patch("app.servicios.bot_telegram.RepositorioSuscripcion")
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_mensaje_exitoso(
        self, MockRepoTg, MockRepoSus, MockRepoPlan,
        MockRepoPerfil, MockRepoCalculo, MockRepoConv,
        MockTransitos, MockOraculo, bot, sesion_factory_mock, redis_falso,
    ):
        uid = uuid.uuid4()
        vinculo = _crear_vinculo(uid)
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=vinculo)

        plan = _crear_plan(slug="premium")
        sus = _crear_suscripcion(uid, plan.id)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        # Perfil y cálculos
        perfil_mock = MagicMock()
        perfil_mock.id = uuid.uuid4()
        MockRepoPerfil.return_value.obtener_por_usuario = AsyncMock(return_value=perfil_mock)
        MockRepoCalculo.return_value.obtener_todos_por_perfil = AsyncMock(
            return_value={"natal": {}, "diseno_humano": {}, "numerologia": {}}
        )

        # Tránsitos
        MockTransitos.obtener_transitos_actuales.return_value = {"planetas": []}

        # Conversación
        conv = _crear_conversacion(uid)
        MockRepoConv.return_value.obtener_o_crear_activa = AsyncMock(return_value=conv)
        MockRepoConv.return_value.obtener_historial = AsyncMock(return_value=[])
        MockRepoConv.return_value.agregar_mensaje = AsyncMock()

        # Oráculo
        MockOraculo.consultar = AsyncMock(
            return_value=("Las energías cósmicas te acompañan hoy.", 150)
        )

        update = _crear_update_mock(texto="¿Cómo está mi energía hoy?")
        context = _crear_context_mock()
        await bot._manejar_mensaje(update, context)

        texto = update.message.reply_text.call_args[0][0]
        assert "energías cósmicas" in texto
        MockOraculo.consultar.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.servicios.bot_telegram.RepositorioPlan")
    @patch("app.servicios.bot_telegram.RepositorioSuscripcion")
    @patch("app.servicios.bot_telegram.RepositorioTelegram")
    async def test_rate_limit_excedido(
        self, MockRepoTg, MockRepoSus, MockRepoPlan, bot, sesion_factory_mock, redis_falso
    ):
        uid = uuid.uuid4()
        vinculo = _crear_vinculo(uid)
        MockRepoTg.return_value.obtener_por_telegram_id = AsyncMock(return_value=vinculo)

        plan = _crear_plan(slug="premium")
        sus = _crear_suscripcion(uid, plan.id)
        MockRepoSus.return_value.obtener_activa = AsyncMock(return_value=sus)
        MockRepoPlan.return_value.obtener_por_id = AsyncMock(return_value=plan)

        # Simular que ya excedió el límite
        redis_falso.incr = AsyncMock(return_value=31)

        update = _crear_update_mock(texto="¿Otra pregunta?")
        context = _crear_context_mock()
        await bot._manejar_mensaje(update, context)
        texto = update.message.reply_text.call_args[0][0]
        assert "límite" in texto.lower()


# ── Tests: Rate limiting ──────────────────────────────────────


class TestRateLimit:
    @pytest.mark.asyncio
    async def test_primer_mensaje_permitido(self, bot, redis_falso):
        redis_falso.incr = AsyncMock(return_value=1)
        resultado = await bot._verificar_rate_limit(123456789)
        assert resultado is True
        redis_falso.expire.assert_called_once()

    @pytest.mark.asyncio
    async def test_mensaje_30_permitido(self, bot, redis_falso):
        redis_falso.incr = AsyncMock(return_value=30)
        resultado = await bot._verificar_rate_limit(123456789)
        assert resultado is True

    @pytest.mark.asyncio
    async def test_mensaje_31_bloqueado(self, bot, redis_falso):
        redis_falso.incr = AsyncMock(return_value=31)
        resultado = await bot._verificar_rate_limit(123456789)
        assert resultado is False

    @pytest.mark.asyncio
    async def test_redis_falla_permite(self, bot, redis_falso):
        redis_falso.incr = AsyncMock(side_effect=Exception("Redis down"))
        resultado = await bot._verificar_rate_limit(123456789)
        assert resultado is True
