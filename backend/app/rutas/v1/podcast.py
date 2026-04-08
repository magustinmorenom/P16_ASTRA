"""Rutas de Podcasts Cósmicos."""

import io
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_podcast import (
    LIMITE_HISTORIAL_PODCAST,
    RepositorioPodcast,
)
from app.dependencias import obtener_db, obtener_redis
from app.dependencias_auth import obtener_usuario_actual
from app.dependencias_suscripcion import requiere_plan
from app.modelos.usuario import Usuario
from app.servicios.servicio_almacenamiento import ServicioAlmacenamiento
from app.servicios.servicio_podcast import ServicioPodcast, _calcular_fecha_clave

router = APIRouter(prefix="/podcast", tags=["Podcasts"])


def _serializar_episodio(ep) -> dict:
    """Convierte un episodio a dict para respuesta API."""
    return {
        "id": str(ep.id),
        "fecha": ep.fecha.isoformat(),
        "tipo": ep.momento,
        "titulo": ep.titulo,
        "guion_md": ep.guion_md,
        "segmentos": ep.segmentos_json or [],
        "duracion_segundos": ep.duracion_segundos,
        "url_audio": ep.url_audio,
        "estado": ep.estado,
        "origen": getattr(ep, "origen", "manual"),
        "fecha_objetivo": ep.fecha_objetivo.isoformat() if getattr(ep, "fecha_objetivo", None) else ep.fecha.isoformat(),
        "acciones": getattr(ep, "acciones_json", None) or [],
        "error_detalle": ep.error_detalle,
        "creado_en": ep.creado_en.isoformat() if ep.creado_en else None,
    }


@router.get("/hoy")
async def obtener_episodios_hoy(
    usuario: Usuario = Depends(obtener_usuario_actual),
    _plan: None = Depends(requiere_plan("premium")),
    db: AsyncSession = Depends(obtener_db),
):
    """Obtiene los episodios de podcast existentes para el usuario (día/semana/mes actuales)."""
    repo = RepositorioPodcast(db)
    hoy = date.today()

    episodios = []
    for tipo in ("dia", "semana", "mes"):
        fecha_clave = _calcular_fecha_clave(tipo, hoy)
        ep = await repo.obtener_episodio(usuario.id, fecha_clave, tipo)
        if ep:
            episodios.append(ep)

    return {
        "exito": True,
        "datos": [_serializar_episodio(ep) for ep in episodios],
    }


@router.get("/episodio/{episodio_id}")
async def obtener_episodio(
    episodio_id: uuid.UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    _plan: None = Depends(requiere_plan("premium")),
    db: AsyncSession = Depends(obtener_db),
):
    """Obtiene el detalle de un episodio (incluye guión y segmentos)."""
    repo = RepositorioPodcast(db)
    episodio = await repo.obtener_episodio_por_id(episodio_id)
    if not episodio or episodio.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Episodio no encontrado")
    return {
        "exito": True,
        "datos": _serializar_episodio(episodio),
    }


@router.get("/audio/{episodio_id}")
async def obtener_audio(
    episodio_id: uuid.UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    _plan: None = Depends(requiere_plan("premium")),
    db: AsyncSession = Depends(obtener_db),
):
    """Sirve el audio directamente desde MinIO como stream.

    Antes devolvía una URL presigned, pero como MinIO corre dentro de Docker
    con hostname interno (minio:9000), el browser no puede acceder a esa URL.
    Ahora el backend actúa como proxy y sirve los bytes directamente.
    """
    repo = RepositorioPodcast(db)
    episodio = await repo.obtener_episodio_por_id(episodio_id)
    if not episodio or episodio.usuario_id != usuario.id:
        raise HTTPException(status_code=404, detail="Episodio no encontrado")
    if not episodio.url_audio or episodio.estado != "listo":
        raise HTTPException(status_code=404, detail="Audio no disponible aún")

    datos_audio = ServicioAlmacenamiento.obtener_objeto(episodio.url_audio)

    return StreamingResponse(
        io.BytesIO(datos_audio),
        media_type="audio/mpeg",
        headers={
            "Content-Length": str(len(datos_audio)),
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=3600",
        },
    )


@router.get("/historial")
async def obtener_historial(
    usuario: Usuario = Depends(obtener_usuario_actual),
    _plan: None = Depends(requiere_plan("premium")),
    db: AsyncSession = Depends(obtener_db),
    limite: int = Query(default=LIMITE_HISTORIAL_PODCAST, le=50),
):
    """Obtiene los últimos episodios del usuario."""
    repo = RepositorioPodcast(db)
    await repo.normalizar_retencion_usuario(usuario.id)
    episodios = await repo.obtener_ultimos_episodios(usuario.id, limite)
    return {
        "exito": True,
        "datos": [_serializar_episodio(ep) for ep in episodios],
    }


@router.post("/generar")
async def generar_podcast(
    tipo: str = Query(..., pattern="^(dia|semana|mes)$"),
    usuario: Usuario = Depends(obtener_usuario_actual),
    _plan: None = Depends(requiere_plan("premium")),
    db: AsyncSession = Depends(obtener_db),
    redis: Redis = Depends(obtener_redis),
):
    """Genera un episodio de podcast on-demand.

    Si ya existe uno listo para la fecha clave, lo retorna directamente.
    Si está generándose, retorna el estado actual para polling.
    """
    hoy = date.today()
    episodio = await ServicioPodcast.generar_episodio(db, usuario.id, hoy, tipo)

    # Si se generó o ya existe un podcast del DÍA, invalidamos el caché del pronóstico
    # para que se recalcule basándose en esta nueva lectura diaria.
    if tipo == "dia":
        fecha_str = hoy.isoformat()
        clave_cache = f"cosmic:pronostico:diario:{usuario.id}:{fecha_str}"
        await redis.delete(clave_cache)

    repo = RepositorioPodcast(db)
    await repo.normalizar_retencion_usuario(usuario.id)
    return {
        "exito": True,
        "datos": _serializar_episodio(episodio),
        "mensaje": f"Episodio '{tipo}' procesado correctamente",
    }


@router.post("/preview-manana")
async def generar_preview_manana(
    usuario: Usuario = Depends(obtener_usuario_actual),
    _plan: None = Depends(requiere_plan("premium")),
    db: AsyncSession = Depends(obtener_db),
    tz_offset: int = Query(default=-3, description="Offset UTC del usuario en horas (ej: -3 para ARG)"),
):
    """Genera el podcast de mañana como preview.

    Disponible a partir de las 19:00 hora local del usuario.
    El contenido se genera con marcador temporal "MAÑANA" para que el saludo
    diga "mañana" en vez de "hoy". Cuando llegue el día siguiente, el mismo
    episodio se sirve como contenido del día (la intro ya dice "mañana"
    y el contenido es el correcto para esa fecha).
    """
    ahora_utc = datetime.now(timezone.utc)
    hora_local = ahora_utc + timedelta(hours=tz_offset)

    if hora_local.hour < 19:
        raise HTTPException(
            status_code=400,
            detail="El preview de mañana está disponible a partir de las 19:00 hora local.",
        )

    manana = date.today() + timedelta(days=1)
    episodio = await ServicioPodcast.generar_episodio(
        db, usuario.id, manana, "dia",
        origen="preview",
        fecha_objetivo=manana,
    )

    repo = RepositorioPodcast(db)
    await repo.normalizar_retencion_usuario(usuario.id)
    return {
        "exito": True,
        "datos": _serializar_episodio(episodio),
        "mensaje": "Preview de mañana generado",
    }
