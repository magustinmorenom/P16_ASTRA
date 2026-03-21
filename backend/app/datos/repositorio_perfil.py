"""Repositorio de perfiles — operaciones CRUD."""

import uuid
from datetime import time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.perfil import Perfil


class RepositorioPerfil:
    """Operaciones de base de datos para perfiles."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def crear(
        self,
        nombre: str,
        fecha_nacimiento,
        hora_nacimiento: str,
        ciudad_nacimiento: str,
        pais_nacimiento: str,
        latitud: float | None = None,
        longitud: float | None = None,
        zona_horaria: str | None = None,
    ) -> Perfil:
        """Crea un nuevo perfil."""
        hora = time.fromisoformat(hora_nacimiento)
        perfil = Perfil(
            nombre=nombre,
            fecha_nacimiento=fecha_nacimiento,
            hora_nacimiento=hora,
            ciudad_nacimiento=ciudad_nacimiento,
            pais_nacimiento=pais_nacimiento,
            latitud=latitud,
            longitud=longitud,
            zona_horaria=zona_horaria,
        )
        self.sesion.add(perfil)
        await self.sesion.commit()
        await self.sesion.refresh(perfil)
        return perfil

    async def obtener_por_id(self, perfil_id: uuid.UUID) -> Perfil | None:
        """Obtiene un perfil por su ID."""
        resultado = await self.sesion.execute(
            select(Perfil).where(Perfil.id == perfil_id)
        )
        return resultado.scalar_one_or_none()

    async def listar(self, limite: int = 50, offset: int = 0) -> list[Perfil]:
        """Lista perfiles con paginación."""
        resultado = await self.sesion.execute(
            select(Perfil).order_by(Perfil.creado_en.desc()).limit(limite).offset(offset)
        )
        return list(resultado.scalars().all())

    async def eliminar(self, perfil_id: uuid.UUID) -> bool:
        """Elimina un perfil por su ID."""
        perfil = await self.obtener_por_id(perfil_id)
        if perfil:
            await self.sesion.delete(perfil)
            await self.sesion.commit()
            return True
        return False
