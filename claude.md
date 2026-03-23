# CLAUDE.md — P16_ASTRA / CosmicEngine

## Regla Principal: Verificar Contexto Antes de Actuar

**OBLIGATORIO:** Antes de ejecutar cualquier acción (escribir código, crear archivos, diseñar, planificar, o tomar decisiones de arquitectura), TODOS los agentes DEBEN:

IMPORTANTE IDIOMA: TODO LO QUE PROGRAMES DEBE SER EN ESPAÑOL (salvo nombres especificos) y la interfaz tambien debe ser en español.

1. **Leer la carpeta `context/`** — Listar y leer todos los archivos en `context/` para entender el estado actual del proyecto, las decisiones de arquitectura y los requisitos.
2. **Respetar las decisiones documentadas** — Las ADRs (Architecture Decision Records) y documentos en `context/` son la fuente de verdad. No contradecir ni ignorar lo que está documentado allí.
3. **Validar coherencia** — Cualquier código, diseño o decisión debe ser coherente con los documentos de contexto. Si hay un conflicto, preguntar al usuario antes de proceder.

### Archivos de Contexto Actuales

| Archivo | Contenido |
|---------|-----------|
| `context/ADR-0.md` | Architecture Requirements Document — CosmicEngine v1.0. Define stack, servicios, modelos de datos, endpoints, dependencias y roadmap. |
| `context/resumen-de-cambios.md` | Changelog de sesiones de desarrollo. Cada sesion documentada con fecha, archivos creados/modificados, y explicacion funcional. |

> Cuando se agreguen nuevos archivos a `context/`, los agentes deben leerlos todos antes de actuar.

### Regla de Changelog — OBLIGATORIO al final de cada sesion

Al terminar cada sesion de desarrollo donde se implemente una feature nueva o cambio significativo, **se DEBE agregar una entrada** en `context/resumen-de-cambios.md` con el siguiente formato:

```markdown
## Sesion: [Nombre descriptivo de la feature]
**Fecha:** YYYY-MM-DD ~HH:MM (ARG)

### Que se hizo
[1-2 oraciones resumiendo el cambio principal]

### Backend/Frontend — Archivos creados/modificados
[Tabla con archivos y descripcion de cambios]

### Tests
[Cantidad de tests nuevos/modificados, total pasando]

### Como funciona
[Explicacion funcional del flujo para que alguien nuevo entienda que se hizo]
```

**Reglas:**
- Siempre incluir fecha y hora aproximada (zona ARG)
- Documentar TODOS los archivos creados y modificados con descripcion breve
- Incluir estado de tests (cuantos pasan)
- La seccion "Como funciona" es obligatoria — debe explicar el flujo end-to-end
- NUNCA incluir credenciales, API keys, tokens o passwords en este archivo
- Agregar al final del archivo, manteniendo el orden cronologico

---

## Proyecto: CosmicEngine

Plataforma de cálculo esotérico-astronómico que integra:
- **Carta Astral** (astrología occidental, pyswisseph + kerykeion)
- **Human Design** (Body Graph, 88 grados solares)
- **Numerología** (Pitagórico y Caldeo)
- **Revolución Solar** y **Tránsitos en tiempo real**

### Stack Tecnológico

- **Backend:** Python 3.11+, FastAPI, pyswisseph, kerykeion, SQLAlchemy, PostgreSQL, Redis
- **Frontend:** Next.js 14+, React 18+, d3.js, TailwindCSS, SVG generativo
- **Geocodificación:** Nominatim/OSM + timezonefinder
- **Efemérides:** Swiss Ephemeris (archivos .se1)

### Estructura de la API

Base: `/api/v1/`
- `POST /natal` — Carta natal completa
- `POST /human-design` — Body Graph + perfil HD
- `POST /numerology` — Carta numerológica
- `POST /solar-return/{year}` — Revolución solar
- `GET /transits` — Posición actual de astros
- `GET/POST /profile/{id}` — Guardar/recuperar perfil

### Decisiones Clave (ADRs)

- **ADR-01:** Sistema de casas Placidus por defecto (configurable)
- **ADR-02:** Numerología Pitagórica por defecto (Caldeo como alternativa)
- **ADR-03:** Motor único pyswisseph para todos los cálculos astronómicos
- **ADR-04:** Geocodificación con Nominatim/OSM (gratuito)
- **ADR-05:** Cache Redis (cálculos deterministas)

### Puntos Críticos

- Zona horaria DEBE resolverse en la fecha histórica del nacimiento, no en el presente
- Los 88 grados de HD son grados eclípticos del Sol, NO días calendario
- Números maestros (11, 22, 33) NO se reducen en numerología
- Precisión solar requerida: < 0.01 grados vs Astro.com

---

## Convenciones para Agentes

- Usar el skill `fullstack-engineer` para tareas de implementación backend/frontend
- Usar el skill `ux-designer` para tareas de diseño de interfaces
- Usar el skill `payment-gateway` para integración de pagos con MercadoPago (checkout, suscripciones, webhooks, testing)
- Todo código nuevo debe seguir el stack definido en `context/ADR-0.md`
- No introducir dependencias fuera del stack sin aprobación explícita del usuario
- Los cálculos astronómicos son deterministas: mismo input = mismo output (aprovechar cache)

### Iconografía — Regla obligatoria

**NUNCA usar emojis ni símbolos Unicode zodiacales (♈♉♊♋♌♍♎♏♐♑♒♓) en la interfaz.**

Siempre usar los iconos SVG de `frontend/public/img/icons/` a través de los componentes:

- **`<IconoAstral nombre="..." />`** — Para iconos temáticos de sección (astrologia, numerologia, horoscopo, personal, compatibilidad, bola-cristal, suerte, salud, emocion, libro, carrera, tarot).
- **`<IconoSigno signo="Aries" />`** — Para representar signos zodiacales. Acepta el nombre del signo en español.

Ambos componentes están en `@/componentes/ui/icono-astral`. Usan CSS `mask-image` + `bg-current`, por lo que heredan el color del texto del padre (usar `className="text-acento"`, `text-primario`, etc.).

| Contexto | Usar | NO usar |
|----------|------|---------|
| Header de sección | `<IconoAstral nombre="astrologia">` | `<Icono nombre="estrella">` |
| Signo zodiacal en tabla/tarjeta | `<IconoSigno signo="Aries">` | `♈` / `obtenerSimbolo()` |
| Iconos de UI genéricos (flechas, menú, cerrar) | `<Icono nombre="...">` (Phosphor) | — |

Los iconos Phosphor (`<Icono>`) siguen disponibles para UI genérica (navegación, formularios, acciones). Los iconos SVG astrales son obligatorios para contenido esotérico/astrológico.
