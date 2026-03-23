"""Repositorio de facturas — operaciones CRUD."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.factura import Factura


class RepositorioFactura:
    """Operaciones de base de datos para facturas."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def _generar_numero(self) -> str:
        """Genera número de factura secuencial: CE-YYYYMM-XXXX."""
        ahora = datetime.now(timezone.utc)
        prefijo = f"CE-{ahora.strftime('%Y%m')}-"

        resultado = await self.sesion.execute(
            select(func.count(Factura.id)).where(
                Factura.numero_factura.like(f"{prefijo}%")
            )
        )
        cantidad = resultado.scalar() or 0
        secuencial = cantidad + 1
        return f"{prefijo}{secuencial:04d}"

    async def crear(
        self,
        usuario_id: uuid.UUID,
        monto_centavos: int,
        moneda: str,
        concepto: str,
        pais_codigo: str = "AR",
        pago_id: uuid.UUID | None = None,
        suscripcion_id: uuid.UUID | None = None,
        email_cliente: str | None = None,
        nombre_cliente: str | None = None,
        periodo_inicio: datetime | None = None,
        periodo_fin: datetime | None = None,
        notas: str | None = None,
        datos_extra: dict | None = None,
    ) -> Factura:
        """Crea una nueva factura con número auto-generado."""
        numero = await self._generar_numero()
        factura = Factura(
            usuario_id=usuario_id,
            pago_id=pago_id,
            suscripcion_id=suscripcion_id,
            numero_factura=numero,
            estado="emitida",
            monto_centavos=monto_centavos,
            moneda=moneda,
            concepto=concepto,
            email_cliente=email_cliente,
            nombre_cliente=nombre_cliente,
            pais_codigo=pais_codigo,
            periodo_inicio=periodo_inicio,
            periodo_fin=periodo_fin,
            notas=notas,
            datos_extra=datos_extra,
        )
        self.sesion.add(factura)
        await self.sesion.commit()
        await self.sesion.refresh(factura)
        return factura

    async def listar_por_usuario(
        self, usuario_id: uuid.UUID, limite: int = 50, offset: int = 0
    ) -> list[Factura]:
        """Lista las facturas de un usuario."""
        resultado = await self.sesion.execute(
            select(Factura)
            .where(Factura.usuario_id == usuario_id)
            .order_by(Factura.creado_en.desc())
            .limit(limite)
            .offset(offset)
        )
        return list(resultado.scalars().all())

    async def obtener_por_pago_id(self, pago_id: uuid.UUID) -> Factura | None:
        """Obtiene una factura por su pago_id (idempotencia)."""
        resultado = await self.sesion.execute(
            select(Factura).where(Factura.pago_id == pago_id)
        )
        return resultado.scalar_one_or_none()

    async def obtener_por_pago_ids(
        self, pago_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, Factura]:
        """Obtiene facturas en batch por sus pago_ids. Retorna dict[pago_id → Factura]."""
        if not pago_ids:
            return {}
        resultado = await self.sesion.execute(
            select(Factura).where(Factura.pago_id.in_(pago_ids))
        )
        facturas = resultado.scalars().all()
        return {f.pago_id: f for f in facturas if f.pago_id}

    async def obtener_por_id(self, factura_id: uuid.UUID) -> Factura | None:
        """Obtiene una factura por su ID."""
        resultado = await self.sesion.execute(
            select(Factura).where(Factura.id == factura_id)
        )
        return resultado.scalar_one_or_none()
