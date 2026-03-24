"""Repositorio de suscripciones — operaciones CRUD."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.config_pais_mp import ConfigPaisMp
from app.modelos.evento_webhook import EventoWebhook
from app.modelos.plan import Plan
from app.modelos.suscripcion import Suscripcion


class RepositorioSuscripcion:
    """Operaciones de base de datos para suscripciones."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    async def crear(
        self,
        usuario_id: uuid.UUID,
        plan_id: uuid.UUID,
        pais_codigo: str = "AR",
        estado: str = "activa",
        precio_plan_id: uuid.UUID | None = None,
        mp_preapproval_id: str | None = None,
        referencia_externa: str | None = None,
        datos_mp: dict | None = None,
    ) -> Suscripcion:
        """Crea una nueva suscripción."""
        suscripcion = Suscripcion(
            usuario_id=usuario_id,
            plan_id=plan_id,
            pais_codigo=pais_codigo,
            estado=estado,
            precio_plan_id=precio_plan_id,
            mp_preapproval_id=mp_preapproval_id,
            referencia_externa=referencia_externa,
            datos_mp=datos_mp,
            fecha_inicio=datetime.now(timezone.utc) if estado == "activa" else None,
        )
        self.sesion.add(suscripcion)
        await self.sesion.commit()
        await self.sesion.refresh(suscripcion)
        return suscripcion

    async def obtener_activa(self, usuario_id: uuid.UUID) -> Suscripcion | None:
        """Obtiene la suscripción activa/pendiente más reciente de un usuario.

        Prioriza 'activa' sobre 'pendiente' para que /me muestre el plan
        real del usuario y no una suscripción pendiente de checkout.
        """
        from sqlalchemy import case as sql_case

        resultado = await self.sesion.execute(
            select(Suscripcion).where(
                Suscripcion.usuario_id == usuario_id,
                Suscripcion.estado.in_(["activa", "pendiente"]),
            ).order_by(
                sql_case(
                    (Suscripcion.estado == "activa", 0),
                    (Suscripcion.estado == "pendiente", 1),
                ),
                Suscripcion.creado_en.desc(),
            )
            .limit(1)
        )
        return resultado.scalars().first()

    async def obtener_por_id(self, suscripcion_id: uuid.UUID) -> Suscripcion | None:
        """Obtiene una suscripción por su ID."""
        resultado = await self.sesion.execute(
            select(Suscripcion).where(Suscripcion.id == suscripcion_id)
        )
        return resultado.scalar_one_or_none()

    async def obtener_por_preapproval_id(
        self, mp_preapproval_id: str
    ) -> Suscripcion | None:
        """Obtiene una suscripción por su preapproval_id de MP."""
        resultado = await self.sesion.execute(
            select(Suscripcion).where(
                Suscripcion.mp_preapproval_id == mp_preapproval_id
            )
        )
        return resultado.scalar_one_or_none()

    async def actualizar_estado(
        self,
        suscripcion_id: uuid.UUID,
        estado: str,
        datos_mp: dict | None = None,
    ) -> None:
        """Actualiza el estado de una suscripción."""
        valores = {
            "estado": estado,
            "actualizado_en": datetime.now(timezone.utc),
        }
        if estado == "activa":
            valores["fecha_inicio"] = datetime.now(timezone.utc)
        elif estado in ("cancelada", "pausada"):
            valores["fecha_fin"] = datetime.now(timezone.utc)
        if datos_mp is not None:
            valores["datos_mp"] = datos_mp
        await self.sesion.execute(
            update(Suscripcion)
            .where(Suscripcion.id == suscripcion_id)
            .values(**valores)
        )
        await self.sesion.commit()

    async def cancelar_activas_usuario(self, usuario_id: uuid.UUID) -> None:
        """Cancela todas las suscripciones activas de un usuario."""
        await self.sesion.execute(
            update(Suscripcion)
            .where(
                Suscripcion.usuario_id == usuario_id,
                Suscripcion.estado.in_(["activa", "pendiente"]),
            )
            .values(
                estado="cancelada",
                fecha_fin=datetime.now(timezone.utc),
                actualizado_en=datetime.now(timezone.utc),
            )
        )
        await self.sesion.commit()

    async def cancelar_pendientes_usuario(self, usuario_id: uuid.UUID) -> None:
        """Cancela solo suscripciones pendientes de un usuario (no la gratis activa)."""
        await self.sesion.execute(
            update(Suscripcion)
            .where(
                Suscripcion.usuario_id == usuario_id,
                Suscripcion.estado == "pendiente",
            )
            .values(
                estado="cancelada",
                fecha_fin=datetime.now(timezone.utc),
                actualizado_en=datetime.now(timezone.utc),
            )
        )
        await self.sesion.commit()

    async def cancelar_gratis_usuario(self, usuario_id: uuid.UUID) -> None:
        """Cancela la suscripción gratis activa de un usuario (al activarse premium)."""
        # Buscar suscripciones activas cuyo plan sea "gratis"
        resultado = await self.sesion.execute(
            select(Suscripcion)
            .join(Plan, Suscripcion.plan_id == Plan.id)
            .where(
                Suscripcion.usuario_id == usuario_id,
                Suscripcion.estado == "activa",
                Plan.slug == "gratis",
            )
        )
        gratis_ids = [s.id for s in resultado.scalars().all()]
        if gratis_ids:
            await self.sesion.execute(
                update(Suscripcion)
                .where(Suscripcion.id.in_(gratis_ids))
                .values(
                    estado="cancelada",
                    fecha_fin=datetime.now(timezone.utc),
                    actualizado_en=datetime.now(timezone.utc),
                )
            )
            await self.sesion.commit()

    async def listar_con_mp_por_usuario(
        self, usuario_id: uuid.UUID
    ) -> list[Suscripcion]:
        """Lista todas las suscripciones del usuario que tienen mp_preapproval_id."""
        resultado = await self.sesion.execute(
            select(Suscripcion).where(
                Suscripcion.usuario_id == usuario_id,
                Suscripcion.mp_preapproval_id.isnot(None),
            ).order_by(Suscripcion.creado_en.desc())
        )
        return list(resultado.scalars().all())

    async def listar_paises_activos(self) -> list[ConfigPaisMp]:
        """Lista todos los países activos con configuración de MP."""
        resultado = await self.sesion.execute(
            select(ConfigPaisMp).where(ConfigPaisMp.activo.is_(True))
            .order_by(ConfigPaisMp.pais_codigo)
        )
        return list(resultado.scalars().all())

    async def obtener_config_pais(self, pais_codigo: str) -> ConfigPaisMp | None:
        """Obtiene la configuración de MP para un país."""
        resultado = await self.sesion.execute(
            select(ConfigPaisMp).where(
                ConfigPaisMp.pais_codigo == pais_codigo,
                ConfigPaisMp.activo.is_(True),
            )
        )
        return resultado.scalar_one_or_none()

    async def evento_ya_procesado(self, evento_id: str) -> bool:
        """Verifica si un evento de webhook ya fue procesado."""
        resultado = await self.sesion.execute(
            select(EventoWebhook).where(EventoWebhook.id == evento_id)
        )
        return resultado.scalar_one_or_none() is not None

    async def registrar_evento(
        self,
        evento_id: str,
        tipo: str,
        accion: str | None = None,
        payload: dict | None = None,
    ) -> None:
        """Registra un evento de webhook procesado."""
        evento = EventoWebhook(
            id=evento_id,
            tipo=tipo,
            accion=accion,
            payload=payload,
        )
        self.sesion.add(evento)
        await self.sesion.commit()
