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

---

## Sesion: Compactación del menú de podcasts del header
**Fecha:** 2026-04-01 ~08:24 (ARG)

### Que se hizo
Se redujo la densidad visual del menú contextual de podcasts en el header: se eliminó el bloque explicativo superior, se quitaron las descripciones redundantes de cada capa y el trigger dejó de mostrar el texto `Escuchar` para pasar a una versión más compacta basada en icono.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/navbar.tsx` | Hace el menú más angosto y compacto, elimina la cabecera explicativa, quita descripciones de `día / semana / mes`, reduce los items y reemplaza la acción textual `Escuchar` por controles iconográficos |

### Tests
`eslint` pasó sobre `navbar.tsx` y `navbar.test.tsx`. `vitest` pasó `2/2` en `navbar.test.tsx`.

### Como funciona
1. El disparador de podcasts del header mantiene el menú contextual, pero visualmente ya no depende de una etiqueta textual grande; queda resuelto con icono y caret.
2. El menú ya no muestra párrafos explicativos ni subtítulos por capa, solo el nombre de cada podcast y su estado útil.
3. Las acciones listas para reproducir quedan representadas con ícono play, haciendo la interacción más directa y menos cargada.

---

## Sesion: Carta Astral como consola compacta premium
**Fecha:** 2026-04-02 ~12:31 (ARG)

### Que se hizo
Se actualizó `claude.md` con el nuevo criterio de diseño premium compacto y se rediseñó la pantalla de Carta Astral para que deje de leerse como una página de secciones y pase a funcionar como una consola de lectura: hero breve, barra de anclas, bloques densos y menos texto redundante.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `claude.md` | Incorpora el criterio de “consola de lectura” con reglas de artefactos compactos, menor redundancia y panel derecho como lugar de explicación |
| `frontend/src/app/(app)/carta-natal/page.tsx` | Reorganiza la pantalla con hero compacto, barra de anclas, layout por superficies densas y navegación rápida con anclas separadas para mobile y desktop |
| `frontend/src/componentes/carta-natal/barra-anclas.tsx` | Nuevo componente de acceso rápido para saltar entre tríada, pulso, planetas, aspectos y casas |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Ajusta el hero a un formato más corto y editorial, con CTA de rueda más sobrio y resumen técnico compacto |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | Elimina encabezados grandes y convierte la tríada en una superficie compacta de tres anclas semánticas |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Reconvierte la distribución energética en un bloque de pulso más denso, sin títulos de capítulo ni tarjetas altas redundantes |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Saca la narrativa larga del centro y deja a los planetas como focos técnicos compactos que delegan la explicación al panel derecho |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Colapsa los grupos de aspectos en una lista más compacta, con badges y estados útiles sin tarjetas intermedias |
| `frontend/src/componentes/carta-natal/casas-grid.tsx` | Reduce la escala visual de las casas y las convierte en una matriz compacta más eficiente en viewport |
| `frontend/src/tests/paginas/carta-natal.test.tsx` | Actualiza la suite a la nueva CTA `Rueda natal` y mantiene cobertura sobre carga, datos persistidos y apertura del modal |

### Tests
`eslint` pasó sobre los archivos tocados de Carta Astral. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/carta-natal.test.tsx`.

### Como funciona
1. La pantalla abre con un hero corto y una barra de anclas que permite saltar a `Tríada`, `Pulso`, `Planetas`, `Aspectos` y `Casas` sin gastar viewport en títulos de capítulo.
2. El bloque central muestra estructura y selección: la tríada, la distribución energética, los planetas, los aspectos y las casas quedan condensados en superficies compactas, con menos texto y mayor densidad útil.
3. Toda la profundidad sigue viviendo en el panel derecho contextual, por lo que el centro ya no repite interpretación larga ni explicación técnica redundante.
4. La rueda natal permanece disponible como artefacto secundario en modal, para consulta puntual sin volver a dominar la interfaz principal.

---

## Sesion: Reorientación de Carta Astral según el patrón de Numerología
**Fecha:** 2026-04-02 ~13:11 (ARG)

### Que se hizo
Se rehízo la última iteración de Carta Astral porque la versión anterior seguía viéndose fragmentada y demasiado mecánica. La pantalla ahora toma como referencia directa a `Numerología`: hero editorial, columna central limpia, exploración tabulada y panel derecho útil desde el estado inicial.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Reestructura la pantalla para que funcione como una experiencia lineal: hero, tríada, pulso y explorador con tabs para `planetas / aspectos / casas` |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reemplaza el hero anterior por una versión más cercana a Numerología: una sola tesis principal, chips breves y CTA de rueda sin cajas extras |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | Convierte la tríada en una lista editorial de tres filas en lugar de tres tarjetas independientes |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Simplifica `Pulso` a una consola de tres celdas (`pulso`, `elemento`, `modalidad`) sin subtarjetas internas |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Pasa de una grilla de tarjetas a una lista densa más alineada con el patrón de lectura de Numerología |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Aplana los aspectos en una lista única, con menos envoltorios y mejor lectura jerárquica |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Rehace la vista default del panel derecho para que empiece con una guía útil y resúmenes de `Sol`, `Luna`, `Ascendente` y `Pulso` |
| `frontend/src/tests/paginas/carta-natal.test.tsx` | Mantiene cobertura de CTA, carga y modal sobre la nueva composición |
| `context/resumen-de-cambios.md` | Registra esta segunda iteración visual |

### Tests
`eslint` pasó sobre la pantalla y componentes tocados. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/carta-natal.test.tsx`.

### Como funciona
1. La pantalla de Carta Astral ya no depende de una barra de anclas ni de bloques visuales excesivos; arranca con un hero corto y una tesis principal basada en la tríada.
2. La columna central se organiza en cuatro pasos claros: `Tríada`, `Pulso` y un explorador tabulado que deja elegir entre `Planetas`, `Aspectos` y `Casas` sin apilar todo al mismo tiempo.
3. Cada fila o celda sigue siendo clickeable y alimenta el panel derecho, donde vive la explicación general y la interpretación específica de ese punto.
4. El panel contextual también quedó alineado con Numerología: en estado vacío ya ofrece una lectura inicial útil en vez de repetir instrucciones o mostrar bloques genéricos.

---

## Sesion: Carta Astral — reducción de chips y superficies anidadas
**Fecha:** 2026-04-02 ~16:46 (ARG)

### Que se hizo
Se hizo una pasada de refinamiento sobre Carta Astral para bajar la escala visual, sacar pills innecesarias y limpiar contenedores anidados. El objetivo fue mantener el layout que ya funcionaba, pero con una lectura más compacta y menos “UI encima de UI”.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Limpia el bloque explorador: saca encabezado redundante y elimina un contenedor interno extra para que tabs y contenido respiren sobre la misma superficie |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reduce el tamaño del H1, reemplaza los chips de `Sol/Luna/Asc` por una línea textual compacta y acorta la bajada |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | Quita la caja interna de la tríada y reemplaza chips por metadata lineal más sobria |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Elimina la superficie duplicada dentro del bloque de pulso, baja la escala tipográfica y compacta `elemento/modalidad` |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Reemplaza badges y chips por metadatos en línea para que cada planeta ocupe menos alto visual |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Simplifica la cabecera de cada aspecto y reduce el chrome de badges decorativos |
| `frontend/src/componentes/carta-natal/casas-grid.tsx` | Cambia los chips inferiores por una línea de metadata compacta y ajusta tamaños |
| `context/resumen-de-cambios.md` | Documenta esta pasada de limpieza visual |

### Tests
`eslint` pasó sobre la página y componentes tocados. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/carta-natal.test.tsx`.

### Como funciona
1. El hero sigue marcando la entrada a la experiencia, pero ahora lo hace con una tesis más corta y una sola línea técnica en vez de tres chips compitiendo.
2. La tríada, el pulso y el explorador usan menos superficies internas, así que la columna central se siente más liviana y continua.
3. Planetas, aspectos y casas siguen siendo interactivos, pero ocupan menos alto porque su metadata pasó de pills a líneas compactas.
4. El panel derecho conserva la profundidad interpretativa, por lo que el centro puede sostener una lectura más limpia sin perder información útil.

---

## Sesion: Carta Astral — pulso unificado y escala reducida
**Fecha:** 2026-04-02 ~17:22 (ARG)

### Que se hizo
Se compactó aún más el bloque energético de Carta Astral. `Pulso dominante`, `Elemento` y `Modalidad` dejaron de verse como piezas separadas y pasaron a una sola unidad visual, con el valor principal mucho más chico para que no robe protagonismo al resto de la pantalla.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Unifica `pulso`, `elemento` y `modalidad` en una sola superficie; reduce la escala de `Fuego + Cardinal` y convierte los secundarios en una continuación del mismo artefacto |
| `context/resumen-de-cambios.md` | Documenta esta pasada puntual sobre jerarquía visual |

### Tests
`eslint` pasó sobre `distribucion-energetica.tsx`, `page.tsx` y la suite de página. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/carta-natal.test.tsx`.

### Como funciona
1. El bloque energético ahora entra como una sola lectura compacta en vez de tres tarjetas visualmente autónomas.
2. `Pulso dominante` sigue siendo el punto principal, pero el valor se ve más contenido y ya no compite con el hero ni con la tríada.
3. `Elemento` y `Modalidad` siguen siendo clickeables para abrir su lectura en el panel derecho, pero quedaron integrados debajo del pulso como continuación natural del mismo sistema.

---

## Sesion: Carta Astral — hero y aspectos más directos
**Fecha:** 2026-04-02 ~17:28 (ARG)

### Que se hizo
Se limpió el hero de Carta Astral para que destaque la tríada real del usuario y se simplificó la lectura de aspectos tanto en el centro como en el panel derecho. La idea fue sacar texto decorativo y ordenar mejor la información relacional.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Quita `Lectura base`, elimina la tesis genérica `tu carta abre en agua cardinal`, pone la tríada `Sol/Luna/Asc` como dato principal y vuelve más llamativo el botón `Rueda natal` |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Quita el punto decorativo del rótulo `Pulso dominante` |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Reordena cada aspecto en dos zonas: vínculo a la izquierda y tipo/orbe a la derecha, con una separación más clara |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Simplifica la vista contextual de aspectos: cambia el título a `planeta y planeta` y reemplaza la grilla de `Planeta 1 / Aspecto / Planeta 2` por un único resumen compacto |
| `context/resumen-de-cambios.md` | Documenta esta pasada de limpieza sobre hero y aspectos |

### Tests
`eslint` pasó sobre `hero-carta.tsx`, `distribucion-energetica.tsx`, `aspectos-narrativo.tsx`, `panel-contextual.tsx`, `page.tsx` y la suite de página. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/carta-natal.test.tsx`.

### Como funciona
1. El hero ya no intenta explicar una abstracción genérica; ahora introduce la carta por la tríada concreta del usuario, que es la información que realmente importa al entrar.
2. `Rueda natal` quedó más visible como acción secundaria fuerte dentro del hero.
3. En la lista de aspectos, el vínculo entre planetas y el tipo de aspecto ahora se leen como dos columnas distintas, con mejor delimitación.
4. En el panel derecho, al abrir un aspecto se ve primero un resumen corto del vínculo en una sola pieza, en vez de tres tarjetas técnicas que ocupaban demasiado espacio.

---

## Sesion: Panel contextual — escala tipográfica contenida
**Fecha:** 2026-04-02 ~17:32 (ARG)

### Que se hizo
Se redujo la escala del estado inicial del panel contextual de Carta Astral y se formalizó en `claude.md` una regla más estricta para evitar títulos heroicos dentro de paneles laterales y tarjetas contextuales.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Quita el ícono de la tarjeta inicial, reemplaza la frase larga por `Sol/Luna/Asc` en una línea más directa y baja la escala del título |
| `claude.md` | Agrega una regla explícita: en paneles laterales y tarjetas contextuales usar títulos contenidos, normalmente entre `text-[16px]` y `text-[20px]` |
| `context/resumen-de-cambios.md` | Documenta esta pasada de tipografía y jerarquía |

### Tests
`eslint` pasó sobre `panel-contextual.tsx` y la suite de página. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/carta-natal.test.tsx`.

### Como funciona
1. El panel derecho ya no abre con una tarjeta que compite en tamaño con el contenido principal.
2. La lectura inicial muestra directamente la tríada (`Sol/Luna/Asc`) en formato corto, sin ícono decorativo ni una frase grandilocuente.
3. La regla nueva en `claude.md` obliga a mantener esa contención tipográfica en futuras iteraciones del sistema.

---

## Sesion: Diseño Humano — compactación premium ciruela
**Fecha:** 2026-04-02 ~17:42 (ARG)

### Que se hizo
Se rediseñó la sección de Diseño Humano para que deje de sentirse como una landing de cards apiladas y pase a leerse como una consola compacta, alineada con Carta Astral. Se recortó el hero, se eliminaron chips y bloques redundantes, se integró la exploración técnica y se volvió más sobrio el panel contextual derecho.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Recorta el hero, elimina chips y métricas redundantes, fusiona los cuatro pilares en un rail compacto, convierte el explorador técnico en una sola superficie y simplifica cruz/activaciones |
| `frontend/src/componentes/diseno-humano/panel-contextual.tsx` | Reduce la escala tipográfica, elimina la tarjeta separada de `Claves de lectura`, deja solo `Qué es`, `En vos` y `Datos técnicos`, y acorta el subtítulo del rail |
| `frontend/src/lib/utilidades/interpretaciones-diseno-humano.ts` | Compacta el copy contextual para evitar repeticiones entre resumen, significado y claves; limpia contenido no usado |
| `frontend/src/tests/paginas/diseno-humano.test.tsx` | Ajusta la expectativa del hero al nuevo lenguaje más corto y directo |
| `context/resumen-de-cambios.md` | Documenta esta iteración de diseño y contenido |

### Tests
`eslint` pasó limpio sobre los archivos tocados. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/diseno-humano.test.tsx` ejecutado con `npx -y node@20 ./node_modules/vitest/vitest.mjs run ...` porque el `node` local del entorno sigue en v18.

### Como funciona
1. El hero ahora presenta una sola entrada clara: nombre de la sección, una frase de uso y una línea técnica compacta con `Tipo`, `Autoridad`, `Perfil` y `Definición`.
2. Los cuatro pilares ya no ocupan cuatro tarjetas altas con iconos y descripciones; viven en un rail integrado que abre el panel contextual con menos ruido visual.
3. El explorador de `Centros`, `Canales` y `Activaciones` quedó unificado en una sola consola, sin cards métricas previas ni subtítulos redundantes.
4. `Cruz` y `Activaciones` bajaron su peso visual: menos títulos, menos chrome y filas más densas para que el viewport muestre más información útil.
5. El panel derecho ahora sirve de verdad como contexto: explica qué es, qué implica en el caso del usuario y, si hace falta, deja ver lo técnico sin convertir cada estado en otra columna de tarjetas.

---

## Sesion: Diseño Humano — depuración final de instrumentos
**Fecha:** 2026-04-02 ~18:19 (ARG)

### Que se hizo
Se hizo una pasada más estricta sobre Diseño Humano para quitar relleno visual y conceptual. El hero quedó reducido a título + línea técnica, se eliminó `Datos técnicos` del panel derecho y el bloque independiente de `Activaciones` salió del centro para que la pantalla se lea más como instrumento y menos como colección de tarjetas.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Quita la frase de apoyo del hero, conserva solo la línea técnica compacta, elimina la sección autónoma de activaciones y deja únicamente el instrumento de `Cruz` |
| `frontend/src/componentes/diseno-humano/panel-contextual.tsx` | Elimina por completo `Datos técnicos` y deja una sola superficie de lectura con `Qué es` y `En vos` |
| `frontend/src/lib/utilidades/interpretaciones-diseno-humano.ts` | Simplifica el contrato contextual, elimina arrays de apoyo y datos técnicos, y deja solo contenido interpretativo esencial |
| `frontend/src/tests/paginas/diseno-humano.test.tsx` | Ajusta la aserción del hero a la nueva línea técnica compacta |
| `context/resumen-de-cambios.md` | Documenta esta depuración final |

### Tests
`eslint` pasó limpio sobre los archivos tocados. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/diseno-humano.test.tsx` ejecutado con `npx -y node@20 ./node_modules/vitest/vitest.mjs run ...`.

### Como funciona
1. La entrada a la pantalla quedó reducida a lo indispensable: sección, identidad técnica y acceso al `Body Graph`.
2. Los pilares siguen siendo interactivos, pero ahora viven en un rail más seco y sin narrativa repetida.
3. La exploración técnica conserva `Activaciones` como modo de lectura, pero ya no la duplica en un bloque propio más abajo.
4. El panel derecho dejó de explicar de más y ya no muestra listas o tablas técnicas; solo define y aterriza el significado para el usuario.

---

## Sesion: Diseño Humano — compactación de superficies y orden de lectura
**Fecha:** 2026-04-02 ~18:31 (ARG)

### Que se hizo
Se ajustó la pantalla de Diseño Humano para hacerla más compacta y más instrumental: radios menores, mejor separación entre hero y pilares, `Cruz` movida antes del explorador técnico y `Activaciones` convertidas en una lista densa de una sola línea por fila.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Reduce radios de hero, paneles y filas; agrega espacio entre hero y pilares; mueve `Cruz` al tercer bloque; elimina la frase `Se sostiene con continuidad.` en centros definidos; capitaliza nombres de centros en canales; compacta activaciones en filas técnicas `P/L/C` |
| `frontend/src/componentes/diseno-humano/panel-contextual.tsx` | Baja el radio del panel contextual para alinearlo con la nueva densidad visual de la pantalla |
| `context/resumen-de-cambios.md` | Documenta esta pasada de compactación visual y orden de lectura |

### Tests
`eslint` pasó limpio sobre `src/app/(app)/diseno-humano/page.tsx`, `src/componentes/diseno-humano/panel-contextual.tsx` y `src/tests/paginas/diseno-humano.test.tsx`. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/diseno-humano.test.tsx`, ejecutado con `npx -y node@20 ./node_modules/vitest/vitest.mjs run ...`.

### Como funciona
1. El hero respira mejor respecto del rail de `Tipo`, `Autoridad`, `Perfil` y `Definición`, así que el primer viewport ya no se siente pegado.
2. `Cruz` aparece antes del explorador de `Centros`, `Canales` y `Activaciones`, ordenando la lectura de identidad antes de la capa técnica.
3. En `Centros`, los definidos ya no repiten una frase de relleno; los abiertos siguen mostrando solo la aclaración útil.
4. En `Canales`, los nombres de centros ahora se leen con mayúscula inicial y más consistencia editorial.
5. En `Activaciones`, cada fila quedó reducida a `planeta` + `P/L/C` + origen, para que las 26 entradas entren como lista compacta y no como mini tarjetas.

---

## Sesion: Diseño Humano — explorador estilo núcleo y Body Graph reforzado
**Fecha:** 2026-04-02 ~18:40 (ARG)

### Que se hizo
Se llevó el explorador de `Centros`, `Canales` y `Activaciones` al lenguaje visual del bloque `Núcleo` de Numerología, con filas instrumentales más oscuras y sin apariencia de tarjeta. Además se rediseñó el acceso a `Body Graph` y se amplió el modal para que el gráfico gane presencia real.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Convierte el explorador técnico a un listado oscuro con separators y borde activo lateral, oscurece el fondo interno, aplica al botón `Body Graph` el mismo patrón de `Rueda natal` y amplía el modal del gráfico |
| `frontend/src/componentes/visualizaciones/body-graph.tsx` | Agranda el SVG, aumenta el tamaño de centros y etiquetas, y mejora la escala general del `Body Graph` |
| `context/resumen-de-cambios.md` | Documenta esta iteración de explorador y modal |

### Tests
`eslint` pasó limpio sobre `src/app/(app)/diseno-humano/page.tsx`, `src/componentes/visualizaciones/body-graph.tsx`, `src/componentes/diseno-humano/panel-contextual.tsx`, `src/tests/paginas/diseno-humano.test.tsx` y `src/tests/componentes/body-graph.test.tsx`. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `5/5` en `src/tests/paginas/diseno-humano.test.tsx` y `src/tests/componentes/body-graph.test.tsx`, ejecutado con `npx -y node@20 ./node_modules/vitest/vitest.mjs run ...`.

### Como funciona
1. El bloque de exploración ya no presenta `Centros`, `Canales` y `Activaciones` como tarjetas sueltas; ahora se leen como una consola de filas, igual que el patrón de `Núcleo` en Numerología.
2. La superficie interna del explorador quedó más oscura, con menos ruido visual y más contraste útil para sostener la lectura densa.
3. El botón `Body Graph` ahora usa el mismo lenguaje visual de `Rueda natal`, así que la acción se percibe como artefacto principal y no como botón secundario genérico.
4. El modal del `Body Graph` ganó ancho, soporte visual y escala, y el SVG mismo se renderiza más grande y legible.

