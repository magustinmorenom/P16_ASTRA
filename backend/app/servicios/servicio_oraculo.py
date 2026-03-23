"""Servicio Oráculo — integración con Claude API (Anthropic)."""

import json
import locale
import os
from datetime import datetime
from pathlib import Path

import anthropic
import pytz

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
            nums = numero.get("numeros", {})
            if isinstance(nums, dict):
                for clave, valor in nums.items():
                    if isinstance(valor, dict):
                        partes.append(
                            f"- {valor.get('nombre', clave)}: {valor.get('valor', '?')}"
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

        return "\n".join(partes)

    @classmethod
    async def consultar(
        cls,
        mensaje_usuario: str,
        perfil_cosmico: dict | None = None,
        transitos: dict | None = None,
        historial: list[dict] | None = None,
    ) -> tuple[str, int]:
        """Consulta al oráculo (Claude API).

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

        # Construir system prompt
        system_prompt = cls._construir_system(perfil_cosmico, transitos)

        # Construir historial de mensajes
        mensajes = []
        if historial:
            for msg in historial:
                rol = "user" if msg.get("rol") == "user" else "assistant"
                mensajes.append({"role": rol, "content": msg.get("contenido", "")})

        # Agregar mensaje actual
        mensajes.append({"role": "user", "content": mensaje_usuario})

        try:
            respuesta = await cliente.messages.create(
                model=config.anthropic_modelo,
                max_tokens=1024,
                temperature=0.7,
                system=system_prompt,
                messages=mensajes,
            )

            texto = respuesta.content[0].text if respuesta.content else ""
            tokens = (respuesta.usage.input_tokens or 0) + (respuesta.usage.output_tokens or 0)

            return texto, tokens

        except anthropic.APIError as e:
            logger.error("Error en API de Anthropic: %s", e)
            return "Disculpá, hubo un error al consultar al oráculo. Intentá de nuevo.", 0
