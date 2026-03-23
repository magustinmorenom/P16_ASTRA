"""Endpoints del Oráculo ASTRA — vinculación Telegram."""


from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_telegram import RepositorioTelegram
from app.dependencias_auth import obtener_usuario_actual
from app.dependencias_suscripcion import requiere_plan
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder

router = APIRouter(prefix="/oraculo", tags=["Oráculo"])


@router.post("/generar-codigo")
async def generar_codigo(
    _suscripcion=Depends(requiere_plan("premium")),
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Genera un código de vinculación para Telegram (6 dígitos, 10 min TTL)."""
    repo = RepositorioTelegram(db)
    codigo = await repo.crear_codigo_vinculacion(usuario.id)

    vinculo = await repo.obtener_por_usuario_id(usuario.id)

    return {
        "exito": True,
        "datos": {
            "codigo": codigo,
            "expira_en": vinculo.codigo_expira_en.isoformat() if vinculo and vinculo.codigo_expira_en else None,
        },
    }


@router.get("/vinculacion")
async def estado_vinculacion(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Retorna el estado de vinculación Telegram del usuario."""
    repo = RepositorioTelegram(db)
    vinculo = await repo.obtener_por_usuario_id(usuario.id)

    vinculado = bool(vinculo and vinculo.telegram_id and vinculo.activo)

    return {
        "exito": True,
        "datos": {
            "vinculado": vinculado,
            "telegram_username": vinculo.telegram_username if vinculado else None,
        },
    }


@router.delete("/desvincular")
async def desvincular(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Desvincula la cuenta de Telegram del usuario."""
    repo = RepositorioTelegram(db)
    await repo.desvincular(usuario.id)

    return {
        "exito": True,
        "mensaje": "Cuenta de Telegram desvinculada exitosamente.",
    }