---

## Sesion: Diseño Humano — explorador sin caja anidada
**Fecha:** 2026-04-02 ~18:50 (ARG)

### Que se hizo
Se corrigió el explorador técnico de Diseño Humano para que no aparezca como un cuadro dentro de otro. La lista de `Centros`, `Canales` y `Activaciones` ahora vive directamente sobre la misma superficie del panel, con un único tono de fondo y divisores internos.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Reemplaza la caja interna del explorador por una lista plana con divisores, unifica el color de fondo del bloque y elimina el efecto de panel anidado |
| `context/resumen-de-cambios.md` | Documenta esta corrección visual del explorador |

### Tests
`eslint` pasó limpio sobre `src/app/(app)/diseno-humano/page.tsx`. `npx tsc --noEmit` pasó limpio en `frontend`. `vitest` pasó `4/4` en `src/tests/paginas/diseno-humano.test.tsx`, ejecutado con `npx -y node@20 ./node_modules/vitest/vitest.mjs run ...`.

### Como funciona
1. El bloque de exploración ya no tiene una segunda caja oscura dentro del panel principal.
2. `Centros`, `Canales` y `Activaciones` se leen ahora como una sola consola continua, más cerca del patrón de `Núcleo` en Numerología.
3. La jerarquía mejora porque el usuario percibe una sola superficie de trabajo, no un mosaico de contenedores superpuestos.

---

## Sesion: Refactor UI integral — sistema premium ciruela y compactación transversal
**Fecha:** 2026-04-02 ~20:07 (ARG)

### Que se hizo
Se ejecutó una pasada integral de refactor visual para unificar ASTRA bajo un mismo sistema premium ciruela: menos chips, menos copy de relleno, menos paneles anidados y más instrumentos compactos. Además se migraron las pantallas legacy más visibles para que `Descubrir`, `Tránsitos`, `Suscripción`, `Perfil` y los flujos de checkout dejen de verse como productos aparte.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `claude.md` | Formaliza reglas visuales nuevas: sin títulos heroicos fuera del hero, sin truncados visibles críticos, sin panel dentro de panel y sin copy de scaffolding interno |
| `frontend/src/componentes/layouts/header-mobile.tsx` | Reduce radios, elimina tonos dorados y permite títulos largos sin truncado |
| `frontend/src/componentes/layouts/navbar.tsx` | Simplifica el header compartido, reemplaza chips por metadata lineal, elimina truncados en identidad/menú y compacta el estado contextual |
| `frontend/src/componentes/layouts/sidebar-navegacion.tsx` | Limpia el bloque `Próximamente`, elimina copy teaser redundante y pasa el modal de descarga al sistema oscuro ciruela |
| `frontend/src/componentes/layouts/mini-reproductor.tsx` | Quita truncados del mini reproductor, mejora respiración vertical y compacta el chrome |
| `frontend/src/componentes/layouts/reproductor-cosmico.tsx` | Permite wrap en título y subtítulo del reproductor desktop y evita cortes de texto |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Rehace el hero del dashboard como una sola narrativa compacta sin collage de cajas |
| `frontend/src/componentes/dashboard-v2/tarjeta-fecha.tsx` | Reduce gigantismo tipográfico y convierte la fecha en una superficie más contenida |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Elimina tarjetas internas y pasa a una sola superficie con divisores |
| `frontend/src/componentes/dashboard-v2/areas-vida-v2.tsx` | Corrige el hook condicional y mantiene el bloque de tabs sin romper lint |
| `frontend/src/app/(app)/podcast/page.tsx` | Compacta hero e historial, saca badges redundantes y elimina restos dorados |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reduce escala del hero y afina la entrada editorial de Carta Astral |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Simplifica el panel derecho de Carta Astral y reduce repeticiones en la lectura inicial |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Elimina truncados en nombres de planetas dentro de la lista de aspectos |
| `frontend/src/app/(app)/numerologia/page.tsx` | Elimina lenguaje de capítulos, compacta hero y consola, baja escala y corrige hooks/auto-recálculo sin romper tipado |
| `frontend/src/componentes/numerologia/panel-contextual-numerologia.tsx` | Reduce capas del rail derecho y simplifica el estado default |
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Consolida el rail de atributos, oscurece el explorador técnico, compacta centros/canales/activaciones y mejora el modal de Body Graph |
| `frontend/src/app/(app)/perfil/page.tsx` | Reduce pills del hero, elimina duplicación con panel lateral, compacta datos base y limpia copy visible |
| `frontend/src/app/(app)/suscripcion/page.tsx` | Unifica hero y estado actual, simplifica cards de planes, compacta facturación y renombra copy interno a lenguaje de usuario |
| `frontend/src/app/(app)/descubrir/page.tsx` | Migra la pantalla completa a surfaces ciruela con iconografía astral y estructura compacta |
| `frontend/src/app/(app)/transitos/page.tsx` | Reescribe la pantalla legacy a formato premium oscuro, con lista compacta de tránsitos y metadatos lineales |
| `frontend/src/componentes/proximamente/feature-proximamente.tsx` | Migra la base visual de pantallas próximas al sistema ciruela sin dorado ni hero sobredimensionado |
| `frontend/src/app/(app)/match-pareja/page.tsx` | Compacta la pantalla teaser de compatibilidad y reduce el enfoque promocional |
| `frontend/src/app/(app)/suscripcion/exito/page.tsx` | Migra la pantalla de éxito de suscripción al sistema ciruela y ajusta el efecto para evitar setState síncrono |
| `frontend/src/app/(app)/suscripcion/fallo/page.tsx` | Migra la pantalla de fallo de suscripción al sistema ciruela |
| `frontend/src/app/(app)/suscripcion/pendiente/page.tsx` | Migra la pantalla de pendiente de suscripción al sistema ciruela |
| `frontend/src/app/(checkout)/checkout/exito/page.tsx` | Migra la pantalla de éxito del checkout al sistema ciruela y reemplaza `<img>` por `next/image` |
| `frontend/src/app/(checkout)/checkout/fallo/page.tsx` | Migra la pantalla de fallo del checkout al sistema ciruela y reemplaza `<img>` por `next/image` |
| `frontend/src/app/(checkout)/checkout/pendiente/page.tsx` | Migra la pantalla de pendiente del checkout al sistema ciruela y reemplaza `<img>` por `next/image` |
| `frontend/src/tests/paginas/dashboard.test.tsx` | Actualiza assertions al nuevo hero compacto del dashboard |
| `frontend/src/tests/paginas/numerologia.test.tsx` | Adapta la suite a la consola nueva, al rail contextual y a la duplicación mobile/desktop prevista |
| `frontend/src/tests/paginas/perfil.test.tsx` | Actualiza copy y headings a la versión compacta de Perfil |
| `frontend/src/tests/paginas/suscripcion.test.tsx` | Adapta la expectativa principal al hero unificado de Suscripción |
| `context/resumen-de-cambios.md` | Documenta esta sesión integral de refactor UI |

### Tests
- `npm run lint` pasó sin errores en `frontend`; siguen quedando warnings preexistentes del repo en `dashboard`, `callback`, `onboarding`, `chat-widget`, `avatar`, `rueda-zodiacal` y algunos tests legacy.
- `npx tsc --noEmit` pasó limpio en `frontend`.
- `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx src/tests/paginas/podcast.test.tsx src/tests/paginas/numerologia.test.tsx src/tests/paginas/carta-natal.test.tsx src/tests/paginas/diseno-humano.test.tsx src/tests/paginas/perfil.test.tsx src/tests/paginas/suscripcion.test.tsx src/tests/componentes/navbar.test.tsx src/tests/componentes/body-graph.test.tsx` pasó `47/47`.

### Como funciona
1. El sistema compartido ahora prioriza superficies oscuras compactas, metadata lineal y títulos contenidos; el detalle profundo queda relegado al panel derecho o a modales contextuales.
2. El chrome global ya no corta títulos críticos ni depende de chips para explicar el estado de la app, del usuario o del audio activo.
3. Las secciones core (`Dashboard`, `Podcast`, `Carta Astral`, `Diseño Humano`, `Numerología`) hablan un idioma más homogéneo: hero breve, instrumentos compactos y menos texto intermedio.
4. `Perfil` y `Suscripción` dejaron de duplicar información entre hero y paneles laterales; ahora muestran el estado útil y las acciones principales sin relleno visual.
5. Las pantallas legacy (`Descubrir`, `Tránsitos`, `Próximamente`, `Match de Pareja` y checkout) fueron migradas al mismo sistema ciruela, de modo que el usuario ya no “salta” entre productos visualmente distintos dentro del mismo flujo.

---

## Sesion: Dashboard — respiración mobile, áreas compactas y semana ciruela
**Fecha:** 2026-04-02 ~22:05 (ARG)

### Que se hizo
Se ajustó el dashboard para corregir cortes y falta de aire en mobile, especialmente en el header y en el primer bloque de inicio. Además se rediseñó `Áreas` como instrumento compacto y se llevó `Tu semana` a un fondo ciruela oscuro unificado.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/header-mobile.tsx` | Agrega más separación respecto del safe area superior y más respiración interna para evitar que el texto quede visualmente pegado o cortado |
| `frontend/src/app/(app)/dashboard/page.tsx` | Corrige la tilde de `Buenos días` y aumenta el espacio entre el header mobile y la primera tarjeta del dashboard |
| `frontend/src/componentes/dashboard-v2/areas-vida-v2.tsx` | Reemplaza el bloque anterior por una sola superficie oscura, con tabs compactos y lectura principal sin caja anidada |
| `frontend/src/componentes/dashboard-v2/semana-v2.tsx` | Cambia el contenedor principal de `Tu semana` a un fondo ciruela oscuro unificado, sin gradiente violeta brillante |

### Tests
`npm run lint -- 'src/componentes/layouts/header-mobile.tsx' 'src/app/(app)/dashboard/page.tsx' 'src/componentes/dashboard-v2/areas-vida-v2.tsx' 'src/componentes/dashboard-v2/semana-v2.tsx'` pasó sin errores; se mantienen warnings preexistentes en `dashboard/page.tsx`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx` pasó `5/5`.

### Como funciona
1. El header mobile conserva el formato de tarjeta, pero ahora respira mejor arriba y no deja el texto demasiado cerca del borde superior.
2. La pantalla de inicio gana separación entre el header y el primer módulo, así que la primera tarjeta ya no se percibe pegada ni recortada.
3. `Áreas` pasó de ser un bloque con gradiente y panel interno a una sola consola oscura con selector compacto y lectura central directa.
4. `Tu semana` mantiene la estructura actual, pero ahora se apoya en un fondo ciruela oscuro y consistente con el resto del dashboard.

---

## Sesion: Dashboard — segunda ronda de recortes y overlap del header
**Fecha:** 2026-04-03 ~07:50 (ARG)

### Que se hizo
Se hizo una segunda pasada sobre el dashboard desktop para corregir tarjetas que quedaban visualmente cortadas y bajar el peso del overlap entre la tarjeta contextual del header y el contenido principal. También se compactó la columna derecha del hero para que no se muerda con el borde inferior.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/navbar.tsx` | Reduce la altura del navbar, baja el radio de la tarjeta central a `10px`, ajusta padding y limita visualmente la altura del bloque contextual para que el overlap con el contenido sea más controlado |
| `frontend/src/app/(app)/dashboard/page.tsx` | Aumenta el margen superior desktop del dashboard para que el hero respire más respecto del header |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Incrementa la altura útil del hero, ajusta paddings y da más aire a la columna derecha para evitar cortes en botones y subcomponentes |
| `frontend/src/componentes/dashboard-v2/tarjeta-fecha.tsx` | Compacta la tarjeta de fecha para que no empuje el hero al límite |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Reduce el alto interno de cada fila de momentos y acompaña la nueva altura del hero |
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Baja la escala del bloque y el contenedor del número personal |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Reduce el ícono y reemplaza el tono dorado por violeta para mantenerse en la paleta ciruela |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Compacta las barras de energía para que la tercera columna del hero no vuelva a quedar apretada |

### Tests
`npm run lint -- 'src/componentes/layouts/navbar.tsx' 'src/app/(app)/dashboard/page.tsx' 'src/componentes/dashboard-v2/hero-seccion.tsx' 'src/componentes/dashboard-v2/tarjeta-fecha.tsx' 'src/componentes/dashboard-v2/momentos-dia.tsx' 'src/componentes/dashboard-v2/numero-del-dia.tsx' 'src/componentes/dashboard-v2/luna-posicion.tsx' 'src/componentes/dashboard-v2/niveles-energia.tsx'` pasó sin errores; permanecen warnings preexistentes en `dashboard/page.tsx`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx src/tests/componentes/navbar.test.tsx` pasó `7/7`.

### Como funciona
1. La tarjeta central del header sigue siendo protagonista, pero ahora tiene radio más contenido, menos padding y menos altura visual, así que no invade tanto el dashboard.
2. El contenido principal del dashboard arranca un poco más abajo en desktop, manteniendo el efecto de cercanía con el header sin que se perciba encimado.
3. El hero principal ganó altura útil y aire interno, así que ya no recorta la fila de acciones ni la columna de instrumentos de la derecha.
4. La columna derecha del hero quedó más compacta y coherente con la paleta ciruela, evitando que sus piezas parezcan apretadas o quebradas.

---

## Sesion: Dashboard — mensaje principal del header simplificado y hero sin corte
**Fecha:** 2026-04-03 ~07:56 (ARG)

### Que se hizo
Se simplificó el mensaje principal del header para que deje de sentirse como una card anidada con ícono, y se corrigió de forma más directa el corte visible del hero del dashboard reforzando su estructura interna.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/navbar.tsx` | Elimina el icono del mensaje principal, saca la sensación de card anidada y deja un bloque de texto sobre degradado ciruela con menor altura |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Reorganiza la primera columna como estructura flex vertical con acciones al pie, aumenta la altura útil del hero y evita que la fila inferior vuelva a quedar cortada |
| `context/resumen-de-cambios.md` | Documenta esta tercera ronda puntual sobre dashboard |

### Tests
`npm run lint -- 'src/componentes/layouts/navbar.tsx' 'src/componentes/dashboard-v2/hero-seccion.tsx' 'src/app/(app)/dashboard/page.tsx'` pasó sin errores; siguen warnings preexistentes en `dashboard/page.tsx`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx src/tests/componentes/navbar.test.tsx` pasó `7/7`.

### Como funciona
1. El bloque central del header ya no compite como una tarjeta dentro de otra: quedó solo el texto principal, sobre soporte ciruela y con menos masa visual.
2. El hero del dashboard ganó una columna izquierda más estable, con el contenido principal arriba y las acciones ancladas abajo, de modo que ya no se cortan contra el borde inferior.
3. La lectura del primer viewport se vuelve más limpia porque el header pesa menos y el hero deja de verse “mordido” por su propia altura.

---

## Sesion: Dashboard — corrección estructural del hero cortado
**Fecha:** 2026-04-03 ~10:22 (ARG)

### Que se hizo
Se corrigió el corte persistente del hero del dashboard atacando la causa estructural: la columna izquierda estaba usando un layout que empujaba las acciones fuera del alto visible. También se ajustó el instrumento de luna para que mantenga un copy compacto sin duplicaciones.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Elimina la lógica `h-full + mt-auto` en la columna izquierda, aumenta la altura útil del hero y deja que la sección crezca naturalmente para no cortar la fila inferior |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Normaliza el texto para mostrar una sola lectura compacta de la luna, sin repetir el prefijo cuando ya viene en la descripción |
| `context/resumen-de-cambios.md` | Documenta esta corrección estructural del hero |

### Tests
`npm run lint -- 'src/componentes/dashboard-v2/hero-seccion.tsx' 'src/componentes/dashboard-v2/luna-posicion.tsx' 'src/app/(app)/dashboard/page.tsx' 'src/componentes/layouts/navbar.tsx'` pasó sin errores; continúan warnings preexistentes en `dashboard/page.tsx`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx src/tests/componentes/navbar.test.tsx` pasó `7/7`.

### Como funciona
1. La columna izquierda del hero ya no depende de un auto-empuje vertical que terminaba sacando la fila de acciones fuera del área visible.
2. El hero ahora gana alto real según su contenido y mantiene la base completa dentro del panel, evitando el corte que seguía apareciendo en desktop.
3. El mensaje contextual del header conserva el degradado ciruela y queda más liviano, mientras el instrumento de luna se mantiene compacto y consistente con el resto del bloque.

---

## Sesion: Dashboard — aumento de altura útil y fin del clipping
**Fecha:** 2026-04-03 ~10:28 (ARG)

### Que se hizo
Se reforzó la corrección del dashboard aumentando el alto útil real de las dos primeras secciones y removiendo el clipping innecesario que todavía estaba ocultando contenido en el hero y en `Áreas`.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Quita el `overflow-hidden` del contenedor principal, aumenta el `min-height` desktop, suma padding inferior real a las tres columnas y deja más aire bajo la fila de acciones |
| `frontend/src/componentes/dashboard-v2/areas-vida-v2.tsx` | Quita el clipping del contenedor y aumenta la altura mínima del contenido para que el detalle visible no vuelva a quedar cortado |
| `context/resumen-de-cambios.md` | Documenta esta corrección específica de altura y clipping |

### Tests
`npm run lint -- 'src/componentes/dashboard-v2/hero-seccion.tsx' 'src/componentes/dashboard-v2/areas-vida-v2.tsx' 'src/app/(app)/dashboard/page.tsx'` pasó sin errores; siguen warnings preexistentes en `dashboard/page.tsx`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx` pasó `5/5`.

### Como funciona
1. El hero del dashboard ya no recorta su borde inferior porque el panel principal puede crecer más y ya no esconde visualmente el contenido que se pasa por unos píxeles.
2. `Áreas` deja de mostrarse “mordida” porque el contenedor ya no corta el bloque y el panel interno tiene más altura mínima para sus textos.
3. El resultado es más simple: si el contenido necesita unos píxeles extra, el módulo ahora los concede en vez de esconderlos.

---

## Sesion: Dashboard — ajuste puntual de altura en Momentos del día
**Fecha:** 2026-04-03 ~11:30 (ARG)

### Que se hizo
Se redujo la altura efectiva de la tarjeta `Momentos del día` para que deje de estirarse a todo el alto del hero. El bloque ahora toma sólo la altura de sus tres filas y ya no se percibe como una columna inflada respecto del resto del dashboard.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Elimina `h-full` y `justify-center` del contenedor para que la tarjeta ajuste su altura al contenido real |
| `context/resumen-de-cambios.md` | Documenta este ajuste puntual sobre `Momentos del día` |

### Tests
`npm run lint -- 'src/componentes/dashboard-v2/momentos-dia.tsx' 'src/app/(app)/dashboard/page.tsx'` pasó sin errores; persisten warnings preexistentes en `dashboard/page.tsx`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx` pasó `5/5`.

### Como funciona
1. La tarjeta de `Momentos del día` ya no se estira artificialmente para llenar toda la columna.
2. El contenedor toma la altura natural de sus tres filas, por eso se ve más contenido y consistente con el resto del hero.
3. El hero mantiene su estructura general, pero la columna central deja de sentirse sobredimensionada.

---

## Sesion: Dashboard — tarjeta de fecha compacta y CTA unificado para mañana
**Fecha:** 2026-04-03 ~11:32 (ARG)

### Que se hizo
Se ajustó la altura de la primera tarjeta interna del hero para que responda mejor al contenido real y se unificó la acción de mañana en un solo botón con copy completo, en lugar de verse como botón más chip.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/tarjeta-fecha.tsx` | Reduce la escala interna y reajusta paddings para que la tarjeta de fecha quede más proporcionada al contenido |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Cambia el texto del segundo CTA a `Generar audio para mañana · ...` para unificar la acción en un único botón claro |
| `context/resumen-de-cambios.md` | Documenta este ajuste puntual del hero |

