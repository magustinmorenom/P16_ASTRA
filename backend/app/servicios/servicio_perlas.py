"""Servicio Perlas del día — genera aforismos breves personalizados con Haiku.

Las perlas son recordatorios íntimos del SER del usuario, basados solo en su
perfil estático (carta natal + Human Design + numerología). NO usan tránsitos,
NO usan jerga astrológica, NO mencionan planetas/casas/puertas/números.

Tono según país de nacimiento:
- Argentina → voseo (recordá, vos, sos, tenés)
- Resto       → neutro latino (recuerda, tú, eres, tienes)
"""

from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timedelta
from typing import Any

import anthropic

from app.nucleo.utilidades_fecha import dia_arg_actual
import pytz
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_perfil import RepositorioPerfil
from app.registro import logger
from app.servicios.perlas_fallback import obtener_terna_del_dia
from app.servicios.servicio_oraculo import ServicioOraculo

_TZ_AR = pytz.timezone("America/Argentina/Buenos_Aires")

_PAISES_VOSEO = {
    "argentina",
    "república argentina",
    "republica argentina",
    "ar",
    "arg",
}

_LARGO_MAX_PERLA = 80  # margen sobre el target de 70 chars
_LARGO_MIN_PERLA = 15
_CANTIDAD_PERLAS = 3


