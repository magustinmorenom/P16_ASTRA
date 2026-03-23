Ronda 1 de implementacion facturación y mercado pago

  Resumen de cambios

  Backend — Archivos creados (4)

  - backend/app/modelos/factura.py — Modelo Factura con
  campos: usuario_id, pago_id, suscripcion_id,
  numero_factura (auto CE-YYYYMM-XXXX), estado, monto,
  moneda, concepto, etc.
  - backend/alembic/versions/006_crear_tabla_facturas.py
  — Migración para tabla facturas con índices
  - backend/app/datos/repositorio_factura.py — CRUD:
  crear (con número auto-secuencial), listar_por_usuario,
   obtener_por_pago_id
  - scripts/configurar_mp.py — Script interactivo para
  configurar credenciales test de MP en BD y .env

  Backend — Archivos modificados (5)

  - backend/app/rutas/v1/suscripcion.py — 4 endpoints
  nuevos:
    - GET /paises — Lista países activos con moneda y
  tipo de cambio
    - GET /planes — Ahora incluye precios_por_pais con
  todos los precios
    - GET /verificar-estado — Polling post-checkout
  (es_premium, plan_slug)
    - GET /facturas — Lista facturas del usuario
    - Fix webhook: itera países activos para inferir
  credenciales (no hardcodea "AR")
    - Auto-factura: crea factura al aprobar pago via
  webhook
  - backend/app/datos/repositorio_suscripcion.py — Nuevo
  listar_paises_activos()
  - backend/app/modelos/__init__.py — Registrado modelo
  Factura
  - backend/app/esquemas/suscripcion.py — Nuevo
  RespuestaFactura
  - backend/.env.ejemplo — Variables de MP con
  comentarios

  Frontend — Archivos modificados (6)

  - frontend/src/lib/tipos/suscripcion.ts — Tipos:
  PaisDisponible, Factura, EstadoVerificacion,
  PrecioPais, precios_por_pais en Plan
  - frontend/src/lib/tipos/index.ts — Re-exports nuevos
  - frontend/src/lib/hooks/usar-suscripcion.ts — 3 hooks
  nuevos: usarPaises(), usarVerificarEstado(habilitado),
  usarFacturas()
  - frontend/src/lib/hooks/index.ts — Re-exports hooks
  - frontend/src/app/(app)/suscripcion/page.tsx —
  Selector de país, precios dinámicos por país, sección
  de facturas
  - frontend/src/app/(app)/suscripcion/exito/page.tsx — 3
   estados visuales (verificando/confirmado/timeout) con
  polling cada 3s

  Tests (1 creado, 1 corregido)

  - backend/tests/test_flujo_suscripcion.py — 8 tests:
  listar_paises, planes_con_precios, suscribirse,
  webhook_con_factura, verificar_estado_premium,
  verificar_estado_sin_suscripcion, listar_facturas,
  cancelar_degrada_a_gratis
  - backend/tests/rutas/test_rutas_suscripcion.py —
  Corregido test existente para incluir mock de
  RepositorioFactura

  Tests: 335 passed, 1 skipped (0 failures)

  Para probar end-to-end:

  1. cd backend && alembic upgrade head
  2. python scripts/configurar_mp.py
  3. Levantar backend + frontend
  4. Registrar → /suscripcion → seleccionar país →
  "Actualizar a Premium"
  5. Tarjeta test: 5031 7557 3453 0604 | CVV: 123 |
  Titular: APRO

## Active el entorno TEST de MP

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

Países configurados en BD: 3

¿Para qué país querés configurar? (AR/BR/MX) [AR]        : 

Access Token de prueba para AR: TEST-2185702783918243-032222-c0f688bfcbd1f360935e32b67dc6e6ed-67724397
Public Key de prueba para AR: TEST-546515f9-b76f-4324-ae59-e70c0e97ff27

Verificando credenciales para AR...
  ✓ Conexión exitosa — 20 métodos de pago disponibles

Actualizando credenciales de AR en la BD...
  ✓ Credenciales de AR actualizadas correctamente

¿Escribir también en archivo .env? (s/N): s
  ✓ Archivo .env actualizado

✓ Configuración completada.

Próximos pasos:
  1. Levantar backend: cd backend && uvicorn app.principal:app --reload
  2. Levantar frontend: cd frontend && npm run dev
  3. Registrar usuario → ir a /suscripcion → click 'Actualizar a Premium'
  4. Usar tarjeta de test: 5031 7557 3453 0604 | CVV: 123 | Titular: APRO

 Nuevo usuario de prueba creado. Usá estas    
  credenciales en el checkout de MercadoPago:
                                             
  - Email:                                     
  test_user_8341153124094724086@testuser.com
  - Contraseña: 41QGTA5NmI  

    Reiniciá el backend y probá de nuevo:
  1. En incógnito, hacé el checkout
  2. Logueate con test_user_8341153124094
  724086@testuser.com / 41QGTA5NmI
  3. Tarjeta: 5031 7557 3453 0604, CVV
  123, titular APRO, cualquier fecha
  futura

  ## Cuentas de Test MercadoPago (Argentina)

  ### Vendedor (Astra-Vendedor)
  | Campo                  | Valor                          |
  |------------------------|--------------------------------|
  | User ID                | 3285675537                     |
  | Usuario                | TESTUSER5136416883931640791    |
  | Contraseña             | ***REMOVED***                     |
  | Código de verificación | 675537                         |

  ### Comprador (Astra-Comprador)
  | Campo                  | Valor                          |
  |------------------------|--------------------------------|
  | User ID                | 3285675535                     |
  | Usuario                | TESTUSER3739889284689218308    |
  | Contraseña             | ***REMOVED***                     |
  | Código de verificación | 675535                         |

  FASE DE AGENTES:
ANTHROPIC_API_KEY=***REMOVED***
TELEGRAM_BOT_TOKEN=***REMOVED***