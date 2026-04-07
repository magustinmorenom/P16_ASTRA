# Criterios de Generacion de Podcast Diario

> Documento de referencia para la generacion, preview y servicio de podcasts cosmicos personalizados en ASTRA.

---

## Resumen

ASTRA genera podcasts de audio personalizados para cada usuario premium. Existen tres tipos:

| Tipo | Duracion | Enfoque | Palabras |
|------|----------|---------|----------|
| **dia** | 2-3 min | Energia del dia, transitos activos, consejos practicos | ~400 |
| **semana** | 3-5 min | Panorama semanal, dias clave, navegacion energetica | ~600 |
| **mes** | 5-7 min | Tendencias mensuales, lunas, retrogradaciones | ~800 |

---

## Arquitectura de Generacion

### Estrategia: Lazy Generation (sin cron pesado)

No se usa un cron que genere para todos los usuarios a medianoche. En su lugar:

1. **On-demand**: el usuario dispara la generacion desde la UI (boton "Generar ahora")
2. **Preview manana**: a partir de las 19:00 hora local, el usuario puede generar el podcast del dia siguiente
3. **Reutilizacion**: si ya existe un episodio para la fecha clave, se sirve sin regenerar

### Pipeline de Generacion

```
1. Verificar idempotencia (existe episodio listo o generando?)
2. Cargar contexto cosmico del usuario:
   - Carta natal (Sol, Luna, Ascendente, casas, aspectos)
   - Diseno Humano (tipo, autoridad, perfil)
   - Numerologia (numeros base)
   - Datos personales (nombre, fecha/hora/lugar nacimiento)
3. Obtener transitos actuales (pyswisseph, posiciones reales)
4. Construir system prompt (prompt_podcast.md + contexto tipo + perfil + transitos)
5. Generar guion con Claude API (temperature 0.7)
6. Generar audio con Google Gemini TTS (voz Zephyr)
7. Subir MP3 a MinIO
8. Generar segmentos para lyrics sync (proporcional por parrafo)
9. Marcar como "listo"
```

### Estados del Episodio

| Estado | Significado |
|--------|-------------|
| `pendiente` | Creado pero no iniciado |
| `generando_guion` | Claude esta generando el texto |
| `generando_audio` | Gemini TTS esta generando el MP3 |
| `listo` | Audio disponible para reproduccion |
| `error` | Fallo en alguna etapa (se puede reintentar) |

### Origenes del Episodio

| Origen | Significado |
|--------|-------------|
| `manual` | El usuario pidio la generacion explicitamente |
| `preview` | Generado como adelanto del dia siguiente (desde las 19:00) |
| `auto` | Generado automaticamente (reservado para futuro pre-warming) |

---

## Preview de Manana

### Regla de Habilitacion

El preview del podcast de manana se habilita a partir de las **19:00 hora local del usuario**.

### Timezone

- Se usa el offset UTC enviado por el cliente (`tz_offset` en horas, ej: -3 para Argentina)
- Si la app mobile tiene timezone del dispositivo, se usa ese
- Si no, se usa el timezone del perfil del usuario (zona del lugar de nacimiento)
- **Nunca** se usa la hora del servidor como referencia

### Flujo Preview → Dia Siguiente

```
Lunes 20:00 — usuario genera preview de martes
  → fecha_clave = martes
  → origen = "preview"
  → fecha_objetivo = martes
  → prompt incluye MARCADOR TEMPORAL: MANANA
  → Claude genera saludo: "Hola Maria, preparemos lo que viene manana..."
  → Episodio guardado con fecha = martes

Martes — usuario abre /podcast/hoy
  → busca fecha_clave = martes, tipo = dia
  → ENCUENTRA el episodio preview → lo sirve directamente
  → NO regenera nada
  → El contenido astronomico ya corresponde al martes
  → La intro contextual ("manana") fue apropiada para el momento de preview
```

### Regla clave

**No se regenera el contenido** cuando el dia llega. El audio generado como preview contiene los transitos y calculos correctos para la fecha objetivo. Solo cambia el contexto temporal del saludo.

---

## Saludo Dinamico

### Mecanismo

El prompt de podcast incluye un marcador temporal que determina como Claude redacta el saludo:

| Origen | Marcador | Ejemplo de saludo |
|--------|----------|-------------------|
| manual / auto | HOY | "Hola Maria, veamos como viene tu dia..." |
| preview | MANANA | "Hola Maria, preparemos lo que viene manana..." |

### Implementacion

El marcador se inyecta en el mensaje del usuario (no en el system prompt):

```
"Genera el episodio de podcast para [fecha]. MARCADOR TEMPORAL PARA EL SALUDO: [HOY/MANANA]."
```

El system prompt instruye a Claude que el primer parrafo SIEMPRE debe ser el saludo, usando el marcador indicado.

---

## Modelo de Datos

