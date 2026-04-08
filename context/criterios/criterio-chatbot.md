# Criterios del Chatbot — Oráculo ASTRA

> Documento de referencia para el comportamiento del agente AI del oráculo, sus reglas, fuentes de datos, y la arquitectura de scoring para consultas temporales.

---

## 1. Identidad y Rol

El agente se llama internamente **Astro Oracle**. Es un oráculo integrado que cruza tres disciplinas:

- **Astrología** (carta natal, tránsitos, casas, aspectos, dignidades)
- **Numerología** (sendero de vida, expresión, alma, año/mes/día personal)
- **Diseño Humano** (tipo, autoridad, perfil, estrategia, centros, canales, puertas)

Su enfoque es **sintético** (una lectura integrada, no tres separadas), **pedagógico** (explica sin condescendencia), **práctico** (cada análisis termina con algo accionable) y **honesto** (diferencia sugerencia de certeza).

---

## 2. Canales y Acceso

| Canal | Acceso | Restricción |
|-------|--------|-------------|
| Bot Telegram | `/start` → vincular cuenta → chat | Solo plan Premium |
| Chat Web | Desde la app web | Solo plan Premium |

- **Rate limit**: 30 mensajes/hora por usuario (Redis, TTL 1h)
- **Vinculación**: cuenta web ↔ Telegram via código de 6 dígitos

---

## 3. Modelo de IA y Parámetros

| Parámetro | Valor |
|-----------|-------|
| Proveedor | Anthropic (Claude API) |
| Modelo | Configurable via `ANTHROPIC_MODELO` en `.env` |
| Max tokens | 500 (700 para análisis temporal) |
| Temperature | 0.7 |
| Historial | Últimos 20 mensajes de la conversación |

---

## 4. Formato de Respuesta

### Reglas obligatorias

- Máximo **5 oraciones** por respuesta (conversacional) o **7 líneas** (temporal)
- Estilo chat natural, español rioplatense
- Sin títulos, subtítulos, secciones, listas, tablas ni markdown decorativo
- Sin emojis salvo que el usuario los use primero
- Estructura ideal: observación → interpretación integrada → sugerencia práctica
- Si el usuario pide detalle, responder corto y ofrecer ampliar

### Formato de salida (post-procesamiento)

La respuesta del modelo pasa por `_formatear_respuesta_chat()` que:
- Elimina markdown (negritas, headers, listas, code blocks)
- Para respuestas conversacionales: limita a 5 segmentos de máximo 300 caracteres cada uno
- Para respuestas temporales (con fechas): preserva estructura, limita a 7 líneas
- Si la respuesta queda vacía, retorna fallback: "Estoy acá. Decime un poco más y lo vemos juntos."

---

## 5. Fuentes de Datos Inyectadas al Prompt

El system prompt se construye dinámicamente con 3 secciones inyectadas:

### 5.1 Momento de la Consulta
- Fecha y hora actual (Argentina)
- Día de la semana, día del año
- Se genera en cada consulta

### 5.2 Contexto del Consultante (perfil cósmico)
Proviene de cálculos persistidos en la DB (`calculos` JSONB):

| Sección | Datos |
|---------|-------|
| Datos personales | Nombre, fecha/hora/lugar de nacimiento |
| Carta natal | Sol, Luna, Ascendente (signo + casa), cantidad de aspectos |
| Diseño Humano | Tipo, autoridad, perfil, estrategia, cruz de encarnación |
| Numerología | Todos los números del perfil (sendero, expresión, alma, etc.) |

### 5.3 Tránsitos
- **Actuales**: posiciones planetarias del momento exacto de la consulta
- **Próximos 7 días**: eventos notables (cambios de signo, retrogradaciones, aspectos exactos, fases lunares)
- **Ranking de mejores días** (cuando el usuario hace consultas temporales): resumen compacto del scoring determinista

---

## 6. Reglas de Datos del Oráculo

