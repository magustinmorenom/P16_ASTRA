# CosmicEngine — Backend

Plataforma de calculo esoterico-astronomico que integra Carta Astral, Diseno Humano, Numerologia, Revolucion Solar y Transitos en tiempo real, con autenticacion JWT/OAuth y sistema de suscripciones con MercadoPago.

---

## Stack Tecnologico

| Componente | Tecnologia |
|-----------|-----------|
| Framework | FastAPI (async) |
| Python | 3.11+ |
| ORM | SQLAlchemy 2.0 async (asyncpg) |
| Base de datos | PostgreSQL (puerto 5434) |
| Cache/Blacklist | Redis (puerto 6380) |
| Migraciones | Alembic |
| Efemerides | pyswisseph (Swiss Ephemeris) |
| Astrologia | kerykeion (complemento) |
| Auth | PyJWT, bcrypt, authlib (Google OAuth) |
| Pagos | MercadoPago (httpx async, no SDK) |
| Validacion | Pydantic v2 + pydantic-settings |
| Geocodificacion | geopy + Nominatim/OSM |
| Zonas horarias | timezonefinder + pytz |
| HTTP client | httpx (async) |
| Tests | pytest + pytest-asyncio |

---

## Estructura de Directorios

```
backend/
├── app/
│   ├── cache/
│   │   └── gestor_cache.py          # Cache Redis con TTLs configurables
│   ├── datos/
│   │   ├── sesion.py                 # Motor async + session factory SQLAlchemy
│   │   ├── repositorio_calculo.py    # CRUD calculos (cache DB)
│   │   ├── repositorio_pago.py       # CRUD pagos
│   │   ├── repositorio_perfil.py     # CRUD perfiles natales
│   │   ├── repositorio_plan.py       # CRUD planes + precios por pais
│   │   ├── repositorio_suscripcion.py# CRUD suscripciones + eventos webhook
│   │   └── repositorio_usuario.py    # CRUD usuarios
│   ├── datos_estaticos/              # Tablas HD (I Ching, puertas, canales)
│   ├── esquemas/
│   │   ├── auth.py                   # Schemas login, registro, tokens
│   │   ├── diseno_humano.py          # Schema entrada HD
│   │   ├── entrada.py                # Schema entrada comun (fecha, lugar)
│   │   ├── natal.py                  # Schema respuesta carta natal
│   │   ├── numerologia.py            # Schema entrada numerologia
│   │   ├── respuesta.py              # Schema respuesta base
│   │   ├── retorno_solar.py          # Schema retorno solar
│   │   ├── suscripcion.py            # Schemas suscripciones y pagos
│   │   └── transitos.py              # Schema transitos
│   ├── middleware/
│   │   └── tiempo_respuesta.py       # Header X-Tiempo-Respuesta-Ms
│   ├── modelos/
│   │   ├── base.py                   # Base + ModeloBase (UUID PK, creado_en)
│   │   ├── calculo.py                # Cache de calculos en DB
│   │   ├── config_pais_mp.py         # Credenciales MP por pais
│   │   ├── evento_webhook.py         # Idempotencia webhooks (PK string)
│   │   ├── pago.py                   # Pagos de suscripciones
│   │   ├── perfil.py                 # Perfiles natales de usuarios
│   │   ├── plan.py                   # Planes (gratis, premium)
│   │   ├── precio_plan.py            # Precio local por pais
│   │   ├── suscripcion.py            # Suscripciones de usuarios
│   │   └── usuario.py                # Usuarios (email, google, auth)
│   ├── nucleo/
│   │   ├── servicio_efemerides.py     # pyswisseph: posiciones, casas, busqueda solar
│   │   ├── servicio_geo.py           # Nominatim async con cache en memoria
│   │   └── servicio_zona_horaria.py  # Resolucion TZ historica + Julian Day
│   ├── rutas/v1/
│   │   ├── auth.py                   # 8 endpoints autenticacion
│   │   ├── diseno_humano.py          # POST /diseno-humano
│   │   ├── natal.py                  # POST /natal
│   │   ├── numerologia.py            # POST /numerologia
│   │   ├── perfil.py                 # CRUD perfiles
│   │   ├── retorno_solar.py          # POST /retorno-solar/{anio}
│   │   ├── suscripcion.py            # 6 endpoints suscripciones
│   │   └── transitos.py              # GET /transitos
│   ├── servicios/
│   │   ├── servicio_astro.py         # Carta natal completa
│   │   ├── servicio_auth.py          # JWT, bcrypt, blacklist Redis
│   │   ├── servicio_diseno_humano.py # Body Graph (88 grados, tipo, autoridad)
│   │   ├── servicio_google_oauth.py  # OAuth2 Google (authlib)
│   │   ├── servicio_mercadopago.py   # API MercadoPago async (httpx)
│   │   ├── servicio_numerologia.py   # Pitagorico/Caldeo
│   │   ├── servicio_retorno_solar.py # Retorno solar exacto
│   │   └── servicio_transitos.py     # Posiciones actuales + aspectos
│   ├── utilidades/
│   │   ├── constantes.py             # Zodiaco, planetas, aspectos, puertas HD
│   │   ├── convertidores.py          # Conversion coordenadas eclipticas
│   │   └── hash.py                   # SHA-256 deterministico para cache
│   ├── configuracion.py              # pydantic-settings (.env)
│   ├── dependencias.py               # Dependencias comunes (obtener_cache)
│   ├── dependencias_auth.py          # obtener_usuario_actual / opcional
│   ├── dependencias_suscripcion.py   # requiere_plan() factory
│   ├── excepciones.py                # 14 excepciones + handler global
│   ├── principal.py                  # Factory FastAPI + lifespan
│   └── registro.py                   # Logging estructurado
├── alembic/
│   └── versions/
│       ├── 001_tablas_iniciales.py    # perfiles, calculos
│       ├── 002_perfil_id_nullable.py  # Fix perfil_id
│       ├── 003_crear_tabla_usuarios.py# Tabla usuarios
│       ├── 004_agregar_usuario_id_a_perfiles.py  # FK perfiles→usuarios
│       └── 005_crear_tablas_suscripciones.py      # 6 tablas + datos semilla
├── tests/
│   ├── conftest.py                   # Fixtures globales (app, client, mocks)
│   ├── nucleo/                       # Tests efemerides, zona horaria
│   ├── servicios/                    # Tests astro, HD, numerologia, retorno, transitos
│   ├── rutas/                        # Tests auth (53), suscripcion (44), cache
│   └── validacion/                   # Tests precision (Astro.com, datos referencia)
├── datos_efemerides/                 # Archivos .se1 Swiss Ephemeris
├── docker-compose.yml                # PostgreSQL 5434 + Redis 6380
├── pyproject.toml                    # Dependencias + config pytest/ruff
└── alembic.ini                       # Config Alembic (sync driver)
```

