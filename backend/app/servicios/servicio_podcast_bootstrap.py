"""Bootstrap automático del podcast del día.

Se invoca como background task desde `/auth/me` cuando detectamos que un
usuario entra a ASTRA por primera vez en el día ARG. Dispara el pipeline
del podcast tipo "dia" en segundo plano sin bloquear la respuesta del
endpoint ni requerir acción manual del usuario.

Guardas antes de lanzar el pipeline:
- Usuario activo.
- Plan premium (paridad con `POST /podcast/generar`).
- Usuario con perfil cargado (natal, etc.).
- No hay otro bootstrap en curso para el mismo usuario (guard en memoria).
- `ServicioPodcast.generar_episodio` ya es idempotente por constraint único
  `(usuario_id, fecha, momento)` — si existe `listo` o `generando_*` retorna
  el existente sin relanzar.
"""

import uuid

from app.nucleo.utilidades_fecha import dia_arg_actual
from app.registro import logger
from app.utilidades.planes import es_plan_pago

# Set de usuario_ids con bootstrap en curso (evita dispatches paralelos).
_bootstrap_en_curso: set[str] = set()


async def bootstrap_dia_podcast(usuario_id: uuid.UUID) -> None:
    """Lanza el pipeline del podcast del día con sesión propia.

    Cualquier excepción queda logueada sin propagar — esto corre como
    background task y no debe romper la experiencia del usuario.
    """
    uid_str = str(usuario_id)
    if uid_str in _bootstrap_en_curso:
        return
    _bootstrap_en_curso.add(uid_str)

    try:
        # Imports locales para evitar cargar dependencias pesadas al importar
        # este módulo desde `auth.py` en el hot path de `/auth/me`.
        from redis.asyncio import Redis

        from app.configuracion import obtener_configuracion
        from app.datos.repositorio_perfil import RepositorioPerfil
        from app.datos.repositorio_plan import RepositorioPlan
        from app.datos.repositorio_suscripcion import RepositorioSuscripcion
        from app.datos.repositorio_usuario import RepositorioUsuario
        from app.datos.sesion import crear_motor_async, crear_sesion_factory
        from app.servicios.servicio_podcast import ServicioPodcast

        config = obtener_configuracion()
        motor = crear_motor_async()
        factory = crear_sesion_factory(motor)
        # Cliente Redis dedicado al background task: lo necesitamos para que
        # `ServicioPodcast.generar_episodio` invalide el cache del pronóstico
        # diario cuando el episodio queda `listo`. Sin esto, el dashboard
        # sigue mostrando los accionables del fallback durante todo el día.
        redis = Redis.from_url(config.redis_url, decode_responses=True)
        try:
            async with factory() as sesion:
                # 1. Usuario activo
                repo_usuario = RepositorioUsuario(sesion)
                usuario = await repo_usuario.obtener_por_id(usuario_id)
                if not usuario or not usuario.activo:
                    logger.debug(
                        "bootstrap podcast: usuario %s inactivo o inexistente",
                        uid_str,
                    )
                    return

                # 2. Plan premium
                repo_sus = RepositorioSuscripcion(sesion)
                suscripcion = await repo_sus.obtener_activa(usuario_id)
                if not suscripcion:
                    return
                repo_plan = RepositorioPlan(sesion)
                plan = await repo_plan.obtener_por_id(suscripcion.plan_id)
                if not plan or not es_plan_pago(plan.slug):
                    return

                # 3. Usuario con perfil cargado
                repo_perfil = RepositorioPerfil(sesion)
                perfil = await repo_perfil.obtener_por_usuario(usuario_id)
                if not perfil:
                    return

                # 4. Disparar pipeline (idempotente).
                await ServicioPodcast.generar_episodio(
                    sesion,
                    usuario_id,
                    dia_arg_actual(),
                    "dia",
                    origen="auto",
                    redis=redis,
                )
                logger.info(
                    "bootstrap podcast diario completado para usuario %s",
                    uid_str,
                )
        finally:
            try:
                await redis.aclose()
            except Exception:
                pass
            await motor.dispose()

    except Exception as e:
        logger.warning(
            "bootstrap podcast diario falló para usuario %s: %s", uid_str, e
        )
    finally:
        _bootstrap_en_curso.discard(uid_str)
