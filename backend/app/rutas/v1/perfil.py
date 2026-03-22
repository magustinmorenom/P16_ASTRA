"""Rutas de perfiles de usuario."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_perfil import RepositorioPerfil
from app.dependencias_auth import obtener_usuario_opcional
from app.esquemas.entrada import DatosNacimiento
from app.excepciones import PerfilNoEncontrado
from app.modelos.usuario import Usuario
from app.nucleo.servicio_geo import ServicioGeo
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.principal import _obtener_db_placeholder

router = APIRouter()


@router.post("/profile")
async def crear_perfil(
    datos: DatosNacimiento,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    usuario: Usuario | None = Depends(obtener_usuario_opcional),
):
    """Crea un nuevo perfil con datos de nacimiento."""
    # Geocodificar
    geo = await ServicioGeo.geocodificar(
        datos.ciudad_nacimiento,
        datos.pais_nacimiento,
    )

    # Zona horaria
    zona = ServicioZonaHoraria.obtener_zona_horaria(geo.latitud, geo.longitud)

    # Crear perfil
    repo = RepositorioPerfil(db)
    perfil = await repo.crear(
        nombre=datos.nombre,
        fecha_nacimiento=datos.fecha_nacimiento,
        hora_nacimiento=datos.hora_nacimiento,
        ciudad_nacimiento=datos.ciudad_nacimiento,
        pais_nacimiento=datos.pais_nacimiento,
        latitud=geo.latitud,
        longitud=geo.longitud,
        zona_horaria=zona,
        usuario_id=usuario.id if usuario else None,
    )

    return {
        "exito": True,
        "datos": {
            "id": str(perfil.id),
            "nombre": perfil.nombre,
            "fecha_nacimiento": str(perfil.fecha_nacimiento),
            "hora_nacimiento": str(perfil.hora_nacimiento),
            "ciudad_nacimiento": perfil.ciudad_nacimiento,
            "pais_nacimiento": perfil.pais_nacimiento,
            "latitud": float(perfil.latitud) if perfil.latitud else None,
            "longitud": float(perfil.longitud) if perfil.longitud else None,
            "zona_horaria": perfil.zona_horaria,
        },
    }


@router.get("/profile/{perfil_id}")
async def obtener_perfil(
    perfil_id: uuid.UUID,
    db: AsyncSession = Depends(_obtener_db_placeholder),
):
    """Obtiene un perfil por su ID."""
    repo = RepositorioPerfil(db)
    perfil = await repo.obtener_por_id(perfil_id)

    if not perfil:
        raise PerfilNoEncontrado(str(perfil_id))

    return {
        "exito": True,
        "datos": {
            "id": str(perfil.id),
            "nombre": perfil.nombre,
            "fecha_nacimiento": str(perfil.fecha_nacimiento),
            "hora_nacimiento": str(perfil.hora_nacimiento),
            "ciudad_nacimiento": perfil.ciudad_nacimiento,
            "pais_nacimiento": perfil.pais_nacimiento,
            "latitud": float(perfil.latitud) if perfil.latitud else None,
            "longitud": float(perfil.longitud) if perfil.longitud else None,
            "zona_horaria": perfil.zona_horaria,
        },
    }
