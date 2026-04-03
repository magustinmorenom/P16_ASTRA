"""Servicio de generación de perfil espiritual (FODA cósmico).

Genera un análisis FODA personalizado cruzando carta natal, diseño humano
y numerología. Se genera una sola vez por perfil y se persiste en la tabla calculos.
"""

import asyncio
import json
import logging
import uuid
from pathlib import Path

import anthropic
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_perfil import RepositorioPerfil
from app.servicios.servicio_oraculo import ServicioOraculo

logger = logging.getLogger(__name__)

TIPO_CALCULO = "perfil-espiritual"
_PROMPT_PATH = Path(__file__).parent.parent / "oraculo" / "prompt_perfil_espiritual.md"
_MAX_TOKENS_INTENTOS = (2800, 3600)
_TIMEOUT_GENERACION_SEGUNDOS = 90


# ── Schemas de validación ────────────────────────────────────

class ItemFODA(BaseModel):
    titulo: str
    descripcion: str


class FODA(BaseModel):
    fortalezas: list[ItemFODA]
    oportunidades: list[ItemFODA]
    debilidades: list[ItemFODA]
    amenazas: list[ItemFODA]


class PerfilEspiritualSchema(BaseModel):
    resumen: str
    foda: FODA


# ── Servicio ─────────────────────────────────────────────────

