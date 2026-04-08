"""Servicio Pipeline de Podcasts — orquesta la generación de podcasts personalizados."""

import json
import uuid
from datetime import date, timedelta
from pathlib import Path

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
    def _separar_narrativa_acciones(cls, texto_completo: str) -> tuple[str, list[dict] | None]:
        """Separa la narrativa del bloque ---ACCIONES--- JSON.

        Returns:
            (narrativa_limpia, acciones_json o None si no se encontró/parseó)
        """
        separador = "---ACCIONES---"
        if separador not in texto_completo:
            return texto_completo.strip(), None

        partes = texto_completo.split(separador, 1)
        narrativa = partes[0].strip()
        bloque_json = partes[1].strip()

        # Limpiar posibles backticks markdown
        if bloque_json.startswith("```"):
            lineas = bloque_json.split("\n")
            lineas = [l for l in lineas if not l.strip().startswith("```")]
            bloque_json = "\n".join(lineas)

        try:
            acciones = json.loads(bloque_json)
            if isinstance(acciones, list):
                return narrativa, acciones
            logger.warning("Bloque acciones no es una lista, ignorando")
            return narrativa, None
        except json.JSONDecodeError as e:
            logger.warning("Error parseando bloque acciones del podcast: %s", e)
            return narrativa, None

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
        marcador = "MAÑANA" if origen == "preview" else "HOY"
        if tipo == "dia":
            return (
                f"Generá el episodio de podcast para {fecha_clave.strftime('%d de %B de %Y')}. "
                f"MARCADOR TEMPORAL PARA EL SALUDO: {marcador}."
            )
        elif tipo == "semana":
            fin_semana = fecha_clave + timedelta(days=6)
            return (
                f"Generá el episodio de podcast semanal para la semana del "
                f"{fecha_clave.strftime('%d de %B')} al {fin_semana.strftime('%d de %B de %Y')}."
            )
        else:  # mes
            return (
                f"Generá el episodio de podcast mensual para "
                f"{_MESES_ES[fecha_clave.month]} de {fecha_clave.year}."
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
    ) -> PodcastEpisodio:
        """Pipeline completo para generar un episodio de podcast.

        Args:
            origen: "manual" (usuario pidió), "preview" (adelanto de mañana), "auto" (lazy)
            fecha_objetivo: fecha real para la que se genera el contenido (puede ser mañana)
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

            # 4b. Separar narrativa del bloque de acciones JSON
            guion, acciones = cls._separar_narrativa_acciones(texto_completo)

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
