"""Resetea el estado del usuario para simular un "primer login del día".

Usado durante desarrollo para probar el banner del podcast del día
y el pipeline de auto-generación sin tener que esperar 24 horas.

Qué hace:
  1. Setea `usuarios.ultimo_acceso = NULL` del usuario indicado, para que
     `/auth/me` lo considere primer acceso del día ARG.
  2. Borra `podcast_episodios` del tipo "dia" correspondiente a hoy ARG,
     para que el pipeline lo regenere desde cero y el frontend pueda ver
     la transición `generando_guion → generando_audio → listo`.
  3. Opcionalmente borra el MP3 de MinIO (`--incluir-minio`). No es
     necesario porque la key es determinística y se sobreescribe al
     regenerar.

Uso:
    python -m scripts.dev.resetear_dia_usuario
    python -m scripts.dev.resetear_dia_usuario otro@email.com
    python -m scripts.dev.resetear_dia_usuario --incluir-minio
    python -m scripts.dev.resetear_dia_usuario otro@email.com --incluir-minio

Ver `backend/scripts/dev/README.md` para instrucciones completas.
"""

import argparse
import asyncio
import os
import sys

# Permitir resolver imports de `app.*` desde el directorio `backend/`
# cuando se ejecuta como `python -m scripts.dev.resetear_dia_usuario`.
sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ),
)

from sqlalchemy import delete, select, update

from app.datos.sesion import crear_motor_async, crear_sesion_factory
from app.modelos.podcast import PodcastEpisodio
from app.modelos.usuario import Usuario
from app.nucleo.utilidades_fecha import dia_arg_actual


EMAIL_DEFAULT = "magustin.morenom@gmail.com"


def _imprimir(etiqueta: str, valor: str = "", *, exito: bool = True) -> None:
    """Imprime una línea prolija con prefijo."""
    prefijo = "✓" if exito else "✗"
    if valor:
        print(f"  {prefijo} {etiqueta}: {valor}")
    else:
        print(f"  {prefijo} {etiqueta}")


async def resetear(email: str, incluir_minio: bool) -> int:
    motor = crear_motor_async()
    factory = crear_sesion_factory(motor)

    try:
        async with factory() as sesion:
            # 1. Buscar usuario
            resultado = await sesion.execute(
                select(Usuario).where(Usuario.email == email.lower().strip())
            )
            usuario = resultado.scalar_one_or_none()

            if not usuario:
                _imprimir(
                    f"Usuario {email} no encontrado", exito=False,
                )
                return 1

            print(f"\n→ Reseteando día de {usuario.email}")
            print(f"  id        : {usuario.id}")
            print(f"  nombre    : {usuario.nombre}")
            print(f"  último ac.: {usuario.ultimo_acceso}")
            print()

            # 2. Resetear ultimo_acceso
            await sesion.execute(
                update(Usuario)
                .where(Usuario.id == usuario.id)
                .values(ultimo_acceso=None)
            )
            _imprimir("ultimo_acceso", "NULL")

            # 3. Borrar episodio del podcast "dia" de hoy ARG
            hoy_arg = dia_arg_actual()
            resultado = await sesion.execute(
                delete(PodcastEpisodio)
                .where(
                    PodcastEpisodio.usuario_id == usuario.id,
                    PodcastEpisodio.fecha == hoy_arg,
                    PodcastEpisodio.momento == "dia",
                )
                .returning(PodcastEpisodio.id, PodcastEpisodio.url_audio)
            )
            borrados = list(resultado.all())

            await sesion.commit()

            if borrados:
                _imprimir(
                    "podcast_episodios",
                    f"{len(borrados)} fila(s) eliminada(s) para fecha={hoy_arg}",
                )
                urls_audio = [r.url_audio for r in borrados if r.url_audio]
            else:
                _imprimir(
                    "podcast_episodios",
                    f"no había episodio tipo 'dia' para fecha={hoy_arg}",
                )
                urls_audio = []

            # 4. Opcional: limpiar MinIO (usando el cliente subyacente del
            #    servicio — no hay método `eliminar_objeto` público)
            if incluir_minio and urls_audio:
                try:
                    from app.configuracion import obtener_configuracion
                    from app.servicios.servicio_almacenamiento import (
                        ServicioAlmacenamiento,
                    )

                    cliente = ServicioAlmacenamiento._obtener_cliente()
                    bucket = obtener_configuracion().minio_bucket
                    for key in urls_audio:
                        try:
                            cliente.remove_object(bucket, key)
                            _imprimir("minio", f"eliminado {key}")
                        except Exception as e:
                            _imprimir(
                                "minio", f"error eliminando {key}: {e}",
                                exito=False,
                            )
                except Exception as e:
                    _imprimir("minio", f"no disponible: {e}", exito=False)
    finally:
        await motor.dispose()

    print()
    print("Listo. Ahora:")
    print("  1. Abrí DevTools → Console y ejecutá:")
    print(
        '     Object.keys(localStorage)'
        '.filter(k => k.startsWith("astra:podcast_banner_"))'
        '.forEach(k => localStorage.removeItem(k));'
    )
    print("  2. Refrescá la página.")
    print("  3. El banner debería aparecer en unos segundos.")
    print()
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Resetea ultimo_acceso y borra el podcast del día de un usuario "
            "para simular primer login del día."
        )
    )
    parser.add_argument(
        "email",
        nargs="?",
        default=EMAIL_DEFAULT,
        help=f"Email del usuario (default: {EMAIL_DEFAULT})",
    )
    parser.add_argument(
        "--incluir-minio",
        action="store_true",
        help="También eliminar el MP3 del bucket (no es necesario normalmente).",
    )
    args = parser.parse_args()

    codigo = asyncio.run(resetear(args.email, args.incluir_minio))
    sys.exit(codigo)


if __name__ == "__main__":
    main()
