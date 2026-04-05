"""Repositorio de cálculos — persistencia de resultados."""

import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.calculo import Calculo


class RepositorioCalculo:
    """Operaciones de base de datos para cálculos."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def guardar(
        self,
        perfil_id: uuid.UUID | None,
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

    async def obtener_por_perfil_y_tipo(
        self,
        perfil_id: uuid.UUID,
        tipo: str,
    ) -> Calculo | None:
        """Devuelve el cálculo más reciente de un tipo para un perfil."""
        resultado = await self.sesion.execute(
            select(Calculo)
            .where(Calculo.perfil_id == perfil_id, Calculo.tipo == tipo)
            .order_by(Calculo.calculado_en.desc())
            .limit(1)
        )
        return resultado.scalar_one_or_none()

    async def eliminar_todos_por_perfil(self, perfil_id: uuid.UUID) -> list[str]:
        """Elimina todos los cálculos de un perfil. Retorna los hash_parametros para invalidar cache."""
        resultado = await self.sesion.execute(
            select(Calculo.hash_parametros).where(Calculo.perfil_id == perfil_id)
        )
        hashes = list(resultado.scalars().all())

        await self.sesion.execute(
            delete(Calculo).where(Calculo.perfil_id == perfil_id)
        )
        await self.sesion.commit()
        return hashes

    # Mapeo de tipo interno (inglés) a clave de respuesta (español)
    _MAPA_CLAVES: dict[str, str] = {
        "natal": "natal",
        "human-design": "diseno_humano",
        "numerology": "numerologia",
        "solar-return": "retorno_solar",
        "perfil-espiritual": "perfil_espiritual",
    }

    async def obtener_todos_por_perfil(
        self,
        perfil_id: uuid.UUID,
    ) -> dict[str, dict | None]:
        """Devuelve un dict con el cálculo más reciente de cada tipo para un perfil."""
        resultado: dict[str, dict | None] = {}
        for tipo, clave in self._MAPA_CLAVES.items():
            calculo = await self.obtener_por_perfil_y_tipo(perfil_id, tipo)
            resultado[clave] = calculo.resultado_json if calculo else None
        return resultado
