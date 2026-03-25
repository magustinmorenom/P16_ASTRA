# Resumen de Cambios — CosmicEngine / P16_ASTRA

> Este archivo es un changelog de sesiones de desarrollo. Se actualiza al final de cada sesión con fecha, hora, y descripción de lo implementado.

---

## Sesion: Backend Core + Infraestructura
**Fecha:** 2026-03-21 ~17:00 — 20:00 (ARG)
**Commits:** `25fc47a` → `5ba0f47`

### Que se hizo
Primera version completa del backend: modelos, servicios de calculo astronomico, endpoints REST, y cache Redis.

### Detalle
- **Backend completo**: FastAPI + pyswisseph + SQLAlchemy async + PostgreSQL + Redis
- **5 servicios de calculo**: ServicioAstro (carta natal), ServicioDisenoHumano (body graph), ServicioNumerologia (pitagorico/caldeo), ServicioRetornoSolar, ServicioTransitos
- **Servicios auxiliares**: ServicioGeo (Nominatim), ServicioZonaHoraria (pytz historico), ServicioEfemerides (pyswisseph)
- **Infraestructura Docker**: PostgreSQL puerto 5434, Redis puerto 6380 (puertos no-default para evitar colision con P15)
- **Cache Redis** integrado en las 5 rutas de calculo (datos deterministicos)
- **Tests**: ~97 archivos, todos pasando

---

## Sesion: Multi-usuario (Auth JWT + OAuth Google)
**Fecha:** 2026-03-21 ~21:00 — 22:50 (ARG)
**Commits:** `f2b3d5c` → `58e9bca`

### Que se hizo
Sistema completo de autenticacion: registro, login, JWT stateless, OAuth2 Google, blacklist Redis.

### Detalle
- **Modelo Usuario**: email, hash_contrasena, nombre, activo, verificado, proveedor_auth, google_id
- **JWT**: access token 30min, refresh token 7d, HS256, blacklist Redis con TTL
- **Hashing**: bcrypt directo (passlib incompatible con bcrypt>=5.0)
- **OAuth Google**: authlib, flujo completo con callback
- **Endpoints**: `/auth/registrar`, `/login`, `/logout`, `/renovar`, `/cambiar-contrasena`, `/google/url`, `/google/callback`, `/me`
- **Dependencias**: `obtener_usuario_actual` (obligatorio), `obtener_usuario_opcional` (retrocompat anonimos)
- **FK**: perfiles.usuario_id nullable → usuarios.id (ON DELETE SET NULL)
- **Migraciones**: 003 (tabla usuarios), 004 (FK usuario_id en perfiles)
- **48 tests** nuevos para auth

---

## Sesion: Suscripciones + MercadoPago + Facturacion
**Fecha:** 2026-03-22 ~00:00 — 2026-03-23 ~03:30 (ARG)
**Commits:** `dea3810` → `cded324`

### Que se hizo
Sistema completo de suscripciones con MercadoPago: planes Gratis/Premium, checkout, webhooks, facturacion automatica, multi-pais (AR/BR/MX).

### Backend — Archivos creados (4)
| Archivo | Proposito |
|---------|-----------|
| `app/modelos/factura.py` | Modelo Factura: usuario_id, pago_id, suscripcion_id, numero_factura auto (CE-YYYYMM-XXXX), estado, monto, moneda, concepto |
| `alembic/versions/006_crear_tabla_facturas.py` | Migracion tabla facturas con indices |
| `app/datos/repositorio_factura.py` | CRUD: crear (numero auto-secuencial), listar_por_usuario, obtener_por_pago_id |
| `scripts/configurar_mp.py` | Script interactivo para configurar credenciales test de MP en BD y .env |

### Backend — Archivos modificados (5)
| Archivo | Cambios |
|---------|---------|
| `app/rutas/v1/suscripcion.py` | 4 endpoints nuevos: GET /paises, GET /planes (con precios_por_pais), GET /verificar-estado (polling post-checkout), GET /facturas. Fix webhook: itera paises activos. Auto-factura al aprobar pago. |
| `app/datos/repositorio_suscripcion.py` | Nuevo `listar_paises_activos()` |
| `app/modelos/__init__.py` | Registrado modelo Factura |
| `app/esquemas/suscripcion.py` | Nuevo `RespuestaFactura` |
| `app/servicios/servicio_mercadopago.py` | httpx async, preapproval API, verificacion HMAC webhook, multi-pais |

### Frontend — Archivos modificados (6)
| Archivo | Cambios |
|---------|---------|
| `lib/tipos/suscripcion.ts` | Tipos: PaisDisponible, Factura, EstadoVerificacion, PrecioPais, precios_por_pais en Plan |
| `lib/tipos/index.ts` | Re-exports nuevos |
| `lib/hooks/usar-suscripcion.ts` | 3 hooks nuevos: usarPaises(), usarVerificarEstado(habilitado), usarFacturas() |
| `lib/hooks/index.ts` | Re-exports hooks |
| `app/(app)/suscripcion/page.tsx` | Selector de pais, precios dinamicos por pais, seccion de facturas |
| `app/(app)/suscripcion/exito/page.tsx` | 3 estados visuales (verificando/confirmado/timeout) con polling cada 3s |

### Frontend — Paginas conectadas al backend (5)
| Archivo | Cambios |
|---------|---------|
| `app/(app)/carta-natal/page.tsx` | Conectado a API real |
| `app/(app)/diseno-humano/page.tsx` | Conectado a API real |
| `app/(app)/numerologia/page.tsx` | Conectado a API real |
| `app/(app)/retorno-solar/page.tsx` | Conectado a API real |
| `app/(app)/transitos/page.tsx` | Conectado a API real |

### Tests
- `tests/test_flujo_suscripcion.py` — 8 tests: listar_paises, planes_con_precios, suscribirse, webhook_con_factura, verificar_estado_premium, verificar_estado_sin_suscripcion, listar_facturas, cancelar_degrada_a_gratis
- `tests/rutas/test_rutas_suscripcion.py` — Corregido para incluir mock de RepositorioFactura
- **335 tests passed**, 1 skipped (0 failures)

### Como funciona el flujo
1. Usuario se registra → se crea plan Gratis automaticamente
2. Va a `/suscripcion` → selecciona pais → ve precio en moneda local
3. Click "Actualizar a Premium" → redirige a checkout MercadoPago
4. Paga → MP envia webhook → backend valida HMAC, sincroniza estado, crea factura
5. Frontend en `/suscripcion/exito` hace polling cada 3s hasta confirmar
6. `requiere_plan("premium")` como dependency factory protege endpoints premium

### Datos de test MercadoPago (Argentina)
- **Vendedor**: User ID 3285675537, TESTUSER5136416883931640791
- **Comprador**: User ID 3285675535, TESTUSER3739889284689218308
- **Tarjeta test**: 5031 7557 3453 0604 | CVV: 123 | Titular: APRO