---

## Modelos de Datos

### ModeloBase (abstracto)

Todos los modelos (excepto `EventoWebhook`) heredan de `ModeloBase`:
- `id` — UUID v4, PK, autogenerado
- `creado_en` — TIMESTAMP WITH TZ, server_default now()

### Usuario (`usuarios`)

| Campo | Tipo | Notas |
|-------|------|-------|
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX |
| hash_contrasena | VARCHAR(255) | nullable (null para usuarios Google) |
| nombre | VARCHAR(100) | NOT NULL |
| activo | BOOLEAN | default true |
| verificado | BOOLEAN | default false |
| proveedor_auth | VARCHAR(20) | "local" o "google" |
| google_id | VARCHAR(255) | UNIQUE, nullable, INDEX |
| ultimo_acceso | TIMESTAMP TZ | nullable |

Relaciones: `1 → N perfiles`, `1 → N suscripciones`

### Perfil (`perfiles`)

Perfil natal de una persona (nombre, fecha/hora/lugar nacimiento, resultados de calculos). Campo `usuario_id` nullable (FK → usuarios, ON DELETE SET NULL). Un usuario puede tener multiples perfiles.

### Calculo (`calculos`)

Cache persistente de calculos en DB. Hash SHA-256 de los parametros como clave. Evita recalcular cartas identicas.

### Plan (`planes`)

