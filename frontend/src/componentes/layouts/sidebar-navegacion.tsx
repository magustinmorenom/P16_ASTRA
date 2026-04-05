"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utilidades/cn";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { PreferenciaTema } from "@/lib/stores/store-tema";
import { usarMiPerfil, usarMisCalculos } from "@/lib/hooks";
import { generarMarkdownPerfil } from "@/lib/utilidades/generar-markdown-perfil";

// ---------------------------------------------------------------------------
// Enlaces de navegacion
// ---------------------------------------------------------------------------
interface EnlaceNav {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  proximamente?: boolean;
}

interface EnlaceProximo {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
}

const enlacesActivos: EnlaceNav[] = [
  { etiqueta: "Mapa Estratégico", ruta: "/dashboard", icono: "dashboard" },
  { etiqueta: "Recursos Propios", ruta: "/perfil-espiritual", icono: "usuarioFoco" },
  { etiqueta: "Podcasts Guías", ruta: "/podcast", icono: "microfono" },
  { etiqueta: "Carta Astral", ruta: "/carta-natal", icono: "planeta" },
  { etiqueta: "Diseño Humano", ruta: "/diseno-humano", icono: "hexagono" },
  { etiqueta: "Numerología", ruta: "/numerologia", icono: "numeral" },
  { etiqueta: "Calendario Cósmico", ruta: "/calendario-cosmico", icono: "calendario" },
];

const enlacesProximamente: EnlaceProximo[] = [
  {
    etiqueta: "Revolución Solar",
    ruta: "/retorno-solar",
    icono: "retornoSolar",
  },
  {
    etiqueta: "Match de Pareja",
    ruta: "/match-pareja",
    icono: "corazon",
  },
];

// ---------------------------------------------------------------------------
// Ribbon de controles: tema + colapsar
// ---------------------------------------------------------------------------
const OPCIONES_TEMA: { valor: PreferenciaTema; icono: NombreIcono; titulo: string }[] = [
  { valor: "claro", icono: "sol", titulo: "Claro" },
  { valor: "oscuro", icono: "luna", titulo: "Oscuro" },
  { valor: "automatico", icono: "circuloMitad", titulo: "Automático" },
];