---

## Sesion: Chatbot Antropic + Telegram
**Fecha:** 2026-03-23 ~03:30 (ARG)
**Commit:** `7aa0c40`

### Que se hizo
Integracion de chatbot conectado a API de Anthropic y bot de Telegram. (Detalles pendientes de documentar en proxima sesion.)

---

## Sesion: Podcasts Astrologicos — Implementacion inicial
**Fecha:** 2026-03-23 ~04:00 — ~08:00 (ARG)

### Que se hizo
Sistema completo de podcasts astrologicos generados por IA: pipeline Claude → Gemini TTS → MinIO storage, con reproductor integrado y panel de lyrics sincronizado.

### Backend — Archivos creados (8)
| Archivo | Proposito |
|---------|-----------|
| `app/modelos/podcast.py` | Modelo PodcastEpisodio con unique constraint (usuario, fecha, momento) |
| `alembic/versions/008_podcast_episodios.py` | Migracion tabla podcast_episodios |
| `app/datos/repositorio_podcast.py` | CRUD: crear, obtener, actualizar, historial |
| `app/servicios/servicio_almacenamiento.py` | MinIO wrapper (bucket init, upload, presigned URLs) |
| `app/servicios/servicio_tts.py` | Gemini TTS (PCM→WAV→MP3, voz Zephyr) |
| `app/servicios/servicio_podcast.py` | Pipeline orquestador (contexto→Claude→TTS→MinIO→segmentos) |
| `app/oraculo/prompt_podcast.md` | System prompt para generacion de podcast |
| `app/rutas/v1/podcast.py` | 6 endpoints: /hoy, /fecha/{}, /episodio/{}, /audio/{}, /historial, /generar |

### Backend — Archivos modificados (4)
| Archivo | Cambios |
|---------|---------|
| `docker-compose.yml` | Servicio MinIO (puertos 9002/9003) |
| `app/configuracion.py` | Variables de config MinIO |
| `pyproject.toml` | Deps: minio, google-genai, pydub |
| `app/principal.py` | Router podcast, MinIO init, cron task (6/12/20h ARG) |

### Frontend — Archivos creados (4)
| Archivo | Proposito |
|---------|-----------|
| `lib/tipos/podcast.ts` | Tipos TypeScript (PodcastEpisodio, SegmentoLetra) |
| `lib/hooks/usar-podcast.ts` | React Query hooks (hoy, episodio, historial, generar) |
| `componentes/layouts/panel-lyrics.tsx` | Panel de lyrics con highlighting sincronizado |
| `app/(app)/podcast/page.tsx` | Pagina de podcast con cards por dia + historial |

### Frontend — Archivos modificados (6)
| Archivo | Cambios |
|---------|---------|
| `lib/tipos/index.ts` | Re-export tipos podcast |
| `lib/hooks/index.ts` | Re-export hooks podcast |
| `lib/stores/store-ui.ts` | url, segmentos en PistaReproduccion + segmentoActual |
| `componentes/ui/icono.tsx` | Icono microfono (Microphone) |
| `componentes/layouts/reproductor-cosmico.tsx` | Audio real con timeUpdate/seek/volume |
| `componentes/layouts/layout-app.tsx` | PanelLyrics en layout |

### Tests creados (3)
- `test_servicio_podcast.py` — 11 tests (segmentos, prompts, momentos)
- `test_servicio_tts.py` — 2 tests (PCM→WAV, API key validation)
- `test_servicio_almacenamiento.py` — 5 tests (upload, presigned, bucket init)
- **430 tests pasando**, build frontend limpio

### Como funciona
1. Cron genera 3 episodios/dia (manana 6h, mediodia 12h, noche 20h ARG)
2. Pipeline: contexto astrologico del usuario → prompt a Claude → guion → Gemini TTS → MP3 → MinIO
3. Frontend: cards por episodio, play en reproductor cosmico, lyrics sincronizadas

---

## Sesion: Podcasts On-Demand (Dia / Semana / Mes)
**Fecha:** 2026-03-23 ~09:00 — ~11:00 (ARG)

### Que se hizo
Migracion de podcasts de modelo **cron automatico** (3 momentos/dia) a modelo **on-demand** con 3 tipos: **dia**, **semana** y **mes**. El usuario genera cada podcast al hacer click. Si ya existe para esa fecha/semana/mes, se reproduce sin regenerar.

### Backend — Archivos modificados (5)
| Archivo | Cambios |
|---------|---------|
| `app/servicios/servicio_podcast.py` | `MOMENTOS` → `TIPOS_PODCAST` (dia/semana/mes). Nueva `_calcular_fecha_clave()` normaliza fecha por tipo. Nuevos `_construir_titulo()` y `_construir_mensaje_usuario()`. Max tokens por tipo (dia=1024, semana=1536, mes=2048). Eliminados `ejecutar_cron()` y `generar_episodios_dia()`. |
| `app/rutas/v1/podcast.py` | `POST /generar?tipo=dia\|semana\|mes`. `GET /hoy` busca por fecha clave de cada tipo (hasta 3). Eliminado `GET /fecha/{fecha}`. Campo `momento` → `tipo` en JSON. |
| `app/principal.py` | Eliminada funcion `_cron_podcasts()` completa. Eliminados `create_task()` y `cancel()` del lifespan. Limpiados imports. |
| `app/oraculo/prompt_podcast.md` | Adaptado a tipo generico. Duraciones: dia ~400 palabras, semana ~600, mes ~800. |
| `app/datos/repositorio_podcast.py` | `obtener_episodios_dia()` → `obtener_episodios_usuario()`. |

**Sin migracion de BD** — el campo `momento` (String(20)) ahora almacena `"dia"|"semana"|"mes"` en vez de `"manana"|"mediodia"|"noche"`. La unique constraint sigue funcionando.

### Frontend — Archivos modificados (4)
| Archivo | Cambios |
|---------|---------|
| `lib/tipos/podcast.ts` | `momento` → `tipo: TipoPodcast`. Nuevo type `TipoPodcast = "dia" \| "semana" \| "mes"`. |
| `lib/hooks/usar-podcast.ts` | `usarGenerarPodcast(tipo)`. `usarPodcastHoy(refetchRapido)` con polling 5s durante generacion. |
| `app/(app)/podcast/page.tsx` | Cards on-demand: boton "Generar" / spinner / play / "Reintentar". Polling automatico. |
| `app/(app)/dashboard/page.tsx` | Eliminado array estatico demo. Conectado a datos reales via hooks. |

### Tests modificados (1)
- `tests/servicios/test_servicio_podcast.py` — 18 tests: TestGenerarSegmentos (4), TestConstruirPrompt (5), TestTiposPodcast (2), **nuevo** TestCalcularFechaClave (4), **nuevo** TestConstruirTitulo (3)
- **437 tests pasando**, build frontend limpio

