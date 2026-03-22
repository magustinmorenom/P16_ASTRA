"""Repositorio de planes y precios — operaciones CRUD."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modelos.plan import Plan
from app.modelos.precio_plan import PrecioPlan


class RepositorioPlan:
    """Operaciones de base de datos para planes y precios."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def listar_activos(self) -> list[Plan]:
        """Lista todos los planes activos ordenados por orden."""
        resultado = await self.sesion.execute(
            select(Plan)
            .where(Plan.activo.is_(True))
            .order_by(Plan.orden)
        )
        return list(resultado.scalars().all())

    async def obtener_por_id(self, plan_id: uuid.UUID) -> Plan | None:
        """Obtiene un plan por su ID."""
        resultado = await self.sesion.execute(
            select(Plan).where(Plan.id == plan_id)
        )
        return resultado.scalar_one_or_none()

    async def obtener_por_slug(self, slug: str) -> Plan | None:
        """Obtiene un plan por su slug."""
        resultado = await self.sesion.execute(
            select(Plan).where(Plan.slug == slug)
        )
        return resultado.scalar_one_or_none()

    async def obtener_precios_por_plan(
        self, plan_id: uuid.UUID, pais_codigo: str | None = None
    ) -> list[PrecioPlan]:
        """Obtiene precios de un plan, opcionalmente filtrados por país."""
        consulta = select(PrecioPlan).where(
            PrecioPlan.plan_id == plan_id,
            PrecioPlan.activo.is_(True),
        )
        if pais_codigo:
            consulta = consulta.where(PrecioPlan.pais_codigo == pais_codigo)
        resultado = await self.sesion.execute(consulta)
        return list(resultado.scalars().all())

    async def obtener_precio(
        self, plan_id: uuid.UUID, pais_codigo: str
    ) -> PrecioPlan | None:
        """Obtiene el precio de un plan para un país específico."""
        resultado = await self.sesion.execute(
            select(PrecioPlan).where(
                PrecioPlan.plan_id == plan_id,
                PrecioPlan.pais_codigo == pais_codigo,
                PrecioPlan.activo.is_(True),
            )
        )
        return resultado.scalar_one_or_none()