| Campo | Tipo | Notas |
|-------|------|-------|
| nombre | VARCHAR(50) | "Gratis", "Premium" |
| slug | VARCHAR(30) | UNIQUE: "gratis", "premium" |
| precio_usd_centavos | INTEGER | 0 (gratis), 900 ($9 USD) |
| intervalo | VARCHAR(10) | "months" |
| limite_perfiles | INTEGER | 3 (gratis), -1 (ilimitado) |
| limite_calculos_dia | INTEGER | 5 (gratis), -1 (ilimitado) |
| features | JSONB | lista de features habilitadas |
| activo | BOOLEAN | default true |
| orden | INTEGER | para ordenar en UI |

Relaciones: `1 → N precios_plan`, `1 → N suscripciones`

### PrecioPlan (`precios_plan`)

Precio local por pais, calculado de `precio_usd * tipo_cambio`. Unique constraint: `(plan_id, pais_codigo)`. FK → planes (CASCADE).

| Campo | Tipo | Notas |
|-------|------|-------|
| plan_id | UUID FK | → planes, CASCADE |
| pais_codigo | VARCHAR(2) | "AR", "BR", "MX" |
| moneda | VARCHAR(3) | "ARS", "BRL", "MXN" |
| precio_local | INTEGER | centavos moneda local |
| intervalo | VARCHAR(10) | "months" |
| frecuencia | INTEGER | default 1 |
| mp_plan_id | VARCHAR(100) | nullable (preapproval_plan_id de MP) |
| activo | BOOLEAN | default true |

### ConfigPaisMp (`config_pais_mp`)

Credenciales MercadoPago por pais (AR, BR, MX).

| Campo | Tipo | Notas |
|-------|------|-------|
| pais_codigo | VARCHAR(2) | UNIQUE: "AR", "BR", "MX" |
| pais_nombre | VARCHAR(50) | "Argentina", "Brasil", "Mexico" |
| moneda | VARCHAR(3) | "ARS", "BRL", "MXN" |
| tipo_cambio_usd | NUMERIC(12,4) | ej: 1200.0000 para AR |
| mp_access_token | VARCHAR(200) | encriptar en prod |
| mp_public_key | VARCHAR(200) | |
| mp_webhook_secret | VARCHAR(200) | nullable |
| activo | BOOLEAN | default true |

### Suscripcion (`suscripciones`)

| Campo | Tipo | Notas |
|-------|------|-------|
| usuario_id | UUID FK | CASCADE, INDEX |
| plan_id | UUID FK | → planes |
| precio_plan_id | UUID FK | nullable, → precios_plan |
| pais_codigo | VARCHAR(2) | default "AR" |
| mp_preapproval_id | VARCHAR(100) | UNIQUE, INDEX (de MercadoPago) |
| mp_payer_id | VARCHAR(100) | nullable |
| estado | VARCHAR(20) | activa/pendiente/pausada/cancelada |
| fecha_inicio | TIMESTAMP TZ | nullable |
| fecha_fin | TIMESTAMP TZ | nullable |
| referencia_externa | VARCHAR(200) | INDEX |
| datos_mp | JSONB | respuesta completa de MP |

Relaciones: `N → 1 plan`, `1 → N pagos`

### Pago (`pagos`)

| Campo | Tipo | Notas |
|-------|------|-------|
| suscripcion_id | UUID FK | SET NULL |
| usuario_id | UUID FK | SET NULL, INDEX |
| mp_pago_id | VARCHAR(100) | UNIQUE, INDEX |
| estado | VARCHAR(30) | pendiente/aprobado/rechazado/reembolsado |
| monto_centavos | INTEGER | en moneda local |
| moneda | VARCHAR(3) | ARS, BRL, MXN |
| metodo_pago | VARCHAR(30) | nullable |
| detalle_estado | VARCHAR(100) | nullable |
| datos_mp | JSONB | respuesta completa de MP |
| fecha_pago | TIMESTAMP TZ | nullable |

Relacion: `N → 1 suscripcion`

### EventoWebhook (`eventos_webhook`)

