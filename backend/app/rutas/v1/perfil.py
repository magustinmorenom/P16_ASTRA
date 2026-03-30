"""Rutas de perfiles de usuario."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.gestor_cache import GestorCache
from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_perfil import RepositorioPerfil
from app.dependencias_auth import obtener_usuario_actual, obtener_usuario_opcional
from app.esquemas.entrada import DatosActualizarPerfil, DatosNacimiento
from app.excepciones import PerfilNoEncontrado
from app.modelos.usuario import Usuario
from app.nucleo.servicio_geo import ServicioGeo
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.principal import _obtener_db_placeholder, _obtener_redis_placeholder
from app.servicios.servicio_pdf_perfil import ServicioPDFPerfil

router = APIRouter()


@router.post("/profile")
async def crear_perfil(
    datos: DatosNacimiento,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    usuario: Usuario | None = Depends(obtener_usuario_opcional),
):
    """Crea un nuevo perfil con datos de nacimiento."""
    # Usar coords pre-resueltas si vienen, sino geocodificar (retrocompat web)
    if datos.latitud is not None and datos.longitud is not None and datos.zona_horaria:
        lat = datos.latitud
        lon = datos.longitud
        zona = datos.zona_horaria
    else:
        geo = await ServicioGeo.geocodificar(
            datos.ciudad_nacimiento,
            datos.pais_nacimiento,
        )
        lat = geo.latitud
        lon = geo.longitud
        zona = ServicioZonaHoraria.obtener_zona_horaria(lat, lon)

    # Crear perfil
    repo = RepositorioPerfil(db)
    perfil = await repo.crear(
        nombre=datos.nombre,
        fecha_nacimiento=datos.fecha_nacimiento,
        hora_nacimiento=datos.hora_nacimiento,
        ciudad_nacimiento=datos.ciudad_nacimiento,
        pais_nacimiento=datos.pais_nacimiento,
        latitud=lat,
        longitud=lon,
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


@router.put("/profile/me")
async def actualizar_mi_perfil(
    datos: DatosActualizarPerfil,
    db: AsyncSession = Depends(_obtener_db_placeholder),
    redis: Redis = Depends(_obtener_redis_placeholder),
    usuario: Usuario = Depends(obtener_usuario_actual),
):
    """Actualiza el perfil del usuario autenticado. Re-geocodifica si cambia ciudad/país."""
    repo = RepositorioPerfil(db)
    perfil = await repo.obtener_por_usuario(usuario.id)

    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    campos_actualizar: dict = {}
    datos_dict = datos.model_dump(exclude_none=True)

    if not datos_dict:
        raise HTTPException(status_code=422, detail="No se proporcionaron campos para actualizar")

    # Detectar si cambian datos de nacimiento (afectan cálculos)
    campos_nacimiento = {"fecha_nacimiento", "hora_nacimiento", "ciudad_nacimiento", "pais_nacimiento"}
    datos_nacimiento_cambiaron = False

    for campo in campos_nacimiento:
        if campo in datos_dict:
            valor_actual = getattr(perfil, campo)
            valor_nuevo = datos_dict[campo]
            # hora_nacimiento es time en el modelo, comparar como string
            if campo == "hora_nacimiento":
                valor_actual = str(valor_actual)[:5] if valor_actual else None
            else:
                valor_actual = str(valor_actual) if valor_actual else None
                valor_nuevo = str(valor_nuevo) if valor_nuevo else None
            if valor_actual != valor_nuevo:
                datos_nacimiento_cambiaron = True
                break

    # Si cambió ciudad o país → re-geocodificar
    ciudad = datos_dict.get("ciudad_nacimiento", perfil.ciudad_nacimiento)
    pais = datos_dict.get("pais_nacimiento", perfil.pais_nacimiento)
    if datos_nacimiento_cambiaron and ("ciudad_nacimiento" in datos_dict or "pais_nacimiento" in datos_dict):
        geo = await ServicioGeo.geocodificar(ciudad, pais)
        zona = ServicioZonaHoraria.obtener_zona_horaria(geo.latitud, geo.longitud)
        campos_actualizar["latitud"] = geo.latitud
        campos_actualizar["longitud"] = geo.longitud
        campos_actualizar["zona_horaria"] = zona

    # Agregar todos los campos proporcionados
    campos_actualizar.update(datos_dict)

    # Actualizar perfil en DB
    perfil = await repo.actualizar(perfil, **campos_actualizar)

    # Si cambiaron datos de nacimiento → eliminar cálculos viejos + invalidar cache
    if datos_nacimiento_cambiaron:
        repo_calculo = RepositorioCalculo(db)
        hashes = await repo_calculo.eliminar_todos_por_perfil(perfil.id)
        if hashes:
            cache = GestorCache(redis)
            await cache.invalidar_multiples(hashes)

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
            "datos_nacimiento_cambiaron": datos_nacimiento_cambiaron,
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