### Como funciona ahora
1. Usuario va a `/podcast` → ve 3 cards (Dia, Semana, Mes)
2. Click "Generar" → backend genera guion → TTS → almacena → retorna
3. Frontend hace polling cada 5s mostrando estados progresivos (generando_guion → generando_audio → listo)
4. Si ya existe el episodio para esa fecha/semana/mes, se reproduce directo sin regenerar
5. `_calcular_fecha_clave()`: dia=misma fecha, semana=lunes de esa semana, mes=dia 1

---

## Sesion: Infraestructura GCP + Archivos de Despliegue
**Fecha:** 2026-03-23 ~14:00 (ARG)

### Que se hizo
Configuracion completa de infraestructura GCP (VM, IP estatica, firewall) y creacion de todos los archivos necesarios para deploy en produccion con Docker Compose, Nginx reverse proxy, SSL via Certbot, y scripts de despliegue automatizado.

### Infraestructura GCP creada
| Recurso | Detalle |
|---------|---------|
| Proyecto | `gen-lang-client-0712332397` (Astra-Oracle) |
| VM | `astra-prod` — e2-standard-2 (2 vCPU, 8GB RAM), Ubuntu 24.04 LTS, SSD 50GB |
| Zona | `southamerica-east1-a` (Sao Paulo) |
| IP estatica | `34.39.245.98` (reservada como `astra-ip`) |
| Firewall | `allow-http` (tcp:80), `allow-https` (tcp:443) |
| Docker | v29.3.0 + Compose v5.1.1 instalados en VM |
| Dominio | `theastra.xyz` (pendiente configurar DNS A record → 34.39.245.98) |

### Archivos creados (9)
| Archivo | Proposito |
|---------|-----------|
| `docker-compose.prod.yml` | Stack produccion: postgres, redis, minio, backend, frontend, nginx, certbot (7 servicios) |
| `frontend/Dockerfile` | Multi-stage build Next.js standalone (deps → build → runner, usuario non-root) |
| `frontend/.dockerignore` | Excluir node_modules, .next, tests |
| `backend/.dockerignore` | Excluir .env, .venv, __pycache__, tests |
| `.env.ejemplo.prod` | Plantilla documentada de todas las variables de entorno para produccion |
| `nginx/astra.conf` | Reverse proxy HTTPS con rate limiting (10r/s API, 5r/s auth), SSL hardening, gzip, cache estaticos |
| `scripts/desplegar.sh` | Script de despliegue: full/build/deploy/migrate/logs/status |
| `scripts/ssl-init.sh` | Inicializacion Certbot: genera cert SSL con challenge HTTP, renovacion automatica |
| `.gitignore` | Root gitignore: .env.prod, certbot/, .DS_Store |

### Archivos modificados (5)
| Archivo | Cambios |
|---------|---------|
| `backend/Dockerfile` | Multi-stage build, ffmpeg (podcasts TTS), curl (healthcheck), efemerides de kerykeion, usuario non-root, healthcheck |
| `frontend/next.config.ts` | `output: "standalone"` en produccion, BACKEND_URL configurable (default localhost:8000), rewrite /health |
| `backend/app/configuracion.py` | Nuevas variables: `dominio`, `cors_origins` |
| `backend/app/principal.py` | CORS dinamico: si `cors_origins` definido usa esa lista, sino wildcard (dev) |
| `backend/alembic/env.py` | Lee `DATABASE_URL_SYNC` desde env var (para migraciones en Docker sin alembic.ini hardcoded) |

### Tests
- Sin tests nuevos (cambios de infraestructura/config)
- Tests existentes no afectados (CORS default sigue siendo wildcard, config nuevos campos opcionales)

### Como funciona
1. **Desarrollo local**: sin cambios, `docker-compose.yml` para infra + uvicorn/next dev directo
2. **Deploy produccion**:
   - Copiar `.env.ejemplo.prod` → `.env.prod`, completar credenciales
   - Clonar repo en VM (`/opt/astra/`)
   - `./scripts/ssl-init.sh theastra.xyz email@ejemplo.com` → obtiene cert SSL
   - `./scripts/desplegar.sh full` → build imagenes + migraciones + levantar stack
3. **Nginx**: HTTP→HTTPS redirect, rate limiting diferenciado (auth mas estricto), cache de assets, security headers (HSTS, X-Frame-Options)
4. **Certbot**: renovacion automatica cada 12h via container dedicado
5. **Puertos expuestos**: solo 80 y 443. PostgreSQL, Redis, MinIO solo accesibles dentro de la red Docker interna


---

## Sesion: Editar Datos de Nacimiento en Perfil + Recalcular Cartas
**Fecha:** 2026-03-23 ~16:00 (ARG)

### Que se hizo
Se implemento la funcionalidad para que los usuarios puedan ver y editar sus datos de nacimiento desde la pagina de perfil. Al modificar datos que afectan calculos (fecha, hora, ciudad, pais), se eliminan los calculos viejos y se recalculan automaticamente las 4 cartas (natal, diseno humano, numerologia, retorno solar).

### Backend — Archivos modificados
| Archivo | Descripcion |
|---------|-------------|
| `backend/app/esquemas/entrada.py` | Nuevo schema `DatosActualizarPerfil` con campos opcionales |
| `backend/app/datos/repositorio_perfil.py` | Nuevo metodo `actualizar()` para update parcial de perfil |
| `backend/app/datos/repositorio_calculo.py` | Nuevo metodo `eliminar_todos_por_perfil()` — elimina calculos y retorna hashes para invalidar cache |
| `backend/app/cache/gestor_cache.py` | Nuevo metodo `invalidar_multiples()` para borrar varias claves Redis |
| `backend/app/rutas/v1/perfil.py` | Nuevo endpoint `PUT /profile/me` — actualiza perfil, re-geocodifica si cambia ciudad/pais, elimina calculos viejos |

### Frontend — Archivos modificados
| Archivo | Descripcion |
|---------|-------------|
| `frontend/src/lib/hooks/usar-perfil.ts` | Nuevo hook `usarActualizarPerfil()` con mutation PUT + invalidacion de query |
| `frontend/src/lib/hooks/index.ts` | Export del nuevo hook |
| `frontend/src/app/(app)/perfil/page.tsx` | Nueva seccion "Datos de Nacimiento" con modo vista/edicion + recalculo automatico |

### Tests
- 464 tests pasando, 1 skipped (sin cambios en tests)