### Tests
`npm run lint -- 'src/componentes/dashboard-v2/tarjeta-fecha.tsx' 'src/componentes/dashboard-v2/hero-seccion.tsx' 'src/app/(app)/dashboard/page.tsx'` pasó sin errores; se mantienen warnings preexistentes en `dashboard/page.tsx`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/dashboard.test.tsx` pasó `5/5`.

### Como funciona
1. La tarjeta de fecha deja de verse sobredimensionada dentro de la primera columna del hero y acompaña mejor la masa visual del bloque.
2. La acción secundaria de mañana ya no se percibe como un chip suelto; ahora se lee como un botón completo con intención clara: generar el audio del día siguiente.

---

## Sesion: Mobile — rescate de plataforma y flujos críticos de cuenta/suscripción
**Fecha:** 2026-04-03 ~12:29 (ARG)

### Que se hizo
Se ejecutó la primera ola del plan de rescate de `mobile/`: se estabilizó la base Expo, se alineó el cliente API mobile con el contrato real del backend y se incorporaron los flujos críticos que faltaban para recuperación de cuenta, verificación de checkout, facturas y acciones de perfil.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `.github/workflows/ci.yml` | Agrega la lane mobile con `npm ci`, `typecheck`, `expo-doctor` y smoke export de Android/iOS sobre Node 22 |
| `.nvmrc` | Fija Node 22 como referencia de entorno para el rescate mobile |
| `mobile/.gitignore` | Ignora `dist-export/` para no ensuciar el repo con artefactos de export |
| `mobile/app.json` | Limpia configuración Expo, elimina `projectId` vacío y registra `expo-asset` como plugin |
| `mobile/eas.json` | Agrega perfiles `development`, `preview` y `production` para EAS |
| `mobile/metro.config.js` | Agrega compatibilidad para `toReversed` y deja estable el arranque de Metro/export |
| `mobile/package.json` | Alinea scripts operativos (`typecheck`, `doctor`, exports), corrige dependencias Expo y suma `react-dom`/`react-native-web` para resolver peers |
| `mobile/package-lock.json` | Regenera el lockfile acorde a la nueva base Expo y dependencias mobile |
| `mobile/src/app/(auth)/login.tsx` | Mejora manejo de errores y agrega acceso al flujo de recuperación de contraseña |
| `mobile/src/app/(auth)/registro.tsx` | Normaliza el manejo de errores del registro |
| `mobile/src/app/(auth)/olvide-contrasena.tsx` | Nueva pantalla mobile para solicitar reset, verificar OTP y definir nueva contraseña |
| `mobile/src/app/(features)/suscripcion.tsx` | Rehace la vista de suscripción con facturas, apertura de checkout y verificación manual del estado del pago |
| `mobile/src/app/(features)/suscripcion-verificacion.tsx` | Nueva pantalla de polling post-checkout para confirmar activación Premium |
| `mobile/src/app/(tabs)/descubrir.tsx` | Sustituye iconografía astral por `IconoAstral` y elimina gradientes fuera de la paleta ASTRA |
| `mobile/src/app/(tabs)/index.tsx` | Ajusta hero/dashboard inicial para usar iconografía astral correcta y gradientes válidos |
| `mobile/src/app/(tabs)/perfil.tsx` | Amplía perfil con descarga de PDF, cambio de contraseña y eliminación de cuenta |
| `mobile/src/componentes/ui/esqueleto.tsx` | Corrige tipado de `style`, `width` y `height` |
| `mobile/src/componentes/ui/presionable-animado.tsx` | Corrige tipado del `style` animado para evitar errores de compilación |
| `mobile/src/componentes/visualizaciones/body-graph.tsx` | Limpia imports y corrige dependencia visual del token de color de tarjeta |
| `mobile/src/constants/colores.ts` | Reestructura tokens de color, corrige typings y elimina advertencias naranja/amber |
| `mobile/src/lib/api/cliente.ts` | Reemplaza Axios por un cliente fetch alineado con web: unwrap `{ exito, datos }`, refresh con mutex y limpieza de sesión consistente |
| `mobile/src/lib/hooks/index.ts` | Exporta los nuevos hooks de auth/perfil/suscripción |
| `mobile/src/lib/hooks/usar-auth.ts` | Alinea login/registro/logout con el nuevo cliente y agrega reset OTP + eliminar cuenta |
| `mobile/src/lib/hooks/usar-calendario-cosmico.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-carta-natal.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-diseno-humano.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-geocodificacion.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-mis-calculos.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-numerologia.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-perfil.ts` | Ajusta consumo del cliente API, agrega `usarObtenerPerfil` y mantiene coherencia con el backend |
| `mobile/src/lib/hooks/usar-podcast.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-retorno-solar.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/hooks/usar-suscripcion.ts` | Ajusta consumo del cliente API y agrega hooks para facturas/sincronización de pagos |
| `mobile/src/lib/hooks/usar-transitos.ts` | Ajusta consumo del cliente API desenvuelto |
| `mobile/src/lib/stores/store-auth.ts` | Readecua la carga/cierre de sesión al nuevo cliente API |
| `mobile/src/lib/tipos/auth.ts` | Agrega tipos para reset OTP, eliminación de cuenta y token de reset |
| `mobile/src/lib/tipos/index.ts` | Exporta los nuevos tipos de auth |
| `mobile/src/lib/utilidades/descargar-documento.ts` | Nueva utilidad para descargar y abrir PDFs protegidos con token bearer |
| `mobile/src/lib/utilidades/interpretaciones-natal.ts` | Elimina referencias visuales prohibidas a naranja/amber y deja el contenido dentro de la paleta ASTRA |
| `context/resumen-de-cambios.md` | Documenta esta sesión de rescate mobile |

### Tests
0 tests nuevos/modificados. Pasaron `npm ci`, `npm run typecheck`, `npm run doctor`, `npm run export:android` y `npm run export:ios` dentro de `mobile/`.

### Como funciona
1. La app mobile ahora tiene una base Expo verificable: el lockfile es reproducible, `expo-doctor` pasa y el bundling/export funciona en Android e iOS sin romper Metro.
2. Todas las llamadas mobile usan un cliente API consistente con web/backend: devuelve `datos` desenvuelto, renueva sesión con `token_refresco`, reintenta una vez y limpia la sesión si el refresh falla.
3. Desde auth ya existe recuperación de contraseña end-to-end por OTP: el usuario solicita código, verifica OTP y define una nueva contraseña sin salir de mobile.
4. Desde perfil el usuario puede descargar su PDF, cambiar contraseña y eliminar la cuenta; desde suscripción puede iniciar checkout, verificar su estado después del pago y abrir facturas PDF autenticadas.
5. La UI tocada quedó alineada con las reglas ASTRA del repo: sin naranja/amber, sin símbolos zodiacales Unicode y con `IconoAstral` para contenido esotérico.

---

## Sesion: Mobile — dashboard con pronóstico y oráculo en app
**Fecha:** 2026-04-03 ~12:42 (ARG)

### Que se hizo
Se ejecutó el siguiente round funcional de mobile: `Inicio` ahora consume el pronóstico cósmico diario/semanal real y se agregó una pantalla mobile del `Oráculo ASTRA` con historial, envío de mensajes y nueva conversación. Además, el cliente API mobile quedó más robusto para manejar respuestas `exito=false` aunque el backend responda `200`.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `mobile/src/app/(features)/oraculo.tsx` | Nueva pantalla mobile del oráculo con historial, sugerencias rápidas, input multiline y nueva conversación |
| `mobile/src/app/(tabs)/descubrir.tsx` | Agrega acceso directo al Oráculo ASTRA dentro de descubrir |
| `mobile/src/app/(tabs)/index.tsx` | Rehace el dashboard mobile para mostrar pronóstico diario, momentos, áreas, consejo HD, semana, podcasts y CTA al oráculo |
| `mobile/src/lib/api/cliente.ts` | Hace que el cliente lance errores cuando el backend responde `exito=false` en cuerpos JSON exitosos a nivel HTTP |
| `mobile/src/lib/hooks/index.ts` | Exporta hooks de pronóstico y chat para mobile |
| `mobile/src/lib/hooks/usar-chat.ts` | Agrega hooks mobile para historial, envío de mensajes y nueva conversación del oráculo |
| `mobile/src/lib/hooks/usar-pronostico.ts` | Agrega hooks mobile para pronóstico diario y semanal |
| `mobile/src/lib/tipos/chat.ts` | Incorpora tipos mobile del historial y respuesta del chat |
| `mobile/src/lib/tipos/index.ts` | Exporta los nuevos tipos de chat y pronóstico |
| `mobile/src/lib/tipos/pronostico.ts` | Incorpora tipos mobile del pronóstico diario y semanal |
| `context/resumen-de-cambios.md` | Documenta esta sesión de dashboard + oráculo mobile |

### Tests
0 tests nuevos/modificados. Pasaron `npm run typecheck`, `npm run doctor`, `npm run export:android` y `npm run export:ios` dentro de `mobile/`.

### Como funciona
1. La tab `Inicio` ya no depende sólo de tránsitos sueltos: ahora carga `pronóstico/diario` y `pronóstico/semanal`, mostrando clima cósmico, momentos del día, áreas activas, consejo HD y panorama semanal.
2. El dashboard sigue integrando podcasts, pero ahora los ubica dentro de una lectura más completa del día y suma un acceso directo al Oráculo ASTRA desde la home.
3. El Oráculo tiene pantalla propia en mobile: puede cargar la conversación previa, sugerir preguntas iniciales, enviar mensajes al backend, mostrar respuestas, iniciar una nueva conversación y reflejar el límite diario del plan gratis.
4. `Descubrir` suma el acceso al oráculo para que la feature quede navegable desde la estructura principal de producto.
5. El cliente API mobile ahora trata `exito=false` como error real aunque la respuesta venga con `200`, evitando estados falsamente exitosos en pronóstico/chat y cualquier otro endpoint con ese patrón.

---

## Sesion: Mobile — edición natal completa y recálculo desde perfil
**Fecha:** 2026-04-03 ~12:53 (ARG)

### Que se hizo
Se cerró la brecha de perfil en mobile para que la app pueda editar los datos natales completos, recalcular cartas desde la misma pantalla y mostrar mejor el estado real de la cuenta. También se corrigió el formulario reusable de nacimiento para evitar reusar coordenadas viejas cuando cambia la ciudad.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `mobile/src/app/(tabs)/perfil.tsx` | Rehace la pantalla de perfil para mostrar metadatos de cuenta, editar datos natales completos, disparar recálculo de cartas y mantener acciones de sesión/privacidad |
| `mobile/src/componentes/compuestos/formulario-nacimiento.tsx` | Soporta valores iniciales completos incluyendo geodatos y permite reutilizar el formulario para edición real de perfil |
| `mobile/src/componentes/compuestos/selector-ciudad.tsx` | Notifica cambios de texto para invalidar la selección geográfica previa cuando el usuario modifica la ciudad manualmente |
| `context/resumen-de-cambios.md` | Documenta esta sesión de perfil y recálculo mobile |

### Tests
0 tests nuevos/modificados. Pasaron `npm run typecheck`, `npm run doctor`, `npm run export:android` y `npm run export:ios` dentro de `mobile/`.

### Como funciona
1. La pantalla `Mi Perfil` ahora muestra no sólo email y plan, sino también proveedor de autenticación, estado de suscripción, fecha de alta y último acceso.
2. Desde `Datos de nacimiento` el usuario puede editar nombre, fecha, hora y lugar usando el mismo formulario estructurado del onboarding, pero inicializado con sus datos actuales.
3. Cuando cambian datos natales, mobile actualiza el perfil y luego relanza carta natal, diseño humano, numerología y retorno solar; además invalida queries de cálculos, pronóstico, podcast y chat para no dejar contenido derivado desactualizado.
4. Si el usuario cambia el texto de la ciudad, la selección geográfica previa queda invalidada y tiene que volver a elegir un resultado válido, evitando recalcular con coordenadas inconsistentes.
5. El feedback del perfil ahora diferencia entre actualización simple, recálculo en progreso y casos donde los datos se guardaron pero alguna carta no pudo regenerarse.

---

## Sesion: Mobile — shell premium ciruela y reordenamiento de inicio/acceso
**Fecha:** 2026-04-03 ~13:29 (ARG)

### Que se hizo
Se inició el round de mejoras prioritarias de UI mobile con un cambio de sistema: nueva base visual premium ciruela, shell de acceso reutilizable y reordenamiento fuerte de `Inicio` y `Descubrir` para recuperar foco, jerarquía y coherencia entre iOS/Android.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `mobile/src/componentes/layouts/fondo-cosmico.tsx` | Nuevo fondo reusable con gradientes y halos ciruela para auth, onboarding y pantallas editoriales |
| `mobile/src/componentes/layouts/shell-acceso.tsx` | Nuevo shell de acceso con hero editorial, pistas contextuales y panel central reutilizable |
| `mobile/src/componentes/layouts/header-mobile.tsx` | Amplía el header para acciones laterales más cómodas y un look más premium/coherente |
| `mobile/src/componentes/ui/avatar.tsx` | Refina el avatar con borde y superficie integrada al sistema nuevo |
| `mobile/src/componentes/ui/badge.tsx` | Ajusta badges con borde y ritmo visual más consistente |
| `mobile/src/componentes/ui/boton.tsx` | Refina botones secundarios/fantasma y estados de carga para el nuevo lenguaje visual |
| `mobile/src/componentes/ui/input.tsx` | Rehace inputs con superficies más integradas y mejor tratamiento de error |
| `mobile/src/componentes/ui/tarjeta.tsx` | Unifica tarjetas entre iOS y Android con fallback premium en vez de sólido genérico |
| `mobile/src/constants/colores.ts` | Lleva el modo claro a una base más ciruela y mejora gradientes/tab bar del sistema |
| `mobile/src/app/(tabs)/_layout.tsx` | Reconfigura la tab bar flotante para sentirse menos genérica y más ASTRA |
| `mobile/src/app/(auth)/login.tsx` | Rediseña login con shell premium, mejor jerarquía y panel de acceso más claro |
| `mobile/src/app/(auth)/registro.tsx` | Rediseña registro con la misma gramática editorial y mejor framing del flujo |
| `mobile/src/app/(onboarding)/index.tsx` | Replantea onboarding y estado de cálculo inicial con shell coherente y mensaje más guiado |
| `mobile/src/app/(tabs)/index.tsx` | Reordena `Inicio` con hero dominante, momentos horizontales, áreas priorizadas y podcasts menos comprimidos |
| `mobile/src/app/(tabs)/descubrir.tsx` | Rehace `Descubrir` como biblioteca curada por intención en vez de grilla plana |
| `context/resumen-de-cambios.md` | Documenta esta sesión de mejoras prioritarias de UI mobile |

### Tests
0 tests nuevos/modificados. Pasaron `npm run typecheck`, `npm run doctor`, `npm run export:android` y `npm run export:ios` dentro de `mobile/`.

### Como funciona
1. La app ahora tiene una base visual más coherente: fondos ciruela reutilizables, tarjetas premium consistentes en ambas plataformas y una tab bar menos genérica.
2. `Login`, `Registro` y `Onboarding` dejaron de ser formularios planos y pasan a compartir un shell editorial con contexto, foco y panel central de acción.
3. `Inicio` recupera jerarquía: hero principal, alertas resumidas, momentos del día en carrusel, áreas priorizadas y podcasts mejor distribuidos.
4. `Descubrir` deja de comportarse como catálogo uniforme y pasa a agrupar módulos por intención (`arquitectura personal`, `tiempo cósmico`, `premium`) para mejorar comprensión de producto.
5. Este round no cerró todavía el resto de módulos utilitarios (`Perfil`, `Calendario`, `Tránsitos`, `Suscripción`) pero dejó lista la base visual para que el siguiente batch suba esas pantallas sin rehacer componentes otra vez.

---

## Sesion: Web — base de light theme alineada con mobile
**Fecha:** 2026-04-03 ~18:33 (ARG)

### Que se hizo
Se implementó la primera fase real del modo claro para la app web, tomando como referencia la paleta y la lógica de tema de la app mobile. La web ahora tiene infraestructura de tema `claro/oscuro/automático`, selector persistente en perfil y migración del shell principal para que escritorio pueda navegar en light sin depender del dark hardcodeado.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/lib/stores/store-tema.ts` | Nuevo store Zustand para preferencia de tema web (`claro`, `oscuro`, `automático`) con persistencia en `localStorage` y sincronización con el sistema |
| `frontend/src/lib/hooks/usar-tema.ts` | Nuevo hook para consumir tema activo y actualizar preferencia desde UI |
| `frontend/src/proveedores/proveedor-tema.tsx` | Nuevo proveedor que inicializa el tema, escucha cambios del sistema y aplica `data-tema` al documento |
| `frontend/src/app/layout.tsx` | Inyecta script inicial para evitar flash de tema, registra el proveedor de tema y ajusta metadatos base |
| `frontend/src/estilos/tokens/colores.css` | Reescribe tokens globales con variantes light/dark y variables semánticas de shell alineadas con mobile |
| `frontend/src/app/globals.css` | Ajusta `color-scheme`, fondos base, scrollbars y agrega utilidades globales de superficies temáticas |
| `frontend/src/componentes/ui/icono.tsx` | Amplía el set de iconos para selector de tema y acciones de perfil |
| `frontend/src/componentes/ui/avatar.tsx` | Ajusta avatar para usar bordes/superficies del nuevo sistema de tema |
| `frontend/src/proveedores/proveedor-auth.tsx` | Hace theme-aware el loader global de autenticación |
| `frontend/src/componentes/layouts/layout-auth.tsx` | Adapta el shell de auth al nuevo sistema de fondos y logo según tema |
| `frontend/src/componentes/layouts/layout-app.tsx` | Migra el shell autenticado de escritorio a variables de tema en vez de fondos hardcodeados |
| `frontend/src/componentes/layouts/layout-mobile.tsx` | Alinea el shell mobile web con el nuevo fondo semántico |
| `frontend/src/componentes/layouts/header-mobile.tsx` | Migra header mobile a superficies y textos dependientes del tema |
| `frontend/src/componentes/layouts/barra-navegacion-inferior.tsx` | Hace theme-aware la barra inferior mobile web |
| `frontend/src/componentes/layouts/navbar.tsx` | Migra navbar principal y dropdowns a variables de tema, con soporte de logo en claro |
| `frontend/src/componentes/layouts/sidebar-navegacion.tsx` | Migra sidebar desktop/mobile y modal de descargas a superficies light/dark compartidas |
| `frontend/src/componentes/layouts/reproductor-cosmico.tsx` | Reescribe el reproductor desktop para responder al tema activo |
| `frontend/src/componentes/layouts/mini-reproductor.tsx` | Reescribe el reproductor mobile web para responder al tema activo |
| `frontend/src/componentes/dashboard-v2/panel-glass.tsx` | Hace theme-aware la primitiva glass del dashboard |
| `frontend/src/componentes/dashboard-v2/areas-vida-v2.tsx` | Migra la tarjeta de áreas del dashboard a superficies y tipografía del light theme |
| `frontend/src/componentes/dashboard-v2/semana-v2.tsx` | Migra la vista semanal del dashboard y tooltips a variables de tema |
| `frontend/src/app/(app)/perfil/page.tsx` | Agrega selector de tema en web y comienza la migración visual de perfil al sistema light/dark |
| `context/resumen-de-cambios.md` | Documenta esta sesión de implementación del light theme web |

### Tests
0 tests nuevos/modificados. Pasaron `npm run build` y `npm run lint` dentro de `frontend/` usando Node `20.20.0` (`/opt/homebrew/opt/node@20/bin`). ESLint quedó sin errores y con warnings preexistentes del repo en archivos no vinculados directamente a esta sesión.

### Como funciona
1. La web ahora decide el tema con la misma lógica conceptual que mobile: el usuario puede elegir `Claro`, `Oscuro` o `Automático`, y la preferencia queda guardada localmente.
2. Antes de hidratar React, un script en `layout.tsx` aplica el tema al `<html>` para evitar el parpadeo entre light/dark al cargar.
3. Los tokens globales de color ya no están atados sólo a la versión clara histórica ni al dark hardcodeado del dashboard: ahora existen variables semánticas de shell, superficies, bordes, scrollbars y overlays para ambos esquemas.
4. El shell principal de la app web (navbar, sidebar, barra inferior, auth, reproductores y parte del dashboard) ya responde al tema activo, permitiendo una experiencia light navegable y coherente con la referencia visual de mobile.
5. La pantalla `Perfil` expone el selector de tema para escritorio y deja sembrada la infraestructura para continuar migrando el resto de las pantallas analíticas sin rehacer el sistema otra vez.

---

## Sesion: Numerología — deduplicación del panel contextual
**Fecha:** 2026-04-03 ~18:34 (ARG)

