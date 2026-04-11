"""Endpoints del chat web con el Oráculo ASTRA."""

import uuid
from datetime import date, timezone

from fastapi import APIRouter, Depends, HTTPException
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

    # Obtener tránsitos actuales + próximos 3 días
    try:
        from datetime import date, timedelta
        hoy = date.today()
        transitos = ServicioTransitos.obtener_transitos_actuales()
        # Agregar tránsitos de los próximos 3 días para responder sobre "mañana", "lunes", etc.
        proximos_dias = []
        for i in range(1, 4):
            fecha_futura = (hoy + timedelta(days=i)).isoformat()
            try:
                t = await ServicioTransitos.obtener_transitos_fecha_persistido(fecha_futura, db)
                proximos_dias.append({
                    "fecha": fecha_futura,
                    "planetas": t.get("planetas", []),
                    "fase_lunar": t.get("fase_lunar", ""),
                })
            except Exception:
                pass
        if proximos_dias:
            transitos["proximos_dias"] = proximos_dias
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


@router.get("/conversaciones")
async def listar_conversaciones(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Lista las conversaciones web del usuario con preview del primer mensaje."""
    repo = RepositorioConversacion(db)
    conversaciones = await repo.listar_conversaciones_web(usuario.id)

    resultado = []
    for c in conversaciones:
        mensajes = c.mensajes or []
        # Primer mensaje del usuario como preview
        preview = ""
        for m in mensajes:
            if m.get("rol") == "user":
                preview = m.get("contenido", "")[:80]
                break
        if not preview and mensajes:
            preview = mensajes[0].get("contenido", "")[:80]

        ultimo_mensaje_en = mensajes[-1].get("fecha") if mensajes else None

        resultado.append({
            "id": str(c.id),
            "preview": preview,
            "titulo": c.titulo,
            "total_mensajes": len(mensajes),
            "activa": c.activa,
            "anclada": c.anclada,
            "archivada": c.archivada,
            "creado_en": c.creado_en.isoformat() if c.creado_en else None,
            "ultimo_mensaje_en": ultimo_mensaje_en,
        })

    return {"exito": True, "datos": resultado}


@router.post("/cambiar/{conversacion_id}")
async def cambiar_conversacion(
    conversacion_id: uuid.UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Cambia a una conversación existente (la activa)."""
    repo = RepositorioConversacion(db)
    conversacion = await repo.cambiar_conversacion_web(
        usuario.id, conversacion_id
    )
    if not conversacion:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    mensajes = await repo.obtener_historial(conversacion.id, limite=50)

    return {
        "exito": True,
        "datos": {
            "conversacion_id": str(conversacion.id),
            "mensajes": mensajes,
        },
    }


# ── Gestión de conversaciones ────────────────────────────────


class RenombrarRequest(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=120)


@router.put("/{conversacion_id}/renombrar")
async def renombrar_conversacion(
    conversacion_id: uuid.UUID,
    datos: RenombrarRequest,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Cambia el título de una conversación."""
    repo = RepositorioConversacion(db)
    conv = await repo.renombrar(usuario.id, conversacion_id, datos.titulo)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return {"exito": True, "datos": {"id": str(conv.id), "titulo": conv.titulo}}


@router.post("/{conversacion_id}/anclar")
async def anclar_conversacion(
    conversacion_id: uuid.UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Ancla o desancla una conversación."""
    repo = RepositorioConversacion(db)
    conv = await repo.alternar_anclada(usuario.id, conversacion_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return {"exito": True, "datos": {"id": str(conv.id), "anclada": conv.anclada}}


@router.post("/{conversacion_id}/archivar")
async def archivar_conversacion(
    conversacion_id: uuid.UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Archiva una conversación (la oculta de la lista)."""
    repo = RepositorioConversacion(db)
    conv = await repo.archivar(usuario.id, conversacion_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return {"exito": True, "datos": {"id": str(conv.id), "archivada": True}}


@router.delete("/{conversacion_id}")
async def eliminar_conversacion(
    conversacion_id: uuid.UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Elimina permanentemente una conversación."""
    repo = RepositorioConversacion(db)
    eliminada = await repo.eliminar(usuario.id, conversacion_id)
    if not eliminada:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    return {"exito": True, "datos": {"eliminada": True}}