class ServicioPerlas:
    """Genera y cachea las perlas del día para un usuario."""

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _es_voseo(pais_nacimiento: str | None) -> bool:
        if not pais_nacimiento:
            return False
        return pais_nacimiento.strip().lower() in _PAISES_VOSEO

    @staticmethod
    def _calcular_ttl_hasta_medianoche() -> int:
        """Segundos hasta medianoche ARG + 1h de gracia (mismo patrón que pronóstico)."""
        ahora = datetime.now(_TZ_AR)
        medianoche = ahora.replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)
        return int((medianoche - ahora).total_seconds()) + 3600

    @classmethod
    async def _obtener_contexto(
        cls, sesion: AsyncSession, usuario_id: uuid.UUID
    ) -> dict | None:
        """Carga el perfil cósmico completo (mismo patrón que pronóstico/oráculo)."""
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

    @staticmethod
    def _construir_system_prompt(es_voseo: bool) -> str:
        if es_voseo:
            voz = (
                "Escribís en VOSEO ARGENTINO. Pronombres: vos, tu, te, tuyo. "
                "Verbos: tenés, sos, podés, recordá, intuís, sentís, sabés. "
                "Aperturas frecuentes: 'Recordá que vos…', 'Vos normalmente…', "
                "'Tu forma de…', 'Lo que vos…'."
            )
        else:
            voz = (
                "Escribes en ESPAÑOL NEUTRO LATINO. Pronombres: tú, tu, ti, tuyo. "
                "Verbos: tienes, eres, puedes, recuerda, intuyes, sientes, sabes. "
                "Aperturas frecuentes: 'Recuerda que tú…', 'Tú normalmente…', "
                "'Tu forma de…', 'Lo que tú…'."
            )

        return f"""Sos Astra, una voz íntima que le recuerda al usuario quién es en esencia.

Tu tarea: generar exactamente 3 PERLAS del día para esta persona.

# Qué es una perla
Una perla es un AFORISMO breve (máximo 70 caracteres) que captura una verdad esencial sobre el SER del usuario. Es un recordatorio íntimo, no un consejo, no un dato.

# Reglas estrictas
1. Cada perla debe ser ≤ 70 caracteres. Sin excepciones.
2. {voz}
3. NUNCA menciones: planetas, signos, casas, aspectos, puertas, centros, canales, números (1-33), tipos HD (Generador, Manifestador…), jerga astrológica o numerológica.
4. NUNCA hables del día de hoy, del momento actual, de tránsitos, de la luna o de eventos cósmicos.
5. NUNCA uses signos de exclamación. Tono afirmativo, calmado, íntimo.
6. Cada perla toca una dimensión distinta: una sobre la MENTE (cómo piensa), una sobre la ACCIÓN (cómo se mueve en el mundo), una sobre la EMOCIÓN (cómo siente).
7. Inspirate en el perfil que te paso pero NUNCA reveles los datos técnicos. La perla nace del dato, no lo cita.
8. Ninguna perla puede ser genérica. Si la perla podría aplicarle a cualquiera, no sirve.

# Anti-ejemplos (lo que NO querés generar)
- "Tu Mercurio en casa 12 piensa en silencio." (jerga visible)
- "Sos Sagitario, sos un líder." (genérico, obvio)
- "Hoy es un buen día para reflexionar." (habla del día)
- "Tu carta natal tiene 10 planetas." (dato muerto)

# Ejemplos del registro correcto (en {('voseo' if es_voseo else 'neutro')})
{cls._ejemplos_inline(es_voseo)}

# Formato de respuesta
Devolvé EXCLUSIVAMENTE un objeto JSON válido con esta forma exacta:
{{"perlas": ["perla 1", "perla 2", "perla 3"]}}

Sin texto antes ni después. Sin markdown. Sin explicaciones."""

    @staticmethod
    def _ejemplos_inline(es_voseo: bool) -> str:
        if es_voseo:
            return (
                "- Recordá que tu silencio es estrategia, no ausencia.\n"
                "- Vos llegás más lejos cuando esperás la pregunta.\n"
                "- Lo que vos intuís primero suele ser lo correcto.\n"
                "- Tu lentitud no es duda, es precisión.\n"
                "- Vos sos de los que recuerdan todo, incluso lo que decidieron olvidar."
            )
        return (
            "- Recuerda que tu silencio es estrategia, no ausencia.\n"
            "- Tú llegas más lejos cuando esperas la pregunta.\n"
            "- Lo que tú intuyes primero suele ser lo correcto.\n"
            "- Tu lentitud no es duda, es precisión.\n"
            "- Tú eres de los que recuerdan todo, incluso lo que decidieron olvidar."
        )

    @staticmethod
    def _validar_perlas(crudas: Any) -> list[str] | None:
        """Valida la lista devuelta por Haiku.

        Reglas: lista de strings, 2 o 3 ítems, cada uno con largo razonable
        y sin caracteres de exclamación o comillas raras.
        """
        if not isinstance(crudas, list):
            return None

        validas: list[str] = []
        for item in crudas:
            if not isinstance(item, str):
                continue
            limpio = item.strip().strip('"\'')
            if not limpio:
                continue
            if len(limpio) < _LARGO_MIN_PERLA or len(limpio) > _LARGO_MAX_PERLA:
                continue
            if "!" in limpio or "¡" in limpio:
                continue
            validas.append(limpio)

        if len(validas) < 2:
            return None
        return validas[:_CANTIDAD_PERLAS]

    # ------------------------------------------------------------------
    # API pública
    # ------------------------------------------------------------------

    @classmethod
    async def obtener_perlas_diarias(
        cls,
        sesion: AsyncSession,
        redis: Redis,
        usuario_id: uuid.UUID,
        fecha: date | None = None,
    ) -> dict:
        """Devuelve las perlas del día para el usuario, con cache 24h.

        Si Haiku falla o no hay API key, cae a una terna curada estática
        determinista por (usuario, fecha) para evitar parpadeos.
        """
        fecha_obj = fecha or dia_arg_actual()
        clave_cache = f"cosmic:perlas:diaria:{usuario_id}:{fecha_obj.isoformat()}"

        # 1. Cache HIT
        try:
            crudo = await redis.get(clave_cache)
            if crudo:
                logger.debug("Perlas diarias cache HIT: %s", clave_cache)
                return json.loads(crudo)
        except Exception as e:
            logger.warning("Error leyendo cache perlas: %s", e)

        # 2. Contexto del usuario
        contexto = await cls._obtener_contexto(sesion, usuario_id)
        if not contexto:
            # Sin perfil → fallback genérico neutro
            terna = obtener_terna_del_dia(False, str(usuario_id), fecha_obj)
            return {
                "perlas": terna,
                "fuente": "curado",
                "tono": "neutro",
            }

        pais = contexto.get("datos_personales", {}).get("pais_nacimiento")
        es_voseo = cls._es_voseo(pais)
        tono = "voseo" if es_voseo else "neutro"

        # 3. Generar con Haiku (o fallback)
        config = obtener_configuracion()
        resultado: dict | None = None

        if config.anthropic_api_key:
            try:
                resumen_perfil = ServicioOraculo._resumir_perfil(contexto)
                system_prompt = cls._construir_system_prompt(es_voseo)
                mensaje_usuario = (
                    f"Generá 3 perlas para esta persona basándote en su perfil. "
                    f"Recordá: máximo 70 caracteres cada una, sin jerga, sin tránsitos, "
                    f"sin signos de exclamación.\n\n"
                    f"# Perfil\n{resumen_perfil}"
                )

                cliente = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
                respuesta = await cliente.messages.create(
                    model=config.oraculo_modelo,
                    max_tokens=300,
                    temperature=1.0,
                    system=system_prompt,
                    messages=[{"role": "user", "content": mensaje_usuario}],
                )

                texto = respuesta.content[0].text if respuesta.content else ""
                tokens_in = respuesta.usage.input_tokens or 0
                tokens_out = respuesta.usage.output_tokens or 0
                logger.info(
                    "Perlas generadas — usuario=%s tokens=%d/%d tono=%s",
                    usuario_id,
                    tokens_in,
                    tokens_out,
                    tono,
                )

                # Registrar consumo (best-effort)
                try:
                    from app.servicios.servicio_consumo_api import registrar_consumo

                    await registrar_consumo(
                        sesion,
                        usuario_id=usuario_id,
                        servicio="anthropic",
                        operacion="perlas_diaria",
                        tokens_entrada=tokens_in,
                        tokens_salida=tokens_out,
                        modelo=config.oraculo_modelo,
                    )
                except Exception as exc:
                    logger.warning("No se pudo registrar consumo de perlas: %s", exc)

                # Parsear JSON
                texto_limpio = texto.strip()
                inicio = texto_limpio.find("{")
                fin = texto_limpio.rfind("}")
                if inicio != -1 and fin > inicio:
                    parseado = json.loads(texto_limpio[inicio : fin + 1])
                    perlas = cls._validar_perlas(parseado.get("perlas"))
                    if perlas:
                        resultado = {
                            "perlas": perlas,
                            "fuente": "haiku",
                            "tono": tono,
                        }
                    else:
                        logger.warning(
                            "Perlas inválidas tras parseo — cayendo a fallback. Crudo: %r",
                            parseado,
                        )
            except anthropic.APIError as exc:
                logger.error("Anthropic falló generando perlas: %s", exc)
            except json.JSONDecodeError as exc:
                logger.error("Perlas: JSON inválido: %s", exc)
            except Exception as exc:
                logger.error("Error inesperado generando perlas: %s", exc)

        # 4. Fallback determinista
        if resultado is None:
            terna = obtener_terna_del_dia(es_voseo, str(usuario_id), fecha_obj)
            resultado = {
                "perlas": terna,
                "fuente": "curado",
                "tono": tono,
            }

        # 5. Guardar en cache
        try:
            ttl = cls._calcular_ttl_hasta_medianoche()
            await redis.setex(
                clave_cache,
                ttl,
                json.dumps(resultado, ensure_ascii=False),
            )
        except Exception as exc:
            logger.warning("Error guardando perlas en cache: %s", exc)

        return resultado