### Que se hizo
Se corrigió la duplicación del encabezado en el panel contextual de numerología al abrir opciones del núcleo y del ritmo actual. En desktop, la categoría, el título y el subtítulo ya no se renderizan dos veces dentro del rail lateral.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/numerologia/panel-contextual-numerologia.tsx` | Oculta la cabecera interna del detalle en modo desktop y la conserva en mobile, evitando repetir categoría, título y subtítulo dentro del rail lateral |
| `frontend/src/tests/paginas/numerologia.test.tsx` | Agrega cobertura para asegurar que al abrir `Sendero Natal` no se duplique la cabecera del detalle en la vista desktop |
| `context/resumen-de-cambios.md` | Documenta esta corrección puntual de numerología |

### Tests
Se modificó 1 test de frontend y quedaron `7/7` pasando en `src/tests/paginas/numerologia.test.tsx`. También pasó `npm run lint -- src/componentes/numerologia/panel-contextual-numerologia.tsx src/tests/paginas/numerologia.test.tsx` dentro de `frontend/`.

### Como funciona
1. El usuario toca una opción como `Sendero Natal`, `Día Personal` o `Mes Personal` en la página de numerología.
2. El `RailLateral` de desktop sigue mostrando la cabecera principal del detalle con categoría, título y subtítulo.
3. El panel interno ahora arranca directamente con la lectura del número y los bloques de contenido, en lugar de repetir otra vez la misma cabecera antes de la explicación.
4. En mobile no cambia el comportamiento esperado: el sheet conserva su propia cabecera porque allí no existe el encabezado externo del rail.

---

## Sesion: Podcasts web — copy editorial y retención acotada
**Fecha:** 2026-04-03 ~18:43 (ARG)

### Que se hizo
Se refinó la experiencia web de Podcasts para que las cards usen un único mensaje editorial por tipo, sin repetir título y subtítulo, y se incorporó una retención real por tipo en backend. Además, el historial ahora arranca mostrando 5 registros y puede expandirse inline con `Ver más`.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `backend/app/datos/repositorio_podcast.py` | Agrega política de retención `7/4/4`, límite total de historial y rutina de purga por usuario/tipo ordenada por fecha y creación |
| `backend/app/rutas/v1/podcast.py` | Normaliza retención antes de listar historial y después de generar, y eleva el default del historial al máximo retenido |
| `backend/app/servicios/servicio_podcast.py` | Actualiza los títulos generados para día, semana y mes con el nuevo tono editorial |
| `backend/tests/rutas/test_rutas_podcast.py` | Ajusta las rutas para verificar la normalización del historial y la purga post-generación |
| `backend/tests/servicios/test_servicio_podcast.py` | Actualiza assertions de títulos al nuevo copy generado |
| `backend/tests/servicios/test_repositorio_podcast.py` | Nuevo test unitario para la purga por tipo, offsets `7/4/4` y commit condicional |
| `frontend/src/lib/utilidades/podcast.ts` | Nuevo mapa centralizado de copy web para cards, reproductor e historial visible |
| `frontend/src/app/(app)/podcast/page.tsx` | Reemplaza el copy de cards por mensaje único, cambia el heading de selección y agrega `Ver más / Ver menos` sobre historial |
| `frontend/src/app/(app)/dashboard/page.tsx` | Ajusta los subtítulos de reproducción para usar `Podcast del día/semana/mes` |
| `frontend/src/componentes/layouts/navbar.tsx` | Unifica el naming del menú contextual y del reproductor activo con las nuevas etiquetas compactas |
| `frontend/src/tests/paginas/podcast.test.tsx` | Agrega cobertura para el heading nuevo, el copy editorial por card y la expansión/contracción del historial |
| `frontend/src/tests/componentes/navbar.test.tsx` | Actualiza el menú contextual para validar `Podcast del día`, `Podcast de la semana` y `Podcast del mes` |
| `frontend/src/tests/componentes/reproductor-cosmico.test.tsx` | Alinea el fixture del reproductor con el nuevo subtítulo visible |
| `context/resumen-de-cambios.md` | Documenta esta sesión de ajuste funcional y visual en Podcasts |

### Tests
Se agregaron 4 tests y se ajustaron 7 existentes. `./.venv/bin/pytest tests/rutas/test_rutas_podcast.py tests/servicios/test_servicio_podcast.py tests/servicios/test_repositorio_podcast.py -q` pasó `30 passed`. `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/paginas/podcast.test.tsx src/tests/componentes/navbar.test.tsx src/tests/componentes/reproductor-cosmico.test.tsx` pasó `12 passed`. `npx eslint` sobre los archivos tocados pasó sin errores; quedaron warnings preexistentes del dashboard en imports y variables no usadas que no forman parte de esta sesión.

### Como funciona
1. El usuario entra a `/podcast` y ve tres cards con badge corto (`Podcast diario`, `Podcast semanal`, `Podcast mensual`) y un solo mensaje editorial por tipo, sin subtítulo duplicado.
2. Si un episodio está listo, al reproducirlo desde la card, el historial o el navbar, el reproductor web muestra etiquetas consistentes: `Podcast del día`, `Podcast de la semana` o `Podcast del mes`.
3. El backend conserva como máximo 7 episodios diarios, 4 semanales y 4 mensuales por usuario; cualquier excedente se purga automáticamente al generar y también antes de listar el historial.
4. El historial web pide la colección retenida, muestra solo 5 registros al inicio y permite expandir o contraer inline sin cambiar el contrato del endpoint.

---

## Sesion: Perfil PDF — rediseño editorial ASTRA
**Fecha:** 2026-04-03 ~18:43 (ARG)

### Que se hizo
Se rediseñó por completo el PDF de `Descargar perfil` para que deje de verse como un reporte administrativo y pase a sentirse como un dossier editorial ASTRA. La nueva versión introduce portada premium, jerarquía visual fuerte, fondos y acentos ciruela, tarjetas-resumen y páginas internas mucho más limpias.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `backend/app/servicios/servicio_pdf_perfil.py` | Reescribe el generador PDF con composición editorial, portada visual ASTRA, headers/footers decorados, cards redondeadas, tablas refinadas y resúmenes por sección para Carta Astral, Diseño Humano y Numerología |
| `context/resumen-de-cambios.md` | Documenta esta sesión de rediseño del PDF del perfil |

### Tests
No se agregaron tests nuevos ni se modificaron los existentes. Pasaron `11` tests de `backend/tests/servicios/test_servicio_pdf_perfil.py` y `22` tests de `backend/tests/rutas/test_rutas_perfil.py`. También pasó `ruff check backend/app/servicios/servicio_pdf_perfil.py`.

### Como funciona
1. El usuario hace click en `Descargar perfil` desde el panel izquierdo y el frontend sigue llamando al mismo endpoint `GET /api/v1/profile/me/pdf`, sin cambios de contrato.
2. El backend arma ahora un PDF con una portada nocturna ASTRA, datos editoriales del perfil y un resumen visual inicial de astrología, diseño humano y numerología.
3. Cada disciplina abre con una cabecera propia, un bloque de contexto y tarjetas-resumen que priorizan los datos más importantes antes de entrar en las tablas técnicas.
4. Las tablas internas conservan toda la información funcional previa, pero con tipografía, contraste, bandas alternadas y espaciado más cuidados para lectura real en pantalla o impresión.
5. Si una sección todavía no tiene cálculo, el PDF ya no cae en un bloque plano: muestra un estado vacío integrado al lenguaje visual del documento para mantener coherencia de principio a fin.

---

## Sesion: Web — light theme fase 2 en dashboard, podcast y perfil
**Fecha:** 2026-04-03 ~18:57 (ARG)

### Que se hizo
Se completó la segunda fase visible del light theme web migrando las pantallas de producto que seguían más atadas al dark hardcodeado. `Dashboard`, `Podcast` y `Perfil` ahora usan superficies, bordes, overlays y acentos semánticos del sistema de tema en lugar de colores fijos nocturnos.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/dashboard/page.tsx` | Limpia imports viejos, migra skeletons y estado vacío del pronóstico a tokens del tema, y ajusta el CTA mobile del podcast diario |
| `frontend/src/app/(app)/podcast/page.tsx` | Rehace la pantalla de podcasts para usar hero, cards, historial y botones theme-aware en light/dark |
| `frontend/src/app/(app)/perfil/page.tsx` | Termina la migración visual de perfil en modales, acciones de seguridad, Telegram, sesión y eliminación de cuenta |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Migra el hero principal del dashboard a `tema-superficie-hero` y bordes semánticos |
| `frontend/src/componentes/dashboard-v2/panel-glass.tsx` | Agrega soporte de tono `hero` para paneles internos sobre fondos ciruela |
| `frontend/src/componentes/dashboard-v2/tarjeta-fecha.tsx` | Ajusta la tarjeta de fecha del hero para respetar superficies y contraste del sistema |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Migra la lista de momentos del día a fondo y divisores coherentes con el hero nuevo |
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Migra el bloque del número personal a panel hero semántico |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Migra el bloque lunar del hero y reemplaza fill fijo por token de acento |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Migra las barras de intuición, claridad y fuerza a superficies hero theme-aware |
| `context/resumen-de-cambios.md` | Documenta esta segunda fase del light theme web |

### Tests
0 tests nuevos/modificados. Pasaron `npx eslint` sobre los 10 archivos tocados y `npm run build` dentro de `frontend/` usando Node `20.20.0` (`/opt/homebrew/opt/node@20/bin`).

### Como funciona
1. El usuario entra a `Dashboard` y ya no encuentra skeletons o estados de error clavados en un dark aislado: el hero, los paneles internos y los fallbacks responden al tema activo sin romper la jerarquía ciruela principal.
2. En `Podcast`, la pantalla completa adopta la misma gramática visual que el resto de la app: hero ciruela consistente, cards con superficies semánticas, badges/accent chips del sistema y un historial que se lee bien tanto en claro como en oscuro.
3. En `Perfil`, el selector de tema ya no convive con bloques heredados del dark: modales, cambio de contraseña, Telegram, cierre de sesión y eliminación de cuenta usan el mismo lenguaje visual del nuevo shell light/dark.
4. Los componentes internos del hero del dashboard ahora distinguen entre panel común y panel sobre hero, evitando que el modo claro meta tarjetas blancas con texto claro encima del bloque ciruela.
5. Esta fase deja la base preparada para seguir con las pantallas analíticas restantes (`descubrir`, módulos de cálculo y vistas largas) sin tener que volver a rehacer primitives ni tokens.

---

## Sesion: Web — light theme fase 3 en descubrir y suscripción
**Fecha:** 2026-04-03 ~19:09 (ARG)

### Que se hizo
Se continuó la migración del modo claro sobre el flujo principal de producto llevando `Descubrir`, `Suscripción` y las vistas de `próximamente` al mismo sistema visual semántico del shell. Con esta fase, la navegación entre exploración, upgrades y módulos aún no lanzados deja de romperse con pantallas completamente dark fijas.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/descubrir/page.tsx` | Migra la pantalla a fondo light/dark semántico, hero ciruela compartido y cards theme-aware para las herramientas disponibles y próximas |
| `frontend/src/app/(app)/suscripcion/page.tsx` | Migra el flujo de suscripción a superficies, badges, cards de planes, acciones de cancelación y pagos coherentes con el sistema de tema |
| `frontend/src/componentes/proximamente/feature-proximamente.tsx` | Migra el componente reusable de módulos “próximamente” para que `Calendario Cósmico` y `Retorno Solar` no caigan en un dark aislado |
| `context/resumen-de-cambios.md` | Documenta esta tercera fase del light theme web |

### Tests
0 tests nuevos/modificados. Pasaron `npx vitest run src/tests/paginas/podcast.test.tsx src/tests/componentes/navbar.test.tsx src/tests/componentes/reproductor-cosmico.test.tsx src/tests/paginas/numerologia.test.tsx`, `npx eslint` sobre los 3 archivos tocados y `npm run build` dentro de `frontend/` usando Node `20.20.0` (`/opt/homebrew/opt/node@20/bin`).

### Como funciona
1. El usuario entra a `Descubrir` y ahora ve un fondo claro/lavanda, hero ciruela consistente con el dashboard y cards de acceso que responden al tema activo en lugar de una grilla nocturna fija.
2. Desde esa misma pantalla, cuando abre módulos todavía no lanzados como `Calendario Cósmico` o `Retorno Solar`, la vista de placeholder conserva el mismo lenguaje visual del light theme y no rompe la continuidad del producto.
3. En `Suscripción`, el bloque principal de cuenta y facturación mantiene el hero editorial oscuro como pieza de jerarquía, pero el resto de la página pasa a superficies claras/semánticas con mejor legibilidad en light.
4. Las cards de planes, el historial de pagos, la sincronización con MercadoPago y los estados de cancelación usan ahora bordes, fondos y acentos del sistema de tema, sin depender de clases dark hardcodeadas.
5. Esta fase deja el flujo principal de exploración y monetización cubierto por el light theme, reduciendo el trabajo pendiente a módulos analíticos y paneles contextuales más especializados.

---

## Sesion: Perfil Espiritual — fix de polling y contrato de generación
**Fecha:** 2026-04-03 ~19:31 (ARG)

### Que se hizo
Se corrigió el flujo inicial de `perfil espiritual`, que estaba entrando en error cuando el backend devolvía `datos: null` durante la generación en background. Además, la pantalla ahora muestra el mensaje real del backend cuando faltan cálculos base en vez de caer siempre en un fallback genérico.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `backend/app/rutas/v1/perfil_espiritual.py` | Ajusta el contrato del endpoint para devolver `estado` dentro de `datos`, tanto en `generando` como en `listo`, y mantener compatibilidad con el cliente API que desenvuelve respuestas |
| `frontend/src/lib/hooks/usar-perfil-espiritual.ts` | Corrige el hook para manejar el estado `generando` sin romper la query y seguir haciendo polling hasta que exista `resumen` + `foda` |
| `frontend/src/app/(app)/perfil-espiritual/page.tsx` | Muestra el detalle real del error API y evita confundir un fallo de polling con “faltan cartas” |
| `backend/tests/rutas/test_rutas_perfil_espiritual.py` | Agrega cobertura del endpoint para perfil listo, generación en background y rechazo cuando faltan cálculos base |
| `frontend/src/tests/hooks/usar-perfil-espiritual.test.ts` | Agrega cobertura del hook para estados `generando`, `listo` y propagación de errores |
| `context/resumen-de-cambios.md` | Documenta esta corrección del flujo de Perfil Espiritual |

### Tests
Se agregaron `6` tests nuevos. Pasaron `3/3` tests de `backend/tests/rutas/test_rutas_perfil_espiritual.py` con `backend/.venv/bin/python -m pytest tests/rutas/test_rutas_perfil_espiritual.py`, `3/3` tests de `frontend/src/tests/hooks/usar-perfil-espiritual.test.ts` con `npx -y node@20 ./node_modules/vitest/vitest.mjs run src/tests/hooks/usar-perfil-espiritual.test.ts` y `npx eslint` sobre los archivos frontend tocados.

### Como funciona
1. Cuando el usuario entra a `/perfil-espiritual`, el backend primero busca un cálculo persistido del tipo `perfil-espiritual`.
2. Si ya existe, responde con `datos.estado = "listo"` junto al `resumen` y el `foda`, y el hook entrega ese objeto directamente a la pantalla.
3. Si todavía no existe pero sí están `carta natal`, `diseño humano` y `numerología`, el endpoint responde con `datos.estado = "generando"` y dispara la generación en background.
4. El hook detecta ese estado, retorna `null` sin romper la query y sigue consultando cada 3 segundos hasta que el backend persista el resultado.
5. Si faltan cálculos base, el backend responde `422` con su detalle real y la página ahora muestra ese mensaje en lugar de un error genérico derivado del frontend.

---

## Sesion: Perfil Espiritual — corrección de truncamiento IA y loop infinito
**Fecha:** 2026-04-03 ~20:01 (ARG)

### Que se hizo
Se diagnosticó el motivo por el que `Perfil Espiritual` seguía cargando indefinidamente aun después del fix anterior: la generación en background sí arrancaba, pero Claude devolvía el JSON truncado por falta de `max_tokens`, lo que producía un `JSONDecodeError` silencioso y dejaba a la UI en polling infinito. Se endureció el backend para reintentar, limitar el tiempo de espera y exponer el error real si la generación vuelve a fallar.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `backend/app/servicios/servicio_perfil_espiritual.py` | Aumenta el presupuesto de salida, agrega timeout explícito, reintento automático si la respuesta JSON sale truncada y parseo más robusto del bloque JSON |
| `backend/app/rutas/v1/perfil_espiritual.py` | Guarda el último error de generación por usuario y deja de responder `generando` eternamente cuando el background task falla |
| `backend/tests/servicios/test_servicio_perfil_espiritual.py` | Nueva cobertura para parseo de respuestas del modelo y reintento cuando la primera salida viene truncada |
| `backend/tests/rutas/test_rutas_perfil_espiritual.py` | Agrega cobertura para el estado de error persistido de la ruta |
| `context/resumen-de-cambios.md` | Documenta esta corrección de truncamiento y loop infinito |

### Tests
Se agregaron `4` tests nuevos y pasaron `7/7` tests combinados de `tests/rutas/test_rutas_perfil_espiritual.py` y `tests/servicios/test_servicio_perfil_espiritual.py` con `backend/.venv/bin/python -m pytest`. También pasó `npx eslint` sobre los archivos frontend vinculados al módulo.

### Como funciona
1. Cuando el backend dispara la generación del perfil espiritual, ahora llama a Claude con un margen de salida suficiente para el FODA completo y un timeout de seguridad para evitar requests colgados.
2. Si el modelo responde con JSON recortado o envuelto en texto extra, el servicio intenta normalizarlo; si detecta truncamiento, reintenta automáticamente con más margen antes de fallar.
3. Si la generación termina bien, el cálculo `perfil-espiritual` se persiste en `calculos` y el polling del frontend encuentra `estado = listo`.
4. Si la generación falla incluso después de reintentar, el backend guarda el error temporal en memoria por usuario y la próxima consulta devuelve ese error en vez de seguir respondiendo `generando`.
5. Se verificó el flujo real generando exitosamente un `perfil-espiritual` persistido sobre un perfil con `natal`, `human-design` y `numerology` ya almacenados.

---

## Sesion: Web — light theme fase 4 en módulos analíticos y contraste editorial
**Fecha:** 2026-04-03 ~19:32 (ARG)

### Que se hizo
Se avanzó con la siguiente fase del light theme migrando los paneles analíticos y narrativos que todavía conservaban dark hardcodeado, sobre todo en `Carta Natal`, `Numerología` y `Diseño Humano`. Además, se corrigió el contraste de textos de hero y badges/chips en dashboard, suscripción y perfil para que el modo claro no dependa de blancos fijos ni verdes lavados.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/estilos/tokens/colores.css` | Agrega tokens semánticos para hero text, badges neutrales/exitosos/error/violeta y overlay suave |
| `frontend/src/app/globals.css` | Agrega utilidades globales `tema-hero-*` para reutilizar contraste consistente en bloques editoriales |
| `frontend/src/componentes/layouts/rail-lateral.tsx` | Migra el rail lateral a superficies, bordes, overlay y texto semánticos del shell |
| `frontend/src/componentes/numerologia/panel-contextual-numerologia.tsx` | Lleva el panel contextual de numerología a superficies theme-aware y limpia la API interna del componente |
| `frontend/src/componentes/diseno-humano/panel-contextual.tsx` | Migra el panel contextual HD a shell/hero semántico tanto en móvil como en escritorio |
| `frontend/src/lib/utilidades/interpretaciones-natal.ts` | Reemplaza badges de aspectos y dignidades por tokens semánticos con mejor contraste en light/dark |
| `frontend/src/componentes/carta-natal/estilos.ts` | Reengancha las superficies base de carta natal a las primitives del sistema de tema |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Corrige contraste del hero de carta natal usando tokens de hero en títulos, metadata y copy |
| `frontend/src/componentes/carta-natal/planetas-narrativo.tsx` | Migra lista de planetas a tokens de shell y badges semánticos |
| `frontend/src/componentes/carta-natal/aspectos-narrativo.tsx` | Migra lista de aspectos a tokens de shell y badges semánticos |
| `frontend/src/componentes/carta-natal/seccion-triada.tsx` | Migra textos y estados hover de la tríada al sistema light/dark |
| `frontend/src/componentes/carta-natal/casas-grid.tsx` | Migra la grilla de casas a superficies y chips semánticos |
| `frontend/src/componentes/carta-natal/distribucion-energetica.tsx` | Migra el resumen energético a fondo y texto semánticos |
| `frontend/src/componentes/carta-natal/panel-contextual.tsx` | Reescribe el panel contextual de carta natal con cards, chips y bloque técnico theme-aware |
| `frontend/src/componentes/dashboard-v2/panel-glass.tsx` | Permite inyectar estilos semánticos en la primitive para estados destacados |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Ajusta contraste de CTA y textos del hero principal del dashboard |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Corrige contraste de texto e iconos dentro del hero diario |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Corrige contraste del texto lunar en hero |
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Corrige contraste del bloque de número personal en hero |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Corrige contraste de etiquetas e iconos de intuición/claridad/fuerza |
| `frontend/src/componentes/dashboard-v2/areas-vida-v2.tsx` | Reemplaza etiquetas verdes/rojas por semántica de badge del sistema |
| `frontend/src/componentes/dashboard-v2/semana-v2.tsx` | Corrige chips, cards de días y badge `Hoy` para que no rompan en light |
| `frontend/src/componentes/dashboard-v2/mensaje-clave.tsx` | Migra el bloque editorial a tokens de hero |
| `frontend/src/componentes/dashboard-v2/cta-numerologia.tsx` | Migra textos del CTA numerológico a contraste semántico |
| `frontend/src/componentes/dashboard-v2/tarjeta-podcast.tsx` | Migra copy editorial y acento de estado del podcast diario |
| `frontend/src/app/(app)/descubrir/page.tsx` | Ajusta contraste del hero en descubrir con tokens de hero |
| `frontend/src/componentes/proximamente/feature-proximamente.tsx` | Ajusta contraste del hero reusable de “próximamente” |
| `frontend/src/app/(app)/podcast/page.tsx` | Ajusta contraste del hero de podcasts al mismo sistema |
| `frontend/src/app/(app)/suscripcion/page.tsx` | Corrige alerts/chips y badges del flujo de suscripción para que el éxito/cancelación tengan contraste real |
| `frontend/src/app/(app)/perfil/page.tsx` | Corrige alerts/chips y bloques de riesgo del perfil con tokens semánticos |
| `context/resumen-de-cambios.md` | Documenta esta fase de migración de paneles analíticos y contraste editorial |

