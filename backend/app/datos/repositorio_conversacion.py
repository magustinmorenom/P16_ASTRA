"""Repositorio de conversaciones del oráculo — persistencia."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.conversacion_oraculo import ConversacionOraculo


class RepositorioConversacion:
    """Operaciones de base de datos para conversaciones del oráculo."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def obtener_o_crear_activa(
        self, usuario_id: uuid.UUID, telegram_id: int
    ) -> ConversacionOraculo:
        """Obtiene la conversación activa o crea una nueva."""
        resultado = await self.sesion.execute(
            select(ConversacionOraculo).where(
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.telegram_id == telegram_id,
                ConversacionOraculo.activa.is_(True),
            ).order_by(ConversacionOraculo.creado_en.desc()).limit(1)
        )
        conversacion = resultado.scalar_one_or_none()

        if not conversacion:
            conversacion = ConversacionOraculo(
                usuario_id=usuario_id,
                telegram_id=telegram_id,
                mensajes=[],
            )
            self.sesion.add(conversacion)
            await self.sesion.commit()
            await self.sesion.refresh(conversacion)

        return conversacion

    async def agregar_mensaje(
        self,
        conversacion_id: uuid.UUID,
        rol: str,
        contenido: str,
        tokens: int = 0,
    ) -> None:
        """Agrega un mensaje al historial de la conversación."""
        resultado = await self.sesion.execute(
            select(ConversacionOraculo).where(
                ConversacionOraculo.id == conversacion_id
            )
        )
        conversacion = resultado.scalar_one_or_none()
        if not conversacion:
            return

        mensajes = list(conversacion.mensajes) if conversacion.mensajes else []
        mensajes.append({
            "rol": rol,
            "contenido": contenido,
            "fecha": datetime.now(timezone.utc).isoformat(),
        })
        conversacion.mensajes = mensajes
        conversacion.tokens_usados = (conversacion.tokens_usados or 0) + tokens

        await self.sesion.commit()

    async def obtener_historial(
        self, conversacion_id: uuid.UUID, limite: int = 20
    ) -> list[dict]:
        """Devuelve los últimos N mensajes de la conversación."""
        resultado = await self.sesion.execute(
            select(ConversacionOraculo).where(
                ConversacionOraculo.id == conversacion_id
            )
        )
        conversacion = resultado.scalar_one_or_none()
        if not conversacion or not conversacion.mensajes:
            return []

        return conversacion.mensajes[-limite:]

    async def nueva_conversacion(
        self, usuario_id: uuid.UUID, telegram_id: int
    ) -> ConversacionOraculo:
        """Marca la conversación activa como inactiva y crea una nueva."""
        # Desactivar conversaciones previas
        await self.sesion.execute(
            update(ConversacionOraculo)
            .where(
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.telegram_id == telegram_id,
                ConversacionOraculo.activa.is_(True),
            )
            .values(activa=False)
        )

        # Crear nueva
        conversacion = ConversacionOraculo(
            usuario_id=usuario_id,
            telegram_id=telegram_id,
            mensajes=[],
        )
        self.sesion.add(conversacion)
        await self.sesion.commit()
        await self.sesion.refresh(conversacion)
        return conversacion

    # ── Chat Web ──────────────────────────────────────────────

    async def obtener_o_crear_web(
        self, usuario_id: uuid.UUID
    ) -> ConversacionOraculo:
        """Obtiene la conversación web activa o crea una nueva."""
        resultado = await self.sesion.execute(
            select(ConversacionOraculo).where(
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
                ConversacionOraculo.activa.is_(True),
            ).order_by(ConversacionOraculo.creado_en.desc()).limit(1)
        )
        conversacion = resultado.scalar_one_or_none()

        if not conversacion:
            conversacion = ConversacionOraculo(
                usuario_id=usuario_id,
                canal="web",
                mensajes=[],
            )
            self.sesion.add(conversacion)
            await self.sesion.commit()
            await self.sesion.refresh(conversacion)

        return conversacion

    async def nueva_conversacion_web(
        self, usuario_id: uuid.UUID
    ) -> ConversacionOraculo:
        """Archiva conversación web activa y crea una nueva."""
        await self.sesion.execute(
            update(ConversacionOraculo)
            .where(
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
                ConversacionOraculo.activa.is_(True),
            )
            .values(activa=False)
        )

        conversacion = ConversacionOraculo(
            usuario_id=usuario_id,
            canal="web",
            mensajes=[],
        )
        self.sesion.add(conversacion)
        await self.sesion.commit()
        await self.sesion.refresh(conversacion)
        return conversacion
