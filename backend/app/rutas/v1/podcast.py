"""Rutas de Podcasts Cósmicos."""

import io
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_podcast import RepositorioPodcast
from app.dependencias import obtener_db
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
    limite: int = Query(default=10, le=50),
):
    """Obtiene los últimos episodios del usuario."""
    repo = RepositorioPodcast(db)
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
):
    """Genera un episodio de podcast on-demand.

    Si ya existe uno listo para la fecha clave, lo retorna directamente.
    Si está generándose, retorna el estado actual para polling.
    """
    hoy = date.today()
    episodio = await ServicioPodcast.generar_episodio(db, usuario.id, hoy, tipo)
    return {
        "exito": True,
        "datos": _serializar_episodio(episodio),
        "mensaje": f"Episodio '{tipo}' procesado correctamente",
    }