### Como funciona
1. En `/perfil`, entre la info de usuario y suscripcion, se muestra una tarjeta "Datos de Nacimiento" con nombre, fecha, hora, ciudad, pais y zona horaria en modo lectura
2. Al hacer click en "Editar", los campos se convierten en inputs pre-populados con los valores actuales
3. Al guardar, se envia `PUT /profile/me` al backend que:
   - Compara los datos nuevos vs los actuales para detectar si cambiaron datos de nacimiento
   - Si cambio ciudad/pais → re-geocodifica con Nominatim y resuelve timezone
   - Actualiza el perfil en DB
   - Si cambiaron datos de nacimiento → elimina todos los calculos viejos de DB + invalida claves Redis
   - Retorna el perfil actualizado + flag `datos_nacimiento_cambiaron`
4. Si el flag es true, el frontend dispara los 4 calculos en paralelo (carta natal, diseno humano, numerologia, retorno solar) usando los mismos hooks del onboarding, e invalida la query de calculos
5. Si solo cambio el nombre, no se recalcula nada

---

## Sesion: CI/CD con GitHub Actions
**Fecha:** 2026-03-23 ~18:00 (ARG)

### Que se hizo
Se implementaron pipelines de CI (integración continua) y CD (deploy continuo) con GitHub Actions para automatizar tests, lint y deploy a producción.

### Archivos creados
| Archivo | Descripcion |
|---------|-------------|
| `.github/workflows/ci.yml` | Pipeline CI: 2 jobs paralelos (backend + frontend). Backend: ruff lint + pytest. Frontend: eslint + vitest + next build. Se ejecuta en push a `dev` y PRs a `main`. |
| `.github/workflows/cd.yml` | Pipeline CD: deploy automático a VM GCP via SSH cuando se mergea a `main`. Incluye health check con reintentos (hasta 5 min). |

### Tests
Sin cambios a tests existentes. El pipeline CI ejecuta los 430+ tests de backend y los tests de frontend automáticamente.

### Como funciona
1. **CI (push a `dev` o PR a `main`)**: Se ejecutan 2 jobs en paralelo — backend (Python 3.11, ruff check, pytest) y frontend (Node 22, eslint, vitest, next build). Los tests de backend usan env vars dummy porque están 100% mockeados (no necesitan PostgreSQL/Redis reales). Tiene `cancel-in-progress: true` para ahorrar minutos en pushes rápidos.
2. **CD (push a `main`)**: Tras merge, se conecta por SSH a la VM de GCP (`astra-prod`), hace `git pull` y ejecuta `./scripts/desplegar.sh full`. Luego hace health check contra `https://theastra.xyz/health` con hasta 30 reintentos (5 min). Tiene `cancel-in-progress: false` para nunca interrumpir un deploy en curso.
3. **Secrets necesarios**: `GCP_SSH_PRIVATE_KEY`, `VM_HOST`, `VM_USER` — se configuran en GitHub repo settings.
4. **Recomendación**: configurar branch protection en `main` para requerir que CI pase antes de permitir merge.

---

## Sesion: Interfaz Mobile App-Like (branch mobile)
**Fecha:** 2026-03-24 ~02:00 (ARG)

### Que se hizo
Se creo una interfaz mobile completa que simula una app nativa (estilo Headspace/Co-Star). El layout desktop queda intacto — en viewports < 1024px se activa automaticamente el layout mobile con bottom tab bar, headers contextuales por pagina, mini reproductor flotante y configuracion PWA.

### Archivos creados

| Archivo | Descripcion |
|---------|-------------|
| `frontend/src/lib/hooks/usar-es-mobile.ts` | Hook con useSyncExternalStore para detectar viewport mobile (< 1024px) sin hydration mismatch |
| `frontend/src/lib/hooks/usar-audio.ts` | Hook compartido para gestion del elemento audio (extraido de reproductor-cosmico) |
| `frontend/src/componentes/layouts/layout-mobile.tsx` | Shell mobile: contenido + mini player + bottom tabs, con safe areas y 100dvh |
| `frontend/src/componentes/layouts/barra-navegacion-inferior.tsx` | Bottom tab bar con 5 tabs (Inicio, Astral, Descubrir, Podcasts, Perfil), touch targets 44px |
| `frontend/src/componentes/layouts/header-mobile.tsx` | Header contextual por pagina (titulo, boton atras, transparente, accion derecha) con safe-area-top |
| `frontend/src/componentes/layouts/mini-reproductor.tsx` | Mini player 56px encima del tab bar + reproductor full-screen expandible con controles completos |
| `frontend/src/app/(app)/descubrir/page.tsx` | Pagina hub "Descubrir" con grid de cards hacia HD, Numerologia, Calendario, Retorno Solar, Transitos |
| `frontend/public/manifest.json` | Manifest PWA: standalone, portrait, theme violet, iconos 192/512 |
| `frontend/public/img/icon-192.png` | Icono PWA 192x192 (placeholder violeta) |
| `frontend/public/img/icon-512.png` | Icono PWA 512x512 (placeholder violeta) |

### Archivos modificados

| Archivo | Descripcion |
|---------|-------------|
| `frontend/src/componentes/layouts/layout-app.tsx` | Condicional: si esMobile renderiza LayoutMobile, si no desktop sin cambios |
| `frontend/src/componentes/layouts/reproductor-cosmico.tsx` | Refactorizado para usar usarAudio() hook compartido |
| `frontend/src/lib/stores/store-ui.ts` | Agregado miniReproductorExpandido + toggleMiniReproductor |
| `frontend/src/app/globals.css` | CSS: safe areas, animaciones (fade-in, slide-up), touch-feedback, mobile-scroll |
| `frontend/src/app/layout.tsx` | Meta tags PWA: viewport-fit=cover, theme-color, apple-mobile-web-app-capable, manifest |
| `frontend/src/lib/hooks/index.ts` | Re-exports de usarEsMobile y usarAudio |
| `frontend/src/app/(app)/dashboard/page.tsx` | HeaderMobile custom con saludo personalizado + avatar |
| `frontend/src/app/(app)/carta-natal/page.tsx` | HeaderMobile "Carta Astral" con mostrarAtras en 3 returns |
| `frontend/src/app/(app)/diseno-humano/page.tsx` | HeaderMobile "Diseno Humano" con mostrarAtras |
| `frontend/src/app/(app)/numerologia/page.tsx` | HeaderMobile "Numerologia" con mostrarAtras |
| `frontend/src/app/(app)/calendario-cosmico/page.tsx` | HeaderMobile "Calendario Cosmico" con mostrarAtras |
| `frontend/src/app/(app)/retorno-solar/page.tsx` | HeaderMobile "Retorno Solar" con mostrarAtras |
| `frontend/src/app/(app)/podcast/page.tsx` | HeaderMobile "Podcasts" (sin back, es tab destination) |
| `frontend/src/app/(app)/perfil/page.tsx` | HeaderMobile "Mi Perfil" |
| `frontend/src/app/(app)/suscripcion/page.tsx` | HeaderMobile "Suscripcion" con mostrarAtras |
| `frontend/src/app/(app)/transitos/page.tsx` | HeaderMobile "Transitos" con mostrarAtras |

