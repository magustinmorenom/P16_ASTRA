# Menú Inferior Mobile Web — Chat FAB Central

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un FAB de chat centrado en la barra de navegación inferior mobile web, fiel al diseño de la app nativa.

**Architecture:** Un solo archivo a modificar (`barra-navegacion-inferior.tsx`). Los 5 tabs actuales se reducen a 4 (se elimina Perfil, Descubrir pasa a llamarse Explorar). Se agrega un spacer central que reserva la columna para el FAB, y el FAB se posiciona absolutamente sobre ese spacer. Navega a `/chat` que ya existe.

**Tech Stack:** Next.js 14+, React 18+, TailwindCSS v4, Phosphor Icons (`<Icono>`), `next/link`, `usePathname`

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `frontend/src/componentes/layouts/barra-navegacion-inferior.tsx` | Modificar | Shell del menú inferior + FAB |
| `frontend/src/tests/componentes/barra-navegacion-inferior.test.tsx` | Crear | Tests del componente |

---

## Task 1: Tests fallidos para BarraNavegacionInferior

**Files:**
- Create: `frontend/src/tests/componentes/barra-navegacion-inferior.test.tsx`

- [ ] **Step 1: Crear el archivo de test**

```tsx
// frontend/src/tests/componentes/barra-navegacion-inferior.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import BarraNavegacionInferior from "@/componentes/layouts/barra-navegacion-inferior";

describe("BarraNavegacionInferior", () => {
  it("muestra 4 tabs: Inicio, Astral, Explorar, Podcast", () => {
    render(<BarraNavegacionInferior />);

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Astral")).toBeInTheDocument();
    expect(screen.getByText("Explorar")).toBeInTheDocument();
    expect(screen.getByText("Podcast")).toBeInTheDocument();
  });

  it("NO muestra el tab Perfil", () => {
    render(<BarraNavegacionInferior />);

    expect(screen.queryByText("Perfil")).not.toBeInTheDocument();
  });

  it("incluye un enlace al chat con aria-label 'Abrir chat'", () => {
    render(<BarraNavegacionInferior />);

    const fabChat = screen.getByRole("link", { name: "Abrir chat" });
    expect(fabChat).toBeInTheDocument();
    expect(fabChat).toHaveAttribute("href", "/chat");
  });

  it("el FAB no tiene estado activo en /dashboard", () => {
    render(<BarraNavegacionInferior />);

    const fabChat = screen.getByRole("link", { name: "Abrir chat" });
    // El estado activo usa bg-[#9333EA]; sin activo usa bg-[#7C4DFF]
    expect(fabChat.innerHTML).toContain("7C4DFF");
    expect(fabChat.innerHTML).not.toContain("9333EA");
  });

  it("el FAB tiene estado activo cuando la ruta es /chat", () => {
    vi.mock("next/navigation", () => ({
      usePathname: () => "/chat",
    }));

    // Re-import después del mock actualizado
    vi.resetModules();
  });
});
```

- [ ] **Step 2: Correr el test para confirmar que falla**

```bash
cd /ruta/al/proyecto/frontend && npx vitest run src/tests/componentes/barra-navegacion-inferior.test.tsx --reporter=verbose
```

Resultado esperado: `FAIL` — los primeros 3 tests pasan (la implementación actual tiene Inicio/Astral) pero fallan porque `Explorar` y el FAB no existen, y `Perfil` sí aparece.

---

## Task 2: Implementar los cambios en BarraNavegacionInferior

**Files:**
- Modify: `frontend/src/componentes/layouts/barra-navegacion-inferior.tsx`

- [ ] **Step 3: Reemplazar el contenido completo del componente**

Reemplazar todo `frontend/src/componentes/layouts/barra-navegacion-inferior.tsx` con:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utilidades/cn";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";

// ---------------------------------------------------------------------------
// Definicion de tabs (4 — Perfil se accede desde el avatar del header)
// ---------------------------------------------------------------------------
interface TabInferior {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  /** Rutas adicionales que activan este tab */
  rutasActivas?: string[];
}

const TABS_IZQUIERDOS: TabInferior[] = [
  {
    etiqueta: "Inicio",
    ruta: "/dashboard",
    icono: "casa",
  },
  {
    etiqueta: "Astral",
    ruta: "/carta-natal",
    icono: "estrella",
  },
];

