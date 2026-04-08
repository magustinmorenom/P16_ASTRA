# Chat Web como Seccion Principal — Plan de Implementacion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el chat flotante (chat-widget.tsx) en la primera seccion del sidebar web, con panel lateral de conversaciones tipo ChatGPT y area principal de chat en el main container.

**Architecture:** El chat pasa de ser un widget flotante (FAB bottom-right) a ser el primer item del sidebar. Al hacer click, el main container renderiza la pagina de chat. Un segundo panel lateral izquierdo (dentro de la pagina de chat) muestra la lista de conversaciones, identico a ChatGPT. Los hooks de chat web se extienden para soportar gestion de conversaciones (ya existe en mobile y en el backend).

**Tech Stack:** Next.js App Router, React, TailwindCSS, TanStack React Query, CSS variables (--shell-*)

---

## Estado actual vs deseado

**ACTUAL:**
```
┌──────────┬────────────────────────────────┐
│ Sidebar  │  Main Content                  │  + ChatWidget (FAB flotante bottom-right)
│ 264px    │  (paginas: dashboard, astral..)│
│          │                                │
│ · Mapa   │                                │
│ · Perfil │                                │
│ · Podcast│                                │
│ · Astral │                                │
│ · ...    │                                │
└──────────┴────────────────────────────────┘
```

**DESEADO:**
```
┌──────────┬──────────────┬─────────────────┐
│ Sidebar  │ Panel Conv.  │  Area de Chat   │
│ 264px    │ 280px        │  (flex-1)       │
│          │              │                 │
│ ★ CHAT   │ [+ Nueva]    │  Burbujas       │
│ · Mapa   │              │  mensajes       │
│ · Perfil │ Conv 1    →  │                 │
│ · Podcast│ Conv 2       │  [Input____][➤] │
│ · ...    │ Conv 3       │                 │
└──────────┴──────────────┴─────────────────┘
```

Cuando NO esta en /chat, el panel de conversaciones no se muestra y el layout es el normal.

---

## File Structure

| Archivo | Accion | Responsabilidad |
|---------|--------|-----------------|
| `frontend/src/app/(app)/chat/page.tsx` | **Crear** | Pagina de chat: panel conversaciones + area mensajes |
| `frontend/src/app/(app)/chat/layout.tsx` | **Crear** | Layout que agrega el panel lateral de conversaciones |
| `frontend/src/componentes/chat/panel-conversaciones-web.tsx` | **Crear** | Panel lateral izquierdo con lista de conversaciones |
| `frontend/src/componentes/chat/area-chat-web.tsx` | **Crear** | Area principal de mensajes, input, typing, sugerencias |
| `frontend/src/lib/hooks/usar-chat.ts` | **Modificar** | Agregar hooks faltantes: conversaciones, cambiar, renombrar, anclar, archivar, eliminar |
| `frontend/src/lib/tipos/chat.ts` | **Modificar** | Agregar tipo ConversacionResumen y CambiarConversacionRespuesta |
| `frontend/src/componentes/layouts/sidebar-navegacion.tsx` | **Modificar** | Agregar "Oraculo ASTRA" como primer item, destacado violeta |
| `frontend/src/componentes/layouts/layout-app.tsx` | **Modificar** | Eliminar ChatWidget flotante |
| `frontend/src/componentes/layouts/layout-mobile.tsx` | **Modificar** | Eliminar ChatWidget flotante |
| `frontend/src/componentes/chat/chat-widget.tsx` | **Eliminar** | Ya no se usa |

### Dependencias que NO cambian
- Backend `/chat/*` endpoints — todos ya existen y funcionan
- `frontend/src/lib/api/cliente.ts` — cliente HTTP
- Mobile chat — sin cambios

---

## Task 1: Extender tipos de chat web

**Files:**
- Modify: `frontend/src/lib/tipos/chat.ts`

Los tipos `ConversacionResumen` y `CambiarConversacionRespuesta` ya existen en mobile pero no en web.

- [ ] **Step 1: Agregar tipos faltantes a chat.ts**

Agregar al final del archivo:

```typescript
export interface ConversacionResumen {
  id: string;
  preview: string;
  titulo: string | null;
  total_mensajes: number;
  activa: boolean;
  anclada: boolean;
  archivada: boolean;
  creado_en: string | null;
}

export interface CambiarConversacionRespuesta {
  conversacion_id: string;
  mensajes: MensajeChat[];
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/tipos/chat.ts
git commit -m "feat(web): agregar tipos ConversacionResumen y CambiarConversacion"
```