### Tests
0 tests nuevos/modificados. Pasaron `npx eslint` sobre los archivos tocados, `npx vitest run src/tests/paginas/numerologia.test.tsx src/tests/paginas/podcast.test.tsx src/tests/componentes/navbar.test.tsx src/tests/componentes/reproductor-cosmico.test.tsx` con `19 passed`, y `npm run build` dentro de `frontend/` usando Node `20.20.0` (`/opt/homebrew/opt/node@20/bin`).

### Como funciona
1. Cuando el usuario entra en módulos analíticos como `Carta Natal`, `Numerología` o `Diseño Humano`, los paneles laterales y contextuales ya no dependen de fondos oscuros y texto blanco fijo: responden al tema activo con superficies y jerarquías semánticas.
2. En `Carta Natal`, tanto las listas narrativas como los detalles de planeta, aspecto, casa, tríada y distribución energética mantienen la misma lectura en claro y oscuro, con badges de dignidad/aspecto y chips de estado consistentes.
3. En `Dashboard`, los heroes y paneles editoriales siguen usando el bloque ciruela como pieza de marca, pero ahora títulos, subtítulos, CTAs y microcomponentes internos usan tokens de contraste compartidos en lugar de `white` hardcodeado.
4. En `Suscripción` y `Perfil`, los mensajes de éxito, error, cancelación y riesgo dejaron de usar combinaciones verdes o rojas lavadas: ahora heredan los tokens semánticos del sistema para que el contraste sea suficiente en modo claro.
5. Esta fase deja el light theme web mucho más homogéneo y reduce el trabajo pendiente a pantallas secundarias o flujos específicos que todavía conserven piezas heredadas del dark anterior.

---

## Sesion: Web — light theme fase 5 en checkout y estados terminales
**Fecha:** 2026-04-03 ~19:49 (ARG)

### Que se hizo
Se continuó la migración del light theme sobre los flujos secundarios, cerrando checkout, estados terminales de suscripción y algunas pantallas editoriales complementarias que todavía se apoyaban en el dark anterior. La fase también consolidó una primitive reutilizable para estados de pago, evitando que el flujo de MercadoPago se siga renderizando como una isla visual aparte.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/ui/estado-terminal.tsx` | Nuevo componente reusable para estados de pago/checkout con hero ciruela, fondo semántico, iconografía de estado y acciones primarias/secundarias |
| `frontend/src/app/(checkout)/checkout/exito/page.tsx` | Reemplaza el dark fijo por el nuevo estado terminal semántico de checkout exitoso |
| `frontend/src/app/(checkout)/checkout/fallo/page.tsx` | Reemplaza el dark fijo por el nuevo estado terminal semántico de checkout con error |
| `frontend/src/app/(checkout)/checkout/pendiente/page.tsx` | Reemplaza el dark fijo por el nuevo estado terminal semántico de checkout pendiente |
| `frontend/src/app/(app)/suscripcion/exito/page.tsx` | Refactoriza los tres estados (`verificando`, `confirmado`, `timeout`) para usar la primitive nueva y mantener consistencia visual |
| `frontend/src/app/(app)/suscripcion/fallo/page.tsx` | Migra la pantalla de error de suscripción al nuevo sistema light/dark |
| `frontend/src/app/(app)/suscripcion/pendiente/page.tsx` | Migra la pantalla de pago pendiente de suscripción al nuevo sistema light/dark |
| `frontend/src/app/(app)/match-pareja/page.tsx` | Ajusta la pantalla próxima de compatibilidad para que use fondos, surfaces y texto semánticos del shell |
| `frontend/src/app/(app)/transitos/page.tsx` | Migra la pantalla de tránsitos a fondo light/dark semántico, hero compartido y cards de planetas con mejor contraste |
| `context/resumen-de-cambios.md` | Documenta esta quinta fase del light theme web |

### Tests
0 tests nuevos/modificados. Pasaron `npx eslint` sobre los archivos tocados, `npx vitest run src/tests/paginas/suscripcion.test.tsx` con `5 passed` y `npm run build` dentro de `frontend/` usando Node `20.20.0` (`/opt/homebrew/opt/node@20/bin`).

### Como funciona
1. Cuando el usuario vuelve desde MercadoPago a `/checkout/exito`, `/checkout/fallo` o `/checkout/pendiente`, ahora entra a una vista alineada con el sistema visual ASTRA, en vez de una página dark aislada.
2. En `/suscripcion/exito`, el flujo de verificación sigue funcionando igual, pero cada estado visual usa la misma primitive semántica y mantiene coherencia con el shell light/dark.
3. Las pantallas `/suscripcion/fallo` y `/suscripcion/pendiente` ya no repiten estilos sueltos: comparten estructura, acciones y contraste con el resto de los estados terminales del producto.
4. La pantalla `Match de Pareja` conserva el hero ciruela como pieza editorial, pero sus paneles internos y textos ahora responden al sistema de tema activo.
5. La vista `Tránsitos` deja de apoyarse en fondos dark hardcodeados y pasa a usar hero, paneles, estados de error y cards de planetas coherentes con el light theme general de la app.

---

## Sesion: Web — login y onboarding premium ciruela
**Fecha:** 2026-04-03 ~19:41 (ARG)

### Que se hizo
Se rediseñaron `login`, `registro` y `onboarding` web para alinearlos con el sistema premium ciruela que ya usan el shell y las pantallas principales. El objetivo fue sacar el split blanco legacy, unificar hero/superficies/jerarquía y dejar el flujo de acceso mucho más atractivo y coherente con el resto de ASTRA.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/layout-auth.tsx` | Rehace el shell de auth como composición editorial theme-aware con hero ciruela, panel glass y versión compacta para mobile |
| `frontend/src/componentes/layouts/layout-onboarding.tsx` | Reemplaza el layout viejo de onboarding por un shell alineado al acceso premium y un modo de cálculo coherente con el sistema visual |
| `frontend/src/app/(auth)/login/page.tsx` | Rediseña login con mejor framing, CTA más claro, bloque contextual y estados visuales integrados al shell nuevo |
| `frontend/src/app/(auth)/registro/page.tsx` | Rediseña registro con narrativa por etapas, mejores superficies y consistencia con el flujo de acceso |
| `frontend/src/app/(onboarding)/onboarding/page.tsx` | Replantea el formulario de datos natales y la pantalla de cálculo para que usen la misma gramática visual del nuevo auth web |
| `context/resumen-de-cambios.md` | Documenta esta sesión de rediseño del flujo de acceso web |

### Tests
0 tests nuevos/modificados. Pasaron `npm run lint -- src/componentes/layouts/layout-auth.tsx src/componentes/layouts/layout-onboarding.tsx src/app/(auth)/login/page.tsx src/app/(auth)/registro/page.tsx src/app/(onboarding)/onboarding/page.tsx` y `npm run build` dentro de `frontend/` usando Node `20.20.0` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. `Login` y `Registro` ya no viven dentro de un split duro con panel blanco aislado: ambos se montan sobre un shell premium ciruela con hero editorial, glows, panel glass y versión mobile compacta.
2. El contenido de cada pantalla ahora tiene mejor jerarquía de entrada: badge corto, título claro, bloque de contexto útil, CTA primario consistente y estados de error integrados al sistema de superficies del shell.
3. `Onboarding` usa la misma base visual que el acceso, pero con framing específico de perfil base: cards de módulos que se van a generar, pistas de precisión y un formulario de datos natales mucho menos legacy.
4. El paso de cálculo del onboarding conserva la lógica de generación existente, pero ahora se presenta como una calibración editorial del perfil con progreso más claro y feedback visual coherente con ASTRA.
5. Con este cambio, el flujo completo `registro/login -> onboarding -> dashboard` deja de romper la continuidad visual respecto de `Descubrir`, `Perfil` y el resto del sistema premium ciruela.

---

## Sesion: Web — ajuste de viewport y limpieza de login
**Fecha:** 2026-04-03 ~19:46 (ARG)

### Que se hizo
Se hizo una segunda pasada sobre el flujo de acceso web para fijar el shell al alto real del viewport y limpiar el formulario de `login`, que todavía tenía demasiado contexto compitiendo con la acción principal de entrar.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/layouts/layout-auth.tsx` | Ajusta el shell para usar `100dvh`, centrar mejor el panel y evitar que el acceso se sienta más largo que el viewport |
| `frontend/src/app/(auth)/login/page.tsx` | Simplifica el contenido del login quitando bloques redundantes y dejando una jerarquía más limpia y directa |
| `context/resumen-de-cambios.md` | Documenta esta segunda pasada de refinamiento visual sobre acceso web |

### Tests
0 tests nuevos/modificados. Pasaron `npm run lint -- src/componentes/layouts/layout-auth.tsx src/app/(auth)/login/page.tsx` y `npm run build` dentro de `frontend/` usando Node `20.20.0` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. La pantalla de acceso ahora queda clavada al alto del viewport con `100dvh`, de modo que el shell no se percibe más largo o suelto de lo necesario.
2. En desktop, el panel derecho queda mejor centrado y el contenido respira más sin perder el hero ciruela del lado editorial.
3. El formulario de `Login` deja de mostrar bloques secundarios innecesarios y concentra la lectura en tres cosas: entrar con Google, entrar con email o ir a recuperación.
4. La jerarquía del login ahora es más corta y clara: badge breve, título, una sola línea contextual, formulario y enlace a registro sin tarjetas extra.

---

## Sesion: Web — login más limpio y Google oficial color
**Fecha:** 2026-04-03 ~19:52 (ARG)

### Que se hizo
Se refinó otra vez la pantalla de `login` para hacerla todavía más limpia: se eliminó información secundaria del encabezado y el CTA de Google pasó a usar un logo `G` multicolor en lugar del icono monocromo genérico.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(auth)/login/page.tsx` | Quita badge y bajada del encabezado, simplifica el hero del login y reemplaza el icono de Google por una versión oficial en color dentro del botón |
| `context/resumen-de-cambios.md` | Documenta este refinamiento puntual del login web |

### Tests
0 tests nuevos/modificados. Pasaron `npm run lint -- src/app/(auth)/login/page.tsx` y `npm run build` dentro de `frontend/` usando Node `20.20.0` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. El encabezado de `Login` queda reducido al título principal, eliminando piezas que competían con la acción de entrar.
2. El botón `Continuar con Google` mantiene el flujo existente pero ahora muestra una `G` multicolor más reconocible y más alineada con la expectativa visual del usuario.
3. El resto del formulario conserva la jerarquía limpia de la pasada anterior, pero con todavía menos ruido antes del CTA principal.

---

## Sesion: Calendario Cósmico mensual con ritmo personal y eventos persistidos
**Fecha:** 2026-04-03 ~19:50 (ARG)

### Que se hizo
Se reemplazó el placeholder de `Calendario Cósmico` por una vista mensual real, compacta y orientada a baja carga cognitiva. La pantalla ahora usa una única superficie principal con grilla mensual, detalle contextual integrado, número de año/día personal calculado on the fly y momentos clave tomados de los `transitos_diarios` persistidos.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `backend/app/rutas/v1/calendario_cosmico.py` | Reconecta los endpoints del calendario contra tránsitos persistidos, versiona la clave de cache y amplía la ventana mensual a 42 días |
| `backend/app/servicios/servicio_transitos.py` | Enriquece día/rango persistidos con `fase_lunar`, `estado` y `eventos`, calculando fallback cuando la fila no los trae persistidos |
| `backend/app/esquemas/calendario_cosmico.py` | Actualiza los esquemas del calendario con eventos, aspectos y estado del día |
| `backend/tests/servicios/test_transitos_persistidos.py` | Ajusta fixtures y agrega cobertura para validar que el rango persistido expone eventos y estado |
| `frontend/src/app/(app)/calendario-cosmico/page.tsx` | Reemplaza la pantalla `Próximamente` por la experiencia mensual real con hero compacto y contenedor principal expandido |
| `frontend/src/app/(app)/calendario-cosmico/_componentes/calendario-mes.tsx` | Nueva grilla mensual estilo agenda, con foco en hoy, scroll a la semana activa, tooltips y celdas densas sin cards anidadas |
| `frontend/src/app/(app)/calendario-cosmico/_componentes/panel-detalle-dia.tsx` | Nuevo panel contextual integrado al calendario con año/día personal, fase lunar, eventos y planetas clave |
| `frontend/src/lib/utilidades/calendario-cosmico.ts` | Nueva utilidad para calcular ritmo personal local y transformar eventos de tránsito en mensajes compactos para UI |
| `frontend/src/lib/tipos/calendario-cosmico.ts` | Amplía los tipos web del calendario con eventos, fase lunar, aspectos y estado |
| `mobile/src/lib/tipos/calendario-cosmico.ts` | Sincroniza los tipos mobile con el nuevo contrato del backend para no romper compilación compartida |
| `frontend/src/app/(app)/descubrir/page.tsx` | Cambia `Calendario Cósmico` de `Próximamente` a disponible y actualiza el copy de acceso |
| `frontend/src/componentes/layouts/sidebar-navegacion.tsx` | Mueve `Calendario Cósmico` a la navegación activa y lo retira del bloque de próximos módulos |
| `frontend/src/tests/paginas/calendario-cosmico.test.tsx` | Agrega cobertura para la vista mensual, el cálculo de ritmo personal y la actualización del detalle al seleccionar otro día |
| `context/resumen-de-cambios.md` | Documenta la implementación completa del módulo |

### Tests
Se agregó 1 archivo de tests frontend nuevo con 3 casos y se ajustó 1 suite backend existente. Pasaron `3/3` tests de `frontend/src/tests/paginas/calendario-cosmico.test.tsx`, `36` tests backend en `tests/servicios/test_transitos_persistidos.py` + `tests/servicios/test_servicio_calendario_cosmico.py`, `ruff check` sobre backend y `eslint` sobre los archivos frontend/backend tocados sin errores.

### Como funciona
1. Al entrar a `/calendario-cosmico`, la app abre una vista mensual real en vez del placeholder, fija hoy como punto de arranque y deja visible la semana activa dentro de la grilla.
2. Cada celda del mes muestra el día, la fase lunar, los hitos más relevantes del tránsito y el número personal del usuario calculado en el momento a partir de la fecha de nacimiento y la fecha seleccionada.
3. El backend toma los datos desde `transitos_diarios` y, si una fila todavía no trae `eventos`, los recompone en la respuesta comparando contra el día anterior para no dejar huecos visuales en la agenda.
4. En desktop y mobile web, el usuario puede recorrer sólo el mes actual y una ventana mensual hacia adelante; al seleccionar un día se actualiza un panel contextual integrado con año personal, día personal, momentos clave, retrogradaciones activas y planetas de referencia.
5. `Descubrir` y la navegación principal dejan de etiquetar a `Calendario Cósmico` como futuro y lo exponen como módulo disponible dentro del sistema.

---

## Sesion: Web — light theme fase 6 en carta astral, numerología y diseño humano
**Fecha:** 2026-04-03 ~20:06 (ARG)

### Que se hizo
Se cerró la siguiente fase del light theme en los módulos analíticos que todavía arrastraban shells dark fijos. `carta-natal`, `numerologia` y `diseno-humano` pasaron a usar superficies semánticas del sistema web, con heroes en modo claro, textos de contraste oscuros y chips/badges corregidos para que no queden lavados en light.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/carta-natal/page.tsx` | Migra fondo, estados de carga, formulario inicial, tabs del explorador, modal de rueda y sheet móvil a tokens light/dark semánticos |
| `frontend/src/componentes/carta-natal/hero-carta.tsx` | Reconvierte el hero principal a superficie clara con título y metadata en color de contraste del shell |
| `frontend/src/componentes/carta-natal/estilos.ts` | Ajusta la primitive compartida de superficie heroica de carta natal para que deje de forzar el tratamiento dark |
| `frontend/src/app/(app)/numerologia/page.tsx` | Migra hero, formularios, núcleo, ritmo, meses, etapas y drawer móvil a superficies/chips semánticos con contraste correcto en light |
| `frontend/src/app/(app)/diseno-humano/page.tsx` | Migra hero, estados vacíos/carga, listas de centros/canales/activaciones, cruz, modal de Body Graph y overlay móvil al sistema light/dark de la web |
| `frontend/src/componentes/diseno-humano/panel-contextual.tsx` | Corrige el header móvil del panel contextual para que no siga usando hero dark con títulos blancos en modo claro |
| `context/resumen-de-cambios.md` | Documenta esta fase del light theme sobre módulos analíticos |

### Tests
0 tests nuevos/modificados. Pasaron `eslint` sobre los 6 archivos frontend tocados, `15/15` tests de `frontend/src/tests/paginas/carta-natal.test.tsx`, `frontend/src/tests/paginas/numerologia.test.tsx` y `frontend/src/tests/paginas/diseno-humano.test.tsx`, y `npm run build` completo dentro de `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. En `Carta Natal`, el shell deja de usar fondo fijo `#16011B`: el hero, la carga, el alta manual, la rueda natal y el panel móvil ahora se montan sobre el sistema light/dark del shell web y los títulos ya no quedan en blanco en modo claro.
2. En `Numerología`, la pantalla pasa de una estética nocturna fija a una lectura clara con superficies blancas/violeta suave; el hero usa texto de contraste oscuro, los meses y el chip `Ahora` recuperan legibilidad y el panel móvil mantiene la misma lógica visual.
3. En `Diseño Humano`, el hero, las listas técnicas y el modal de `Body Graph` dejan de sentirse heredados del dark original; tipo, autoridad, perfil, centros, canales y activaciones ahora responden al mismo sistema visual que el resto de la web.
4. Los chips y badges seleccionados o destacados de estas tres pantallas se normalizan con tokens semánticos de violeta/exito/error del shell, evitando verdes o transparencias con poco contraste en light.

---

## Sesion: Web — dashboard light, upgrade de la primera tarjeta
**Fecha:** 2026-04-04 ~13:00 (ARG)

### Que se hizo
Se refinó la primera tarjeta del hero del dashboard para que deje de verse como un bloque violeta heredado del dark mode. La tarjeta `Número personal` ahora usa una superficie clara integrada al sistema light, con el violeta reservado como acento tipográfico y no como fondo dominante.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Replantea la tarjeta `Número personal` con una jerarquía más editorial, fondo claro, placa numérica suave y mejor contraste para light mode |
| `context/resumen-de-cambios.md` | Documenta este ajuste puntual del dashboard light |

### Tests
0 tests nuevos/modificados. Pasaron `eslint` sobre `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` y `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx` dentro de `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. La tarjeta `Número personal` del hero mantiene su ubicación y el mismo dato funcional, pero cambia su materialidad visual para no competir con el fondo ciruela del hero.
2. El número se presenta dentro de una placa clara con borde sutil y tipografía destacada, mientras el resto del texto usa la escala de contraste del shell light.
3. En light mode, el resultado se siente más premium y consistente con el resto del dashboard; en dark mode, la misma tarjeta sigue funcionando porque depende de tokens semánticos y no de colores hardcodeados.

---

## Sesion: Calendario Cósmico — tooltip compacto y reposicionamiento de hover
**Fecha:** 2026-04-04 ~13:08 (ARG)

### Que se hizo
Se corrigió el comportamiento del tooltip flotante en la grilla mensual del `Calendario Cósmico`. Ahora acompaña el hover en tiempo real, invierte su posición contra los bordes del viewport y se limpia en `scroll` o `resize` para no quedar desfasado ni montarse sobre el extremo derecho.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/calendario-cosmico/_componentes/calendario-mes.tsx` | Reemplaza el posicionamiento estático del tooltip por cálculo dinámico en `mousemove`, con límites de viewport y cierre automático en scroll/resize |
| `frontend/src/tests/paginas/calendario-cosmico.test.tsx` | Actualiza la suite a la UI compacta actual y agrega cobertura del cálculo de reposicionamiento del tooltip |
| `context/resumen-de-cambios.md` | Documenta esta corrección puntual de interacción |

