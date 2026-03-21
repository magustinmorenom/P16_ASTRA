# Architecture Requirements Document
## CosmicEngine — Plataforma de Cálculo Astrológico, Human Design y Numerología

**Versión:** 1.0.0  
**Fecha:** Marzo 2026  
**Autor:** Odín Technologies  
**Estado:** Draft

---

## 1. Resumen Ejecutivo

CosmicEngine es una plataforma de cálculo esotérico-astronómico que integra tres disciplinas en un único motor:

- **Carta Astral** (astrología occidental)
- **Carta de Human Design** (Ra Uru Hu / Jovian Archive system)
- **Carta Numerológica** (sistemas Pitagórico y Caldeo)

El sistema extiende sus capacidades hacia **Revolución Solar** y **Tránsitos planetarios en tiempo real**, utilizando Swiss Ephemeris como motor astronómico central.

---

## 2. Objetivos del Sistema

| ID | Objetivo |
|----|----------|
| OBJ-01 | Calcular carta natal completa (planetas, casas, aspectos) para cualquier fecha/hora/lugar |
| OBJ-02 | Generar Body Graph de Human Design con Tipo, Autoridad, Perfil y Variables |
| OBJ-03 | Producir carta numerológica completa en sistemas Pitagórico y Caldeo |
| OBJ-04 | Calcular Revolución Solar para cualquier año de vida |
| OBJ-05 | Proveer posición en tiempo real de los 10 cuerpos celestes principales |
| OBJ-06 | Exportar resultados en JSON y SVG |
| OBJ-07 | Soportar múltiples usuarios con perfiles persistentes |
| OBj-08| Generar un perfil esperitual combinado con la carta de diseño humano, astrologiá y numerologia
 | OBJ-09| Considerando el perfil esperitual del usuario aconsejar teniendo en cuenta el calendario y el tránsito lunar. para dias, semanas, meses y años
---

## 3. Restricciones y Decisiones de Arquitectura

### 3.1 Restricciones técnicas

| Restricción | Descripción |
|-------------|-------------|
| **Licencia Swiss Ephemeris** | GPL libre para open source. Licencia comercial  |
| **Archivos `.se1`** | Las efemérides son archivos binarios (~100MB) que deben residir en el servidor |
| **Zona horaria histórica** | Crítica: errores aquí invalidan todos los cálculos. Se requiere base Olson/IANA completa |
| **Copyright HD** | Los cálculos matemáticos son libres. La marca "Human Design" pertenece a Jovian Archive |
| **Precisión HD** | Los 88° del Sol para la fecha inconsciente son grados eclípticos, NO días calendario |

### 3.2 Decisiones de diseño (ADR)

| ADR | Decisión | Justificación |
|-----|----------|---------------|
| ADR-01 | Sistema de casas: **Placidus** por defecto | El más usado globalmente. Configurable por usuario |
| ADR-02 | Numerología: **Pitagórico** por defecto | Mayor adopción occidental. Caldeo como alternativa |
| ADR-03 | Motor único: **pyswisseph** | Una sola librería para Astral, HD, RS y Tránsitos |
| ADR-04 | Geocodificación: **Nominatim / OSM** | Gratuito, sin límites de API key |
| ADR-05 | Cache: **Redis** | Los cálculos son deterministas — mismo input = mismo output |

---

## 4. Arquitectura del Sistema

### 4.1 Diagrama de Capas

```
┌─────────────────────────────────────────────┐
│              CLIENTE / FRONTEND              │
│         Next.js + React + SVG Render         │
└───────────────────────┬─────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼─────────────────────┐
│              API GATEWAY                     │
│              FastAPI (Python)                │
├──────────┬──────────┬───────────┬────────────┤
│ Astro    │    HD    │   Num     │  Transits  │
│ Service  │ Service  │  Service  │  Service   │
└────┬─────┴────┬─────┴─────┬─────┴─────┬──────┘
     │          │           │           │
┌────▼──────────▼───────────▼───────────▼──────┐
│              CORE ENGINE LAYER               │
│  GeoService │ TimezoneService │ EphemerisService │
│  Nominatim  │ timezonefinder  │   pyswisseph     │
└─────────────────────────┬────────────────────┘
                          │
┌─────────────────────────▼────────────────────┐
│                  DATA LAYER                  │
│  PostgreSQL │ Redis Cache │ .se1 Files │ JSON│
└──────────────────────────────────────────────┘
```

