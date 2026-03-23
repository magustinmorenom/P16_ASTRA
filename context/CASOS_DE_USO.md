# Casos de Uso y Storybook — CosmicEngine Frontend

> Este documento es el input principal para el desarrollo frontend. Contiene TODOS los casos de uso del sistema, sus flujos paso a paso, los datos exactos de entrada/salida de cada endpoint, y los estados de UI que el frontend debe manejar.

---

## Indice

1. [Autenticacion y Sesion](#1-autenticacion-y-sesion)
2. [Perfil de Usuario](#2-perfil-de-usuario)
3. [Carta Natal](#3-carta-natal)
4. [Diseno Humano](#4-diseno-humano)
5. [Numerologia](#5-numerologia)
6. [Retorno Solar](#6-retorno-solar)
7. [Transitos Planetarios](#7-transitos-planetarios)
8. [Perfiles Natales](#8-perfiles-natales)
9. [Planes y Suscripciones](#9-planes-y-suscripciones)
10. [Pagos e Historial](#10-pagos-e-historial)
11. [Sistema y Health](#11-sistema-y-health)
12. [Manejo Global de Errores](#12-manejo-global-de-errores)
13. [Gestion de Tokens](#13-gestion-de-tokens)

---

## 1. Autenticacion y Sesion

### CU-1.1: Registro con Email

**Actor:** Usuario anonimo
**Precondicion:** No tiene cuenta en el sistema

**Storybook:**

```
PANTALLA: Formulario de Registro
┌─────────────────────────────────┐
│  Crear cuenta en CosmicEngine   │
│                                 │
│  Email:    [________________]   │
│  Nombre:   [________________]   │
│  Password: [________________]   │
│                                 │
│  [  Registrarse  ]              │
│                                 │
│  ─── o ───                      │
│  [  Continuar con Google  ]     │
│                                 │
│  Ya tienes cuenta? Inicia sesion│
└─────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/auth/registrar`

**Entrada:**
```json
{
  "email": "usuario@ejemplo.com",
  "nombre": "Juan Perez",
  "contrasena": "MiPassword123"
}
```

**Validaciones del formulario:**
| Campo | Regla | Mensaje de error |
|-------|-------|-----------------|
| email | EmailStr valido | "Ingresa un email valido" |
| nombre | 1-100 caracteres | "El nombre es obligatorio" / "Maximo 100 caracteres" |
| contrasena | 8-128 caracteres | "Minimo 8 caracteres" |

**Flujo exitoso:**
1. Usuario completa el formulario
2. Frontend valida campos localmente
3. `POST /api/v1/auth/registrar` con los datos
4. Backend crea usuario + suscripcion gratis automatica
5. Backend retorna tokens + datos del usuario
6. Frontend guarda tokens en localStorage/cookie
7. Redirige al dashboard

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "usuario": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@ejemplo.com",
      "nombre": "Juan Perez"
    },
    "token_acceso": "eyJhbGciOiJIUzI1NiIs...",
    "token_refresco": "eyJhbGciOiJIUzI1NiIs...",
    "tipo": "bearer"
  }
}
```

**Estados de error UI:**

| Codigo | Error | UI |
|--------|-------|-----|
| 409 | `EmailYaRegistrado` | Mostrar "Este email ya esta registrado. Inicia sesion." con link a login |
| 422 | Validacion Pydantic | Mostrar errores por campo (email invalido, password corto, nombre vacio) |
| 500 | Error servidor | Mostrar "Error interno. Intenta de nuevo." |

**Respuesta error (409):**
```json
{
  "exito": false,
  "error": "EmailYaRegistrado",
  "detalle": "El email ya está registrado: usuario@ejemplo.com"
}
```

**Efectos secundarios:**
- Se crea suscripcion al plan "gratis" automaticamente
- El usuario inicia sesion inmediatamente (no requiere verificacion de email)

---

### CU-1.2: Login con Email

**Actor:** Usuario registrado
**Precondicion:** Tiene cuenta con proveedor_auth="local"

**Storybook:**

```
PANTALLA: Iniciar Sesion
┌─────────────────────────────────┐
│  Bienvenido de vuelta           │
│                                 │
│  Email:    [________________]   │
│  Password: [________________]   │
│                                 │
│  [  Iniciar sesion  ]           │
│                                 │
│  ─── o ───                      │
│  [  Continuar con Google  ]     │
│                                 │
│  No tienes cuenta? Registrate   │
└─────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/auth/login`

**Entrada:**
```json
{
  "email": "usuario@ejemplo.com",
  "contrasena": "MiPassword123"
}
```

**Flujo exitoso:**
1. Usuario completa email y contrasena
2. `POST /api/v1/auth/login`
3. Backend verifica credenciales + usuario activo
4. Backend actualiza `ultimo_acceso`
5. Retorna tokens + datos del usuario
6. Frontend guarda tokens
7. Redirige al dashboard

**Respuesta exitosa (200):** Identica a registro (misma estructura)

**Estados de error UI:**

| Codigo | Error | UI |
|--------|-------|-----|
| 401 | "Email o contraseña incorrectos" | Mostrar error generico (no revelar cual fallo) |
| 401 | "Usuario desactivado" | Mostrar "Tu cuenta ha sido desactivada. Contacta soporte." |

**Casos especiales:**
- Usuario Google sin contrasena local → falla con "Email o contraseña incorrectos"
- El mensaje de error es identico para email no encontrado y password incorrecto (seguridad)

---

### CU-1.3: Login con Google OAuth

**Actor:** Usuario anonimo o registrado con Google
**Precondicion:** Tiene cuenta Google

**Storybook:**

```
PANTALLA: Login
  → Click en "Continuar con Google"
  → Se abre popup/redirect a Google
  → Google muestra pantalla de permisos
  → Usuario autoriza
  → Redirect a callback con code
  → Frontend procesa tokens

ESTADOS:
1. [IDLE]     → Boton "Continuar con Google"
2. [LOADING]  → Spinner "Conectando con Google..."
3. [SUCCESS]  → Redirige al dashboard
4. [ERROR]    → Muestra error segun caso
```

**Flujo en 2 pasos:**

**Paso 1:** Obtener URL de Google
`GET /api/v1/auth/google/url`

**Respuesta:**
```json
{
  "exito": true,
  "datos": {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=openid+email+profile&response_type=code"
  }
}
```

**Paso 2:** Frontend redirige al usuario a `datos.url`. Google retorna `code` al callback.
`GET /api/v1/auth/google/callback?code=4/0AX4XfWh...`

**Respuesta exitosa (200):** Misma estructura que login/registro

**Escenarios del callback:**

| Escenario | Resultado |
|-----------|----------|
| Google ID nuevo, email nuevo | Crea usuario + plan gratis + tokens |
| Google ID existente | Login directo + tokens |
| Google ID nuevo, email ya registrado localmente | Error 409: "El email ya esta registrado" |
| Usuario Google desactivado | Error 401: "Usuario desactivado" |

**Error UI (409):**
```
PANTALLA: Error de vinculacion
┌─────────────────────────────────────┐
│  ⚠ Email ya registrado             │
│                                     │
│  El email usuario@gmail.com ya      │
│  tiene una cuenta con password.     │
│                                     │
│  [Iniciar sesion con password]      │
└─────────────────────────────────────┘
```

---

### CU-1.4: Cerrar Sesion (Logout)

**Actor:** Usuario autenticado
**Precondicion:** Tiene tokens validos

**Endpoint:** `POST /api/v1/auth/logout`
**Headers:** `Authorization: Bearer {token_acceso}`

**Entrada:**
```json
{
  "token_refresco": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Sesión cerrada correctamente"
}
```

**Flujo frontend:**
1. Enviar POST con refresh token
2. Eliminar tokens de localStorage/cookie
3. Redirigir a pantalla de login
4. Si falla el POST → eliminar tokens locales de todas formas (logout forzado)

---

### CU-1.5: Renovar Token de Acceso

**Actor:** Frontend automaticamente
**Precondicion:** Access token expirado, refresh token valido

**Endpoint:** `POST /api/v1/auth/renovar`

**Entrada:**
```json
{
  "token_refresco": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "token_acceso": "eyJnuevoToken...",
    "tipo": "bearer"
  }
}
```

**Flujo frontend (interceptor HTTP):**
1. Hacer request con access token
2. Si retorna 401 → intentar renovar con refresh token
3. Si renovacion exitosa → reintentar request original con nuevo token
4. Si renovacion falla → redirigir a login (sesion expirada)

**Errores de renovacion:**

| Codigo | Error | Accion frontend |
|--------|-------|----------------|
| 401 | "Token de refresco expirado" | Logout + redirigir a login |
| 401 | "Token de refresco inválido" | Logout + redirigir a login |
| 401 | "Se requiere token de refresco" | Logout (token tipo incorrecto) |
| 401 | "Token de refresco revocado" | Logout (ya se hizo logout antes) |
| 401 | "Usuario no encontrado o desactivado" | Logout + mostrar "Cuenta desactivada" |

**Nota:** El access token dura 30 minutos. El refresh token dura 7 dias.

---

### CU-1.6: Cambiar Contrasena

**Actor:** Usuario autenticado con proveedor local
**Precondicion:** proveedor_auth = "local" (no Google)

**Storybook:**

```
PANTALLA: Cambiar Contrasena (en Configuracion)
┌─────────────────────────────────────┐
│  Cambiar contraseña                 │
│                                     │
│  Contraseña actual: [____________]  │
│  Nueva contraseña:  [____________]  │
│  Confirmar nueva:   [____________]  │
│                                     │
│  [  Cambiar contraseña  ]           │
└─────────────────────────────────────┘

NOTA: La confirmacion de nueva contrasena se valida
solo en frontend. El backend recibe solo actual y nueva.
```

**Endpoint:** `POST /api/v1/auth/cambiar-contrasena`
**Headers:** `Authorization: Bearer {token_acceso}`

**Entrada:**
```json
{
  "contrasena_actual": "MiPasswordViejo",
  "contrasena_nueva": "MiPasswordNuevo123"
}
```

**Validaciones:**
| Campo | Regla |
|-------|-------|
| contrasena_actual | Requerido |
| contrasena_nueva | 8-128 caracteres |
| confirmar (solo frontend) | Debe coincidir con nueva |

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Contraseña actualizada correctamente"
}
```

**Errores:**

| Codigo | Error | UI |
|--------|-------|-----|
| 401 | "Contraseña actual incorrecta" | Marcar campo contrasena actual en rojo |
| 401 | "Los usuarios de Google no pueden cambiar contraseña" | Ocultar seccion completa para usuarios Google |

**UI condicional:**
- Si `proveedor_auth === "google"` → NO mostrar esta seccion
- Si `proveedor_auth === "local"` → mostrar formulario completo

---

## 2. Perfil de Usuario

### CU-2.1: Ver Mi Perfil

**Actor:** Usuario autenticado
**Precondicion:** Tiene token de acceso valido

**Storybook:**

```
PANTALLA: Mi Perfil / Dashboard Header
┌──────────────────────────────────────────┐
│  👤 Juan Perez                           │
│  usuario@ejemplo.com                     │
│                                          │
│  Plan: Premium ✓ (activa)                │
│  Proveedor: local | google               │
│  Miembro desde: 15 Ene 2026             │
│  Ultimo acceso: 22 Mar 2026 15:30       │
│                                          │
│  [Cambiar contrasena] [Cerrar sesion]    │
└──────────────────────────────────────────┘
```

**Endpoint:** `GET /api/v1/auth/me`
**Headers:** `Authorization: Bearer {token_acceso}`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan Perez",
    "activo": true,
    "verificado": false,
    "proveedor_auth": "local",
    "plan_slug": "premium",
    "plan_nombre": "Premium",
    "suscripcion_estado": "activa",
    "ultimo_acceso": "2026-03-22T15:30:45.123456",
    "creado_en": "2026-01-15T10:00:00.123456"
  }
}
```

**Campos para la UI:**

| Campo | Uso en UI | Formato |
|-------|-----------|---------|
| nombre | Header, perfil | Tal cual |
| email | Debajo del nombre | Tal cual |
| proveedor_auth | Icono de proveedor, condicional cambio password | "local" → candado, "google" → icono Google |
| plan_slug | Badge del plan, feature gating en frontend | "gratis" → badge gris, "premium" → badge dorado |
| plan_nombre | Texto del badge | "Gratis", "Premium" |
| suscripcion_estado | Estado visual | "activa" → verde, "pendiente" → amarillo, "pausada" → naranja, "cancelada" → rojo |
| ultimo_acceso | Info secundaria | Formatear a fecha local |
| creado_en | "Miembro desde" | Formatear a fecha corta |

**Valores null posibles:**
- `plan_slug`, `plan_nombre`, `suscripcion_estado` pueden ser `null` si no tiene suscripcion
- `ultimo_acceso` puede ser `null` si nunca hizo login

---

## 3. Carta Natal

### CU-3.1: Calcular Carta Natal

**Actor:** Cualquier usuario (autenticado o anonimo)
**Precondicion:** Ninguna (funciona sin login)

**Storybook:**

```
PANTALLA: Calculadora de Carta Natal
┌──────────────────────────────────────────┐
│  Tu Carta Natal                          │
│                                          │
│  Nombre:      [____________________]     │
│  Nacimiento:  [__/__/____]               │
│  Hora:        [__:__]                    │
│  Ciudad:      [____________________]     │
│  Pais:        [____________________]     │
│  Casas:       [Placidus        ▼]        │
│                                          │
│  [  Calcular carta natal  ]              │
└──────────────────────────────────────────┘

ESTADO: Loading
┌──────────────────────────────────────────┐
│  Calculando tu carta natal...            │
│  ◌ Geocodificando ubicacion              │
│  ◌ Resolviendo zona horaria             │
│  ◌ Calculando posiciones planetarias     │
│  [=========>          ] 60%              │
└──────────────────────────────────────────┘

ESTADO: Resultado
┌──────────────────────────────────────────┐
│  Carta Natal de Juan Perez               │
│  15 Ene 1990 14:30 — Buenos Aires, AR    │
│                                          │
│  ┌─────────────────┐                     │
│  │   Rueda Zodiacal │   (SVG/d3.js)     │
│  │   con planetas,  │                    │
│  │   casas y        │                    │
│  │   aspectos       │                    │
│  └─────────────────┘                     │
│                                          │
│  PLANETAS              CASAS             │
│  ☉ Sol    24°37' Cap   I   15°22' Ari   │
│  ☽ Luna   12°05' Leo   II  08°41' Tau   │
│  ☿ Merc   05°12' Acu   III 02°33' Gem   │
│  ...                   ...               │
│                                          │
│  ASPECTOS                                │
│  ☉ □ ☽   Cuadratura  orbe 3.5°          │
│  ☉ △ ♃   Trigono     orbe 1.2°          │
│  ...                                     │
│                                          │
│  Ascendente: 15°22' Aries               │
│  Medio Cielo: 24°37' Capricornio        │
└──────────────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/natal`

**Entrada:**
```json
{
  "nombre": "Juan Perez",
  "fecha_nacimiento": "1990-01-15",
  "hora_nacimiento": "14:30",
  "ciudad_nacimiento": "Buenos Aires",
  "pais_nacimiento": "Argentina",
  "sistema_casas": "placidus"
}
```

**Validaciones del formulario:**

| Campo | Regla | Default |
|-------|-------|---------|
| nombre | 1-100 chars, obligatorio | — |
| fecha_nacimiento | Formato YYYY-MM-DD | — |
| hora_nacimiento | Formato HH:MM (regex `^\d{2}:\d{2}$`) | — |
| ciudad_nacimiento | 1-100 chars, obligatorio | — |
| pais_nacimiento | 1-60 chars, obligatorio | — |
| sistema_casas | Texto libre | "placidus" |

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "nombre": "Juan Perez",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad": "Buenos Aires",
    "pais": "Argentina",
    "latitud": -34.6037,
    "longitud": -58.3816,
    "zona_horaria": "America/Argentina/Buenos_Aires",
    "dia_juliano": 2447908.187500,
    "planetas": [
      {
        "nombre": "Sol",
        "longitud": 294.37,
        "latitud": 0.0001,
        "signo": "Capricornio",
        "grado_en_signo": 24.37,
        "casa": 10,
        "retrogrado": false,
        "velocidad": 1.0192,
        "dignidad": null
      },
      {
        "nombre": "Luna",
        "longitud": 132.05,
        "latitud": -3.42,
        "signo": "Leo",
        "grado_en_signo": 12.05,
        "casa": 5,
        "retrogrado": false,
        "velocidad": 13.17,
        "dignidad": null
      }
    ],
    "casas": [
      {
        "numero": 1,
        "signo": "Aries",
        "grado": 15.22,
        "grado_en_signo": 15.22
      }
    ],
    "aspectos": [
      {
        "planeta1": "Sol",
        "planeta2": "Luna",
        "tipo": "cuadratura",
        "angulo_exacto": 87.5,
        "orbe": 2.5,
        "aplicativo": true
      }
    ],
    "ascendente": {
      "signo": "Aries",
      "grado": 15.22,
      "grado_en_signo": 15.22
    },
    "medio_cielo": {
      "signo": "Capricornio",
      "grado": 294.37,
      "grado_en_signo": 24.37
    },
    "sistema_casas": "placidus"
  },
  "cache": false
}
```

**Planetas incluidos (14):**
Sol, Luna, Mercurio, Venus, Marte, Jupiter, Saturno, Urano, Neptuno, Pluton, Nodo Norte, Nodo Sur, Quiron, Lilith

**Tipos de aspecto:**
| Aspecto | Angulo | Orbe |
|---------|--------|------|
| Conjuncion | 0° | ±8° |
| Sextil | 60° | ±4° |
| Cuadratura | 90° | ±8° |
| Trigono | 120° | ±8° |
| Oposicion | 180° | ±8° |

**Dignidades posibles:**
`"Domicilio"`, `"Exaltación"`, `"Caída"`, `"Exilio"`, `null`

**Errores:**

| Codigo | Error | UI |
|--------|-------|-----|
| 404 | `UbicacionNoEncontrada` | "No se encontro la ubicacion. Verifica ciudad y pais." |
| 400 | `ErrorZonaHoraria` | "No se pudo determinar la zona horaria." |
| 500 | `ErrorCalculoEfemerides` | "Error en el calculo. Intenta de nuevo." |
| 422 | Validacion | Mostrar errores por campo |

**Nota sobre cache:**
- `"cache": true` indica que el resultado vino de cache (no se recalculo)
- `"cache": false` indica calculo fresco
- El frontend NO necesita diferenciar — solo informativo

---

## 4. Diseno Humano

### CU-4.1: Calcular Body Graph

**Actor:** Cualquier usuario
**Precondicion:** Ninguna

**Storybook:**

```
PANTALLA: Calculadora de Diseno Humano
┌──────────────────────────────────────────┐
│  Tu Diseño Humano                        │
│                                          │
│  Nombre:      [____________________]     │
│  Nacimiento:  [__/__/____]               │
│  Hora:        [__:__]                    │
│  Ciudad:      [____________________]     │
│  Pais:        [____________________]     │
│                                          │
│  [  Calcular diseño humano  ]            │
└──────────────────────────────────────────┘

ESTADO: Resultado
┌──────────────────────────────────────────┐
│  Diseño Humano — Juan Perez              │
│                                          │
│  Tipo: Generador Manifestante            │
│  Autoridad: Autoridad Emocional          │
│  Perfil: 3/5                             │
│  Definicion: Definicion Unica            │
│                                          │
│  ┌─────────────────┐                     │
│  │   Body Graph     │  (SVG)             │
│  │   9 centros      │                    │
│  │   canales        │                    │
│  │   puertas        │                    │
│  └─────────────────┘                     │
│                                          │
│  CENTROS                                 │
│  Corona:    ○ Indefinido                 │
│  Ajna:      ● Definido                   │
│  Garganta:  ● Definido                   │
│  G:         ● Definido                   │
│  Corazon:   ○ Indefinido                 │
│  Plexo:     ● Definido                   │
│  Sacro:     ● Definido                   │
│  Bazo:      ○ Indefinido                 │
│  Raiz:      ● Definido                   │
│                                          │
│  CANALES ACTIVOS                         │
│  20-34 Canal del Carisma (Garg-Sacro)    │
│  ...                                     │
│                                          │
│  CRUZ DE ENCARNACION                     │
│  Sol ☉: Puerta 51  Tierra ⊕: Puerta 57  │
│  Sol ☉: Puerta 25  Tierra ⊕: Puerta 46  │
│  (consciente / inconsciente)             │
│                                          │
│  ACTIVACIONES                            │
│  Conscientes (Personalidad)              │
│  ☉ Sol     → Puerta 51 Linea 3          │
│  ☽ Luna    → Puerta 29 Linea 5          │
│  ...                                     │
│  Inconscientes (Diseño)                  │
│  ☉ Sol     → Puerta 25 Linea 1          │
│  ☽ Luna    → Puerta 2  Linea 4          │
│  ...                                     │
└──────────────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/human-design`

**Entrada:** Misma que carta natal (sin `sistema_casas`)
```json
{
  "nombre": "Juan Perez",
  "fecha_nacimiento": "1990-01-15",
  "hora_nacimiento": "14:30",
  "ciudad_nacimiento": "Buenos Aires",
  "pais_nacimiento": "Argentina"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "nombre": "Juan Perez",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad": "Buenos Aires",
    "pais": "Argentina",
    "latitud": -34.6037,
    "longitud": -58.3816,
    "zona_horaria": "America/Argentina/Buenos_Aires",
    "tipo": "Generador Manifestante",
    "autoridad": "Autoridad Emocional",
    "perfil": "3/5",
    "definicion": "Definición Única",
    "cruz_encarnacion": {
      "puertas": [51, 57, 25, 46],
      "sol_consciente": 51,
      "tierra_consciente": 57,
      "sol_inconsciente": 25,
      "tierra_inconsciente": 46
    },
    "centros": {
      "corona": "indefinido",
      "ajna": "definido",
      "garganta": "definido",
      "g": "definido",
      "corazon": "indefinido",
      "plexo_solar": "definido",
      "sacro": "definido",
      "bazo": "indefinido",
      "raiz": "definido"
    },
    "canales": [
      {
        "puertas": [20, 34],
        "nombre": "Canal del Carisma",
        "centros": ["Garganta", "Sacro"]
      }
    ],
    "activaciones_conscientes": [
      {
        "planeta": "Sol",
        "longitud": 294.37,
        "puerta": 51,
        "linea": 3,
        "color": 4
      }
    ],
    "activaciones_inconscientes": [
      {
        "planeta": "Sol",
        "longitud": 206.37,
        "puerta": 25,
        "linea": 1,
        "color": 2
      }
    ],
    "puertas_conscientes": [51, 57, 29, 4, 7, 13],
    "puertas_inconscientes": [25, 46, 2, 14, 10, 34],
    "dia_juliano_consciente": 2447908.187500,
    "dia_juliano_inconsciente": 2447820.543210
  },
  "cache": false
}
```

**Valores posibles de tipo (5):**
| Tipo | Descripcion corta |
|------|------------------|
| Manifestador | Inicia, impacta |
| Generador | Energia vital, responde |
| Generador Manifestante | Multitarea, responde e inicia |
| Proyector | Guia, reconocimiento |
| Reflector | Espejo, ciclo lunar |

**Valores posibles de autoridad (7):**
Autoridad Emocional, Autoridad Sacral, Autoridad Esplenica, Autoridad del Ego, Autoridad del Self, Autoridad Lunar, Sin Autoridad

**9 centros del Body Graph:**
corona, ajna, garganta, g, corazon, plexo_solar, sacro, bazo, raiz

**Errores:** Mismos que carta natal (404 ubicacion, 400 TZ, 500 calculo)

---

## 5. Numerologia

### CU-5.1: Calcular Carta Numerologica

**Actor:** Cualquier usuario
**Precondicion:** Ninguna

**Storybook:**

```
PANTALLA: Calculadora Numerologica
┌──────────────────────────────────────────┐
│  Tu Numerologia                          │
│                                          │
│  Nombre completo: [_________________]    │
│  Nacimiento:      [__/__/____]           │
│  Sistema:         (•) Pitagorico         │
│                   ( ) Caldeo             │
│                                          │
│  [  Calcular numerologia  ]              │
└──────────────────────────────────────────┘

ESTADO: Resultado
┌──────────────────────────────────────────┐
│  Numerologia de Juan Perez               │
│  Sistema: Pitagorico                     │
│                                          │
│  NUMEROS PRINCIPALES                     │
│  ┌─────────────────────────────────────┐ │
│  │ Camino de Vida    │  7              │ │
│  │ El Buscador...    │                 │ │
│  ├───────────────────┼─────────────────┤ │
│  │ Expresion         │  22 ⭐          │ │
│  │ Maestro Constructor│                │ │
│  ├───────────────────┼─────────────────┤ │
│  │ Impulso del Alma  │  9             │ │
│  │ Compasion...      │                 │ │
│  ├───────────────────┼─────────────────┤ │
│  │ Personalidad      │  4             │ │
│  │ Estabilidad...    │                 │ │
│  ├───────────────────┼─────────────────┤ │
│  │ Nro Nacimiento    │  15            │ │
│  │ Magnetismo...     │                 │ │
│  ├───────────────────┼─────────────────┤ │
│  │ Año Personal      │  3             │ │
│  │ Creatividad...    │                 │ │
│  └───────────────────┴─────────────────┘ │
│                                          │
│  ⭐ Numeros Maestros: 22                 │
└──────────────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/numerology`

**Entrada:**
```json
{
  "nombre": "Juan Carlos Perez",
  "fecha_nacimiento": "1990-01-15",
  "sistema": "pitagorico"
}
```

**Validaciones:**

| Campo | Regla | Default |
|-------|-------|---------|
| nombre | 1-100 chars | — |
| fecha_nacimiento | YYYY-MM-DD | — |
| sistema | "pitagorico" o "caldeo" (regex) | "pitagorico" |

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "nombre": "Juan Carlos Perez",
    "fecha_nacimiento": "1990-01-15",
    "sistema": "pitagorico",
    "camino_de_vida": {
      "numero": 7,
      "descripcion": "El Buscador Espiritual — introspección, análisis, sabiduría interior..."
    },
    "expresion": {
      "numero": 22,
      "descripcion": "El Maestro Constructor — visión global, capacidad de materializar grandes proyectos..."
    },
    "impulso_del_alma": {
      "numero": 9,
      "descripcion": "La Compasión Universal — humanitarismo, servicio, espiritualidad..."
    },
    "personalidad": {
      "numero": 4,
      "descripcion": "La Estabilidad — trabajo duro, estructura, confiabilidad..."
    },
    "numero_nacimiento": {
      "numero": 15,
      "descripcion": "Magnetismo Personal — carisma, creatividad, atracción..."
    },
    "anio_personal": {
      "numero": 3,
      "descripcion": "Año de Creatividad — expresión, socialización, alegría..."
    },
    "numeros_maestros_presentes": [22]
  },
  "cache": false
}
```

**UI especial para numeros maestros:**
- Si `numero` es 11, 22, o 33 → mostrar con badge especial (estrella, icono dorado)
- Lista `numeros_maestros_presentes` indica cuales estan activos en la carta
- Los maestros **nunca** se reducen a un digito

**Nota:** No requiere ciudad ni hora — solo nombre y fecha de nacimiento.

---

## 6. Retorno Solar

### CU-6.1: Calcular Revolucion Solar

**Actor:** Cualquier usuario
**Precondicion:** Ninguna

**Storybook:**

```
PANTALLA: Revolucion Solar
┌──────────────────────────────────────────┐
│  Revolución Solar                        │
│                                          │
│  [Formulario datos nacimiento]           │
│  Año a calcular: [2026   ▼]             │
│                                          │
│  [  Calcular retorno solar  ]            │
└──────────────────────────────────────────┘

ESTADO: Resultado
┌──────────────────────────────────────────┐
│  Revolución Solar 2026 — Juan Perez      │
│                                          │
│  Retorno: 15 Enero 2026 a las 16:42     │
│  Sol natal:   294°22'                    │
│  Sol retorno: 294°22' (error: 0.001°)   │
│                                          │
│  [Carta del retorno solar]               │
│  (misma visualizacion que carta natal)   │
│                                          │
│  ASPECTOS NATAL vs RETORNO              │
│  Sol natal □ Marte retorno  orbe 3.5°   │
│  Luna natal △ Venus retorno orbe 1.2°   │
│  ...                                     │
└──────────────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/solar-return/{anio}`

**Entrada:** (misma que natal + path param `anio`)
```json
{
  "nombre": "Juan Perez",
  "fecha_nacimiento": "1990-01-15",
  "hora_nacimiento": "14:30",
  "ciudad_nacimiento": "Buenos Aires",
  "pais_nacimiento": "Argentina",
  "sistema_casas": "placidus"
}
```

**URL:** `POST /api/v1/solar-return/2026`

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "nombre": "Juan Perez",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad": "Buenos Aires",
    "pais": "Argentina",
    "anio": 2026,
    "dia_juliano_retorno": 2461399.197917,
    "fecha_retorno": {
      "anio": 2026,
      "mes": 1,
      "dia": 15,
      "hora_decimal": 16.75
    },
    "longitud_sol_natal": 294.37,
    "longitud_sol_retorno": 294.371,
    "error_grados": 0.001,
    "carta_retorno": {
      "planetas": [],
      "casas": [],
      "aspectos": [],
      "ascendente": {},
      "medio_cielo": {},
      "sistema_casas": "placidus"
    },
    "aspectos_natal_retorno": [
      {
        "planeta_natal": "Sol",
        "planeta_retorno": "Marte",
        "tipo": "cuadratura",
        "orbe": 3.5
      }
    ]
  },
  "cache": false
}
```

**UI para hora_decimal:**
- `hora_decimal: 16.75` → formatear como "16:45"
- Formula: horas = floor(16.75) = 16, minutos = round(0.75 * 60) = 45

**Nota:** La `carta_retorno` tiene la misma estructura que una carta natal completa (planetas, casas, aspectos).

---

## 7. Transitos Planetarios

### CU-7.1: Ver Transitos Actuales

**Actor:** Cualquier usuario
**Precondicion:** Ninguna

**Storybook:**

```
PANTALLA: Transitos en Tiempo Real
┌──────────────────────────────────────────┐
│  Tránsitos Planetarios                   │
│  22 Mar 2026 15:45 UTC                   │
│                                          │
│  ┌──────────────────────────────┐        │
│  │  Rueda zodiacal con          │        │
│  │  posiciones actuales         │        │
│  └──────────────────────────────┘        │
│                                          │
│  POSICIONES ACTUALES                     │
│  ☉ Sol      2°15' Aries     →           │
│  ☽ Luna    18°33' Cancer    →           │
│  ☿ Mercurio 5°42' Piscis   ←R          │
│  ♀ Venus   22°10' Tauro    →           │
│  ♂ Marte   15°08' Geminis  →           │
│  ♃ Jupiter  8°55' Cancer   →           │
│  ♄ Saturno 24°17' Piscis   →           │
│  ♅ Urano   25°03' Tauro    →           │
│  ♆ Neptuno  1°28' Aries    →           │
│  ♇ Pluton   6°12' Acuario  →           │
│                                          │
│  Auto-actualiza cada 10 min              │
└──────────────────────────────────────────┘
```

**Endpoint:** `GET /api/v1/transits`

**Entrada:** Ninguna (no requiere parametros ni body)

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "fecha_utc": "2026-03-22T15:45:30.123456",
    "dia_juliano": 2461459.157292,
    "planetas": [
      {
        "nombre": "Sol",
        "longitud": 2.15,
        "latitud": -0.03,
        "signo": "Aries",
        "grado_en_signo": 2.15,
        "retrogrado": false,
        "velocidad": 1.01
      },
      {
        "nombre": "Mercurio",
        "longitud": 335.42,
        "latitud": -1.22,
        "signo": "Piscis",
        "grado_en_signo": 5.42,
        "retrogrado": true,
        "velocidad": -0.75
      }
    ],
    "aspectos_natal": null
  },
  "cache": true
}
```

**UI especial:**
- Si `retrogrado === true` → mostrar "R" o "←" junto al planeta
- Si `velocidad < 0` → planeta retrogrado (confirma el flag)
- Cache TTL = 10 min → se puede configurar auto-refresh en frontend cada 10 min
- `aspectos_natal` siempre es `null` en la implementacion actual

---

## 8. Perfiles Natales

### CU-8.1: Crear Perfil Natal

**Actor:** Cualquier usuario (autenticado o anonimo)
**Precondicion:** Ninguna

**Storybook:**

```
PANTALLA: Guardar Perfil
(aparece despues de un calculo exitoso)
┌──────────────────────────────────────────┐
│  ¿Quieres guardar este perfil?           │
│                                          │
│  Juan Perez                              │
│  15 Ene 1990 14:30                       │
│  Buenos Aires, Argentina                 │
│                                          │
│  [  Guardar perfil  ]  [  No, gracias  ] │
└──────────────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/profile`
**Headers:** `Authorization: Bearer {token}` (opcional)

**Entrada:** Misma que calculo natal
```json
{
  "nombre": "Juan Perez",
  "fecha_nacimiento": "1990-01-15",
  "hora_nacimiento": "14:30",
  "ciudad_nacimiento": "Buenos Aires",
  "pais_nacimiento": "Argentina",
  "sistema_casas": "placidus"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "Juan Perez",
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

**Comportamiento segun autenticacion:**
- Con token → `usuario_id` se vincula al perfil (aparece en "Mis perfiles")
- Sin token → perfil anonimo (`usuario_id = null`)

---

### CU-8.2: Ver Perfil Guardado

**Actor:** Cualquier usuario

**Endpoint:** `GET /api/v1/profile/{perfil_id}`

**Respuesta exitosa (200):** Misma estructura que creacion

**Error (404):**
```json
{
  "exito": false,
  "error": "PerfilNoEncontrado",
  "detalle": "Perfil no encontrado: 550e8400-..."
}
```

**Nota:** No hay control de acceso por propiedad — cualquier usuario puede ver cualquier perfil por ID.

---

## 9. Planes y Suscripciones

### CU-9.1: Ver Planes Disponibles

**Actor:** Cualquier usuario
**Precondicion:** Ninguna

**Storybook:**

```
PANTALLA: Planes y Precios
┌──────────────────────────────────────────────────────┐
│  Elige tu plan                                       │
│                                          📍 AR ▼     │
│                                                      │
│  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │  GRATIS          │  │  PREMIUM ⭐              │   │
│  │                  │  │                          │   │
│  │  $0/mes          │  │  $9 USD/mes              │   │
│  │                  │  │  ~$10,800 ARS/mes        │   │
│  │  ✓ 3 perfiles    │  │                          │   │
│  │  ✓ 5 calc/dia    │  │  ✓ Perfiles ilimitados   │   │
│  │  ✓ Natal basico  │  │  ✓ Calculos ilimitados   │   │
│  │  ✓ Numerologia   │  │  ✓ Todas las cartas      │   │
│  │    basica        │  │  ✓ Diseño Humano         │   │
│  │                  │  │  ✓ Retorno Solar          │   │
│  │                  │  │  ✓ Tránsitos              │   │
│  │  [Plan actual]   │  │  ✓ Exportar PDF           │   │
│  │                  │  │                          │   │
│  │                  │  │  [  Suscribirse  ]       │   │
│  └─────────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /api/v1/suscripcion/planes?pais_codigo=AR`

**Query params:**

| Param | Tipo | Default | Valores |
|-------|------|---------|---------|
| pais_codigo | string | "AR" | "AR", "BR", "MX" |

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "plan-gratis-uuid",
      "nombre": "Gratis",
      "slug": "gratis",
      "descripcion": "Acceso basico a calculos astrologicos",
      "precio_usd_centavos": 0,
      "intervalo": "months",
      "limite_perfiles": 3,
      "limite_calculos_dia": 5,
      "features": ["natal_basico", "numerologia_basica"],
      "precio_local": null,
      "moneda_local": null
    },
    {
      "id": "plan-premium-uuid",
      "nombre": "Premium",
      "slug": "premium",
      "descripcion": "Acceso completo a todas las herramientas",
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

**Logica de display:**
- `limite_perfiles === -1` → mostrar "Ilimitado"
- `limite_calculos_dia === -1` → mostrar "Ilimitado"
- `precio_local` esta en centavos → dividir por 100 para mostrar
- `precio_usd_centavos` en centavos → 900 = $9.00 USD
- Plan gratis no tiene `precio_local` (siempre null)

**Selector de pais:**
```
AR → Peso Argentino (ARS) → $10,800/mes
BR → Real Brasileño (BRL) → R$49.50/mes
MX → Peso Mexicano (MXN)  → $157.50/mes
```

---

### CU-9.2: Suscribirse a Plan Premium

**Actor:** Usuario autenticado con plan gratis
**Precondicion:** Autenticado, plan actual = gratis

**Storybook:**

```
FLUJO:
1. Click "Suscribirse" en plan Premium
2. Frontend confirma pais (selector AR/BR/MX)
3. POST /suscribirse → obtiene init_point
4. Redirect a MercadoPago (init_point URL)
5. Usuario completa pago en MP
6. MP redirige a URL de exito/fallo/pendiente
7. Frontend muestra resultado

PANTALLA: Confirmacion pre-checkout
┌──────────────────────────────────────────┐
│  Confirmar suscripcion                   │
│                                          │
│  Plan: Premium                           │
│  Precio: $9 USD/mes (~$10,800 ARS)      │
│  Pais: Argentina 🇦🇷                     │
│                                          │
│  Seras redirigido a MercadoPago          │
│  para completar el pago.                 │
│                                          │
│  [  Ir a MercadoPago  ]  [  Cancelar  ] │
└──────────────────────────────────────────┘

PANTALLA: Resultado exito (URL: /suscripcion/exito)
┌──────────────────────────────────────────┐
│  ✓ ¡Suscripcion exitosa!                │
│                                          │
│  Tu plan Premium esta activo.            │
│  Ya puedes usar todas las herramientas.  │
│                                          │
│  [  Ir al dashboard  ]                   │
└──────────────────────────────────────────┘

PANTALLA: Resultado pendiente (URL: /suscripcion/pendiente)
┌──────────────────────────────────────────┐
│  ⏳ Pago pendiente                       │
│                                          │
│  Tu pago esta siendo procesado.          │
│  Te notificaremos cuando se confirme.    │
│                                          │
│  [  Ir al dashboard  ]                   │
└──────────────────────────────────────────┘

PANTALLA: Resultado fallo (URL: /suscripcion/fallo)
┌──────────────────────────────────────────┐
│  ✕ No se pudo completar el pago         │
│                                          │
│  Intenta nuevamente o usa otro           │
│  metodo de pago.                         │
│                                          │
│  [  Reintentar  ]  [  Ir al dashboard  ]│
└──────────────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/suscripcion/suscribirse`
**Headers:** `Authorization: Bearer {token_acceso}`

**Entrada:**
```json
{
  "plan_id": "plan-premium-uuid",
  "pais_codigo": "AR"
}
```

**Validaciones:**

| Campo | Regla |
|-------|-------|
| plan_id | UUID valido, plan debe existir y estar activo |
| pais_codigo | "AR", "BR", o "MX" (regex `^(AR\|BR\|MX)$`) |

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "init_point": "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=abc123",
    "suscripcion_id": "sus-uuid-123",
    "mp_preapproval_id": "abc123"
  }
}
```

**Accion frontend:**
```javascript
// Redirigir al checkout de MercadoPago
window.location.href = response.datos.init_point;
```

**URLs de retorno (configuradas en backend):**
```
Exito:     http://localhost:3000/suscripcion/exito
Fallo:     http://localhost:3000/suscripcion/fallo
Pendiente: http://localhost:3000/suscripcion/pendiente
```

**Errores:**

| Codigo | Error | UI |
|--------|-------|-----|
| 401 | No autenticado | Redirigir a login |
| 404 | `PlanNoEncontrado` — plan no existe o inactivo | "El plan no esta disponible" |
| 404 | `PlanNoEncontrado` — sin precio para el pais | "No hay precio disponible para tu pais" |
| 502 | `ErrorPasarelaPago` — plan gratis | "El plan gratuito no requiere pago" |
| 502 | `ErrorPasarelaPago` — sin config MP | "Servicio de pagos no disponible para tu pais" |
| 502 | `ErrorPasarelaPago` — error MP API | "Error al conectar con MercadoPago. Intenta de nuevo." |

**Efectos secundarios:**
- Suscripciones activas previas se cancelan automaticamente
- Se crea suscripcion local con estado "pendiente"
- El estado cambia a "activa" cuando MP confirma via webhook

---

### CU-9.3: Ver Mi Suscripcion

**Actor:** Usuario autenticado

**Storybook:**

```
PANTALLA: Mi Suscripcion (en Configuracion o Dashboard)
┌──────────────────────────────────────────┐
│  Tu Suscripcion                          │
│                                          │
│  Plan: Premium ⭐                        │
│  Estado: Activa ● verde                  │
│  Pais: Argentina                         │
│  Desde: 1 Mar 2026                       │
│                                          │
│  [  Cancelar suscripcion  ]              │
│                                          │
│  ── o si no tiene suscripcion ──         │
│                                          │
│  No tienes suscripcion activa.           │
│  [  Ver planes disponibles  ]            │
└──────────────────────────────────────────┘
```

**Endpoint:** `GET /api/v1/suscripcion/mi-suscripcion`
**Headers:** `Authorization: Bearer {token_acceso}`

**Respuesta con suscripcion (200):**
```json
{
  "exito": true,
  "datos": {
    "id": "sus-uuid-123",
    "plan_id": "plan-premium-uuid",
    "plan_nombre": "Premium",
    "plan_slug": "premium",
    "pais_codigo": "AR",
    "estado": "activa",
    "mp_preapproval_id": "abc123",
    "fecha_inicio": "2026-03-01T00:00:00+00:00",
    "fecha_fin": null,
    "creado_en": "2026-03-01T10:30:00+00:00"
  }
}
```

**Respuesta sin suscripcion (200):**
```json
{
  "exito": true,
  "datos": null,
  "mensaje": "Sin suscripción activa"
}
```

**Estados visuales:**

| estado | Color | Icono | Texto |
|--------|-------|-------|-------|
| activa | Verde | ● | "Activa" |
| pendiente | Amarillo | ◐ | "Pendiente de pago" |
| pausada | Naranja | ‖ | "Pausada" |
| cancelada | Rojo | ✕ | "Cancelada" |

**Nota:** `mp_preapproval_id` es `null` para suscripciones gratis (creadas automaticamente).

---

### CU-9.4: Cancelar Suscripcion

**Actor:** Usuario autenticado con suscripcion activa
**Precondicion:** Tiene suscripcion activa (no gratis)

**Storybook:**

```
PANTALLA: Confirmar Cancelacion
┌──────────────────────────────────────────┐
│  ¿Cancelar tu suscripcion?               │
│                                          │
│  Al cancelar:                            │
│  • Perderas acceso a funciones Premium   │
│  • Se degradara a plan Gratis            │
│  • No se realizaran mas cobros           │
│                                          │
│  [  Si, cancelar  ]  [  Mantener plan  ] │
└──────────────────────────────────────────┘

PANTALLA: Cancelacion exitosa
┌──────────────────────────────────────────┐
│  Suscripcion cancelada                   │
│                                          │
│  Tu plan ha sido cambiado a Gratis.      │
│  Puedes volver a suscribirte cuando      │
│  quieras.                                │
│                                          │
│  [  Ir al dashboard  ]                   │
└──────────────────────────────────────────┘
```

**Endpoint:** `POST /api/v1/suscripcion/cancelar`
**Headers:** `Authorization: Bearer {token_acceso}`
**Body:** Ninguno

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Suscripción cancelada correctamente"
}
```

**Errores:**

| Codigo | Error | UI |
|--------|-------|-----|
| 401 | No autenticado | Redirigir a login |
| 404 | `SuscripcionNoEncontrada` | "No tienes una suscripcion activa para cancelar" |

**Efectos secundarios:**
- Suscripcion marcada como "cancelada"
- Se cancela en MercadoPago (si falla MP, se cancela localmente de todos modos)
- Se crea automaticamente una suscripcion al plan gratis
- El usuario conserva acceso hasta el fin del periodo pagado (segun MP)

---

## 10. Pagos e Historial

### CU-10.1: Ver Historial de Pagos

**Actor:** Usuario autenticado

**Storybook:**

```
PANTALLA: Historial de Pagos
┌──────────────────────────────────────────────────────┐
│  Historial de Pagos                                  │
│                                                      │
│  ┌────────┬─────────┬────────┬──────────┬──────────┐ │
│  │ Fecha  │ Monto   │ Moneda │ Metodo   │ Estado   │ │
│  ├────────┼─────────┼────────┼──────────┼──────────┤ │
│  │ 15 Mar │ $10,800 │  ARS   │ Visa     │ Aprobado │ │
│  │ 15 Feb │ $10,800 │  ARS   │ Visa     │ Aprobado │ │
│  │ 15 Ene │ $10,800 │  ARS   │ Visa     │ Aprobado │ │
│  └────────┴─────────┴────────┴──────────┴──────────┘ │
│                                                      │
│  Mostrando 3 de 3                                    │
│  [  Cargar mas  ]                                    │
│                                                      │
│  ── Si no hay pagos ──                               │
│  No tienes pagos registrados.                        │
└──────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /api/v1/suscripcion/pagos?limite=50&offset=0`
**Headers:** `Authorization: Bearer {token_acceso}`

**Query params:**

| Param | Default | Max | Descripcion |
|-------|---------|-----|-------------|
| limite | 50 | — | Cantidad por pagina |
| offset | 0 | — | Desplazamiento |

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": [
    {
      "id": "pago-uuid-1",
      "estado": "aprobado",
      "monto_centavos": 1080000,
      "moneda": "ARS",
      "metodo_pago": "credit_card",
      "detalle_estado": "accredited",
      "fecha_pago": "2026-03-15T14:30:00+00:00",
      "creado_en": "2026-03-15T14:30:05+00:00"
    }
  ]
}
```

**Formato de monto:**
- `monto_centavos` esta en centavos de la moneda local
- Para mostrar: `monto_centavos / 100` → $10,800.00
- Formatear segun `moneda`: ARS → "$10.800", BRL → "R$49,50", MXN → "$157.50"

**Estados de pago y colores:**

| estado | Color | Descripcion |
|--------|-------|------------|
| aprobado | Verde | Pago exitoso |
| pendiente | Amarillo | En proceso |
| en_proceso | Amarillo | Procesando |
| rechazado | Rojo | Tarjeta rechazada |
| cancelado | Gris | Cancelado |
| reembolsado | Azul | Dinero devuelto |
| contracargo | Rojo oscuro | Disputa del comprador |

---

## 11. Sistema y Health

### CU-11.1: Health Check

**Actor:** Frontend (automatico) o monitor

**Endpoint:** `GET /health`

**Respuesta (200):**
```json
{
  "estado": "saludable",
  "version": "1.0.0",
  "base_datos": "conectado",
  "redis": "conectado",
  "efemerides": "14 archivos"
}
```

**Valores posibles:**

| Campo | OK | Degradado |
|-------|----|---------:|
| estado | "saludable" | "degradado" |
| base_datos | "conectado" | "desconectado" |
| redis | "conectado" | "desconectado" |
| efemerides | "N archivos" | "directorio vacío" / "no encontrado" |

**Uso frontend:** Verificar estado antes de mostrar UI de calculo. Si `estado === "degradado"`, mostrar banner de advertencia.

---

## 12. Manejo Global de Errores

### Formato estandar de error

Todas las respuestas de error del backend siguen esta estructura:

```json
{
  "exito": false,
  "error": "NombreDeExcepcion",
  "detalle": "Mensaje legible para el usuario"
}
```

### Tabla completa de errores

| HTTP | Excepcion | Contexto | Mensaje UI sugerido |
|------|-----------|----------|---------------------|
| 400 | ErrorZonaHoraria | Calculo natal/HD/retorno | "No se pudo determinar la zona horaria para esa ubicacion" |
| 401 | ErrorAutenticacion | Login, token invalido | "Credenciales incorrectas" o "Sesion expirada" |
| 401 | ErrorTokenInvalido | Token expirado/revocado | "Tu sesion ha expirado. Inicia sesion nuevamente" |
| 403 | ErrorAccesoDenegado | Recurso protegido | "No tienes permisos para acceder a este recurso" |
| 403 | LimiteExcedido | Feature gating | "Esta funcion requiere el plan Premium. [Actualizar plan]" |
| 404 | UbicacionNoEncontrada | Geocodificacion | "No se encontro esa ubicacion. Verifica ciudad y pais" |
| 404 | PerfilNoEncontrado | Perfil CRUD | "El perfil solicitado no existe" |
| 404 | UsuarioNoEncontrado | Auth interno | "Usuario no encontrado" |
| 404 | PlanNoEncontrado | Suscripcion | "El plan no esta disponible" |
| 404 | SuscripcionNoEncontrada | Cancelar | "No tienes una suscripcion activa" |
| 409 | EmailYaRegistrado | Registro, Google callback | "Este email ya esta registrado" |
| 422 | Validacion Pydantic | Cualquier input invalido | Mostrar errores por campo |
| 500 | ErrorCalculoEfemerides | Calculo astronomico | "Error interno en el calculo. Intenta de nuevo" |
| 502 | ErrorPasarelaPago | MercadoPago | "Error al conectar con el servicio de pagos" |

### Interceptor HTTP recomendado

```
Para cada response:
  if (status === 401 && !isLoginRequest):
    → Intentar renovar token
    → Si falla: logout + redirect a /login

  if (status === 403 && error === "LimiteExcedido"):
    → Mostrar modal de upgrade a Premium

  if (status === 422):
    → Parsear errores y marcar campos del formulario

  if (status >= 500):
    → Mostrar toast "Error del servidor. Intenta de nuevo"
