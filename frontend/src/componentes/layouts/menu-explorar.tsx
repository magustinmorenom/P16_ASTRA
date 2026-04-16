"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utilidades/cn";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { useStoreUI } from "@/lib/stores/store-ui";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarMiPerfil } from "@/lib/hooks";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { PreferenciaTema } from "@/lib/stores/store-tema";
import { esPlanPago, obtenerEtiquetaPlan } from "@/lib/utilidades/planes";

// ---------------------------------------------------------------------------
// Enlaces de navegacion (mismos que sidebar desktop)
// ---------------------------------------------------------------------------
interface EnlaceNav {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  destacado?: boolean;
}

const enlacesNavegacion: EnlaceNav[] = [
  { etiqueta: "ASTRA Chat", ruta: "/chat", icono: "chatCirculo", destacado: true },
  { etiqueta: "Mapa Estratégico", ruta: "/dashboard", icono: "dashboard" },
  { etiqueta: "Recursos Propios", ruta: "/perfil-espiritual", icono: "usuarioFoco" },
  { etiqueta: "Podcasts Guías", ruta: "/podcast", icono: "microfono" },
  { etiqueta: "Carta Astral", ruta: "/carta-natal", icono: "planeta" },
  { etiqueta: "Diseño Humano", ruta: "/diseno-humano", icono: "hexagono" },
  { etiqueta: "Numerología", ruta: "/numerologia", icono: "numeral" },
  { etiqueta: "Calendario Cósmico", ruta: "/calendario-cosmico", icono: "calendario" },
];

const enlacesProximamente: EnlaceNav[] = [
  { etiqueta: "Revolución Solar", ruta: "/retorno-solar", icono: "retornoSolar" },
  { etiqueta: "Match de Pareja", ruta: "/match-pareja", icono: "corazon" },
];