### Tests
0 archivos nuevos. Pasaron `eslint` sobre `frontend/src/app/(app)/calendario-cosmico/_componentes/calendario-mes.tsx` y `frontend/src/tests/paginas/calendario-cosmico.test.tsx`, más `4/4` tests de `frontend/src/tests/paginas/calendario-cosmico.test.tsx` dentro de `frontend/`.

### Como funciona
1. Cuando el usuario entra a un casillero con eventos, el tooltip aparece pegado al cursor en lugar de quedarse en la posición inicial del `mouseenter`.
2. Si el cursor está cerca del borde derecho o inferior, la caja se invierte hacia la izquierda o hacia arriba para mantenerse dentro del viewport.
3. Si el usuario hace scroll sobre la grilla o cambia el tamaño de la ventana, el tooltip activo se cierra para evitar posiciones obsoletas o superpuestas.

---

## Sesion: Calendario Cósmico — recodificación del hover anclado al casillero
**Fecha:** 2026-04-04 ~13:14 (ARG)

### Que se hizo
Se recodificó la interacción de hover del calendario mensual para dejar de seguir al cursor y pasar a un tooltip anclado al casillero activo. El posicionamiento ahora se calcula con el tamaño real del popover y con el rectángulo del día hovered/focused, lo que elimina el desfase visual y vuelve estable el comportamiento en los bordes.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/calendario-cosmico/_componentes/calendario-mes.tsx` | Reescribe el sistema de hover: elimina `mousemove`, separa contenido y posición del tooltip, lo ancla al botón del día y reposiciona usando tamaño medido + viewport |
| `frontend/src/tests/paginas/calendario-cosmico.test.tsx` | Ajusta la cobertura para validar el cálculo del tooltip anclado al casillero y mantener la interacción de hover del módulo |
| `context/resumen-de-cambios.md` | Documenta esta recodificación del hover |

### Tests
0 archivos nuevos. Pasaron `eslint` sobre `frontend/src/app/(app)/calendario-cosmico/_componentes/calendario-mes.tsx` y `frontend/src/tests/paginas/calendario-cosmico.test.tsx`, más `4/4` tests de `frontend/src/tests/paginas/calendario-cosmico.test.tsx` dentro de `frontend/`.

### Como funciona
1. Al entrar con mouse o foco a un día del calendario, el sistema guarda el casillero activo como ancla visual y no vuelve a seguir el puntero.
2. El tooltip se renderiza una vez, mide su tamaño real y calcula su posición final centrado sobre el día, priorizando aparecer arriba y cayendo debajo sólo si no hay espacio.
3. En bordes laterales o en ventanas más chicas, la posición horizontal se clampa al viewport para que el popover no se corte ni quede montado de forma errática.
4. Cuando el usuario sale del casillero, hace blur o el ancla queda fuera de pantalla durante scroll/resize, el hover se limpia y no deja overlays colgados.

---

## Sesion: Web — dashboard light, unificación del hero editorial
**Fecha:** 2026-04-04 ~13:05 (ARG)

### Que se hizo
Se hizo una segunda pasada sobre el hero del dashboard para unificar la familia visual de sus tarjetas internas en light mode. Además se corrigió la placa de `Número personal`, que había quedado con un degradé inconsistente respecto del sistema ciruela/light que venimos usando.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/tarjeta-fecha.tsx` | Convierte la tarjeta de fecha a una placa clara con badge de día y jerarquía más editorial |
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Quita el degradé inconsistente y deja la placa numérica con acento violeta controlado y fondo sólido del sistema |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Migra la tarjeta lunar a una superficie clara con icono contenido y metadata consistente con light |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Replantea las barras de intuición/claridad/fuerza con contenedores claros, acento violeta y lectura más limpia |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Reconvierte la lista de momentos del día a una tarjeta clara con chips de bloque y mejor contraste |
| `context/resumen-de-cambios.md` | Documenta esta unificación visual del hero del dashboard |

### Tests
0 tests nuevos/modificados. Pasaron `eslint` sobre los 5 componentes de `frontend/src/componentes/dashboard-v2/` tocados y `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx` dentro de `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. El hero del dashboard mantiene su estructura, pero las tarjetas internas dejan de apoyarse en vidrios violetas oscuros y pasan a una lógica más clara y más coherente con el light mode.
2. Fecha, número personal, fase lunar, momentos del día y niveles de energía ahora comparten el mismo lenguaje material: superficies claras, bordes suaves y acento violeta sólo en puntos de énfasis.
3. La tarjeta `Número personal` conserva el foco tipográfico, pero sin el degradé anterior; eso la integra mejor al conjunto y evita que se vea como una pieza ajena al sistema visual del hero.

---

## Sesion: Web — dashboard y podcast, neutralización final del hero light
**Fecha:** 2026-04-04 ~16:21 (ARG)

### Que se hizo
Se hizo una nueva revisión del hero del dashboard y de la portada de podcast para quitar el peso violeta residual y alinearlos con la superficie clara que ya usa Carta Astral. También se corrigió la percepción de re-render en podcast eliminando la doble suscripción a `usarPodcastHoy` y dejando el polling concentrado en un solo query con intervalo dinámico.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Reduce la presencia violeta del hero, ajusta glows al patrón de Carta Astral, neutraliza el CTA principal y compacta la estructura interna |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Compacta la lista de etapas del día, elimina los chips de mañana/tarde/noche y deja sólo el icono como identificador |
| `frontend/src/app/(app)/dashboard/page.tsx` | Reduce el margen superior del contenido para acercar el hero al borde superior del shell |
| `frontend/src/app/(app)/podcast/page.tsx` | Quita la lectura violeta del hero y de las cards/lista de historial, pasando iconografía y superficies a materiales claros del sistema |
| `frontend/src/lib/hooks/usar-podcast.ts` | Centraliza el polling del estado de podcasts en un solo query y acelera el refresco sólo cuando hay generación en curso |
| `frontend/src/tests/paginas/podcast.test.tsx` | Actualiza la suite al copy actual y fija un estado premium explícito para que los asserts no dependan del store implícito |
| `context/resumen-de-cambios.md` | Documenta esta revisión visual y funcional |

### Tests
0 archivos nuevos. Pasaron `eslint` sobre los archivos tocados dentro de `frontend/`, `13/13` tests de `frontend/src/tests/paginas/dashboard.test.tsx` y `frontend/src/tests/paginas/podcast.test.tsx`, y `npm run build` completo en `frontend/`.

### Como funciona
1. El hero principal del dashboard sigue mostrando fecha, podcast, etapas del día y métricas, pero ahora sobre una superficie clara más cercana a Carta Astral y con menos padding superior en la página.
2. Las etapas del día pasan a una lectura más compacta: cada bloque queda identificado por su icono y su frase, sin chips redundantes que duplicaban la información.
3. La portada de podcast usa el mismo lenguaje material claro en hero, cards e historial, de modo que el módulo deja de sentirse como una pantalla aparte teñida de violeta.
4. El refresco de `Elegí tu podcast` ya no depende de dos consultas activas sobre la misma key; el hook decide solo si refresca cada 5 segundos cuando un episodio está en proceso o cada 60 segundos cuando todo está estable.

---

## Sesion: Web — dashboard light, corrección estructural del alto del hero
**Fecha:** 2026-04-04 ~16:30 (ARG)

### Que se hizo
Se corrigió el alto excesivo del hero principal del dashboard con un ajuste estructural, no sólo de padding. El resumen derecho dejó de apilar tres tarjetas altas en desktop y pasó a una composición compacta que reduce la altura total del bloque.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Reorganiza el layout desktop del hero para que la columna derecha use un resumen compacto y no fuerce una fila tan alta |
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Agrega variante `compacto` para el resumen desktop del hero |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Agrega variante `compacto` con lectura más breve para el hero |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Agrega variante `compacto` con métricas resumidas en una sola fila |
| `context/resumen-de-cambios.md` | Documenta esta corrección puntual del hero |

### Tests
0 archivos nuevos. Pasaron `eslint` sobre los componentes tocados dentro de `frontend/`, `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx`, y `npm run build` completo en `frontend/`.

### Como funciona
1. En mobile el hero mantiene la lógica horizontal de tarjetas para no romper la navegación compacta.
2. En desktop, el bloque derecho ya no apila número, luna y niveles como tres cards altas; ahora usa dos tarjetas compactas arriba y un resumen horizontal de métricas abajo.
3. Ese cambio baja la altura real del hero completo, porque la grilla ya no toma como referencia una tercera columna sobredimensionada.

---

## Sesion: Web — dashboard, arreglo puntual del alto del bloque superior
**Fecha:** 2026-04-04 ~17:27 (ARG)

### Que se hizo
Se corrigió el alto insuficiente de la tarjeta superior del dashboard en desktop. El problema venía de una combinación de `overflow-hidden` con una columna interna que usaba `h-full` dentro de una grilla sin altura mínima explícita, lo que terminaba recortando el contenido inferior.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Agrega altura mínima real al contenedor, ajusta la grilla desktop y elimina la dependencia de `h-full` que comprimía la tarjeta |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Elimina helper visual muerto para dejar el módulo sin warnings en lint |
| `frontend/src/tests/paginas/dashboard.test.tsx` | Limpia el mock de `next/image` para que la verificación del dashboard pase sin warnings |
| `context/resumen-de-cambios.md` | Documenta esta corrección puntual del alto del bloque inicial |

### Tests
Pasaron `eslint` sin warnings sobre el alcance del dashboard, `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx`, y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. En desktop, la tarjeta principal ahora reserva altura suficiente desde el contenedor exterior y desde la grilla interna, en vez de depender sólo del contenido visible de la primera fila.
2. La columna izquierda ya no usa `h-full` dentro de una grilla sin alto explícito, por lo que los CTAs y el resto del contenido dejan de desbordar hacia abajo y quedar recortados.
3. La columna derecha con resúmenes compactos también participa mejor del alto compartido, de modo que el primer bloque del dashboard vuelve a leerse como una pieza completa y no como una franja demasiado baja.

---

## Sesion: Web — dashboard, ajuste final de altura del bloque superior
**Fecha:** 2026-04-04 ~17:33 (ARG)

### Que se hizo
Se hizo una segunda pasada puntual sobre el alto del bloque superior del dashboard después de revisar la captura final. El bloque ya no quedaba recortado, pero seguía demasiado bajo para el peso visual que necesita; por eso se subió otra vez la altura mínima del contenedor y se alineó el skeleton al nuevo tamaño.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Sube nuevamente la altura mínima desktop del contenedor y de la grilla interna para que el bloque tenga presencia suficiente sin recortar el contenido |
| `frontend/src/app/(app)/dashboard/page.tsx` | Ajusta la altura del skeleton principal para que la carga respete la nueva escala del bloque superior |
| `context/resumen-de-cambios.md` | Documenta este ajuste final de altura |

### Tests
Pasaron `eslint` sin warnings sobre el alcance del dashboard, `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx`, y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. El bloque superior mantiene la misma composición, pero con una reserva vertical más generosa en desktop.
2. La grilla interna ahora acompaña ese alto, así que fecha, texto, momentos y tarjetas compactas respiran mejor y no quedan apretados dentro del contenedor.
3. El estado de carga visual ya no “encoge” respecto de la tarjeta real, porque el skeleton usa la misma escala nueva.

---

## Sesion: Web — dashboard, superficies lisas en el panel superior
**Fecha:** 2026-04-04 ~17:44 (ARG)

### Que se hizo
Se aplanó el material visual del panel superior del dashboard para quitar la sensación de relieve en light mode. El bloque principal y sus tarjetas internas dejaron de usar glow, sombras suaves y fondos degradados, pasando a superficies lisas con borde sutil.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Quita los glows decorativos del panel superior y fuerza una superficie plana para el contenedor y los CTAs |
| `frontend/src/componentes/dashboard-v2/tarjeta-fecha.tsx` | Convierte la tarjeta de fecha a una placa lisa sin sombra interna |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Reemplaza el fondo degradado de la lista por un fondo plano y sin blur |
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Aplana la tarjeta y la placa del número personal para sacar el efecto de relieve |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Deja la tarjeta lunar y su ícono sobre fondos lisos y sin sombra |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Quita el glow de los segmentos activos y deja métricas y barras sobre superficies planas |
| `context/resumen-de-cambios.md` | Documenta esta limpieza visual del panel superior |

### Tests
Pasaron `eslint` sobre los componentes del dashboard tocados, `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx`, y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. El panel superior mantiene la misma estructura y contenido, pero su contenedor principal ahora se renderiza como una superficie plana, sin brillos ambientales ni degradé de fondo.
2. Las tarjetas internas de momentos, número, luna y energía usan el mismo lenguaje material: fondo liso, borde suave y sin blur ni sombra marcada.
3. Las métricas de energía siguen destacando el valor activo con violeta, pero sin el halo brillante que generaba la sensación de relieve en el conjunto.

---

## Sesion: Web — dashboard, consolidación del resumen personal
**Fecha:** 2026-04-04 ~18:28 (ARG)

### Que se hizo
Se consolidó la zona derecha del panel superior del dashboard en una sola tarjeta editorial, sin tarjetas anidadas. Además se ajustaron los textos y la jerarquía del resumen para que `Número del día`, `Luna en {signo}` e `Intensidad / Claridad / Fuerza` se lean como un único bloque premium con separadores sutiles.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/resumen-personal-unificado.tsx` | Nuevo resumen desktop unificado con secciones internas para número del día, luna y barras de intensidad/claridad/fuerza |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Integra el nuevo resumen unificado y devuelve una profundidad leve al panel y a los CTAs |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Quita el recuadro de los íconos de mañana/tarde/noche y mantiene la tarjeta con una sombra sutil |
| `frontend/src/componentes/dashboard-v2/numero-del-dia.tsx` | Actualiza el copy a `Número del día` y mantiene la versión mobile alineada con la nueva nomenclatura |
| `frontend/src/componentes/dashboard-v2/luna-posicion.tsx` | Pasa a destacar `Luna en {signo}` y usa el icono de fase lunar sin recuadro |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Renombra la primera métrica a `Intensidad` y mantiene la familia de barras con el lenguaje actualizado |
| `frontend/src/tests/paginas/dashboard.test.tsx` | Refuerza la cobertura del dashboard para el nuevo copy y el nuevo resumen unificado |
| `context/resumen-de-cambios.md` | Documenta esta consolidación del panel de resumen |

### Tests
Pasaron `eslint` sobre los componentes tocados del dashboard, `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx`, y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. En desktop, la columna derecha ya no apila tres mini tarjetas: ahora renderiza una sola tarjeta con divisores finos entre `Número del día`, `Luna en {signo}` y las tres métricas del cierre.
2. El número y la luna dejan de apoyarse en recuadros internos; pasan a una lectura más directa, con el número suelto y el icono real de fase lunar como acento.
3. `Intensidad`, `Claridad` y `Fuerza` se muestran con nombre completo y una barra de 1 a 10 dentro del mismo bloque, para que el resumen cierre como una única pieza y no como una suma de widgets.

---

## Sesion: Web — dashboard, corrección de altura real del panel superior
**Fecha:** 2026-04-04 ~18:38 (ARG)

### Que se hizo
Se corrigió el alto del panel superior después de detectar que la tarjeta seguía cortando contenido en desktop. La causa era una combinación de `min-height` todavía activos y elementos internos con `flex-1`/`justify-between` que seguían estirando o recortando la composición en lugar de medir por contenido.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Elimina las alturas mínimas desktop restantes y evita que las columnas izquierda, central y derecha vuelvan a imponer una altura artificial |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Quita el estiramiento vertical de la tarjeta y de sus filas para que la altura salga de las tres etapas reales del día |
| `context/resumen-de-cambios.md` | Documenta esta corrección final del alto real del panel |

### Tests
Pasaron `eslint` sobre `hero-seccion.tsx`, `momentos-dia.tsx` y `dashboard.test.tsx`, `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx`, y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. El contenedor superior ya no reserva alto mínimo en desktop; ahora toma la altura del contenido más alto real del panel.
2. `Momentos del día` deja de repartirse el espacio como una columna elástica y pasa a una pila compacta de tres filas, evitando que el panel se infle o que corte la última etapa.
3. La grilla conserva los divisores y la estructura visual, pero sin depender de alturas forzadas que desalineaban el bloque respecto de su contenido.

---

## Sesion: Web — dashboard, refactor de altura del panel principal
**Fecha:** 2026-04-04 ~18:46 (ARG)

### Que se hizo
Se analizó la causa de la altura insuficiente recurrente del panel principal del dashboard y se aplicó un refactor estructural mínimo. El problema no era sólo un `min-height`, sino la combinación de una grilla desktop con wrappers `flex` innecesarios y un resumen derecho que dependía de `h-full` dentro de una fila de grid con alto indefinido.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Simplifica la composición desktop del panel quitando wrappers `flex` innecesarios en columnas que afectaban el cálculo intrínseco de altura |
| `frontend/src/componentes/dashboard-v2/resumen-personal-unificado.tsx` | Elimina la dependencia de `h-full/min-height` para que el resumen derecho mida por contenido real y no por una altura porcentual frágil |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Mantiene la tarjeta central como bloque natural por contenido para que no intervenga en el cálculo con una altura elástica |
| `frontend/src/app/(app)/dashboard/page.tsx` | Ajusta la altura del skeleton principal para alinearla con la nueva escala real del panel |
| `context/resumen-de-cambios.md` | Documenta el análisis y este refactor estructural del panel principal |

### Tests
Pasaron `eslint` sobre `dashboard/page.tsx`, `hero-seccion.tsx`, `resumen-personal-unificado.tsx`, `momentos-dia.tsx` y `dashboard.test.tsx`, `5/5` tests de `frontend/src/tests/paginas/dashboard.test.tsx`, y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. La grilla desktop sigue siendo de tres columnas, pero ahora sus columnas se apoyan en bloques normales de contenido en lugar de wrappers flex que introducían mediciones inestables.
2. El resumen derecho deja de depender de `height: 100%` dentro de un contexto donde la fila del grid no tenía un alto explícito; eso evita que el navegador subestime la altura total y que el `overflow-hidden` del panel recorte contenido.
3. El panel principal vuelve a medir por el contenido real de sus tres columnas, por lo que la tarjeta deja de quedar sistemáticamente “chica” cada vez que cambia el contenido interno.

---

## Sesion: Web — dashboard, estabilización definitiva del alto del panel principal
**Fecha:** 2026-04-04 ~19:14 (ARG)

### Que se hizo
Se aplicó un refactor estructural medio para eliminar el encogimiento del panel superior en desktop. La causa principal detectada fue el contrato `h-full` + contenedor `flex` con hijos `flex-shrink` en la página de dashboard, que comprimía el bloque principal para “entrar” en viewport.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/app/(app)/dashboard/page.tsx` | Cambia el contrato de altura del contenedor principal a medición intrínseca por contenido, evita el shrink de secciones y ajusta el skeleton del panel superior |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Consolida layout en `grid` explícito (sin mezcla inestable `flex+grid`), mantiene 3 columnas desktop y agrega CTA secundario honesto para mañana con callback informativo |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Refuerza filas de alto natural y vuelve a exponer etiquetas explícitas `Mañana`, `Tarde`, `Noche` sin contenedores de icono inflados |
| `frontend/src/tests/paginas/dashboard.test.tsx` | Amplía cobertura para estados `pendiente/listo/generando`, etiquetas de momentos y feedback informativo del CTA secundario |
| `context/resumen-de-cambios.md` | Documenta esta estabilización estructural final |

### Tests
Pasaron `eslint` sobre `dashboard/page.tsx`, `hero-seccion.tsx`, `resumen-personal-unificado.tsx`, `momentos-dia.tsx` y `dashboard.test.tsx`; `8/8` tests de `frontend/src/tests/paginas/dashboard.test.tsx`; y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. El dashboard dejó de forzar una altura fija al contenedor de secciones; ahora el panel superior mide por contenido real y no se comprime por flexbox.
2. El panel superior mantiene su estructura de 3 columnas en desktop con separadores, pero cada columna se mide por su altura intrínseca y ya no depende de `h-full/min-height` para verse completa.
3. El CTA de mañana deja de disparar generación falsa y muestra un toast informativo claro sobre disponibilidad del audio.

---

## Sesion: Web — dashboard, balance vertical de columnas del panel principal
**Fecha:** 2026-04-04 ~19:28 (ARG)

### Que se hizo
Se ajustó el panel superior para balancear visualmente el alto entre columnas sin volver al recorte. La columna izquierda y la central ahora acompañan el alto real del bloque derecho, eliminando el vacío inferior que aparecía en desktop.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Cambia la grilla desktop a `items-stretch`, convierte columna izquierda a layout flex de altura completa y ancla las acciones al final para equilibrar el bloque |
| `frontend/src/componentes/dashboard-v2/momentos-dia.tsx` | Agrega modo `expandido` para que las tres filas de momentos se distribuyan en alto cuando el panel está en desktop |
| `context/resumen-de-cambios.md` | Documenta este ajuste de balance visual |

### Tests
Pasaron `eslint` sobre `hero-seccion.tsx` y `momentos-dia.tsx`; `8/8` tests de `frontend/src/tests/paginas/dashboard.test.tsx`; y `npm run build` completo en `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. El alto total sigue siendo intrínseco (por contenido), pero en desktop la grilla estira las columnas para mantener una lectura más pareja.
2. El bloque de acciones de la columna izquierda se ubica al fondo del panel, lo que compensa el peso visual de la tarjeta derecha.
3. La tarjeta de `Momentos del día` puede ocupar la altura disponible con tres filas proporcionadas, evitando que quede “flotando” con demasiado aire por debajo.

