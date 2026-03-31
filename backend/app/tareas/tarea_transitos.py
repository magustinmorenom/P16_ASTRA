"""Tareas programadas para tránsitos diarios.

- tarea_diaria_transitos: Avanza la ventana deslizante + rota estados (correr a las 00:05 UTC)
- tarea_purga_transitos: Elimina tránsitos con más de 5 años (correr mensualmente)
"""

from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.datos.repositorio_transito import RepositorioTransito
from app.registro import logger
from app.servicios.servicio_transitos_persistidos import (
    purgar_transitos_antiguos,
    verificar_y_completar_ventana,
)


async def tarea_diaria_transitos(sesion_factory: async_sessionmaker[AsyncSession]) -> int:
    """Avanza la ventana y rota estados. Retorna días insertados."""
    async with sesion_factory() as sesion:
        repo = RepositorioTransito(sesion)
        insertados = await verificar_y_completar_ventana(repo)
        await sesion.commit()
    logger.info("Tarea diaria de tránsitos completada: %d insertados", insertados)
    return insertados


async def tarea_purga_transitos(sesion_factory: async_sessionmaker[AsyncSession]) -> int:
    """Purga tránsitos antiguos (>5 años). Retorna filas eliminadas."""
    async with sesion_factory() as sesion:
        repo = RepositorioTransito(sesion)
        eliminados = await purgar_transitos_antiguos(repo)
        await sesion.commit()
    logger.info("Tarea de purga de tránsitos completada: %d eliminados", eliminados)
    return eliminados