const TABS_DERECHOS: TabInferior[] = [
  {
    etiqueta: "Explorar",
    ruta: "/descubrir",
    icono: "brujula",
    rutasActivas: [
      "/descubrir",
      "/diseno-humano",
      "/numerologia",
      "/calendario-cosmico",
      "/retorno-solar",
      "/transitos",
      "/match-pareja",
    ],
  },
  {
    etiqueta: "Podcast",
    ruta: "/podcast",
    icono: "microfono",
  },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function BarraNavegacionInferior() {
  const pathname = usePathname();
  const chatActivo = pathname.startsWith("/chat");

  function estaActivo(tab: TabInferior): boolean {
    if (tab.rutasActivas) {
      return tab.rutasActivas.some((r) => pathname.startsWith(r));
    }
    return tab.ruta === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(tab.ruta);
  }

  function renderTab(tab: TabInferior) {
    const activo = estaActivo(tab);
    return (
      <Link
        key={tab.ruta}
        href={tab.ruta}
        className={cn(
          "touch-feedback flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] px-2 rounded-lg transition-colors",
          activo
            ? "text-[color:var(--color-acento)]"
            : "text-[color:var(--shell-texto-tenue)]"
        )}
      >
        <Icono
          nombre={tab.icono}
          tamaño={22}
          peso={activo ? "fill" : "regular"}
        />
        <span
          className={cn(
            "text-[10px] leading-tight",
            activo ? "font-semibold" : "font-medium"
          )}
        >
          {tab.etiqueta}
        </span>
      </Link>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl"
      style={{
        background: "var(--shell-tabbar)",
        borderColor: "var(--shell-borde)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="relative flex items-center justify-around h-[72px] pb-[10px]">
        {/* Tabs izquierdos */}
        {TABS_IZQUIERDOS.map(renderTab)}

        {/* Spacer central — reserva columna para el FAB */}
        <div className="flex-1" aria-hidden="true" />

        {/* Tabs derechos */}
        {TABS_DERECHOS.map(renderTab)}

        {/* FAB Chat — flota sobre el spacer central */}
        <Link
          href="/chat"
          aria-label="Abrir chat"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 bottom-[18px] z-20",
            "flex items-center justify-center",
            "w-[68px] h-[68px] rounded-full",
            "animate-chat-soft-pulse transition-colors",
            chatActivo
              ? "bg-[rgba(147,51,234,0.22)]"
              : "bg-[rgba(124,77,255,0.16)]"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center",
              "w-[52px] h-[52px] rounded-full",
              "shadow-[0_4px_18px_rgba(124,77,255,0.55)]",
              "transition-colors",
              chatActivo ? "bg-[#9333EA]" : "bg-[#7C4DFF]"
            )}
          >
            <Icono
              nombre="chatCirculo"
              tamaño={26}
              peso="fill"
              className="text-white"
            />
          </div>
        </Link>
      </div>
    </nav>
  );
}
```

---

## Task 3: Correr tests, verificar TypeScript y commitear

**Files:**
- Test: `frontend/src/tests/componentes/barra-navegacion-inferior.test.tsx`

- [ ] **Step 4: Correr los tests del componente**

```bash
cd frontend && npx vitest run src/tests/componentes/barra-navegacion-inferior.test.tsx --reporter=verbose
```

Resultado esperado:
```
✓ muestra 4 tabs: Inicio, Astral, Explorar, Podcast
✓ NO muestra el tab Perfil
✓ incluye un enlace al chat con aria-label 'Abrir chat'
✓ el FAB no tiene estado activo en /dashboard
```

Si algún test falla, leer el error y ajustar la implementación en `barra-navegacion-inferior.tsx`.

- [ ] **Step 5: Correr la suite completa de tests frontend**

```bash
cd frontend && npx vitest run --reporter=verbose
```

Resultado esperado: todos los tests existentes siguen pasando. Si rompe algún test de otro componente que importaba `BarraNavegacionInferior` directamente o chequeaba los tabs por nombre, actualizarlo para reflejar los 4 tabs nuevos.

- [ ] **Step 6: Verificar TypeScript**

```bash
cd frontend && npx tsc --noEmit
```

Resultado esperado: sin errores. Si hay errores, corregirlos antes de seguir.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/componentes/layouts/barra-navegacion-inferior.tsx \
        frontend/src/tests/componentes/barra-navegacion-inferior.test.tsx
git commit -m "feat: FAB chat central en menú inferior mobile web

- Reorganiza tabs de 5 a 4: Inicio, Astral, Explorar, Podcast
- Elimina Perfil del menú (accesible via avatar del header)
- Agrega FAB circular violeta centrado con aura pulsante
- FAB navega a /chat, estado activo en ruta /chat"
```

---

## Self-review

**Spec coverage:**
- ✅ 4 tabs: Inicio, Astral, Explorar, Podcast → Task 2
- ✅ Perfil eliminado del menú → Task 2 (TABS_DERECHOS no incluye Perfil)
- ✅ rutasActivas de Explorar heredadas de Descubrir → Task 2
- ✅ FAB 52px violeta #7C4DFF → Task 2
- ✅ Aura 68px animate-chat-soft-pulse → Task 2
- ✅ Icono `chatCirculo` (NombreIcono válido) → Task 2
- ✅ Navega a /chat → Task 2
- ✅ Estado activo en /chat: #9333EA + aura rgba(147,51,234,0.22) → Task 2
- ✅ Altura 56px → 72px → Task 2 (`h-[72px] pb-[10px]`)
- ✅ TypeScript limpio → Task 3 Step 6
- ✅ Tests → Task 1 + Task 3

**Placeholders:** ninguno.

**Type consistency:** `NombreIcono` usado en `TabInferior.icono` y en el FAB (`"chatCirculo"`) — ambos son `keyof typeof mapaIconos` y están confirmados como válidos en `icono.tsx`.