### Tests
No se agregaron tests nuevos. Build pasa limpio (`npm run build` exitoso, 22 paginas generadas incluyendo /descubrir).

### Como funciona
1. El hook `usarEsMobile()` usa `matchMedia("(max-width: 1023px)")` con `useSyncExternalStore` para detectar mobile de forma SSR-safe
2. `layout-app.tsx` condiciona: si mobile → renderiza `<LayoutMobile>`, si desktop → layout 3 columnas original sin cambios
3. `LayoutMobile` estructura: contenido full-height con `100dvh`, mini reproductor flotante encima del tab bar, bottom tab bar fijo con 5 tabs
4. Cada pagina incluye un `<HeaderMobile>` con `lg:hidden` que solo aparece en mobile — con titulo y boton atras contextual
5. La pagina `/descubrir` es un hub con cards grandes que enlazan a las secciones secundarias (HD, Numerologia, Calendario, Retorno Solar, Transitos)
6. El reproductor de audio se extrajo a un hook compartido `usarAudio()` que usan tanto el reproductor desktop como el mini reproductor mobile
7. El mini reproductor se expande a full-screen con controles completos, cover grande, barra de progreso y volumen
8. PWA configurada con manifest.json, viewport-fit=cover para safe areas en iPhone, e iconos placeholder
5. Si solo cambio el nombre, no se recalcula nada

---

## Sesion: Setup proyecto React Native (Expo) — App mobile
**Fecha:** 2026-03-24 ~12:00 (ARG)

### Que se hizo
Inicializacion del proyecto React Native con Expo SDK 55 dentro de `mobile/` en el monorepo existente. Estructura base con expo-router (file-based routing), 5 tabs, cliente API con JWT auto-refresh, paleta de colores ASTRA y todas las dependencias core instaladas.

### mobile/ — Archivos creados (10)
| Archivo | Proposito |
|---------|-----------|
| `mobile/app.json` | Config Expo: nombre ASTRA, scheme deep linking, bundleIdentifier iOS/Android, dark mode, plugins |
| `mobile/package.json` | Dependencias: expo 55, react 19.2, expo-router, react-query, zustand, axios, nativewind, expo-av, react-native-svg, expo-secure-store |
| `mobile/src/app/_layout.tsx` | Layout raiz: SafeAreaProvider, GestureHandler, QueryClientProvider, Stack navigator dark |
| `mobile/src/app/(tabs)/_layout.tsx` | Tab navigator con 5 tabs (Inicio, Astral, Descubrir, Podcasts, Perfil), estilo ASTRA |
| `mobile/src/app/(tabs)/index.tsx` | Pantalla Inicio placeholder |
| `mobile/src/app/(tabs)/astral.tsx` | Pantalla Carta Astral placeholder |
| `mobile/src/app/(tabs)/descubrir.tsx` | Pantalla Descubrir placeholder |
| `mobile/src/app/(tabs)/podcast.tsx` | Pantalla Podcasts placeholder |
| `mobile/src/app/(tabs)/perfil.tsx` | Pantalla Perfil placeholder |
| `mobile/src/constants/colores.ts` | Paleta de colores ASTRA (coherente con frontend web) |
| `mobile/src/lib/api/cliente.ts` | Cliente axios con interceptors JWT (auto-refresh token, SecureStore) |

### Archivos modificados (1)
| Archivo | Cambios |
|---------|---------|
| `.gitignore` | Agregadas reglas para React Native/Expo: .expo/, ios/, android/, .metro-health-check, keystores, provisioning profiles, EAS build |

### Estructura de carpetas
```
mobile/
├── src/
│   ├── app/              # Rutas (expo-router file-based)
│   │   ├── _layout.tsx   # Layout raiz
│   │   ├── (tabs)/       # Tab navigator
│   │   └── (auth)/       # Auth screens (pendiente)
│   ├── componentes/      # Componentes reutilizables
│   │   ├── ui/
│   │   └── layouts/
│   ├── lib/
│   │   ├── api/          # Cliente HTTP + endpoints
│   │   ├── hooks/        # React Query hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── tipos/        # TypeScript types
│   │   └── utilidades/
│   └── constants/        # Colores, config
├── assets/               # Iconos, splash, fuentes
├── app.json              # Config Expo
└── package.json
```

### Dependencias instaladas
- **Core**: expo 55, react 19.2, react-native 0.83
- **Navegacion**: expo-router, react-native-screens, react-native-safe-area-context
- **UI**: nativewind 4, tailwindcss 3.4, react-native-reanimated, react-native-gesture-handler, react-native-svg
- **Audio**: expo-av
- **Auth**: expo-secure-store, expo-auth-session, expo-web-browser
- **Estado**: zustand, @tanstack/react-query
- **HTTP**: axios

### Tests
- TypeScript compila limpio (`npx tsc --noEmit` sin errores)
- Sin tests unitarios aun (setup inicial)

### Como funciona
1. El proyecto vive en `mobile/` dentro del monorepo P16_ASTRA (junto a `backend/` y `frontend/`)
2. Usa expo-router con file-based routing en `src/app/` — misma filosofia que Next.js en el frontend web
3. El cliente API (`src/lib/api/cliente.ts`) apunta al mismo backend FastAPI, con auto-refresh JWT via SecureStore
4. La paleta de colores es identica al frontend web (dark theme ASTRA)
5. Para correr: `cd mobile && npx expo start` → escanear QR con Expo Go o usar simulador

---

## Sesion: Suscripciones MP — fixes producción + perfil refactor
**Fecha:** 2026-03-24 ~14:00 — 18:00 (ARG)
**Commits:** varios en `dev` → merge a `main` (`0f87a77`)

### Que se hizo
Correcciones al flujo de suscripción MercadoPago en producción y reestructuración completa de la página de perfil.

### Backend — Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `app/servicios/servicio_mercadopago.py` | Quitar `billing_day`/`billing_day_proportional`, renombrar motivo a "ASTRA - Plan Premium" |
| `app/rutas/v1/suscripcion.py` | Factura concepto "Suscripción ASTRA", PDF titulo/footer ASTRA |
| `app/configuracion.py` | back_urls de `/suscripcion/*` a `/checkout/*` |
| `app/datos/repositorio_suscripcion.py` | `obtener_activa()` prioriza "activa" sobre "pendiente" con SQL CASE |
| `tests/test_flujo_suscripcion.py` | Actualizar concepto a "Suscripción ASTRA" |