---

## 5. Componentes del Sistema

### 5.1 Frontend — Next.js + React

**Responsabilidades:**
- Formulario de entrada: nombre, fecha, hora, ciudad
- Visualización SVG de carta astral (rueda zodiacal)
- Visualización SVG de Body Graph (Human Design)
- Dashboard numerológico
- Vista de Revolución Solar comparativa
- Tránsitos en tiempo real (polling cada 10 min)

**Librerías:**
```
next.js >= 14
react >= 18
d3.js (SVG generativo)
bodygraph-chart (npm) — render Body Graph
tailwindcss
```

---

### 5.2 Backend — FastAPI

**Endpoint base:** `/api/v1/`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/natal` | POST | Carta natal completa |
| `/human-design` | POST | Body Graph + perfil HD |
| `/numerology` | POST | Carta numerológica |
| `/solar-return/{year}` | POST | Revolución solar |
| `/transits` | GET | Posición actual de astros |
| `/profile/{id}` | GET/POST | Guardar/recuperar perfil |

**Input estándar (todos los endpoints):**
```json
{
  "name": "string",
  "birth_date": "YYYY-MM-DD",
  "birth_time": "HH:MM",
  "birth_city": "string",
  "birth_country": "string"
}
```

---

### 5.3 GeoService

**Función:** Traducir ciudad/país → Latitud, Longitud, Zona Horaria

**Stack:**
```python
# Librería: Nominatim (geopy)
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz

def resolve_location(city: str, country: str) -> dict:
    # → lat, lon, timezone_str (ej: "America/Argentina/Buenos_Aires")
```

**⚠️ Punto crítico:** La zona horaria debe resolverse en la **fecha histórica** del nacimiento, no en el presente. Argentina cambió sus offsets UTC múltiples veces.

---

### 5.4 EphemerisService (Motor Central)

**Librería:** `pyswisseph`  
**Archivos requeridos:** `seas_18.se1`, `sepl_18.se1`, `semo_18.se1`

**Cuerpos celestes calculados:**

| ID SE | Cuerpo | Uso |
|-------|--------|-----|
| 0 | Sol | Astral + HD |
| 1 | Luna | Astral + HD |
| 2 | Mercurio | Astral + HD |
| 3 | Venus | Astral + HD |
| 4 | Marte | Astral + HD |
| 5 | Júpiter | Astral + HD |
| 6 | Saturno | Astral + HD |
| 7 | Urano | Astral + HD |
| 8 | Neptuno | Astral + HD |
| 9 | Plutón | Astral + HD |
| 10 | Nodo Norte | Astral |
| 11 | Nodo Sur | Astral |

**Output por planeta:**
```python
{
  "planet": "Sun",
  "longitude": 285.43,      # grado eclíptico 0-360
  "latitude": 0.0,
  "sign": "Capricorn",
  "sign_degree": 15.43,     # grado dentro del signo
  "house": 4,
  "retrograde": False,
  "speed": 1.01             # grados/día
}
```

---

### 5.5 AstroService (Carta Natal)

**Librería:** `kerykeion`

**Calcula:**
- Posición de 10 planetas + nodos
- 12 casas (sistema Placidus por defecto)
- Ascendente, MC, DC, IC
- Aspectos: conjunción, sextil, cuadratura, trígono, oposición (orbe configurable)
- Digniades esenciales (domicilio, exaltación, caída, exilio)

**Output adicional:** SVG de rueda zodiacal completa

---

### 5.6 HDService (Human Design)

**Cálculo de la fecha inconsciente:**
```python
def calculate_unconscious_date(birth_jd: float) -> float:
    """
    Retroceder exactamente 88° del Sol desde la fecha natal.
    NO son 88 días. Son 88 grados eclípticos del Sol.
    El Sol recorre ~1°/día → aprox 88 días, pero con variación.
    """
    sun_natal_lon = get_sun_longitude(birth_jd)
    target_lon = (sun_natal_lon - 88.0) % 360
    # Buscar iterativamente la fecha donde Sol = target_lon
    return binary_search_sun_date(target_lon, birth_jd - 90)
