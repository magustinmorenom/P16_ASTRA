# CosmicEngine API — Documentación v1.0

## Información General

| Campo | Valor |
|-------|-------|
| Base URL | `http://localhost:8000` |
| Prefijo API | `/api/v1` |
| Formato | JSON |
| Autenticación | JWT Bearer (opcional en endpoints de cálculo, obligatoria en auth protegidos y suscripciones) |
| CORS | Habilitado para todos los orígenes |
| Header de tiempo | `X-Tiempo-Respuesta` (segundos) |

---

## Tabla Resumen de Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Estado del sistema |
| **Autenticación** | | | |
| `POST` | `/api/v1/auth/registrar` | No | Registro con email/contraseña |
| `POST` | `/api/v1/auth/login` | No | Login email/contraseña |
| `POST` | `/api/v1/auth/logout` | Sí | Invalidar refresh token |
| `POST` | `/api/v1/auth/renovar` | No | Renovar access token |
| `POST` | `/api/v1/auth/cambiar-contrasena` | Sí | Cambiar contraseña |
| `GET` | `/api/v1/auth/google/url` | No | URL de autorización Google |
| `GET` | `/api/v1/auth/google/callback` | No | Callback OAuth Google |
| `GET` | `/api/v1/auth/me` | Sí | Datos del usuario autenticado |
| **Cálculos** | | | |
| `POST` | `/api/v1/natal` | Opcional | Carta natal completa |
| `POST` | `/api/v1/human-design` | Opcional | Diseño Humano (Body Graph) |
| `POST` | `/api/v1/numerology` | Opcional | Carta numerológica |
| `POST` | `/api/v1/solar-return/{anio}` | Opcional | Revolución solar |
| `GET` | `/api/v1/transits` | No | Posiciones planetarias actuales |
| **Perfiles** | | | |
| `POST` | `/api/v1/profile` | Opcional | Crear perfil (vincula a usuario si hay token) |
| `GET` | `/api/v1/profile/{perfil_id}` | No | Obtener perfil por ID |
| **Suscripciones** | | | |
| `GET` | `/api/v1/suscripcion/planes` | No | Lista planes con precios por país |
| `GET` | `/api/v1/suscripcion/mi-suscripcion` | Sí | Suscripción activa del usuario |
| `POST` | `/api/v1/suscripcion/suscribirse` | Sí | Crear checkout en MercadoPago |
| `POST` | `/api/v1/suscripcion/cancelar` | Sí | Cancelar suscripción activa |
| `POST` | `/api/v1/suscripcion/webhook` | No* | Webhook de MercadoPago (HMAC) |
| `GET` | `/api/v1/suscripcion/pagos` | Sí | Historial de pagos del usuario |

---

## Cómo Levantar el Entorno

```bash
# Opción rápida con el script
./scripts/levantar.sh

# Manual
cd backend
docker compose up -d postgres redis
source .venv/bin/activate
alembic upgrade head
uvicorn app.principal:aplicacion --reload --host 0.0.0.0 --port 8000
```

---

## Autenticación

CosmicEngine usa **JWT stateless** con dos tipos de token:

| Token | Duración | Uso |
|-------|----------|-----|
| `token_acceso` | 30 minutos | Header `Authorization: Bearer <token>` en cada request autenticado |
| `token_refresco` | 7 días | Enviarlo a `/auth/renovar` para obtener un nuevo `token_acceso` |

**Endpoints públicos:** Los endpoints de cálculo (`/natal`, `/human-design`, `/numerology`, `/solar-return`, `/transits`) funcionan sin token. Si se envía un token válido, el usuario queda vinculado al perfil/cálculo.

**Logout:** Se invalida el `token_refresco` agregándolo a una blacklist en Redis con TTL = tiempo restante del token.

---

## POST /api/v1/auth/registrar — Registro

Crea un nuevo usuario con email y contraseña.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "nombre": "Juan Pérez",
    "contrasena": "miContrasena123"
  }'
