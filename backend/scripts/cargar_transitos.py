"""Script de carga inicial de tránsitos diarios.

Calcula y persiste:
- 365 días hacia atrás (estado='pasado')
- Hoy (estado='presente')
- 365 días hacia adelante (estado='futuro')

Ejecución: python -m scripts.cargar_transitos [--atras N] [--adelante N]
"""

import argparse
import asyncio
import os
import sys
import time

import swisseph as swe

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta

from app.configuracion import obtener_configuracion
from app.datos.repositorio_transito import RepositorioTransito
from app.datos.sesion import crear_motor_async, crear_sesion_factory
from app.servicios.servicio_transitos_persistidos import (
    calcular_transito_para_fecha,
    _determinar_estado,
)


async def cargar(dias_atras: int, dias_adelante: int) -> None:
    """Carga inicial de tránsitos."""
    config = obtener_configuracion()

    # Inicializar efemérides
    ruta_efemerides = os.path.abspath(config.ephe_path)
    swe.set_ephe_path(ruta_efemerides)
    print(f"Efemérides: {ruta_efemerides}")

    motor = crear_motor_async()
    sesion_factory = crear_sesion_factory(motor)

    hoy = date.today()
    fecha_inicio = hoy - timedelta(days=dias_atras)
    fecha_fin = hoy + timedelta(days=dias_adelante)
    total_dias = (fecha_fin - fecha_inicio).days + 1

    print(f"Rango: {fecha_inicio} → {fecha_fin} ({total_dias} días)")
    print(f"Hoy: {hoy}")

    t0 = time.time()
    datos_lote = []
    fecha_actual = fecha_inicio

    while fecha_actual <= fecha_fin:
        transito = calcular_transito_para_fecha(fecha_actual)
        transito["estado"] = _determinar_estado(fecha_actual, hoy)
        datos_lote.append(transito)
        fecha_actual += timedelta(days=1)

    t_calculo = time.time() - t0
    print(f"Cálculo completado: {len(datos_lote)} días en {t_calculo:.1f}s")

    # Insertar en lotes de 100
    async with sesion_factory() as sesion:
        repo = RepositorioTransito(sesion)
        insertados_total = 0

        for i in range(0, len(datos_lote), 100):
            lote = datos_lote[i : i + 100]
            insertados = await repo.crear_lote(lote)
            insertados_total += insertados
            await sesion.commit()
            progreso = min(i + 100, len(datos_lote))
            print(f"  Insertados: {progreso}/{len(datos_lote)}", end="\r")

        print(f"\nDB: {insertados_total} filas nuevas insertadas (duplicados ignorados)")

    await motor.dispose()
    swe.close()

    t_total = time.time() - t0
    print(f"Total: {t_total:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="Cargar tránsitos diarios")
    parser.add_argument("--atras", type=int, default=365, help="Días hacia atrás (default: 365)")
    parser.add_argument("--adelante", type=int, default=365, help="Días hacia adelante (default: 365)")
    args = parser.parse_args()

    print(f"=== Carga Inicial de Tránsitos Diarios ===")
    asyncio.run(cargar(args.atras, args.adelante))


if __name__ == "__main__":
    main()
