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

---

## Sesion: Rediseño Visual Mobile — Glassmorphism + Light/Dark Mode
**Fecha:** 2026-03-26 ~14:00 (ARG)

### Que se hizo
Transformación visual completa de la app mobile ASTRA: sistema de temas dual (claro/oscuro/automático), glassmorphism con expo-blur, tipografía Inter, animaciones con Reanimated, y actualización de todas las pantallas y componentes para usar colores dinámicos.

### Dependencias instaladas
- `expo-blur` (BlurView nativo iOS, fallback Android)
- `expo-font` + `@expo-google-fonts/inter` (tipografía Inter 400/500/600/700)

### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `src/lib/stores/store-tema.ts` | Store Zustand para tema: preferencia (claro/oscuro/auto), esquemaActivo, colores, persistencia SecureStore |
| `src/lib/hooks/usar-tema.ts` | Hook que expone colores, esOscuro, esquema, preferencia, setPreferencia |
| `src/componentes/ui/vista-vidrio.tsx` | Primitiva glassmorphism: BlurView iOS + fallback semi-transparente Android |
| `src/componentes/ui/presionable-animado.tsx` | Pressable con animación scale(0.97) vía Reanimated |
| `src/componentes/ui/animacion-entrada.tsx` | Fade-in + translateY(20→0) con delay configurable para stagger |

### Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `app.json` | `userInterfaceStyle: "automatic"` (era "dark"), plugin expo-font |
| `tailwind.config.js` | Colores removidos (ahora via style props), fontFamily Inter |
| `src/constants/colores.ts` | Reescrito: ColoresClaro, ColoresOscuro, obtenerColores(), tokens glass/SVG |
| `src/app/_layout.tsx` | Carga fuentes Inter, init tema, Appearance listener, StatusBar dinámico |
| `src/app/(tabs)/_layout.tsx` | Tab bar glass (BlurView iOS), colores dinámicos |
| `src/app/(auth)/_layout.tsx` | contentStyle dinámico |
| `src/app/(onboarding)/_layout.tsx` | contentStyle dinámico |
| `src/app/(features)/_layout.tsx` | contentStyle dinámico |
| `src/componentes/ui/tarjeta.tsx` | Glass con BlurView, variantes con tinte, fallback sólido |
| `src/componentes/ui/boton.tsx` | PresionableAnimado, Inter, colores dinámicos |
| `src/componentes/ui/input.tsx` | Colores dinámicos, Inter |
| `src/componentes/ui/badge.tsx` | bgMap/textMap desde tema |
| `src/componentes/ui/avatar.tsx` | Color fondo adaptativo |
| `src/componentes/ui/esqueleto.tsx` | Migrado a Reanimated, color adaptativo |
| `src/componentes/ui/separador.tsx` | Border dinámico |
| `src/componentes/ui/icono-astral.tsx` | tintColor desde colores.acento |
| `src/componentes/layouts/header-mobile.tsx` | Glass header con BlurView iOS |
| `src/componentes/layouts/mini-reproductor.tsx` | Glass, colores dinámicos |
| `src/componentes/layouts/reproductor-completo.tsx` | Colores dinámicos |
| `src/componentes/compuestos/formulario-nacimiento.tsx` | themeVariant dinámico, colores dinámicos |
| `src/componentes/visualizaciones/rueda-zodiacal.tsx` | SVG strokes/fills desde tokens tema |
| `src/componentes/visualizaciones/body-graph.tsx` | Colores definido/abierto desde tema |
| `src/app/(tabs)/index.tsx` | AnimacionEntrada stagger, gradientes dinámicos |
| `src/app/(tabs)/astral.tsx` | Colores dinámicos, AnimacionEntrada |
| `src/app/(tabs)/descubrir.tsx` | PresionableAnimado cards, AnimacionEntrada |
| `src/app/(tabs)/podcast.tsx` | AnimacionEntrada, colores dinámicos |
| `src/app/(tabs)/perfil.tsx` | **Selector de tema** (Sol/Luna/Auto), colores dinámicos |
| `src/app/(auth)/login.tsx` | Colores dinámicos, Inter |
| `src/app/(auth)/registro.tsx` | Colores dinámicos, Inter |
| `src/app/(auth)/callback.tsx` | Colores dinámicos |
| `src/app/(onboarding)/index.tsx` | Colores dinámicos |
| `src/app/(features)/diseno-humano.tsx` | Colores dinámicos, AnimacionEntrada |
| `src/app/(features)/numerologia.tsx` | Colores dinámicos, AnimacionEntrada |
| `src/app/(features)/retorno-solar.tsx` | Colores dinámicos, AnimacionEntrada |
| `src/app/(features)/transitos.tsx` | Colores dinámicos, AnimacionEntrada |
| `src/app/(features)/calendario-cosmico.tsx` | Colores dinámicos |
| `src/app/(features)/suscripcion.tsx` | Colores dinámicos |
| `src/lib/hooks/index.ts` | Export usarTema |

### Tests
- No hay tests unitarios mobile (Expo no tiene suite configurada). Verificación visual pendiente.