1. **NUNCA pedir datos al usuario** — ya están inyectados en el prompt
2. **SIEMPRE llamar al usuario por su nombre**
3. **NUNCA inventar datos** — si no tiene un cálculo, decirlo y sugerir calcularlo en la app
4. **NUNCA mostrar datos técnicos crudos** salvo que el usuario los pida
5. **Hablar desde la interpretación, no desde los datos** — "Tu esencia busca logro profesional" en vez de "Tu Sol está a 15.3° de Capricornio en casa 10"
6. **Los tránsitos inyectados son SOLO los disponibles** — no extrapolar ni inventar posiciones para fechas no calculadas
7. **Respetar el libre albedrío** — tendencias y energías, no destinos fijos
8. **No dar diagnósticos médicos**
9. **No ser fatalista** — todo tránsito difícil tiene propósito de crecimiento

---

## 7. Arquitectura de Consultas Temporales ("Mejor día/mes para...")

### 7.1 Tránsitos Persistidos — Ventana Deslizante

La tabla `transitos_diarios` almacena una fila por día con:
- **Planetas** (JSONB): 11 cuerpos celestes (longitud, signo, grado, retrógrado, velocidad)
- **Aspectos** (JSONB): aspectos entre todos los pares de planetas del día
- **Fase lunar**: Luna Nueva, Creciente, Cuarto Creciente, etc.
- **Eventos** (JSONB): resumen de lo que CAMBIÓ respecto al día anterior
- **Estado**: `pasado` / `presente` / `futuro`

Ventana: 365 días hacia adelante + retención de hasta 5 años hacia atrás. Se auto-repara al detectar gaps (no depende de cron).

### 7.2 Eventos Notables (pre-calculados, sin IA)

Para cada día se calculan comparando día N con día N-1:

| Evento | Cómo se detecta |
|--------|-----------------|
| Cambio de signo | Signo del planeta hoy ≠ ayer |
| Inicio retrogradación | Velocidad pasó de positiva a negativa |
| Fin retrogradación | Velocidad pasó de negativa a positiva |
| Aspecto exacto | Orbe < 1° entre dos planetas en tránsito |
| Fase lunar principal | Luna Nueva o Luna Llena |

### 7.3 Detector de Intent (sin IA, regex/keywords)

Identifica 3 dimensiones de la pregunta del usuario:

**Ventana temporal:**
| Pattern | Resultado |
|---------|-----------|
| "esta semana", "próximos días" | 7 días |
| "este mes", "en abril", "en mayo" | mes específico |
| "semestre", "próximos 6 meses" | 180 días |
| "este año", "en 2026" | 365 días |

**Granularidad:**
| Ventana | Granularidad |
|---------|-------------|
| ≤ 31 días | Día (top 5 días) |
| > 31 días | Mes (ranking de meses + mejor ventana dentro de cada mes) |

**Área de vida:**
| Keywords | Área |
|----------|------|
| lanzar, negocio, emprender, proyecto, trabajo, carrera | carrera |
| viajar, viaje, mudanza, mudarme | viajes |
| amor, pareja, relación, conocer gente | amor |
| invertir, dinero, comprar, vender, finanzas | finanzas |
| comunicar, presentar, publicar, escribir | comunicación |
| salud, cirugía, operación, energía | salud |
| estudiar, curso, aprender | estudio |
| firmar, contrato, acuerdo | contratos |

Si no detecta área, pasa todos los scores. Si no detecta ventana, default 30 días.

### 7.4 Scoring Determinista — 3 Componentes (sin IA)

#### A. Score Astrológico (peso 55%)

Cruza tránsitos del día con la **carta natal completa** del usuario:

