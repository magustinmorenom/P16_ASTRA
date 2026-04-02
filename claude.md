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
| `context/criterio-chatbot.md` | Criterios del chatbot Oráculo ASTRA: reglas de respuesta, fuentes de datos, arquitectura de scoring temporal (astro+numero+eventos), detector de intent, flujo completo. |
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
- Usar el skill `ui-ciruela` para tareas de diseño visual de interfaces ASTRA
- `ux-designer` queda como skill generalista legacy y no debe ser la referencia principal del producto
- Usar el skill `payment-gateway` para integración de pagos con MercadoPago (checkout, suscripciones, webhooks, testing)
- Usar el skill `mobile-developer` para tareas de desarrollo mobile React Native / Expo
- Todo código nuevo debe seguir el stack definido en `context/ADR-0.md`
- No introducir dependencias fuera del stack sin aprobación explícita del usuario
- Los cálculos astronómicos son deterministas: mismo input = mismo output (aprovechar cache)

### Paleta de Colores — Regla obligatoria

**NUNCA usar naranja (#FF9800, #F57C00, orange, amber) en la interfaz.** Está prohibido en todo el frontend.

Paleta permitida:
- **Primario**: Violeta (#7C4DFF, #4A2D8C, #2D1B69) — gradientes de noche
- **Acento**: Violeta claro (#B388FF, #c084fc) y dorado sutil (#D4A234) solo para detalles mínimos
- **Fondos**: Gris claro (#FAFAFA), blanco, glassmorphism (backdrop-blur + bg-white/60)
- **Texto**: Gris oscuro (#2C2926), gris medio (#8A8580), blanco sobre fondos oscuros
- **Estados**: Esmeralda (favorable), violeta (neutro), rojo suave (precaución) — NUNCA naranja/amber

El estilo visual es **glassmorphism + degradé violeta noche + grises para contraste**. Las tarjetas usan `backdrop-blur-xl bg-white/60 border border-white/30` o fondos sólidos blancos con bordes sutiles.

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

### Animaciones — Regla obligatoria

**Todo componente nuevo y todo cambio de contenido renderizado debe usar animaciones smooth fade-in / fade-out.** No se permiten transiciones bruscas ni contenido que aparezca de golpe.

- Usar `transition-all duration-200` o `duration-300` como base
- Para contenido que aparece/desaparece: `animate-[fade-in_200ms_ease-out]` o transición de opacidad + translate sutil
- Para cambio de tabs/contenido: fade-out del contenido anterior → fade-in del nuevo (usar estado intermedio si es necesario)
- Para listas que cargan: escalonar la animación con `animationDelay` por índice (`idx * 50ms`)
- Evitar `animate-bounce` o animaciones agresivas — el estilo ASTRA es suave y premium

### Concepto de Diseño Premium Compacto — Regla preferente

Cuando una pantalla ASTRA ya tenga la paleta correcta pero siga sintiéndose pesada, la solución **no** es agregar más tarjetas ni más títulos: hay que pasar de una lógica de “página con bloques” a una lógica de **consola de lectura**.

Principios obligatorios para nuevas iteraciones visuales:

- **Pensar en artefactos, no en cards.**
  - Priorizar rails, docks, bandas, timelines, matrices compactas, strips interactivos y nodos de lectura.
  - Una `card` solo se justifica si realmente encapsula una decisión o una acción.

- **Menos capítulos explícitos.**
  - Evitar rótulos como `Capítulo 1`, `Capítulo 2`, `Sección`, `Bloque`, etc.
  - Si una zona necesita demasiados títulos para entenderse, la estructura está mal resuelta.

- **Tipografía contenida.**
  - Premium no significa títulos gigantes ni números inflados.
  - Solo debe existir un foco tipográfico dominante por viewport.
  - Labels pequeños y claros; títulos medianos; números grandes solo cuando de verdad mandan la lectura.
  - En paneles laterales, tarjetas contextuales y módulos secundarios no usar títulos heroicos: preferir escalas contenidas, normalmente entre `text-[16px]` y `text-[20px]`.

- **El centro muestra estructura; el panel derecho explica.**
  - La vista principal debe quedarse con síntesis, selección y navegación.
  - La explicación larga, el detalle técnico y la interpretación personalizada viven en el panel derecho o en un sheet contextual.
  - No duplicar explicación en ambos lados.

- **Cero redundancia visual.**
  - Si un texto no cambia comprensión ni acción, sobra.
  - Si dos bloques explican lo mismo con distinto wording, sobra uno.
  - Si un artefacto visual no ayuda a decidir ni a leer mejor, debe bajar de nivel o pasar a modal.

- **Aprovechar el viewport.**
  - Evitar stacks verticales de tarjetas altas cuando el contenido puede resolverse en una banda, una matriz o una grilla compacta.
  - Desktop debe sentirse como mesa de lectura o cabina interactiva, no como landing larga.

- **Los componentes deben ser clickeables por semántica, no por decoración.**
  - Todo dato técnico o estructural importante debe poder abrir contexto.
  - El hover y el activo deben sugerir “esto se puede leer” o “esto controla algo”.

Patrones recomendados para ASTRA:

- `Dock` de acceso rápido para cambiar foco entre capas.
- `Rail` compacto para resúmenes clave.
- `Timeline` o `Stepper` cuando hay progresión temporal.
- `Matriz` para datos secundarios.
- `Listas densas` para items técnicos repetitivos.
- `Modal` o `artefacto secundario` para gráficos que no deben dominar la pantalla.

### Pre-deploy — Regla obligatoria

**SIEMPRE correr `cd frontend && npx tsc --noEmit` antes de pushear a main.** El build de Docker en producción corre TypeScript strict y cualquier error rompe el deploy.

Si hay errores de TypeScript, corregirlos antes de hacer push. No se debe pushear a main con errores TS pendientes.