### Frontend — Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/(checkout)/layout.tsx` | **Nuevo** — Layout público sin auth para post-checkout |
| `src/app/(checkout)/checkout/exito/page.tsx` | **Nuevo** — Página éxito pública |
| `src/app/(checkout)/checkout/fallo/page.tsx` | **Nuevo** — Página fallo pública |
| `src/app/(checkout)/checkout/pendiente/page.tsx` | **Nuevo** — Página pendiente pública |
| `src/app/(app)/suscripcion/page.tsx` | sessionStorage checkout tracking, polling verificación, visibilitychange, banners estado, confirmación cancelar |
| `src/app/(app)/perfil/page.tsx` | Reestructuración completa: sección Configuración con acordeón (contraseña, Google info, cancelar suscripción, cerrar sesión) |
| `src/componentes/ui/icono.tsx` | Agregar CaretDown, CaretUp, PencilSimple |

### Producción — Cambios directos

| Cambio | Detalle |
|--------|---------|
| DB `precios_plan` | `precio_local=110000`, `frecuencia=30`, `intervalo='days'` (AR, ARS $1100/30 días) |
| `.env.prod` | `MP_URL_EXITO/FALLO/PENDIENTE` → `/checkout/*` |

### Tests
- 483 tests backend pasando
- Frontend compila sin errores TypeScript

### Como funciona
1. **Checkout MP**: Al suscribirse, se guarda flag en `sessionStorage`. MP abre back_url en su in-app browser → páginas públicas `/checkout/exito|fallo|pendiente` sin auth. Al volver al browser original, `visibilitychange` + polling detectan el pago y muestran banner de confirmación.
2. **Cancelación**: Desde perfil → Configuración → "Cancelar suscripción" con doble confirmación. Llama API que cancela en MP vía preapproval API (sin redirect a MP).
3. **Prioridad estado**: `obtener_activa()` usa SQL CASE para devolver la suscripción "activa" antes que "pendiente", evitando confusión cuando coexisten ambas.
4. **Perfil refactorizado**: Sección plan muestra "Mejorar plan" o "Gestionar suscripción" según estado. Sección Configuración agrupa contraseña (solo auth local), info Google (solo OAuth), cancelar suscripción (solo premium activa), y cerrar sesión en acordeón expandible.

---

## Sesion: Cancelacion Premium con gracia hasta fin de periodo
**Fecha:** 2026-03-24 ~15:00 (ARG)

### Que se hizo
Implementacion de periodo de gracia al cancelar suscripcion Premium: el usuario mantiene acceso hasta fin del periodo pagado en vez de perderlo inmediatamente.

### Backend — Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `backend/app/rutas/v1/suscripcion.py` | Endpoint `/cancelar`: obtiene `next_payment_date` de MP, mantiene estado "activa" con `fecha_fin` programada. Endpoint `/mi-suscripcion`: agrega `cancelacion_programada` al response. Webhook `_procesar_preapproval`: ignora cancelacion de MP si hay gracia activa. |
| `backend/app/datos/repositorio_suscripcion.py` | Nuevo metodo `programar_cancelacion()` (setea fecha_fin sin cambiar estado). `obtener_activa()` con lazy-expire: si fecha_fin vencio, cancela y crea gratis automaticamente. |

### Frontend — Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/lib/tipos/suscripcion.ts` | Agregado campo `cancelacion_programada?: boolean` a interfaz Suscripcion. |
| `frontend/src/app/(app)/suscripcion/page.tsx` | Badge "Activo hasta [fecha]" si cancelacion programada. Banner informativo con link a MP. Oculta boton cancelar si ya programada. Dialogo de cancelacion explica gracia. |
| `frontend/src/app/(app)/perfil/page.tsx` | Badge "Activo hasta [fecha]" en estado de suscripcion. Oculta opcion "Cancelar suscripcion" si ya programada. Texto de confirmacion actualizado con info de gracia. |

### Tests
- 2 tests nuevos en `test_flujo_suscripcion.py`: `test_cancelar_programa_gracia` y `test_cancelar_fallback_30_dias`
- 3 tests actualizados en `test_rutas_suscripcion.py`: adaptados al nuevo flujo de gracia
- 482 tests pasando (2 pre-existentes fallando en podcast/TTS no relacionados)

### Como funciona
1. **Cancelacion**: El usuario cancela desde la UI. El backend obtiene `next_payment_date` de MP (o usa fecha_inicio + 30 dias como fallback), cancela el preapproval en MP, pero mantiene la suscripcion local como "activa" con `fecha_fin` seteada.
2. **Gracia**: Mientras `fecha_fin` no haya pasado, el usuario sigue con acceso Premium. La UI muestra badge "Activo hasta [fecha]" y oculta el boton de cancelar.
3. **Lazy-expire**: Cada vez que se consulta `obtener_activa()`, si la suscripcion tiene `fecha_fin` vencida, se marca como "cancelada" y se crea automaticamente una suscripcion Gratis.
4. **Proteccion webhook**: Si MP envia webhook de cancelacion pero la suscripcion tiene gracia activa, se ignora para no degradar prematuramente.
5. **UI coherente**: Ambas paginas (suscripcion y perfil) muestran el mismo badge de advertencia y ocultan la opcion de cancelar si ya esta programada.

---

## Sesion: Mobile App — Feature Parity con Web Frontend
**Fecha:** 2026-03-24 ~22:00 (ARG)

### Que se hizo
Implementacion completa de la app mobile React Native (Expo) a paridad con la version mobile del frontend web. ~75 archivos creados/modificados abarcando infraestructura NativeWind, tipos, stores, hooks, componentes UI, auth, onboarding, 5 pantallas tab, 6 pantallas feature, visualizaciones SVG y reproductor de audio.