```

### Body

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `email` | string | Sí | Email válido, único |
| `nombre` | string | Sí | 1-100 caracteres |
| `contrasena` | string | Sí | 8-128 caracteres |

### Response (200)

```json
{
  "exito": true,
  "datos": {
    "usuario": {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "nombre": "Juan Pérez"
    },
    "token_acceso": "eyJ...",
    "token_refresco": "eyJ...",
    "tipo": "bearer"
  }
}
```

> **Nota:** Al registrar, se crea automáticamente una suscripción al plan **Gratis**. Lo mismo aplica al registrar vía Google OAuth.

### Errores

| Código | Causa |
|--------|-------|
| 409 | Email ya registrado |
| 422 | Datos inválidos (email, nombre vacío, contraseña corta) |

---

## POST /api/v1/auth/login — Iniciar Sesión

Autentica con email y contraseña.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "contrasena": "miContrasena123"
  }'
```

### Response (200)

Mismo formato que `/auth/registrar`.

### Errores

| Código | Causa |
|--------|-------|
| 401 | Email no registrado, contraseña incorrecta, usuario desactivado, o usuario Google (sin contraseña local) |

---

## POST /api/v1/auth/logout — Cerrar Sesión

Invalida el token de refresco (lo agrega a la blacklist en Redis).

### Request

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer <token_acceso>" \
  -H "Content-Type: application/json" \
  -d '{"token_refresco": "eyJ..."}'
```

### Response (200)

```json
{
  "exito": true,
  "mensaje": "Sesión cerrada correctamente"
}
```

---

## POST /api/v1/auth/renovar — Renovar Token

Genera un nuevo `token_acceso` a partir de un `token_refresco` válido.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/auth/renovar \
  -H "Content-Type: application/json" \
  -d '{"token_refresco": "eyJ..."}'
```

### Response (200)

```json
{
  "exito": true,
  "datos": {
    "token_acceso": "eyJ...",
    "tipo": "bearer"
  }
}
```

### Errores

| Código | Causa |
|--------|-------|
| 401 | Token expirado, inválido, revocado, no es de tipo refresco, o usuario desactivado/eliminado |

---

## POST /api/v1/auth/cambiar-contrasena — Cambiar Contraseña

Cambia la contraseña del usuario autenticado.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/auth/cambiar-contrasena \
  -H "Authorization: Bearer <token_acceso>" \
  -H "Content-Type: application/json" \
  -d '{
    "contrasena_actual": "miContrasena123",
    "contrasena_nueva": "nuevaContrasena456"
  }'
```

### Response (200)

```json
{
  "exito": true,
  "mensaje": "Contraseña actualizada correctamente"
}
```

### Errores

| Código | Causa |
|--------|-------|
| 401 | Contraseña actual incorrecta, o usuario Google (sin contraseña local) |

---

## GET /api/v1/auth/google/url — URL de Google OAuth

Retorna la URL de autorización de Google para iniciar el flujo OAuth2.

### Request

```bash
curl http://localhost:8000/api/v1/auth/google/url
```

### Response (200)

```json
{
  "exito": true,
  "datos": {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=openid+email+profile"
  }
}
```

> **Nota:** Requiere configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en las variables de entorno.

---

## GET /api/v1/auth/google/callback — Callback Google OAuth

Recibe el código de autorización de Google, crea o autentica al usuario, y retorna tokens.

### Request

```
GET /api/v1/auth/google/callback?code=<codigo_autorizacion>
```

### Response (200)

Mismo formato que `/auth/registrar`.

### Errores

| Código | Causa |
|--------|-------|
| 401 | Usuario desactivado |
| 409 | Email ya registrado con otro proveedor (local) |

---

## GET /api/v1/auth/me — Datos del Usuario

Retorna los datos del usuario autenticado.

### Request

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <token_acceso>"
```

### Response (200)

```json
{
  "exito": true,
  "datos": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan Pérez",
    "activo": true,
    "verificado": false,
    "proveedor_auth": "local",
    "plan_slug": "premium",
    "plan_nombre": "Premium",
    "suscripcion_estado": "activa",
    "ultimo_acceso": "2026-03-21T15:30:00+00:00",
    "creado_en": "2026-03-21T12:00:00+00:00"
  }
}
```

> `plan_slug`, `plan_nombre` y `suscripcion_estado` son `null` si el usuario no tiene suscripción activa.

### Errores

| Código | Causa |
|--------|-------|
| 401 | Sin token, token inválido, expirado, revocado, usuario no encontrado o desactivado |

---

## Health Check

### `GET /health`

Verifica el estado de PostgreSQL, Redis y los archivos de efemérides.

**Request:**
```bash
curl http://localhost:8000/health
```

