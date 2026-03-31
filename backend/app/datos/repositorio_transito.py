"""Repositorio de tránsitos diarios — persistencia de ventana deslizante."""

from datetime import date

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.transito_diario import TransitoDiario


class RepositorioTransito:
    """Operaciones de base de datos para tránsitos diarios."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def obtener_por_fecha(self, fecha: date) -> TransitoDiario | None:
        """Obtiene el tránsito de una fecha específica."""
        resultado = await self.sesion.execute(
            select(TransitoDiario).where(TransitoDiario.fecha == fecha)
        )
        return resultado.scalar_one_or_none()

    async def obtener_rango(
        self, fecha_inicio: date, fecha_fin: date
    ) -> list[TransitoDiario]:
        """Obtiene tránsitos de un rango de fechas, ordenados cronológicamente."""
        resultado = await self.sesion.execute(
            select(TransitoDiario)
            .where(TransitoDiario.fecha >= fecha_inicio, TransitoDiario.fecha <= fecha_fin)
            .order_by(TransitoDiario.fecha)
        )
        return list(resultado.scalars().all())

    async def obtener_futuros(self, limite: int = 30) -> list[TransitoDiario]:
        """Obtiene los próximos N días con estado 'futuro'."""
        resultado = await self.sesion.execute(
            select(TransitoDiario)
            .where(TransitoDiario.estado == "futuro")
            .order_by(TransitoDiario.fecha)
            .limit(limite)
        )
        return list(resultado.scalars().all())

    async def obtener_pasados(self, limite: int = 30) -> list[TransitoDiario]:
        """Obtiene los últimos N días con estado 'pasado'."""
        resultado = await self.sesion.execute(
            select(TransitoDiario)
            .where(TransitoDiario.estado == "pasado")
            .order_by(TransitoDiario.fecha.desc())
            .limit(limite)
        )
        return list(resultado.scalars().all())

    async def crear(self, transito: TransitoDiario) -> TransitoDiario:
        """Inserta un tránsito diario."""
        self.sesion.add(transito)
        await self.sesion.flush()
        return transito

    async def crear_lote(self, datos: list[dict]) -> int:
        """Inserta un lote de tránsitos usando INSERT ... ON CONFLICT DO NOTHING.

        Retorna la cantidad de filas insertadas.
        """
        if not datos:
            return 0

        stmt = pg_insert(TransitoDiario).values(datos).on_conflict_do_nothing(index_elements=["fecha"])
        resultado = await self.sesion.execute(stmt)
        await self.sesion.flush()
        return resultado.rowcount

    async def actualizar_estados(self, fecha_hoy: date) -> None:
        """Rota los estados: pasado / presente / futuro según la fecha de hoy."""
        # Marcar pasados
        await self.sesion.execute(
            update(TransitoDiario)
            .where(TransitoDiario.fecha < fecha_hoy, TransitoDiario.estado != "pasado")
            .values(estado="pasado")
        )
        # Marcar presente
        await self.sesion.execute(
            update(TransitoDiario)
            .where(TransitoDiario.fecha == fecha_hoy)
            .values(estado="presente")
        )
        # Asegurar futuros
        await self.sesion.execute(
            update(TransitoDiario)
            .where(TransitoDiario.fecha > fecha_hoy, TransitoDiario.estado != "futuro")
            .values(estado="futuro")
        )
        await self.sesion.flush()

    async def purgar_antiguos(self, fecha_limite: date) -> int:
        """Elimina tránsitos anteriores a fecha_limite. Retorna filas eliminadas."""
        resultado = await self.sesion.execute(
            delete(TransitoDiario).where(TransitoDiario.fecha < fecha_limite)
        )
        await self.sesion.flush()
        return resultado.rowcount

    async def obtener_ultima_fecha_futuro(self) -> date | None:
        """Retorna la fecha más lejana con estado 'futuro'."""
        resultado = await self.sesion.execute(
            select(func.max(TransitoDiario.fecha)).where(
                TransitoDiario.estado == "futuro"
            )
        )
        return resultado.scalar_one_or_none()

    async def obtener_primera_fecha(self) -> date | None:
        """Retorna la fecha más antigua en la tabla."""
        resultado = await self.sesion.execute(
            select(func.min(TransitoDiario.fecha))
        )
        return resultado.scalar_one_or_none()

    async def contar(self) -> int:
        """Retorna la cantidad total de filas."""
        resultado = await self.sesion.execute(
            select(func.count(TransitoDiario.id))
        )
        return resultado.scalar_one()
