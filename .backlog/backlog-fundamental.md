# ASTRA - Backlog Fundamental

> **PROMPT DE INGRESO AL BACKLOG (REGLAS DE FORMATO)**
> Cada vez que ingreses un nuevo item a este backlog, DEBES respetar este formato:
>
> ### [ETIQUETA] - (AREA) - Titulo conciso
> **Ingreso:** YYYY-MM-DD ~HH:MM (ARG)
> **Origen probable / Approach sugerido:** (Donde empezar a investigar o resolver — archivo, servicio, endpoint, flujo. No es mandatorio pero orienta al dev que lo tome.)
>
> - **Detalles:** Breve explicacion del problema o idea
> - **Objetivo:** Que buscamos resolver o lograr
>
> Etiquetas: BUG | FEAT | UX/UI | DEV
> Areas: Backend | Frontend | Mobile | Pipeline | IA

---

## Tareas Pendientes

### BUG - (Mobile) - FAB chat tapa caja de texto en /chat
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `barra-navegacion-inferior.tsx` — ocultar FAB cuando `chatActivo === true`

- **Detalles:** El boton central de chat (FAB 68px) se superpone a la caja de ingreso de texto cuando el usuario esta en la pantalla de chat
- **Objetivo:** Que el input de texto sea completamente accesible sin obstrucciones

---

### BUG - (Mobile) - Menu inferior solapa caja de texto del chat
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `globals.css` — variable `--tab-bar-height` desalineada (56px vs 72px reales)

- **Detalles:** El paddingBottom calculado en layout-mobile usa 56px pero la barra mide 72px, dejando 16px de solapamiento
- **Objetivo:** Que la caja de texto quede completamente por encima del menu inferior

---

### UX/UI - (Mobile) - Botones inferiores desbalanceados horizontalmente
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `barra-navegacion-inferior.tsx` — cambiar spacer `flex-1` por ancho fijo + `justify-evenly`

- **Detalles:** Los 4 tabs se distribuyen 2+2 con un spacer flexible que genera asimetria visual
- **Objetivo:** Distribucion uniforme de los 4 tabs alrededor del espacio central del FAB

---

### BUG - (Mobile) - Dos botones desplazados hacia los costados
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** Mismo fix que el item anterior — `justify-evenly` + spacer fijo

- **Detalles:** El spacer `flex-1` empuja los tabs izquierdos y derechos hacia los extremos
- **Objetivo:** Alineacion visual centrada y equilibrada

---

### BUG - (Mobile) - FAB tapa mini reproductor en dashboard
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `globals.css` — corregir `--tab-bar-height` de 56px a 72px

- **Detalles:** El mini reproductor se posiciona con `bottom: calc(var(--tab-bar-height) + safe-area)` pero la variable es 16px menor que la barra real, causando que el FAB invada el reproductor
- **Objetivo:** Mini reproductor completamente libre del FAB y la barra

---

### BUG - (Mobile) - Mini reproductor "mordido" por menu inferior
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `globals.css` — misma correccion de `--tab-bar-height`

- **Detalles:** El bottom del mini reproductor queda 16px dentro de la barra de navegacion
- **Objetivo:** Separacion limpia entre mini reproductor y barra inferior

---

### UX/UI - (Mobile) - Jerarquia y spacing reproductor/mini/nav incorrectos
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `globals.css` — corregir `--tab-bar-height: 72px` y `--mini-player-height: 64px`

- **Detalles:** Las variables CSS no reflejan las alturas reales de los componentes, rompiendo el calculo de padding en layout-mobile
- **Objetivo:** Stack vertical correcto: nav (72px) > mini-player (64px) > contenido

---

### UX/UI - (Mobile) - Boton "podcast listo" no es violeta
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `hero-seccion.tsx` — cambiar `estiloBotonPrincipal` a gradiente violeta solido