**Response (200):**
```json
{
  "estado": "saludable",
  "version": "1.0.0",
  "base_datos": "conectado",
  "redis": "conectado",
  "efemerides": "42 archivos"
}
```

**Estados posibles:**
- `"saludable"` — todo funciona
- `"degradado"` — algún servicio caído (el servidor sigue respondiendo)

---

## POST /api/v1/natal — Carta Natal

Calcula la carta natal completa: planetas, casas (Placidus por defecto), aspectos y dignidades.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/natal \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad_nacimiento": "Buenos Aires",
    "pais_nacimiento": "Argentina",
    "sistema_casas": "placidus"
  }'
```

### Body (`DatosNacimiento`)

| Campo | Tipo | Requerido | Default | Validación |
|-------|------|-----------|---------|------------|
| `nombre` | string | Sí | — | 1-100 caracteres |
| `fecha_nacimiento` | string | Sí | — | Formato `YYYY-MM-DD` |
| `hora_nacimiento` | string | Sí | — | Formato `HH:MM` |
| `ciudad_nacimiento` | string | Sí | — | 1-100 caracteres |
| `pais_nacimiento` | string | Sí | — | 1-60 caracteres |
| `sistema_casas` | string | No | `"placidus"` | Sistema de casas |

### Response (200)

```json
{
  "exito": true,
  "cache": false,
  "datos": {
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad": "Buenos Aires",
    "pais": "Argentina",
    "latitud": -34.6037,
    "longitud": -58.3816,
    "zona_horaria": "America/Argentina/Buenos_Aires",
    "dia_juliano": 2447908.1875,
    "sistema_casas": "placidus",
    "planetas": [
      {
        "nombre": "Sol",
        "longitud": 294.68,
        "latitud": 0.0,
        "signo": "Capricornio",
        "grado_en_signo": 24.68,
        "casa": 10,
        "retrogrado": false,
        "velocidad": 1.019,
        "dignidad": null
      }
    ],
    "casas": [
      {
        "numero": 1,
        "signo": "Géminis",
        "grado": 72.5,
        "grado_en_signo": 12.5
      }
    ],
    "aspectos": [
      {
        "planeta1": "Sol",
        "planeta2": "Luna",
        "tipo": "trígono",
        "angulo_exacto": 120.0,
        "orbe": 2.15,
        "aplicativo": true
      }
    ],
    "ascendente": {
      "signo": "Géminis",
      "grado": 12.5
    },
    "medio_cielo": {
      "signo": "Acuario",
      "grado": 5.3
    }
  }
}
```

### Cache

- **Clave:** SHA-256 de `{tipo, fecha, hora, ciudad, pais, sistema_casas}`
- **TTL:** Sin expiración (cálculo determinista)
- La segunda llamada con los mismos datos retorna `"cache": true`

---

## POST /api/v1/human-design — Diseño Humano

Calcula el Body Graph completo: tipo, autoridad, perfil, centros, canales y activaciones.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/human-design \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad_nacimiento": "Buenos Aires",
    "pais_nacimiento": "Argentina"
  }'
```

### Body

Mismo schema `DatosNacimiento` que carta natal. El campo `sistema_casas` se ignora.

### Response (200)

```json
{
  "exito": true,
  "cache": false,
  "datos": {
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad": "Buenos Aires",
    "pais": "Argentina",
    "latitud": -34.6037,
    "longitud": -58.3816,
    "zona_horaria": "America/Argentina/Buenos_Aires",
    "tipo": "Generador",
    "autoridad": "Sacral",
    "perfil": "3/5",
    "definicion": "Simple",
    "cruz_encarnacion": {
      "puertas": [54, 53, 58, 52],
      "sol_consciente": 54,
      "tierra_consciente": 53,
      "sol_inconsciente": 58,
      "tierra_inconsciente": 52
    },
    "centros": {
      "cabeza": "indefinido",
      "ajna": "indefinido",
      "garganta": "definido",
      "g": "definido",
      "corazon": "indefinido",
      "plexo_solar": "definido",
      "sacral": "definido",
      "raiz": "definido",
      "bazo": "indefinido"
    },
    "canales": [
      {
        "puertas": [34, 20],
        "nombre": "Canal del Carisma",
        "centros": ["Sacral", "Garganta"]
      }
    ],
    "activaciones_conscientes": [
      {
        "planeta": "Sol",
        "longitud": 294.68,
        "puerta": 54,
        "linea": 3,
        "color": 2
      }
    ],
    "activaciones_inconscientes": [
      {
        "planeta": "Sol",
        "longitud": 206.68,
        "puerta": 58,
        "linea": 5,
        "color": 4
      }
    ],
    "puertas_conscientes": [54, 53, 34, 20],
    "puertas_inconscientes": [58, 52, 44, 28],
    "dia_juliano_consciente": 2447908.1875,
    "dia_juliano_inconsciente": 2447817.5
  }
}
```

