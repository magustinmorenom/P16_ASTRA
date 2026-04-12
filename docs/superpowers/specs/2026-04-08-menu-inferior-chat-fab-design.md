# Spec: Botón Chat FAB en Menú Inferior Mobile Web

**Fecha:** 2026-04-08  
**Estado:** Aprobado

---

## Objetivo

Agregar un botón de chat (FAB) en el centro del menú inferior mobile web, fiel al diseño de la app nativa React Native. El botón navega a `/chat`.

---

## Contexto

La app nativa (`mobile/src/app/(tabs)/_layout.tsx`) implementa un FAB circular violeta centrado sobre la tab bar con:
- 4 tabs flanqueando el FAB: Inicio, Astral, Explorar, Podcast
- Spacer central que reserva la columna para el FAB
- FAB con aura pulsante y estado activo diferenciado

La web mobile (`frontend/src/componentes/layouts/barra-navegacion-inferior.tsx`) actualmente tiene 5 tabs planos (Inicio, Astral, Descubrir, Podcasts, Perfil) sin botón de chat.

---

## Diseño

### Tabs

| Posición | Tab | Ruta | Icono |
|----------|-----|------|-------|
| 1 | Inicio | `/dashboard` | `casa` |
| 2 | Astral | `/carta-natal` | `estrella` |
| 3 | *(spacer FAB)* | — | — |
| 4 | Explorar | `/descubrir` | `brujula` |
| 5 | Podcast | `/podcast` | `microfono` |

- **Perfil** se accede únicamente desde el avatar del header (ya implementado así).
- El tab "Explorar" hereda las `rutasActivas` del actual "Descubrir": `/descubrir`, `/diseno-humano`, `/numerologia`, `/calendario-cosmico`, `/retorno-solar`, `/transitos`, `/match-pareja`.

### FAB Chat

| Propiedad | Valor |
|-----------|-------|
| Aura (outer ring) | 68×68px, `rgba(124,77,255,0.16)`, `border-radius: 50%`, clase `animate-chat-soft-pulse` (ya en `globals.css`) |
| Botón | 52×52px, `background: #7C4DFF`, `border-radius: 50%`, `box-shadow: 0 4px 18px rgba(124,77,255,0.55)` |
| Icono | `<Icono nombre="chatCirculo" tamaño={26} peso="fill" />` (ya mapeado en `icono.tsx`) |
| Estado activo (`/chat`) | botón `#9333EA`, aura `rgba(147,51,234,0.22)` + glow más intenso |
| Acción | `router.push('/chat')` / `<Link href="/chat">` |
| Posición | `position: absolute`, `bottom: 18px`, `left: 50%`, `transform: translateX(-50%)` |
| z-index | 20 (sobre el tab bar) |

### Tab bar

| Propiedad | Valor anterior | Valor nuevo |
|-----------|---------------|-------------|
| Altura | 56px | 72px |
| Padding-bottom | 0 | 10px |

La altura sube a 72px para que el FAB tenga espacio vertical sobre la barra sin recortar la aura.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `frontend/src/componentes/layouts/barra-navegacion-inferior.tsx` | Único archivo a tocar: reorganizar tabs a 4, agregar spacer central, agregar FAB con Link a /chat, ajustar altura de la barra |

No se requieren cambios en `layout-mobile.tsx` ni en ninguna otra parte.

---

## Comportamiento

- El FAB es un `<Link href="/chat">` con estilo absoluto posicionado sobre el spacer central.
- Cuando `pathname.startsWith('/chat')`, el FAB aplica el estado activo (fondo #9333EA + aura más intensa).
- La animación de la aura usa la clase `animate-chat-soft-pulse` ya definida en `globals.css` (`chat-soft-pulse 2s ease-in-out infinite`).
- El FAB no tiene etiqueta de texto, solo el icono.
- El spacer central (`flex: 1`) no es clickeable, el único elemento interactivo del centro es el FAB.

---

## Lo que NO cambia

- `layout-mobile.tsx` — sin cambios
- La ruta `/chat` — ya existe y funciona
- El avatar del header para acceder a Perfil — ya existe
- El mini reproductor — sin cambios
- Todos los demás componentes del layout

---

## Criterio de éxito

1. El menú inferior mobile muestra 4 tabs + FAB chat centrado.
2. El FAB navega a `/chat` al tocarlo.
3. El FAB muestra estado activo cuando la ruta actual es `/chat`.
4. La aura pulsa sutilmente (animación CSS).
5. `npx tsc --noEmit` sin errores.
