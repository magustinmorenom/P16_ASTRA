"""Repositorio de conversaciones del oráculo — persistencia."""

import uuid
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import delete as sa_delete, desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.conversacion_oraculo import ConversacionOraculo

# Zona horaria de referencia para el "corte de día" del chat.
# El producto apunta a Argentina, por lo que el día natural es ARG.
_TZ_ARG = ZoneInfo("America/Argentina/Buenos_Aires")


def _dia_arg_de_iso(iso_ts: str | None) -> date | None:
    """Devuelve la fecha (en hora ARG) de un timestamp ISO, o None si inválido."""
    if not iso_ts:
        return None
    try:
        dt = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(_TZ_ARG).date()


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
        """Obtiene la conversación web activa o crea una nueva.

        Si la conversación activa tiene mensajes de un día previo (hora ARG),
        se desactiva y se crea una nueva — el corte de día fuerza sesión
        fresca para que el usuario no retome conversaciones viejas al entrar.
        """
        resultado = await self.sesion.execute(
            select(ConversacionOraculo).where(
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
                ConversacionOraculo.activa.is_(True),
            ).order_by(ConversacionOraculo.creado_en.desc()).limit(1)
        )
        conversacion = resultado.scalar_one_or_none()

        if conversacion and conversacion.mensajes:
            ultimo = conversacion.mensajes[-1].get("fecha")
            dia_ultimo = _dia_arg_de_iso(ultimo)
            hoy_arg = datetime.now(_TZ_ARG).date()
            if dia_ultimo is not None and dia_ultimo != hoy_arg:
                conversacion.activa = False
                await self.sesion.commit()
                conversacion = None

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

    async def listar_conversaciones_web(
        self, usuario_id: uuid.UUID, limite: int = 30
    ) -> list[ConversacionOraculo]:
        """Lista conversaciones web no archivadas — ancladas primero."""
        resultado = await self.sesion.execute(
            select(ConversacionOraculo)
            .where(
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
                ConversacionOraculo.archivada.is_(False),
            )
            .order_by(
                desc(ConversacionOraculo.anclada),
                desc(ConversacionOraculo.creado_en),
            )
            .limit(limite)
        )
        return list(resultado.scalars().all())

    # ── Gestión de conversaciones ────────────────────────────

    async def renombrar(
        self, usuario_id: uuid.UUID, conversacion_id: uuid.UUID, titulo: str
    ) -> ConversacionOraculo | None:
        """Cambia el título de una conversación."""
        conv = await self._obtener_propia(usuario_id, conversacion_id)
        if not conv:
            return None
        conv.titulo = titulo.strip()[:120]
        await self.sesion.commit()
        await self.sesion.refresh(conv)
        return conv

    async def alternar_anclada(
        self, usuario_id: uuid.UUID, conversacion_id: uuid.UUID
    ) -> ConversacionOraculo | None:
        """Ancla o desancla una conversación."""
        conv = await self._obtener_propia(usuario_id, conversacion_id)
        if not conv:
            return None
        conv.anclada = not conv.anclada
        await self.sesion.commit()
        await self.sesion.refresh(conv)
        return conv

    async def archivar(
        self, usuario_id: uuid.UUID, conversacion_id: uuid.UUID
    ) -> ConversacionOraculo | None:
        """Archiva una conversación (la oculta de la lista)."""
        conv = await self._obtener_propia(usuario_id, conversacion_id)
        if not conv:
            return None
        conv.archivada = True
        conv.activa = False
        conv.anclada = False
        await self.sesion.commit()
        await self.sesion.refresh(conv)
        return conv

    async def eliminar(
        self, usuario_id: uuid.UUID, conversacion_id: uuid.UUID
    ) -> bool:
        """Elimina permanentemente una conversación."""
        resultado = await self.sesion.execute(
            sa_delete(ConversacionOraculo).where(
                ConversacionOraculo.id == conversacion_id,
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
            )
        )
        await self.sesion.commit()
        return resultado.rowcount > 0

    async def _obtener_propia(
        self, usuario_id: uuid.UUID, conversacion_id: uuid.UUID
    ) -> ConversacionOraculo | None:
        """Obtiene una conversación verificando que pertenece al usuario."""
        resultado = await self.sesion.execute(
            select(ConversacionOraculo).where(
                ConversacionOraculo.id == conversacion_id,
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
            )
        )
        return resultado.scalar_one_or_none()

    async def cambiar_conversacion_web(
        self, usuario_id: uuid.UUID, conversacion_id: uuid.UUID
    ) -> ConversacionOraculo | None:
        """Activa una conversación específica y desactiva las demás."""
        resultado = await self.sesion.execute(
            select(ConversacionOraculo).where(
                ConversacionOraculo.id == conversacion_id,
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
            )
        )
        conversacion = resultado.scalar_one_or_none()
        if not conversacion:
            return None

        # Desactivar todas las web del usuario
        await self.sesion.execute(
            update(ConversacionOraculo)
            .where(
                ConversacionOraculo.usuario_id == usuario_id,
                ConversacionOraculo.canal == "web",
                ConversacionOraculo.activa.is_(True),
            )
            .values(activa=False)
        )

        # Activar la seleccionada
        conversacion.activa = True
        await self.sesion.commit()
        await self.sesion.refresh(conversacion)
        return conversacion
