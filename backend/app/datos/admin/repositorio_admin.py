"""Repositorio de métricas y queries agregadas para el backoffice."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, case, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.modelos.conversacion_oraculo import ConversacionOraculo
from app.modelos.pago import Pago
from app.modelos.podcast import PodcastEpisodio
from app.modelos.plan import Plan
from app.modelos.registro_consumo_api import RegistroConsumoApi
from app.modelos.suscripcion import Suscripcion
from app.modelos.usuario import Usuario


class RepositorioAdmin:
    """Queries agregadas para el panel de administración."""

    def __init__(self, sesion: AsyncSession):
        self.sesion = sesion

    # ── Métricas del dashboard ─────────────────────────────────────

    async def obtener_metricas(self) -> dict:
        """Métricas generales para el dashboard admin."""
        ahora = datetime.now(timezone.utc)
        hace_7d = ahora - timedelta(days=7)
        hace_30d = ahora - timedelta(days=30)
        inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        inicio_mes_anterior = (inicio_mes - timedelta(days=1)).replace(day=1)

        # Conteos de usuarios
        total = await self._contar(select(func.count(Usuario.id)))
        nuevos_7d = await self._contar(
            select(func.count(Usuario.id)).where(Usuario.creado_en >= hace_7d)
        )
        nuevos_30d = await self._contar(
            select(func.count(Usuario.id)).where(Usuario.creado_en >= hace_30d)
        )
        activos_hoy = await self._contar(
            select(func.count(Usuario.id)).where(
                Usuario.ultimo_acceso >= ahora.replace(hour=0, minute=0, second=0)
            )
        )

        # Suscripciones por plan
        suscripciones = await self._suscripciones_por_plan()

        # Ingresos
        ingresos_mes = await self._ingresos_periodo(inicio_mes, ahora)
        ingresos_mes_anterior = await self._ingresos_periodo(inicio_mes_anterior, inicio_mes)

        # Costos API del mes
        costos_mes = await self._costos_api_periodo(inicio_mes, ahora)
        costos_mes_anterior = await self._costos_api_periodo(inicio_mes_anterior, inicio_mes)

        # Actividad
        conversaciones_7d = await self._contar(
            select(func.count(ConversacionOraculo.id)).where(
                ConversacionOraculo.creado_en >= hace_7d
            )
        )
        podcasts_7d = await self._contar(
            select(func.count(PodcastEpisodio.id)).where(
                PodcastEpisodio.creado_en >= hace_7d
            )
        )

        return {
            "usuarios": {
                "total": total,
                "nuevos_7d": nuevos_7d,
                "nuevos_30d": nuevos_30d,
                "activos_hoy": activos_hoy,
            },
            "suscripciones": suscripciones,
            "ingresos": {
                "mes_actual": ingresos_mes,
                "mes_anterior": ingresos_mes_anterior,
            },
            "costos_api": {
                "mes_actual": costos_mes,
                "mes_anterior": costos_mes_anterior,
            },
            "actividad": {
                "conversaciones_oraculo_7d": conversaciones_7d,
                "podcasts_generados_7d": podcasts_7d,
            },
        }

    # ── Usuarios ───────────────────────────────────────────────────

    async def listar_usuarios(
        self,
        pagina: int = 1,
        por_pagina: int = 25,
        busqueda: str | None = None,
        activo: bool | None = None,
        rol: str | None = None,
        ordenar_por: str = "creado_en",
        orden: str = "desc",
    ) -> dict:
        """Lista paginada de usuarios con filtros."""
        query = select(Usuario)

        if busqueda:
            patron = f"%{busqueda}%"
            query = query.where(
                (Usuario.email.ilike(patron)) | (Usuario.nombre.ilike(patron))
            )
        if activo is not None:
            query = query.where(Usuario.activo == activo)
        if rol:
            query = query.where(Usuario.rol == rol)

        # Conteo total
        conteo_query = select(func.count()).select_from(query.subquery())
        total = await self._contar(conteo_query)

        # Ordenamiento
        columna = getattr(Usuario, ordenar_por, Usuario.creado_en)
        query = query.order_by(desc(columna) if orden == "desc" else columna)

        # Paginación
        query = query.offset((pagina - 1) * por_pagina).limit(por_pagina)
        resultado = await self.sesion.execute(query)
        usuarios = resultado.scalars().all()

        return {
            "items": [self._serializar_usuario(u) for u in usuarios],
            "total": total,
            "pagina": pagina,
            "por_pagina": por_pagina,
            "total_paginas": (total + por_pagina - 1) // por_pagina,
        }

    async def detalle_usuario(self, usuario_id: uuid.UUID) -> dict | None:
        """Detalle completo de un usuario con sus datos relacionados."""
        resultado = await self.sesion.execute(
            select(Usuario).where(Usuario.id == usuario_id)
        )
        usuario = resultado.scalar_one_or_none()
        if not usuario:
            return None

        # Suscripción activa
        sub_result = await self.sesion.execute(
            select(Suscripcion, Plan.nombre, Plan.slug)
            .join(Plan, Suscripcion.plan_id == Plan.id)
            .where(
                Suscripcion.usuario_id == usuario_id,
                Suscripcion.estado == "activa",
            )
            .order_by(desc(Suscripcion.creado_en))
            .limit(1)
        )
        sub_row = sub_result.first()

        # Historial de pagos
        pagos_result = await self.sesion.execute(
            select(Pago)
            .where(Pago.usuario_id == usuario_id)
            .order_by(desc(Pago.creado_en))
            .limit(20)
        )
        pagos = pagos_result.scalars().all()

        # Costos API totales
        costos_result = await self.sesion.execute(
            select(
                RegistroConsumoApi.servicio,
                func.sum(RegistroConsumoApi.costo_usd_centavos).label("total_centavos"),
                func.sum(RegistroConsumoApi.tokens_entrada).label("total_tokens_in"),
                func.sum(RegistroConsumoApi.tokens_salida).label("total_tokens_out"),
            )
            .where(RegistroConsumoApi.usuario_id == usuario_id)
            .group_by(RegistroConsumoApi.servicio)
        )
        costos = [
            {
                "servicio": r.servicio,
                "costo_usd_centavos": r.total_centavos or 0,
                "tokens_entrada": r.total_tokens_in or 0,
                "tokens_salida": r.total_tokens_out or 0,
            }
            for r in costos_result.all()
        ]

        # Conteos
        n_conversaciones = await self._contar(
            select(func.count(ConversacionOraculo.id)).where(
                ConversacionOraculo.usuario_id == usuario_id
            )
        )
        n_podcasts = await self._contar(
            select(func.count(PodcastEpisodio.id)).where(
                PodcastEpisodio.usuario_id == usuario_id
            )
        )

        datos = self._serializar_usuario(usuario)
        datos.update({
            "suscripcion_activa": {
                "plan_nombre": sub_row[1],
                "plan_slug": sub_row[2],
                "estado": sub_row[0].estado,
                "pais_codigo": sub_row[0].pais_codigo,
                "fecha_inicio": sub_row[0].fecha_inicio.isoformat() if sub_row[0].fecha_inicio else None,
            } if sub_row else None,
            "pagos": [
                {
                    "id": str(p.id),
                    "monto_centavos": p.monto_centavos,
                    "moneda": p.moneda,
                    "estado": p.estado,
                    "fecha_pago": p.fecha_pago.isoformat() if p.fecha_pago else None,
                }
                for p in pagos
            ],
            "costos_api": costos,
            "totales": {
                "conversaciones": n_conversaciones,
                "podcasts": n_podcasts,
            },
        })
        return datos

    async def cambiar_estado_usuario(
        self, usuario_id: uuid.UUID, activo: bool
    ) -> bool:
        """Activa o desactiva un usuario."""
        resultado = await self.sesion.execute(
            select(Usuario).where(Usuario.id == usuario_id)
        )
        usuario = resultado.scalar_one_or_none()
        if not usuario:
            return False
        usuario.activo = activo
        await self.sesion.commit()
        return True

    async def cambiar_rol_usuario(
        self, usuario_id: uuid.UUID, nuevo_rol: str
    ) -> bool:
        """Cambia el rol de un usuario."""
        resultado = await self.sesion.execute(
            select(Usuario).where(Usuario.id == usuario_id)
        )
        usuario = resultado.scalar_one_or_none()
        if not usuario:
            return False
        usuario.rol = nuevo_rol
        await self.sesion.commit()
        return True

    # ── Suscripciones ──────────────────────────────────────────────

    async def listar_suscripciones(
        self,
        pagina: int = 1,
        por_pagina: int = 25,
        estado: str | None = None,
        pais_codigo: str | None = None,
    ) -> dict:
        """Lista paginada de suscripciones con datos del usuario."""
        query = (
            select(Suscripcion, Usuario.email, Usuario.nombre, Plan.nombre.label("plan_nombre"), Plan.slug)
            .join(Usuario, Suscripcion.usuario_id == Usuario.id, isouter=True)
            .join(Plan, Suscripcion.plan_id == Plan.id)
        )

        if estado:
            query = query.where(Suscripcion.estado == estado)
        if pais_codigo:
            query = query.where(Suscripcion.pais_codigo == pais_codigo)

        conteo_query = select(func.count()).select_from(query.subquery())
        total = await self._contar(conteo_query)

        query = query.order_by(desc(Suscripcion.creado_en))
        query = query.offset((pagina - 1) * por_pagina).limit(por_pagina)
        resultado = await self.sesion.execute(query)

        items = []
        for row in resultado.all():
            sub = row[0]
            items.append({
                "id": str(sub.id),
                "usuario_email": row[1],
                "usuario_nombre": row[2],
                "plan_nombre": row[3],
                "plan_slug": row[4],
                "estado": sub.estado,
                "pais_codigo": sub.pais_codigo,
                "fecha_inicio": sub.fecha_inicio.isoformat() if sub.fecha_inicio else None,
                "fecha_fin": sub.fecha_fin.isoformat() if sub.fecha_fin else None,
                "creado_en": sub.creado_en.isoformat() if sub.creado_en else None,
            })

        return {
            "items": items,
            "total": total,
            "pagina": pagina,
            "por_pagina": por_pagina,
            "total_paginas": (total + por_pagina - 1) // por_pagina,
        }

    # ── Costos API ─────────────────────────────────────────────────

    async def costos_por_servicio(
        self,
        desde: datetime | None = None,
        hasta: datetime | None = None,
    ) -> list[dict]:
        """Desglose de costos por servicio."""
        query = select(
            RegistroConsumoApi.servicio,
            func.count(RegistroConsumoApi.id).label("cantidad"),
            func.sum(RegistroConsumoApi.costo_usd_centavos).label("total_centavos"),
            func.sum(RegistroConsumoApi.tokens_entrada).label("tokens_in"),
            func.sum(RegistroConsumoApi.tokens_salida).label("tokens_out"),
        ).group_by(RegistroConsumoApi.servicio)

        if desde:
            query = query.where(RegistroConsumoApi.creado_en >= desde)
        if hasta:
            query = query.where(RegistroConsumoApi.creado_en < hasta)

        resultado = await self.sesion.execute(query)
        return [
            {
                "servicio": r.servicio,
                "cantidad": r.cantidad,
                "costo_usd_centavos": r.total_centavos or 0,
                "tokens_entrada": r.tokens_in or 0,
                "tokens_salida": r.tokens_out or 0,
            }
            for r in resultado.all()
        ]

    async def top_consumidores(self, limite: int = 10) -> list[dict]:
        """Top N usuarios por costo de API."""
        query = (
            select(
                RegistroConsumoApi.usuario_id,
                Usuario.email,
                Usuario.nombre,
                func.sum(RegistroConsumoApi.costo_usd_centavos).label("total_centavos"),
                func.count(RegistroConsumoApi.id).label("cantidad"),
            )
            .join(Usuario, RegistroConsumoApi.usuario_id == Usuario.id, isouter=True)
            .where(RegistroConsumoApi.usuario_id.isnot(None))
            .group_by(RegistroConsumoApi.usuario_id, Usuario.email, Usuario.nombre)
            .order_by(desc("total_centavos"))
            .limit(limite)
        )
        resultado = await self.sesion.execute(query)
        return [
            {
                "usuario_id": str(r.usuario_id),
                "email": r.email,
                "nombre": r.nombre,
                "costo_usd_centavos": r.total_centavos or 0,
                "cantidad_requests": r.cantidad,
            }
            for r in resultado.all()
        ]

    # ── Helpers ────────────────────────────────────────────────────

    async def _contar(self, query) -> int:
        resultado = await self.sesion.execute(query)
        return resultado.scalar() or 0

    async def _suscripciones_por_plan(self) -> dict:
        resultado = await self.sesion.execute(
            select(
                Plan.slug,
                func.count(Suscripcion.id).label("cantidad"),
            )
            .join(Plan, Suscripcion.plan_id == Plan.id)
            .where(Suscripcion.estado == "activa")
            .group_by(Plan.slug)
        )
        return {r.slug: r.cantidad for r in resultado.all()}

    async def _ingresos_periodo(self, desde: datetime, hasta: datetime) -> dict:
        resultado = await self.sesion.execute(
            select(
                Pago.moneda,
                func.sum(Pago.monto_centavos).label("total"),
            )
            .where(
                Pago.estado == "aprobado",
                Pago.creado_en >= desde,
                Pago.creado_en < hasta,
            )
            .group_by(Pago.moneda)
        )
        return {r.moneda: r.total or 0 for r in resultado.all()}

    async def _costos_api_periodo(self, desde: datetime, hasta: datetime) -> dict:
        resultado = await self.sesion.execute(
            select(
                RegistroConsumoApi.servicio,
                func.sum(RegistroConsumoApi.costo_usd_centavos).label("total"),
            )
            .where(
                RegistroConsumoApi.creado_en >= desde,
                RegistroConsumoApi.creado_en < hasta,
            )
            .group_by(RegistroConsumoApi.servicio)
        )
        return {r.servicio: r.total or 0 for r in resultado.all()}

    def _serializar_usuario(self, u: Usuario) -> dict:
        return {
            "id": str(u.id),
            "email": u.email,
            "nombre": u.nombre,
            "activo": u.activo,
            "verificado": u.verificado,
            "rol": u.rol,
            "proveedor_auth": u.proveedor_auth,
            "creado_en": u.creado_en.isoformat() if u.creado_en else None,
            "ultimo_acceso": u.ultimo_acceso.isoformat() if u.ultimo_acceso else None,
        }