### Cache

- **Clave:** SHA-256 de `{tipo, fecha, hora, ciudad, pais}` (sin sistema_casas)
- **TTL:** Sin expiración

---

## POST /api/v1/numerology — Numerología

Calcula la carta numerológica completa: camino de vida, expresión, alma, personalidad, etc.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/numerology \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Agustín García",
    "fecha_nacimiento": "1990-01-15",
    "sistema": "pitagorico"
  }'
```

### Body (`DatosNumerologia`)

| Campo | Tipo | Requerido | Default | Validación |
|-------|------|-----------|---------|------------|
| `nombre` | string | Sí | — | 1-100 caracteres |
| `fecha_nacimiento` | string | Sí | — | Formato `YYYY-MM-DD` |
| `sistema` | string | No | `"pitagorico"` | `"pitagorico"` o `"caldeo"` |

### Response (200)

```json
{
  "exito": true,
  "cache": false,
  "datos": {
    "nombre": "Agustín García",
    "fecha_nacimiento": "1990-01-15",
    "sistema": "pitagorico",
    "camino_de_vida": {
      "numero": 8,
      "descripcion": "Camino del poder y la abundancia material..."
    },
    "expresion": {
      "numero": 5,
      "descripcion": "Expresión versátil y comunicativa..."
    },
    "impulso_del_alma": {
      "numero": 3,
      "descripcion": "Deseo profundo de expresión creativa..."
    },
    "personalidad": {
      "numero": 11,
      "descripcion": "Número maestro. Presencia inspiradora..."
    },
    "numero_nacimiento": {
      "numero": 6,
      "descripcion": "Responsabilidad y servicio..."
    },
    "anio_personal": {
      "numero": 4,
      "descripcion": "Año de construcción y disciplina..."
    },
    "numeros_maestros_presentes": [11]
  }
}
```

### Notas

- Los números maestros **11, 22 y 33** no se reducen
- El sistema Caldeo usa una tabla de correspondencias diferente al Pitagórico

### Cache

- **Clave:** SHA-256 de `{tipo, nombre, fecha, sistema}`
- **TTL:** Sin expiración

---

## POST /api/v1/solar-return/{anio} — Revolución Solar

Calcula el momento exacto del retorno solar para un año dado y la carta en ese momento.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/solar-return/2025 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad_nacimiento": "Buenos Aires",
    "pais_nacimiento": "Argentina",
    "sistema_casas": "placidus"
  }'
```

### Parámetros

| Parámetro | Ubicación | Tipo | Descripción |
|-----------|-----------|------|-------------|
| `anio` | Path | int | Año del retorno solar |
| Body | JSON | `DatosNacimiento` | Datos de nacimiento completos |

### Response (200)

```json
{
  "exito": true,
  "cache": false,
  "datos": {
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad": "Buenos Aires",
    "pais": "Argentina",
    "anio": 2025,
    "dia_juliano_retorno": 2460693.456,
    "fecha_retorno": {
      "anio": 2025,
      "mes": 1,
      "dia": 15,
      "hora_decimal": 10.944
    },
    "longitud_sol_natal": 294.68,
    "longitud_sol_retorno": 294.68,
    "error_grados": 0.00001,
    "carta_retorno": {
      "planetas": [...],
      "casas": [...],
      "aspectos": [...]
    },
    "aspectos_natal_retorno": [
      {
        "planeta_retorno": "Luna",
        "planeta_natal": "Sol",
        "tipo": "conjunción",
        "orbe": 1.5
      }
    ]
  }
}
```

### Cache

- **Clave:** SHA-256 de `{tipo, fecha, hora, ciudad, pais, sistema_casas, anio}`
- **TTL:** Sin expiración

---

## GET /api/v1/transits — Tránsitos