---

## Task 2: Extender hooks de chat web

**Files:**
- Modify: `frontend/src/lib/hooks/usar-chat.ts`

Agregar los hooks que ya existen en mobile (`usar-chat.ts` de mobile) pero faltan en web: `usarConversaciones`, `usarCambiarConversacion`, `usarRenombrarConversacion`, `usarAnclarConversacion`, `usarArchivarConversacion`, `usarEliminarConversacion`.

- [ ] **Step 1: Agregar hooks faltantes**

Copiar la logica de `mobile/src/lib/hooks/usar-chat.ts` (lineas 45-121), adaptando imports a los del frontend web. Los endpoints son identicos (`/chat/conversaciones`, `/chat/cambiar/{id}`, `/chat/{id}/renombrar`, `/chat/{id}/anclar`, `/chat/{id}/archivar`, `/chat/{id}`).

Tambien agregar invalidacion de `["chat", "conversaciones"]` en `usarEnviarMensaje` y `usarNuevaConversacion` (como ya hace mobile).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/hooks/usar-chat.ts
git commit -m "feat(web): agregar hooks de gestion de conversaciones"
```

---

## Task 3: Crear panel-conversaciones-web.tsx

**Files:**
- Create: `frontend/src/componentes/chat/panel-conversaciones-web.tsx`

Panel lateral izquierdo estilo ChatGPT. Dentro de la pagina de chat, ocupa 280px a la izquierda. Muestra:
- Header "Conversaciones" + boton [+ Nueva]
- Lista de conversaciones ordenada: ancladas primero, luego por fecha
- Cada item: titulo (o preview truncado), fecha, badge mensajes
- Item activo destacado con fondo chip
- Menu contextual (click derecho o boton ...): renombrar, anclar, archivar, eliminar
- Separador entre ancladas y regulares
- Estilo glass con CSS variables (--shell-*)

Props:
```typescript
interface PanelConversacionesWebProps {
  conversaciones: ConversacionResumen[];
  conversacionActiva: string | null;
  onSeleccionar: (id: string) => void;
  onNueva: () => void;
}
```

- [ ] **Step 1: Crear el componente completo**

Usar las mismas CSS variables del sidebar para mantener consistencia visual. El panel tiene borde derecho (`border-r`), fondo `--shell-sidebar`, y scroll interno para la lista.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/componentes/chat/panel-conversaciones-web.tsx
git commit -m "feat(web): crear PanelConversacionesWeb — lista lateral tipo ChatGPT"
```

---

## Task 4: Crear area-chat-web.tsx

**Files:**
- Create: `frontend/src/componentes/chat/area-chat-web.tsx`

Area principal de chat que ocupa el flex-1 restante. Incluye:
- Header con titulo de la conversacion activa
- ScrollView de mensajes con burbujas (usuario derecha violeta, assistant izquierda superficie)
- Indicador de "escribiendo..." con dots animados
- Input de texto con boton enviar al fondo
- Estado vacio con sugerencias cuando no hay mensajes
- Indicador de limite (plan gratis)
- Rendering de markdown inline (bold, italic)
- Auto-scroll al ultimo mensaje

Props:
```typescript
interface AreaChatWebProps {
  conversacionId: string | null;
  tituloConversacion: string | null;
}
```

El componente usa internamente `usarHistorialChat`, `usarEnviarMensaje`, etc.

- [ ] **Step 1: Crear el componente completo**