function RibbonControles({
  preferencia,
  setPreferencia,
  colapsado,
  onToggleColapsar,
}: {
  preferencia: PreferenciaTema;
  setPreferencia: (p: PreferenciaTema) => void;
  colapsado: boolean;
  onToggleColapsar: (() => void) | undefined;
}) {
  return (
    <div
      className={cn(
        "flex items-center border-b transition-all duration-200",
        colapsado
          ? "justify-center px-1.5 py-2.5"
          : "justify-between px-3 py-2"
      )}
      style={{ borderColor: "var(--shell-borde)" }}
    >
      {/* Selector de tema (solo expandido) */}
      {!colapsado && (
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
                  "flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200",
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
                  tamaño={14}
                  peso={activo ? "fill" : "regular"}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Botón colapsar/expandir (solo desktop) */}
      {onToggleColapsar && (
        <button
          onClick={onToggleColapsar}
          title={colapsado ? "Expandir panel" : "Colapsar panel"}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--shell-texto-tenue)] transition-all duration-200 hover:text-[color:var(--shell-texto-secundario)]"
          style={{ background: "var(--shell-superficie-suave)" }}
        >
          <Icono
            nombre={colapsado ? "caretDerecha" : "caretIzquierda"}
            tamaño={14}
            peso="regular"
          />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function SidebarNavegacion() {
  const pathname = usePathname();
  const { sidebarAbierto, cerrarSidebar, sidebarColapsado, toggleSidebarColapsado } = useStoreUI();
  const { preferencia, setPreferencia } = usarTema();

  const { data: perfil } = usarMiPerfil();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();

  // --- Estado del modal de descarga ---
  const [modalDescarga, setModalDescarga] = useState(false);
  const [descargando, setDescargando] = useState<"pdf" | "md" | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const tieneCalculos = !!(calculos?.natal || calculos?.diseno_humano || calculos?.numerologia);

  // Cerrar modal con click fuera
  useEffect(() => {
    if (!modalDescarga) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalDescarga(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [modalDescarga]);

  const descargarPDF = useCallback(async () => {
    setDescargando("pdf");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token_acceso") : null;
      const res = await fetch("/api/v1/profile/me/pdf", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al generar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `perfil_cosmico_${perfil?.nombre?.replace(/\s+/g, "_") ?? "usuario"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setModalDescarga(false);
    } catch {
      // silenciar — el usuario verá que no se descargó
    } finally {
      setDescargando(null);
    }
  }, [perfil]);

  const descargarMarkdown = useCallback(() => {
    setDescargando("md");
    try {
      const md = generarMarkdownPerfil(perfil, calculos);
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `perfil_cosmico_${perfil?.nombre?.replace(/\s+/g, "_") ?? "usuario"}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setModalDescarga(false);
    } finally {
      setDescargando(null);
    }
  }, [perfil, calculos]);

  const colapsado = sidebarColapsado;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden flex-shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 ease-in-out lg:flex",
          colapsado ? "w-[68px]" : "w-[264px]"
        )}
        style={{
          borderColor: "var(--shell-borde)",
          background: "var(--shell-sidebar)",
        }}
      >
        {/* Ribbon: tema + colapsar */}
        <RibbonControles
          preferencia={preferencia}
          setPreferencia={setPreferencia}
          colapsado={colapsado}
          onToggleColapsar={toggleSidebarColapsado}
        />

        {/* Navegacion */}
        <nav className={cn("pb-2 pt-5", colapsado ? "px-2" : "px-3")}>
          <ul className="flex flex-col gap-1">
            {enlacesActivos.map((enlace) => {
              const estaActivo =
                enlace.ruta === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(enlace.ruta);

              return (
                <li key={enlace.ruta} className="group">
                  <Link
                    href={enlace.ruta}
                    title={colapsado ? enlace.etiqueta : undefined}
                    className={cn(
                      "flex items-center rounded-xl text-[13px] font-medium transition-all duration-200",
                      colapsado
                        ? "justify-center px-0 py-3"
                        : "gap-3 px-3 py-3",
                      estaActivo
                        ? "border text-[color:var(--shell-texto)] shadow-[var(--shell-sombra-suave)]"
                        : "border border-transparent text-[color:var(--shell-texto-tenue)]"
                    )}
                    style={{
                      borderColor: estaActivo ? "var(--shell-borde-fuerte)" : undefined,
                      background: estaActivo ? "var(--shell-chip)" : undefined,
                    }}
                  >
                    <Icono
                      nombre={enlace.icono}
                      tamaño={20}
                      peso={estaActivo ? "fill" : "regular"}
                      className={cn(
                        "transition-colors duration-200",
                        estaActivo ? "text-[color:var(--color-acento)]" : "text-[color:var(--shell-texto-tenue)]"
                      )}
                    />
                    {!colapsado && (
                      <span className="min-w-0 leading-none">
                        {enlace.etiqueta}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Sección Próximamente */}
          <div
            className={cn(
              "mt-3 rounded-xl border transition-all duration-200",
              colapsado ? "px-1 py-2" : "px-2 py-3"
            )}
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie-suave)",
            }}
          >
            {!colapsado && (
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
                Próximamente
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {enlacesProximamente.map((enlace) => (
                <li key={enlace.ruta} className="group">
                  <Link
                    href={enlace.ruta}
                    title={colapsado ? `${enlace.etiqueta} · Próximamente` : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-[13px] font-medium transition-all duration-200",
                      colapsado
                        ? "justify-center px-0 py-2.5"
                        : "gap-3 px-2 py-2.5",
                      "text-[color:var(--shell-texto-tenue)]"
                    )}
                  >
                    <Icono
                      nombre={enlace.icono}
                      tamaño={18}
                      peso="regular"
                      className="shrink-0 transition-colors duration-200 text-[color:var(--shell-texto-tenue)]"
                    />
                    {!colapsado && (
                      <span className="min-w-0 flex-1 text-left leading-none">
                        {enlace.etiqueta}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Separador */}
        <div
          className={cn("my-3 h-px", colapsado ? "mx-2" : "mx-4")}
          style={{ background: "var(--shell-borde)" }}
        />

        {/* Boton Descargar Perfil */}
        {!colapsado ? (
          <div className="px-3 pb-2">
            <button
              onClick={() => setModalDescarga(true)}
              disabled={!tieneCalculos || cargandoCalculos}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                tieneCalculos && !cargandoCalculos
                  ? "border text-[color:var(--shell-texto-secundario)]"
                  : "cursor-not-allowed border text-[color:var(--shell-texto-tenue)]"
              )}
              style={{
                borderColor: "var(--shell-borde)",
                background: tieneCalculos && !cargandoCalculos ? "var(--shell-superficie)" : "transparent",
              }}
            >
              <Icono nombre="descarga" tamaño={18} />
              Descargar Perfil
            </button>
          </div>
        ) : (
          <div className="px-1.5 pb-2">
            <button
              onClick={() => setModalDescarga(true)}
              disabled={!tieneCalculos || cargandoCalculos}
              title="Descargar Perfil"
              className={cn(
                "flex w-full items-center justify-center rounded-xl py-2.5 transition-all duration-200",
                tieneCalculos && !cargandoCalculos
                  ? "text-shell-texto-tenue hover:bg-shell-chip-hover hover:text-shell-texto-secundario"
                  : "text-shell-texto-tenue/40 cursor-not-allowed"
              )}
            >
              <Icono nombre="descarga" tamaño={20} />
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logo ASTRA pie */}
        {!colapsado && (
          <div className="py-3 flex justify-center opacity-30 shrink-0">
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={72}
              height={20}
              className="h-4 w-auto"
              style={{ filter: "var(--shell-logo-filter, none)" }}
            />
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarAbierto && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "var(--shell-overlay-suave)" }}
            onClick={cerrarSidebar}
          />
          <aside
            className="fixed bottom-0 left-0 top-[62px] z-50 w-[280px] overflow-y-auto lg:hidden"
            style={{
              background: "var(--shell-sidebar)",
              boxShadow: "var(--shell-sombra-fuerte)",
            }}
          >
            {/* Ribbon tema mobile */}
            <RibbonControles
              preferencia={preferencia}
              setPreferencia={setPreferencia}
              colapsado={false}
              onToggleColapsar={undefined}
            />

            {/* Navegacion mobile (siempre expandida) */}
            <nav className="px-3 pt-4 pb-2">
              <ul className="flex flex-col gap-0.5">
                {enlacesActivos.map((enlace) => {
                  const estaActivo =
                    enlace.ruta === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(enlace.ruta);

                  return (
                    <li key={enlace.ruta} className="group">
                      <Link
                        href={enlace.ruta}
                        onClick={cerrarSidebar}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 border",
                          estaActivo
                            ? "border text-[color:var(--shell-texto)]"
                            : "border-transparent text-[color:var(--shell-texto-tenue)]"
                        )}
                        style={{
                          borderColor: estaActivo ? "var(--shell-borde-fuerte)" : undefined,
                          background: estaActivo ? "var(--shell-chip)" : undefined,
                        }}
                      >
                        <Icono
                          nombre={enlace.icono}
                          tamaño={20}
                          peso={estaActivo ? "fill" : "regular"}
                          className={cn(
                            "transition-colors duration-200",
                            estaActivo ? "text-[color:var(--color-acento)]" : "text-[color:var(--shell-texto-tenue)]"
                          )}
                        />
                        <span>{enlace.etiqueta}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Sección Próximamente mobile */}
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
                    <li key={enlace.ruta} className="group">
                      <Link
                        href={enlace.ruta}
                        onClick={cerrarSidebar}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-[13px] font-medium text-[color:var(--shell-texto-tenue)] transition-all duration-200"
                      >
                        <Icono
                          nombre={enlace.icono}
                          tamaño={18}
                          peso="regular"
                          className="shrink-0 transition-colors duration-200 text-[color:var(--shell-texto-tenue)]"
                        />
                        <span className="flex-1 text-left">
                          {enlace.etiqueta}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="mx-4 my-3 h-px" style={{ background: "var(--shell-borde)" }} />

            <div className="px-3 pb-2">
              <button
                onClick={() => setModalDescarga(true)}
                disabled={!tieneCalculos || cargandoCalculos}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium border transition-all duration-200",
                  tieneCalculos && !cargandoCalculos
                    ? "border text-[color:var(--shell-texto-secundario)]"
                    : "cursor-not-allowed border text-[color:var(--shell-texto-tenue)]"
                )}
                style={{
                  borderColor: "var(--shell-borde)",
                  background: tieneCalculos && !cargandoCalculos ? "var(--shell-superficie)" : "transparent",
                }}
              >
                <Icono nombre="descarga" tamaño={18} />
                Descargar Perfil
              </button>
            </div>

            <div className="py-3 flex justify-center opacity-30 shrink-0">
              <Image
                src="/img/logo-astra-blanco.png"
                alt="ASTRA"
                width={72}
                height={20}
                className="h-4 w-auto"
                style={{ filter: "var(--shell-logo-filter, none)" }}
              />
            </div>
          </aside>
        </>
      )}

      {/* Modal Descargar Perfil */}
      {modalDescarga && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "var(--shell-overlay-suave)" }}
        >
          <div
            ref={modalRef}
            className="relative w-[340px] overflow-hidden rounded-[24px] border p-6 backdrop-blur-2xl"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-panel)",
              boxShadow: "var(--shell-sombra-fuerte)",
            }}
          >
            <button
              onClick={() => setModalDescarga(false)}
              className="absolute right-3 top-3 transition-colors text-[color:var(--shell-texto-tenue)] hover:text-[color:var(--shell-texto)]"
            >
              <Icono nombre="x" tamaño={20} />
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
              Descarga
            </p>
            <h3 className="mb-1 mt-3 text-[18px] font-semibold text-[color:var(--shell-texto)]">Descargar perfil</h3>
            <p className="mb-5 text-sm text-[color:var(--shell-texto-secundario)]">Elegí el formato más útil para vos.</p>

            <div className="flex gap-3">
              <button
                onClick={descargarPDF}
                disabled={descargando !== null}
                className="flex flex-1 flex-col items-center gap-2 rounded-[18px] border border-shell-borde bg-shell-superficie-suave p-4 transition-colors hover:border-shell-chip-borde hover:bg-shell-chip-hover disabled:opacity-50"
              >
                {descargando === "pdf" ? (
                  <Icono nombre="descarga" tamaño={24} className="animate-bounce text-shell-badge-acento" />
                ) : (
                  <Icono nombre="descarga" tamaño={24} className="text-shell-badge-acento" />
                )}
                <span className="text-sm font-semibold text-shell-texto">PDF</span>
                <span className="text-[11px] text-shell-texto-tenue">Formato visual ASTRA</span>
              </button>

              <button
                onClick={descargarMarkdown}
                disabled={descargando !== null}
                className="flex flex-1 flex-col items-center gap-2 rounded-[18px] border border-shell-borde bg-shell-superficie-suave p-4 transition-colors hover:border-shell-chip-borde hover:bg-shell-chip-hover disabled:opacity-50"
              >
                {descargando === "md" ? (
                  <Icono nombre="descarga" tamaño={24} className="animate-bounce text-shell-badge-acento" />
                ) : (
                  <Icono nombre="descarga" tamaño={24} className="text-shell-badge-acento" />
                )}
                <span className="text-sm font-semibold text-shell-texto">Markdown</span>
                <span className="text-[11px] text-shell-texto-tenue">Texto editable</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