Retorna las posiciones actuales de todos los planetas en tiempo real.

### Request

```bash
curl http://localhost:8000/api/v1/transits
```

No requiere body ni parámetros.

### Response (200)

```json
{
  "exito": true,
  "cache": false,
  "datos": {
    "fecha_utc": "2025-06-15T14:30:00Z",
    "dia_juliano": 2460841.104167,
    "planetas": [
      {
        "nombre": "Sol",
        "longitud": 84.23,
        "latitud": 0.0,
        "signo": "Géminis",
        "grado_en_signo": 24.23,
        "retrogrado": false,
        "velocidad": 0.957
      },
      {
        "nombre": "Luna",
        "longitud": 156.78,
        "latitud": -2.3,
        "signo": "Virgo",
        "grado_en_signo": 6.78,
        "retrogrado": false,
        "velocidad": 12.5
      }
    ],
    "aspectos_natal": null
  }
}
```

### Cache

- **TTL:** 600 segundos (10 minutos)
- Precisión temporal: por minuto (HH:MM UTC)
- No se persiste en base de datos (dato efímero)

---

## POST /api/v1/profile — Crear Perfil

Crea un perfil de usuario con datos de nacimiento para reutilizar en cálculos.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/profile \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad_nacimiento": "Buenos Aires",
    "pais_nacimiento": "Argentina"
  }'
```

### Response (200)

```json
{
  "exito": true,
  "datos": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nombre": "Agustín",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30:00",
    "ciudad_nacimiento": "Buenos Aires",
    "pais_nacimiento": "Argentina",
    "latitud": -34.6037,
    "longitud": -58.3816,
    "zona_horaria": "America/Argentina/Buenos_Aires"
  }
}
```

---

## GET /api/v1/profile/{perfil_id} — Obtener Perfil

### Request

```bash
curl http://localhost:8000/api/v1/profile/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Response (200)

Mismo formato que la respuesta de creación.

### Response (404)

```json
{
  "exito": false,
  "error": "PerfilNoEncontrado",
  "detalle": "Perfil no encontrado: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## Suscripciones y Pagos (MercadoPago)

CosmicEngine es **gratis por defecto**. Los usuarios pueden hacer upgrade a **Premium** ($9 USD/mes) con cobro recurrente vía MercadoPago. Se soportan tres países: Argentina (ARS), Brasil (BRL) y México (MXN), cada uno con credenciales y tipo de cambio independientes.

### Modelo de Planes

| Plan | Precio | Perfiles | Cálculos/día | Features |
|------|--------|----------|--------------|----------|
| **Gratis** | $0 | 3 | 5 | `natal_basico`, `numerologia_basica` |
| **Premium** | $9 USD/mes | Ilimitados | Ilimitados | `natal`, `diseno_humano`, `numerologia`, `retorno_solar`, `transitos`, `exportar_pdf` |

### Flujo de Suscripción

```
1. GET /suscripcion/planes         → usuario ve planes y precios en su moneda
2. POST /suscripcion/suscribirse   → backend crea preapproval en MP, retorna init_point
3. Frontend redirige a init_point  → usuario paga en MercadoPago
4. MP envía webhook                → backend actualiza estado a "activa"
5. Cobro mensual automático        → MP cobra y envía webhook de pago
6. POST /suscripcion/cancelar      → cancela en MP + crea suscripción gratis
```

> **Nota:** El webhook NO usa JWT — usa validación HMAC del header `x-signature` de MercadoPago.

---

## GET /api/v1/suscripcion/planes — Listar Planes

Lista todos los planes activos con precios convertidos a la moneda del país solicitado.

### Request

```bash
curl "http://localhost:8000/api/v1/suscripcion/planes?pais_codigo=AR"
```

### Query Parameters

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `pais_codigo` | string | `"AR"` | Código ISO del país (`AR`, `BR`, `MX`) |

### Response (200)

```json
{
  "exito": true,
  "datos": [
    {
      "id": "uuid",
      "nombre": "Gratis",
      "slug": "gratis",
      "descripcion": "Plan gratuito con funcionalidades básicas",
      "precio_usd_centavos": 0,
      "intervalo": "months",
      "limite_perfiles": 3,
      "limite_calculos_dia": 5,
      "features": ["natal_basico", "numerologia_basica"],
      "precio_local": null,
      "moneda_local": null
    },
    {
      "id": "uuid",
      "nombre": "Premium",
      "slug": "premium",
      "descripcion": "Plan premium con todas las funcionalidades",
      "precio_usd_centavos": 900,
      "intervalo": "months",
      "limite_perfiles": -1,
      "limite_calculos_dia": -1,
      "features": ["natal", "diseno_humano", "numerologia", "retorno_solar", "transitos", "exportar_pdf"],
      "precio_local": 1080000,
      "moneda_local": "ARS"
    }
  ]
}
```

> `precio_local` está en centavos de la moneda local. `1080000` = $10.800 ARS. Para el plan gratis es `null`.

---

## GET /api/v1/suscripcion/mi-suscripcion — Suscripción Activa

Retorna la suscripción activa del usuario autenticado.

### Request

```bash
curl http://localhost:8000/api/v1/suscripcion/mi-suscripcion \
  -H "Authorization: Bearer <token_acceso>"
