"""Repositorio de episodios de podcast — operaciones CRUD."""

import uuid
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.podcast import PodcastEpisodio

RETENCION_EPISODIOS_PODCAST = {
    "dia": 7,
    "semana": 4,
    "mes": 4,
}
LIMITE_HISTORIAL_PODCAST = sum(RETENCION_EPISODIOS_PODCAST.values())


class RepositorioPodcast:
    """Operaciones de base de datos para episodios de podcast."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def crear_episodio(
        self,
        usuario_id: uuid.UUID,
        fecha: date,
        momento: str,
        titulo: str,
        estado: str = "pendiente",
        origen: str = "manual",
        fecha_objetivo: date | None = None,
    ) -> PodcastEpisodio:
        """Crea un nuevo episodio de podcast."""
        episodio = PodcastEpisodio(
            usuario_id=usuario_id,
            fecha=fecha,
            momento=momento,
            titulo=titulo,
            estado=estado,
            origen=origen,
            fecha_objetivo=fecha_objetivo or fecha,
        )
        self.sesion.add(episodio)
        await self.sesion.commit()
        await self.sesion.refresh(episodio)
        return episodio

    async def obtener_episodio(
        self, usuario_id: uuid.UUID, fecha: date, momento: str
    ) -> PodcastEpisodio | None:
        """Obtiene un episodio por usuario, fecha y momento."""
        resultado = await self.sesion.execute(
            select(PodcastEpisodio).where(
                PodcastEpisodio.usuario_id == usuario_id,
                PodcastEpisodio.fecha == fecha,
                PodcastEpisodio.momento == momento,
            )
        )
        return resultado.scalar_one_or_none()

    async def obtener_episodio_por_id(
        self, episodio_id: uuid.UUID
    ) -> PodcastEpisodio | None:
        """Obtiene un episodio por su ID."""
        resultado = await self.sesion.execute(
            select(PodcastEpisodio).where(PodcastEpisodio.id == episodio_id)
        )
        return resultado.scalar_one_or_none()

    async def obtener_episodios_usuario(
        self, usuario_id: uuid.UUID, fecha: date
    ) -> list[PodcastEpisodio]:
        """Obtiene los episodios de una fecha para un usuario."""
        resultado = await self.sesion.execute(
            select(PodcastEpisodio)
            .where(
                PodcastEpisodio.usuario_id == usuario_id,
                PodcastEpisodio.fecha == fecha,
            )
            .order_by(PodcastEpisodio.creado_en)
        )
        return list(resultado.scalars().all())

    async def obtener_ultimos_episodios(
        self, usuario_id: uuid.UUID, limite: int = LIMITE_HISTORIAL_PODCAST
    ) -> list[PodcastEpisodio]:
        """Obtiene los episodios más recientes de un usuario."""
        resultado = await self.sesion.execute(
            select(PodcastEpisodio)
            .where(
                PodcastEpisodio.usuario_id == usuario_id,
                PodcastEpisodio.estado == "listo",
            )
            .order_by(PodcastEpisodio.fecha.desc(), PodcastEpisodio.creado_en.desc())
            .limit(limite)
        )
        return list(resultado.scalars().all())

    async def normalizar_retencion_usuario(self, usuario_id: uuid.UUID) -> int:
        """Aplica la política de retención por tipo eliminando excedentes."""
        total_eliminados = 0

        for tipo, limite in RETENCION_EPISODIOS_PODCAST.items():
            resultado = await self.sesion.execute(
                select(PodcastEpisodio.id)
                .where(
                    PodcastEpisodio.usuario_id == usuario_id,
                    PodcastEpisodio.momento == tipo,
                )
                .order_by(
                    PodcastEpisodio.fecha.desc(),
                    PodcastEpisodio.creado_en.desc(),
                    PodcastEpisodio.id.desc(),
                )
                .offset(limite)
            )
            ids_a_eliminar = list(resultado.scalars().all())

            if not ids_a_eliminar:
                continue

            await self.sesion.execute(
                delete(PodcastEpisodio).where(PodcastEpisodio.id.in_(ids_a_eliminar))
            )
            total_eliminados += len(ids_a_eliminar)

        if total_eliminados:
            await self.sesion.commit()

        return total_eliminados

    async def actualizar_estado(
        self, episodio_id: uuid.UUID, estado: str, **campos
    ) -> PodcastEpisodio | None:
        """Actualiza el estado y campos opcionales de un episodio."""
        episodio = await self.obtener_episodio_por_id(episodio_id)
        if not episodio:
            return None
        episodio.estado = estado
        for campo, valor in campos.items():
            if hasattr(episodio, campo):
                setattr(episodio, campo, valor)
        await self.sesion.commit()
        await self.sesion.refresh(episodio)
        return episodio
