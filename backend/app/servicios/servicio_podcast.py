"""Servicio Pipeline de Podcasts — orquesta la generación de podcasts personalizados."""

import json
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

import pytz

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_perfil import RepositorioPerfil
from app.datos.repositorio_podcast import RepositorioPodcast
from app.modelos.podcast import PodcastEpisodio
from app.registro import logger
from app.datos.repositorio_usuario import RepositorioUsuario
from app.servicios.servicio_almacenamiento import ServicioAlmacenamiento
from app.servicios.servicio_email import ServicioEmail
from app.servicios.servicio_oraculo import ServicioOraculo
from app.servicios.servicio_transitos import ServicioTransitos
from app.servicios.servicio_tts import ServicioTTS


_RUTA_PROMPT_PODCAST = Path(__file__).parent.parent / "oraculo" / "prompt_podcast.md"
_RUTA_PROMPT_ACCIONABLES = Path(__file__).parent.parent / "oraculo" / "prompt_extraer_accionables.md"

TIPOS_PODCAST = {
    "dia": {
        "titulo_template": "Cómo influyen hoy los tránsitos en vos — {fecha}",
        "prompt_extra": (
            "Este episodio es sobre las energías cósmicas del DÍA de hoy. "
            "Enfocate en la energía del día, qué planetas están activos, "
            "los tránsitos relevantes y cómo aprovechar las horas."
        ),
    },
    "semana": {
        "titulo_template": "Revisemos cómo viene tu semana — {fecha_inicio} al {fecha_fin}",
        "prompt_extra": (
            "Este episodio cubre las energías de la SEMANA completa (lunes a domingo). "
            "Enfocate en los tránsitos más relevantes de la semana, "
            "los días clave, y cómo navegar las energías de estos 7 días."
        ),
    },
    "mes": {
        "titulo_template": "Ampliá tu horizonte para este mes — {mes} {anio}",
        "prompt_extra": (
            "Este episodio cubre las energías del MES completo. "
            "Enfocate en los tránsitos mayores del mes, lunas nuevas y llenas, "
            "retrogradaciones y las grandes tendencias energéticas."
        ),
    },
}

