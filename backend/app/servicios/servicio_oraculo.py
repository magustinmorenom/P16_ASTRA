"""Servicio Oráculo — integración con Claude API (Anthropic)."""

import json
import os
from pathlib import Path

import anthropic

from app.configuracion import obtener_configuracion
from app.registro import logger


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
    def _construir_system(
        cls,
        perfil_cosmico: dict | None = None,
        transitos: dict | None = None,
    ) -> str:
        """Construye el system prompt completo con contexto del usuario."""
        prompt = cls._cargar_system_prompt()

        # Reemplazar placeholders con datos reales
        if perfil_cosmico:
            resumen = cls._resumir_perfil(perfil_cosmico)
            prompt = prompt.replace("{{PERFIL_COSMICO}}", resumen)
        else:
            prompt = prompt.replace(
                "{{PERFIL_COSMICO}}", "No hay perfil cósmico disponible."
            )

        if transitos:
            resumen_transitos = cls._resumir_transitos(transitos)
            prompt = prompt.replace("{{TRANSITOS}}", resumen_transitos)
        else:
            prompt = prompt.replace(
                "{{TRANSITOS}}", "No hay datos de tránsitos disponibles."
            )

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
        partes = []
        planetas = transitos.get("planetas", [])
        for p in planetas:
            nombre = p.get("nombre", "?")
            signo = p.get("signo", "?")
            grado = p.get("grado_en_signo")
            retro = " (R)" if p.get("retrogrado") else ""
            if grado is not None:
                partes.append(f"- {nombre}: {grado:.1f}° {signo}{retro}")
            else:
                partes.append(f"- {nombre}: {signo}{retro}")

        return "\n".join(partes) if partes else "Sin datos de tránsitos."

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