### Tabla: `podcast_episodios`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | UUID | PK |
| `usuario_id` | UUID | FK a usuarios |
| `fecha` | DATE | Fecha clave (normalizada por tipo) |
| `momento` | VARCHAR(20) | Tipo: dia, semana, mes |
| `titulo` | VARCHAR(200) | Titulo generado |
| `guion_md` | TEXT | Guion completo (texto plano, parrafos separados por linea vacia) |
| `segmentos_json` | JSONB | Array de {inicio_seg, fin_seg, texto} para lyrics sync |
| `duracion_segundos` | FLOAT | Duracion del audio |
| `url_audio` | VARCHAR(500) | Ruta en MinIO |
| `estado` | VARCHAR(20) | pendiente / generando_guion / generando_audio / listo / error |
| `origen` | VARCHAR(20) | manual / preview / auto |
| `fecha_objetivo` | DATE | Fecha real para la que se genero el contenido |
| `error_detalle` | TEXT | Detalle del error si fallo |
| `tokens_usados` | INT | Tokens consumidos en Claude |

### Constraint unico

`(usuario_id, fecha, momento)` — un episodio por usuario, por fecha clave, por tipo.

### Normalizacion de fecha clave

| Tipo | Fecha clave |
|------|-------------|
| dia | La misma fecha |
| semana | Lunes de esa semana |
| mes | Primer dia del mes |

---

## Retencion

| Tipo | Episodios retenidos |
|------|---------------------|
| dia | Ultimos 7 |
| semana | Ultimos 4 |
| mes | Ultimos 4 |
| **Total historial** | 15 episodios |

La limpieza se ejecuta automaticamente despues de cada generacion.

---

## Prompt de Generacion

### Archivo: `backend/app/oraculo/prompt_podcast.md`

### Reglas del prompt

- Español rioplatense, tono cercano y calido
- Parrafos cortos (2-3 oraciones) — cada uno se convierte en un segmento de sync
- Sin markdown, sin emojis, sin simbolos especiales
- Primer parrafo = saludo personalizado con nombre y marcador temporal
- Ultimo parrafo = frase motivacional o reflexiva
- Integrar datos reales del perfil cosmico (Sol, Luna, Ascendente, HD, numerologia)
- Mencionar transitos planetarios actuales con consejos practicos
- No inventar datos astronomicos que no esten en el contexto
- No usar jerga tecnica excesiva
- Variar estructura entre episodios

---

## TTS (Text-to-Speech)

| Parametro | Valor |
|-----------|-------|
| Proveedor | Google Gemini |
| Modelo | gemini-2.5-flash-preview-tts |
| Voz | Zephyr |
| Output | PCM 16-bit @ 24kHz → WAV → MP3 128k |

---

## Endpoints API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/podcast/hoy` | Episodios del dia (dia/semana/mes actuales) |
| GET | `/podcast/episodio/{id}` | Detalle con guion y segmentos |
| GET | `/podcast/audio/{id}` | Stream MP3 (proxy desde MinIO) |
| GET | `/podcast/historial` | Ultimos N episodios (default 15, max 50) |
| POST | `/podcast/generar?tipo=dia\|semana\|mes` | Generar on-demand |
| POST | `/podcast/preview-manana?tz_offset=-3` | Preview del dia siguiente (desde 19:00 local) |

Todos requieren plan **premium**.

---

## Archivos Involucrados

| Archivo | Responsabilidad |
|---------|-----------------|
| `backend/app/modelos/podcast.py` | Modelo SQLAlchemy |
| `backend/app/datos/repositorio_podcast.py` | CRUD + retencion |
| `backend/app/servicios/servicio_podcast.py` | Pipeline de generacion |
| `backend/app/servicios/servicio_tts.py` | Gemini TTS wrapper |
| `backend/app/servicios/servicio_almacenamiento.py` | MinIO upload/download |
| `backend/app/servicios/servicio_oraculo.py` | Claude API wrapper |
| `backend/app/rutas/v1/podcast.py` | Endpoints REST |
| `backend/app/oraculo/prompt_podcast.md` | System prompt |
| `backend/alembic/versions/008_podcast_episodios.py` | Migracion tabla base |
| `backend/alembic/versions/014_podcast_preview_manana.py` | Migracion preview |

---

## Escalabilidad Futura

### Pre-warming (opcional)

Para usuarios activos que no generaron preview, un job liviano puede correr cada hora:

1. Identificar usuarios premium con actividad reciente (ultimas 48h)
2. Verificar si tienen podcast de hoy
3. Si no → generar en background con origen "auto"
4. Limitar a N usuarios por ciclo para no saturar APIs

Esto NO bloquea la experiencia: si el pre-warming no corre, el usuario genera on-demand.

### Push Notifications (pendiente)

Cuando se implemente Expo Push Notifications:

1. Registrar push token del dispositivo en la DB
2. Despues de generar un podcast (cualquier origen), enviar notificacion
3. A las 08:00 hora local, si hay podcast listo, notificar con mini resumen
4. Respetar timezone del usuario para la hora de envio