| Área | Casas natales relevantes | Planetas natales clave | Aspectos favorables |
|------|--------------------------|------------------------|---------------------|
| Carrera | 10, 6, 2 | Sol, Saturno, Júpiter, MC | Trígono/sextil a MC, Sol natal |
| Viajes | 9, 3 | Júpiter, Mercurio | Trígono/sextil a Júpiter natal, cúspide Casa 9 |
| Amor | 7, 5 | Venus, Luna, DSC | Trígono/sextil a Venus natal, DSC |
| Finanzas | 2, 8 | Venus, Júpiter | Trígono a cúspide Casa 2/8 natal |
| Comunicación | 3 | Mercurio | Mercurio directo + aspectos armónicos |
| Salud | 1, 6 | Marte, Sol | Sin cuadraturas a Sol/Marte natal |
| Contratos | 7, 10 | Mercurio, Saturno | Mercurio directo + aspectos a Saturno natal |

Se evalúan todos los tránsitos del día contra las posiciones natales relevantes. Aspectos armónicos (trígono, sextil, conjunción con benéficos) suman. Aspectos tensos (cuadratura, oposición, conjunción con maléficos) restan.

#### B. Score Numerológico (peso 30%)

Dos capas:

**Capa 1 — Afinidad día↔área:**

| Día personal | Áreas naturalmente fuertes |
|---|---|
| 1 | Lanzar proyectos, emprender, liderar |
| 2 | Asociaciones, relaciones, cooperar |
| 3 | Creatividad, comunicación, expresión |
| 4 | Estructura, contratos, organización |
| 5 | Viajes, cambios, mudanzas, libertad |
| 6 | Amor, hogar, familia |
| 7 | Estudio, introspección, retiros |
| 8 | Negocios, finanzas, poder, inversiones |
| 9 | Cierres, generosidad, soltar |
| 11 | Decisiones espirituales, intuición |
| 22 | Proyectos grandes, construir legado |
| 33 | Servicio, enseñanza, sanación |

**Capa 2 — Resonancia con el perfil numerológico del usuario:**

El día personal interactúa con TODOS los números del perfil:

| Coincidencia | Multiplicador |
|---|---|
| Día personal = Sendero de vida | ×1.5 (resonancia alta) |
| Día personal = Año personal | ×1.5 (doble ciclo alineado) |
| Día personal = Expresión | ×1.25 (resonancia media) |
| Día personal = Alma | ×1.25 (resonancia media) |
| Sin coincidencia, sin tensión | ×1.0 (neutral) |
| Día en tensión con sendero | ×0.75 (disonancia) |

**Tensiones entre números:**
- 1 ↔ 2 (independencia vs dependencia)
- 1 ↔ 7 (acción externa vs introspección)
- 3 ↔ 4 (expansión creativa vs estructura rígida)
- 5 ↔ 4 (libertad vs disciplina)
- 7 ↔ 5 (quietud vs movimiento)
- 8 ↔ 2 (poder individual vs servicio al otro)
- 9 ↔ 1 (soltar vs iniciar)

Se toma el **máximo multiplicador** entre todas las coincidencias, ajustado por tensión. Score capped a 10.

```
score_numero = afinidad_dia_area × multiplicador_resonancia × factor_tension
```

#### C. Score de Eventos (peso 15%)

Bonus o penalty según eventos notables del día:

| Evento | Efecto |
|--------|--------|
| Júpiter entra en signo afín al área | +2 |
| Luna Nueva en casa natal relevante | +1.5 |
| Venus entra en Tauro/Libra (domicilio) | +1 para amor/finanzas |
| Mercurio retrógrado | -2 para comunicación/contratos/viajes |
| Marte cuadratura Saturno (exacto) | -1.5 para acción/iniciativas |
| Luna Llena | +1 para cierres, -0.5 para inicios |

### 7.5 Fórmula Final

```
score_dia = (score_astro × 0.55) + (score_numero × 0.30) + (score_eventos × 0.15)
```

### 7.6 Agrupación por Granularidad

**Cuando busca un DÍA** (ventana ≤ 31 días):
- Scorear cada día → ranking top 5 + días a evitar