Reutilizar la logica de renderizado de mensajes del `chat-widget.tsx` actual (burbujas, markdown inline, typing dots), pero en layout full-width, no en panel flotante.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/componentes/chat/area-chat-web.tsx
git commit -m "feat(web): crear AreaChatWeb — zona principal de conversacion"
```

---

## Task 5: Crear pagina y layout de chat

**Files:**
- Create: `frontend/src/app/(app)/chat/page.tsx`
- Create: `frontend/src/app/(app)/chat/layout.tsx`

La pagina de chat combina PanelConversacionesWeb + AreaChatWeb en un layout de dos columnas.

### Layout (`layout.tsx`)
El layout de chat agrega el panel de conversaciones como columna izquierda. El children (page.tsx) renderiza el area de chat.

```tsx
// Layout: flex row con panel izquierdo + children
export default function LayoutChat({ children }) {
  return (
    <div className="flex h-full">
      <PanelConversacionesWeb ... />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
```

### Page (`page.tsx`)
La pagina renderiza el `AreaChatWeb` con la conversacion activa. Gestiona el estado de cual conversacion esta seleccionada, coordinando entre panel y area.

- [ ] **Step 1: Crear layout.tsx y page.tsx**

El estado de `conversacionActiva` vive en la page (via searchParams o estado local). Cuando el usuario selecciona una conversacion en el panel, se actualiza el estado y el AreaChatWeb carga los mensajes.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/(app)/chat/
git commit -m "feat(web): crear pagina /chat con layout de dos paneles"
```

---

## Task 6: Agregar Chat al sidebar como primer item

**Files:**
- Modify: `frontend/src/componentes/layouts/sidebar-navegacion.tsx`

Cambios:
1. Agregar "Oraculo ASTRA" como primer item de `enlacesActivos`, con ruta `/chat` e icono `chatCirculo`
2. Darle tratamiento visual especial: cuando activo, fondo con gradiente violeta en vez del chip neutro
3. Separador visual despues del item de chat (antes de "Mapa Estrategico")

- [ ] **Step 1: Agregar enlace de chat al inicio del array**

```typescript
const enlacesActivos: EnlaceNav[] = [
  { etiqueta: "Oráculo ASTRA", ruta: "/chat", icono: "chatCirculo", destacado: true },
  { etiqueta: "Mapa Estratégico", ruta: "/dashboard", icono: "dashboard" },
  // ... resto igual
];
```

Agregar campo opcional `destacado?: boolean` al tipo `EnlaceNav` y usarlo para aplicar estilo violeta especial (gradiente acento como fondo cuando activo, icono siempre en color acento).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/componentes/layouts/sidebar-navegacion.tsx
git commit -m "feat(web): agregar Oraculo ASTRA como primer item del sidebar"
```

---

## Task 7: Eliminar ChatWidget flotante

**Files:**
- Modify: `frontend/src/componentes/layouts/layout-app.tsx` — quitar import y render de ChatWidget
- Modify: `frontend/src/componentes/layouts/layout-mobile.tsx` — quitar import y render de ChatWidget
- Delete: `frontend/src/componentes/chat/chat-widget.tsx`

- [ ] **Step 1: Quitar ChatWidget de layout-app.tsx**

Eliminar la linea que renderiza `<ChatWidget />` y su import.

- [ ] **Step 2: Quitar ChatWidget de layout-mobile.tsx**

Eliminar la linea que renderiza `<ChatWidget />` y su import.

- [ ] **Step 3: Eliminar chat-widget.tsx**

Verificar que no hay otros imports y eliminar el archivo.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(web): eliminar ChatWidget flotante — migrado a seccion /chat"
```

---

## Task 8: Verificacion final

- [ ] **Step 1: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 2: Verificacion visual**

- [ ] Click "Agente AI Guia" en sidebar → navega a /chat
- [ ] Panel izquierdo muestra lista de conversaciones
- [ ] Click en conversacion → carga mensajes en area principal
- [ ] Click [+ Nueva] → crea conversacion, limpia area
- [ ] Enviar mensaje → burbuja aparece + typing dots + respuesta
- [ ] Menu contextual en conversacion → renombrar, anclar, archivar, eliminar
- [ ] Conversaciones ancladas aparecen primero
- [ ] Limite de mensajes gratis funciona
- [ ] Otras paginas (dashboard, astral, etc.) ya NO muestran el widget flotante
- [ ] Sidebar colapsado muestra icono de chat con tooltip

- [ ] **Step 3: Commit final**

```bash
git commit -m "feat(web): chat ASTRA como seccion principal con panel de conversaciones"
```

---

## Resumen de cambios

| Antes | Despues |
|-------|---------|
| FAB flotante bottom-right | Item "Oraculo ASTRA" primero en sidebar |
| Panel 400px superpuesto | Pagina /chat con layout dos columnas |
| Sin lista de conversaciones | Panel lateral 280px con conversaciones tipo ChatGPT |
| 3 hooks (historial, enviar, nueva) | 8 hooks (+conversaciones, cambiar, renombrar, anclar, archivar, eliminar) |
| Estado local en widget | Estado en pagina, coordinado entre panel y area |
| chat-widget.tsx (564 lineas) | 4 archivos enfocados (~600 lineas total) |

### Lo que NO cambia
- Backend endpoints (ya soportan todo)
- Mobile chat (sigue como esta)
- Tipos base de mensajes
- Logica de rate limiting
- Reproductor cosmico / mini reproductor