// ---------------------------------------------------------------------------
// Selector de tema
// ---------------------------------------------------------------------------
const OPCIONES_TEMA: { valor: PreferenciaTema; icono: NombreIcono; titulo: string }[] = [
  { valor: "claro", icono: "sol", titulo: "Claro" },
  { valor: "oscuro", icono: "luna", titulo: "Oscuro" },
  { valor: "automatico", icono: "circuloMitad", titulo: "Auto" },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function MenuExplorar() {
  const pathname = usePathname();
  const router = useRouter();
  const { menuExplorarAbierto, cerrarMenuExplorar } = useStoreUI();
  const { usuario, cerrarSesion } = useStoreAuth();
  const { data: perfil } = usarMiPerfil();
  const { preferencia, setPreferencia } = usarTema();
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al navegar
  useEffect(() => {
    cerrarMenuExplorar();
  }, [pathname, cerrarMenuExplorar]);

  // Cerrar con Escape
  useEffect(() => {
    if (!menuExplorarAbierto) return;
    const manejar = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarMenuExplorar();
    };
    document.addEventListener("keydown", manejar);
    return () => document.removeEventListener("keydown", manejar);
  }, [menuExplorarAbierto, cerrarMenuExplorar]);

  // Bloquear scroll del body cuando esta abierto
  useEffect(() => {
    if (menuExplorarAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuExplorarAbierto]);

  const nombreRaw = perfil?.nombre ?? usuario?.nombre ?? "Usuario";
  const nombreUsuario = nombreRaw
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const etiquetaPlan = obtenerEtiquetaPlan(usuario?.plan_slug, usuario?.plan_nombre);
  const esPremium = esPlanPago(usuario?.plan_slug);
  const inicialesUsuario = (usuario?.nombre ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function manejarCerrarSesion() {
    cerrarSesion();
    cerrarMenuExplorar();
    router.push("/login");
  }

  if (!menuExplorarAbierto) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] lg:hidden animate-[fadeIn_200ms_ease-out]"
        style={{ background: "var(--shell-overlay-suave)" }}
        onClick={cerrarMenuExplorar}
      />

      {/* Panel deslizante desde la derecha */}
      <aside
        ref={panelRef}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[61] w-[300px] overflow-y-auto lg:hidden",
          "animate-[slideInRight_250ms_ease-out]"
        )}
        style={{
          background: "var(--shell-sidebar)",
          boxShadow: "var(--shell-sombra-fuerte)",
        }}
      >
        {/* Header usuario */}
        <div
          className="border-b px-4 py-4"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-bold text-white"
              style={{ borderColor: "var(--shell-borde-fuerte)" }}
            >
              {inicialesUsuario}
              {esPremium && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-shell-badge-acento text-[8px] text-shell-badge-acento-texto">
                  <Icono nombre="corona" tamaño={10} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[color:var(--shell-texto)]">
                {nombreUsuario}
              </p>
              {usuario?.email && (
                <p className="truncate text-[11px] text-[color:var(--shell-texto-secundario)]">
                  {usuario.email}
                </p>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                esPremium
                  ? "border-shell-badge-violeta-borde bg-shell-badge-violeta-fondo text-shell-badge-violeta-texto"
                  : "border-shell-borde bg-shell-superficie-suave text-shell-texto-secundario"
              )}
            >
              {esPremium ? etiquetaPlan : "Free"}
            </span>
          </div>

          {/* Selector de tema */}
          <div className="mt-3 flex items-center gap-1">
            <div
              className="flex items-center gap-0.5 rounded-lg border p-0.5"
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie-suave)",
              }}
            >
              {OPCIONES_TEMA.map((opcion) => {
                const activo = preferencia === opcion.valor;
                return (
                  <button
                    key={opcion.valor}
                    onClick={() => setPreferencia(opcion.valor)}
                    title={opcion.titulo}
                    className={cn(
                      "flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-all duration-200",
                      activo
                        ? "text-[color:var(--color-acento)]"
                        : "text-[color:var(--shell-texto-tenue)] hover:text-[color:var(--shell-texto-secundario)]"
                    )}
                    style={{
                      background: activo ? "var(--shell-superficie-fuerte)" : undefined,
                      boxShadow: activo ? "0 1px 3px rgba(0,0,0,0.08)" : undefined,
                    }}
                  >
                    <Icono
                      nombre={opcion.icono}
                      tamaño={13}
                      peso={activo ? "fill" : "regular"}
                    />
                    {opcion.titulo}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navegacion principal */}
        <nav className="px-3 pt-3 pb-2">
          <ul className="flex flex-col gap-0.5">
            {enlacesNavegacion.map((enlace) => {
              const estaActivo =
                enlace.ruta === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(enlace.ruta);

              return (
                <li key={enlace.ruta}>
                  <Link
                    href={enlace.ruta}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 border",
                      estaActivo
                        ? enlace.destacado
                          ? "border text-white shadow-[0_4px_16px_rgba(124,77,255,0.25)]"
                          : "border text-[color:var(--shell-texto)]"
                        : enlace.destacado
                          ? "border-transparent text-[color:var(--color-acento)]"
                          : "border-transparent text-[color:var(--shell-texto-tenue)]"
                    )}
                    style={{
                      borderColor: estaActivo
                        ? enlace.destacado ? "rgba(124,77,255,0.4)" : "var(--shell-borde-fuerte)"
                        : undefined,
                      background: estaActivo
                        ? enlace.destacado ? "linear-gradient(135deg, #7C4DFF, #4A2D8C)" : "var(--shell-chip)"
                        : undefined,
                    }}
                  >
                    <Icono
                      nombre={enlace.icono}
                      tamaño={20}
                      peso={estaActivo || enlace.destacado ? "fill" : "regular"}
                      className={cn(
                        "transition-colors duration-200",
                        estaActivo
                          ? enlace.destacado ? "text-white" : "text-[color:var(--color-acento)]"
                          : enlace.destacado ? "text-[color:var(--color-acento)]" : "text-[color:var(--shell-texto-tenue)]"
                      )}
                    />
                    <span>{enlace.etiqueta}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Sección Próximamente */}
          <div
            className="mt-3 rounded-xl border px-2 py-3"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie-suave)",
            }}
          >
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
              Próximamente
            </p>
            <ul className="flex flex-col gap-0.5">
              {enlacesProximamente.map((enlace) => (
                <li key={enlace.ruta}>
                  <Link
                    href={enlace.ruta}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[13px] font-medium text-[color:var(--shell-texto-tenue)] transition-all duration-200"
                  >
                    <Icono
                      nombre={enlace.icono}
                      tamaño={18}
                      peso="regular"
                      className="shrink-0 text-[color:var(--shell-texto-tenue)]"
                    />
                    <span className="flex-1 text-left">{enlace.etiqueta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Separador */}
        <div
          className="mx-4 my-2 h-px"
          style={{ background: "var(--shell-borde)" }}
        />

        {/* Opciones de cuenta */}
        <div className="px-3 pb-4">
          <div className="flex flex-col gap-0.5">
            <Link
              href="/perfil"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[color:var(--shell-texto-secundario)] transition-colors hover:bg-[var(--shell-chip-hover)]"
            >
              <Icono nombre="usuario" tamaño={18} />
              Mi perfil
            </Link>

            <Link
              href="/suscripcion"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[color:var(--shell-texto-secundario)] transition-colors hover:bg-[var(--shell-chip-hover)]"
            >
              <Icono nombre="corona" tamaño={18} />
              Suscripción
            </Link>

            {usuario?.rol === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-peligro transition-colors hover:bg-peligro-suave"
              >
                <Icono nombre="escudo" tamaño={18} />
                Backoffice
              </Link>
            )}

            <button
              onClick={manejarCerrarSesion}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-peligro-texto transition-colors hover:bg-peligro-suave hover:text-peligro-texto-hover"
            >
              <Icono nombre="salir" tamaño={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
