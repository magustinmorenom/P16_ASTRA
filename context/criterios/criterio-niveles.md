# Criterios de Niveles — Energía, Claridad e Intuición

> Documento de referencia para el cálculo determinista de los tres indicadores del clima cósmico diario en el dashboard de ASTRA.

---

## Resumen

El pronóstico diario muestra tres métricas de 1 a 10:

| Métrica | Qué mide | Icono |
|---------|----------|-------|
| **Energía** | Vitalidad general, capacidad de acción | Rayo |
| **Claridad** | Lucidez mental, capacidad analítica | Ojo |
| **Intuición** | Percepción sutil, conexión interna | Wifi |

Cuando el pronóstico se genera con Claude AI, los valores se interpretan contextualmente. Cuando no hay API key o Claude falla, se usa el **cálculo determinista** descrito abajo.

---

## Fuentes de datos

Los tres valores se calculan combinando:

1. **Número personal del día** — numerología pitagórica (fecha nacimiento + fecha actual)
2. **Signo lunar** — posición de la Luna en el zodíaco (pyswisseph)
3. **Fase lunar** — ángulo Sol-Luna (8 fases)

---

## Tablas de cálculo

### Energía por número personal

Valor directo sin modificadores lunares.

| Número | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33 |
|--------|---|---|---|---|---|---|---|---|---|----|----|-----|
| Energía | 8 | 5 | 7 | 4 | 7 | 6 | 3 | 8 | 6 | 9 | 7 | 8 |

**Lógica**: Números de acción (1, 5, 8, 11) → alta energía. Números introspectivos (4, 7) → baja energía.

### Claridad base por número personal

| Número | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33 |
|--------|---|---|---|---|---|---|---|---|---|----|----|-----|
| Claridad | 8 | 5 | 6 | 7 | 5 | 6 | 9 | 6 | 5 | 9 | 8 | 7 |

**Lógica**: Números analíticos/mentales (1, 7, 11) → alta claridad. Números emocionales/receptivos (2, 9) → claridad moderada.

### Intuición base por número personal

| Número | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33 |
|--------|---|---|---|---|---|---|---|---|---|----|----|-----|
| Intuición | 5 | 8 | 6 | 4 | 6 | 7 | 9 | 5 | 8 | 10 | 6 | 9 |

**Lógica**: Números receptivos/espirituales (2, 7, 9, 11, 33) → alta intuición. Números de estructura/acción (1, 4, 8, 22) → intuición moderada.

---

### Modificadores por signo lunar

Se suman al valor base.

| Signo | Claridad | Intuición | Elemento |
|-------|----------|-----------|----------|
| Aries | 0 | -1 | Fuego |
| Tauro | +1 | 0 | Tierra |
| Géminis | +2 | 0 | Aire |
| Cáncer | -1 | +2 | Agua |
| Leo | +1 | -1 | Fuego |
| Virgo | +2 | 0 | Tierra |
| Libra | +1 | 0 | Aire |
| Escorpio | -2 | +2 | Agua |
| Sagitario | +1 | 0 | Fuego |
| Capricornio | +1 | -1 | Tierra |
| Acuario | +1 | +1 | Aire |
| Piscis | -2 | +3 | Agua |

**Lógica por elemento**:
- **Agua** (Cáncer, Escorpio, Piscis): Sube intuición, baja claridad mental
- **Aire** (Géminis, Libra, Acuario): Sube claridad mental
- **Tierra** (Tauro, Virgo, Capricornio): Sube claridad moderadamente
- **Fuego** (Aries, Leo, Sagitario): Neutral o baja intuición

---

### Modificadores por fase lunar

Se suman al valor ya modificado por signo.

| Fase | Claridad | Intuición |
|------|----------|-----------|
| Luna Nueva | -1 | +1 |
| Creciente | +1 | 0 |
| Cuarto Creciente | +1 | 0 |
| Gibosa Creciente | 0 | +1 |
| Luna Llena | +1 | +2 |
| Gibosa Menguante | 0 | +1 |
| Cuarto Menguante | -1 | 0 |
| Menguante | -1 | +1 |

**Lógica**: La Luna llena amplifica ambas capacidades. La Luna nueva favorece intuición sobre lógica. Las fases crecientes favorecen claridad; las menguantes, introspección.

---

## Fórmula final

```
claridad = clamp(1, 10, base_numero + mod_signo + mod_fase)
intuicion = clamp(1, 10, base_numero + mod_signo + mod_fase)
energia  = base_numero  (sin modificadores lunares)
```

---

## Ejemplos

| Escenario | Energía | Claridad | Intuición |
|-----------|---------|----------|-----------|
| Día 3 + Escorpio + Gibosa Menguante | 7 | 4 | 9 |
| Día 7 + Piscis + Luna Nueva | 3 | 6 | 10 |
| Día 1 + Géminis + Luna Llena | 8 | 10 | 7 |
| Día 11 + Cáncer + Creciente | 9 | 9 | 10 |

---

## Implementación

- **Archivo**: `backend/app/servicios/servicio_pronostico.py`
- **Método**: `ServicioPronostico._calcular_claridad_intuicion(num, signo_luna, fase_luna)`
- **Se usa en**: `_generar_fallback_diario()` (cuando no hay API key de Anthropic o Claude falla)
- **Ruta principal**: Cuando Claude API está disponible, los valores se generan contextualmente según el prompt en `backend/app/oraculo/prompt_pronostico.md`

---

## Coherencia semántica

Los tres campos son consistentes en todo el stack:

| Campo API | Prop frontend | Label UI |
|-----------|---------------|----------|
| `energia` | `energia` | Energía |
| `claridad` | `claridad` | Claridad |
| `intuicion` | `intuicion` | Intuición |
