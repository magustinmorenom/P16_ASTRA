"""Endpoints del chat web con el Oráculo ASTRA."""

import uuid
from datetime import date, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_conversacion import RepositorioConversacion
from app.datos.repositorio_perfil import RepositorioPerfil
from app.datos.repositorio_plan import RepositorioPlan
from app.datos.repositorio_suscripcion import RepositorioSuscripcion
from app.dependencias_auth import obtener_usuario_actual
from app.esquemas.respuesta import RespuestaBase
from app.excepciones import LimiteExcedido
from app.modelos.usuario import Usuario
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.registro import logger
from app.servicios.servicio_oraculo import ServicioOraculo
from app.servicios.servicio_transitos import ServicioTransitos
from app.utilidades.planes import es_plan_pago

router = APIRouter(prefix="/chat", tags=["Chat"])

LIMITE_DIARIO_GRATIS = 3
MAX_HISTORIAL_CONTEXTO = 20


# ── Esquemas ──────────────────────────────────────────────────

class MensajeChatRequest(BaseModel):
    mensaje: str = Field(..., min_length=1, max_length=2000)


class MensajeChatResponse(BaseModel):
    respuesta: str
    mensajes_restantes: int | None = None  # None = ilimitado (premium)


class RespuestaMensajeChat(RespuestaBase):
    datos: MensajeChatResponse


# ── Helpers ───────────────────────────────────────────────────

async def _es_premium(db: AsyncSession, usuario_id: uuid.UUID) -> bool:
    """Verifica si el usuario tiene un plan pago activo."""
    repo_sus = RepositorioSuscripcion(db)
    suscripcion = await repo_sus.obtener_activa(usuario_id)
    if not suscripcion:
        return False

    repo_plan = RepositorioPlan(db)
    plan = await repo_plan.obtener_por_id(suscripcion.plan_id)
    return plan is not None and es_plan_pago(plan.slug)


async def _verificar_limite(
    redis: Redis, usuario_id: uuid.UUID, es_premium: bool
) -> int | None:
    """Verifica límite diario. Retorna mensajes restantes (None=ilimitado).

    Lanza LimiteExcedido si el usuario gratis llegó al tope.
    """
    if es_premium:
        return None

    hoy = date.today().isoformat()
    clave = f"chat:limite:{usuario_id}:{hoy}"
    conteo = await redis.get(clave)
    conteo = int(conteo) if conteo else 0

    if conteo >= LIMITE_DIARIO_GRATIS:
        raise LimiteExcedido(
            f"Llegaste a tu límite de {LIMITE_DIARIO_GRATIS} mensajes diarios. "
            "Con Premium, hablamos sin límites."
        )

    return LIMITE_DIARIO_GRATIS - conteo


async def _incrementar_conteo(redis: Redis, usuario_id: uuid.UUID) -> None:
    """Incrementa el contador diario de mensajes."""
    hoy = date.today().isoformat()
    clave = f"chat:limite:{usuario_id}:{hoy}"
    pipe = redis.pipeline()
    pipe.incr(clave)
    pipe.expire(clave, 86400)
    await pipe.execute()


async def _obtener_contexto_cosmico(
    db: AsyncSession, usuario_id: uuid.UUID
) -> dict | None:
    """Obtiene el perfil cósmico completo del usuario."""
    repo_perfil = RepositorioPerfil(db)
    perfil = await repo_perfil.obtener_por_usuario(usuario_id)
    if not perfil:
        return None

    repo_calculo = RepositorioCalculo(db)
    calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)

    calculos["datos_personales"] = {
        "nombre": perfil.nombre,
        "fecha_nacimiento": perfil.fecha_nacimiento.isoformat(),
        "hora_nacimiento": perfil.hora_nacimiento.isoformat(),
        "ciudad_nacimiento": perfil.ciudad_nacimiento,
        "pais_nacimiento": perfil.pais_nacimiento,
    }

    return calculos


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/mensaje", response_model=RespuestaMensajeChat)
async def enviar_mensaje(
    datos: MensajeChatRequest,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
):
    """Envía un mensaje al oráculo y recibe respuesta."""
    premium = await _es_premium(db, usuario.id)

    # Verificar límite (lanza LimiteExcedido si se excedió)
    restantes = await _verificar_limite(redis, usuario.id, premium)

    # Obtener o crear conversación web
    repo_conv = RepositorioConversacion(db)
    conversacion = await repo_conv.obtener_o_crear_web(usuario.id)

    # Obtener contexto cósmico
    perfil_cosmico = await _obtener_contexto_cosmico(db, usuario.id)

    # Obtener tránsitos actuales
    try:
        transitos = ServicioTransitos.obtener_transitos_actuales()
    except Exception:
        transitos = None

    # Obtener historial de la conversación
    historial = await repo_conv.obtener_historial(
        conversacion.id, limite=MAX_HISTORIAL_CONTEXTO
    )

    # Consultar al oráculo (con sesión para scoring temporal)
    respuesta, tokens, tokens_in, tokens_out = await ServicioOraculo.consultar(
        mensaje_usuario=datos.mensaje,
        perfil_cosmico=perfil_cosmico,
        transitos=transitos,
        historial=historial,
        sesion=db,
    )

    # Registrar consumo API
    from app.servicios.servicio_consumo_api import registrar_consumo
    from app.configuracion import obtener_configuracion as _obtener_config
    _cfg = _obtener_config()
    await registrar_consumo(
        db,
        usuario_id=usuario.id,
        servicio="anthropic",
        operacion="chat_oraculo",
        tokens_entrada=tokens_in,
        tokens_salida=tokens_out,
        modelo=_cfg.oraculo_modelo,
    )

    # Guardar mensaje del usuario
    await repo_conv.agregar_mensaje(
        conversacion.id, "user", datos.mensaje,
    )

    # Guardar respuesta del oráculo
    await repo_conv.agregar_mensaje(
        conversacion.id, "assistant", respuesta, tokens=tokens,
    )

    # Incrementar conteo para usuarios gratis
    if not premium:
        await _incrementar_conteo(redis, usuario.id)
        restantes = (restantes or LIMITE_DIARIO_GRATIS) - 1

    logger.info(
        "Chat web: usuario=%s tokens=%d restantes=%s",
        usuario.id, tokens, restantes,
    )

    return {
        "exito": True,
        "datos": MensajeChatResponse(
            respuesta=respuesta,
            mensajes_restantes=restantes,
        ),
    }


@router.get("/historial")
async def obtener_historial(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Retorna el historial de la conversación web activa."""
    repo = RepositorioConversacion(db)
    conversacion = await repo.obtener_o_crear_web(usuario.id)
    mensajes = await repo.obtener_historial(conversacion.id, limite=50)

    return {
        "exito": True,
        "datos": {
            "mensajes": mensajes,
            "conversacion_id": str(conversacion.id),
        },
    }


@router.post("/nueva")
async def nueva_conversacion(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Archiva la conversación actual y crea una nueva."""
    repo = RepositorioConversacion(db)
    conversacion = await repo.nueva_conversacion_web(usuario.id)

    return {
        "exito": True,
        "datos": {
            "conversacion_id": str(conversacion.id),
        },
    }
