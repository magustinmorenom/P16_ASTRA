"""Repositorio de vínculos Telegram — persistencia."""

import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.vinculo_telegram import VinculoTelegram


class RepositorioTelegram:
    """Operaciones de base de datos para vínculos Telegram."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def crear_codigo_vinculacion(self, usuario_id: uuid.UUID) -> str:
        """Genera un código de 6 dígitos para vincular Telegram. TTL 10 minutos."""
        codigo = "".join(random.choices(string.digits, k=6))
        expira_en = datetime.now(timezone.utc) + timedelta(minutes=10)

        # Buscar vínculo existente del usuario
        existente = await self.obtener_por_usuario_id(usuario_id)
        if existente:
            existente.codigo_vinculacion = codigo
            existente.codigo_expira_en = expira_en
            existente.telegram_id = existente.telegram_id  # mantener si ya vinculó
        else:
            existente = VinculoTelegram(
                usuario_id=usuario_id,
                codigo_vinculacion=codigo,
                codigo_expira_en=expira_en,
            )
            self.sesion.add(existente)

        await self.sesion.commit()
        await self.sesion.refresh(existente)
        return codigo

    async def vincular(
        self,
        usuario_id: uuid.UUID,
        telegram_id: int,
        username: str | None = None,
    ) -> VinculoTelegram:
        """Vincula un telegram_id con un usuario, limpiando el código temporal."""
        vinculo = await self.obtener_por_usuario_id(usuario_id)
        if not vinculo:
            vinculo = VinculoTelegram(usuario_id=usuario_id)
            self.sesion.add(vinculo)

        vinculo.telegram_id = telegram_id
        vinculo.telegram_username = username
        vinculo.activo = True
        vinculo.codigo_vinculacion = None
        vinculo.codigo_expira_en = None

        await self.sesion.commit()
        await self.sesion.refresh(vinculo)
        return vinculo

    async def obtener_por_telegram_id(self, telegram_id: int) -> VinculoTelegram | None:
        """Busca un vínculo por ID de Telegram."""
        resultado = await self.sesion.execute(
            select(VinculoTelegram).where(
                VinculoTelegram.telegram_id == telegram_id,
                VinculoTelegram.activo == True,
            )
        )
        return resultado.scalar_one_or_none()

    async def obtener_por_usuario_id(self, usuario_id: uuid.UUID) -> VinculoTelegram | None:
        """Busca un vínculo por ID de usuario."""
        resultado = await self.sesion.execute(
            select(VinculoTelegram).where(VinculoTelegram.usuario_id == usuario_id)
        )
        return resultado.scalar_one_or_none()

    async def obtener_por_codigo(self, codigo: str) -> VinculoTelegram | None:
        """Busca un vínculo por código de vinculación (no expirado)."""
        ahora = datetime.now(timezone.utc)
        resultado = await self.sesion.execute(
            select(VinculoTelegram).where(
                VinculoTelegram.codigo_vinculacion == codigo,
                VinculoTelegram.codigo_expira_en > ahora,
            )
        )
        return resultado.scalar_one_or_none()

    async def desvincular(self, usuario_id: uuid.UUID) -> None:
        """Desvincula Telegram del usuario."""
        await self.sesion.execute(
            update(VinculoTelegram)
            .where(VinculoTelegram.usuario_id == usuario_id)
            .values(
                telegram_id=None,
                telegram_username=None,
                activo=False,
                codigo_vinculacion=None,
                codigo_expira_en=None,
            )
        )
        await self.sesion.commit()
