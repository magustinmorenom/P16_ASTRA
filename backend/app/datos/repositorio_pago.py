"""Repositorio de pagos — operaciones CRUD."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.pago import Pago


class RepositorioPago:
    """Operaciones de base de datos para pagos."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def crear(
        self,
        monto_centavos: int,
        moneda: str = "ARS",
        suscripcion_id: uuid.UUID | None = None,
        usuario_id: uuid.UUID | None = None,
        mp_pago_id: str | None = None,
        estado: str = "pendiente",
        metodo_pago: str | None = None,
        detalle_estado: str | None = None,
        referencia_externa: str | None = None,
        datos_mp: dict | None = None,
        fecha_pago: datetime | None = None,
    ) -> Pago:
        """Crea un nuevo registro de pago."""
        pago = Pago(
            suscripcion_id=suscripcion_id,
            usuario_id=usuario_id,
            mp_pago_id=mp_pago_id,
            estado=estado,
            monto_centavos=monto_centavos,
            moneda=moneda,
            metodo_pago=metodo_pago,
            detalle_estado=detalle_estado,
            referencia_externa=referencia_externa,
            datos_mp=datos_mp,
            fecha_pago=fecha_pago,
        )
        self.sesion.add(pago)
        await self.sesion.commit()
        await self.sesion.refresh(pago)
        return pago

    async def obtener_por_mp_pago_id(self, mp_pago_id: str) -> Pago | None:
        """Obtiene un pago por su ID de MercadoPago."""
        resultado = await self.sesion.execute(
            select(Pago).where(Pago.mp_pago_id == mp_pago_id)
        )
        return resultado.scalar_one_or_none()

    async def listar_por_usuario(
        self, usuario_id: uuid.UUID, limite: int = 50, offset: int = 0
    ) -> list[Pago]:
        """Lista los pagos de un usuario."""
        resultado = await self.sesion.execute(
            select(Pago)
            .where(Pago.usuario_id == usuario_id)
            .order_by(Pago.creado_en.desc())
            .limit(limite)
            .offset(offset)
        )
        return list(resultado.scalars().all())

    async def actualizar_estado(
        self,
        pago_id: uuid.UUID,
        estado: str,
        detalle_estado: str | None = None,
        datos_mp: dict | None = None,
    ) -> None:
        """Actualiza el estado de un pago."""
        valores = {
            "estado": estado,
            "actualizado_en": datetime.now(timezone.utc),
        }
        if detalle_estado is not None:
            valores["detalle_estado"] = detalle_estado
        if datos_mp is not None:
            valores["datos_mp"] = datos_mp
        await self.sesion.execute(
            update(Pago)
            .where(Pago.id == pago_id)
            .values(**valores)
        )
        await self.sesion.commit()
