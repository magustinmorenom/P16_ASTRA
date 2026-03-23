#!/usr/bin/env python3
"""Script interactivo para configurar credenciales de prueba de MercadoPago.

Uso:
    python scripts/configurar_mp.py

Prerrequisitos:
    - PostgreSQL corriendo (docker-compose up -d)
    - Migraciones aplicadas (alembic upgrade head)
    - Cuenta de desarrollador en https://www.mercadopago.com/developers
"""

import asyncio
import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import httpx
from sqlalchemy import text, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.configuracion import obtener_configuracion
from app.modelos.config_pais_mp import ConfigPaisMp


INSTRUCCIONES = """
╔══════════════════════════════════════════════════════════════════╗
║           Configuración de MercadoPago — Credenciales Test      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. Ir a https://www.mercadopago.com/developers/panel/app       ║
║  2. Crear una aplicación de prueba                               ║
║  3. En "Credenciales de prueba" copiar:                          ║
║     - Access Token (TEST-xxxx...)                                ║
║     - Public Key (TEST-xxxx...)                                  ║
║                                                                  ║
║  Nota: Para testing usar tarjeta:                                ║
║    Número: 5031 7557 3453 0604                                   ║
║    Vencimiento: 11/25                                            ║
║    CVV: 123                                                      ║
║    Titular: APRO (aprueba el pago)                               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"""


async def verificar_conexion_mp(access_token: str) -> bool:
    """Verifica que las credenciales de MP son válidas."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.mercadopago.com/v1/payment_methods",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            if resp.status_code == 200:
                metodos = resp.json()
                print(f"  ✓ Conexión exitosa — {len(metodos)} métodos de pago disponibles")
                return True
            else:
                print(f"  ✗ Error: HTTP {resp.status_code}")
                return False
    except Exception as e:
        print(f"  ✗ Error de conexión: {e}")
        return False


async def actualizar_credenciales_pais(
    sesion: AsyncSession,
    pais_codigo: str,
    access_token: str,
    public_key: str,
) -> None:
    """Actualiza las credenciales de un país en la BD."""
    await sesion.execute(
        update(ConfigPaisMp)
        .where(ConfigPaisMp.pais_codigo == pais_codigo)
        .values(
            mp_access_token=access_token,
            mp_public_key=public_key,
        )
    )
    await sesion.commit()


async def main():
    print(INSTRUCCIONES)

    config = obtener_configuracion()
    engine = create_async_engine(config.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Verificar conexión a BD
    try:
        async with async_session() as sesion:
            resultado = await sesion.execute(text("SELECT COUNT(*) FROM config_pais_mp"))
            cantidad = resultado.scalar()
            print(f"Países configurados en BD: {cantidad}\n")
    except Exception as e:
        print(f"Error conectando a la BD: {e}")
        print("Asegurate de tener PostgreSQL corriendo y las migraciones aplicadas.")
        return

    pais = input("¿Para qué país querés configurar? (AR/BR/MX) [AR]: ").strip().upper() or "AR"
    if pais not in ("AR", "BR", "MX"):
        print("País inválido. Debe ser AR, BR o MX.")
        return

    access_token = input(f"\nAccess Token de prueba para {pais}: ").strip()
    if not access_token:
        print("Access Token vacío. Abortando.")
        return

    public_key = input(f"Public Key de prueba para {pais}: ").strip()
    if not public_key:
        print("Public Key vacía. Abortando.")
        return

    # Verificar conexión
    print(f"\nVerificando credenciales para {pais}...")
    valido = await verificar_conexion_mp(access_token)

    if not valido:
        continuar = input("\nLas credenciales parecen inválidas. ¿Continuar igualmente? (s/N): ").strip().lower()
        if continuar != "s":
            print("Abortado.")
            return

    # Actualizar BD
    print(f"\nActualizando credenciales de {pais} en la BD...")
    async with async_session() as sesion:
        await actualizar_credenciales_pais(sesion, pais, access_token, public_key)
    print(f"  ✓ Credenciales de {pais} actualizadas correctamente")

    # Opcionalmente escribir .env
    escribir_env = input("\n¿Escribir también en archivo .env? (s/N): ").strip().lower()
    if escribir_env == "s":
        env_path = os.path.join(os.path.dirname(__file__), "..", "backend", ".env")
        pais_lower = pais.lower()
        lineas_nuevas = [
            f"MP_ACCESS_TOKEN_{pais}={access_token}",
            f"MP_PUBLIC_KEY_{pais}={public_key}",
        ]

        # Leer .env existente si existe
        contenido_existente = ""
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                contenido_existente = f.read()

        # Reemplazar o agregar líneas
        for linea in lineas_nuevas:
            clave = linea.split("=")[0]
            if clave in contenido_existente:
                # Reemplazar línea existente
                nuevas_lineas = []
                for l in contenido_existente.split("\n"):
                    if l.startswith(f"{clave}="):
                        nuevas_lineas.append(linea)
                    else:
                        nuevas_lineas.append(l)
                contenido_existente = "\n".join(nuevas_lineas)
            else:
                contenido_existente += f"\n{linea}"

        with open(env_path, "w") as f:
            f.write(contenido_existente.strip() + "\n")

        print(f"  ✓ Archivo .env actualizado")

    print("\n✓ Configuración completada.")
    print("\nPróximos pasos:")
    print("  1. Levantar backend: cd backend && uvicorn app.principal:app --reload")
    print("  2. Levantar frontend: cd frontend && npm run dev")
    print("  3. Registrar usuario → ir a /suscripcion → click 'Actualizar a Premium'")
    print(f"  4. Usar tarjeta de test: 5031 7557 3453 0604 | CVV: 123 | Titular: APRO")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