Idempotencia de webhooks. **PK es STRING** (event ID de MP), no UUID. Hereda de `Base` directamente, no de `ModeloBase`.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(100) | PK (event ID de MP) |
| tipo | VARCHAR(100) | NOT NULL |
| accion | VARCHAR(100) | nullable |
| payload | JSONB | nullable |
| estado | VARCHAR(20) | default "procesado" |
| procesado_en | TIMESTAMP TZ | default now() |

---

## Sistema de Autenticacion

### JWT Stateless

- **Access token**: 30 min, HS256
- **Refresh token**: 7 dias, HS256, con JTI unico (UUID)
- **Hashing**: bcrypt directo (no passlib — incompatible con bcrypt>=5.0)
- **Blacklist**: Redis con TTL = tiempo restante del token revocado
- **Dependencias**: `obtener_usuario_actual` (obligatorio), `obtener_usuario_opcional` (no falla si no hay token)

### Google OAuth2

- Flujo: `GET /auth/google/url` → redirect a Google → `GET /auth/google/callback`
- Libreria: authlib
- Si el email ya existe con proveedor local → error 409 (`EmailYaRegistrado`)
- Si google_id no existe → crea usuario nuevo con `proveedor_auth="google"`

### Endpoints Auth (`/api/v1/auth/`)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /registrar | No | Registro email+contrasena. Auto-asigna plan gratis |
| POST | /login | No | Login email+contrasena → tokens |
| POST | /logout | Si | Revoca refresh token en Redis |
| POST | /renovar | No | Renueva access token con refresh token |
| POST | /cambiar-contrasena | Si | Cambia contrasena (solo usuarios locales) |
| GET | /google/url | No | URL de autorizacion Google |
| GET | /google/callback | No | Callback OAuth. Auto-asigna plan gratis a usuarios nuevos |
| GET | /me | Si | Perfil del usuario + plan_slug, plan_nombre, suscripcion_estado |

### Auto-asignacion de Plan Gratis

Al registrarse (email o Google), el backend automaticamente crea una suscripcion al plan "gratis". La funcion `_asignar_plan_gratis()` en `auth.py` es tolerante a fallos (try/except) para no bloquear el registro si la tabla de planes no existe o esta vacia.

---

## Sistema de Suscripciones y Pagos

### Arquitectura

- **Gateway**: MercadoPago (Preapproval API para suscripciones recurrentes)
- **HTTP client**: httpx async (no SDK de MP que es sincrono)
- **Multi-pais**: AR (ARS), BR (BRL), MX (MXN) — credenciales separadas por pais en tabla `config_pais_mp`
- **Precio**: USD como referencia ($9/mes), conversion a moneda local via `tipo_cambio_usd`
- **Checkout**: Redirect a MercadoPago (init_point). MP maneja PCI/3DS
- **State sync**: Webhooks de MP → PostgreSQL
- **Idempotencia**: Tabla `eventos_webhook` con event_id como PK

### Endpoints Suscripcion (`/api/v1/suscripcion/`)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /planes | No | Lista planes con precios del pais (query `pais_codigo`, default AR) |
| GET | /mi-suscripcion | Si | Suscripcion activa del usuario con datos del plan |
| POST | /suscribirse | Si | Crea preapproval en MP → retorna init_point (URL checkout) |
| POST | /cancelar | Si | Cancela en MP + crea suscripcion gratis automatica |
| POST | /webhook | No* | Webhook de MP (validacion HMAC x-signature) |
| GET | /pagos | Si | Historial de pagos (paginado: `limite`, `offset`) |

> *Webhook no usa JWT. Valida firma HMAC-SHA256 del header `x-signature`. Siempre retorna 200.

### Flujo de Suscripcion Premium

```
1. Usuario: POST /suscribirse { plan_id, pais_codigo: "AR" }
2. Backend: obtiene credenciales MP de config_pais_mp para "AR"
3. Backend: calcula precio local = $9 USD × 1200 = $10,800 ARS
4. Backend: POST /preapproval a MP API → recibe { id, init_point }
5. Backend: crea suscripcion en DB con estado "pendiente"
6. Frontend: redirect a init_point (checkout de MP)
7. Usuario: completa pago en MercadoPago
8. MP: envia webhook → backend actualiza estado a "activa"
```

