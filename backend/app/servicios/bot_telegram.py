"""Bot de Telegram — Oráculo ASTRA."""

import uuid
from datetime import date

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from app.configuracion import obtener_configuracion
from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_conversacion import RepositorioConversacion
from app.datos.repositorio_perfil import RepositorioPerfil
from app.datos.repositorio_plan import RepositorioPlan
from app.datos.repositorio_suscripcion import RepositorioSuscripcion
from app.datos.repositorio_telegram import RepositorioTelegram
from app.registro import logger
from app.servicios.servicio_oraculo import ServicioOraculo
from app.servicios.servicio_transitos import ServicioTransitos
from app.utilidades.planes import es_plan_pago


# Límite de mensajes por hora
LIMITE_MENSAJES_HORA = 30
CLAVE_RATE_LIMIT = "oraculo:rate:{telegram_id}"


class BotTelegram:
    """Bot de Telegram para el Oráculo ASTRA."""

    def __init__(
        self,
        sesion_factory: async_sessionmaker[AsyncSession],
        redis: Redis,
    ):
        self.sesion_factory = sesion_factory
        self.redis = redis
        config = obtener_configuracion()
        self.app = (
            Application.builder()
            .token(config.telegram_bot_token)
            .build()
        )
        self._registrar_handlers()

    def _registrar_handlers(self) -> None:
        """Registra los handlers de comandos y mensajes."""
        self.app.add_handler(CommandHandler("start", self._cmd_start))
        self.app.add_handler(CommandHandler("vincular", self._cmd_vincular))
        self.app.add_handler(CommandHandler("nueva", self._cmd_nueva))
        self.app.add_handler(CommandHandler("transitos", self._cmd_transitos))
        self.app.add_handler(CommandHandler("estado", self._cmd_estado))
        self.app.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, self._manejar_mensaje)
        )

    # ------------------------------------------------------------------ #
    # Comandos                                                            #
    # ------------------------------------------------------------------ #

    async def _cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Mensaje de bienvenida."""
        await update.message.reply_text(
            "Bienvenido/a al Oráculo ASTRA\n\n"
            "Soy tu guía espiritual personalizado. Para comenzar, "
            "necesitás vincular tu cuenta de la web.\n\n"
            "1. Ingresá a tu cuenta en la web\n"
            "2. Andá a Suscripción > Oráculo ASTRA\n"
            "3. Hacé click en 'Vincular Telegram'\n"
            "4. Enviame el comando /vincular seguido del código\n\n"
            "Ejemplo: /vincular 482951\n\n"
            "Comandos disponibles:\n"
            "/vincular <código> — Vincular tu cuenta\n"
            "/nueva — Iniciar nueva conversación\n"
            "/transitos — Ver tránsitos del día\n"
            "/estado — Ver estado de vinculación"
        )

    async def _cmd_vincular(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Vincula la cuenta de Telegram con el usuario de la web."""
        if not context.args:
            await update.message.reply_text(
                "Enviá el código de vinculación.\n"
                "Ejemplo: /vincular 482951"
            )
            return

        codigo = context.args[0].strip()
        telegram_id = update.effective_user.id
        username = update.effective_user.username

        async with self.sesion_factory() as sesion:
            repo = RepositorioTelegram(sesion)

            # Verificar que este telegram_id no esté vinculado a otro usuario
            existente = await repo.obtener_por_telegram_id(telegram_id)
            if existente:
                await update.message.reply_text(
                    "Esta cuenta de Telegram ya está vinculada. "
                    "Si querés desvincular, hacelo desde la web."
                )
                return

            # Buscar el código
            vinculo = await repo.obtener_por_codigo(codigo)
            if not vinculo:
                await update.message.reply_text(
                    "Código inválido o expirado. Generá uno nuevo desde la web."
                )
                return

            # Vincular
            await repo.vincular(vinculo.usuario_id, telegram_id, username)

        await update.message.reply_text(
            "Vinculación exitosa! Ya podés consultar al oráculo.\n\n"
            "Simplemente escribí tu pregunta y te responderé "
            "basándome en tu perfil cósmico."
        )

    async def _cmd_nueva(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Inicia una nueva conversación, limpiando el historial."""
        telegram_id = update.effective_user.id

        async with self.sesion_factory() as sesion:
            repo_tg = RepositorioTelegram(sesion)
            vinculo = await repo_tg.obtener_por_telegram_id(telegram_id)
            if not vinculo:
                await update.message.reply_text(
                    "Primero necesitás vincular tu cuenta. Usá /start para ver cómo."
                )
                return

            repo_conv = RepositorioConversacion(sesion)
            await repo_conv.nueva_conversacion(vinculo.usuario_id, telegram_id)

        await update.message.reply_text(
            "Nueva conversación iniciada. Preguntame lo que quieras."
        )

    async def _cmd_transitos(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Muestra los tránsitos del día."""
        hoy = date.today().isoformat()
        transitos = ServicioTransitos.obtener_transitos_fecha(hoy)

        lineas = [f"Tránsitos del {hoy}\n"]
        for p in transitos.get("planetas", []):
            retro = " (R)" if p.get("retrogrado") else ""
            lineas.append(
                f"  {p['nombre']}: {p['grado_en_signo']:.1f}° {p['signo']}{retro}"
            )

        await update.message.reply_text("\n".join(lineas))

    async def _cmd_estado(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Muestra el estado de vinculación y suscripción."""
        telegram_id = update.effective_user.id

        async with self.sesion_factory() as sesion:
            repo_tg = RepositorioTelegram(sesion)
            vinculo = await repo_tg.obtener_por_telegram_id(telegram_id)

            if not vinculo:
                await update.message.reply_text(
                    "Estado: No vinculado\n\n"
                    "Usá /start para ver cómo vincular tu cuenta."
                )
                return

            # Verificar suscripción
            repo_sus = RepositorioSuscripcion(sesion)
            suscripcion = await repo_sus.obtener_activa(vinculo.usuario_id)
            plan_nombre = "Gratis"

            if suscripcion:
                repo_plan = RepositorioPlan(sesion)
                plan = await repo_plan.obtener_por_id(suscripcion.plan_id)
                if plan:
                    plan_nombre = plan.nombre

        await update.message.reply_text(
            f"Estado: Vinculado\n"
            f"Telegram: @{vinculo.telegram_username or 'sin username'}\n"
            f"Plan: {plan_nombre}"
        )

    # ------------------------------------------------------------------ #
    # Handler de mensajes                                                  #
    # ------------------------------------------------------------------ #

    async def _manejar_mensaje(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Procesa un mensaje de texto del usuario."""
        telegram_id = update.effective_user.id
        mensaje = update.message.text

        if not mensaje or not mensaje.strip():
            return

        async with self.sesion_factory() as sesion:
            # 1. Verificar vinculación
            repo_tg = RepositorioTelegram(sesion)
            vinculo = await repo_tg.obtener_por_telegram_id(telegram_id)
            if not vinculo:
                await update.message.reply_text(
                    "No tenés tu cuenta vinculada. Usá /start para ver cómo hacerlo."
                )
                return

            # 2. Verificar plan pago
            repo_sus = RepositorioSuscripcion(sesion)
            suscripcion = await repo_sus.obtener_activa(vinculo.usuario_id)
            es_premium = False
            if suscripcion:
                repo_plan = RepositorioPlan(sesion)
                plan = await repo_plan.obtener_por_id(suscripcion.plan_id)
                if plan and es_plan_pago(plan.slug):
                    es_premium = True

            if not es_premium:
                await update.message.reply_text(
                    "El Oráculo ASTRA es un servicio exclusivo de los planes Premium y Max.\n\n"
                    "Actualizá tu plan desde la web para acceder."
                )
                return

            # 3. Rate limiting
            puede_enviar = await self._verificar_rate_limit(telegram_id)
            if not puede_enviar:
                await update.message.reply_text(
                    "Alcanzaste el límite de mensajes por hora (30). "
                    "Esperá un poco antes de enviar más consultas."
                )
                return

            # 4. Obtener contexto cósmico
            await update.message.chat.send_action("typing")

            perfil_cosmico = await self._obtener_contexto_cosmico(sesion, vinculo.usuario_id)
            transitos = ServicioTransitos.obtener_transitos_actuales()

            # 5. Obtener historial de conversación
            repo_conv = RepositorioConversacion(sesion)
            conversacion = await repo_conv.obtener_o_crear_activa(
                vinculo.usuario_id, telegram_id
            )
            historial = await repo_conv.obtener_historial(conversacion.id, limite=20)

            # 6. Consultar al oráculo (con sesión para scoring temporal)
            respuesta, tokens, tokens_in, tokens_out = await ServicioOraculo.consultar(
                mensaje_usuario=mensaje,
                perfil_cosmico=perfil_cosmico,
                transitos=transitos,
                historial=historial,
                sesion=sesion,
            )

            # Registrar consumo API
            from app.servicios.servicio_consumo_api import registrar_consumo
            from app.configuracion import obtener_configuracion as _obt_cfg
            await registrar_consumo(
                sesion,
                usuario_id=vinculo.usuario_id,
                servicio="anthropic",
                operacion="chat_telegram",
                tokens_entrada=tokens_in,
                tokens_salida=tokens_out,
                modelo=_obt_cfg().anthropic_modelo,
            )

            # 7. Guardar mensajes en conversación
            await repo_conv.agregar_mensaje(conversacion.id, "user", mensaje)
            await repo_conv.agregar_mensaje(conversacion.id, "assistant", respuesta, tokens)

        # 8. Enviar respuesta
        # Telegram tiene límite de 4096 caracteres por mensaje
        if len(respuesta) > 4096:
            for i in range(0, len(respuesta), 4096):
                await update.message.reply_text(respuesta[i:i + 4096])
        else:
            await update.message.reply_text(respuesta)

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    async def _obtener_contexto_cosmico(
        self, sesion: AsyncSession, usuario_id: uuid.UUID
    ) -> dict | None:
        """Obtiene el perfil cósmico completo del usuario (cálculos persistidos + datos personales)."""
        repo_perfil = RepositorioPerfil(sesion)
        perfil = await repo_perfil.obtener_por_usuario(usuario_id)
        if not perfil:
            return None

        repo_calculo = RepositorioCalculo(sesion)
        calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)

        # Agregar datos personales del perfil
        calculos["datos_personales"] = {
            "nombre": perfil.nombre,
            "fecha_nacimiento": perfil.fecha_nacimiento.isoformat(),
            "hora_nacimiento": perfil.hora_nacimiento.isoformat(),
            "ciudad_nacimiento": perfil.ciudad_nacimiento,
            "pais_nacimiento": perfil.pais_nacimiento,
        }

        return calculos

    async def _verificar_rate_limit(self, telegram_id: int) -> bool:
        """Verifica el rate limit del usuario (30 mensajes/hora)."""
        clave = CLAVE_RATE_LIMIT.format(telegram_id=telegram_id)
        try:
            conteo = await self.redis.incr(clave)
            if conteo == 1:
                await self.redis.expire(clave, 3600)  # 1 hora
            return conteo <= LIMITE_MENSAJES_HORA
        except Exception:
            # Si Redis falla, permitir el mensaje
            return True

    async def iniciar_polling(self) -> None:
        """Inicia el bot en modo long-polling (desarrollo)."""
        logger.info("Iniciando bot Telegram en modo polling...")
        await self.app.initialize()
        await self.app.start()
        await self.app.updater.start_polling(drop_pending_updates=True)

    async def detener(self) -> None:
        """Detiene el bot."""
        logger.info("Deteniendo bot Telegram...")
        await self.app.updater.stop()
        await self.app.stop()
        await self.app.shutdown()