### Como funciona
1. **Sistema de temas**: `store-tema.ts` (Zustand) almacena preferencia del usuario en SecureStore. Al iniciar la app, `_layout.tsx` carga la preferencia y sincroniza con `Appearance` del sistema. El hook `usarTema()` retorna el objeto `colores` correspondiente al tema activo (claro u oscuro).
2. **Paletas duales**: `colores.ts` define ColoresClaro (#FAFAFA base, #7C4DFF acento) y ColoresOscuro (#0a0a1a base, #c084fc acento), con tokens semánticos idénticos incluyendo glass (vidrioFondo, vidrioBorde), tab bar, y SVG.
3. **Glassmorphism**: `vista-vidrio.tsx` usa `BlurView` de expo-blur en iOS (efecto nativo UIVisualEffectView). En Android usa fallback semi-transparente sólido. `tarjeta.tsx` y `header-mobile.tsx` lo usan como fondo.
4. **Selector de tema**: En la pantalla Perfil hay 3 opciones (Sol=Claro, Luna=Oscuro, CircleHalf=Automático). La selección persiste en SecureStore y se aplica inmediatamente.
5. **Animaciones**: `PresionableAnimado` agrega feedback táctil scale(0.97) a botones y cards. `AnimacionEntrada` agrega fade-in + slide-up al montar secciones, con prop `retraso` para efecto stagger.
6. **Migración de colores**: Todos los componentes y pantallas pasaron de `className="bg-fondo text-primario"` (NativeWind) a `style={{ backgroundColor: colores.fondo, color: colores.primario }}` (style props dinámicos), ya que NativeWind no soporta CSS variables para cambio de tema en runtime.

---

## Sesion: Pronóstico Cósmico — Home Dashboard Redesign
**Fecha:** 2026-03-26 ~15:00 (ARG)

### Que se hizo
Feature completa de "Pronóstico Cósmico": backend que genera forecasts diarios/semanales combinando Astrología + Numerología + Diseño Humano vía Claude API, con cache Redis. Frontend rediseñado con dashboard centrado en el pronóstico.

### Backend — Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `backend/app/servicios/servicio_numerologia.py` | Agregado parámetro `fecha_objetivo` a `_anio_personal`, `_mes_personal`, `_dia_personal` + nuevo método público `calcular_dia_personal()` |
| `backend/app/configuracion.py` | Agregada variable `pronostico_modelo` (default: claude-haiku-4-5) |
| `backend/app/configuracion_features.py` | **Nuevo** — Config de gating freemium/premium por feature con función `obtener_acceso_pronostico()` |
| `backend/app/esquemas/pronostico.py` | **Nuevo** — Schemas Pydantic: ClimaCosmicoSchema, AreaVidaSchema, MomentoClaveSchema, AlertaCosmicaSchema, ConsejoHDSchema, PronosticoDiarioSchema, PronosticoSemanalSchema |
| `backend/app/oraculo/prompt_pronostico.md` | **Nuevo** — System prompt para Claude que genera JSON estructurado del pronóstico |
| `backend/app/servicios/servicio_pronostico.py` | **Nuevo** — Servicio orquestador con `generar_pronostico_diario()` y `generar_pronostico_semanal()`, cache Redis, fallback sin AI |
| `backend/app/rutas/v1/pronostico.py` | **Nuevo** — Endpoints `GET /pronostico/diario` y `GET /pronostico/semanal` |
| `backend/app/principal.py` | Registrado router de pronóstico |

### Frontend — Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/lib/tipos/pronostico.ts` | **Nuevo** — Interfaces TS (PronosticoDiarioDTO, PronosticoSemanalDTO, etc.) |
| `frontend/src/lib/tipos/index.ts` | Agregados exports de tipos de pronóstico |
| `frontend/src/lib/hooks/usar-pronostico.ts` | **Nuevo** — React Query hooks `usarPronosticoDiario()` y `usarPronosticoSemanal()` |
| `frontend/src/lib/hooks/index.ts` | Agregados exports de hooks de pronóstico |
| `frontend/src/componentes/pronostico/barra-energia.tsx` | **Nuevo** — Barra visual de energía/claridad/conexión (1-10) |
| `frontend/src/componentes/pronostico/indicador-nivel.tsx` | **Nuevo** — Dot de color favorable/neutro/precaución |
| `frontend/src/componentes/pronostico/hero-clima.tsx` | **Nuevo** — Card hero con clima cósmico, gradiente dinámico, barras de energía |
| `frontend/src/componentes/pronostico/areas-vida.tsx` | **Nuevo** — 6 cards de áreas (Trabajo/Amor/Salud/Finanzas/Creatividad/Crecimiento) con expand |
| `frontend/src/componentes/pronostico/momentos-clave.tsx` | **Nuevo** — Timeline de 3 bloques (Mañana/Tarde/Noche) |
| `frontend/src/componentes/pronostico/alerta-cosmica.tsx` | **Nuevo** — Cards condicionales de alertas (retrógrados, eclipses, etc.) |
| `frontend/src/componentes/pronostico/vista-semana.tsx` | **Nuevo** — 7 mini-cards horizontales con energía y clima por día |
| `frontend/src/componentes/pronostico/consejo-hd.tsx` | **Nuevo** — Card de consejo personalizado de Diseño Humano |
| `frontend/src/app/(app)/dashboard/page.tsx` | **Reescrito** — Dashboard centrado en pronóstico con esqueletos, error state, podcasts |

### Tests
- 20 tests nuevos en `tests/servicios/test_servicio_pronostico.py` (todos pasando)
- 13 tests existentes de numerología siguen pasando (retrocompat verificada)
- 0 errores TypeScript en archivos nuevos

### Como funciona
1. **Flujo diario**: Dashboard monta → `usarPronosticoDiario()` llama `GET /pronostico/diario` → backend chequea cache Redis (`pronostico:diario:{usuario}:{fecha}`) → si miss: carga perfil cósmico del usuario (natal + HD + numerología de BD), obtiene tránsitos actuales, calcula número personal del día, construye prompt con todo el contexto → llama Claude Haiku (JSON mode) → parsea y valida con Pydantic → guarda en Redis con TTL hasta medianoche ARG + 1h → retorna al frontend
2. **Flujo semanal**: Similar pero calcula tránsitos y número personal para cada día de la semana (Lun-Dom), envía todo en una sola llamada a Claude
3. **Fallback**: Si Claude falla o no hay API key, retorna pronóstico genérico basado en número personal + fase lunar (el dashboard nunca queda vacío)
4. **Cache 3 niveles**: Redis L1 (TTL dinámico hasta medianoche/lunes), React Query L2 (staleTime 30min/1h)
5. **Gating**: `configuracion_features.py` define nivel por sección (todo freemium por ahora). El endpoint incluye campo `acceso` en la respuesta
6. **Dashboard**: Hero con clima → Áreas de vida (scroll/grid) → Momentos del día (timeline) → Alertas (condicional) → Vista semanal → Podcasts → Consejo HD. Responsive via usarEsMobile(). Panel derecho eliminado.

---

## Sesion: Lectura de Carta Natal — Vista Narrativa-Infografica
**Fecha:** 2026-03-26 ~18:40 (ARG)

### Que se hizo
Transformacion completa de la pagina Carta Natal (frontend desktop + mobile) de vista tabular tecnica a experiencia de lectura narrativa-infografica con paneles resizables, interpretaciones contextuales y bottom sheet mobile.

### Frontend — Archivos creados
| Archivo | Descripcion |
|---------|-------------|
| `frontend/src/lib/utilidades/interpretaciones-natal.ts` | Constantes astrologicas centralizadas + sistema de templates narrativos (interpretarPlaneta, interpretarAspecto, interpretarCasa, generarEsencia, interpretarTriada, calcularDistribucion, ordenarPlanetas, agruparAspectos) |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Hero con rueda zodiacal centrada + nombre + frase-esencia generada |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | 3 tarjetas Sol/Luna/Ascendente con colores diferenciados (dorado/violeta/indigo) |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Barras proporcionales de elementos y modalidades |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Planetas como articulos narrativos con interpretacion inline |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Aspectos agrupados por tipo con badges y orbe visual |
| `frontend/src/componentes/carta-natal/casas-grid.tsx` | Grid 4x3 de casas, angulares destacadas |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Panel derecho dinamico (default/planeta/aspecto/casa/triada) con datos tecnicos colapsables |

### Frontend — Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Reescritura completa: react-resizable-panels (Group/Panel/Separator), scroll narrativo en panel central, panel contextual dinamico en panel derecho, mobile sin panel derecho |
| `frontend/package.json` | +react-resizable-panels v4.7.6 |

### Mobile — Archivos creados
| Archivo | Descripcion |
|---------|-------------|
| `mobile/src/lib/utilidades/interpretaciones-natal.ts` | Copia de interpretaciones frontend (mismas funciones) |
| `mobile/src/componentes/carta-natal/seccion-triada.tsx` | Triada mobile con Pressable y tema dinamico |
| `mobile/src/componentes/carta-natal/distribucion-energetica.tsx` | Barras energeticas mobile |
| `mobile/src/componentes/carta-natal/planeta-narrativo.tsx` | Planetas narrativos mobile con Badge |
| `mobile/src/componentes/carta-natal/aspectos-narrativo.tsx` | Aspectos agrupados mobile |
| `mobile/src/componentes/carta-natal/casas-grid.tsx` | Grid 4 columnas mobile |
| `mobile/src/componentes/carta-natal/sheet-detalle.tsx` | Bottom sheet (@gorhom/bottom-sheet) con snap points 40%/80%, contenido contextual (planeta/aspecto/casa/triada) |

### Mobile — Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `mobile/src/app/(tabs)/astral.tsx` | Reescritura completa: scroll narrativo con frase-esencia, triada, distribucion, planetas, aspectos, casas + bottom sheet para detalles |
| `mobile/package.json` | +@gorhom/bottom-sheet |

### Tests
- Frontend build (`npm run build`): pasa sin errores
- Frontend TypeScript: 0 errores nuevos (1 pre-existente en test no relacionado)
- Mobile TypeScript: 0 errores nuevos (pre-existentes en archivos no relacionados)

### Como funciona
1. **Frontend Desktop**: La pagina usa `react-resizable-panels` con un PanelGroup horizontal. Panel izquierdo (70% default, min 55%) contiene el flujo narrativo: hero con rueda zodiacal + frase-esencia, triada Sol/Luna/Asc con tarjetas clicables, barras de distribucion energetica, planetas como articulos con interpretacion inline, aspectos agrupados por tipo, y grid de casas. Panel derecho (30%, colapsable) muestra contenido contextual segun lo seleccionado (resumen default, detalle de planeta con aspectos, detalle de aspecto, detalle de casa, analisis de triada). El divisor es arrastrable. En mobile (< lg) se muestra solo el scroll sin panel derecho.
2. **Mobile**: Scroll vertical con AnimacionEntrada escalonada. Cada elemento (planeta, aspecto, casa, triada) es Pressable y abre un bottom sheet con snap points al 40% y 80%. El sheet usa BottomSheetScrollView para contenido largo.
3. **Interpretaciones**: Sistema de templates en `interpretaciones-natal.ts` genera texto narrativo combinando arquetipo del planeta + elemento/modalidad del signo + tema de la casa + dignidad + retrogradacion. No requiere API — todo se genera client-side a partir de los datos de la carta natal.

## Sesion: Reubicación de card de numerología
**Fecha:** 2026-03-30 ~14:59 (ARG)

### Que se hizo
Se quitó la card de acceso a numerología del dashboard y se reubicó dentro de la propia sección de Numerología, manteniendo la misma estética visual.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/dashboard-v2/cta-numerologia.tsx` | Se hizo reutilizable la card para usarla con o sin navegación, con título y descripción configurables. |
| `frontend/src/app/(app)/dashboard/page.tsx` | Se removió la card de numerología del dashboard desktop. |
| `frontend/src/app/(app)/numerologia/page.tsx` | Se agregó la card en la sección de Numerología tanto en estado inicial como en resultados. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
0 tests nuevos/modificados. `npm run lint -- "src/componentes/dashboard-v2/cta-numerologia.tsx" "src/app/(app)/dashboard/page.tsx" "src/app/(app)/numerologia/page.tsx"` ejecutado sin errores; quedaron 2 warnings preexistentes del React Compiler en `dashboard/page.tsx`.

### Como funciona
1. El dashboard ya no muestra la card "Ver mi Carta Numerológica".
2. La página `/numerologia` ahora renderiza esa misma pieza visual como cabecera contextual dentro de la sección.
3. En el formulario inicial la card invita a calcular la carta, y cuando hay resultados muestra el número personal del día dentro de la misma tarjeta.

## Sesion: Menú “Próximamente” para Calendario y Revolución Solar
**Fecha:** 2026-03-30 ~15:11 (ARG)

### Que se hizo
Se marcó `Calendario` y `Revolución Solar` como funcionalidades próximas dentro de la navegación y se reemplazó el render principal de ambas rutas por vistas de anticipación con fondo violeta glass y copy explicativo del alcance futuro.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/proximamente/feature-proximamente.tsx` | Nuevo componente reutilizable para pantallas de “Próximamente”, con fondo editorial violeta, glassmorphism y bloques que explican qué hará cada feature. |
| `frontend/src/componentes/layouts/sidebar-navegacion.tsx` | Se agregaron chips pequeños de “Próximamente” en `Calendario` y `Revolución Solar` tanto en desktop como en mobile, y se corrigió el naming visible de la segunda opción. |
| `frontend/src/app/(app)/descubrir/page.tsx` | Se alinearon las cards de mobile con el nuevo estado, agregando chip visual y corrigiendo el texto a `Revolución Solar`. |
| `frontend/src/app/(app)/calendario-cosmico/page.tsx` | Se reemplazó la vista funcional por una pantalla de anticipación que explica la futura experiencia del Calendario Cósmico. |
| `frontend/src/app/(app)/retorno-solar/page.tsx` | Se reemplazó la vista funcional por una pantalla de anticipación que explica la futura experiencia de Revolución Solar, manteniendo la ruta técnica existente. |
| `frontend/src/tests/componentes/sidebar-descarga.test.tsx` | Se actualizó el test del sidebar para validar el nuevo label `Revolución Solar` y los chips `Próximamente`. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
1 test modificado. `npm run lint -- src/componentes/proximamente/feature-proximamente.tsx "src/app/(app)/calendario-cosmico/page.tsx" "src/app/(app)/retorno-solar/page.tsx" src/componentes/layouts/sidebar-navegacion.tsx "src/app/(app)/descubrir/page.tsx" src/tests/componentes/sidebar-descarga.test.tsx` ejecutado sin errores en los archivos nuevos/modificados; quedaron 6 warnings preexistentes dentro de `src/tests/componentes/sidebar-descarga.test.tsx`. `npm run test -- src/tests/componentes/sidebar-descarga.test.tsx` no pudo ejecutarse en este entorno porque la toolchain actual requiere una versión de Node compatible con `node:util.styleText` y la máquina está corriendo Node `v18.17.1`, por lo que no se pudo confirmar el total pasando.

### Como funciona
1. El sidebar desktop y el drawer mobile ahora muestran un chip pequeño `Próximamente` junto a `Calendario` y `Revolución Solar`.
2. La pantalla `Descubrir` replica el mismo estado visual para que la señal sea coherente también en mobile.
3. Al entrar a `/calendario-cosmico` o `/retorno-solar`, el usuario ve una pantalla de anticipación con fondo violeta/glass y bloques que explican qué va a ofrecer cada módulo cuando esté listo.
4. La interfaz visible ya habla de `Revolución Solar`, pero la ruta `/retorno-solar` se mantiene para no romper navegación ni enlaces existentes.

## Sesion: Chatbot más conversacional y conciso
**Fecha:** 2026-03-30 ~15:21 (ARG)

### Que se hizo
Se ajustó el comportamiento del oráculo para que responda como chat real: más conversacional, directo y con un límite efectivo de hasta 3 líneas por respuesta.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `backend/app/oraculo/system_prompt.md` | Se redefinió el estilo del oráculo para priorizar respuestas cortas, naturales y sin formato de informe. |
| `backend/app/servicios/servicio_oraculo.py` | Se agregó post-procesado para limpiar markdown, condensar la salida y limitarla a 3 líneas; también se redujo `max_tokens`. |
| `backend/tests/servicios/test_servicio_oraculo.py` | Se agregaron tests para validar el formateo corto y el nuevo límite de tokens del chat. |
| `frontend/src/componentes/chat/chat-widget.tsx` | Se habilitó el render de saltos de línea para que la respuesta breve se vea realmente en hasta 3 líneas. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
2 tests nuevos/modificados. `./.venv/bin/pytest tests/servicios/test_servicio_oraculo.py` → 20 passed. `npm run lint -- src/componentes/chat/chat-widget.tsx` ejecutado sin errores; quedó 1 warning preexistente de React Hooks en el widget.

### Como funciona
1. El prompt del oráculo ahora prioriza respuestas de chat, sin títulos ni bloques largos.
2. Aunque el modelo devuelva texto más extenso, el backend lo normaliza y lo recorta a un máximo de 3 líneas.
3. El widget web ahora respeta los saltos de línea para que ese formato breve se vea correctamente en pantalla.

## Sesion: Fix de serialización en chat web
**Fecha:** 2026-03-30 ~15:12 (ARG)

### Que se hizo
Se corrigió el contrato de respuesta del endpoint del chatbot web para que FastAPI serialice el envoltorio estándar sin romper después de guardar la respuesta del oráculo.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `backend/app/rutas/v1/chat.py` | Se tipó la respuesta del endpoint `/chat/mensaje` con una envolvente compatible con `{ exito, datos }`. |
| `backend/tests/rutas/test_rutas_chat.py` | Nuevo test de regresión para verificar que `/chat/mensaje` responde 200 y devuelve `datos.respuesta` correctamente. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
1 test nuevo. `./.venv/bin/pytest tests/rutas/test_rutas_chat.py` → 1 passed.

### Como funciona
1. El endpoint sigue devolviendo la estructura estándar del backend: `exito`, `datos` y dentro de `datos` la `respuesta` del oráculo.
2. FastAPI ya no intenta validar `respuesta` en el nivel raíz, que era lo que disparaba el `ResponseValidationError`.
3. El frontend puede volver a desenvainar `datos` con `clienteApi` y mostrar la respuesta del chatbot sin recibir un 500.

## Sesion: Ajuste de layout en pantallas “Próximamente”
**Fecha:** 2026-03-30 ~15:19 (ARG)

### Que se hizo
Se simplificó el layout de las pantallas “Próximamente”: se quitó la tarjeta de `Estado actual` y se redistribuyeron las tarjetas-resumen debajo del copete para evitar que quedaran angostas y excesivamente altas.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/proximamente/feature-proximamente.tsx` | Se eliminó el bloque lateral de estado y se reordenaron las tarjetas de resumen en una grilla horizontal más ancha debajo del encabezado. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
0 tests nuevos/modificados. `npm run lint -- src/componentes/proximamente/feature-proximamente.tsx` ejecutado sin errores.

### Como funciona
1. El encabezado de la pantalla mantiene el badge, ícono, título y copete descriptivo.
2. Las tres tarjetas de resumen ahora se renderizan justo debajo del copete usando todo el ancho disponible, con una proporción más equilibrada.
3. La sección inferior conserva la explicación funcional y la nota de vista previa, pero ya no muestra la tarjeta separada de `Estado actual`.

## Sesion: Fix de reproducción de podcasts web
**Fecha:** 2026-03-30 ~15:30 (ARG)

### Que se hizo
Se reforzó el flujo de audio de podcasts en web para que la carga del MP3 use el cliente autenticado, reutilice blobs cacheados y muestre estados claros cuando el navegador todavía no puede iniciar la reproducción.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/lib/api/cliente.ts` | Se agregó `getBlob()` con la misma lógica de refresh automático que ya usaban las llamadas JSON. |
| `frontend/src/lib/hooks/usar-audio.ts` | Se incorporó cache en memoria de blobs/URLs de audio, precarga de episodios listos, manejo de retry para la misma pista y toast informativo cuando el navegador requiere un segundo play. |
| `frontend/src/componentes/layouts/reproductor-cosmico.tsx` | Se agregó `autoPlay`, estado visual de carga y bloqueo temporal del botón mientras el audio termina de cargarse. |
| `frontend/src/componentes/layouts/mini-reproductor.tsx` | Se aplicó el mismo manejo de `autoPlay` y spinner en mobile/full-screen. |
| `frontend/src/app/(app)/podcast/page.tsx` | La descarga ahora usa el cliente autenticado y la página precarga audios listos del día e historial. |
| `frontend/src/app/(app)/dashboard/page.tsx` | Se agregó precarga de audios listos del dashboard para reducir fallos en el primer play. |
| `frontend/src/tests/paginas/podcast.test.tsx` | Se mockeó la precarga de audio para mantener la suite aislada del fetch real. |
| `frontend/src/tests/paginas/dashboard.test.tsx` | Se mockeó la precarga de audio para aislar la suite del side effect nuevo. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
0 tests nuevos. `PATH=/opt/homebrew/bin:$PATH npm run test -- src/tests/paginas/podcast.test.tsx` → 7 tests pasando. `PATH=/opt/homebrew/bin:$PATH npx eslint ...` sobre archivos tocados sin errores; quedaron warnings preexistentes del React Compiler y del test `dashboard.test.tsx`. La suite `src/tests/paginas/dashboard.test.tsx` mantiene 3 fallas por asserts desactualizados del contenido desktop, no por este fix.

### Como funciona
1. Cuando una pantalla web necesita reproducir o descargar un podcast, ya no usa `fetch` directo sino el mismo cliente autenticado que renueva token si hace falta.
2. Los MP3 listos se precargan y quedan cacheados como blob URLs en memoria para evitar repetir descargas y mejorar la probabilidad de reproducción inmediata.
3. Si el navegador bloquea el auto-play inicial después de cargar el blob, el reproductor conserva el audio listo y muestra un aviso para que el usuario presione play nuevamente sin tener que regenerar ni recargar el episodio.

## Sesion: Rediseño visual de la sección Diseño Humano
**Fecha:** 2026-03-30 ~15:36 (ARG)

### Que se hizo
Se rediseñó la página de Diseño Humano con una composición más editorial y clara: hero oscuro con métricas, panel destacado para el Body Graph, mejor jerarquía para centros/canales y un bloque de activaciones integrado al flujo principal.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Reescritura visual completa de los estados de carga, formulario y resultados; nuevo hero, nueva organización de paneles y mejor presentación de cruz, centros, canales y activaciones. |
| `frontend/src/componentes/visualizaciones/body-graph.tsx` | Se mejoró el estilo del gráfico y se corrigió el mapeo de centros/canales para que la visualización responda a aliases reales y destaque conexiones activas válidas. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
0 tests nuevos/modificados. `npm run lint -- "src/app/(app)/diseno-humano/page.tsx" src/componentes/visualizaciones/body-graph.tsx` ejecutado sin errores. No se ejecutó Vitest en este entorno por la incompatibilidad conocida de la toolchain actual con Node `v18.17.1`.

### Como funciona
1. El estado inicial ahora presenta Diseño Humano como una experiencia guiada, con copete explicativo y formulario integrado en una tarjeta de mayor jerarquía visual.
2. El estado de resultados organiza la lectura en tres capas: hero con atributos principales, panel central del Body Graph y bloques explicativos para cruz, activaciones, centros y canales.
3. El `BodyGraph` ya no depende de nombres exactos capitalizados: normaliza aliases de centros y usa `datos.canales` para iluminar conexiones realmente activas, haciendo que el gráfico represente mejor la información calculada.

## Sesion: Fix de icono de reproducción en podcasts
**Fecha:** 2026-03-30 ~15:42 (ARG)

### Que se hizo
Se corrigió el estado visual del reproductor para que deje de mostrar spinner cuando el audio ya está listo y sonando, y vuelva a mostrar el icono de pausa como corresponde.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/lib/hooks/usar-audio.ts` | Se simplificó la carga del audio por cambio de pista para evitar una carrera de estado que dejaba `cargandoAudio` activo después de obtener el blob. |
| `frontend/src/componentes/layouts/reproductor-cosmico.tsx` | El spinner ahora solo se muestra si todavía no existe audio reproducible; si el audio ya está listo, el botón vuelve a play/pausa. |
| `frontend/src/componentes/layouts/mini-reproductor.tsx` | Se aplicó la misma lógica al mini reproductor y a la vista expandida mobile. |
| `frontend/src/tests/componentes/reproductor-cosmico.test.tsx` | Nuevo test de regresión para validar que el spinner desaparece cuando `tieneAudio` ya es verdadero. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
1 test nuevo. `PATH=/opt/homebrew/bin:$PATH npm run test -- src/tests/componentes/reproductor-cosmico.test.tsx src/tests/paginas/podcast.test.tsx` → 9 tests pasando. `PATH=/opt/homebrew/bin:$PATH npx eslint src/lib/hooks/usar-audio.ts src/componentes/layouts/reproductor-cosmico.tsx src/componentes/layouts/mini-reproductor.tsx src/tests/componentes/reproductor-cosmico.test.tsx` ejecutado sin errores.

### Como funciona
1. Al seleccionar una pista, el hook carga el blob del MP3 y apaga explícitamente `cargandoAudio` apenas obtiene una URL reproducible o detecta un error.
2. Los reproductores desktop y mobile ya no usan `cargandoAudio` a secas para pintar el spinner: ahora exigen además que todavía no exista `audioUrl`.
3. Si el audio ya está disponible y el reproductor está sonando, el botón central vuelve a renderizar el icono de pausa en lugar del loader circular.

## Sesion: Refinamiento visual de la pantalla Podcasts
**Fecha:** 2026-03-30 ~15:58 (ARG)

### Que se hizo
Se mejoró la calidad visual del módulo de Podcasts en desktop con una composición más editorial: hero con más presencia, tarjetas integradas al entorno oscuro, historial más legible y navegación superior/lateral más coherente con la estética premium de ASTRA.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/podcast/page.tsx` | Se rediseñó la página con hero destacado, métricas de estado, nuevas tarjetas para día/semana/mes, mejor jerarquía de secciones y un historial con mayor contraste y acciones más claras. |
| `frontend/src/componentes/layouts/navbar.tsx` | Se refinó la topbar con gradiente, glass más cuidado, mejor avatar y uso de `IconoSigno` para respetar la convención de iconografía astral. |
| `frontend/src/componentes/layouts/sidebar-navegacion.tsx` | Se ajustó el sidebar desktop con más ancho, estados activos más sólidos, mejor contraste y etiquetas “Próximamente” sin truncado agresivo. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
0 tests nuevos/modificados. `npm run lint -- "src/app/(app)/podcast/page.tsx" "src/componentes/layouts/navbar.tsx" "src/componentes/layouts/sidebar-navegacion.tsx"` ejecutado sin errores.

### Como funciona
1. La entrada a Podcasts ahora abre con un hero oscuro que resume el estado del módulo y concentra mejor el foco visual antes de bajar a las acciones.
2. Las tres tarjetas principales usan un lenguaje unificado para mostrar título, contexto, estado y CTA, evitando que cada card parezca un patrón distinto.
3. El historial quedó encapsulado en una superficie propia con más contraste, metadata visible y accesos claros a reproducción y descarga, mientras navbar y sidebar acompañan la experiencia con un chrome más pulido.

## Sesion: Limpieza del hero de Podcasts
**Fecha:** 2026-03-30 ~16:44 (ARG)

### Que se hizo
Se simplificó el hero de la pantalla de Podcasts quitando las tres tarjetas de métricas laterales para dejar una cabecera más limpia y enfocada.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/podcast/page.tsx` | Se eliminaron las tarjetas de “Listos hoy”, “Historial” y “Último movimiento” del hero, dejando solo el bloque editorial principal. |
| `context/resumen-de-cambios.md` | Se documentó este ajuste visual. |

### Tests
0 tests nuevos/modificados. `npm run lint -- "src/app/(app)/podcast/page.tsx"` ejecutado sin errores.

### Como funciona
1. El hero mantiene el badge, el ícono y el texto editorial principal, pero ya no muestra métricas apiladas a la derecha.
2. La primera decisión visual vuelve a ser el título y la descripción del módulo, sin tarjetas secundarias compitiendo por atención.
3. El resto de la pantalla conserva la estructura del rediseño anterior: cards principales y bloque de historial intactos.

## Sesion: Skill de consistencia visual premium ciruela
**Fecha:** 2026-03-30 ~16:49 (ARG)

### Que se hizo
Se creó un skill nuevo para capturar el lenguaje visual "premium ciruela" de ASTRA y reutilizarlo al refinar futuras pantallas sin depender de memoria implícita.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `.agents/skills/experto-ui-premium-ciruela/SKILL.md` | Nuevo skill con reglas de hero, cards, historial, sidebar, navbar, heurísticas de decisión, anti-patrones y recetas Tailwind para mantener consistencia visual. |
| `context/resumen-de-cambios.md` | Se documentó esta nueva capacidad del repositorio. |

### Tests
0 tests nuevos/modificados. Se validó manualmente la estructura y el contenido del skill. La validación automática `quick_validate.py` no pudo ejecutarse en este entorno porque falta la dependencia `PyYAML`.

### Como funciona
1. Cuando una tarea pida una UI más premium, más editorial o explícitamente "premium ciruela", el skill define el patrón visual a seguir para hero, superficies, cards, listas y chrome.
2. El skill también fija reglas negativas claras, como evitar tarjetas métricas redundantes, slabs blancos sin integración o sidebars con contraste pobre.
3. Con esto, las futuras intervenciones de UI pueden repetir el mismo sistema visual de forma más consistente y menos improvisada.

## Sesion: Limpieza de copy interno en cards de podcasts
**Fecha:** 2026-03-30 ~16:51 (ARG)

### Que se hizo
Se eliminaron los mensajes descriptivos internos de las cards de podcasts para dejar las tarjetas más limpias y con menos ruido visual.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/podcast/page.tsx` | Se removió el bloque de copy intermedio dentro de las cards de día, semana y mes, manteniendo la jerarquía principal y las acciones. |
| `context/resumen-de-cambios.md` | Se documentó este ajuste visual puntual. |

### Tests
0 tests nuevos/modificados. `npm run lint -- "src/app/(app)/podcast/page.tsx"` ejecutado sin errores.

### Como funciona
1. Cada card conserva icono, título, subtítulo y acciones, pero ya no muestra el recuadro textual intermedio.
2. El usuario ve una tarjeta más directa y menos cargada, con foco en reproducir, descargar o generar.
3. El layout general de la pantalla no cambia; solo se limpia el contenido interno de las cards.

## Sesion: UI premium ciruela para Calendario y Revolución Solar
**Fecha:** 2026-03-30 ~17:01 (ARG)

### Que se hizo
Se rediseñaron las pantallas de anticipación de `Calendario Cósmico` y `Revolución Solar` para alinearlas con el lenguaje visual premium ciruela de ASTRA: hero editorial, surfaces integradas, mejor jerarquía y una vista previa más específica para cada módulo.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/proximamente/feature-proximamente.tsx` | Se reescribió el componente compartido para sumar hero premium, panel lateral de vista previa, bloque de capacidades y recorrido guiado, manteniendo el fondo ciruela/glass. |
| `frontend/src/app/(app)/calendario-cosmico/page.tsx` | Se actualizó el contenido del calendario con copy más editorial y una vista previa propia centrada en ritmo diario/semanal/mensual. |
| `frontend/src/app/(app)/retorno-solar/page.tsx` | Se actualizó el contenido de revolución solar con foco en cálculo exacto, comparativa natal vs retorno y narrativa anual. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
0 tests nuevos/modificados. `npm run lint -- "src/componentes/proximamente/feature-proximamente.tsx" "src/app/(app)/calendario-cosmico/page.tsx" "src/app/(app)/retorno-solar/page.tsx"` ejecutado sin errores.

### Como funciona
1. Al entrar a `/calendario-cosmico` o `/retorno-solar`, el usuario sigue viendo una pantalla de anticipación, pero ahora con una cabecera editorial más marcada y superficies coherentes con la estética premium ciruela de Podcasts.
2. Cada módulo muestra una vista previa distinta: calendario enfatiza ritmo del día/semana/mes y revolución solar enfatiza instante exacto, carta comparada y tema anual.
3. Debajo del hero, la pantalla explica tanto lo que va a resolver la feature como el recorrido esperado de uso, para que la promesa del módulo se entienda rápido y con menos ruido visual.

## Sesion: Header premium con estado vivo y acción rápida
**Fecha:** 2026-03-30 ~17:15 (ARG)

### Que se hizo
Se rediseñó el header principal de la app para que deje de ser una barra decorativa y pase a funcionar como una capa de contexto operativo: muestra el estado vivo del usuario, la acción más útil del momento y una jerarquía visual más premium en desktop y mobile.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/layouts/navbar.tsx` | Se reconstruyó la topbar desktop con contexto por ruta, panel central de estado vivo (pronóstico, alertas, reproducción, podcast), CTA rápida, mejor lectura del plan y dropdown de usuario integrado al lenguaje premium ciruela. |
| `frontend/src/componentes/layouts/header-mobile.tsx` | Se rediseñó el header mobile como cápsula premium con mejor jerarquía tipográfica, soporte para etiqueta, subtítulo, chips de metadatos y acciones rápidas. |
| `frontend/src/app/(app)/dashboard/page.tsx` | Se conectó el header mobile del dashboard a datos reales del día (energía, luna, estado del podcast) y a una acción directa para reproducir o generar el audio diario. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de desarrollo. |

### Tests
0 tests nuevos/modificados. Se intentó ejecutar `npm run test -- src/tests/paginas/dashboard.test.tsx`, pero el entorno actual usa `Node v18.17.1` y Vitest falla al iniciar por incompatibilidad con `node:util.styleText`. La revisión final del cambio se hizo manualmente sobre los archivos tocados.

### Como funciona
1. En desktop, la barra superior ahora combina tres capas claras: identidad de la sección actual, panel central con estado útil del momento y una acción rápida contextual para continuar audio o entrar directo a podcasts.
2. El contenido central prioriza lo realmente accionable: si hay reproducción en curso muestra continuidad, si hay alerta prioriza esa señal, y si no usa el pulso del día con energía, luna y estado del podcast.
3. En mobile, el dashboard abre con un header que ya trae el contexto esencial antes del scroll: saludo, microestado del día en chips y un botón para disparar la acción principal del audio diario.

## Sesion: Limpieza visual de Calendario y Revolución Solar
**Fecha:** 2026-03-30 ~17:14 (ARG)

### Que se hizo
Se simplificaron ambas pantallas de anticipación para que muestren únicamente la tarjeta principal. Se removieron todas las tarjetas secundarias y bloques complementarios, manteniendo solo el hero editorial.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/proximamente/feature-proximamente.tsx` | Se redujo el layout a una sola tarjeta principal, eliminando panel lateral, grillas secundarias y bloque final. |
| `frontend/src/app/(app)/calendario-cosmico/page.tsx` | Se eliminó la configuración secundaria que ya no se renderiza, dejando solo el contenido necesario para la tarjeta principal. |
| `frontend/src/app/(app)/retorno-solar/page.tsx` | Se eliminó la configuración secundaria que ya no se renderiza, dejando solo el contenido necesario para la tarjeta principal. |
| `context/resumen-de-cambios.md` | Se documentó esta simplificación visual. |

### Tests
0 tests nuevos/modificados. `npm run lint -- "src/componentes/proximamente/feature-proximamente.tsx" "src/app/(app)/calendario-cosmico/page.tsx" "src/app/(app)/retorno-solar/page.tsx"` ejecutado sin errores.

### Como funciona
1. Tanto `/calendario-cosmico` como `/retorno-solar` siguen reutilizando el mismo componente compartido.
2. Ese componente ahora renderiza solo la tarjeta principal con badge, icono, título y descripción.
3. Al entrar a cualquiera de las dos rutas, la pantalla queda más limpia y directa, sin tarjetas secundarias compitiendo por atención.

## Sesion: Numerología premium con panel contextual persistente
**Fecha:** 2026-03-30 ~17:18 (ARG)

### Que se hizo
Se rediseñó la experiencia de Numerología para que deje de sentirse como un onepager de datos y pase a operar como una mesa de lectura premium: hero editorial, capítulos de interpretación, cards más coherentes y panel derecho persistente con explicación breve + significado personalizado.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/numerologia/page.tsx` | Reescritura visual y estructural completa: hero editorial, capítulos `Núcleo y misión`, `Ritmo actual` y `Etapas de vida`, renombre de secciones para acercarlas al lenguaje del libro, layout desktop con `PanelGroup`, navegación por capítulos y mobile con sheet contextual. |
| `frontend/src/componentes/numerologia/panel-contextual-numerologia.tsx` | Nuevo panel contextual reutilizable para numerología con vista default, lectura detallada por número/mes/etapa y bloque técnico colapsable. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de rediseño. |

### Tests
0 tests nuevos/modificados. En una primera pasada, `npm run lint -- "src/app/(app)/numerologia/page.tsx" src/componentes/numerologia/panel-contextual-numerologia.tsx` detectó una advertencia real por prop sin usar; fue corregida. Luego ESLint quedó colgado en este entorno, por lo que la validación final se cerró con una comprobación de sintaxis vía `typescript.transpileModule` sobre ambos archivos, sin diagnósticos.

### Como funciona
1. En desktop, Numerología ahora usa el mismo modelo premium de lectura asistida que venías pidiendo: contenido central narrativo y panel derecho persistente para toda entidad clickeable.
2. Las piezas técnicas disponibles se reorganizaron en capítulos más claros y más cercanos a la lógica del libro: sendero/destino/esencia/imagen, ritmo actual y etapas.
3. Al tocar un número, un mes o una etapa, el panel contextual siempre separa la lectura en dos capas: `Qué es` y `Qué significa para vos`, con un bloque técnico colapsable para la fórmula o criterio de cálculo.

## Sesion: Diseño Humano premium con cabina contextual
**Fecha:** 2026-03-30 ~17:20 (ARG)

### Que se hizo
Se rediseñó la pantalla de Diseño Humano para que deje de sentirse como un onepager de bloques sueltos y pase a funcionar como una cabina editorial interactiva. Ahora el Body Graph actúa como mapa de navegación y toda la información técnica relevante abre una explicación breve con significado específico para el usuario en un panel derecho persistente.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Reescritura visual y estructural completa: hero editorial premium, navegación por capítulos, cards de esencia clickeables, workspace técnico con Body Graph, listas de centros/canales/activaciones y panel contextual persistente en desktop con sheet en mobile. |
| `frontend/src/componentes/visualizaciones/body-graph.tsx` | Se volvió interactivo el gráfico: soporte para selección de centros y canales, resaltado contextual, mejor lectura visual y accesibilidad básica por teclado. |
| `frontend/src/componentes/diseno-humano/panel-contextual.tsx` | Nuevo panel contextual reutilizable para Diseño Humano con bloques `Qué es`, `Qué significa para vos`, `Claves de lectura` y datos técnicos colapsables. |
| `frontend/src/lib/utilidades/interpretaciones-diseno-humano.ts` | Nueva capa semántica para construir titulares editoriales, descripciones contextuales y lecturas específicas por tipo, autoridad, definición, centros, canales, cruz y activaciones. |
| `frontend/src/tests/paginas/diseno-humano.test.tsx` | Se ajustaron las aserciones al nuevo layout premium para aceptar valores repetidos en más de un bloque sin perder cobertura del flujo principal. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de rediseño e integración. |

### Tests
4 tests modificados/pasando en `src/tests/paginas/diseno-humano.test.tsx`. También se ejecutó `eslint` sobre `src/app/(app)/diseno-humano/page.tsx`, `src/componentes/visualizaciones/body-graph.tsx`, `src/componentes/diseno-humano/panel-contextual.tsx`, `src/lib/utilidades/interpretaciones-diseno-humano.ts` y `src/tests/paginas/diseno-humano.test.tsx` sin errores.

### Como funciona
1. La entrada principal ahora es un hero editorial que resume la tesis del diseño del usuario y permite saltar rápidamente a `Esencia`, `Mapa` o `Propósito`.
2. En la zona central, el usuario puede abrir tipo, autoridad, perfil y definición, o explorar el Body Graph por centros, canales y activaciones; cada selección actualiza el mismo estado compartido.
3. En desktop, el panel contextual derecho queda siempre disponible para explicar la pieza seleccionada en dos capas separadas: definición breve y traducción personalizada según los datos del usuario; en mobile, esa misma lectura aparece como sheet inferior.
4. El gráfico dejó de ser decorativo: al tocar un centro o un canal se iluminan las conexiones relacionadas y se dispara la interpretación correspondiente, manteniendo una experiencia más completa y menos lineal.

## Sesion: Supresión de mismatch de hidratación en RootLayout
**Fecha:** 2026-03-30 ~17:32 (ARG)

### Que se hizo
Se corrigió el warning de hidratación que aparecía en desarrollo cuando un atributo externo era inyectado sobre `<body>` antes de que React hidratara la app. El ajuste se hizo en el layout raíz para ignorar esa diferencia puntual sin modificar el render real de la interfaz.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/layout.tsx` | Se agregó `suppressHydrationWarning` al `<body>` para tolerar atributos agregados por extensiones o scripts externos antes de la hidratación. |
| `context/resumen-de-cambios.md` | Se documentó esta corrección de hidratación. |

### Tests
0 tests nuevos/modificados. `eslint` ejecutado sobre `src/app/layout.tsx` sin errores.

### Como funciona
1. El `RootLayout` sigue renderizando exactamente la misma estructura y los mismos proveedores globales.
2. La diferencia es que ahora React no emite warning si el navegador o una extensión modifica atributos del `<body>` antes de hidratar.
3. Esto evita ruido de consola por mutaciones externas como `cz-shortcut-listen`, sin tocar la lógica de negocio ni el layout visual.

## Sesion: Fix runtime en BodyGraph interactivo
**Fecha:** 2026-03-30 ~17:34 (ARG)

### Que se hizo
Se corrigió un error de runtime en el `BodyGraph` interactivo de Diseño Humano causado por una referencia a variable mal nombrada durante el render de canales definidos. Además se agregó una prueba directa del componente para cubrir este camino real de render.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/visualizaciones/body-graph.tsx` | Se corrigió la referencia `relacionada` por `relacionado` en el cálculo visual de ancho de línea para canales activos. |
| `frontend/src/tests/componentes/body-graph.test.tsx` | Nuevo test de componente que renderiza el `BodyGraph` real con un canal definido para detectar errores de runtime en el SVG interactivo. |
| `context/resumen-de-cambios.md` | Se documentó esta corrección puntual. |

### Tests
1 test nuevo, 5 tests pasando entre `src/tests/componentes/body-graph.test.tsx` y `src/tests/paginas/diseno-humano.test.tsx`. `eslint` ejecutado sobre `src/componentes/visualizaciones/body-graph.tsx`, `src/tests/componentes/body-graph.test.tsx` y `src/tests/paginas/diseno-humano.test.tsx` sin errores.

### Como funciona
1. El `BodyGraph` vuelve a renderizar correctamente cuando hay canales definidos y estados seleccionados.
2. La capa interactiva de líneas ya no rompe el render del SVG al calcular el grosor del canal resaltado.
3. La nueva prueba asegura que este camino de render real quede cubierto aunque la página principal siga mockeando el gráfico en sus tests.

## Sesion: Carta Astral premium con panel contextual y sheet mobile
**Fecha:** 2026-03-30 ~16:57 (ARG)

### Que se hizo
Se rediseñó la experiencia de Carta Astral para que deje de sentirse como una página apilada y pase a operar como una cabina de lectura premium: hero editorial alrededor de la rueda natal, módulos con mejor jerarquía visual, panel contextual más claro y una hoja inferior contextual en mobile.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Reescritura del shell visual: fondo con capas, estados de carga y formulario premium, layout desktop integrado con `PanelGroup`, botón de nuevo cálculo y sheet contextual en mobile al tocar una entidad. |
| `frontend/src/componentes/carta-natal/estilos.ts` | Nuevo archivo de tokens visuales compartidos para unificar superficies claras/oscuras y etiquetas de sección dentro de Carta Astral. |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Rediseño completo del hero con rueda protagonista, tesis editorial, chips de Sol/Luna/Ascendente, quick facts y CTA para recalcular. |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | La tríada principal pasó a cards más editoriales, con mejor narrativa y metadatos más legibles. |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | La distribución energética se reorganizó en un bloque con lectura rápida + paneles separados para elementos y modalidades. |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Se actualizaron las cards de planetas para que tengan más jerarquía, mejor señal visual del seleccionado y menos aspecto de lista blanca genérica. |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Se rediseñaron los grupos de aspectos con mejor ritmo visual, badges más consistentes y estados más claros para orbe/aplicativo. |
| `frontend/src/componentes/carta-natal/casas-grid.tsx` | La grilla de casas pasó a un sistema de tarjetas más amplio, con mejor lectura del signo y diferenciación de casas angulares. |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Reescritura del panel derecho: ahora separa explícitamente `Qué es`, `En tu carta` y `Qué observar`, con versión default más útil y bloque técnico sin `effect` de reseteo. |
| `frontend/src/lib/utilidades/interpretaciones-natal.ts` | Se exportaron constantes necesarias para el nuevo panel y se reemplazó el badge ámbar de conjunción por un tono dorado permitido. |
| `frontend/src/tests/paginas/carta-natal.test.tsx` | Limpieza menor del mock para eliminar warnings de lint y acompañar la nueva validación del módulo. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de rediseño. |

### Tests
0 tests nuevos/modificados a nivel funcional. `./node_modules/.bin/eslint "src/app/(app)/carta-natal/page.tsx" "src/componentes/carta-natal/panel-contextual.tsx" "src/componentes/carta-natal/hero-carta.tsx" "src/componentes/carta-natal/seccion-triada.tsx" "src/componentes/carta-natal/distribucion-energetica.tsx" "src/componentes/carta-natal/planetas-narrativo.tsx" "src/componentes/carta-natal/aspectos-narrativo.tsx" "src/componentes/carta-natal/casas-grid.tsx" "src/componentes/carta-natal/estilos.ts" "src/lib/utilidades/interpretaciones-natal.ts" "src/tests/paginas/carta-natal.test.tsx"` ejecutado sin errores ni warnings. Vitest no se ejecutó en esta sesión por la incompatibilidad conocida del entorno actual con `Node v18.17.1`.

### Como funciona
1. En desktop, Carta Astral conserva el patrón de panel central + panel derecho, pero ahora todo el shell se integra mejor: hero editorial, módulos más coherentes y panel contextual oscuro que explica cualquier planeta, aspecto, casa o punto de la tríada en tres capas breves.
2. En mobile, tocar una entidad ya no deja la selección “invisible”: se abre una hoja inferior contextual con la misma lectura del panel derecho, así que la premisa de “click técnico → explicación breve + significado personal” también existe fuera de desktop.
3. La rueda natal deja de ser una ilustración aislada y pasa a funcionar como entrada principal de navegación, acompañada por una narrativa más clara del conjunto de la carta y por bloques secundarios que compiten menos entre sí.

## Sesion: Corrección premium ciruela de Carta Astral y adopción de ui-ciruela
**Fecha:** 2026-03-30 ~17:29 (ARG)

### Que se hizo
Se corrigió la dirección visual de Carta Astral para alinearla con el criterio premium ciruela: hero más compacto, menos gigantismo tipográfico, menos ruido por bloque y la rueda natal dejó de dominar la pantalla. Además, `ui-ciruela` quedó instalada como referencia visual oficial del proyecto y `ux-designer` pasó a estado legacy.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Se reordenó la experiencia de Carta Astral: la rueda ya no vive en el lienzo principal, ahora se abre sólo desde un botón en un modal; también se redujo la masa visual general y se ajustó el layout central/panel derecho. |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reescritura del hero para sacar el nombre gigante del usuario, bajar escala tipográfica, mover la rueda fuera del hero y dejar una entrada más sobria y editorial. |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | Se bajó la jerarquía visual del bloque y se redujo el tono explicativo para que la tríada no compita como mini-hero adicional. |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Se redujo escala y ruido textual del bloque, manteniendo sólo el resumen necesario. |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Se achicó la jerarquía de encabezado y la escala interna de cards de planeta. |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Se simplificó el encabezado del módulo para que no repita el patrón hero de otras secciones. |
| `frontend/src/componentes/carta-natal/casas-grid.tsx` | Se bajó la escala del bloque y se limpió la presentación general. |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Se redujo el peso tipográfico del panel derecho para que acompañe en vez de competir. |
| `frontend/src/tests/paginas/carta-natal.test.tsx` | Se actualizaron aserciones al nuevo hero y se agregó cobertura para la apertura del modal de rueda natal. |
| `.claude/skills/ui-ciruela/SKILL.md` | Nuevo skill para Claude con `ui-ciruela` como referente visual oficial del producto. |
| `.agents/skills/ui-ciruela/SKILL.md` | Alias equivalente del skill para el flujo de agentes del proyecto. |
| `.claude/skills/ux-designer/SKILL.md` | Se marcó como referencia legacy para ASTRA, indicando que `ui-ciruela` es la guía actual. |
| `.agents/skills/ux-designer/SKILL.md` | Se agregó la misma nota de referencia legacy para el flujo de agentes. |
| `AGENTS.md` | Se actualizó la convención del proyecto para usar `ui-ciruela` como skill visual principal. |
| `claude.md` | Se actualizó la guía local de Claude para usar `ui-ciruela` como referencia visual principal. |
| `context/resumen-de-cambios.md` | Se documentó esta corrección visual y el cambio de referencia de skill. |

### Tests
1 test nuevo/modificado en `frontend/src/tests/paginas/carta-natal.test.tsx`. `./node_modules/.bin/eslint "src/app/(app)/carta-natal/page.tsx" "src/componentes/carta-natal/hero-carta.tsx" "src/componentes/carta-natal/panel-contextual.tsx" "src/componentes/carta-natal/seccion-triada.tsx" "src/componentes/carta-natal/distribucion-energetica.tsx" "src/componentes/carta-natal/planetas-narrativo.tsx" "src/componentes/carta-natal/aspectos-narrativo.tsx" "src/componentes/carta-natal/casas-grid.tsx" "src/tests/paginas/carta-natal.test.tsx"` ejecutado sin errores ni warnings. `vitest run "src/tests/paginas/carta-natal.test.tsx"` no pudo ejecutarse por la incompatibilidad conocida del entorno actual con `Node v18.17.1` (`node:util.styleText`).

### Como funciona
1. La entrada principal a `/carta-natal` ya no pone la rueda como protagonista: la pantalla arranca desde una lectura editorial compacta y deja la rueda como artefacto secundario, accesible sólo con el botón `Ver rueda natal`.
2. Al tocar ese botón, se abre un modal dedicado con la rueda completa en modo consulta, sin navegación interactiva sobre el gráfico.
3. El resto de la pantalla mantiene la exploración por tríada, planetas, aspectos y casas, pero con una escala más contenida y menos bloques que compiten entre sí.
4. A nivel de proyecto, `ui-ciruela` queda instalado como skill visual oficial tanto en `.claude/skills` como en `.agents/skills`, y la documentación local deja a `ux-designer` como referencia legacy para ASTRA.

## Sesion: Reparación de Numerología tras rediseño premium
**Fecha:** 2026-03-30 ~17:27 (ARG)

### Que se hizo
Se corrigió la rotura de la sección de Numerología causada por nulabilidad mal resuelta en la página nueva. Además, se actualizó el test de página para que refleje la UI premium actual en lugar de seguir validando la versión anterior.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/numerologia/page.tsx` | Se normalizó el uso de la carta activa con una referencia tipada no nula y fallback explícito para `meses_personales`, evitando errores de TypeScript en handlers, render del historial mensual y props del panel contextual. |
| `frontend/src/tests/paginas/numerologia.test.tsx` | Se reescribieron las aserciones para la experiencia premium actual, se mockeó `usarEsMobile` para estabilizar el render desktop en test y se eliminaron expectativas obsoletas de la interfaz anterior. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de reparación. |

### Tests
Se ejecutó `./node_modules/.bin/tsc --noEmit --pretty false` en `frontend`. Los errores de `src/app/(app)/numerologia/page.tsx` desaparecieron; quedaron solo errores previos no relacionados en `src/componentes/visualizaciones/body-graph.tsx` y `src/tests/componentes/sidebar-descarga.test.tsx`. Además, usando `Node 20` se ejecutó `npm test -- src/tests/paginas/numerologia.test.tsx` con **5 tests pasando**. El `build` global del frontend sigue fallando por errores previos de `body-graph.tsx`, no por Numerología.

### Como funciona
1. Después del guard clause que separa formulario/carga de resultados, la página ahora fija una referencia tipada a la carta numerológica activa y usa esa misma fuente en todos los handlers y paneles.
2. Los meses personales se normalizan a un array vacío cuando la API no los trae, con lo que la biblioteca del año deja de depender de un optional inseguro.
3. El test ya valida la narrativa nueva de la pantalla, el panel contextual por defecto y el flujo de “Nuevo cálculo”, evitando falsos negativos por seguir apuntando a la UI vieja.

## Sesion: Blindaje de Numerología ante cartas persistidas incompletas
**Fecha:** 2026-03-30 ~17:36 (ARG)

### Que se hizo
Se corrigió el crash de runtime en Numerología cuando una carta guardada llegaba sin `etapas_de_la_vida` u otros arrays auxiliares. La página ahora normaliza esos payloads antes de renderizar y muestra un estado útil cuando faltan los pináculos en vez de romper la ruta.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/numerologia/page.tsx` | Se agregó una normalización defensiva de la carta numerológica, se blindó `obtenerEtapaActiva` con `Array.isArray` y se incorporó un fallback visual para cartas persistidas sin etapas de vida. |
| `frontend/src/componentes/numerologia/panel-contextual-numerologia.tsx` | Se protegió la búsqueda de etapa activa dentro del panel contextual para evitar accesos inseguros a arrays ausentes y mantener estable el panel por defecto. |
| `frontend/src/tests/paginas/numerologia.test.tsx` | Se agregó una prueba de regresión para cartas incompletas y se eliminó una expectativa vieja que ya no coincidía con el nuevo fallback visual. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de corrección. |

### Tests
`eslint` ejecutado sin errores sobre `frontend/src/app/(app)/numerologia/page.tsx`, `frontend/src/componentes/numerologia/panel-contextual-numerologia.tsx` y `frontend/src/tests/paginas/numerologia.test.tsx`. `npm test -- src/tests/paginas/numerologia.test.tsx` no pudo correr en este entorno porque `Vitest 4 / rolldown` requiere una versión de Node con `node:util.styleText`, y la sesión actual sigue en `Node v18.17.1`. También se ejecutó `./node_modules/.bin/tsc --noEmit --pretty false`; el chequeo sigue fallando por errores previos no relacionados en `src/componentes/visualizaciones/body-graph.tsx`, `src/tests/componentes/body-graph.test.tsx` y `src/tests/componentes/sidebar-descarga.test.tsx`.

### Como funciona
1. Cuando la página recibe la carta desde `mis_calculos` o desde un cálculo manual, primero pasa por una normalización que garantiza defaults seguros para números centrales, meses personales, etapas de vida y números maestros.
2. La detección de etapa activa ya no asume que existe un array válido: tanto la página como el panel contextual verifican la estructura antes de llamar a `.find()`.
3. Si la carta persistida no trae pináculos, la ruta sigue mostrando el hero, el núcleo y el ritmo actual, y en el capítulo de etapas aparece un bloque claro que invita a recalcular para regenerar esa parte faltante.

## Sesion: Corrección de z-index en menú de avatar del header
**Fecha:** 2026-03-31 ~08:22 (ARG)

### Que se hizo
Se corrigió el menú desplegable del avatar en el header desktop para que no quede recortado ni por detrás del contenedor principal al abrir las opciones de suscripción y cuenta.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/componentes/layouts/navbar.tsx` | Se cambió el `navbar` a `overflow-visible` y se elevaron las capas (`z-index`) del trigger y del dropdown del avatar para que el menú flote por encima del layout. |
| `context/resumen-de-cambios.md` | Se documentó esta corrección visual. |

### Tests
`eslint` ejecutado sin errores sobre `frontend/src/componentes/layouts/navbar.tsx`.

### Como funciona
1. El `nav` superior ya no recorta el contenido que sobresale verticalmente.
2. El contenedor del avatar y su dropdown usan un nivel de apilado mayor que el resto del header y del contenido principal.
3. Al abrir el menú, las opciones de perfil, suscripción y cierre de sesión se muestran por delante del layout en vez de quedar ocultas detrás del container inferior.

## Sesion: Blindaje runtime de Numerología para datos persistidos incompletos
**Fecha:** 2026-03-30 ~17:36 (ARG)

### Que se hizo
Se corrigió un runtime `Cannot read properties of undefined (reading 'find')` en Numerología cuando la carta persistida venía sin `etapas_de_la_vida`. La ruta ahora normaliza datos incompletos antes de renderizar y el panel contextual también soporta faltantes sin romper.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/numerologia/page.tsx` | Se blindó `obtenerEtapaActiva`, se normalizaron arrays opcionales heredados (`meses_personales`, `etapas_de_la_vida`, `numeros_maestros_presentes`) y se mantuvo el hero/acciones funcionando aunque falten etapas en datos viejos. |
| `frontend/src/componentes/numerologia/panel-contextual-numerologia.tsx` | La vista default ahora tolera ausencia de etapas y muestra fallbacks suaves en los resúmenes en lugar de romper por accesos directos. |
| `frontend/src/lib/tipos/numerologia.ts` | Se marcaron como opcionales los arrays que en datos persistidos antiguos pueden faltar. |
| `frontend/src/tests/paginas/numerologia.test.tsx` | Se agregó un test de regresión para cartas sin `etapas_de_la_vida` y se mantuvo la validación de la experiencia premium. |
| `context/resumen-de-cambios.md` | Se documentó esta reparación de runtime. |

### Tests
Usando `Node 20`, se ejecutó `npm test -- src/tests/paginas/numerologia.test.tsx` con **6 tests pasando**. `tsc --noEmit` ya no reporta errores en Numerología; los únicos errores restantes del frontend siguen siendo ajenos a esta ruta (`body-graph.tsx`, `body-graph.test.tsx` y `sidebar-descarga.test.tsx`).

### Como funciona
1. Si la numerología persistida viene de una versión vieja y no trae etapas o meses personales, la página la normaliza antes de usarla.
2. El cálculo de etapa activa ya no asume `find()` sobre un array existente; primero valida que realmente haya una colección.
3. El panel contextual deja de depender de campos obligatorios duros y muestra lectura parcial segura cuando falta parte del payload histórico.

## Sesion: Unificación premium ciruela de Carta Astral
**Fecha:** 2026-03-31 ~08:38 (ARG)

### Que se hizo
Se rediseñó la sección de Carta Astral para alinearla con el lenguaje visual premium de Podcasts: fondo ciruela continuo, hero más corto y editorial, superficies oscuras consistentes y eliminación de acentos beige/dorado en la lectura principal. También se ajustaron los tests de página para el layout responsive actual.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción de cambios |
|---------|------------------------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Se reemplazó el canvas claro por un fondo ciruela continuo, se oscurecieron shells y paneles, se rehízo el estado inicial con tile de ícono premium y se eliminaron residuos visuales beige/dorados del layout principal. |
| `frontend/src/componentes/carta-natal/estilos.ts` | Se redefinieron las superficies base de Carta Astral para usar glass oscuro premium en lugar de tarjetas claras. |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Se simplificó el hero a una sola columna, se quitó la tarjeta clara lateral y la frase decorativa, y se adoptó el tile con degradé violeta/lila del sistema premium. |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | La tríada pasó a cards oscuras integradas con tiles de signo en degradé y chips consistentes con el nuevo sistema visual. |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Se migraron las tarjetas de planetas a superficies oscuras, con estados seleccionados más claros y sin badges crema/dorados. |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Se reestilizaron los grupos y filas de aspectos con contraste alto sobre fondo oscuro y badges de estado acordes al sistema premium. |
| `frontend/src/componentes/carta-natal/casas-grid.tsx` | Las 12 casas se llevaron al mismo idioma material oscuro, con tiles de signo lilas y chips sin fondos blancos. |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Se adaptaron barras, leyendas y tarjetas de lectura energética al esquema oscuro premium. |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Se reemplazaron los acentos dorados restantes del panel contextual por violetas/lilas para mantener coherencia con la pantalla. |
| `frontend/src/lib/utilidades/interpretaciones-natal.ts` | Se actualizaron las paletas de colores de planetas, aspectos y dignidades para remover tonos marrones/beige y unificar la lectura cromática. |
| `frontend/src/tests/paginas/carta-natal.test.tsx` | Se mockeó `react-resizable-panels` para jsdom y se adaptaron las expectativas al render responsive actual con CTA duplicado entre mobile y desktop. |
| `context/resumen-de-cambios.md` | Se documentó esta sesión de rediseño y validación. |

### Tests
Usando `Node 20`, se ejecutó `npm run lint -- "src/app/(app)/carta-natal/page.tsx" "src/componentes/carta-natal/estilos.ts" "src/componentes/carta-natal/hero-carta.tsx" "src/componentes/carta-natal/seccion-triada.tsx" "src/componentes/carta-natal/planetas-narrativo.tsx" "src/componentes/carta-natal/aspectos-narrativo.tsx" "src/componentes/carta-natal/casas-grid.tsx" "src/componentes/carta-natal/distribucion-energetica.tsx" "src/componentes/carta-natal/panel-contextual.tsx" "src/lib/utilidades/interpretaciones-natal.ts" "src/tests/paginas/carta-natal.test.tsx"` sin errores. También se ejecutó `npm test -- src/tests/paginas/carta-natal.test.tsx` con **4 tests pasando**.

### Como funciona
1. La pantalla de Carta Astral ahora vive sobre una sola atmósfera ciruela, sin cortar la experiencia con slabs claros ni acentos dorados que la empujen a otro sistema visual.
2. El hero resume la lectura en pocas capas: badge, tile astral con degradé, título, una frase guía, chips de Sol/Luna/Ascendente y CTA principal para abrir la rueda bajo demanda.
3. Los capítulos de tríada, planetas, aspectos, casas y distribución energética comparten el mismo material oscuro premium, por lo que la experiencia se siente más consistente, más editorial y más cercana a la cabina visual lograda en Podcasts.

---

## Sesion: Tránsitos planetarios persistidos — ventana deslizante 1 año
**Fecha:** 2026-03-31 ~09:45 (ARG)

### Que se hizo
Se implementó un sistema de persistencia de tránsitos planetarios diarios con ventana deslizante: 365 días hacia adelante + retención de hasta 5 años hacia atrás. Incluye auto-reparación de ventana (no depende de cron), cálculo de aspectos entre planetas en tránsito, y fase lunar por día.

### Backend — Archivos creados
| Archivo | Descripción |
|---------|-------------|
| `app/modelos/transito_diario.py` | Modelo SQLAlchemy `TransitoDiario` con JSONB para planetas y aspectos |
| `alembic/versions/010_transitos_diarios.py` | Migración: tabla + índice único fecha + GIN planetas/aspectos |
| `app/datos/repositorio_transito.py` | Repositorio completo: CRUD, bulk insert ON CONFLICT, rango, purga, estados |
| `app/servicios/servicio_transitos_persistidos.py` | Lógica de cálculo (planetas + aspectos + fase lunar), auto-reparación de ventana, purga |
| `app/tareas/__init__.py` | Init del paquete de tareas programadas |
| `app/tareas/tarea_transitos.py` | Tareas cron: diaria (avanzar ventana) + mensual (purga >5 años) |
| `scripts/cargar_transitos.py` | Script de carga inicial (365 atrás + hoy + 365 adelante) |
| `tests/servicios/test_transitos_persistidos.py` | 30 tests: cálculo, fases, aspectos, ventana, modelo, integración |

### Backend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `app/modelos/__init__.py` | Registra `TransitoDiario` en exports |
| `app/servicios/servicio_transitos.py` | Agrega métodos DB-first (`obtener_transitos_fecha_persistido`, `obtener_transitos_rango_persistido`) sin tocar métodos existentes |

### Tests
30 tests nuevos en `test_transitos_persistidos.py`, todos pasando. Suite completa: 535 passed, 2 failed (pre-existentes podcast/mercadopago), 1 skipped.

### Como funciona
1. La tabla `transitos_diarios` almacena una fila por día con: posiciones de 11 cuerpos celestes (JSONB), aspectos entre planetas del día, fase lunar, y estado (pasado/presente/futuro).
2. `calcular_transito_para_fecha()` usa `ServicioEfemerides` (pyswisseph) a mediodía UTC para calcular planetas, luego calcula aspectos entre todos los pares y la fase lunar.
3. `verificar_y_completar_ventana()` detecta cuántos días faltan para completar la ventana hoy+365 y los rellena automáticamente. Usa `INSERT ON CONFLICT DO NOTHING` para idempotencia.
4. Los métodos `*_persistido` en `ServicioTransitos` buscan primero en DB; si no encuentran, calculan en vivo y persisten (fallback transparente).
5. El script de carga inicial precalculó 731 días (365 atrás + hoy + 365 adelante) en 0.3 segundos.
6. La auto-reparación garantiza que la ventana se completa al primer request tras N días sin cron (ideal para desarrollo local).

---

## Sesion: Scoring temporal + eventos notables + detector intent para el oráculo
**Fecha:** 2026-03-31 ~11:10 (ARG)

### Que se hizo
Se implementó el sistema completo de consultas temporales del oráculo: detector de intent (regex), eventos notables pre-calculados (comparación día N vs N-1), scoring determinista de 3 capas (astrológico 55% + numerológico con resonancia de perfil 30% + eventos 15%), ranking por días o meses, y formateo de resumen compacto para inyección al prompt de Claude. El oráculo ahora puede responder "¿cuál es el mejor día/mes para X?" con datos reales.

### Backend — Archivos creados
| Archivo | Descripción |
|---------|-------------|
| `alembic/versions/011_eventos_transitos.py` | Migración: columna `eventos` JSONB en `transitos_diarios` |
| `app/oraculo/detector_intent.py` | Detector de intent temporal: ventana, granularidad, área de vida (regex, sin IA) |
| `app/oraculo/scorer_transitos.py` | Scorer determinista: astro (casas+planetas natales), numero (resonancia perfil), eventos; ranking días/meses; formateador de resumen |
| `scripts/backfill_eventos.py` | Script de backfill de eventos para las 731 filas existentes |
| `tests/servicios/test_detector_intent.py` | 20 tests: detección básica, ventanas, áreas |
| `tests/servicios/test_scorer_transitos.py` | 16 tests: scores individuales, ponderación, ranking, formateador |
| `tests/servicios/test_eventos_notables.py` | 8 tests: cambios de signo, retrogradaciones, aspectos exactos, fases |
| `context/criterio-chatbot.md` | Documento de criterios completo del chatbot oráculo |

### Backend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `app/modelos/transito_diario.py` | Agrega campo `eventos` JSONB nullable |
| `app/servicios/servicio_transitos_persistidos.py` | Agrega función `calcular_eventos()` (comparación día N vs N-1) |
| `app/servicios/servicio_oraculo.py` | Agrega `_generar_analisis_temporal()`, acepta `sesion` en `consultar()`, inyecta scoring al prompt |
| `app/servicios/bot_telegram.py` | Pasa `sesion` al oráculo |
| `app/rutas/v1/chat.py` | Pasa `sesion=db` al oráculo |
| `app/oraculo/system_prompt.md` | Agrega sección de instrucciones para consultas temporales |
| `claude.md` | Registra `criterio-chatbot.md` en tabla de archivos de contexto |

### Tests
44 tests nuevos (20 detector + 16 scorer + 8 eventos), todos pasando. Suite completa: 580 passed, 1 failed (pre-existente mercadopago), 1 skipped.

### Como funciona
1. Cuando el usuario pregunta "¿cuál es el mejor día para viajar en junio?", el detector de intent (regex puro) extrae: ventana=junio, área=viajes, granularidad=día.
2. Se consultan los tránsitos de junio desde la DB (ya precalculados con planetas, aspectos y eventos notables).
3. Para cada día se calcula un score ponderado: (a) score astrológico cruzando tránsitos con casas y planetas natales del usuario, (b) score numerológico con resonancia entre día personal y sendero de vida/expresión/alma, (c) score de eventos con bonus/penalty por fases lunares, retrogradaciones y cambios de signo.
4. Se genera un ranking (top 5 días + días a evitar) formateado en ~400 tokens.
5. Este resumen se inyecta como sección adicional en el system prompt de Claude.
6. Claude interpreta los datos deterministas y responde en lenguaje natural, en máximo 3 líneas, conectando con el perfil personal del usuario.
7. Todo el scoring es determinista (sin IA, sin tokens). Claude solo interviene al final para humanizar la respuesta.

---

## Sesion: Ajuste estructural de Carta Astral — hero limpio y rail contextual fijo
**Fecha:** 2026-03-31 ~11:47 (ARG)

### Que se hizo
Se simplificó la experiencia desktop de Carta Astral para alinearla mejor con la referencia `ui-ciruela`: se eliminó la acción de nuevo cálculo dentro del hero, se quitó el contenedor padre redondeado que envolvía toda la pantalla y se reemplazó el split resizable por un rail contextual fijo más liviano.

### Frontend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Elimina `react-resizable-panels`, remueve la lógica de `Nuevo cálculo`, abre el layout desktop sobre el fondo y reemplaza el split view por una grilla con rail derecho fijo |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Quita el botón `Nuevo cálculo` y deja el hero con un único CTA de consulta para la rueda natal |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Agrega modo `movil/escritorio`, compacta tipografía y tarjetas, y reemplaza las grillas rígidas de 3 columnas por grillas adaptativas para evitar que el rail derecho se rompa |

### Tests
Sin tests nuevos ni modificados. `eslint` pasó sobre `page.tsx`, `hero-carta.tsx` y `panel-contextual.tsx`. `vitest` no se ejecutó por la incompatibilidad conocida del entorno con Node `v18.17.1`.

### Como funciona
1. La experiencia principal de Carta Astral mantiene la rueda fuera del lienzo y deja un solo CTA de consulta: `Ver rueda natal`.
2. En desktop, el contenido central ya no vive dentro de un shell con borde redondeado; ahora respira directamente sobre el fondo ciruela en una composición abierta similar a Podcasts.
3. El panel derecho ya no depende de un separador resizable. Queda como un rail fijo, con scroll propio y proporción más estable.
4. Las vistas internas del panel contextual ahora usan métricas adaptativas en lugar de grillas rígidas, por lo que planeta, casa, aspecto y tríada ya no colapsan visualmente en ancho angosto.

---

## Sesion: Rail lateral compartido y compactación premium de Carta Astral
**Fecha:** 2026-03-31 ~12:31 (ARG)

### Que se hizo
Se llevó `Carta Astral` a un patrón más sistémico: se creó un rail lateral compartido inspirado en la transcripción de Podcasts, se reutilizó también en el panel de lyrics para unificar lenguaje visual, y se compactó el primer viewport de la carta para que entregue valor antes y con menos masa visual.

### Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/rail-lateral.tsx` | Nuevo shell lateral compartido con header fino, blur, borde izquierdo y soporte para modo fijo u overlay |
| `frontend/src/componentes/layouts/panel-lyrics.tsx` | Migra la transcripción de podcasts al nuevo shell compartido y limpia la animación de montaje |
| `frontend/src/app/(app)/carta-natal/page.tsx` | Reemplaza la columna lateral actual por el rail compartido y usa metadata contextual dinámica en el header del panel |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Expone metadata de encabezado para el rail, oculta cabeceras internas en desktop y mantiene la lectura contextual con scroll independiente |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reduce la altura del hero, recupera una síntesis más valiosa con `generarEsencia` y deja una entrada más compacta |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | Compacta las tarjetas de Sol, Luna y Ascendente para reducir altura y mover el peso explicativo al rail lateral |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Compacta el bloque de pulso dominante y reduce la densidad editorial de la lectura rápida |

### Tests
Sin tests nuevos ni modificados. `eslint` pasó sobre `page.tsx`, `hero-carta.tsx`, `panel-contextual.tsx`, `seccion-triada.tsx`, `distribucion-energetica.tsx`, `rail-lateral.tsx` y `panel-lyrics.tsx`. `vitest` no se ejecutó por la incompatibilidad conocida del entorno con Node `v18.17.1`.

### Como funciona
1. En desktop, `Carta Astral` ahora reserva una banda lateral fija que mantiene scroll independiente y usa el mismo lenguaje material que la transcripción de Podcasts.
2. El header del rail cambia según lo que el usuario selecciona: planeta, aspecto, casa o tríada, evitando duplicar jerarquías dentro del panel.
3. El contenido principal gana aire útil porque el hero se reduce y las tarjetas de la tríada y del pulso dominante dejan de cargar tanta explicación embebida.
4. El patrón resultante queda listo para reutilizarse en `Diseño Humano` y `Numerología`, sin volver a inventar otro tipo de side panel.

---

## Sesion: Corrección visual fuerte de Carta Astral tras revisión en pantalla
**Fecha:** 2026-03-31 ~13:13 (ARG)

### Que se hizo
Se ajustó `Carta Astral` después de revisar la captura real de la interfaz. El objetivo fue hacer más evidente la reducción del hero, compactar de verdad las cards del primer viewport y secar el estado default del rail derecho para que deje de verse como una columna de tarjetas grandes.

### Frontend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/rail-lateral.tsx` | Reduce el ancho fijo del rail para devolver más aire al contenido central |
| `frontend/src/app/(app)/carta-natal/page.tsx` | Amplía el ancho máximo útil del contenido central para evitar cortes innecesarios en el hero |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reordena el hero a una cabecera más lineal, evita el título partido y elimina peso lateral innecesario |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | Elimina el párrafo descriptivo dentro de cada card y reduce padding/íconos para una tríada más compacta |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Simplifica todavía más el bloque de pulso dominante y reduce su masa editorial |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Replantea el estado default desktop del rail para que se lea como panel utilitario y no como mini-página |

### Tests
Sin tests nuevos ni modificados. `eslint` pasó sobre `page.tsx`, `hero-carta.tsx`, `seccion-triada.tsx`, `distribucion-energetica.tsx`, `panel-contextual.tsx` y `rail-lateral.tsx`. `vitest` no se ejecutó por la incompatibilidad conocida del entorno con Node `v18.17.1`.

### Como funciona
1. El hero ahora entra más rápido en valor: identidad de la pantalla, síntesis breve, chips base y CTA, sin dividir el ancho en una composición que rompía el título.
2. Las cards de Sol, Luna y Ascendente dejan la explicación larga afuera y funcionan como puntos de entrada compactos al rail contextual.
3. El bloque de pulso dominante queda más corto y deja el desarrollo interpretativo al panel derecho.
4. El estado default del rail derecho se vuelve más seco y de sistema, con indicaciones y resúmenes breves en lugar de una gran tarjeta introductoria.

---

## Sesion: Corrección estructural del rail separado en Carta Astral
**Fecha:** 2026-03-31 ~13:26 (ARG)

### Que se hizo
Se corrigió el problema estructural que impedía que el panel derecho de `Carta Astral` se comportara como un rail realmente separado. El scroll maestro del layout desktop dejó de gobernar esa ruta y el control del desplazamiento pasó a los contenedores internos de la pantalla.

### Frontend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/layout-app.tsx` | Detecta la ruta de `Carta Astral` y desactiva el `overflow-y-auto` global del `<main>` para que la página pueda manejar scroll principal y rail de forma independiente |
| `frontend/src/app/(app)/carta-natal/page.tsx` | Hace scrollable los estados desktop de carga y cálculo manual para mantener coherencia una vez removido el scroll maestro del layout |

### Tests
Sin tests nuevos ni modificados. `eslint` pasó sobre `layout-app.tsx` y `page.tsx`. `vitest` no se ejecutó por la incompatibilidad conocida del entorno con Node `v18.17.1`.

### Como funciona
1. En desktop, la ruta `Carta Astral` ya no hereda el scroll general del `<main>` del layout de aplicación.
2. El contenido central de la carta mantiene su propio scroll vertical dentro de la columna principal.
3. El rail derecho conserva su scroll independiente y deja de desplazarse como si fuera simplemente otra parte del lienzo.
4. Los estados sin datos y de carga también siguen siendo navegables porque ahora tienen scroll interno explícito dentro de la propia página.

---

## Sesion: Ajuste de altura útil y cabecera en Carta Astral
**Fecha:** 2026-03-31 ~13:34 (ARG)

### Que se hizo
Se corrigió el problema por el cual el scroll de `Carta Astral` seguía sin responder correctamente en desktop después del cambio de rail, y se estabilizó el encabezado del hero para que no se rompa visualmente cuando convive con el panel derecho.

### Frontend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/layout-app.tsx` | Agrega `min-h-0` y `min-w-0` al `<main>` para garantizar que el scroll anidado pueda funcionar dentro del layout desktop |
| `frontend/src/app/(app)/carta-natal/page.tsx` | Reemplaza la base de `FONDO_PAGINA` por una versión con `h-full/min-h-0` en desktop y ajusta el contenedor principal para heredar altura útil real |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reordena el encabezado del hero para separar mejor título y metadata y evitar quiebres visuales con anchos intermedios |

### Tests
Sin tests nuevos ni modificados. `eslint` pasó sobre `layout-app.tsx`, `page.tsx` y `hero-carta.tsx`. `vitest` no se ejecutó por la incompatibilidad conocida del entorno con Node `v18.17.1`.

### Como funciona
1. El layout global ahora permite que `Carta Astral` se encoja correctamente dentro del viewport desktop, en lugar de forzar una altura ambigua que anulaba el scroll interno.
2. La pantalla de la carta hereda una altura útil completa en desktop y puede repartirla entre la columna principal y el rail contextual.
3. El scroll vuelve a responder dentro del contenido central sin depender del `<main>` global de la aplicación.
4. El hero deja de mezclar título y metadata en una misma línea flexible, por lo que el encabezado se mantiene estable junto al rail derecho.

---

## Sesion: Distribución energética interactiva con lectura contextual
**Fecha:** 2026-03-31 ~13:52 (ARG)

### Que se hizo
Se rediseñó la sección `Distribución energética` para que deje de funcionar como bloque descriptivo estático y pase a ser una superficie interactiva de lectura. Ahora los resúmenes, elementos y modalidades son clickeables y cada selección abre una explicación personalizada en el rail derecho.

### Frontend — Archivos modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Reemplaza párrafos largos por tarjetas y píldoras clickeables, compacta la composición y conecta cada punto con el panel contextual |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Agrega nuevos estados contextuales para `pulso`, `elementos`, `modalidades`, `elemento` y `modalidad`, con explicaciones generales y lecturas personalizadas basadas en la distribución real del usuario |
| `frontend/src/componentes/layouts/rail-lateral.tsx` | Incorpora transición suave de fade/slide entre contenidos del rail cuando cambia la selección |
| `frontend/src/app/(app)/carta-natal/page.tsx` | Conecta la nueva selección energética con el estado contextual de la página y le pasa al rail una clave de transición |

### Tests
Sin tests nuevos ni modificados. `eslint` pasó sobre `page.tsx`, `distribucion-energetica.tsx`, `panel-contextual.tsx` y `rail-lateral.tsx`. `vitest` no se ejecutó por la incompatibilidad conocida del entorno con Node `v18.17.1`.

### Como funciona
1. La sección `Distribución energética` ya no desarrolla explicaciones largas dentro de las cards: muestra títulos breves, barras y píldoras con foco en selección.
2. Al hacer clic en `Pulso dominante`, `Elementos`, `Modalidades` o en una píldora puntual como `Fuego` o `Cardinal`, el panel derecho cambia de contexto.
3. El rail ahora explica primero qué es esa capa astrológica y luego cómo se expresa específicamente en la carta del usuario según cantidad de planetas, peso relativo y focos activadores.
4. El cambio de contenido del rail se acompaña con una transición suave de salida y entrada para que la lectura se sienta menos brusca y más consistente con el patrón premium de ASTRA.

---

## Sesion: Rediseño premium de Perfil y preparación del plan Max
**Fecha:** 2026-04-01 ~04:42 (ARG)

### Que se hizo
Se rediseñó la pantalla `Perfil` con el lenguaje premium ciruela de ASTRA, reduciendo ruido visual y dejando sólo la información básica y útil para el usuario. Además se preparó el sistema de planes para convivir con `Free`, `Premium` y `Max`, sin definir todavía el acceso comercial de `Max`.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/perfil/page.tsx` | Reemplaza el layout utilitario por una composición premium limpia con hero breve, resumen de cuenta, datos base, accesos, Oráculo Telegram y bloque de privacidad |
| `frontend/src/app/(app)/suscripcion/page.tsx` | Agrega visualización de tres planes (`Free`, `Premium`, `Max`), adapta copies a plan pago genérico y deja `Max` como opción visible en estado próximo |
| `frontend/src/componentes/layouts/navbar.tsx` | Ajusta la lectura visual del plan del usuario para usar `Free / Premium / Max` y trata `Max` como plan pago |
| `frontend/src/componentes/ui/bloqueo-premium.tsx` | Cambia el gating para considerar `Premium` y `Max` como planes pagos y actualiza el copy del bloqueo |
| `frontend/src/lib/utilidades/planes.ts` | Centraliza helpers de frontend para etiquetas, frases y detección de planes pagos |
| `frontend/src/tests/paginas/perfil.test.tsx` | Actualiza mocks y asserts a la nueva experiencia de Perfil |
| `frontend/src/tests/paginas/suscripcion.test.tsx` | Ajusta pruebas a la presencia de `Free`, `Premium` y `Max` |
| `backend/app/utilidades/planes.py` | Incorpora helpers comunes para jerarquía de planes y detección de planes pagos |
| `backend/app/dependencias_suscripcion.py` | Reemplaza la verificación rígida por una comparación por nivel de plan |
| `backend/app/configuracion_features.py` | Hace que los features pagos también queden habilitados para `Max` |
| `backend/app/rutas/v1/chat.py` | Considera `Max` como plan pago para el acceso al chat/oráculo web |
| `backend/app/rutas/v1/suscripcion.py` | Generaliza respuestas y validaciones para planes pagos, sin asumir sólo `Premium` |
| `backend/app/servicios/bot_telegram.py` | Habilita el Oráculo Telegram para `Premium` y `Max` |

### Tests
Se modificaron 2 suites frontend y se validó el flujo de planes también en backend. Pasaron `17/17` tests de `vitest` (`perfil` y `suscripción`) y `56/56` tests de `pytest` (`chat` y `suscripción`). `eslint` pasó sobre los archivos tocados del frontend.

### Como funciona
1. La pantalla `Perfil` ahora arranca con un hero corto que muestra sólo identidad de cuenta, plan activo y estado general, sin títulos redundantes ni bloques administrativos repetidos.
2. Los datos de nacimiento quedaron como bloque principal y editable, porque son la base de todas las cartas; el resto de la pantalla funciona como soporte de acceso y seguridad.
3. La sección de suscripción ya expone tres niveles visibles (`Free`, `Premium` y `Max`), pero `Max` se muestra como próximo para no inventar todavía su modalidad de compra.
4. Todo el sistema de gating dejó de depender de la comparación estricta con `premium`, por lo que cuando `Max` se active formalmente va a heredar el acceso pago sin tener que rehacer la lógica central.

---

## Sesion: Confirmación tipada en Perfil y refinamiento premium de Suscripción
**Fecha:** 2026-04-01 ~05:05 (ARG)

### Que se hizo
Se achicó y limpió el hero de `Perfil`, se eliminó copy redundante y se agregó una confirmación tipada antes de guardar cambios de nacimiento. Además, la sección de `Suscripción` y `Facturación` se rediseñó con el mismo lenguaje glass ciruela para que ya no conviva con un layout genérico anterior.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/perfil/page.tsx` | Reduce la escala del título principal, elimina textos de relleno y agrega un modal premium de confirmación que exige escribir `editar` antes de persistir cambios |
| `frontend/src/app/(app)/suscripcion/page.tsx` | Rehace hero, resumen, cards de planes, estado de suscripción y lista de facturación bajo superficies ciruela integradas |
| `frontend/src/tests/paginas/perfil.test.tsx` | Ajusta el flujo de guardado al nuevo modal de confirmación y agrega cobertura para el diálogo |
| `frontend/src/tests/paginas/suscripcion.test.tsx` | Actualiza asserts al nuevo layout premium, donde algunos textos se repiten entre hero y paneles |

### Tests
`eslint` pasó sobre `perfil/page.tsx`, `suscripcion/page.tsx`, `perfil.test.tsx` y `suscripcion.test.tsx`. `vitest` pasó `18/18` en las suites de perfil y suscripción.

### Como funciona
1. En `Perfil`, el usuario ya no guarda cambios de nacimiento de forma directa: primero ve un modal glass ciruela que explica el impacto de la edición y debe escribir `editar` para confirmar.
2. El hero de `Perfil` queda más seco y útil: nombre, email, plan y estados, sin párrafos que repitan lo evidente.
3. `Suscripción` ahora arranca con un hero premium de cuenta y facturación, muestra las capas `Free`, `Premium` y `Max` con cards consistentes y deja el estado actual en un panel separado y claro.
4. `Facturación` deja la tabla administrativa y pasa a una lista premium más legible, con monto, estado, método y acceso directo al PDF cuando corresponde.

---

## Sesion: Diseño Humano alineado al patrón premium de Carta Astral
**Fecha:** 2026-04-01 ~05:09 (ARG)

### Que se hizo
Se refactorizó la pantalla de `Diseño Humano` para que adopte la misma lógica visual y estructural de `Carta Astral`: hero más compacto, rail contextual fijo en desktop, bottom sheet en mobile y `Body Graph` relegado a un modal de consulta bajo demanda.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Reestructura toda la página al patrón de `Carta Astral`, elimina el protagonismo del `Body Graph`, mueve el gráfico a un modal, compacta el hero y oscurece las superficies al lenguaje `ui-ciruela` |
| `frontend/src/componentes/diseno-humano/panel-contextual.tsx` | Reescribe el panel contextual HD para que renderice contenido dentro del `RailLateral`, agrega helpers de metadata/clave y unifica la materialidad oscura del panel |
| `frontend/src/componentes/layouts/layout-app.tsx` | Extiende el layout con rail separado para la ruta `/diseno-humano`, de modo que el contenido y el panel tengan scroll independiente |
| `frontend/src/tests/paginas/diseno-humano.test.tsx` | Ajusta la suite al nuevo hero y cubre la apertura del `Body Graph` en modal desde el CTA dedicado |

### Tests
`eslint` pasó sobre `diseno-humano/page.tsx`, `componentes/diseno-humano/panel-contextual.tsx`, `componentes/layouts/layout-app.tsx` y `tests/paginas/diseno-humano.test.tsx`. `vitest` pasó `4/4` en `diseno-humano.test.tsx`.

### Como funciona
1. En desktop, `Diseño Humano` ahora comparte el mismo patrón de layout que `Carta Astral`: columna principal con scroll propio y rail contextual fijo a la derecha.
2. El hero deja de usar el `Body Graph` como protagonista; ahora presenta la lectura, deja chips de entrada para `Tipo`, `Autoridad`, `Perfil` y `Definición`, y ofrece `Ver Body Graph` como CTA de consulta.
3. El `Body Graph` ya no domina el lienzo principal: se abre desde un modal oscuro y premium, como artefacto visual secundario.
4. Centros, canales, activaciones y cruz de encarnación siguen siendo clickeables, pero la explicación larga y personalizada vive en el panel derecho, no dentro de las cards del contenido.

---

## Sesion: Limpieza del estado actual en Suscripción
**Fecha:** 2026-04-01 ~05:28 (ARG)

### Que se hizo
Se eliminó la tarjeta redundante de “Estado actual” en `Suscripción`, se renombró el panel del hero a “Mi suscripción” y se adelantó la acción de cancelación para que aparezca antes del bloque de facturación.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/suscripcion/page.tsx` | Quita el panel duplicado de estado, relabela el resumen del hero como `Mi suscripción`, reubica la cancelación antes de facturación y limpia una variable sin uso |
| `frontend/src/tests/paginas/suscripcion.test.tsx` | Ajusta la expectativa del hero al nuevo rotulado `Mi suscripción` |

### Tests
`eslint` pasó sobre `suscripcion/page.tsx` y `suscripcion.test.tsx`. `vitest` pasó `5/5` en `suscripcion.test.tsx`.

### Como funciona
1. El hero de `Suscripción` sigue mostrando el estado clave de la cuenta, pero el panel lateral deja de llamarse `Resumen` y pasa a reflejar mejor el contenido con `Mi suscripción`.
2. La página ya no repite el mismo estado en una tarjeta adicional, por lo que el flujo queda más limpio y directo.
3. Si el usuario tiene un plan pago, la gestión de cancelación aparece antes del historial de facturas; primero decide sobre su plan y después revisa cobros y comprobantes.

---

## Sesion: Corrección del badge de hoy en la semana del dashboard
**Fecha:** 2026-04-01 ~07:31 (ARG)

### Que se hizo
Se corrigió el recorte visual de la tarjeta marcada como `Hoy` dentro del carrusel semanal del dashboard. El ajuste agrega respiración vertical al contenedor scrolleable para que el badge no choque contra el recorte implícito del `overflow-x-auto`.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/semana-v2.tsx` | Agrega padding superior y lateral al carrusel semanal y al esqueleto de carga para que el badge `Hoy` no se vea cortado |

### Tests
`eslint` pasó sobre `semana-v2.tsx`. La suite `dashboard.test.tsx` sigue fallando por asserts viejos de textos previos a la UI actual (`Clima Cósmico`, `Momentos del Día`, etc.), sin relación con este ajuste puntual.

### Como funciona
1. El carrusel semanal conserva el badge flotante `Hoy`, pero ahora tiene espacio interno suficiente para renderizarlo completo.
2. El estado de carga usa el mismo padding, evitando saltos de altura entre esqueleto y contenido real.

---

## Sesion: Auto-scroll semanal orientado a días futuros
**Fecha:** 2026-04-01 ~07:34 (ARG)

### Que se hizo
Se agregó auto-scroll al carrusel de la semana en el dashboard para que, desde miércoles en adelante, abra desplazado hacia la derecha y priorice la visualización de los días venideros.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/semana-v2.tsx` | Agrega un `ref` al carrusel y una lógica de `requestAnimationFrame` que lo posiciona al final cuando el día actual no es lunes ni martes |
| `frontend/src/tests/componentes/semana-v2.test.tsx` | Nueva cobertura para verificar que el carrusel abre a la derecha en miércoles y se mantiene al inicio en lunes |

### Tests
`eslint` pasó sobre `semana-v2.tsx` y `semana-v2.test.tsx`. `vitest` pasó `2/2` en `semana-v2.test.tsx`.

### Como funciona
1. Si el usuario entra al dashboard en lunes o martes, el carrusel semanal permanece al inicio.
2. Si entra cualquier otro día, el carrusel se desplaza automáticamente hacia la derecha para mostrar mejor el tramo final de la semana y los próximos días.
3. Cuando se cambia a “siguiente semana”, el carrusel vuelve a abrir desde el inicio, porque toda esa vista ya es futura por definición.

---

## Sesion: Menú premium de podcasts en el header
**Fecha:** 2026-04-01 ~07:56 (ARG)

### Que se hizo
Se reemplazó el CTA rápido `Escuchar día` del header por un botón premium con menú contextual para `día`, `semana` y `mes`. Además, cuando cualquier podcast está en generación, el botón ahora muestra una animación mágica localizada en el navbar para hacer visible el proceso sin sacar al usuario de la pantalla actual.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/navbar.tsx` | Convierte el CTA del header en un disparador de menú contextual, agrega acciones por tipo de podcast, reproduce si el episodio está listo, genera si falta y refleja el estado de preparación en tiempo real |
| `frontend/src/app/globals.css` | Agrega keyframes y estilos para el aura, órbita y destello del nuevo botón mágico de podcasts en el header |
| `frontend/src/tests/componentes/navbar.test.tsx` | Nueva cobertura para validar apertura del menú con `día / semana / mes` y el estado ocupado del botón cuando hay audio en generación |

### Tests
`eslint` pasó sobre `navbar.tsx` y `navbar.test.tsx`. `vitest` pasó `2/2` en `navbar.test.tsx`.

### Como funciona
1. El botón del header deja de ejecutar una sola acción y pasa a abrir un menú contextual con tres opciones: `Día de hoy`, `Tu semana cósmica` y `Tu mes cósmico`.
2. Si el episodio elegido ya existe, el menú lo reproduce o lo continúa; si todavía no existe, lo genera desde ahí mismo.
3. Si algún podcast está en `generando_guion` o `generando_audio`, el botón del navbar entra en estado mágico: glow ciruela, órbita suave y destello activo, además del texto `Preparando audio`.
4. Si el usuario no tiene un plan pago y toca una opción aún no disponible, el flujo lo deriva a `Suscripción` en vez de disparar una generación que no podría completar.