class ServicioPerfilEspiritual:
    """Genera y persiste el perfil espiritual FODA de un usuario."""

    @classmethod
    async def obtener_o_generar(
        cls,
        sesion: AsyncSession,
        usuario_id: uuid.UUID,
    ) -> dict:
        """Retorna el perfil espiritual existente o lo genera si no existe."""
        repo_perfil = RepositorioPerfil(sesion)
        perfil = await repo_perfil.obtener_por_usuario(usuario_id)
        if not perfil:
            raise ValueError("El usuario no tiene un perfil creado.")

        repo_calculo = RepositorioCalculo(sesion)

        # Verificar si ya existe
        existente = await repo_calculo.obtener_por_perfil_y_tipo(perfil.id, TIPO_CALCULO)
        if existente:
            return existente.resultado_json

        # Obtener los tres cálculos base
        calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)
        if not calculos.get("natal") or not calculos.get("diseno_humano") or not calculos.get("numerologia"):
            raise ValueError(
                "Se necesitan carta natal, diseño humano y numerología para generar el perfil espiritual."
            )

        # Construir contexto cósmico completo
        perfil_cosmico = dict(calculos)
        perfil_cosmico["datos_personales"] = {
            "nombre": perfil.nombre,
            "fecha_nacimiento": perfil.fecha_nacimiento.isoformat(),
            "hora_nacimiento": perfil.hora_nacimiento.isoformat() if perfil.hora_nacimiento else "12:00",
            "ciudad_nacimiento": perfil.ciudad_nacimiento,
            "pais_nacimiento": perfil.pais_nacimiento,
        }

        # Generar con Claude
        resultado = await cls._generar(sesion, perfil_cosmico, usuario_id)

        # Persistir
        hash_params = f"perfil-espiritual-{perfil.id}"
        await repo_calculo.guardar(
            perfil_id=perfil.id,
            tipo=TIPO_CALCULO,
            hash_parametros=hash_params,
            resultado_json=resultado,
        )

        return resultado

    @classmethod
    async def regenerar(
        cls,
        sesion: AsyncSession,
        usuario_id: uuid.UUID,
    ) -> dict:
        """Elimina el perfil espiritual existente y genera uno nuevo."""
        repo_perfil = RepositorioPerfil(sesion)
        perfil = await repo_perfil.obtener_por_usuario(usuario_id)
        if not perfil:
            raise ValueError("El usuario no tiene un perfil creado.")

        repo_calculo = RepositorioCalculo(sesion)

        # Eliminar existente
        existente = await repo_calculo.obtener_por_perfil_y_tipo(perfil.id, TIPO_CALCULO)
        if existente:
            await sesion.delete(existente)
            await sesion.commit()

        return await cls.obtener_o_generar(sesion, usuario_id)

    @classmethod
    async def _generar(
        cls,
        sesion: AsyncSession,
        perfil_cosmico: dict,
        usuario_id: uuid.UUID,
    ) -> dict:
        """Llama a Claude para generar el FODA espiritual."""
        config = obtener_configuracion()

        if not config.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY no configurada.")

        system_prompt = _PROMPT_PATH.read_text(encoding="utf-8")
        resumen_perfil = ServicioOraculo._resumir_perfil(perfil_cosmico)

        mensaje = (
            f"## Perfil Cósmico Completo\n\n{resumen_perfil}\n\n"
            f"Generá el perfil espiritual con análisis FODA. Respondé SOLO con JSON válido."
        )

        cliente = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)

        ultimo_error_parseo: json.JSONDecodeError | None = None

        for indice_intento, max_tokens in enumerate(_MAX_TOKENS_INTENTOS, start=1):
            try:
                respuesta = await asyncio.wait_for(
                    cliente.messages.create(
                        model=config.oraculo_modelo,
                        max_tokens=max_tokens,
                        temperature=0.5,
                        system=system_prompt,
                        messages=[{"role": "user", "content": mensaje}],
                    ),
                    timeout=_TIMEOUT_GENERACION_SEGUNDOS,
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
                    operacion="perfil_espiritual",
                    tokens_entrada=tokens_in,
                    tokens_salida=tokens_out,
                    modelo=config.oraculo_modelo,
                    metadata_extra={"intento": indice_intento, "max_tokens": max_tokens},
                )

                logger.info(
                    "Perfil espiritual generado — intento %d, %d tokens",
                    indice_intento,
                    tokens_in + tokens_out,
                )

                resultado = cls._parsear_respuesta_modelo(texto)

                # Validar con Pydantic
                validado = PerfilEspiritualSchema(**resultado)
                return validado.model_dump()

            except json.JSONDecodeError as e:
                ultimo_error_parseo = e
                logger.warning(
                    "Perfil espiritual con JSON inválido en intento %d/%d: %s",
                    indice_intento,
                    len(_MAX_TOKENS_INTENTOS),
                    e,
                )

                # Si el modelo llegó al tope, suele indicar truncamiento. Reintentamos con más margen.
                if indice_intento < len(_MAX_TOKENS_INTENTOS):
                    continue

            except asyncio.TimeoutError as e:
                logger.error("Timeout generando perfil espiritual: %s", e)
                raise ValueError(
                    "La generación del perfil espiritual tardó demasiado. Reintentá en unos segundos."
                ) from e
            except anthropic.APIError as e:
                logger.error("Error en API de Anthropic para perfil espiritual: %s", e)
                raise ValueError("Error generando perfil espiritual con el servicio de IA.") from e

        if ultimo_error_parseo:
            logger.error("Error parseando JSON del perfil espiritual tras reintentos: %s", ultimo_error_parseo)
            raise ValueError("La respuesta del análisis llegó incompleta. Reintentá la generación.")

        raise ValueError("No se pudo generar el perfil espiritual.")

    @staticmethod
    def _parsear_respuesta_modelo(texto: str) -> dict:
        """Normaliza la salida del modelo y extrae el JSON útil."""
        texto_limpio = texto.strip()
        if texto_limpio.startswith("```"):
            lineas = texto_limpio.split("\n")
            lineas = [l for l in lineas if not l.strip().startswith("```")]
            texto_limpio = "\n".join(lineas).strip()

        inicio_json = texto_limpio.find("{")
        fin_json = texto_limpio.rfind("}")
        if inicio_json != -1 and fin_json != -1 and fin_json > inicio_json:
            texto_limpio = texto_limpio[inicio_json:fin_json + 1]

        return json.loads(texto_limpio)