### Flujo de Cancelacion

```
1. Usuario: POST /cancelar
2. Backend: PUT /preapproval/{id} status=cancelled en MP
3. Backend: actualiza suscripcion → estado "cancelada"
4. Backend: crea nueva suscripcion al plan gratis automaticamente
```

### Cobro Recurrente

```
1. MP cobra automaticamente cada mes
2. MP envia webhook subscription_authorized_payment
3. Backend: registra pago en tabla pagos
4. Si falla → MP reintenta 4 veces en 10 dias
5. Si 3 rechazos consecutivos → MP cancela automaticamente
6. Backend: degrada a plan gratis via webhook
```

### Feature Gating

```python
from app.dependencias_suscripcion import requiere_plan

@router.get("/recurso-premium")
async def recurso(suscripcion = Depends(requiere_plan("premium"))):
    # Solo accesible con plan premium
    ...
```

Jerarquia: `gratis (0) < premium (1)`. Lanza `LimiteExcedido` (403) si el plan es insuficiente.

### Mapeo de Estados MP → DB

| MercadoPago | DB |
|-------------|-----|
| pending | pendiente |
| authorized | activa |
| paused | pausada |
| cancelled | cancelada |

### Webhook Events Procesados

| Topic MP | Accion |
|----------|--------|
| subscription_preapproval | Sincronizar estado suscripcion |
| subscription_authorized_payment | Registrar pago recurrente |
| payment | Registrar/actualizar pago individual |

---

## Servicios de Calculo

### ServicioAstro (`servicio_astro.py`)

Carta natal completa:
- Posiciones de 10 planetas + Nodo Norte/Sur + Quiron + Lilith
- 12 casas (Placidus por defecto, configurable)
- Aspectos entre planetas (conjuncion, oposicion, trigono, cuadratura, sextil)
- Dignidades planetarias (domicilio, exaltacion, caida, exilio)

### ServicioDisenoHumano (`servicio_diseno_humano.py`)

Body Graph completo:
- **88 grados solares**: busqueda binaria sobre longitud solar ecliptica (precision <0.0001°)
- Personalidad (fecha natal) + Diseno (88° antes del Sol natal)
- Tipo: Manifestador, Generador, Proyector, Reflector, Generador Manifestante
- Autoridad: Emocional, Sacral, Esplenica, Ego, Self, Lunar, Ninguna
- Perfil (1/3, 2/4, 3/5, 4/6, 5/1, 6/2)
- Cruz de Encarnacion
- 9 centros definidos/indefinidos
- Canales activos + puertas activadas con lineas

### ServicioNumerologia (`servicio_numerologia.py`)

- Sistemas: Pitagorico (default) y Caldeo
- **Numeros maestros (11, 22, 33) NO se reducen**
- Numero de vida, expresion, alma, personalidad
- Pinnaculos, desafios, ciclos, ano personal

### ServicioRetornoSolar (`servicio_retorno_solar.py`)

- Momento exacto del retorno solar (busqueda binaria, precision <0.0001°)
- Carta del retorno + comparacion con carta natal

### ServicioTransitos (`servicio_transitos.py`)

- Posiciones actuales de planetas en tiempo real
- Aspectos de transito vs carta natal del usuario

---

## Servicios Nucleo

### ServicioEfemerides (`nucleo/servicio_efemerides.py`)

Wrapper sobre pyswisseph (Swiss Ephemeris):
- `calcular_posicion(jd, planeta)` — longitud, latitud, distancia, velocidad
- `calcular_casas(jd, lat, lon, sistema)` — cuspides de 12 casas
- `buscar_longitud_solar(grados_objetivo, jd_inicio)` — busqueda binaria precisa

### ServicioGeo (`nucleo/servicio_geo.py`)

- Geocodificacion async con Nominatim/OSM (gratuito, sin API key)
- Cache en memoria (dict) para evitar llamadas repetidas
- Retorna: latitud, longitud, nombre normalizado

### ServicioZonaHoraria (`nucleo/servicio_zona_horaria.py`)