### Infraestructura — Archivos creados/modificados
| Archivo | Descripcion |
|---------|-------------|
| `mobile/tailwind.config.js` | Config NativeWind con colores ASTRA custom |
| `mobile/global.css` | Tailwind base/components/utilities |
| `mobile/babel.config.js` | Preset expo + nativewind + module-resolver @/ |
| `mobile/metro.config.js` | withNativeWind wrapper |
| `mobile/tsconfig.json` | Paths @/* → ./src/* |
| `mobile/nativewind-env.d.ts` | NativeWind types reference |
| `mobile/app.json` | Agregado plugin expo-splash-screen |

### Tipos — 13 archivos creados en `src/lib/tipos/`
| Archivo | Contenido |
|---------|-----------|
| `api.ts` | RespuestaBase, DatosNacimiento, DatosNumerologia |
| `auth.ts` | EsquemaRegistro/Login, Usuario, UsuarioConSuscripcion, RespuestaTokens |
| `natal.ts` | Planeta, Casa, Aspecto, CartaNatal |
| `diseno-humano.ts` | Activacion, Canal, CruzEncarnacion, DisenoHumano |
| `numerologia.ts` | NumeroRespuesta, EtapaVida, Numerologia |
| `retorno-solar.ts` | FechaRetorno, CartaRetorno, RetornoSolar |
| `transitos.ts` | PlanetaTransito, Transitos |
| `calendario-cosmico.ts` | TransitosDia, CalendarioRango |
| `perfil.ts` | Perfil |
| `calculos.ts` | CalculosPerfil |
| `suscripcion.ts` | Plan, Suscripcion, Pago, RespuestaCheckout + 8 mas |
| `podcast.ts` | TipoPodcast, SegmentoLetra, PodcastEpisodio |
| `index.ts` | Re-export centralizado |

### Stores — 2 archivos creados en `src/lib/stores/`
| Archivo | Contenido |
|---------|-----------|
| `store-auth.ts` | useStoreAuth: usuario, autenticado, cargarUsuario (SecureStore) |
| `store-ui.ts` | useStoreUI: pistaActual, reproduciendo, progreso, volumen, segmentoActual |

### Hooks — 13 archivos creados en `src/lib/hooks/`
| Archivo | Hooks |
|---------|-------|
| `usar-auth.ts` | usarLogin, usarRegistro, usarLogout, usarCambiarContrasena, usarGoogleAuthUrl |
| `usar-perfil.ts` | usarCrearPerfil, usarMiPerfil, usarActualizarPerfil |
| `usar-mis-calculos.ts` | usarMisCalculos |
| `usar-carta-natal.ts` | usarCartaNatal |
| `usar-diseno-humano.ts` | usarDisenoHumano |
| `usar-numerologia.ts` | usarNumerologia |
| `usar-retorno-solar.ts` | usarRetornoSolar |
| `usar-transitos.ts` | usarTransitos (refetch 10min) |
| `usar-calendario-cosmico.ts` | usarTransitosDia, usarTransitosRango |
| `usar-suscripcion.ts` | usarPlanes, usarMiSuscripcion, usarSuscribirse + 4 mas |
| `usar-podcast.ts` | usarPodcastHoy, usarPodcastHistorial, usarGenerarPodcast |
| `usar-audio-nativo.ts` | expo-av + FileSystem cache + SecureStore auth |
| `index.ts` | Re-export todos los hooks |

### Utilidades — 2 archivos creados en `src/lib/utilidades/`
| Archivo | Contenido |
|---------|-----------|
| `cn.ts` | cn() merge clases con clsx |
| `formatear-fecha.ts` | formatearFecha, formatearFechaCorta, formatearHora, formatearFechaHora |

### Componentes UI — 10 archivos creados en `src/componentes/`
| Archivo | Descripcion |
|---------|-------------|
| `ui/boton.tsx` | Variantes primario/secundario/fantasma, tamaños, cargando |
| `ui/input.tsx` | TextInput con etiqueta, icono, error, forwardRef |
| `ui/tarjeta.tsx` | Variantes default/violeta/dorado/acento |
| `ui/badge.tsx` | Variantes exito/error/advertencia/info |
| `ui/avatar.tsx` | Iniciales, tamaños sm/md/lg |
| `ui/esqueleto.tsx` | Shimmer animado con reanimated |
| `ui/separador.tsx` | Linea horizontal |
| `ui/icono-astral.tsx` | IconoAstral + IconoSigno para SVG astrales |
| `layouts/header-mobile.tsx` | Header con back + titulo + safe area |
| `compuestos/formulario-nacimiento.tsx` | Form reutilizable con DateTimePicker nativo |

### Visualizaciones SVG — 2 archivos
| Archivo | Descripcion |
|---------|-------------|
| `visualizaciones/rueda-zodiacal.tsx` | react-native-svg: 12 signos, casas, planetas, aspectos |
| `visualizaciones/body-graph.tsx` | react-native-svg: 9 centros, canales, definido/abierto |

### Auth + Onboarding — 5 archivos
| Archivo | Descripcion |
|---------|-------------|
| `(auth)/_layout.tsx` | Stack sin tabs |
| `(auth)/login.tsx` | Google OAuth + email/password |
| `(auth)/registro.tsx` | Google OAuth + formulario completo |
| `(auth)/callback.tsx` | Deep link handler astra://callback |
| `(onboarding)/index.tsx` | 1 paso: datos nacimiento → 4 calculos paralelos |

### Pantallas Tab — 6 archivos modificados/reemplazados
| Archivo | Descripcion |
|---------|-------------|
| `(tabs)/_layout.tsx` | Iconos Phosphor + MiniReproductor sobre tab bar |
| `(tabs)/index.tsx` | Dashboard: saludo, hero lunar, podcasts, transitos |
| `(tabs)/astral.tsx` | Rueda zodiacal SVG, planetas, aspectos |
| `(tabs)/descubrir.tsx` | Grid 2x2+1 cards navegacion a features |
| `(tabs)/podcast.tsx` | Cards generacion, historial con FlatList |
| `(tabs)/perfil.tsx` | Info usuario, datos nacimiento editables, config expandible |

### Pantallas Feature — 7 archivos
| Archivo | Descripcion |
|---------|-------------|
| `(features)/_layout.tsx` | Stack slide_from_right |
| `(features)/diseno-humano.tsx` | Body Graph SVG, tipo/autoridad/perfil, centros, canales |
| `(features)/numerologia.tsx` | Grid 2x3 numeros, etapas vida, maestros |
| `(features)/transitos.tsx` | 10 planetas con signo/grado/retrogrado |
| `(features)/retorno-solar.tsx` | Fecha retorno, rueda zodiacal, aspectos |
| `(features)/calendario-cosmico.tsx` | Strip semanal, detalle dia |
| `(features)/suscripcion.tsx` | Planes, checkout MP via WebBrowser, pagos |

### Reproductor Audio — 2 archivos + hook
| Archivo | Descripcion |
|---------|-------------|
| `layouts/mini-reproductor.tsx` | Barra 56px: progress + titulo + play/pause + close |
| `layouts/reproductor-completo.tsx` | Full-screen: cover, progress slider, volumen |
| `hooks/usar-audio-nativo.ts` | expo-av: fetch auth → FileSystem cache → Audio.Sound |

### Root Layout
| Archivo | Descripcion |
|---------|-------------|
| `src/app/_layout.tsx` | SplashScreen control, GuardAuth (redirect login/onboarding/tabs), global.css import |

### Dependencias nuevas
- `expo-linear-gradient` — gradientes
- `expo-file-system` — cache audio
- `expo-splash-screen` — control splash
- `phosphor-react-native` — iconos UI
- `clsx` — merge classNames
- `babel-plugin-module-resolver` — alias @/
- `@react-native-community/datetimepicker` — picker fecha/hora nativo
- `@react-native-community/slider` — slider volumen/progreso

### Como funciona
1. **NativeWind**: TailwindCSS funciona via nativewind/metro + babel preset. Las clases se usan directamente en `className` de componentes RN.
2. **Auth Guard**: El root `_layout.tsx` ejecuta `cargarUsuario()` al montar, controla SplashScreen, y redirige segun estado: sin token → login, sin perfil → onboarding, con perfil → tabs.
3. **Google OAuth**: Abre WebBrowser via `expo-web-browser`, captura redirect `astra://callback` con tokens, los guarda en SecureStore.
4. **Onboarding**: Un solo paso — formulario de nacimiento. Al enviar: crea perfil + calcula carta natal, HD, numerologia y retorno solar en paralelo.
5. **Dashboard**: Saludo personalizado + hero lunar de transitos en vivo + 3 cards podcast (generar/play) + lista transitos rapidos.
6. **Carta Astral**: SVG rueda zodiacal con react-native-svg. Muestra planetas posicionados, casas, aspectos como lineas, tabla de planetas y aspectos.
7. **Diseno Humano**: SVG Body Graph con 9 centros geometricos (cuadrado/triangulo/diamante), canales, coloring definido/abierto.
8. **Reproductor**: El hook `usarAudioNativo` descarga audio autenticado via FileSystem, crea `Audio.Sound`, sincroniza play/pause/volumen/seek con store Zustand. Mini reproductor flotante sobre tab bar, expandible a full-screen.
9. **Suscripcion**: Muestra planes, abre checkout MP en browser externo, permite cancelar con gracia.

---

## Sesion: Fixes del Diagnóstico Premium E2E
**Fecha:** 2026-03-24 ~14:00 (ARG)

### Que se hizo
Implementación completa de 6 fases de fixes identificados en el diagnóstico del flujo Premium: reset de contraseña, eliminación de cuenta, sistema global de toasts, gating visual de features premium, cleanup de navbar, consolidación de cancelación, y emails de notificación.

### Backend — Archivos creados
| Archivo | Descripción |
|---------|-------------|
| `app/email_templates/cuenta_eliminada.html` | Email de confirmación de eliminación de cuenta |
| `app/email_templates/pago_rechazado.html` | Email de notificación de pago rechazado |
| `app/email_templates/expiracion_gracia.html` | Email de aviso de expiración del período de gracia |

### Backend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `app/esquemas/auth.py` | 3 schemas nuevos: EsquemaSolicitarReset, EsquemaConfirmarReset, EsquemaEliminarCuenta |
| `app/rutas/v1/auth.py` | 3 endpoints nuevos: solicitar-reset, confirmar-reset, eliminar-cuenta. Updated /me para lazy-expire email |
| `app/rutas/v1/suscripcion.py` | Guard 409 anti-doble-premium en /suscribirse. Email pago rechazado en webhook. Lazy-expire email en /mi-suscripcion |
| `app/datos/repositorio_usuario.py` | Método desactivar() para soft-delete de cuenta |
| `app/datos/repositorio_suscripcion.py` | obtener_activa() con params opcionales email/nombre para lazy-expire email |
| `app/servicios/servicio_email.py` | 3 métodos nuevos: enviar_cuenta_eliminada, enviar_pago_rechazado, enviar_expiracion_gracia |
| `app/configuracion.py` | URLs MP default cambiadas de /checkout/* a /suscripcion/* |
| `tests/rutas/test_rutas_suscripcion.py` | Mock obtener_activa en 7 tests del endpoint /suscribirse |
| `tests/test_flujo_suscripcion.py` | Mock obtener_activa en test de integración |

### Frontend — Archivos creados
| Archivo | Descripción |
|---------|-------------|
| `src/app/(auth)/olvide-contrasena/page.tsx` | Página de solicitud de reset (campo email + mensaje éxito) |
| `src/app/(auth)/reset-password/page.tsx` | Página de confirmación de reset (token de URL + nueva contraseña) |
| `src/componentes/ui/alerta.tsx` | Componente CVA con 4 variantes (exito, error, advertencia, info) |
| `src/componentes/ui/bloqueo-premium.tsx` | Wrapper de gating visual — blur + overlay CTA para usuarios free |
| `src/componentes/layouts/contenedor-toasts.tsx` | Contenedor global de toasts con auto-dismiss y animaciones |

### Frontend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `src/lib/hooks/usar-auth.ts` | 3 hooks nuevos: usarSolicitarReset, usarConfirmarReset, usarEliminarCuenta |
| `src/lib/hooks/index.ts` | Re-exports de los 3 hooks nuevos |
| `src/lib/stores/store-ui.ts` | Toast slice: ToastItem interface, toasts[], mostrarToast(), cerrarToast() |
| `src/app/(auth)/login/page.tsx` | Link "¿Olvidaste tu contraseña?" después del campo contraseña |
| `src/componentes/layouts/layout-app.tsx` | ContenedorToasts montado en desktop y mobile layouts |
| `src/componentes/layouts/navbar.tsx` | Removida campana rota, removido link duplicado Configuración, agregado badge Premium |
| `src/app/(app)/perfil/page.tsx` | Cancel→link a /suscripcion, agregado Oráculo Telegram (movido de suscripcion), agregado Eliminar cuenta |
| `src/app/(app)/suscripcion/page.tsx` | Removida sección Oráculo, mensajeSync reemplazado por toasts |
| `src/app/(app)/podcast/page.tsx` | Cards envueltas en BloqueoPremium |

### Tests
- Backend: 474 passed, 1 skipped (10 warnings). 1 fallo pre-existente en test_servicio_tts_async.py (no relacionado)
- Frontend: TypeScript compila sin errores nuevos (1 error pre-existente en test no relacionado)

### Como funciona
1. **Reset de contraseña**: Login → "¿Olvidaste tu contraseña?" → formulario email → backend genera token UUID en Redis (TTL 1h) → ServicioEmail envía link → usuario abre /reset-password?token=X → ingresa nueva contraseña → backend valida token, cambia hash, borra token (uso único)
2. **Eliminación de cuenta**: Perfil → Configuración → Eliminar cuenta → confirmación 2-step (pide contraseña si auth local) → backend cancela suscripción MP si existe, soft-delete (activo=False), revoca refresh token, envía email confirmación → redirect a login
3. **Guard 409**: Si usuario ya tiene Premium activo e intenta suscribirse de nuevo, backend retorna 409 "Ya tenés plan Premium activo"
4. **Toasts globales**: store-ui.ts mantiene array de toasts → ContenedorToasts (fixed bottom-right) renderiza Alertas con auto-dismiss (4s default). Reemplaza mensajes inline en suscripción
5. **BloqueoPremium**: Wrapper que chequea plan_slug del usuario. Si no es premium: blur en children + overlay con corona, mensaje y CTA a /suscripcion. Usado en Podcast
6. **Navbar cleanup**: Sin campana (no hay sistema de notificaciones), sin link duplicado a configuración, badge Premium visible en avatar y dropdown
7. **Consolidación**: Cancelación solo en /suscripcion (perfil tiene link "Gestionar suscripción"). Oráculo/Telegram movido de suscripción a perfil (solo premium)
8. **Emails de notificación**: Pago rechazado (en webhook _procesar_pago), expiración de gracia (lazy en obtener_activa), cuenta eliminada (en endpoint eliminar-cuenta)