_MESES_ES = [
    "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


def _calcular_fecha_clave(tipo: str, fecha: date) -> date:
    """Normaliza la fecha para la unique constraint según tipo.

    - dia: la misma fecha
    - semana: lunes de esa semana (isoweekday)
    - mes: primer día del mes
    """
    if tipo == "semana":
        return fecha - timedelta(days=fecha.weekday())
    elif tipo == "mes":
        return fecha.replace(day=1)
    return fecha


class ServicioPodcast:
    """Orquesta la generación de podcasts cósmicos personalizados."""

    @classmethod
    def _cargar_prompt_podcast(cls) -> str:
        """Carga el system prompt de podcast desde archivo."""
        try:
            return _RUTA_PROMPT_PODCAST.read_text(encoding="utf-8")
        except FileNotFoundError:
            logger.warning("prompt_podcast.md no encontrado")
            return "Sos una guía astrológica que genera podcasts personalizados."

    @classmethod
    def _construir_system_podcast(
        cls,
        tipo: str,
        perfil_cosmico: dict | None = None,
        transitos: dict | None = None,
    ) -> str:
        """Construye system prompt completo para podcast."""
        prompt = cls._cargar_prompt_podcast()

        # Agregar contexto del tipo
        info_tipo = TIPOS_PODCAST.get(tipo, {})
        prompt += f"\n\n## Tipo de Podcast\n{info_tipo.get('prompt_extra', '')}"

        # Perfil cósmico
        if perfil_cosmico:
            resumen = ServicioOraculo._resumir_perfil(perfil_cosmico)
        else:
            resumen = "No hay perfil cósmico disponible."
        prompt += f"\n\n## Perfil Cósmico del Usuario\n{resumen}"

        # Tránsitos
        if transitos:
            resumen_transitos = ServicioOraculo._resumir_transitos(transitos)
        else:
            resumen_transitos = "No hay datos de tránsitos."
        prompt += f"\n\n## Tránsitos Actuales\n{resumen_transitos}"

        return prompt

    @classmethod
    async def _obtener_contexto_cosmico(
        cls, sesion: AsyncSession, usuario_id: uuid.UUID
    ) -> dict | None:
        """Obtiene el perfil cósmico completo del usuario."""
        repo_perfil = RepositorioPerfil(sesion)
        perfil = await repo_perfil.obtener_por_usuario(usuario_id)
        if not perfil:
            return None

        repo_calculo = RepositorioCalculo(sesion)
        calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)

        calculos["datos_personales"] = {
            "nombre": perfil.nombre,
            "fecha_nacimiento": perfil.fecha_nacimiento.isoformat(),
            "hora_nacimiento": perfil.hora_nacimiento.isoformat(),
            "ciudad_nacimiento": perfil.ciudad_nacimiento,
            "pais_nacimiento": perfil.pais_nacimiento,
        }

        return calculos

    @classmethod
    async def _invalidar_cache_pronostico_diario(
        cls,
        redis: Redis | None,
        usuario_id: uuid.UUID,
        fecha: date,
    ) -> None:
        """Borra el cache del pronóstico diario para una fecha dada.

        El pronóstico inyecta `acciones_json` del podcast en sus
        `momentos.accionables`. Si el pronóstico se cacheó ANTES de que el
        podcast estuviera listo (race habitual: dashboard pide pronóstico
        mientras el bootstrap genera el podcast en background), el cache
        contiene los accionables del fallback. Borrarlo fuerza regeneración
        con las acciones reales en la próxima petición.

        No-op si `redis` es None. Captura excepciones y solo loggea —
        nunca debe romper el pipeline del podcast.
        """
        if redis is None:
            return
        clave = f"cosmic:pronostico:diario:{usuario_id}:{fecha.isoformat()}"
        try:
            await redis.delete(clave)
            logger.info("Cache de pronóstico invalidado: %s", clave)
        except Exception as e:
            logger.warning("No se pudo invalidar cache de pronóstico: %s", e)

    @classmethod
    def _cargar_prompt_accionables(cls) -> str:
        """Carga el prompt de extracción de accionables."""
        try:
            return _RUTA_PROMPT_ACCIONABLES.read_text(encoding="utf-8")
        except FileNotFoundError:
            logger.warning("prompt_extraer_accionables.md no encontrado")
            return "Extraé 6-9 acciones concretas del siguiente transcript de podcast, devolvé JSON."

    @classmethod
    async def _extraer_acciones_con_ia(
        cls, sesion: AsyncSession, usuario_id: uuid.UUID, guion: str
    ) -> list[dict] | None:
        """Extrae acciones estructuradas del transcript usando Claude Haiku.

        Llamada liviana (Haiku, ~800 tokens in, ~300 out) que toma el guion
        narrativo del podcast y devuelve un array JSON de acciones organizadas
        por bloque temporal (manana/tarde/noche).
        """
        if not guion:
            return None

        import anthropic
        config = obtener_configuracion()
        if not config.anthropic_api_key:
            logger.warning("Sin API key — no se pueden extraer acciones")
            return None

        system_prompt = cls._cargar_prompt_accionables()

        try:
            cliente = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
            respuesta = await cliente.messages.create(
                model=config.oraculo_modelo,  # Haiku — rápido y barato
                max_tokens=600,
                temperature=0,  # extracción determinista
                system=system_prompt,
                messages=[{"role": "user", "content": guion}],
            )

            texto = respuesta.content[0].text if respuesta.content else ""
            tokens_in = respuesta.usage.input_tokens or 0
            tokens_out = respuesta.usage.output_tokens or 0

            # Registrar consumo
            from app.servicios.servicio_consumo_api import registrar_consumo
            await registrar_consumo(
                sesion,
                usuario_id=usuario_id,
                servicio="anthropic",
                operacion="podcast_extraer_acciones",
                tokens_entrada=tokens_in,
                tokens_salida=tokens_out,
                modelo=config.oraculo_modelo,
            )

            # Parsear JSON — buscar array entre [ y ]
            texto = texto.strip()
            inicio = texto.find("[")
            fin = texto.rfind("]")
            if inicio == -1 or fin <= inicio:
                logger.warning("Haiku no devolvió JSON array: %s", texto[:200])
                return None

            acciones = json.loads(texto[inicio:fin + 1])
            if isinstance(acciones, list) and len(acciones) > 0:
                logger.info("Acciones extraídas con Haiku: %d acciones", len(acciones))
                return acciones

            logger.warning("Haiku devolvió lista vacía o no-lista")
            return None

        except Exception as e:
            logger.error("Error extrayendo acciones con Haiku: %s", e)
            return None

    @classmethod
    def _generar_segmentos(cls, texto: str, duracion: float) -> list[dict]:
        """Divide el texto en segmentos y asigna timestamps proporcionales.

        Cada párrafo del texto = un segmento.
        Distribución proporcional por longitud de texto.
        """
        parrafos = [p.strip() for p in texto.split("\n\n") if p.strip()]
        if not parrafos:
            return []

        longitud_total = sum(len(p) for p in parrafos)
        if longitud_total == 0:
            return []

        segmentos = []
        tiempo_actual = 0.0

        for parrafo in parrafos:
            proporcion = len(parrafo) / longitud_total
            duracion_segmento = duracion * proporcion
            segmentos.append({
                "inicio_seg": round(tiempo_actual, 2),
                "fin_seg": round(tiempo_actual + duracion_segmento, 2),
                "texto": parrafo,
            })
            tiempo_actual += duracion_segmento

        # Ajustar último segmento para que termine exactamente en la duración
        if segmentos:
            segmentos[-1]["fin_seg"] = round(duracion, 2)

        return segmentos

    @classmethod
    def _construir_titulo(cls, tipo: str, fecha_clave: date) -> str:
        """Construye el título del episodio según tipo y fecha."""
        info = TIPOS_PODCAST[tipo]
        if tipo == "dia":
            return info["titulo_template"].format(fecha=fecha_clave.strftime("%d/%m"))
        elif tipo == "semana":
            fin_semana = fecha_clave + timedelta(days=6)
            return info["titulo_template"].format(
                fecha_inicio=fecha_clave.strftime("%d/%m"),
                fecha_fin=fin_semana.strftime("%d/%m"),
            )
        else:  # mes
            return info["titulo_template"].format(
                mes=_MESES_ES[fecha_clave.month],
                anio=fecha_clave.year,
            )

    @classmethod
    def _construir_mensaje_usuario(cls, tipo: str, fecha_clave: date, origen: str = "manual") -> str:
        """Construye el mensaje del usuario para la generación del guión."""
        _tz_ar = pytz.timezone("America/Argentina/Buenos_Aires")
        ahora_ar = datetime.now(_tz_ar)
        hora_local = ahora_ar.strftime("%H:%M")
        hora_num = ahora_ar.hour

        marcador = "MAÑANA" if origen == "preview" else "HOY"
        momento = "mañana" if hora_num < 12 else "tarde" if hora_num < 19 else "noche"

        contexto_hora = (
            f"HORA LOCAL DEL USUARIO: {hora_local}. "
            f"MOMENTO DEL DÍA: {momento}. "
            f"MARCADOR TEMPORAL: {marcador}."
        )

        if tipo == "dia":
            return (
                f"Generá el episodio de podcast para {fecha_clave.strftime('%d de %B de %Y')}. "
                f"{contexto_hora}"
            )
        elif tipo == "semana":
            fin_semana = fecha_clave + timedelta(days=6)
            return (
                f"Generá el episodio de podcast semanal para la semana del "
                f"{fecha_clave.strftime('%d de %B')} al {fin_semana.strftime('%d de %B de %Y')}. "
                f"{contexto_hora}"
            )
        else:  # mes
            return (
                f"Generá el episodio de podcast mensual para "
                f"{_MESES_ES[fecha_clave.month]} de {fecha_clave.year}. "
                f"{contexto_hora}"
            )

    @classmethod
    async def generar_episodio(
        cls,
        sesion: AsyncSession,
        usuario_id: uuid.UUID,
        fecha: date,
        tipo: str,
        origen: str = "manual",
        fecha_objetivo: date | None = None,
        redis: Redis | None = None,
    ) -> PodcastEpisodio:
        """Pipeline completo para generar un episodio de podcast.

        Args:
            origen: "manual" (usuario pidió), "preview" (adelanto de mañana), "auto" (lazy)
            fecha_objetivo: fecha real para la que se genera el contenido (puede ser mañana)
            redis: cliente Redis opcional. Si se pasa y el episodio queda `listo`,
                el servicio invalida el cache del pronóstico de la fecha objetivo
                para forzar regeneración con las acciones recién producidas. Esto
                centraliza la invalidación: el servicio es la única fuente de
                verdad, sin importar quién lo dispare (bootstrap, ruta manual,
                cron, etc).
        """
        repo = RepositorioPodcast(sesion)
        fecha_clave = _calcular_fecha_clave(tipo, fecha)
        titulo = cls._construir_titulo(tipo, fecha_clave)

        # Verificar si ya existe
        existente = await repo.obtener_episodio(usuario_id, fecha_clave, tipo)
        if existente and existente.estado == "listo":
            return existente

        # Si ya está generando, retornar tal cual para que el front haga polling
        if existente and existente.estado in ("generando_guion", "generando_audio"):
            return existente

        # Crear o reusar registro (si hubo error previo, reintentar)
        if existente:
            episodio = existente
        else:
            episodio = await repo.crear_episodio(
                usuario_id=usuario_id,
                fecha=fecha_clave,
                momento=tipo,
                titulo=titulo,
                estado="generando_guion",
                origen=origen,
                fecha_objetivo=fecha_objetivo or fecha_clave,
            )

        try:
            # 1. Obtener contexto cósmico
            await repo.actualizar_estado(episodio.id, "generando_guion")
            perfil_cosmico = await cls._obtener_contexto_cosmico(sesion, usuario_id)

            # 2. Obtener tránsitos actuales
            transitos = ServicioTransitos.obtener_transitos_actuales()

            # 3. Construir system prompt de podcast
            system_prompt = cls._construir_system_podcast(
                tipo, perfil_cosmico, transitos
            )

            # 4. Generar guión con Claude
            import anthropic
            config = obtener_configuracion()

            if not config.anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY no configurada")

            # Sonnet: suficiente calidad para guion narrativo, 3-5x más rápido que Opus
            max_tokens_por_tipo = {"dia": 1400, "semana": 2000, "mes": 2800}

            cliente = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
            respuesta = await cliente.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=max_tokens_por_tipo.get(tipo, 1024),
                temperature=0.7,
                system=system_prompt,
                messages=[{
                    "role": "user",
                    "content": cls._construir_mensaje_usuario(tipo, fecha_clave, origen),
                }],
            )

            texto_completo = respuesta.content[0].text if respuesta.content else ""
            tokens_in = respuesta.usage.input_tokens or 0
            tokens_out = respuesta.usage.output_tokens or 0
            tokens = tokens_in + tokens_out

            # 4b. El guion es el texto completo (ya no tiene bloque ---ACCIONES---)
            guion = texto_completo.strip()

            # 4c. Extraer acciones con Haiku (solo para tipo día)
            acciones: list[dict] | None = None
            if tipo == "dia":
                acciones = await cls._extraer_acciones_con_ia(sesion, usuario_id, guion)
                if not acciones:
                    logger.warning(
                        "No se pudieron extraer acciones del podcast dia para usuario=%s",
                        usuario_id,
                    )

            # Registrar consumo Claude (guión)
            from app.servicios.servicio_consumo_api import registrar_consumo
            await registrar_consumo(
                sesion,
                usuario_id=usuario_id,
                servicio="anthropic",
                operacion=f"podcast_guion_{tipo}",
                tokens_entrada=tokens_in,
                tokens_salida=tokens_out,
                modelo=config.anthropic_modelo,
            )

            await repo.actualizar_estado(
                episodio.id, "generando_audio",
                guion_md=guion, acciones_json=acciones, tokens_usados=tokens,
            )

            # 5. Generar audio con TTS (solo narrativa, sin JSON)
            mp3_bytes, duracion = await ServicioTTS.generar_audio(guion)

            # Registrar consumo Gemini TTS
            chars_guion = len(guion)
            await registrar_consumo(
                sesion,
                usuario_id=usuario_id,
                servicio="gemini",
                operacion=f"podcast_tts_{tipo}",
                tokens_entrada=chars_guion,
                tokens_salida=0,
                modelo="gemini-2.5-flash-preview-tts",
                metadata_extra={"caracteres": chars_guion, "duracion_segundos": duracion},
            )

            # 6. Subir a MinIO
            objeto_key = f"podcasts/{usuario_id}/{fecha_clave.isoformat()}/{tipo}.mp3"
            ServicioAlmacenamiento.subir_bytes(mp3_bytes, objeto_key)

            # 7. Generar segmentos para lyrics sync
            segmentos = cls._generar_segmentos(guion, duracion)

            # 8. Marcar como listo
            await repo.actualizar_estado(
                episodio.id,
                "listo",
                url_audio=objeto_key,
                duracion_segundos=duracion,
                segmentos_json=segmentos,
            )

            # Invalidar cache del pronóstico diario para tipo "dia"
            # ANTES de refrescar desde BD — minimiza la ventana de race con
            # el polling del frontend que detecta `listo` y refetch pronostico.
            if tipo == "dia":
                fecha_invalidacion = fecha_objetivo or fecha_clave
                await cls._invalidar_cache_pronostico_diario(
                    redis, usuario_id, fecha_invalidacion
                )

            # Refrescar desde BD
            episodio = await repo.obtener_episodio_por_id(episodio.id)
            logger.info(
                "Podcast generado: usuario=%s fecha=%s tipo=%s duracion=%.1fs",
                usuario_id, fecha_clave, tipo, duracion,
            )

            # Notificar por email (fire-and-forget)
            try:
                repo_usuario = RepositorioUsuario(sesion)
                usuario = await repo_usuario.obtener_por_id(usuario_id)
                if usuario:
                    await ServicioEmail.enviar_podcast_listo(
                        usuario.email, usuario.nombre, episodio.titulo,
                    )
            except Exception:
                logger.warning("No se pudo enviar email de podcast listo")

            return episodio

        except Exception as e:
            logger.error("Error generando podcast: %s", e)
            await repo.actualizar_estado(
                episodio.id, "error", error_detalle=str(e)
            )
            raise
