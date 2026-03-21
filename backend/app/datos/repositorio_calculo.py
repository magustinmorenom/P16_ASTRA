"""Repositorio de cálculos — persistencia de resultados."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.calculo import Calculo


class RepositorioCalculo:
    """Operaciones de base de datos para cálculos."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def guardar(
        self,
        perfil_id: uuid.UUID,
        tipo: str,
        hash_parametros: str,
        resultado_json: dict,
    ) -> Calculo:
        """Guarda un resultado de cálculo."""
        calculo = Calculo(
            perfil_id=perfil_id,
            tipo=tipo,
            hash_parametros=hash_parametros,
            resultado_json=resultado_json,
        )
        self.sesion.add(calculo)
        await self.sesion.commit()
        await self.sesion.refresh(calculo)
        return calculo

    async def obtener_por_hash(self, hash_parametros: str) -> Calculo | None:
        """Busca un cálculo por su hash de parámetros."""
        resultado = await self.sesion.execute(
            select(Calculo).where(Calculo.hash_parametros == hash_parametros)
        )
        return resultado.scalar_one_or_none()

    async def listar_por_perfil(
        self,
        perfil_id: uuid.UUID,
        tipo: str | None = None,
    ) -> list[Calculo]:
        """Lista cálculos de un perfil, opcionalmente filtrados por tipo."""
        query = select(Calculo).where(Calculo.perfil_id == perfil_id)
        if tipo:
            query = query.where(Calculo.tipo == tipo)
        query = query.order_by(Calculo.calculado_en.desc())
        resultado = await self.sesion.execute(query)
        return list(resultado.scalars().all())