- Resolucion de zona horaria por coordenadas (timezonefinder)
- `pytz.localize()` para fechas historicas (resuelve TZ en la fecha del nacimiento, no en la fecha actual)
- Conversion a Julian Day para pyswisseph

**Punto critico**: Argentina enero 1990 = UTC-2 (horario de verano), no UTC-3.

---

## Cache

### Estrategia Dual

1. **Redis** (`cache/gestor_cache.py`): Cache principal
   - Calculos deterministicos: TTL infinito (mismo input = mismo output siempre)
   - Transitos: TTL 600 segundos (posiciones cambian con el tiempo)
   - Clave: SHA-256 del hash deterministico de los parametros

2. **PostgreSQL** (`datos/repositorio_calculo.py`): Cache persistente
   - Backup en tabla `calculos` para recuperar si Redis se reinicia
   - Mismo hash SHA-256 como clave

### Generacion de Claves

`utilidades/hash.py` genera un hash SHA-256 deterministico de los parametros de entrada. Mismo input siempre produce el mismo hash, lo que permite cache infinito para calculos astrologicos.

---

## Inyeccion de Dependencias

El patron usado es **placeholder + override en lifespan**:

```python
# principal.py — placeholders
def _obtener_db_placeholder():
    pass

def _obtener_redis_placeholder():
    pass

# En crear_aplicacion() — overrides reales
app.dependency_overrides[_obtener_db_placeholder] = obtener_db
app.dependency_overrides[_obtener_redis_placeholder] = obtener_redis_dep
```

Las rutas usan `Depends(_obtener_db_placeholder)` y en runtime FastAPI resuelve a la implementacion real. Esto permite que los tests hagan override con mocks facilmente.

---

## Excepciones

Todas heredan de `CosmicEngineError(mensaje, codigo)`. Handler global retorna JSON estandarizado:

```json
{ "exito": false, "error": "NombreClase", "detalle": "mensaje descriptivo" }
```

| Excepcion | HTTP | Uso |
|-----------|------|-----|
| UbicacionNoEncontrada | 404 | Geocodificacion fallida |
| ErrorZonaHoraria | 400 | TZ invalida |
| ErrorCalculoEfemerides | 500 | Error pyswisseph |
| ErrorDatosEntrada | 422 | Validacion de input |
| PerfilNoEncontrado | 404 | Perfil inexistente |
| ErrorAutenticacion | 401 | Credenciales incorrectas |
| ErrorTokenInvalido | 401 | JWT expirado o invalido |
| ErrorAccesoDenegado | 403 | Sin permisos |
| UsuarioNoEncontrado | 404 | Usuario inexistente |
| PlanNoEncontrado | 404 | Plan inexistente |
| SuscripcionNoEncontrada | 404 | Sin suscripcion activa |
| LimiteExcedido | 403 | Plan insuficiente |
| ErrorPasarelaPago | 502 | Error MercadoPago API |
| EmailYaRegistrado | 409 | Email duplicado |

---

## Todos los Endpoints

### Autenticacion (`/api/v1/auth/`)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /registrar | No | Registro + auto plan gratis |
| POST | /login | No | Login → access + refresh token |
| POST | /logout | Si | Revocar refresh token |
| POST | /renovar | No | Renovar access token |
| POST | /cambiar-contrasena | Si | Cambiar contrasena |
| GET | /google/url | No | URL autorizacion Google |
| GET | /google/callback | No | Callback OAuth Google |
| GET | /me | Si | Perfil + plan actual |

### Calculos (`/api/v1/`)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /natal | Opcional | Carta natal completa |
| POST | /diseno-humano | Opcional | Body Graph HD |
| POST | /numerologia | Opcional | Carta numerologica |
| POST | /retorno-solar/{anio} | Opcional | Revolucion solar |
| GET | /transitos | Opcional | Posiciones + aspectos actuales |

### Perfiles (`/api/v1/perfil/`)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /perfil | Opcional | Crear perfil natal |
| GET | /perfil/{id} | Opcional | Obtener perfil |