**Cuando busca un MES** (ventana > 31 días):
```
score_mes = (promedio_diario × 0.4) + (mejor_ventana_consecutiva × 0.4) + (dias_sin_penalty × 0.2)
```
- **Promedio diario**: energía general del mes
- **Mejor ventana consecutiva**: según el área, busca el mejor bloque de N días seguidos

| Área | Ventana consecutiva |
|------|---------------------|
| Viajes | 5-15 días |
| Mudanza | 7 días |
| Relación | 7-14 días |
| Lanzamiento/firma | 1 día (puntual) |
| Cirugía | 1 día + Luna menguante |

- **Días sin penalty**: % de días sin eventos negativos para el área

### 7.7 Flujo Completo

```
Usuario: "¿Cuál es el mejor mes para viajar en 2026?"

1. DETECTOR INTENT (sin IA):
   → ventana: 2026 completo
   → granularidad: mes
   → área: viajes

2. QUERY DB: 365 filas de transitos_diarios

3. SCORING DETERMINISTA (sin IA):
   → Score diario para cada día (astro + numero + eventos)
   → Agrupar por mes con ventana consecutiva de 5-15 días
   → Ranking de meses + mejor ventana dentro de cada mes

4. RESUMEN COMPACTO (~400 tokens, sin IA):
   "## Análisis: mejor mes para viajes en 2026
    1. Junio (8.1): Júpiter trígono Júpiter natal Casa 9,
       ventana ideal 11-16/6, día personal 5 el 14/6 (resonancia sendero 5)
    2. Octubre (7.6): Sol sextil MC, Luna Nueva en Sagitario 22/10
    3. Marzo (7.2): Mercurio directo, Venus trígono Luna natal
    Evitar: Enero (Mercurio retro), Agosto (Saturno op Luna natal)"

5. INYECCIÓN AL PROMPT → Claude interpreta y responde natural:
   "Junio es tu mes. Entre el 11 y el 16 tenés una ventana ideal:
    Júpiter activa tu Casa 9 y el 14 tu día personal 5 resuena con tu
    sendero. Octubre también pinta bien, sobre todo la semana del 20."
```

La IA (Claude) solo interviene en el paso final: recibe datos deterministas ya procesados y los traduce a lenguaje natural, cálido, en el tono del oráculo, en máximo 3 líneas.

---

## 8. Tipos de Consulta Soportados

### Sin scoring (respuesta directa con contexto inyectado)
- Autoconocimiento: "¿Cómo soy?" → cruza Sol/Luna/ASC + número de vida + tipo HD
- Estado actual: "¿Cómo viene mi semana?" → tránsitos actuales + próximos 7 días
- Preguntas específicas simples: "¿Qué significa mi Luna en Escorpio?"

### Con scoring (análisis temporal)
- Mejor día: "¿Cuándo firmo el contrato?" → top 5 días
- Mejor mes: "¿Cuándo viajo?" → ranking de meses
- Mejor período: "¿Cuándo emprender?" → ventana óptima
- Qué evitar: "¿Cuándo NO hacer X?" → días/meses con penalties altos

### Compatibilidad (requiere datos de otra persona)
- "¿Somos compatibles con [nombre]?" → necesita carta de la otra persona
- Si no tiene los datos, sugiere calcularlos en la app

---

## 9. Reglas de Integridad

1. **Todo dato numérico del scoring viene de cálculos deterministas** — pyswisseph para astrología, funciones puras para numerología
2. **La IA nunca inventa datos, posiciones ni scores** — solo interpreta lo que recibe
3. **Si falta un cálculo del perfil del usuario**, se menciona y se sugiere calcularlo en la app
4. **Los pesos del scoring (55/30/15) son configurables** pero la arquitectura es fija
5. **Diferencia niveles de certeza**: "Las tres disciplinas convergen" (alta) vs "La astrología sugiere X" (media) vs "Es una interpretación posible" (baja)