```

### Response (200) — Con suscripción

```json
{
  "exito": true,
  "datos": {
    "id": "uuid",
    "plan_id": "uuid",
    "plan_nombre": "Premium",
    "plan_slug": "premium",
    "pais_codigo": "AR",
    "estado": "activa",
    "mp_preapproval_id": "mp_preapproval_123",
    "fecha_inicio": "2026-03-22T10:00:00+00:00",
    "fecha_fin": null,
    "creado_en": "2026-03-22T10:00:00+00:00"
  }
}
```

### Response (200) — Sin suscripción

```json
{
  "exito": true,
  "datos": null,
  "mensaje": "Sin suscripción activa"
}
```

### Errores

| Código | Causa |
|--------|-------|
| 401 | Sin token o token inválido |

---

## POST /api/v1/suscripcion/suscribirse — Crear Checkout

Crea un preapproval (suscripción recurrente) en MercadoPago y retorna la URL de checkout para redirigir al usuario.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/suscripcion/suscribirse \
  -H "Authorization: Bearer <token_acceso>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "uuid-del-plan-premium",
    "pais_codigo": "AR"
  }'
```

### Body

| Campo | Tipo | Requerido | Default | Validación |
|-------|------|-----------|---------|------------|
| `plan_id` | string | Sí | — | UUID de un plan activo (no gratis) |
| `pais_codigo` | string | No | `"AR"` | `AR`, `BR` o `MX` |

### Response (200)

```json
{
  "exito": true,
  "datos": {
    "init_point": "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=123",
    "suscripcion_id": "uuid-suscripcion-local",
    "mp_preapproval_id": "mp_preapproval_123"
  }
}
```

> El frontend debe redirigir al usuario a `init_point`. MercadoPago se encarga del cobro, PCI y 3DS.

### Comportamiento

1. Cancela todas las suscripciones activas previas del usuario
2. Calcula el precio local: `precio_usd × tipo_cambio` del país
3. Crea preapproval en MP con estado `pending`
4. Crea suscripción local con estado `pendiente`
5. Cuando el usuario completa el pago, MP envía webhook y se activa

### Errores

| Código | Causa |
|--------|-------|
| 401 | Sin token o token inválido |
| 404 | Plan no encontrado, plan inactivo, o sin precio para el país |
| 422 | `pais_codigo` inválido (no es AR/BR/MX) |
| 502 | Error de conexión con MercadoPago, plan gratis no permite checkout, o sin config de MP para el país |

---

## POST /api/v1/suscripcion/cancelar — Cancelar Suscripción

Cancela la suscripción activa del usuario. Si tiene preapproval en MP, lo cancela allí también. Crea automáticamente una suscripción al plan gratis.

### Request

```bash
curl -X POST http://localhost:8000/api/v1/suscripcion/cancelar \
  -H "Authorization: Bearer <token_acceso>"
```

### Response (200)

```json
{
  "exito": true,
  "mensaje": "Suscripción cancelada correctamente"
}
```

### Comportamiento

1. Si la suscripción tiene `mp_preapproval_id`, envía `PUT /preapproval/{id}` con `status=cancelled` a MP
2. Si falla la cancelación en MP, cancela localmente de todos modos (el usuario no queda trabado)
3. Actualiza la suscripción local a estado `cancelada`
4. Crea una nueva suscripción al plan `gratis` automáticamente

### Errores