---

## Sesion: Web — dashboard, renombre de niveles y CTAs en violeta claro
**Fecha:** 2026-04-04 ~20:04 (ARG)

### Que se hizo
Se actualizó el lenguaje de niveles del panel a `Intuición / Claridad / Energía` y se migró el tono de los CTAs de generación de audio a un violeta claro consistente con el shell light. El mismo tratamiento se aplicó al botón de generación del podcast semanal.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/componentes/dashboard-v2/resumen-personal-unificado.tsx` | Renombra métricas (`Intuición`, `Claridad`, `Energía`) y ajusta mapeo de valores para que intuición use el indicador de conexión |
| `frontend/src/componentes/dashboard-v2/niveles-energia.tsx` | Replica el cambio de labels/mapeo en la variante mobile/compacta |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Pasa los CTAs `Generar audio de hoy` y `Audio de mañana` a violeta claro (bordes, fondos y sombra) |
| `frontend/src/componentes/dashboard-v2/semana-v2.tsx` | Aplica el mismo tono violeta claro al botón `Genera podcast de tu semana` |
| `frontend/src/tests/paginas/dashboard.test.tsx` | Ajusta asserts al nuevo naming de niveles (`Intuición`, `Energía`) |
| `context/resumen-de-cambios.md` | Documenta esta actualización |

### Tests
Pasaron `eslint` sobre `hero-seccion.tsx`, `semana-v2.tsx`, `resumen-personal-unificado.tsx`, `niveles-energia.tsx` y `dashboard.test.tsx`; y `8/8` tests de `frontend/src/tests/paginas/dashboard.test.tsx` dentro de `frontend/` usando Node `20` con `PATH=/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.

### Como funciona
1. En desktop y mobile, la primera métrica deja de mostrarse como intensidad y pasa a `Intuición`, usando el valor de conexión.
2. La tercera métrica se presenta como `Energía`, manteniendo su valor de energía diaria.
3. Los tres CTAs de generación (hoy, mañana, semanal) comparten ahora un tratamiento visual en violeta claro: más visibles, coherentes entre sí y alineados al sistema light del dashboard.

---

## Sesion: Mobile — chat en tab principal y podcast con lyrics sincronizadas
**Fecha:** 2026-04-04 ~20:13 (ARG)

### Que se hizo
Se promovió el chat a la navegación principal inferior para darle más protagonismo y se transformó el reproductor completo de podcasts para mostrar el texto del episodio sincronizado con el audio, con auto-scroll y salto por segmento.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `mobile/src/app/(tabs)/chat.tsx` | Nueva pantalla tab de chat con entrada directa, estado de plan simplificado y conversación integrada al shell principal |
| `mobile/src/app/(features)/oraculo.tsx` | Redirecciona la ruta legacy del oráculo al nuevo tab `Chat` para no romper accesos existentes |
| `mobile/src/app/(tabs)/_layout.tsx` | Reemplaza `Descubrir` por `Chat` en la barra inferior, le da tratamiento visual destacado y deja `Descubrir` oculto pero accesible por navegación interna |
| `mobile/src/app/(tabs)/index.tsx` | Actualiza el CTA principal del dashboard para abrir el nuevo tab de chat |
| `mobile/src/app/(tabs)/descubrir.tsx` | Actualiza el acceso del módulo oracular para abrir el tab de chat |
| `mobile/src/componentes/layouts/reproductor-completo.tsx` | Agrega vista tipo lyrics con resaltado del segmento activo, auto-scroll y seek por toque |
| `mobile/src/lib/hooks/usar-audio-nativo.ts` | Expone `segmentoActual` al reproductor para sincronizar texto y progreso |
| `context/resumen-de-cambios.md` | Documenta esta sesión mobile |

### Tests
0 tests nuevos/modificados. Pasaron `npm run typecheck`, `npm run doctor`, `npm run export:ios` y `npm run export:android` dentro de `mobile/`.

### Como funciona
1. La barra inferior ahora expone `Chat` como destino principal, ubicado al centro y con mayor peso visual; `Descubrir` deja de ocupar un slot de tab pero sigue disponible desde los CTAs internos.
2. Cualquier acceso viejo al oráculo cae en la nueva tab mediante redirección, así que no se rompe el flujo previo ni los links internos existentes.
3. Cuando se reproduce un podcast y el usuario expande el mini reproductor, la pantalla completa muestra el texto segmentado del episodio, resalta la línea activa según el tiempo actual y permite tocar cualquier bloque para saltar a ese punto del audio.

## Sesion: Fix del Menú Contextual del Chat
**Fecha:** 2026-04-07 ~15:35 (ARG)

### Que se hizo
Se solucionó un bug en el menú contextual de las conversaciones del chat que impedía tocar las opciones (eliminar, archivar, etc) debido a la jerarquía térmica de z-index y el layout absoluto que ocultaba las interacciones.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `mobile/src/componentes/layouts/sheet-chat.tsx` | Se encapsuló `MenuContextual` en un `View` con `StyleSheet.absoluteFill`, `zIndex` y `elevation` para asegurar la captura de eventos en Android e iOS, y evitar que el fondo robe el pulso. |

### Tests
No aplican (tests UI no automatizados actualmente), sin errores de build.

### Como funciona
El menú de pulsación larga en las conversaciones se renderizaba de forma que eventos táctiles perforaban o caían al `Pressable` trasero. Al darle un `View` pantalla-completa virtual (absoluteFill) con prioridades absolutas combinando `zIndex` + `elevation`, React Native captura limpiamente el evento en el contenedor y ejecuta la opción deseada (ej. mostrar alerta de borrado) bloqueando gestos del `FlatList` subyacente.

## Sesion: Fix de interfaz del Modal de Resumen Cósmico
**Fecha:** 2026-04-07 ~17:21 (ARG)

### Que se hizo
Se implementó el Modal para visualizar el resumen/guión del podcast y se optimizó el diseño del botón alineado a la izquierda.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Descripción |
|---------|-------------|
| `mobile/src/app/(tabs)/index.tsx` | Se reconfiguró el botón de Leer Resumen con mayor padding, icono más grande y alineado a la izquierda. Se agregó un componente `Modal` nativo para renderizar la variable `guionVisible` con padding interno y scroll, con fondo adaptativo.

### Tests
Sin cambios, el build de la app mobile funciona correctamente.

### Como funciona
Al pulsar el botón 'Leer el resumen' en la tarjeta del podcast diario, el estado `guionVisible` almacena el texto del guión. Un componente `Modal` en la pantalla raíz detecta que el estado no es nulo y se despliega con su contenido en un `ScrollView` que incluye un botón de cierre.


## Sesion: Mejoras UI Botón Nueva Conversación Chat Mobile
**Fecha:** 2026-04-07 ~17:30 (ARG)

### Que se hizo
Se mejoró visualmente el botón de "Nueva conversación" en el panel lateral deslizable del chat de la app mobile.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `mobile/src/componentes/layouts/sheet-chat.tsx` | Se reemplazó el cuadrado básico del símbolo + por un bloque en forma de píldora que incluye el ícono `Plus` y la palabra "Nuevo", con animación reactiva de escala y opacidad al presionar. |

### Tests
Sin cambios. UI testeada localmente.

### Como funciona
Al abrir el panel de "Conversaciones" históricos, en el header a la derecha del título, ahora aparece un botón estilo píldora. Al pulsarlo, el botón se encoge sutilmente y aumenta su transparencia, mejorando la respuesta táctil y estética "premium".


## Sesion: Fix de reproducción de Podcast (Expo FileSystem)
**Fecha:** 2026-04-07 ~17:35 (ARG)

### Que se hizo
Se solucionó un error crítico en Mobile donde la descarga de los audios de podcast fallaba silenciosamente arrojando el error "Verifica tu conexion" a pesar de que el backend completaba el stream correctamente (200 OK).

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `mobile/src/lib/hooks/usar-audio-nativo.ts` | Se migró la descarga de audio de la API experimental `ExpoFile.downloadFileAsync` a la API probada `expo-file-system/legacy` usando `FileSystem.downloadAsync` debido a problemas con la inyección de headers (token de autorización) de la nueva API. También se agregó registro de errores (`console.error`) y validación de HTTP Status estricto. |

### Tests
Sin iteración de tests. Se valida funcionalidad principal de React Native.

### Como funciona
Al tocar reproducir un podcast, el reproductor ahora utiliza la API Legacy para guardar el MP3 en el directorio de caché enviando correctamente el Auth Token. Al terminar de bajarlo de forma segura, setea el progreso y el source uri a la instancia de `expo-audio`.


## Sesion: Mejoras Sincronización Reproductor y Slider
**Fecha:** 2026-04-07 ~17:45 (ARG)

### Que se hizo
Se arregló el comportamiento errático del control de reproducción (Slider rebotando) durante el arrastre, y la desincronización del texto del podcast/transcript.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `mobile/src/componentes/layouts/reproductor-completo.tsx` | Se incorporaron estados `isSliding` y `localProgreso` para independizar el valor visual temporal del slider de las actualizaciones asíncronas de la API de Expo-Audio. Además el reloj inferior de tiempo transcurrido ahora actúa en tiempo real al arrastrar. |
| `mobile/src/lib/hooks/usar-audio-nativo.ts` | Se re-escribió la lógica para buscar el index del "segmento activo" pasando de un `findIndex(rango)` estricto a un reverse loop que agarra el último gap. De esta forma, ya no hay saltos de líneas en blanco por desfasajes o pausas que contengan milisegundos de silencio. |

### Tests
No iteración. Modificación visual/estado pura de JS.

### Como funciona
Al tocar y mover el progress bar, internamente un estado bloquea que `usarAudioNativo` pise nuestro control visual. A la vez, un algoritmo "optimista" lee los textos de abajo hacia arriba cotejando contra los segundos reales, previniendo que ninguna oración pierda foco aunque haya baches instrumentales sin voz.


## Sesion: Fixed Reproductor Doble y UI de Saltos (Mobile)
**Fecha:** 2026-04-07 ~17:55 (ARG)

### Que se hizo
Se arregló un bug severo que causaba que el audio se reprodujera solapado a coro, y se mejoraron los controles de avance y retroceso reemplazando los íconos confusos que parecían de salto de pista.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `mobile/src/componentes/layouts/mini-reproductor.tsx` | Se extrajo el hook `usarAudioNativo()` para pasarlo por props a `ReproductorCompleto`, evitando que ambos componentes instancien el player simultáneamente causando doble loop al maximizarlo. |
| `mobile/src/componentes/layouts/reproductor-completo.tsx` | Se preparó para recibir `{...audioContext}` por props. Se cambiaron los iconos `SkipBack` y `SkipForward` por `Rewind` y `FastForward`.  |

### Tests
No iteración de CI.

### Como funciona
El Context local de UI ahora funciona como un singleton visual: independientemente si la hoja está plegada (`Mini`) o expandida (`Completo`), el control subyacente lo gobierna un solo `useAudioPlayer` de `expo-audio`.

## Sesion: Logo alignment in web login screen
**Fecha:** 2026-04-07 ~20:25 (ARG)

### Que se hizo
Mejorar la alineación del logo en la pantalla de inicio de sesión (versión web responsive)

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `frontend/src/componentes/layouts/layout-auth.tsx` | Se eliminó `px-1` y se añadió `flex justify-center` al contenedor del logo responsivo (en tamaño móvil) para que quede perfecto y centrado acorde a la estética general. |

### Tests
No tests nuevos implementados.

### Como funciona
El div del logo en versión móvil (`lg:hidden`) ahora utiliza flexbox con justify-center lo que hace que se posicione centrado en la página de inicio o registro de autenticación.

## Sesion: Remove phrase and podcasts option from user menu
**Fecha:** 2026-04-07 ~20:25 (ARG)

### Que se hizo
Se simplificó el menú desplegable del usuario ocultando la frase de energía predictiva del clima astrológico y removiendo la opción de "Podcasts".

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `frontend/src/componentes/layouts/navbar.tsx` | Se eliminó del rendering condicional el bloque `{estadoCabecera.descripcion && ...}` que visualizaba la lectura del día debajo del email. También se removió el componente `<Link href="/podcast">` de manera permanente para simplificar las acciones. |

### Tests
No tests nuevos implementados.

### Como funciona
Al abrir el menú desplegable tocando el avatar/iniciales del usuario, el pop-up luce mucho más limpio limitándose a mostrar la información de la cuenta, y ocultando ítems innecesarios.

## Sesion: Ajuste opacidad tooltips de hover
**Fecha:** 2026-04-07 ~20:25 (ARG)

### Que se hizo
Se ajustó la opacidad de los tooltips emergentes en "Semana" y "Calendario" para hacerlos levemente translúcidos, mejorando el estilo visual del glassmorphism.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `frontend/src/componentes/dashboard-v2/semana-v2.tsx` | Se agregó la clase utilitaria `opacity-90` de Tailwind al contenedor del tooltip de los días semanales. |
| `frontend/src/app/(app)/calendario-cosmico/_componentes/calendario-mes.tsx` | Se agregó la clase utilitaria `opacity-90` de Tailwind al contenedor principal del tooltip del calendario mensual. |

### Tests
Ninguno modificado.

### Como funciona
Al pasar el mouse (hover) por encima de los días tanto en el carrusel semanal como en el calendario principal, el panel flotante oscuro ahora cuenta con un 90% de opacidad general que complementa el desenfoque de fondo subyacente.

## Sesion: Configuracion de Premium por Defecto para Nuevos Usuarios
**Fecha:** 2026-04-07 ~20:20 (ARG)

### Que se hizo
Se implementó un flag en la configuración de entorno (`ASIGNAR_PREMIUM_POR_DEFECTO`) para otorgar temporalmente la suscripción Premium a los nuevos usuarios registrados.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `backend/app/configuracion.py` | Se agregó el flag booleano `asignar_premium_por_defecto: bool = False` al esquema de `Configuracion` global de pydantic. |
| `backend/app/rutas/v1/auth.py` | Se mejoró la funcion interna `_asignar_plan_gratis` renombrándola a `_asignar_plan_inicial`, que lee el flag global determinando si el slug debe ser `gratis` o `premium`. |

### Tests
No fallaron tests existentes al cambiar la logica, garantizando compatibilidad retroactiva.

### Como funciona
Cuando la API arranca, pydantic lee el `.env` o las variables del SO. Cuando un usuario se registra (vía email/pass o por Google OAuth), se llama a `_asignar_plan_inicial()`. Si el flag es falso, se le asigna plan gratis. Si el flag se activa (true), se consulta el repositorio y se le carga una suscripción activa contra el plan del slug `premium`. Se puede prender/apagar desde el environment variable `ASIGNAR_PREMIUM_POR_DEFECTO` en Producción sin tocar el código.

## Sesion: Menu inferior persistente en numerologia mobile
**Fecha:** 2026-04-08 ~18:53 (ARG)

### Que se hizo
Se corrigió la navegación hacia la sección de numerología en la app mobile para que conserve el menú inferior visible al abrirse desde la pestaña Descubrir.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `mobile/src/app/(tabs)/numerologia.tsx` | Nueva ruta dentro del grupo de tabs que reutiliza la pantalla existente de numerología para mantener el tab bar montado. |
| `mobile/src/app/(tabs)/_layout.tsx` | Se registró `numerologia` como pantalla oculta del tab bar (`href: null`) para permitir navegación interna sin agregar un ítem nuevo al menú inferior. |
| `mobile/src/app/(tabs)/descubrir.tsx` | Se actualizó la tarjeta de Numerología para navegar a `/(tabs)/numerologia` en lugar de `/(features)/numerologia`. |

### Tests
0 tests nuevos/modificados. `npm run typecheck` en `mobile/` pasando.

### Como funciona
Antes, la tarjeta de Numerología empujaba una ruta del grupo `/(features)`, que usa un stack separado y desmonta el layout de tabs, por eso desaparecía el menú inferior. Ahora la navegación entra por una ruta oculta dentro de `/(tabs)`, reutiliza la misma pantalla y mantiene visible el menú inferior durante toda la experiencia.

## Sesion: Persistencia de tabs en Diseño Humano y back en Numerología mobile
**Fecha:** 2026-04-08 ~18:57 (ARG)

### Que se hizo
Se corrigió la navegación de Diseño Humano para que conserve el menú inferior en mobile y se agregó un encabezado con flecha de volver en la pantalla de Numerología.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambios |
|---------|---------|
| `mobile/src/app/(tabs)/diseno-humano.tsx` | Nueva ruta oculta dentro del grupo de tabs que reutiliza la pantalla existente de Diseño Humano. |
| `mobile/src/app/(tabs)/_layout.tsx` | Se registró `diseno-humano` como pantalla oculta del tab bar para navegación interna sin sumar un ítem visible. |
| `mobile/src/app/(tabs)/descubrir.tsx` | La tarjeta de Diseño Humano ahora navega a `/(tabs)/diseno-humano` y Numerología mantiene la ruta interna de tabs. |
| `mobile/src/app/(features)/numerologia.tsx` | Se integró `HeaderMobile` en estados de carga, vacío y contenido para mostrar la flecha de volver y un encabezado consistente. |

### Tests
0 tests nuevos/modificados. `npm run typecheck` en `mobile/` pasando.

### Como funciona
La tarjeta de Diseño Humano ya no abre una pantalla en el stack `/(features)`, sino una ruta oculta dentro de `/(tabs)`, por lo que el layout del menú inferior permanece montado. En Numerología, el encabezado reutiliza el componente `HeaderMobile`, así que al entrar desde Descubrir el usuario ahora ve la flecha de volver y puede regresar manteniendo el contexto de navegación.

## Sesion: Chat web — corte de día automático
**Fecha:** 2026-04-11 ~07:59 (ARG)

### Que se hizo
Al entrar al chat en un día distinto al del último mensaje (zona horaria ARG en backend, local del navegador en frontend), la conversación previa ya no se abre automáticamente: la pantalla arranca en limpio y al enviar el primer mensaje se crea una conversación nueva. La conversación vieja sigue visible y reabrible desde el panel lateral.

### Backend/Frontend — Archivos creados/modificados
| Archivo | Cambio |
|---------|--------|
| `backend/app/datos/repositorio_conversacion.py` | Nuevo helper `_dia_arg_de_iso`, y `obtener_o_crear_web` desactiva la conv activa si su último mensaje es de otro día (hora ARG) y crea una nueva. |
| `backend/app/rutas/v1/chat.py` | `GET /chat/conversaciones` ahora expone `ultimo_mensaje_en` (fecha ISO del último mensaje o `null`). |
| `frontend/src/lib/tipos/chat.ts` | `ConversacionResumen` incluye `ultimo_mensaje_en: string \| null`. |
| `frontend/src/app/(app)/chat/page.tsx` | El `useEffect` de auto-selección compara la fecha local del último mensaje contra hoy; si no coincide, no selecciona la conversación activa. |
| `backend/tests/datos/test_repositorio_conversacion.py` | Archivo nuevo: tests de `_dia_arg_de_iso` y de los 4 escenarios de `obtener_o_crear_web` (hoy, ayer, vacía, sin conv previa). |

### Tests
9 tests pasando (`tests/datos/test_repositorio_conversacion.py` + `tests/rutas/test_rutas_chat.py`). `npx tsc --noEmit` en frontend sin errores.

### Como funciona
Cuando el usuario abre `/chat`, el frontend lista las conversaciones vía `GET /chat/conversaciones`, que ahora incluye el timestamp del último mensaje. El auto-select compara el día local del navegador con ese timestamp: si coinciden, selecciona la conversación; si no, deja `conversacionActiva = null` y se muestra el saludo inicial con sugerencias. Cuando el usuario envía su primer mensaje, el backend en `obtener_o_crear_web` detecta la misma situación del lado servidor (usando hora ARG), marca la conversación vieja como `activa=false` y crea una nueva limpia. El corte queda cubierto por partida doble — el frontend evita mostrar la conversación vieja y el backend evita seguir escribiéndole mensajes. La conversación anterior no se archiva ni se borra: sigue apareciendo en el panel lateral y el usuario puede reabrirla con `/chat/cambiar/{id}` si quiere continuarla manualmente.

## Sesion: Podcast del día — auto-generación en primer login + banner
**Fecha:** 2026-04-11 ~09:30 (ARG)