- **Detalles:** El boton usa un gradiente casi transparente (opacity 0.12) que no se destaca
- **Objetivo:** Boton prominente con violeta solido (#7C4DFF) y texto blanco

---

### FEAT - (Mobile) - Swipe horizontal en seccion de aspectos
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `areas-vida-v2.tsx` — usar framer-motion `drag="x"` (ya instalado)

- **Detalles:** La seccion de areas de vida (salud, finanzas, creatividad) solo permite click en tabs, no swipe
- **Objetivo:** Habilitar navegacion por gesto swipe horizontal manteniendo tabs como alternativa

---

### FEAT - (Mobile) - Mantener compatibilidad tabs + swipe en aspectos
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** Mismo componente `areas-vida-v2.tsx` — tabs onClick sin cambios + swipe via framer-motion

- **Detalles:** El swipe debe complementar los tabs, no reemplazarlos
- **Objetivo:** Ambos modos de interaccion funcionando en mobile

---

### UX/UI - (Mobile) - Grafica de energia sin titulo visible
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `grafica-tendencia.tsx` — agregar `<p>` antes del SVG dentro del PanelGlass

- **Detalles:** La grafica solo tiene aria-label, no un titulo visual para el usuario
- **Objetivo:** Titulo sutil "Tendencia de energia" integrado sobre la grafica

---

### BUG - (Mobile) - Menu inferior se expande al hacer scroll largo
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `barra-navegacion-inferior.tsx` — agregar `overflow-hidden` al nav + corregir CSS vars

- **Detalles:** En scroll prolongado (especialmente Safari), la barra de navegacion crece anomalamente ocupando gran parte de la pantalla
- **Objetivo:** Altura fija e invariable del menu inferior

---

### BUG - (Mobile) - Menu inferior inestable durante scroll
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** Mismo fix — `overflow-hidden` + height constraint explicitoo

- **Detalles:** La interaccion entre address bar hide/show y flex layout causa inestabilidad
- **Objetivo:** Comportamiento consistente independiente del scroll

---

### BUG - (Mobile) - Modal de diseno humano cortado a mitad de pantalla
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `diseno-humano/page.tsx` — cambiar `max-h-[85vh]` a `calc(90vh - tab-bar - safe-area)`

- **Detalles:** El bottom sheet usa max-h-[85vh] sin descontar la barra inferior, y no permite scroll del contenido completo
- **Objetivo:** Modal que ocupe el maximo espacio util disponible

---

### BUG - (Mobile) - Modal HD sin scroll interno
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** Mismo fix — el `overflow-hidden` del container cortaba el scroll del panel interno

- **Detalles:** PanelContextualHD tiene overflow-y-auto interno pero el parent lo anulaba con overflow-hidden + max-h insuficiente
- **Objetivo:** Scroll completo dentro del modal hasta el final del contenido

---

### UX/UI - (Mobile) - Modal HD no se adapta al viewport
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** Calc con CSS vars del viewport en `diseno-humano/page.tsx`

- **Detalles:** La altura maxima fija (85vh) no considera la barra de navegacion ni el safe-area
- **Objetivo:** Modal que se adapte correctamente al espacio real disponible

---

### BUG - (Mobile) - Scroll horizontal no deseado en toda la vista
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `globals.css` — agregar `overflow-x: hidden` a `html`

- **Detalles:** No hay proteccion global contra overflow horizontal, permitiendo desplazamiento lateral
- **Objetivo:** Eliminar scroll horizontal del body/viewport

---

### BUG - (Mobile) - Contenedores exceden ancho del viewport
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `layout-mobile.tsx` — agregar `overflow-x-hidden` al container raiz

- **Detalles:** Defensa secundaria contra overflow horizontal en el shell mobile
- **Objetivo:** Todos los contenedores respetan el ancho del viewport

---

### BUG - (Mobile) - Modal de numerologia no permite scroll completo
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `numerologia/page.tsx` — corregir max-height con calc de tab-bar + safe-area

- **Detalles:** El modal usa max-h-[82vh] sin descontar la barra, y el contenido queda cortado abajo
- **Objetivo:** Scroll completo hasta el final del contenido del modal

---

### BUG - (Mobile) - Barra inferior tapa contenido del modal de numerologia
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** `panel-contextual-numerologia.tsx` — agregar `pb-8` en modo mobile

- **Detalles:** La parte inferior del contenido del modal queda detras de la barra de navegacion
- **Objetivo:** Contenido completamente visible sin obstrucciones

---

### BUG - (Mobile) - Area visible del modal no considera miniapp inferior
**Ingreso:** 2026-04-14 ~18:00 (ARG)
**Origen probable / Approach sugerido:** Mismo fix — el calc de maxHeight debe descontar `--tab-bar-height`

- **Detalles:** El modal no ajusta su altura considerando la presencia de la barra de navegacion inferior
- **Objetivo:** Scroll y area visible correctamente calculados con la miniapp presente
