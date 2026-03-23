"""Factory de la aplicación FastAPI — CosmicEngine."""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import swisseph as swe
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.datos.sesion import crear_motor_async, crear_sesion_factory
from app.excepciones import CosmicEngineError, manejar_error_cosmic
from app.middleware.tiempo_respuesta import MiddlewareTiempoRespuesta
from app.registro import logger


async def _sincronizar_credenciales_mp(sesion_factory, config) -> None:
    """Sincroniza credenciales de MP desde variables de entorno a la BD.

    Esto evita que los placeholders de la migración bloqueen los pagos
    cuando se recrea la BD (ej: `levantar.sh reiniciar`).
    """
    from sqlalchemy import text

    paises = {
        "AR": (config.mp_access_token_ar, config.mp_public_key_ar),
        "BR": (config.mp_access_token_br, config.mp_public_key_br),
        "MX": (config.mp_access_token_mx, config.mp_public_key_mx),
    }

    try:
        async with sesion_factory() as sesion:
            for pais_codigo, (access_token, public_key) in paises.items():
                if not access_token or access_token == "":
                    continue
                await sesion.execute(
                    text("""
                        UPDATE config_pais_mp
                        SET mp_access_token = :token, mp_public_key = :pk
                        WHERE pais_codigo = :pais
                          AND (mp_access_token LIKE '%%placeholder%%'
                               OR mp_access_token != :token)
                    """),
                    {"token": access_token, "pk": public_key, "pais": pais_codigo},
                )
            await sesion.commit()
            logger.info("Credenciales MP sincronizadas desde .env")
    except Exception as e:
        logger.warning("No se pudieron sincronizar credenciales MP: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Ciclo de vida de la aplicación."""
    config = obtener_configuracion()
    logger.info("Iniciando CosmicEngine v%s en modo %s", config.version, config.ambiente)

    # Swiss Ephemeris
    ruta_efemerides = os.path.abspath(config.ephe_path)
    swe.set_ephe_path(ruta_efemerides)
    logger.info("Efemérides configuradas en: %s", ruta_efemerides)

    # Base de datos
    motor = crear_motor_async()
    sesion_factory = crear_sesion_factory(motor)
    app.state.motor_db = motor
    app.state.sesion_factory = sesion_factory
    logger.info("Motor de base de datos creado")

    # Sincronizar credenciales MP desde .env → config_pais_mp
    await _sincronizar_credenciales_mp(sesion_factory, config)

    # Redis
    redis = Redis.from_url(config.redis_url, decode_responses=True)
    app.state.redis = redis
    logger.info("Conexión Redis establecida")

    yield

    # Limpieza
    await redis.close()
    await motor.dispose()
    swe.close()
    logger.info("CosmicEngine detenido")


def crear_aplicacion() -> FastAPI:
    """Crea y configura la aplicación FastAPI."""
    config = obtener_configuracion()

    app = FastAPI(
        title="CosmicEngine",
        description="Plataforma de cálculo esotérico-astronómico",
        version=config.version,
        lifespan=lifespan,
    )

    # Excepciones
    app.add_exception_handler(CosmicEngineError, manejar_error_cosmic)

    # Middleware
    app.add_middleware(MiddlewareTiempoRespuesta)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Dependencias inyectadas desde el estado
    async def obtener_db() -> AsyncGenerator[AsyncSession, None]:
        async with app.state.sesion_factory() as sesion:
            yield sesion

    async def obtener_redis_dep() -> Redis:
        return app.state.redis

    app.dependency_overrides[_obtener_db_placeholder] = obtener_db
    app.dependency_overrides[_obtener_redis_placeholder] = obtener_redis_dep

    # Rutas
    _registrar_rutas(app)

    return app


def _obtener_db_placeholder():
    """Placeholder para DI de base de datos."""
    pass


def _obtener_redis_placeholder():
    """Placeholder para DI de Redis."""
    pass


def _registrar_rutas(app: FastAPI) -> None:
    """Registra todos los routers de la API."""
    from app.rutas.v1 import (
        auth,
        calendario_cosmico,
        diseno_humano,
        natal,
        numerologia,
        oraculo,
        perfil,
        retorno_solar,
        suscripcion,
        transitos,
    )

    prefijo = "/api/v1"
    app.include_router(auth.router, prefix=prefijo)
    app.include_router(natal.router, prefix=prefijo, tags=["Carta Natal"])
    app.include_router(diseno_humano.router, prefix=prefijo, tags=["Diseño Humano"])
    app.include_router(numerologia.router, prefix=prefijo, tags=["Numerología"])
    app.include_router(retorno_solar.router, prefix=prefijo, tags=["Revolución Solar"])
    app.include_router(transitos.router, prefix=prefijo, tags=["Tránsitos"])
    app.include_router(calendario_cosmico.router, prefix=prefijo, tags=["Calendario Cósmico"])
    app.include_router(perfil.router, prefix=prefijo, tags=["Perfiles"])
    app.include_router(suscripcion.router, prefix=prefijo)
    app.include_router(oraculo.router, prefix=prefijo)

    @app.get("/health", tags=["Sistema"])
    async def health_check():
        """Verifica el estado del sistema."""
        config = obtener_configuracion()
        estado_db = "desconectado"
        estado_redis = "desconectado"
        estado_efemerides = "no encontrado"

        # Verificar DB
        try:
            async with app.state.sesion_factory() as sesion:
                await sesion.execute(
                    __import__("sqlalchemy").text("SELECT 1")
                )
                estado_db = "conectado"
        except Exception:
            pass

        # Verificar Redis
        try:
            await app.state.redis.ping()
            estado_redis = "conectado"
        except Exception:
            pass

        # Verificar archivos de efemérides
        ruta = os.path.abspath(config.ephe_path)
        if os.path.isdir(ruta):
            archivos_se1 = [f for f in os.listdir(ruta) if f.endswith(".se1")]
            estado_efemerides = f"{len(archivos_se1)} archivos" if archivos_se1 else "directorio vacío"

        todo_ok = estado_db == "conectado" and estado_redis == "conectado"
        return {
            "estado": "saludable" if todo_ok else "degradado",
            "version": config.version,
            "base_datos": estado_db,
            "redis": estado_redis,
            "efemerides": estado_efemerides,
        }


# Instancia global de la aplicación
aplicacion = crear_aplicacion()