```

**Tabla I Ching (JSON estático):**
```json
{
  "0.0":   {"hexagram": 1, "line": 1},
  "0.083": {"hexagram": 1, "line": 2},
  ...
  "359.9": {"hexagram": 2, "line": 6}
}
```
360° / 384 líneas (64 hex × 6 líneas) = 0.9375° por línea

**Output HD:**
```json
{
  "type": "Generator",
  "authority": "Sacral",
  "profile": "2/4",
  "definition": "Single",
  "incarnation_cross": "Right Angle Cross of Eden",
  "centers": {
    "head": "open",
    "ajna": "defined",
    "throat": "defined",
    ...
  },
  "channels": ["25-51", "34-57"],
  "gates_conscious": [25, 51, 34, 57, ...],
  "gates_unconscious": [1, 8, 23, ...]
}
```

---

### 5.7 NumerologyService

**Independiente de Swiss Ephemeris** — solo requiere nombre y fecha.

**Sistema Pitagórico:**

| Letra | Valor |
|-------|-------|
| A,J,S | 1 |
| B,K,T | 2 |
| C,L,U | 3 |
| D,M,V | 4 |
| E,N,W | 5 |
| F,O,X | 6 |
| G,P,Y | 7 |
| H,Q,Z | 8 |
| I,R   | 9 |

**Números calculados:**

| Número | Fuente | Descripción |
|--------|--------|-------------|
| Camino de Vida | Fecha completa | Propósito central |
| Expresión | Nombre completo | Potencial externo |
| Impulso del Alma | Solo vocales | Motivación interna |
| Personalidad | Solo consonantes | Imagen proyectada |
| Número de Nacimiento | Día de nacimiento | Talento innato |
| Año Personal | Fecha + año actual | Ciclo vigente |

**Regla de reducción:** Todo número → dígito simple excepto maestros **11, 22, 33**.

---

### 5.8 SolarReturnService (Revolución Solar)

**Concepto:** Momento exacto en que el Sol vuelve al grado/minuto natal. Ocurre ~1 vez por año.

```python
def calculate_solar_return(natal_sun_lon: float, year: int, birth_lat: float, birth_lon: float) -> dict:
    """
    Busca iterativamente en 365 días el momento donde
    Sol_actual = Sol_natal (con precisión de segundos)
    Calcula nueva carta para ese momento y lugar
    """
```

**Output:** Nueva carta completa (planetas + casas) para el año solar, comparativa con natal.

---

### 5.9 TransitService

**Función:** Posición actual (o futura) de todos los planetas.

```python
def get_current_transits() -> dict:
    now_jd = swe.julday(datetime.utcnow())
    return [get_planet_position(p, now_jd) for p in ALL_PLANETS]
```

**Uso:** Comparar tránsitos vs carta natal → aspectos activos en tiempo real.

---

## 6. Modelo de Datos

### 6.1 Tabla `profiles`

```sql
CREATE TABLE profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    name        VARCHAR(100),
    birth_date  DATE NOT NULL,
    birth_time  TIME NOT NULL,
    birth_city  VARCHAR(100),
    birth_country VARCHAR(60),
    latitude    DECIMAL(9,6),
    longitude   DECIMAL(9,6),
    timezone    VARCHAR(60),
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Tabla `calculations` (cache persistente)

```sql
CREATE TABLE calculations (
    id          UUID PRIMARY KEY,
    profile_id  UUID REFERENCES profiles(id),
    type        VARCHAR(20), -- 'natal' | 'hd' | 'numerology' | 'solar_return' | 'transit'
    params_hash VARCHAR(64), -- SHA256 del input
    result_json JSONB,
    calculated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Flujo de Ejecución Completo

```
1. Usuario ingresa: nombre, fecha, hora, ciudad
        ↓