| Código | Causa |
|--------|-------|
| 401 | Sin token o token inválido |
| 404 | No tiene suscripción activa |

---

## POST /api/v1/suscripcion/webhook — Webhook MercadoPago

Recibe notificaciones de MercadoPago sobre cambios en suscripciones y pagos. **Siempre retorna 200** para evitar reintentos innecesarios de MP.

### Request (enviado por MercadoPago)

```json
{
  "id": "evt_12345",
  "type": "subscription_preapproval",
  "action": "updated",
  "data": {
    "id": "preapproval_id_o_payment_id"
  }
}
```

### Headers de MercadoPago

| Header | Descripción |
|--------|-------------|
| `x-signature` | Firma HMAC-SHA256 (formato `ts=xxxx,v1=yyyy`) |
| `x-request-id` | ID único del request |

### Tipos de Evento Procesados

| Tipo | Acción |
|------|--------|
| `subscription_preapproval` | Sincroniza estado de suscripción (pending→pendiente, authorized→activa, paused→pausada, cancelled→cancelada) |
| `subscription_authorized_payment` | Registra pago recurrente en tabla `pagos` |
| `payment` | Registra pago individual (fallback) |

### Seguridad

- **Firma HMAC**: Si `MP_WEBHOOK_SECRET` está configurado, verifica la firma `x-signature` contra el manifest `id:{data_id};request-id:{x_request_id};ts:{ts};`
- **Idempotencia**: Cada evento se procesa una sola vez (tabla `eventos_webhook` con PK = event ID)

### Response (200) — Siempre

```json
{
  "exito": true,
  "mensaje": "Webhook procesado"
}
```

---

## GET /api/v1/suscripcion/pagos — Historial de Pagos

Lista el historial de pagos del usuario autenticado.

### Request

```bash
curl "http://localhost:8000/api/v1/suscripcion/pagos?limite=20&offset=0" \
  -H "Authorization: Bearer <token_acceso>"
```