```

---

## 13. Gestion de Tokens

### Estructura de tokens JWT

**Access Token (30 min):**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@ejemplo.com",
  "tipo": "acceso",
  "jti": "unique-token-id",
  "iat": 1711115430,
  "exp": 1711117230
}
```

**Refresh Token (7 dias):**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@ejemplo.com",
  "tipo": "refresco",
  "jti": "unique-token-id-2",
  "iat": 1711115430,
  "exp": 1711720230
}
```

### Header de autenticacion

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Estrategia de almacenamiento recomendada

| Token | Donde guardar | Razon |
|-------|--------------|-------|
| token_acceso | localStorage o memory | Se envia en cada request, acceso rapido |
| token_refresco | httpOnly cookie (ideal) o localStorage | Mas seguro en cookie, pero localStorage funciona |

### Flujo de renovacion automatica

```
1. Request falla con 401
2. ¿Tengo refresh token? → Si → POST /auth/renovar
3. ¿Renovacion exitosa? → Si → Actualizar access token → Reintentar request original
4. ¿Renovacion falla? → Logout completo → Redirect a /login
```

### Timeout de sesion

| Evento | Tiempo |
|--------|--------|
| Access token expira | 30 minutos |
| Refresh token expira | 7 dias |
| Sesion maxima sin renovar | 7 dias |
| Sesion maxima con renovacion continua | Infinita (mientras siga renovando) |

---

## Apendice A: Formulario Comun de Datos Natales

Todos los endpoints de calculo (natal, HD, retorno solar) y perfiles usan el mismo formulario de entrada:

```
┌──────────────────────────────────────────┐
│  Datos de Nacimiento                     │
│                                          │
│  Nombre:    [____________________]       │
│             1-100 caracteres             │
│                                          │
│  Fecha:     [__] / [__] / [____]         │
│             DD     MM     AAAA           │
│             → enviar como YYYY-MM-DD     │
│                                          │
│  Hora:      [__] : [__]                  │
│             HH     MM (24h)              │
│             → enviar como "HH:MM"        │
│                                          │
│  Ciudad:    [____________________]       │
│             1-100 caracteres             │
│             Autocompletado recomendado    │
│                                          │
│  Pais:      [____________________]       │
│             1-60 caracteres              │
│             Selector con lista           │
└──────────────────────────────────────────┘
```

**Tip de UX:** Usar autocompletado para ciudad/pais mejora la precision de geocodificacion. Nominatim funciona mejor con nombres en ingles o en el idioma local del pais.

---

## Apendice B: Feature Gating Frontend

El backend tiene la dependencia `requiere_plan("premium")` para proteger endpoints. El frontend debe anticipar estas restricciones:

**Features por plan:**

| Feature | Gratis | Premium |
|---------|--------|---------|
| Carta Natal basica | ✓ | ✓ |
| Numerologia basica | ✓ | ✓ |
| Diseno Humano completo | ✕ | ✓ |
| Retorno Solar | ✕ | ✓ |
| Transitos | ✕ | ✓ |
| Exportar PDF | ✕ | ✓ |
| Perfiles (max) | 3 | Ilimitado |
| Calculos/dia (max) | 5 | Ilimitado |

**Nota:** El feature gating en endpoints de calculo se activara en una fase posterior. Actualmente todos los endpoints son accesibles. El frontend debe preparar la UI para mostrar restricciones (candados, modales de upgrade) basandose en `plan_slug` del `/auth/me`.

**Respuesta de error 403 cuando se active:**
```json
{
  "exito": false,
  "error": "LimiteExcedido",
  "detalle": "Se requiere plan premium. Tu plan actual es gratis."
}
```

**UI sugerida:**
```
MODAL: Upgrade a Premium
┌──────────────────────────────────────────┐
│  ⭐ Funcion Premium                      │
│                                          │
│  Esta herramienta requiere el plan       │
│  Premium para ser utilizada.             │
│                                          │
│  Con Premium obtienes:                   │
│  ✓ Todas las cartas y calculos           │
│  ✓ Perfiles ilimitados                   │
│  ✓ Sin limite de calculos diarios        │
│                                          │
│  Solo $9 USD/mes                         │
│                                          │
│  [  Ver planes  ]  [  Ahora no  ]        │
└──────────────────────────────────────────┘
```

---

## Apendice C: Webhook (Backend Only)

El webhook de MercadoPago (`POST /api/v1/suscripcion/webhook`) es procesado exclusivamente por el backend. El frontend **no** interactua con este endpoint directamente.

**Lo que el frontend si debe hacer:**
1. Despues de redirect desde MercadoPago → llamar `GET /suscripcion/mi-suscripcion` para verificar estado
2. Si estado = "pendiente" → mostrar pantalla de espera + poll periodico
3. Si estado = "activa" → mostrar confirmacion
4. Si estado = "cancelada" → mostrar error

**Poll recomendado:**
```javascript
// Despues del redirect de MP, poll cada 5 segundos por 2 minutos
const poll = setInterval(async () => {
  const res = await fetch('/api/v1/suscripcion/mi-suscripcion');
  const data = await res.json();
  if (data.datos?.estado === 'activa') {
    clearInterval(poll);
    showSuccess();
  }
}, 5000);
setTimeout(() => clearInterval(poll), 120000);
```

---

## Apendice D: Paginas del Frontend

Basado en todos los casos de uso, estas son las paginas/rutas necesarias:

| Ruta Frontend | Pagina | Auth |
|--------------|--------|------|
| `/` | Landing / Home | No |
| `/login` | Iniciar sesion | No |
| `/registro` | Crear cuenta | No |
| `/dashboard` | Panel principal | Si |
| `/natal` | Calculadora carta natal | No |
| `/diseno-humano` | Calculadora HD | No |
| `/numerologia` | Calculadora numerologica | No |
| `/retorno-solar` | Calculadora retorno solar | No |
| `/transitos` | Transitos en tiempo real | No |
| `/perfil/:id` | Ver perfil guardado | No |
| `/mis-perfiles` | Lista de perfiles del usuario | Si |
| `/planes` | Planes y precios | No |
| `/suscripcion` | Mi suscripcion actual | Si |
| `/suscripcion/exito` | Redirect MP exitoso | Si |
| `/suscripcion/fallo` | Redirect MP fallido | Si |
| `/suscripcion/pendiente` | Redirect MP pendiente | Si |
| `/pagos` | Historial de pagos | Si |
| `/configuracion` | Configuracion de cuenta | Si |