2. GeoService: ciudad → lat, lon
        ↓
3. TimezoneService: lat/lon + fecha histórica → UTC offset exacto
        ↓
4. EphemerisService: fecha UTC → Julian Day Number (JD)
        ↓
5. Cálculos en PARALELO:
   ├── AstroService(JD, lat, lon) → carta natal
   ├── HDService(JD) → fecha inconsciente → body graph
   ├── NumerologyService(nombre, fecha) → carta numerológica
   ├── SolarReturnService(JD, año) → revolución solar
   └── TransitService(JD_ahora) → tránsitos
        ↓
6. Guardar en Redis (TTL: 24h para tránsitos, ∞ para natal/HD/num)
        ↓
7. Guardar en PostgreSQL (perfil del usuario)
        ↓
8. Response → Frontend → SVG render
```

---

## 8. Dependencias y Versiones

### Backend (Python)
```
python >= 3.11
fastapi >= 0.110
uvicorn >= 0.27
pyswisseph >= 2.10.3.2
kerykeion >= 4.14
geopy >= 2.4
timezonefinder >= 6.4
pytz >= 2024.1
redis >= 5.0
sqlalchemy >= 2.0
psycopg2-binary >= 2.9
```

### Frontend (Node.js)
```
next >= 14.2
react >= 18.3
d3 >= 7.9
bodygraph-chart >= latest
tailwindcss >= 3.4
```

---

## 9. Riesgos y Mitigaciones

| ID | Riesgo | Impacto | Probabilidad | Mitigación |
|----|--------|---------|--------------|------------|
| R-01 | Zona horaria histórica errónea | 🔴 Crítico | Alta | Usar base IANA completa + validación manual para fechas pre-1970 |
| R-02 | Cálculo 88° HD inexacto | 🔴 Crítico | Media | Implementar búsqueda binaria con precisión < 0.001° |
| R-03 | Licencia GPL en app comercial | 🟡 Legal | Media | Adquirir licencia comercial SE antes de lanzamiento o usar moshier-ephemeris |
| R-04 | Copyright "Human Design" | 🟡 Legal | Baja | No usar trademark de Jovian Archive. Llamarlo "Body Graph Analysis" |
| R-05 | Performance con muchos usuarios | 🟠 Medio | Media | Redis cache + cálculos asíncronos con FastAPI async/await |
| R-06 | Archivos .se1 pesados en deploy | 🟠 Medio | Baja | Incluir solo rango necesario (ej: 1900-2100 = ~30MB) |

---

## 10. Roadmap de Implementación

| Fase | Módulo | Duración estimada |
|------|--------|-------------------|
| **Fase 1** | GeoService + TimezoneService + EphemerisService | 1 semana |
| **Fase 2** | AstroService (carta natal) + SVG render | 1 semana |
| **Fase 3** | HDService (Body Graph) + tabla I Ching | 1.5 semanas |
| **Fase 4** | NumerologyService | 3 días |
| **Fase 5** | SolarReturnService + TransitService | 1 semana |
| **Fase 6** | Frontend completo + integración | 2 semanas |
| **Fase 7** | Auth, perfiles, PostgreSQL | 1 semana |
| **Total** | | **~8 semanas** |

---

## 11. Criterios de Aceptación

| ID | Criterio | Método de verificación |
|----|----------|----------------------|
| CA-01 | Posición solar con error < 0.01° vs Astro.com | Comparativa manual 20 cartas |
| CA-02 | Tipo HD correcto en 100% de casos de prueba | Dataset de 50 perfiles conocidos |
| CA-03 | Números de vida correctos según tablas Pitagóricas | Unit tests con casos conocidos |
| CA-04 | Revolución Solar dentro de ±1 minuto vs referencia | Comparativa con Astro.com SR |
| CA-05 | Response time < 2s para carta natal completa | Load test con k6 |
| CA-06 | Cache hit > 80% en tránsitos | Métricas Redis |

---

*Documento generado por Odin Technologies — CosmicEngine Architecture v1.0*
