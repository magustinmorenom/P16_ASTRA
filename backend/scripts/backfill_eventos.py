"""Backfill de eventos notables para transitos_diarios existentes.

Compara cada día con el anterior para detectar cambios de signo,
retrogradaciones, aspectos exactos y fases lunares principales.

Ejecución: python -m scripts.backfill_eventos
"""

import asyncio
import os
import sys
import time

import swisseph as swe

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update

from app.configuracion import obtener_configuracion
from app.datos.sesion import crear_motor_async, crear_sesion_factory
from app.modelos.transito_diario import TransitoDiario
from app.servicios.servicio_transitos_persistidos import calcular_eventos


async def backfill() -> None:
    config = obtener_configuracion()
    ruta_efemerides = os.path.abspath(config.ephe_path)
    swe.set_ephe_path(ruta_efemerides)

    motor = crear_motor_async()
    sf = crear_sesion_factory(motor)

    async with sf() as sesion:
        # Obtener todos los tránsitos ordenados por fecha
        resultado = await sesion.execute(
            select(TransitoDiario).order_by(TransitoDiario.fecha)
        )
        transitos = list(resultado.scalars().all())

        print(f"Total tránsitos: {len(transitos)}")
        t0 = time.time()
        actualizados = 0

        for i, t in enumerate(transitos):
            planetas_ayer = transitos[i - 1].planetas if i > 0 else None
            eventos = calcular_eventos(t.planetas, planetas_ayer, t.fase_lunar)

            await sesion.execute(
                update(TransitoDiario)
                .where(TransitoDiario.id == t.id)
                .values(eventos=eventos)
            )
            actualizados += 1

            if actualizados % 100 == 0:
                await sesion.commit()
                print(f"  {actualizados}/{len(transitos)}", end="\r")

        await sesion.commit()
        print(f"\nBackfill completado: {actualizados} filas en {time.time() - t0:.1f}s")

    await motor.dispose()
    swe.close()


if __name__ == "__main__":
    print("=== Backfill de Eventos Notables ===")
    asyncio.run(backfill())
