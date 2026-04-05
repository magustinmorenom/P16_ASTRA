"""Endpoints del perfil espiritual (FODA cósmico)."""

import asyncio
import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencias_auth import obtener_usuario_actual
from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_perfil import RepositorioPerfil
from app.excepciones import CosmicEngineError
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/perfil-espiritual", tags=["Perfil Espiritual"])

# Set de usuario_ids que están generando (evita duplicados)
_generando: set[str] = set()
_errores_generacion: dict[str, str] = {}


async def _generar_en_background(usuario_id: uuid.UUID) -> None:
    """Genera el perfil espiritual en background con su propia sesión DB."""
    uid_str = str(usuario_id)
    try:
        from app.datos.sesion import crear_motor_async, crear_sesion_factory
        from app.servicios.servicio_perfil_espiritual import ServicioPerfilEspiritual

        motor = crear_motor_async()
        factory = crear_sesion_factory(motor)
        async with factory() as sesion:
            await ServicioPerfilEspiritual.obtener_o_generar(sesion, usuario_id)
        await motor.dispose()
        _errores_generacion.pop(uid_str, None)
        logger.info("Perfil espiritual generado para usuario %s", uid_str)
    except Exception as e:
        _errores_generacion[uid_str] = str(e)
        logger.error("Error generando perfil espiritual para %s: %s", uid_str, e)
    finally:
        _generando.discard(uid_str)


@router.get("")
async def obtener_perfil_espiritual(
    background_tasks: BackgroundTasks,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Retorna el perfil espiritual. Si no existe, dispara generación en background."""
    repo_perfil = RepositorioPerfil(db)
    perfil = await repo_perfil.obtener_por_usuario(usuario.id)
    if not perfil:
        raise CosmicEngineError("El usuario no tiene un perfil creado.", codigo=422)

    repo_calculo = RepositorioCalculo(db)

    # Verificar si ya existe
    existente = await repo_calculo.obtener_por_perfil_y_tipo(perfil.id, "perfil-espiritual")
    if existente:
        return {
            "exito": True,
            "datos": {
                "estado": "listo",
                **existente.resultado_json,
            },
        }

    uid_str = str(usuario.id)
    error_previo = _errores_generacion.get(uid_str)
    if error_previo and uid_str not in _generando:
        raise CosmicEngineError(error_previo, codigo=500)

    # Verificar que tenga los 3 cálculos base
    calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)
    if not calculos.get("natal") or not calculos.get("diseno_humano") or not calculos.get("numerologia"):
        raise CosmicEngineError(
            "Completá tu carta natal, diseño humano y numerología primero.",
            codigo=422,
        )

    # Disparar generación en background si no está ya en proceso
    if uid_str not in _generando:
        _errores_generacion.pop(uid_str, None)
        _generando.add(uid_str)
        background_tasks.add_task(_generar_en_background, usuario.id)

    return {"exito": True, "datos": {"estado": "generando"}}


@router.post("/regenerar")
async def regenerar_perfil_espiritual(
    background_tasks: BackgroundTasks,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Regenera el perfil espiritual (elimina el anterior)."""
    repo_perfil = RepositorioPerfil(db)
    perfil = await repo_perfil.obtener_por_usuario(usuario.id)
    if not perfil:
        raise CosmicEngineError("El usuario no tiene un perfil creado.", codigo=422)

    repo_calculo = RepositorioCalculo(db)
    existente = await repo_calculo.obtener_por_perfil_y_tipo(perfil.id, "perfil-espiritual")
    if existente:
        await db.delete(existente)
        await db.commit()

    uid_str = str(usuario.id)
    _errores_generacion.pop(uid_str, None)
    if uid_str not in _generando:
        _generando.add(uid_str)
        background_tasks.add_task(_generar_en_background, usuario.id)

    return {"exito": True, "datos": {"estado": "generando"}}
