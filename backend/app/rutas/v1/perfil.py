"""Rutas de perfiles de usuario."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_perfil import RepositorioPerfil
from app.dependencias_auth import obtener_usuario_actual, obtener_usuario_opcional
from app.esquemas.entrada import DatosNacimiento
from app.excepciones import PerfilNoEncontrado
from app.modelos.usuario import Usuario
from app.nucleo.servicio_geo import ServicioGeo
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.principal import _obtener_db_placeholder
from app.servicios.servicio_pdf_perfil import ServicioPDFPerfil

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


@router.get("/profile/me")
async def obtener_mi_perfil(
    db: AsyncSession = Depends(_obtener_db_placeholder),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    """Obtiene el perfil principal del usuario autenticado."""
    repo = RepositorioPerfil(db)
    perfil = await repo.obtener_por_usuario(usuario.id)

    if not perfil:
        return {"exito": True, "datos": None}

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


@router.get("/profile/me/calculos")
async def obtener_mis_calculos(
    db: AsyncSession = Depends(_obtener_db_placeholder),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    """Obtiene todos los cálculos persistidos del usuario autenticado."""
    repo_perfil = RepositorioPerfil(db)
    perfil = await repo_perfil.obtener_por_usuario(usuario.id)

    if not perfil:
        return {
            "exito": True,
            "datos": {
                "natal": None,
                "diseno_humano": None,
                "numerologia": None,
                "retorno_solar": None,
            },
        }

    repo_calculo = RepositorioCalculo(db)
    calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)

    return {"exito": True, "datos": calculos}


@router.get("/profile/me/pdf")
async def descargar_perfil_pdf(
    db: AsyncSession = Depends(_obtener_db_placeholder),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    """Genera y descarga el perfil cósmico completo en formato PDF."""
    repo_perfil = RepositorioPerfil(db)
    perfil = await repo_perfil.obtener_por_usuario(usuario.id)

    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    perfil_dict = {
        "nombre": perfil.nombre,
        "fecha_nacimiento": str(perfil.fecha_nacimiento),
        "hora_nacimiento": str(perfil.hora_nacimiento),
        "ciudad_nacimiento": perfil.ciudad_nacimiento,
        "pais_nacimiento": perfil.pais_nacimiento,
    }

    repo_calculo = RepositorioCalculo(db)
    calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)

    buffer = ServicioPDFPerfil.generar(perfil_dict, calculos)

    nombre_archivo = f"perfil_cosmico_{perfil.nombre.replace(' ', '_')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={nombre_archivo}"},
    )


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
