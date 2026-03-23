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
