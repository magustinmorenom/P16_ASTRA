"""Servicio Oráculo — integración con Claude API (Anthropic)."""

from datetime import date, datetime, timedelta
from pathlib import Path
import re

import anthropic
import pytz
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.registro import logger

# Nombres de días y meses en español
_DIAS_ES = [
    "lunes", "martes", "miércoles", "jueves",
    "viernes", "sábado", "domingo",
]
_MESES_ES = [
    "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


# Ruta al system prompt
_RUTA_PROMPT = Path(__file__).parent.parent / "oraculo" / "system_prompt.md"


class ServicioOraculo:
    """Servicio que consulta a Claude para generar respuestas del oráculo."""

    @classmethod
    def _cargar_system_prompt(cls) -> str:
        """Carga el system prompt base desde el archivo markdown."""
        try:
            return _RUTA_PROMPT.read_text(encoding="utf-8")
        except FileNotFoundError:
            logger.warning("system_prompt.md no encontrado, usando prompt por defecto")
            return "Sos el Oráculo ASTRA, un guía espiritual sabio y compasivo."

    @classmethod
    def _generar_contexto_temporal(cls) -> str:
        """Genera la sección de fecha/hora/día actual para el system prompt."""
        ahora = datetime.now(pytz.UTC)
        # Buenos Aires como zona horaria de referencia del usuario
        tz_ar = pytz.timezone("America/Argentina/Buenos_Aires")
        ahora_ar = ahora.astimezone(tz_ar)

        dia_semana = _DIAS_ES[ahora_ar.weekday()]
        mes = _MESES_ES[ahora_ar.month]
        hora_str = ahora_ar.strftime("%H:%M")

        return (
            f"### Fecha y Hora Actual\n"
            f"- Fecha: {dia_semana} {ahora_ar.day} de {mes} de {ahora_ar.year}\n"
            f"- Hora (Argentina): {hora_str}\n"
            f"- Hora UTC: {ahora.strftime('%H:%M')}\n"
            f"- Día de la semana: {dia_semana}\n"
            f"- Día del año: {ahora_ar.timetuple().tm_yday} de 365"
        )

    @classmethod
    def _construir_system(
        cls,
        perfil_cosmico: dict | None = None,
        transitos: dict | None = None,
        analisis_temporal: str | None = None,
    ) -> str:
        """Construye el system prompt completo con contexto del usuario."""
        prompt = cls._cargar_system_prompt()

        # Construir sección de contexto
        secciones_extra = []

        # Fecha y hora actual (siempre se inyecta)
        secciones_extra.append(f"\n## Momento de la Consulta\n{cls._generar_contexto_temporal()}")

        # Perfil cósmico
        if perfil_cosmico:
            resumen = cls._resumir_perfil(perfil_cosmico)
        else:
            resumen = "No hay perfil cósmico disponible."

        # Si hay placeholders, reemplazar; si no, agregar al final
        if "{{PERFIL_COSMICO}}" in prompt:
            prompt = prompt.replace("{{PERFIL_COSMICO}}", resumen)
        else:
            secciones_extra.append(f"\n## Contexto del Consultante\n{resumen}")

        # Tránsitos
        if transitos:
            resumen_transitos = cls._resumir_transitos(transitos)
        else:
            resumen_transitos = "No hay datos de tránsitos disponibles."

        if "{{TRANSITOS}}" in prompt:
            prompt = prompt.replace("{{TRANSITOS}}", resumen_transitos)
        else:
            secciones_extra.append(f"\n## Tránsitos Actuales\n{resumen_transitos}")

        # Análisis temporal (scoring de mejores días/meses)
        if analisis_temporal:
            secciones_extra.append(f"\n{analisis_temporal}")

        if secciones_extra:
            prompt += "\n" + "\n".join(secciones_extra)

        return prompt

    @classmethod
    def _resumir_perfil(cls, perfil: dict) -> str:
        """Genera un resumen textual del perfil cósmico para el prompt."""
        partes = []

        # Datos personales
        datos = perfil.get("datos_personales")
        if datos:
            partes.append("### Datos Personales")
            partes.append(f"- Nombre: {datos.get('nombre', '?')}")
            partes.append(f"- Fecha de nacimiento: {datos.get('fecha_nacimiento', '?')}")
            partes.append(f"- Hora de nacimiento: {datos.get('hora_nacimiento', '?')}")
            partes.append(
                f"- Lugar: {datos.get('ciudad_nacimiento', '?')}, "
                f"{datos.get('pais_nacimiento', '?')}"
            )
            partes.append("")

        # Carta natal
        natal = perfil.get("natal")
        if natal:
            planetas = natal.get("planetas", [])
            sol = next((p for p in planetas if p.get("nombre") == "Sol"), None)
            luna = next((p for p in planetas if p.get("nombre") == "Luna"), None)
            asc_data = natal.get("casas", [{}])
            ascendente = asc_data[0].get("signo") if asc_data else None

            partes.append("### Carta Natal")
            if sol:
                partes.append(f"- Sol en {sol.get('signo', '?')} (casa {sol.get('casa', '?')})")
            if luna:
                partes.append(f"- Luna en {luna.get('signo', '?')} (casa {luna.get('casa', '?')})")
            if ascendente:
                partes.append(f"- Ascendente en {ascendente}")

            # Aspectos principales
            aspectos = natal.get("aspectos", [])
            if aspectos:
                partes.append(f"- {len(aspectos)} aspectos mayores detectados")

        # Diseño Humano
        hd = perfil.get("diseno_humano")
        if hd:
            partes.append("### Diseño Humano")
            partes.append(f"- Tipo: {hd.get('tipo', '?')}")
            partes.append(f"- Autoridad: {hd.get('autoridad', '?')}")
            partes.append(f"- Perfil: {hd.get('perfil', '?')}")
            partes.append(f"- Estrategia: {hd.get('estrategia', '?')}")
            cruz = hd.get("cruz_encarnacion", {})
            if cruz:
                partes.append(f"- Cruz de encarnación: {cruz.get('nombre', '?')}")

        # Numerología
        numero = perfil.get("numerologia")
        if numero:
            partes.append("### Numerología")
            _CLAVES_NUMERO = [
                ("camino_de_vida", "Camino de Vida"),
                ("expresion", "Expresión"),
                ("impulso_del_alma", "Impulso del Alma"),
                ("personalidad", "Personalidad"),
                ("numero_nacimiento", "Número de Nacimiento"),
                ("anio_personal", "Año Personal"),
            ]
            for clave, nombre_display in _CLAVES_NUMERO:
                valor = numero.get(clave)
                if isinstance(valor, dict):
                    partes.append(
                        f"- {nombre_display}: {valor.get('numero', '?')} — {valor.get('descripcion', '')}"
                    )

        return "\n".join(partes) if partes else "Perfil cósmico no disponible."

    @classmethod
    def _resumir_transitos(cls, transitos: dict) -> str:
        """Genera un resumen textual de los tránsitos actuales."""
        planetas = transitos.get("planetas", [])
        if not planetas:
            return "Sin datos de tránsitos."

        partes = []

        # Fecha del cálculo de tránsitos
        fecha_utc = transitos.get("fecha_utc")
        if fecha_utc:
            partes.append(f"Calculados en: {fecha_utc}")

        # Detectar fase lunar (distancia Sol-Luna)
        sol = next((p for p in planetas if p.get("nombre") == "Sol"), None)
        luna = next((p for p in planetas if p.get("nombre") == "Luna"), None)
        if sol and luna:
            lon_sol = sol.get("longitud", 0)
            lon_luna = luna.get("longitud", 0)
            diff = (lon_luna - lon_sol) % 360
            if diff < 15:
                fase = "Luna Nueva"
            elif diff < 85:
                fase = "Luna Creciente"
            elif diff < 95:
                fase = "Cuarto Creciente"
            elif diff < 175:
                fase = "Gibosa Creciente"
            elif diff < 185:
                fase = "Luna Llena"
            elif diff < 265:
                fase = "Gibosa Menguante"
            elif diff < 275:
                fase = "Cuarto Menguante"
            else:
                fase = "Luna Menguante"
            partes.append(f"Fase lunar: {fase}")

        partes.append("")
        for p in planetas:
            nombre = p.get("nombre", "?")
            signo = p.get("signo", "?")
            grado = p.get("grado_en_signo")
            retro = " (R)" if p.get("retrogrado") else ""
            if grado is not None:
                partes.append(f"- {nombre}: {grado:.1f}° {signo}{retro}")
            else:
                partes.append(f"- {nombre}: {signo}{retro}")

        # Próximos días (si disponibles)
        proximos = transitos.get("proximos_dias", [])
        if proximos:
            partes.append("")
            partes.append("### Próximos días")
            for dia in proximos:
                fecha = dia.get("fecha", "?")
                fase = dia.get("fase_lunar", "?")
                planetas_dia = dia.get("planetas", [])
                luna_dia = next((p for p in planetas_dia if p.get("nombre") == "Luna"), None)
                sol_dia = next((p for p in planetas_dia if p.get("nombre") == "Sol"), None)
                resumen_dia = f"- {fecha} — {fase}"
                if luna_dia:
                    resumen_dia += f" · Luna en {luna_dia.get('signo', '?')}"
                if sol_dia:
                    resumen_dia += f" · Sol en {sol_dia.get('signo', '?')}"
                retros = [p.get("nombre") for p in planetas_dia if p.get("retrogrado")]
                if retros:
                    resumen_dia += f" · Retro: {', '.join(retros)}"
                partes.append(resumen_dia)

        return "\n".join(partes)

    # Patrón para detectar bullets con fechas/rangos (ej: "- 10-16 de abril —")
    _RE_BULLET_FECHA = re.compile(
        r"^[-•*]\s*\d{1,2}.*?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)",
        re.IGNORECASE,
    )

    @classmethod
    def _formatear_respuesta_chat(cls, texto: str) -> str:
        """Normaliza la salida del modelo para mantenerla conversacional y breve."""
        if not texto or not texto.strip():
            return "Estoy acá.\nDecime un poco más y lo vemos juntos."

        texto = texto.replace("\r\n", "\n").replace("\r", "\n").strip()
        texto = re.sub(r"```.*?```", "", texto, flags=re.DOTALL)
        # Limpiar negritas y cursivas
        texto = re.sub(r"\*\*(.*?)\*\*", r"\1", texto)
        texto = re.sub(r"\*(.*?)\*", r"\1", texto)

        # Detectar si hay bullets con fechas (respuesta temporal)
        tiene_bullets_fecha = any(
            cls._RE_BULLET_FECHA.match(linea.strip())
            for linea in texto.split("\n")
        )

        if tiene_bullets_fecha:
            return cls._formatear_respuesta_temporal(texto)

        return cls._formatear_respuesta_conversacional(texto)

    @classmethod
    def _formatear_respuesta_temporal(cls, texto: str) -> str:
        """Formatea respuestas con bullets de fechas — preserva estructura."""
        lineas_limpias: list[str] = []
        for linea in texto.split("\n"):
            linea = linea.strip()
            if not linea:
                continue
            # Limpiar headers y quotes
            linea = re.sub(r"^#{1,6}\s*", "", linea)
            linea = re.sub(r"^>\s*", "", linea)
            # Normalizar bullets a "- "
            linea = re.sub(r"^[•*]\s*", "- ", linea)
            linea = re.sub(r"\s+", " ", linea).strip()
            if linea:
                lineas_limpias.append(linea)

        if not lineas_limpias:
            return "Estoy acá.\nDecime un poco más y lo vemos juntos."

        # Eliminar preguntas finales (último línea que termine en ?)
        while lineas_limpias and lineas_limpias[-1].rstrip().endswith("?"):
            lineas_limpias.pop()

        # Limitar a 7 líneas máximo
        return "\n".join(lineas_limpias[:7])

    @classmethod
    def _formatear_respuesta_conversacional(cls, texto: str) -> str:
        """Formatea respuestas conversacionales normales — breve y directo."""
        lineas_limpias: list[str] = []
        for linea in texto.split("\n"):
            linea = linea.strip()
            if not linea:
                continue
            linea = re.sub(r"^#{1,6}\s*", "", linea)
            linea = re.sub(r"^>\s*", "", linea)
            linea = re.sub(r"^[-*•]\s*", "", linea)
            linea = re.sub(r"^\d+\.\s*", "", linea)
            linea = re.sub(r"^[^\wÁÉÍÓÚÜÑáéíóúüñ¿¡]+", "", linea)
            linea = re.sub(r"\s+", " ", linea).strip()
            if linea:
                lineas_limpias.append(linea)

        if not lineas_limpias:
            return "Estoy acá.\nDecime un poco más y lo vemos juntos."

        # Eliminar preguntas finales
        while lineas_limpias and lineas_limpias[-1].rstrip().endswith("?"):
            lineas_limpias.pop()

        if not lineas_limpias:
            return "Estoy acá.\nDecime un poco más y lo vemos juntos."

        texto_plano = " ".join(lineas_limpias)
        segmentos = [
            segmento.strip()
            for segmento in re.split(r"(?<=[.!?])\s+", texto_plano)
            if segmento.strip()
        ]

        if not segmentos:
            segmentos = [texto_plano]

        lineas_finales: list[str] = []
        for segmento in segmentos:
            if len(lineas_finales) >= 5:
                break

            segmento = re.sub(r"\s+", " ", segmento).strip()
            if not segmento:
                continue

            if len(segmento) > 300:
                segmento = segmento[:297].rstrip(" ,;:") + "..."

            lineas_finales.append(segmento)

        if not lineas_finales:
            return "Estoy acá.\nDecime un poco más y lo vemos juntos."

        return "\n".join(lineas_finales[:5])

    @classmethod
    async def _generar_analisis_temporal(
        cls,
        mensaje: str,
        perfil_cosmico: dict | None,
        sesion: AsyncSession | None,
    ) -> str | None:
        """Detecta intent temporal y genera análisis de scoring si aplica."""
        if not sesion:
            return None

        from app.oraculo.detector_intent import detectar_intent

        intent = detectar_intent(mensaje)
        if not intent.es_temporal:
            return None

        logger.info(
            "Intent temporal detectado: area=%s, ventana=%dd, granularidad=%s",
            intent.area, intent.ventana_dias, intent.granularidad,
        )

        from app.datos.repositorio_transito import RepositorioTransito
        from app.oraculo.scorer_transitos import (
            formatear_resumen,
            rankear_dias,
            rankear_meses,
        )

        # Determinar rango de fechas
        hoy = date.today()
        if intent.mes_especifico:
            anio = intent.anio or hoy.year
            fecha_inicio = date(anio, intent.mes_especifico, 1)
            # Último día del mes
            if intent.mes_especifico == 12:
                fecha_fin = date(anio, 12, 31)
            else:
                fecha_fin = date(anio, intent.mes_especifico + 1, 1) - timedelta(days=1)
        elif intent.anio:
            fecha_inicio = date(intent.anio, 1, 1)
            fecha_fin = date(intent.anio, 12, 31)
        else:
            fecha_inicio = hoy
            fecha_fin = hoy + timedelta(days=intent.ventana_dias)

        # Query tránsitos de la DB
        repo = RepositorioTransito(sesion)
        transitos_db = await repo.obtener_rango(fecha_inicio, fecha_fin)

        if not transitos_db:
            return None

        # Convertir a dicts
        transitos_lista = [
            {
                "fecha": t.fecha,
                "planetas": t.planetas,
                "aspectos": t.aspectos,
                "eventos": t.eventos,
                "fase_lunar": t.fase_lunar,
            }
            for t in transitos_db
        ]

        area = intent.area or "carrera"  # default si no detectó área

        # Scorear y rankear
        if intent.granularidad == "mes":
            ranking = rankear_meses(transitos_lista, perfil_cosmico, perfil_cosmico, area)
        else:
            ranking = rankear_dias(transitos_lista, perfil_cosmico, perfil_cosmico, area)

        return formatear_resumen(ranking, area, intent.granularidad)

    @classmethod
    async def consultar(
        cls,
        mensaje_usuario: str,
        perfil_cosmico: dict | None = None,
        transitos: dict | None = None,
        historial: list[dict] | None = None,
        sesion: AsyncSession | None = None,
    ) -> tuple[str, int]:
        """Consulta al oráculo (Claude API).

        Args:
            mensaje_usuario: Texto del mensaje del usuario
            perfil_cosmico: Perfil cósmico completo (natal, HD, numerología)
            transitos: Tránsitos actuales (posiciones del momento)
            historial: Historial de la conversación
            sesion: Sesión de DB (para consultas temporales con scoring)

        Retorna (respuesta_texto, tokens_usados).
        """
        config = obtener_configuracion()

        if not config.anthropic_api_key:
            return "El oráculo no está configurado. Contactá al administrador.", 0

        cliente = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)

        # Log para debug: verificar que los datos personales se inyectan
        if perfil_cosmico and perfil_cosmico.get("datos_personales"):
            dp = perfil_cosmico["datos_personales"]
            logger.info(
                "Oráculo: consultando para %s (nacimiento: %s)",
                dp.get("nombre", "?"),
                dp.get("fecha_nacimiento", "?"),
            )
        else:
            logger.warning("Oráculo: SIN datos personales en perfil_cosmico")

        # Detectar intent temporal y generar análisis de scoring
        analisis_temporal = None
        try:
            analisis_temporal = await cls._generar_analisis_temporal(
                mensaje_usuario, perfil_cosmico, sesion,
            )
        except Exception as e:
            logger.warning("Error generando análisis temporal: %s", e)

        # Construir system prompt
        system_prompt = cls._construir_system(perfil_cosmico, transitos, analisis_temporal)

        # Construir historial de mensajes
        mensajes = []
        if historial:
            for msg in historial:
                rol = "user" if msg.get("rol") == "user" else "assistant"
                mensajes.append({"role": rol, "content": msg.get("contenido", "")})

        # Agregar mensaje actual
        mensajes.append({"role": "user", "content": mensaje_usuario})

        # Si hay análisis temporal, dar más espacio a la respuesta
        max_tokens = 700 if analisis_temporal else 500

        try:
            respuesta = await cliente.messages.create(
                model=config.oraculo_modelo,
                max_tokens=max_tokens,
                temperature=0.7,
                system=system_prompt,
                messages=mensajes,
            )

            texto = respuesta.content[0].text if respuesta.content else ""
            texto = cls._formatear_respuesta_chat(texto)
            tokens_in = respuesta.usage.input_tokens or 0
            tokens_out = respuesta.usage.output_tokens or 0

            return texto, tokens_in + tokens_out, tokens_in, tokens_out

        except anthropic.APIError as e:
            logger.error("Error en API de Anthropic: %s", e)
            return "Disculpá, hubo un error al consultar al oráculo. Intentá de nuevo.", 0, 0, 0