### Suscripciones (`/api/v1/suscripcion/`)

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /planes | No | Listar planes + precios |
| GET | /mi-suscripcion | Si | Suscripcion activa |
| POST | /suscribirse | Si | Crear checkout MP |
| POST | /cancelar | Si | Cancelar suscripcion |
| POST | /webhook | No* | Webhook MercadoPago |
| GET | /pagos | Si | Historial de pagos |

### Sistema

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /health | No | Estado: DB, Redis, efemerides |

> "Opcional" = funciona sin token (anonimo) y con token (asocia al usuario).

---

## Formato de Respuesta

Todas las respuestas exitosas:
```json
{
  "exito": true,
  "datos": { ... }
}
```

Errores:
```json
{
  "exito": false,
  "error": "NombreExcepcion",
  "detalle": "Mensaje descriptivo"
}
```

---

## Infraestructura

### Docker Compose

```yaml
PostgreSQL: puerto 5434  # (no 5432, evita colision con PG local)
Redis:      puerto 6380  # (no 6379, evita colision con otros proyectos)
```

### Variables de Entorno (.env)

```env
# Base de datos
DATABASE_URL=postgresql+asyncpg://cosmic:cosmic123@localhost:5434/cosmicengine
DATABASE_URL_SYNC=postgresql+psycopg2://cosmic:cosmic123@localhost:5434/cosmicengine

# Redis
REDIS_URL=redis://localhost:6380/0

# Efemerides
EPHE_PATH=./datos_efemerides

# JWT
CLAVE_SECRETA=CAMBIAR-EN-PRODUCCION-generar-con-openssl-rand-hex-32

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# MercadoPago — credenciales por pais
MP_ACCESS_TOKEN_AR=TEST-xxxx
MP_PUBLIC_KEY_AR=TEST-xxxx
MP_ACCESS_TOKEN_BR=TEST-xxxx
MP_PUBLIC_KEY_BR=TEST-xxxx
MP_ACCESS_TOKEN_MX=TEST-xxxx
MP_PUBLIC_KEY_MX=TEST-xxxx

# MercadoPago — webhook y URLs de retorno
MP_WEBHOOK_SECRET=tu_secret
MP_NOTIFICATION_URL=https://tu-dominio.com/api/v1/suscripcion/webhook
MP_URL_EXITO=http://localhost:3000/suscripcion/exito
MP_URL_FALLO=http://localhost:3000/suscripcion/fallo
MP_URL_PENDIENTE=http://localhost:3000/suscripcion/pendiente
```

---

## Migraciones

```bash
cd backend
alembic upgrade head    # Aplica todas las migraciones
alembic downgrade -1    # Revierte la ultima
alembic history         # Ver historial
```

| Migracion | Descripcion |
|-----------|-------------|
| 001 | Tablas iniciales: perfiles, calculos |
| 002 | Fix: perfil_id nullable |
| 003 | Tabla usuarios (auth) |
| 004 | FK usuario_id en perfiles (ON DELETE SET NULL) |
| 005 | 6 tablas suscripciones + datos semilla (2 planes, 3 paises, 3 precios) |

### Datos Semilla (migracion 005)

**Planes:**

| slug | nombre | precio_usd | limite_perfiles | limite_calculos_dia | features |
|------|--------|-----------|-----------------|---------------------|----------|
| gratis | Gratis | $0 | 3 | 5 | natal_basico, numerologia_basica |
| premium | Premium | $9/mes | -1 (ilimitado) | -1 (ilimitado) | natal, diseno_humano, numerologia, retorno_solar, transitos, exportar_pdf |

**Paises MP:**

| pais | moneda | tipo_cambio | precio_premium_local |
|------|--------|-------------|---------------------|
| AR | ARS | 1200.00 | $10,800/mes |
| BR | BRL | 5.50 | R$49.50/mes |
| MX | MXN | 17.50 | $157.50/mes |

---

## Tests

```bash
cd backend
python -m pytest                  # Ejecutar todos (327 tests)
python -m pytest tests/rutas/     # Solo tests de rutas
python -m pytest -k "suscripcion" # Solo tests de suscripcion
python -m pytest -k "auth"        # Solo tests de autenticacion
python -m pytest --co -q          # Listar tests sin ejecutar
python -m pytest -v               # Verbose (ver cada test)
```

### Distribucion de Tests