### Que se hizo
El podcast del día deja de generarse on-demand y pasa a ser automático: cuando un usuario premium con perfil cargado entra a ASTRA por primera vez en el día (hora ARG), el endpoint `/auth/me` encola un background task que dispara el pipeline de `ServicioPodcast.generar_episodio(tipo="dia")`. Un banner nuevo en el header del shell acompaña el progreso en vivo con un mensaje animado "Hola {nombre} 👋, hoy es un nuevo día! Te estoy preparando tu día." (el emoji 👋 está pedido explícitamente por producto). Al completarse, el banner transiciona a "Tu día está listo" con un CTA "Escuchar" y auto-desaparece a los 8 segundos. El botón "Generar ahora" del tipo `dia` en `/podcast` queda reemplazado por un indicador "Preparando tu día…" y el menú del navbar ya no dispara mutation para `dia`. Los tipos `semana` y `mes` siguen siendo manuales.

### Backend — Archivos creados/modificados
| Archivo | Cambio |
|---------|--------|
| `backend/app/nucleo/utilidades_fecha.py` | **NUEVO** — helper común: `TZ_ARG`, `dia_arg_actual()`, `dia_arg_de_datetime()`, `es_primer_acceso_del_dia_arg()`. |
| `backend/app/servicios/servicio_podcast_bootstrap.py` | **NUEVO** — `bootstrap_dia_podcast(usuario_id)` con guards (activo, premium, con perfil) + set `_bootstrap_en_curso` para evitar dispatches paralelos. Crea sesión propia con `crear_motor_async`/`crear_sesion_factory`. Toda excepción se loguea sin propagar. |
| `backend/app/rutas/v1/auth.py` | `/auth/me` recibe `BackgroundTasks`. Captura `ultimo_acceso` previo antes de devolver la respuesta y, si es primer acceso del día ARG + premium + con perfil, actualiza `ultimo_acceso` y encola `bootstrap_dia_podcast`. Sólo se hace el `UPDATE` en primer acceso del día para mantener el endpoint barato en navegaciones normales. |
| `backend/tests/nucleo/test_utilidades_fecha.py` | **NUEVO** — 9 tests del helper (None, UTC→ARG, naive, frontera medianoche). |
| `backend/tests/servicios/test_servicio_podcast_bootstrap.py` | **NUEVO** — 7 tests del bootstrap: usuario inactivo, sin suscripción, plan gratis, sin perfil, caso feliz (valida args), guard duplicado, excepción no propaga. |
| `backend/tests/rutas/test_rutas_auth.py` | `TestMeBootstrapPodcast` con 4 tests: primer acceso del día encola bootstrap; mismo día no; plan gratis no; sin perfil no. |

### Frontend — Archivos creados/modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/componentes/layouts/banner-podcast-dia.tsx` | **NUEVO** — consume `usarPodcastHoy()` + `useStoreAuth`. Estados: `generando_*` (shimmer + dots + mensaje saludo), `listo` reciente (CTA "Escuchar" + auto-hide 8s), `error` (botón reintentar + auto-hide 15s). Usa `localStorage` con clave por fecha local para no repetir el estado "listo" en la misma sesión del día. Botón "X" para descartar manualmente (también persistido en `localStorage`). |
| `frontend/src/app/globals.css` | Keyframes nuevos `banner-fade-in-down`, `banner-fade-out-up`, `banner-shimmer` + clases `.animate-banner-in`, `.animate-banner-out`, `.banner-shimmer-texto`. |
| `frontend/src/componentes/layouts/layout-app.tsx` | Monta `<BannerPodcastDia />` justo después del navbar en desktop y al tope en mobile. |
| `frontend/src/app/(app)/podcast/page.tsx` | `CardEpisodio` recibe prop `autoGenerado`. Cuando `autoGenerado=true` y el episodio aún no existe, en lugar del botón "Generar ahora" muestra un indicador "Preparando tu día…" con spinner. Se pasa `autoGenerado={tipo === "dia"}` desde el map — los tipos `semana`/`mes` mantienen el flujo manual. |
| `frontend/src/componentes/layouts/navbar.tsx` | En `manejarSeleccionPodcast`, cuando `tipo="dia"` y el episodio no está listo, navega a `/podcast` en vez de disparar `generarPodcast.mutate("dia")`. Flujo de `semana`/`mes` intacto. |

### Tests
- **Backend:** 20 tests nuevos (9 helper + 7 bootstrap + 4 endpoint `/auth/me`). Toda la suite relacionada: 101 tests pasando (`test_utilidades_fecha`, `test_servicio_podcast_bootstrap`, `test_rutas_auth`, `test_rutas_podcast`, `test_servicio_podcast`, `test_rutas_chat`).
- **Frontend:** `npx tsc --noEmit` sin errores.

### Como funciona
1. El usuario loguea y el frontend llama `GET /auth/me`. El endpoint lee `usuario.ultimo_acceso`, lo compara contra el día ARG de hoy con `es_primer_acceso_del_dia_arg` y — si es primer acceso + premium + con perfil — actualiza `ultimo_acceso` y encola `bootstrap_dia_podcast` como background task. La respuesta al frontend no se bloquea.
2. El background task abre su propia sesión DB, valida guards (activo, premium, perfil) y llama `ServicioPodcast.generar_episodio(usuario_id, dia_arg_actual(), "dia", origen="auto")`. Como el pipeline es idempotente por constraint único `(usuario_id, fecha, momento)`, si ya existe un episodio `listo` o `generando_*` lo retorna sin relanzar.
3. Mientras el pipeline corre, el frontend (que ya tiene `usarPodcastHoy` con polling inteligente de 5s cuando hay generación en curso) refleja el estado en `<BannerPodcastDia />`, montado en el layout del shell. El banner muestra el saludo animado con shimmer + dots pulsantes + CTA "Ver detalle".
4. Cuando el estado pasa a `listo`, si el usuario vio antes el estado "generando" en este montaje, el banner cross-fade a "Tu día está listo" con un CTA "Escuchar" que carga el episodio en el reproductor cósmico. El banner se oculta solo a los 8s y queda marcado en `localStorage` para no repetirse el mismo día al refrescar.
5. En caso de error, el banner muestra una variante discreta con "Reintentar" (que llama a `POST /podcast/generar?tipo=dia`) y auto-oculta tras 15s.
6. La página `/podcast` y el menú del navbar ya no exponen la opción de generar manualmente el tipo `dia`: la card muestra "Preparando tu día…" mientras el pipeline corre, y el menú navega a `/podcast` en lugar de disparar la mutation.
7. Guards duros: si el usuario es gratis, no tiene perfil, o el pipeline ya corrió hoy, el bootstrap queda silencioso — el banner nunca aparece. El emoji 👋 en el texto del saludo es una excepción explícita a la regla "no emojis" y está marcado con un comentario anti-remoción en el código.

---

## Sesion: Centro de notificaciones en navbar (caja central como hub de avisos)
**Fecha:** 2026-04-11 ~12:30 (ARG)

### Que se hizo
La caja central del header de desktop dejó de ser un bloque de "contexto verboso" (etiqueta + título + descripción + meta apilados, que muchas veces sobrepasaba el navbar) y pasó a funcionar como **centro de notificaciones de prioridad**. La generación automática del podcast del día ahora se muestra ahí en vez de aparecer en un banner separado debajo del navbar.

### Frontend — Archivos creados/modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/componentes/layouts/navbar.tsx` | **Refactor mayor de la caja central.** Reemplazo de `EstadoCabecera` (4 líneas apiladas, sin alto fijo) por la interfaz `NotificacionCentral` con `id`/`etiqueta`/`titulo`/`descripcion`/`icono`/`tono`/`pulso`/`accion`. Nuevo sub-componente `CentroNotificaciones` con layout fijo de 54px de alto: icono 36px (gradiente según tono) + dots de pulso opcionales + 3 líneas truncadas + botón CTA inline. Sistema de prioridades en `useMemo` (7 niveles): generando podcast → error podcast → listo podcast (transición) → pista activa → alerta cósmica → pronóstico diario → contexto de ruta. Replicación in-place de la lógica de tracking generando→listo del banner (con `vioGenerandoRef`, `mostrarListoNotif`, `ocultarErrorNotif`, flag `localStorage` por fecha local). Helpers `reproducirEpisodioDia` / `reintentarPodcastDia` para los CTAs inline. Helper `obtenerEstilosTono` que mapea `violeta`/`rojo`/`esmeralda` a tokens CSS de la paleta ASTRA (sin naranjas, según regla del proyecto). Animación de fade-in en cada cambio de notificación vía `key={id}` + clase `animate-banner-in`. |
| `frontend/src/componentes/layouts/layout-app.tsx` | Removido el render de `<BannerPodcastDia />` del branch desktop (la caja central del navbar ahora cumple ese rol). El branch mobile **mantiene** el banner sin cambios (el `HeaderMobile` no tiene caja central equivalente). Comentario en el JSX explicando por qué el banner ya no vive en desktop. |
| `context/resumen-de-cambios.md` | Esta entrada. |

### Tests
- `npx tsc --noEmit` sin errores en archivos del proyecto. (El único error reportado por tsc es en `.next/dev/types/validator.ts`, un artefacto generado por Next.js no relacionado con este cambio.)
- Sin tests unitarios nuevos: cambio puramente visual/UX en un componente client-side ya existente.

### Como funciona
1. El navbar deriva en cada render una única `NotificacionCentral` aplicando un orden de prioridad fijo. Cuando hay un episodio del día con estado `generando_guion` o `generando_audio` y el usuario es premium, esa notificación gana sobre todo lo demás (excepto error de generación).
2. Mientras el pipeline corre, la caja central muestra: ícono "sol" sobre gradiente violeta + 3 dots pulsantes (`animate-chat-soft-pulse`) + etiqueta "Escribiendo guión" o "Generando audio" + título "Hola {nombreCorto}, hoy es un nuevo día" con shimmer + bajada "Estoy preparando tu lectura del día. Llega en segundos."
3. Cuando el estado transiciona a `listo` y la sesión actual vio antes el estado generando, la notificación cambia a tono esmeralda con CTA "Escuchar" inline (`reproducirEpisodioDia`). Al apretar el CTA, la pista se carga en el reproductor cósmico y la notificación se cierra. Auto-hide de 8s (mismo flag de `localStorage` por fecha que el banner anterior, pero con clave distinta `astra:navbar_podcast_listo_visto:YYYY-MM-DD`).
4. En caso de error, la notificación adopta tono rojo con CTA "Reintentar" inline que dispara `generarPodcast.mutate("dia")`. Auto-hide de 15s.
5. Cuando no hay actividad de podcast, la prioridad cae a: pista activa en el reproductor → alerta cósmica destacada del día → pronóstico diario (clima del cielo) → contexto de la ruta actual. Cada estado tiene icono propio y tono violeta o rojo según corresponda.
6. La animación de transición entre notificaciones funciona porque el `<div>` de `CentroNotificaciones` usa `key={notificacion.id}`: React desmonta el anterior y monta el nuevo, disparando `animate-banner-in` (fade-in-down 400ms).
7. Layout fijo de 54px de alto (dentro del navbar de 70px): el contenido nunca crece verticalmente. Cada línea de texto usa `truncate`, garantizando que nada sobresalga del header. Las restricciones del CLAUDE.md se respetan: tipografía contenida (10/13/11px), sin emojis, sin naranjas, glassmorphism sutil del shell.
8. El `BannerPodcastDia` queda activo solo en mobile, donde el header mobile no tiene una caja central donde alojar la notificación. La lógica del banner no fue tocada — solo se desmontó del shell desktop.

---

## Sesion: Hovers que respetan los tokens del modo claro
**Fecha:** 2026-04-11 ~14:00 (ARG)

### Que se hizo
Reemplazo de hovers que usaban `--shell-superficie` (que en modo claro es prácticamente blanco opaco — `rgba(255,255,255,0.82)`) por `--shell-chip-hover`, que es el token semántico correcto para hover de items sobre superficies. El token `--shell-chip-hover` cambia de `rgba(124,77,255,0.14)` (violeta sutil) en claro a `rgba(255,255,255,0.12)` (blanco sutil) en oscuro, dando un hover visible y coherente en ambos esquemas. Antes los hovers se "perdían" en modo claro porque blanco-sobre-blanco no aporta contraste, mientras que en oscuro lucían bien; el resultado es que toda la interfaz mantiene el aspecto del modo activo en lugar de seguir leyendo "como oscura".

### Frontend — Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/componentes/layouts/navbar.tsx` | Items del menú de usuario (`Mi perfil`, `Suscripción`): `hover:bg-[var(--shell-superficie)]` → `hover:bg-[var(--shell-chip-hover)] hover:text-[color:var(--shell-texto)]`. |
| `frontend/src/componentes/chat/panel-conversaciones-web.tsx` | Items del menú contextual de conversación: opciones normales pasan a `hover:bg-[var(--shell-chip-hover)]`; opciones peligrosas pasan a `text-[color:var(--color-peligro-texto)] hover:bg-[var(--color-peligro-suave)]`. Items de la lista de conversaciones (`ItemConversacion`): `hover:bg-[var(--shell-superficie)]` → `hover:bg-[var(--shell-chip-hover)]`. |
| `frontend/src/app/(auth)/login/page.tsx` | Botón "Continuar con Google": `hover:bg-[color:var(--shell-superficie)]` → `hover:border-[color:var(--shell-borde-fuerte)] hover:bg-[color:var(--shell-chip-hover)]`. |
| `frontend/src/app/(auth)/registro/page.tsx` | Mismo cambio que login para el botón de Google. |
| `frontend/src/app/(app)/calendario-cosmico/_componentes/semana-movil.tsx` | Tarjetas de día: estado seleccionado pasa de `bg-violet-50 border-violet-300` a `bg-acento-suave border-[color:var(--shell-borde-fuerte)]`; estado normal pasa de `hover:border-violet-300` a `hover:border-[color:var(--shell-borde-fuerte)] hover:bg-[color:var(--shell-chip-hover)]`. |

### Tests
- `cd frontend && npx tsc --noEmit` → exit 0, sin errores.
- Sin tests unitarios nuevos: cambio puramente visual de tokens CSS, sin cambio de comportamiento ni props.

### Como funciona
1. **Diagnóstico**: en modo claro `--shell-superficie` es `rgba(255,255,255,0.82)`, casi blanco opaco. Cuando se usaba como `hover:bg-*` sobre superficies que ya eran blancas o casi blancas (panel del shell, dropdown del usuario, botones de auth), el hover quedaba invisible en claro pero seguía funcionando en oscuro porque allí el mismo token vale `rgba(255,255,255,0.06)` (un tinte blanco sutil sobre fondo oscuro). Resultado: la UI parecía pensada para oscuro y "se sentía oscura" al hover.
2. **Token elegido**: `--shell-chip-hover` es el token semántico correcto para hover. En claro pinta un tinte violeta `rgba(124,77,255,0.14)` (visible sobre cualquier fondo claro); en oscuro pinta un tinte blanco `rgba(255,255,255,0.12)` (visible sobre cualquier fondo oscuro). Ambos valores ya están definidos en `frontend/src/estilos/tokens/colores.css` y expuestos vía `@theme inline` en `frontend/src/app/globals.css`.
3. **Estrategia de reemplazo**: solo se tocaron hovers que apuntaban al token de surface (`--shell-superficie`) o a violetas hardcoded (`hover:border-violet-300`). Los hovers que ya usaban `--shell-superficie-suave`, `--shell-chip-hover` o tokens semánticos de error/exito quedaron intactos porque ya eran correctos en ambos modos.
4. **Casos peligrosos**: en `panel-conversaciones-web.tsx` la opción "Eliminar" del menú contextual pasaba de `hover:bg-red-500/10` a `hover:bg-[var(--color-peligro-suave)]` para alinear con el resto del sistema (los tokens de peligro ya están definidos para claro y oscuro).
5. **Selección de día en `semana-movil.tsx`**: el estado seleccionado usaba `bg-violet-50 border-violet-300`, valores fijos de Tailwind que no respetan el modo. Ahora usa `bg-acento-suave` (token) y borde de `--shell-borde-fuerte` (token). El hover normal acompaña con el mismo `--shell-chip-hover`.
6. **Validación**: al ser un cambio puramente CSS basado en tokens ya existentes, `npx tsc --noEmit` corre limpio. Visualmente, ahora al hover en claro se ve un tinte violeta sutil, y en oscuro un tinte blanco sutil — coherente con la paleta ASTRA.

---

## Sesion: Fix botón pausa + panel transcript (colores diurnos + fondo no opacado)
**Fecha:** 2026-04-11 ~16:30 (ARG)

### Que se hizo
Tres correcciones visuales sobre el flujo del podcast del día:
1. El botón "Escuchar ahora" del hero del dashboard (desktop y mobile) ahora refleja estado **pausa** cuando el podcast del día está efectivamente reproduciéndose.
2. El panel lateral de transcripción (`panel-lyrics.tsx`) usaba `text-shell-hero-texto` (blanco) para el segmento activo, lo cual era invisible en modo diurno. Ahora usa `text-shell-texto` que se adapta al token gris de cada tema.
3. El rail lateral en modo `overlay` opacaba el fondo con un backdrop que además interceptaba clics y bloqueaba el reproductor cósmico del footer. Se removió el backdrop: el container queda `pointer-events-none` y solo el aside intercepta eventos.

### Frontend — Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/componentes/layouts/rail-lateral.tsx` | Removido el `<div>` backdrop del modo `overlay`. El contenedor exterior ya era `pointer-events-none`, así que sin el backdrop los clics en el reproductor del footer y el resto del dashboard pasan libres. El `aside` sigue teniendo `pointer-events-auto` para seguir capturando clics dentro del panel. Se pierde el "click fuera para cerrar" — el cierre sigue disponible vía el botón X del header. |
| `frontend/src/componentes/layouts/panel-lyrics.tsx` | Segmento activo ahora usa `text-shell-texto` en lugar de `text-shell-hero-texto`. El token `--shell-texto` vale `#2c2926` en light y `#f8f6ff` en dark, así que el segmento resaltado queda legible en ambos temas. Los demás segmentos (`text-shell-texto-tenue` / `text-shell-texto-secundario`) no cambian. |
| `frontend/src/componentes/dashboard-v2/hero-seccion.tsx` | Agregada prop obligatoria `podcastReproduciendo: boolean`. Cuando es `true` el botón muestra icono `pausar`, label "Pausar" y `aria-label` "Pausar podcast del día"; cuando es `false` conserva "Escuchar ahora" / "Generar audio de hoy". El copy del estado ("Tu audio del día ya está listo") también cambia a "Estás escuchando tu audio del día" durante la reproducción. |
| `frontend/src/app/(app)/dashboard/page.tsx` | Se extrae `reproduciendo` del `useStoreUI`. Nueva derivada `podcastDiaReproduciendo = !!epDia && pistaActual?.id === epDia.id && reproduciendo`. Se pasa como prop `podcastReproduciendo` al `<HeroSeccion>`. El botón flotante del header mobile (`accionDerecha`) también se actualizó con la misma lógica de icono + aria-label. |

### Tests
- `cd frontend && npx tsc --noEmit` sin errores.
- Sin tests unitarios nuevos: cambios puramente visuales/UX.

### Como funciona
1. El store `useStoreUI` ya exponía `pistaActual` y `reproduciendo`. El dashboard ahora los combina con el id del episodio del día para saber si el podcast diario es la pista activa y está corriendo en ese momento.
2. Cuando el usuario toca "Escuchar ahora", `manejarPlayPodcast("dia")` ya existía y hace toggle: si la pista ya es la del día, llama `toggleReproduccion()`; si no, llama `setPistaActual()` con la pista nueva. El único cambio era que la UI no reflejaba el estado. Ahora, con `podcastReproduciendo`, el botón pasa a mostrar icono `pausar` + label "Pausar" mientras el audio corre, y vuelve a "Escuchar ahora" al pausar.
3. El panel lateral de lyrics aparece como overlay sin backdrop cuando el usuario toca play en un podcast con segmentos. Al no haber más un `<div>` que cubra el viewport con `pointer-events-auto`, los controles del `ReproductorCosmico` del footer siguen operativos: el usuario puede pausar, avanzar, saltar segmentos desde los botones de abajo mientras lee la transcripción en el panel.
4. El cierre del panel sigue funcionando vía el botón X del header del rail (`CabeceraRail`). La regla del proyecto "no opacar fondos innecesariamente" queda respetada porque el panel ya tiene borde, blur y sombra que lo delimitan por sí solo.
5. En light mode el segmento activo de la transcripción pasa a renderizarse con el token `#2c2926` (gris oscuro cálido) sobre el fondo `var(--shell-superficie-suave)`, garantizando legibilidad. En dark mode el mismo token resuelve a `#f8f6ff` y el layout sigue igual que antes.
