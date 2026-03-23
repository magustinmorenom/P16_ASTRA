"""Dependencias de suscripción para inyección en endpoints."""


from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_plan import RepositorioPlan
from app.datos.repositorio_suscripcion import RepositorioSuscripcion
from app.dependencias_auth import obtener_usuario_actual
from app.excepciones import LimiteExcedido, SuscripcionNoEncontrada
from app.modelos.suscripcion import Suscripcion
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

JERARQUIA_PLANES = {"gratis": 0, "premium": 1}


def requiere_plan(nivel_minimo: str = "premium"):
    """Factory de dependencia que verifica el plan del usuario.

    Uso:
        @router.get("/recurso-premium")
        async def recurso(suscripcion = Depends(requiere_plan("premium"))):
            ...
    """

    async def verificar(
        usuario: Usuario = Depends(obtener_usuario_actual),
        db: AsyncSession = Depends(_obtener_db_placeholder),
    ) -> Suscripcion:
        repo_sus = RepositorioSuscripcion(db)
        suscripcion = await repo_sus.obtener_activa(usuario.id)
        if not suscripcion:
            raise SuscripcionNoEncontrada("No tiene una suscripción activa")

        repo_plan = RepositorioPlan(db)
        plan = await repo_plan.obtener_por_id(suscripcion.plan_id)
        if not plan:
            raise SuscripcionNoEncontrada("Plan asociado no encontrado")

        nivel_actual = JERARQUIA_PLANES.get(plan.slug, 0)
        nivel_requerido = JERARQUIA_PLANES.get(nivel_minimo, 0)

        if nivel_actual < nivel_requerido:
            raise LimiteExcedido(
                f"Se requiere plan {nivel_minimo}. Tu plan actual es {plan.slug}."
            )

        return suscripcion

    return verificar