| Categoria | Archivo | Tests aprox. |
|-----------|---------|-------------|
| Rutas Auth | test_rutas_auth.py | 53 |
| Rutas Suscripcion | test_rutas_suscripcion.py | 44 |
| Rutas Cache/DB | test_rutas_cache_db.py | ~10 |
| Servicio Astro | test_servicio_astro.py | ~30 |
| Servicio HD | test_servicio_diseno_humano.py | ~40 |
| Servicio Numerologia | test_servicio_numerologia.py | ~40 |
| Servicio Retorno Solar | test_servicio_retorno_solar.py | ~15 |
| Servicio Transitos | test_servicio_transitos.py | ~15 |
| Nucleo Efemerides | test_servicio_efemerides.py | ~20 |
| Nucleo Zona Horaria | test_servicio_zona_horaria.py | ~15 |
| Validacion Precision | test_precision_astro.py | ~20 |
| Validacion HD | test_precision_hd.py | ~15 |
| Validacion Numerologia | test_precision_numerologia.py | ~10 |
| **Total** | | **327** |

### Patron de Tests

- Los tests usan `AsyncClient` de httpx con mocks completos de DB y Redis
- `conftest.py` provee fixtures: `app_test`, `client`, mocks de repositorios/servicios/cache
- Tests de suscripcion mockean `httpx.AsyncClient` para simular respuestas de MP API
- Tests de validacion comparan resultados contra datos de referencia (Astro.com)
- **No se hacen llamadas reales** a servicios externos (MP, Google, Nominatim)

---

## Como Levantar el Backend

```bash
# 1. Infraestructura
cd backend
docker compose up -d           # PostgreSQL 5434 + Redis 6380

# 2. Entorno virtual
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# 3. Variables de entorno
cp .env.ejemplo .env           # Editar con tus credenciales

# 4. Migraciones
alembic upgrade head

# 5. Ejecutar
uvicorn app.principal:aplicacion --reload --host 0.0.0.0 --port 8000

# 6. Verificar
curl http://localhost:8000/health
# → { "estado": "saludable", "version": "1.0.0", "base_datos": "conectado", "redis": "conectado", ... }

# 7. Tests
python -m pytest
```

---

## Decisiones Arquitecturales Clave

1. **Placidus por defecto** — sistema de casas, configurable por request
2. **Pitagorico por defecto** — numerologia, Caldeo como alternativa
3. **pyswisseph** — motor unico de efemerides para todos los calculos
4. **Nominatim/OSM** — geocodificacion gratuita, sin API key
5. **bcrypt directo** — no passlib (incompatible con bcrypt>=5.0)
6. **proveedor_auth VARCHAR** — no Enum SQL (evita problemas con alembic enum creation)
7. **httpx async** para MP — no SDK sincrono de mercadopago
8. **UUID v4 como PK** — todos los modelos (excepto EventoWebhook = string PK)
9. **JSONB** — para datos flexibles (features de plan, respuestas de MP, datos_mp)
10. **Webhook retorna 200 siempre** — MP no reintenta si no recibe 200
11. **Puertos no-default** — PG 5434, Redis 6380 (evitar colision con otros proyectos)
12. **TZ historica** — pytz.localize() resuelve en fecha del nacimiento, no hoy

---

## Preparado para Backoffice (futuro)

La arquitectura de tablas normalizadas permite gestionar desde un panel admin:

| Gestion | Tabla/Mecanismo |
|---------|-----------------|
| Planes | CRUD `planes` — crear, activar/desactivar, editar limites |
| Precios | CRUD `precios_plan` — ajustar por pais, agregar paises |
| Usuarios | Query `usuarios` + `suscripciones` — ver estado, plan, pagos |
| Suscripciones | Cancelar manualmente, cambiar plan |
| Pagos | Historial, estadisticas, reembolsos |
| Config MP | Rotar credenciales, agregar paises nuevos |
| Tipos de cambio | Actualizar `tipo_cambio_usd` en `config_pais_mp` |
| Estadisticas | MRR, churn, conversion free→premium, pagos por pais |

Los endpoints de backoffice se implementaran en un sprint posterior con rol `admin`.
