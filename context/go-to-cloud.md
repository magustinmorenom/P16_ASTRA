# Go to Cloud — CosmicEngine / ASTRA

## Playbook de Despliegue en la Nube

**Fecha:** 2026-03-23
**Estado:** Planificación — pendiente de implementación

---

## Índice

1. [Stack tecnológico actual](#1-stack-tecnológico-actual)
2. [Mapa de servicios e infraestructura](#2-mapa-de-servicios-e-infraestructura)
3. [Variables de entorno del sistema](#3-variables-de-entorno-del-sistema)
4. [Comparativa de proveedores cloud](#4-comparativa-de-proveedores-cloud)
5. [Recomendación final](#5-recomendación-final)
6. [Arquitectura MVP — servidor único](#6-arquitectura-mvp--servidor-único)
7. [Archivos necesarios para el despliegue](#7-archivos-necesarios-para-el-despliegue)
8. [Hardening de seguridad](#8-hardening-de-seguridad)
9. [Guía paso a paso — de cero a sitio activo](#9-guía-paso-a-paso--de-cero-a-sitio-activo)
10. [Camino a producción escalable](#10-camino-a-producción-escalable)

---

## 1. Stack Tecnológico Actual

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.11+ | Lenguaje principal |
| FastAPI | >=0.110 | Framework web (async) |
| uvicorn | >=0.27 | Servidor ASGI |
| pyswisseph | >=2.10 | Motor Swiss Ephemeris (cálculos astronómicos) |
| kerykeion | >=4.14 | Capa astrológica sobre pyswisseph |
| SQLAlchemy | >=2.0 (async) | ORM con asyncpg |
| asyncpg | >=0.29 | Driver PostgreSQL async |
| Alembic | >=1.13 | Migraciones de base de datos |
| Pydantic | >=2.6 | Validación de datos |
| Redis[hiredis] | >=5.0 | Cache y blacklist JWT |
| httpx | >=0.27 | Cliente HTTP async (MercadoPago, APIs) |
| PyJWT | >=2.8 | Tokens JWT (HS256) |
| bcrypt | >=4.0 | Hashing de contraseñas |
| authlib | >=1.3 | Google OAuth2 |
| anthropic | >=0.40 | Claude API (chatbot/oráculo) |
| google-genai | >=1.0 | Gemini TTS (podcasts) |
| pydub | >=0.25 | Conversión audio PCM→WAV→MP3 |
| minio | >=7.2 | Cliente S3 para almacenamiento |
| reportlab | >=4.1 | Generación de PDFs |
| python-telegram-bot | >=21.0 | Bot de Telegram |
| mercadopago | >=2.2 | SDK MercadoPago |
| geopy[aiohttp] | >=2.4 | Geocodificación Nominatim |
| timezonefinder | >=6.4 | Resolución de zonas horarias históricas |
| pytz | >=2024.1 | Manejo de timezones |

**Dependencia de sistema:** `ffmpeg` (requerido por pydub para MP3)

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.2.1 | Framework React (SSR/SSG) |
| React | 19.2.4 | Librería UI |
| TypeScript | ^5 | Tipado estático |
| TailwindCSS | ^4 | Framework CSS (v4, no v3) |
| @tanstack/react-query | ^5.94 | Estado servidor / data fetching |
| zustand | ^5.0 | Estado global cliente |
| @phosphor-icons/react | ^2.1 | Iconografía UI genérica |
| date-fns | ^4.1 | Formateo de fechas |
| clsx + tailwind-merge | ^2/^3 | Utilidades CSS |
| class-variance-authority | ^0.7 | Variantes de componentes |
| vitest | ^4.1 | Test runner (dev) |
| @testing-library/react | ^16.3 | Testing de componentes (dev) |

### Bases de Datos y Servicios

| Servicio | Imagen | Puerto Dev | Puerto Prod |
|----------|--------|------------|-------------|
| PostgreSQL | postgres:16-alpine | 5434 (no estándar) | 5432 |
| Redis | redis:7-alpine | 6380 (no estándar) | 6379 |
| MinIO | minio/minio:latest | 9002 API / 9003 Console | 9000 / 9001 |

> Los puertos no estándar en dev son para evitar colisiones con otros proyectos locales.

---

## 2. Mapa de Servicios e Infraestructura

### Servicios Backend (14 servicios)

| Servicio | Archivo | Función |
|----------|---------|---------|
| ServicioAstro | servicio_astro.py | Carta natal (planetas, casas Placidus, aspectos, dignidades) |
| ServicioDisenoHumano | servicio_diseno_humano.py | Body Graph (88° búsqueda binaria, tipo, autoridad, perfil) |
| ServicioNumerologia | servicio_numerologia.py | Pitagórico/Caldeo, maestros 11/22/33 |
| ServicioRetornoSolar | servicio_retorno_solar.py | Momento exacto retorno solar + carta comparativa |
| ServicioTransitos | servicio_transitos.py | Posiciones actuales + aspectos vs natal |
| ServicioAuth | servicio_auth.py | JWT, bcrypt, blacklist Redis |
| ServicioGoogleOAuth | servicio_google_oauth.py | Flujo OAuth2 completo |
| ServicioMercadoPago | servicio_mercadopago.py | Suscripciones, preapproval API, HMAC webhook |
| ServicioPDFPerfil | servicio_pdf_perfil.py | PDF multi-sección con reportlab |
| ServicioOraculo | servicio_oraculo.py | Chatbot Claude con contexto de perfil |
| ServicioPodcast | servicio_podcast.py | Pipeline: contexto cósmico → Claude guión → TTS → MinIO |
| ServicioTTS | servicio_tts.py | Gemini TTS (voz Zephyr), PCM→WAV→MP3 |
| ServicioAlmacenamiento | servicio_almacenamiento.py | MinIO wrapper, presigned URLs |
| BotTelegram | bot_telegram.py | Integración Telegram |

### Rutas API (bajo `/api/v1/`)

| Módulo | Endpoints principales |
|--------|----------------------|
| auth.py | /registrar, /login, /logout, /renovar, /cambiar-contrasena, /google/url, /google/callback, /me |
| natal.py | POST /natal |
| diseno_humano.py | POST /human-design |
| numerologia.py | POST /numerology |
| retorno_solar.py | POST /solar-return/{year} |
| transitos.py | GET /transits |
| perfil.py | GET/POST /profile/{id}, GET /profile/me/pdf |
| suscripcion.py | /planes, /mi-suscripcion, /suscribirse, /cancelar, /webhook, /pagos |
| oraculo.py | Chatbot Claude |
| podcast.py | Podcasts generados por IA |
| calendario_cosmico.py | Calendario cósmico |

### Páginas Frontend

| Ruta | Página |
|------|--------|
| /dashboard | Dashboard principal |
| /carta-natal | Carta natal interactiva |
| /diseno-humano | Body Graph HD |
| /numerologia | Carta numerológica |
| /retorno-solar | Revolución solar |
| /transitos | Tránsitos en tiempo real |
| /calendario-cosmico | Calendario cósmico |
| /podcast | Podcasts astrológicos IA |
| /perfil | Perfil del usuario |
| /suscripcion | Planes y pagos MercadoPago |

### Modelos de Base de Datos (13 tablas, 8 migraciones)

| Tabla | Descripción |
|-------|-------------|
| perfiles | Datos de nacimiento del usuario |
| usuarios | Auth: email, bcrypt hash, google_id |
| calculos | Cache: SHA256 hash → resultado JSONB |
| planes | Gratis / Premium |
| precios_plan | Precio por país (ARS, BRL, MXN) |
| config_pais_mp | Credenciales MercadoPago por país |
| suscripciones | Estado de suscripción del usuario |
| pagos | Registros de pagos |
| eventos_webhook | Log idempotente de webhooks |
| facturas | Facturas con numeración auto CE-YYYYMM-XXXX |
| conversaciones_oraculo | Historial de chat |
| vinculos_telegram | Links de usuarios Telegram |
| podcast_episodios | Episodios generados (día/semana/mes) |

### Estado Actual de Tests

- **Backend:** ~430 tests pasando (pytest + pytest-asyncio)
- **Frontend:** vitest 4.1 + testing-library + jsdom

---

## 3. Variables de Entorno del Sistema

### Core (obligatorias)

| Variable | Ejemplo prod | Descripción |
|----------|-------------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://cosmic:PASS@postgres:5432/cosmicengine` | Conexión async a PostgreSQL |
| `DATABASE_URL_SYNC` | `postgresql+psycopg2://cosmic:PASS@postgres:5432/cosmicengine` | Conexión sync (Alembic) |
| `REDIS_URL` | `redis://:PASS@redis:6379/0` | Conexión a Redis |
| `CLAVE_SECRETA` | (64 bytes hex aleatorio) | Secret para JWT HS256 |
| `AMBIENTE` | `produccion` | Modo de la app |
| `EPHE_PATH` | `/app/datos_efemerides` | Ruta archivos Swiss Ephemeris .se1 |

### Autenticación

| Variable | Ejemplo |
|----------|---------|
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` |
| `GOOGLE_REDIRECT_URI` | `https://tudominio.com/callback` |
| `ALGORITMO_JWT` | `HS256` |
| `EXPIRACION_TOKEN_ACCESO` | `30` (minutos) |
| `EXPIRACION_TOKEN_REFRESCO` | `10080` (7 días) |

### MercadoPago (multi-país)

| Variable | País |
|----------|------|
| `MP_ACCESS_TOKEN_AR` / `MP_PUBLIC_KEY_AR` | Argentina |
| `MP_ACCESS_TOKEN_BR` / `MP_PUBLIC_KEY_BR` | Brasil |
| `MP_ACCESS_TOKEN_MX` / `MP_PUBLIC_KEY_MX` | México |
| `MP_WEBHOOK_SECRET` | HMAC para validar webhooks |
| `MP_NOTIFICATION_URL` | `https://tudominio.com/api/v1/suscripcion/webhook` |
| `MP_URL_EXITO` | `https://tudominio.com/suscripcion/exito` |
| `MP_URL_FALLO` | `https://tudominio.com/suscripcion/fallo` |
| `MP_URL_PENDIENTE` | `https://tudominio.com/suscripcion/pendiente` |

### APIs Externas

| Variable | Servicio |
|----------|----------|
| `ANTHROPIC_API_KEY` | Claude API (chatbot/oráculo) |
| `ANTHROPIC_MODELO` | `claude-opus-4-6` |
| `GEMINI_API_KEY` | Google Gemini TTS |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API |

### MinIO / Almacenamiento

| Variable | Valor prod |
|----------|------------|
| `MINIO_ENDPOINT` | `minio:9000` (dentro de Docker) |
| `MINIO_ACCESS_KEY` | (credencial fuerte) |
| `MINIO_SECRET_KEY` | (credencial fuerte) |
| `MINIO_BUCKET` | `astra-podcasts` |
| `MINIO_SECURE` | `false` (dentro de red Docker) |

### Configuración general

| Variable | Default | Descripción |
|----------|---------|-------------|
| `LOG_LEVEL` | `WARNING` (prod) | Nivel de logging |
| `VERSION` | `1.0.0` | Versión de la app |
| `CACHE_TTL_TRANSITOS` | `600` | TTL Redis tránsitos (segundos) |
| `CACHE_TTL_DETERMINISTA` | `0` | TTL cálculos deterministas (0=forever) |
| `NOMINATIM_USER_AGENT` | `cosmic-engine/1.0` | User-agent geocoding |

**Total: ~40+ variables de entorno**

---

## 4. Comparativa de Proveedores Cloud

### Tabla General

| Categoría | AWS | Azure | GCP |
|-----------|-----|-------|-----|
| **VM mínima viable** | t3.small (2 vCPU, 2 GB) | B2s (2 vCPU, 4 GB) | e2-small (2 vCPU, 2 GB) |
| **Precio VM mínima** | ~$17/mes | ~$30/mes | ~$14/mes |
| **VM recomendada** | t3.medium (2 vCPU, 4 GB) | B2ms (2 vCPU, 8 GB) | e2-medium (2 vCPU, 4 GB) |
| **Precio VM recomendada** | ~$34/mes | ~$60/mes | ~$27/mes |
| **VM ideal (8GB RAM)** | t3.large (2 vCPU, 8 GB) | B2ms (2 vCPU, 8 GB) | e2-standard-2 (2 vCPU, 8 GB) |
| **Precio VM ideal** | ~$68/mes | ~$60/mes | ~$50/mes |

### Bases de Datos Managed (para fase post-MVP)

| Servicio | AWS | Azure | GCP |
|----------|-----|-------|-----|
| **PostgreSQL managed** | RDS t3.micro ~$15/mes | Flexible Server B1ms ~$12/mes | Cloud SQL db-f1-micro ~$9/mes |
| **Redis managed** | ElastiCache t3.micro ~$13/mes | Cache for Redis C0 ~$16/mes | Memorystore 1GB ~$35/mes |
| **Object Storage (por GB)** | S3 ~$0.023/GB | Blob Storage ~$0.018/GB | GCS ~$0.020/GB |

### Costos Estimados MVP (Todo en VM Única)

| Concepto | AWS | Azure | GCP |
|----------|-----|-------|-----|
| VM (8 GB RAM) | $68 | $60 | $50 |
| IP estática | $3.60 | Incluida | $1.46 |
| DNS | $0.50 | $0.50 | $0.20 |
| Transfer (50GB/mes) | $4.50 | $4.35 | $0.60 |
| **Total mensual** | **~$77/mes** | **~$65/mes** | **~$52/mes** |

### Costos con Servicios Managed (Post-MVP)

| Concepto | AWS | Azure | GCP |
|----------|-----|-------|-----|
| VM (más pequeña) | $34 | $30 | $27 |
| PostgreSQL managed | $15 | $12 | $9 |
| Redis managed | $13 | $16 | $35 |
| Object Storage | $1 | $1 | $1 |
| IP + DNS + Transfer | $8 | $5 | $2 |
| **Total mensual** | **~$71/mes** | **~$64/mes** | **~$74/mes** |

> Nota: En GCP el Redis managed (Memorystore) es caro. Se puede usar Redis en la VM o Upstash (~$0.20/100k comandos) como alternativa más económica.

### Free Tier

| Proveedor | Oferta |
|-----------|--------|
| **AWS** | 12 meses: t2.micro (1 GB RAM — insuficiente para todo el stack), 750h RDS, 5GB S3 |
| **Azure** | 12 meses: B1s (1 GB RAM — insuficiente), 250GB Storage, limitado |
| **GCP** | **$300 créditos por 90 días** (cubre 2-3 meses completos sin restricción de tier) |

---

## 5. Recomendación Final

### Para MVP/Staging: **Google Cloud Platform (GCP)**

**Configuración recomendada:**

| Recurso | Especificación | Costo |
|---------|---------------|-------|
| VM | e2-standard-2 (2 vCPU, 8 GB RAM, 50GB SSD) | ~$50/mes |
| IP estática | Reservada (global) | ~$1.46/mes |
| DNS | Cloud DNS (1 zona) | ~$0.20/mes |
| **Total** | | **~$52/mes** |

### Justificación

1. **Mejor precio por prestación:** La e2-standard-2 con 8GB RAM a $50/mes es la opción más económica con suficiente memoria para correr todo el stack Docker (PG + Redis + MinIO + backend + frontend simultáneamente).

2. **$300 de créditos iniciales:** Cubren los primeros 2-3 meses completos de operación. Esto da tiempo para validar el producto sin costo alguno.

3. **Afinidad con el stack:** El backend ya usa `google-genai` (Gemini TTS para podcasts). Al correr en la misma red de Google, la latencia de las llamadas TTS se reduce notablemente.

4. **Escalabilidad natural:** Cuando el proyecto crezca, Cloud SQL (PostgreSQL managed) es el más barato del trío ($9/mes vs $12-15). Cloud Run permite escalar el backend sin administrar VMs.

5. **Ecosistema integrado:** Si en el futuro se necesita CI/CD, Cloud Build tiene integración nativa. Y GCS (almacenamiento) usa protocolo compatible S3, por lo que el wrapper de MinIO existente funciona sin cambios.

### Cuándo elegir otro proveedor

- **Elegir AWS si:** ya tienes cuenta AWS con créditos, o necesitas servicios muy específicos (Lambda, SQS, Cognito). O si tu audiencia principal está en Brasil (AWS São Paulo tiene mejor latencia).
- **Elegir Azure si:** ya tienes suscripción Enterprise o créditos de Visual Studio/GitHub. Azure tiene la mejor integración con GitHub Actions para CI/CD.

### Alternativa ultra-económica

Si el presupuesto es muy limitado, un VPS en **Hetzner** (Alemania/USA) con 4 vCPU, 8 GB RAM, 80GB SSD cuesta **~$7/mes**. La desventaja es que no tiene servicios managed, pero para un MVP es viable. La latencia desde Argentina sería mayor (~150ms vs ~50ms con GCP us-central1).

---

## 6. Arquitectura MVP — Servidor Único

### Diagrama

```
                          INTERNET
                              │
                     ┌────────▼────────┐
                     │   DNS A Record  │
                     │  astra.dominio  │
                     │    → IP_VM      │
                     └────────┬────────┘
                              │
              ┌───────────────▼───────────────┐
              │   VM GCP e2-standard-2        │
              │   Ubuntu 24.04 LTS            │
              │   2 vCPU, 8 GB RAM, 50GB SSD  │
              │                               │
              │  ┌─────────────────────────┐  │
              │  │   Nginx (en el host)    │  │
              │  │   :80 → redirect HTTPS  │  │
              │  │   :443 → SSL terminado  │  │
              │  │   Let's Encrypt certs   │  │
              │  └────────────┬────────────┘  │
              │               │               │
              │        ┌──────┴──────┐        │
              │        │             │        │
              │     /api/*        /* (todo)   │
              │        │             │        │
              │   ┌────▼────┐  ┌────▼────┐   │
              │   │ Backend │  │Frontend │   │
              │   │ FastAPI │  │ Next.js │   │
              │   │  :8000  │  │  :3000  │   │
              │   │ 2 workers│  │standalone│   │
              │   └────┬────┘  └─────────┘   │
              │        │                      │
              │   ┌────▼──────────────────┐   │
              │   │  Red Docker interna   │   │
              │   │  (red_cosmica)        │   │
              │   │                       │   │
              │   │  ┌────────┐ ┌──────┐  │   │
              │   │  │Postgres│ │Redis │  │   │
              │   │  │  :5432 │ │:6379 │  │   │
              │   │  │ 16-alp │ │7-alp │  │   │
              │   │  └────────┘ └──────┘  │   │
              │   │                       │   │
              │   │  ┌─────────────────┐  │   │
              │   │  │   MinIO         │  │   │
              │   │  │  API :9000      │  │   │
              │   │  │  Console :9001  │  │   │
              │   │  └─────────────────┘  │   │
              │   └───────────────────────┘   │
              │                               │
              │   Volúmenes persistentes:     │
              │   pgdata / redisdata /        │
              │   miniodata / efemerides      │
              └───────────────────────────────┘

Puertos expuestos al exterior:
  22  (SSH)
  80  (HTTP → redirect a 443)
  443 (HTTPS)

Puertos INTERNOS (no accesibles desde internet):
  3000  (Next.js)
  8000  (FastAPI)
  5432  (PostgreSQL)
  6379  (Redis)
  9000  (MinIO API)
  9001  (MinIO Console)
```

### Principios

- **Un solo servidor** con todo en Docker Compose (simplicidad operacional)
- **Nginx en el host** (no en Docker) para manejar SSL con certbot nativo
- Los puertos de DB/Redis/MinIO **NO se exponen** al exterior — solo la red Docker interna
- Los únicos puertos del firewall son **22, 80, 443**
- Puertos estándar dentro de Docker (5432, 6379, 9000) — los puertos no estándar de dev (5434, 6380, 9002) eran para evitar colisiones locales

---

## 7. Archivos Necesarios para el Despliegue

### Archivos NUEVOS a crear (8)

| # | Archivo | Descripción |
|---|---------|-------------|
| 1 | `docker-compose.prod.yml` | Stack completo: PG + Redis + MinIO + backend + frontend, red interna, health checks, restart policies |
| 2 | `frontend/Dockerfile` | Multi-stage build: deps → build standalone → runtime node:22-alpine |
| 3 | `frontend/.dockerignore` | Excluir node_modules, .next, tests, .env |
| 4 | `backend/.dockerignore` | Excluir .env, .venv, tests, __pycache__ |
| 5 | `.env.ejemplo.prod` | Plantilla documentada con todas las variables marcadas [REQUERIDO] |
| 6 | `nginx/astra.conf` | Reverse proxy HTTPS, rate limiting, security headers, cache de estáticos |
| 7 | `scripts/desplegar.sh` | Script de despliegue: verifica env → descarga .se1 → pull → build → migraciones → up |
| 8 | `scripts/ssl-init.sh` | Certbot para cert inicial + cron de renovación automática |

### Archivos EXISTENTES a modificar (5)

| # | Archivo | Cambio necesario |
|---|---------|------------------|
| 1 | `backend/Dockerfile` | Multi-stage build, agregar ffmpeg, Swiss Ephemeris .se1, usuario no-root, HEALTHCHECK |
| 2 | `frontend/next.config.ts` | Agregar `output: 'standalone'`, hacer rewrite configurable con env var `BACKEND_URL` |
| 3 | `backend/app/principal.py` | CORS: de `allow_origins=["*"]` a dominio específico vía env `CORS_ORIGINS` |
| 4 | `backend/app/configuracion.py` | Agregar variables `CORS_ORIGINS` y `DOMINIO` |
| 5 | `backend/alembic/env.py` | Leer `DATABASE_URL_SYNC` desde env var para correr dentro del contenedor |

### Detalle de cada archivo

#### 7.1 — `backend/Dockerfile` (reescribir)

**Actual:** Falta ffmpeg, falta efemérides, corre como root, single-stage.

**Nuevo:**
- **Etapa 1 (builder):** `python:3.11-slim` + `build-essential` + `libpq-dev` → `pip install`
- **Etapa 2 (runtime):** `python:3.11-slim` + `ffmpeg` + `libpq5` + `curl`
- Copiar: `app/`, `alembic/`, `alembic.ini`, `assets/`, `datos_efemerides/`, `pyproject.toml`
- Usuario: `cosmic` (uid 1001), non-root
- HEALTHCHECK: `curl -f http://localhost:8000/health`
- CMD: `uvicorn app.principal:aplicacion --host 0.0.0.0 --port 8000 --workers 2 --log-level info`

#### 7.2 — `frontend/Dockerfile` (crear)

- **Etapa 1 (deps):** `node:22-alpine`, `npm ci --frozen-lockfile`
- **Etapa 2 (builder):** copiar código, build arg `NEXT_PUBLIC_API_URL`, `npm run build`
- **Etapa 3 (runtime):** copiar `.next/standalone` + `.next/static` + `public`
- Usuario: `nextjs` (uid 1001)
- HEALTHCHECK: `wget -qO- http://localhost:3000/`
- CMD: `node server.js`

**Requisito:** `next.config.ts` debe tener `output: 'standalone'`

#### 7.3 — `docker-compose.prod.yml` (crear en raíz)

5 servicios con red bridge `red_cosmica`:

```
postgres:16-alpine
  - healthcheck: pg_isready
  - NO expone puertos al host
  - volumen: pgdata

redis:7-alpine
  - requirepass desde env
  - maxmemory 256mb, allkeys-lru
  - healthcheck: redis-cli ping
  - volumen: redisdata

minio/minio:latest
  - healthcheck: curl /minio/health/live
  - volumen: miniodata

backend (build: ./backend)
  - depends_on: postgres, redis, minio (healthy)
  - todas las env vars desde .env.prod
  - URLs apuntan a servicios Docker internos (postgres:5432, redis:6379, minio:9000)
  - healthcheck: curl /health
  - ports: "127.0.0.1:8000:8000" (solo localhost, Nginx hace proxy)

frontend (build: ./frontend)
  - depends_on: backend (healthy)
  - env: BACKEND_URL=http://backend:8000
  - healthcheck: wget localhost:3000
  - ports: "127.0.0.1:3000:3000" (solo localhost)
```

#### 7.4 — `nginx/astra.conf`

```
Bloque HTTP (:80)
  → /.well-known/acme-challenge/ → /var/www/certbot (para Let's Encrypt)
  → todo lo demás → redirect 301 HTTPS

Bloque HTTPS (:443)
  → SSL con certs de /etc/letsencrypt/live/DOMINIO/
  → HTTP/2 habilitado
  → Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
  → Rate limiting:
    - /api/v1/auth/* → 10 req/min (prevenir brute force login)
    - /api/* → 30 req/min (API general)
    - /* → 60 req/min (frontend)
  → /api/* → proxy_pass http://127.0.0.1:8000
  → /health → proxy_pass http://127.0.0.1:8000 (sin rate limit)
  → /_next/static/* → proxy_pass frontend + Cache-Control: immutable 1 año
  → /img/* → proxy_pass frontend + Cache 24h
  → /* → proxy_pass http://127.0.0.1:3000 (con WebSocket upgrade)
  → client_max_body_size 10M
  → proxy_read_timeout 120s
```

#### 7.5 — `scripts/desplegar.sh`

Modos: `full` (default), `migraciones`, `estado`

```
full:
  1. Verifica .env.prod existe
  2. Verifica/descarga archivos Swiss Ephemeris .se1 desde astro.com
  3. git pull origin main
  4. docker compose -f docker-compose.prod.yml build --no-cache backend frontend
  5. docker compose up -d postgres redis minio
  6. Espera pg_isready (hasta 30s)
  7. docker compose run --rm backend alembic upgrade head
  8. docker compose up -d backend frontend
  9. Verifica /health del backend
  10. Verifica frontend responde

migraciones:
  Solo ejecuta alembic upgrade head en el contenedor

estado:
  docker compose ps
```

#### 7.6 — `scripts/ssl-init.sh`

```
Uso: sudo ./scripts/ssl-init.sh tudominio.com admin@tudominio.com

1. Instala certbot si no existe
2. certbot --nginx -d dominio -d www.dominio --non-interactive
3. Configura cron de renovación (3:00 AM diario)
4. Prueba renovación dry-run
```

#### 7.7 — Cambios en `frontend/next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // NUEVO — necesario para Dockerfile
  async rewrites() {
    return [{
      source: "/api/:path*",
      // MODIFICADO — configurable para Docker
      destination: process.env.BACKEND_URL
        ? `${process.env.BACKEND_URL}/api/:path*`
        : "http://localhost:8000/api/:path*",
    }];
  },
};
```

#### 7.8 — Cambios en `backend/app/principal.py` (CORS)

```python
# De: allow_origins=["*"]
# A: dinámico basado en ambiente
origenes = os.getenv("CORS_ORIGINS", "").split(",")
if not origenes or origenes == [""]:
    origenes = ["*"] if os.getenv("AMBIENTE") != "produccion" else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

#### 7.9 — Cambios en `backend/alembic/env.py`

```python
# Al inicio de run_migrations_online():
import os
url = os.getenv("DATABASE_URL_SYNC") or config.get_main_option("sqlalchemy.url")
```

---

## 8. Hardening de Seguridad

### Firewall (ufw en Ubuntu)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP (redirect + Let's Encrypt challenge)
ufw allow 443/tcp    # HTTPS
ufw enable
```

Los puertos de PostgreSQL (5432), Redis (6379) y MinIO (9000) **NO se abren** — Docker los mantiene en la red interna.

### SSH hardening

```
# /etc/ssh/sshd_config
PasswordAuthentication no       # Solo claves SSH
PermitRootLogin no              # No login como root
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers tuusuario            # Solo tu usuario
```

### Docker — usuarios non-root

- Backend corre como `cosmic` (uid 1001)
- Frontend corre como `nextjs` (uid 1001)
- Si un atacante explota la app, no tiene root en el contenedor

### Secretos

- `.env.prod` **NUNCA** en el repositorio git
- `.dockerignore` en backend y frontend excluye `.env*`
- `.gitignore` incluye: `.env.prod`, `.env.staging`, `*.env.local`, `datos_efemerides/*.se1`

### CORS en producción

Bloqueado al dominio específico vía variable `CORS_ORIGINS`:
```
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

### Redis con password

En producción Redis requiere autenticación:
```
redis-server --requirepass ${REDIS_PASSWORD}
```

La URL de conexión incluye la contraseña: `redis://:PASSWORD@redis:6379/0`

---

## 9. Guía Paso a Paso — De Cero a Sitio Activo

### Fase 1 — Crear VM en GCP

1. Ir a Google Cloud Console → Compute Engine → VM Instances
2. Crear instancia:
   - **Nombre:** astra-prod
   - **Región:** us-central1-a (o la más cercana a tu audiencia)
   - **Tipo:** e2-standard-2 (2 vCPU, 8 GB RAM)
   - **SO:** Ubuntu 24.04 LTS
   - **Disco:** 50 GB SSD Persistent
   - **Firewall:** Marcar "Allow HTTP traffic" y "Allow HTTPS traffic"
3. Reservar IP estática:
   - VPC Network → IP Addresses → Reserve Static Address
   - Asignarla a la VM creada

> **Alternativa AWS:** EC2 → Launch Instance → Ubuntu 24.04 → t3.large → 50GB gp3 → Security Group con 22/80/443
>
> **Alternativa Azure:** Virtual Machines → Create → Ubuntu 24.04 → B2ms → 50GB Standard SSD → NSG con 22/80/443

### Fase 2 — Configurar DNS

1. En tu registrador de dominio (GoDaddy, Namecheap, Cloudflare, etc.):
   - **A record:** `@` → IP_ESTATICA_VM (TTL: 300)
   - **A record:** `www` → misma IP (TTL: 300)
2. Verificar propagación: `nslookup tudominio.com` (~5-15 min con TTL bajo)

### Fase 3 — Configurar la VM

```bash
# Conectarse
ssh -i tu_clave.pem ubuntu@IP_VM

# Actualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# CERRAR SESIÓN Y RECONECTAR para que el grupo docker tenga efecto

# Instalar Docker Compose (viene incluido en Docker Engine moderno)
docker compose version  # verificar

# Instalar Nginx + certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx curl git

# Configurar firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Fase 4 — Clonar repositorio

```bash
sudo mkdir -p /opt/astra
sudo chown $USER:$USER /opt/astra
git clone https://github.com/TU_USUARIO/TU_REPO.git /opt/astra
cd /opt/astra
chmod +x scripts/*.sh
```

### Fase 5 — Crear .env.prod

```bash
cp .env.ejemplo.prod .env.prod
nano .env.prod

# Generar CLAVE_SECRETA:
python3 -c "import secrets; print(secrets.token_hex(64))"
# Copiar el resultado como valor de CLAVE_SECRETA

# Completar TODAS las variables marcadas [REQUERIDO]
```

### Fase 6 — Nginx preliminar (HTTP, para challenge Let's Encrypt)

```bash
# Config temporal solo HTTP
sudo tee /etc/nginx/sites-available/astra << 'EOF'
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/astra /etc/nginx/sites-enabled/astra
sudo rm -f /etc/nginx/sites-enabled/default
sudo mkdir -p /var/www/certbot
sudo nginx -t && sudo systemctl restart nginx
```

### Fase 7 — Obtener certificado SSL

```bash
sudo /opt/astra/scripts/ssl-init.sh tudominio.com admin@tudominio.com

# Verificar que existan los certificados
sudo ls /etc/letsencrypt/live/tudominio.com/
```

### Fase 8 — Nginx definitivo con SSL

```bash
# Copiar la config completa
sudo cp /opt/astra/nginx/astra.conf /etc/nginx/sites-available/astra

# Reemplazar el placeholder con tu dominio real
sudo sed -i 's/TU_DOMINIO/tudominio.com/g' /etc/nginx/sites-available/astra

# Verificar y recargar
sudo nginx -t && sudo systemctl reload nginx
```

### Fase 9 — Primer despliegue

```bash
cd /opt/astra
./scripts/desplegar.sh full
```

Esto ejecuta automáticamente:
1. Verifica `.env.prod`
2. Descarga archivos Swiss Ephemeris .se1 si no existen
3. `git pull origin main`
4. Construye imágenes Docker (backend con ffmpeg, frontend standalone)
5. Levanta postgres, redis, minio → espera health checks
6. Ejecuta `alembic upgrade head` dentro del contenedor
7. Levanta backend y frontend
8. Verifica health checks

### Fase 10 — Verificación final

```bash
# Health check del backend
curl https://tudominio.com/health
# Esperado: {"estado":"saludable","version":"1.0.0",...}

# Frontend carga
curl -I https://tudominio.com/
# Esperado: HTTP/2 200

# API funciona
curl https://tudominio.com/api/v1/transits
# Esperado: JSON con tránsitos planetarios

# SSL correcto
# Visitar: https://www.ssllabs.com/ssltest/analyze.html?d=tudominio.com

# Estado de contenedores
./scripts/desplegar.sh estado
# Esperado: todos los servicios "healthy"

# Verificar que puertos internos NO son accesibles
# Desde otra máquina:
nc -zv IP_VM 5432  # Debe fallar (timeout)
nc -zv IP_VM 6379  # Debe fallar (timeout)
nc -zv IP_VM 9000  # Debe fallar (timeout)
```

### Actualizaciones futuras

```bash
cd /opt/astra
./scripts/desplegar.sh full
```

Un solo comando: pull → build → migrate → restart.

---

## 10. Camino a Producción Escalable

### Evolución incremental

| Fase | Trigger | Acción | Costo adicional |
|------|---------|--------|-----------------|
| **MVP actual** | Lanzamiento | Todo en VM única con Docker Compose | ~$52/mes |
| **DB managed** | +100 usuarios | Migrar PostgreSQL a Cloud SQL (GCP) / RDS (AWS) | +$9-15/mes |
| **Cache externo** | +100 usuarios | Migrar Redis a Upstash (serverless) o managed | +$0-13/mes |
| **Storage nativo** | Podcasts >10GB | Migrar MinIO → GCS/S3 (protocolo S3 compatible) | ~$0.02/GB |
| **CI/CD** | Deploys frecuentes | GitHub Actions: test → build → deploy vía SSH | Gratis (GH) |
| **Monitoreo** | Sitio en producción | Uptime Kuma (self-hosted) + Sentry (errores) | Gratis/~$26/mes |
| **Backups** | Desde día 1 | Cron pg_dump diario, rotación 7 días | ~$1/mes (storage) |
| **CDN** | Tráfico global | Cloudflare Free (cache estáticos + DDoS) | Gratis |
| **Escala horizontal** | Miles de usuarios | Separar backend en múltiples réplicas, load balancer | Variable |
| **Kubernetes** | Escala enterprise | Migrar a GKE / EKS | ~$70+ cluster |

### Migración de PostgreSQL a Cloud SQL

```bash
# 1. Crear instancia Cloud SQL PostgreSQL
# 2. Dump de la BD actual
docker compose exec -T postgres pg_dump -U cosmic cosmicengine > backup.sql
# 3. Restaurar en Cloud SQL
psql $NUEVA_DATABASE_URL < backup.sql
# 4. Actualizar DATABASE_URL en .env.prod
# 5. Remover servicio postgres del docker-compose.prod.yml
# 6. Redesplegar
```

### Migración de MinIO a Cloud Storage

El `ServicioAlmacenamiento` usa protocolo S3. Para migrar:
- **A GCS:** Usar modo de interoperabilidad S3, cambiar endpoint a `storage.googleapis.com`
- **A S3:** Cambiar `MINIO_ENDPOINT` a `s3.amazonaws.com`, ajustar región
- Las presigned URLs funcionan igual en todos los casos

### CI/CD con GitHub Actions (esquema)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: pytest tests/
      - run: npm run test

  deploy:
    needs: test
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_HOST }}
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/astra
            ./scripts/desplegar.sh full
```

### Backups automáticos

```bash
# Cron diario a las 2:00 AM (agregar en la VM)
0 2 * * * /opt/astra/scripts/backup-db.sh

# El script hace:
# 1. pg_dump → gzip → /opt/backups/cosmicengine_FECHA.sql.gz
# 2. Rotación: eliminar backups de más de 7 días
# 3. (Opcional) subir a GCS/S3 bucket de backups
```

---

## Notas Importantes Específicas de Este Proyecto

### Archivos Swiss Ephemeris (.se1)

Los archivos de efemérides son necesarios para todos los cálculos astronómicos. Pesan ~30-100MB según el rango temporal. No deberían estar en git. El script `desplegar.sh` los descarga automáticamente desde `astro.com` si no existen.

### alembic.ini hardcodeado

El `alembic.ini` actual tiene la URL de desarrollo hardcodeada con `localhost:5434`. En el contenedor Docker, alembic debe leer la URL desde la variable `DATABASE_URL_SYNC`. El cambio en `alembic/env.py` resuelve esto.

### Google OAuth redirect_uri

En la consola de Google Cloud → Credentials → OAuth 2.0, hay que agregar `https://tudominio.com/callback` como URI de redirección autorizado. Sin esto, el login con Google falla en producción.

### MercadoPago webhook URL

En el dashboard de MercadoPago, actualizar la URL de notificación IPN a `https://tudominio.com/api/v1/suscripcion/webhook`. El `.env.prod` define `MP_NOTIFICATION_URL` con el valor correcto.

### Next.js rewrites en Docker

En desarrollo, el rewrite de Next.js apunta a `localhost:8000`. En Docker, el backend se llama `backend` en la red interna. La variable `BACKEND_URL=http://backend:8000` en el contenedor frontend resuelve esto.

---

*Documento generado: 2026-03-23*
*Próxima revisión: al implementar los archivos listados en la sección 7*