### Query Parameters

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limite` | int | `50` | Máximo de resultados |
| `offset` | int | `0` | Desplazamiento para paginación |

### Response (200)

```json
{
  "exito": true,
  "datos": [
    {
      "id": "uuid",
      "estado": "aprobado",
      "monto_centavos": 1080000,
      "moneda": "ARS",
      "metodo_pago": "credit_card",
      "detalle_estado": "accredited",
      "fecha_pago": "2026-03-22T10:00:00+00:00",
      "creado_en": "2026-03-22T10:00:00+00:00"
    }
  ]
}
```

### Estados de Pago

| Estado MP | Estado Local |
|-----------|-------------|
| `approved` | `aprobado` |
| `pending` | `pendiente` |
| `in_process` | `en_proceso` |
| `rejected` | `rechazado` |
| `cancelled` | `cancelado` |
| `refunded` | `reembolsado` |
| `charged_back` | `contracargo` |

### Errores

| Código | Causa |
|--------|-------|
| 401 | Sin token o token inválido |

---

## Feature Gating

Los endpoints premium se protegen con la dependencia `requiere_plan("premium")`. Si el usuario no tiene el plan requerido, se retorna 403.

```json
{
  "exito": false,
  "error": "LimiteExcedido",
  "detalle": "Se requiere plan premium. Tu plan actual es gratis."
}
```

> **Nota:** El gating en endpoints de cálculo se activará en una fase posterior. Actualmente solo está implementada la infraestructura.

---

## Códigos de Error

| Código HTTP | Clase | Descripción |
|-------------|-------|-------------|
| 400 | `ErrorZonaHoraria` | No se pudo resolver la zona horaria para la fecha/ubicación |
| 401 | `ErrorAutenticacion` | Credenciales inválidas, usuario desactivado |
| 401 | `ErrorTokenInvalido` | Token JWT inválido, expirado o revocado |
| 403 | `ErrorAccesoDenegado` | No tiene permisos para acceder al recurso |
| 403 | `LimiteExcedido` | Límite del plan excedido (feature gating) |
| 404 | `UbicacionNoEncontrada` | Geocodificación falló (ciudad/país no encontrado) |
| 404 | `PerfilNoEncontrado` | UUID de perfil no existe |
| 404 | `UsuarioNoEncontrado` | Usuario no encontrado |
| 404 | `PlanNoEncontrado` | Plan no encontrado o inactivo |
| 404 | `SuscripcionNoEncontrada` | Suscripción no encontrada o sin suscripción activa |
| 409 | `EmailYaRegistrado` | El email ya está registrado |
| 422 | `ErrorDatosEntrada` | Datos de entrada inválidos (validación Pydantic) |
| 500 | `ErrorCalculoEfemerides` | Error interno en Swiss Ephemeris |
| 502 | `ErrorPasarelaPago` | Error de conexión o respuesta inesperada de MercadoPago |

### Formato de Error

Todos los errores siguen el mismo formato:

```json
{
  "exito": false,
  "error": "NombreDeLaClase",
  "detalle": "Descripción legible del error"
}
```

---

## Cache (Redis)

### Estrategia

Los cálculos astronómicos son **deterministas**: los mismos datos de entrada siempre producen el mismo resultado. Por eso se cachean indefinidamente.

| Tipo de cálculo | TTL | Justificación |
|-----------------|-----|---------------|
| Carta Natal | ∞ | Determinista |
| Diseño Humano | ∞ | Determinista |
| Numerología | ∞ | Determinista |
| Revolución Solar | ∞ | Determinista |
| Tránsitos | 600s | Datos efímeros, cambian por minuto |

### Clave de cache

Formato: `cosmic:{sha256}` donde el hash se genera a partir de los parámetros relevantes serializados en JSON con claves ordenadas.

### Indicador en respuesta

Todas las respuestas incluyen `"cache": true|false` para indicar si el resultado provino del cache.

---

## Infraestructura

### Requisitos

- Docker + Docker Compose
- Python 3.11+
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

### Variables de Entorno (`.env`)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://cosmic:cosmic123@localhost:5434/cosmicengine` | Conexión async a PostgreSQL |
| `DATABASE_URL_SYNC` | `postgresql+psycopg2://cosmic:cosmic123@localhost:5434/cosmicengine` | Conexión sync (Alembic) |
| `REDIS_URL` | `redis://localhost:6380/0` | Conexión a Redis |
| `EPHE_PATH` | `./datos_efemerides` | Ruta a archivos Swiss Ephemeris (.se1) |
| `AMBIENTE` | `desarrollo` | Entorno de ejecución |
| `LOG_LEVEL` | `INFO` | Nivel de logging |
| `CLAVE_SECRETA` | *(cambiar en producción)* | Clave para firmar JWT. Generar con `openssl rand -hex 32` |
| `ALGORITMO_JWT` | `HS256` | Algoritmo de firma JWT |
| `EXPIRACION_TOKEN_ACCESO` | `30` | Minutos de vida del access token |
| `EXPIRACION_TOKEN_REFRESCO` | `10080` | Minutos de vida del refresh token (7 días) |
| `GOOGLE_CLIENT_ID` | `""` | Client ID de Google OAuth (Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | `""` | Client Secret de Google OAuth |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8000/api/v1/auth/google/callback` | URI de callback para Google OAuth |
| **MercadoPago** | | |
| `MP_ACCESS_TOKEN_AR` | `""` | Access token de MP para Argentina |
| `MP_PUBLIC_KEY_AR` | `""` | Public key de MP para Argentina |
| `MP_ACCESS_TOKEN_BR` | `""` | Access token de MP para Brasil |
| `MP_PUBLIC_KEY_BR` | `""` | Public key de MP para Brasil |
| `MP_ACCESS_TOKEN_MX` | `""` | Access token de MP para México |
| `MP_PUBLIC_KEY_MX` | `""` | Public key de MP para México |
| `MP_WEBHOOK_SECRET` | `""` | Secret para verificar firma HMAC de webhooks |
| `MP_NOTIFICATION_URL` | `http://localhost:8000/api/v1/suscripcion/webhook` | URL pública para recibir webhooks de MP |
| `MP_URL_EXITO` | `http://localhost:3000/suscripcion/exito` | URL de retorno tras pago exitoso |
| `MP_URL_FALLO` | `http://localhost:3000/suscripcion/fallo` | URL de retorno tras pago fallido |
| `MP_URL_PENDIENTE` | `http://localhost:3000/suscripcion/pendiente` | URL de retorno si el pago queda pendiente |

### Docker Compose

```bash
cd backend
docker compose up -d postgres redis   # Levantar servicios
docker compose down                    # Parar servicios
docker compose down -v                 # Parar y borrar volúmenes
```
