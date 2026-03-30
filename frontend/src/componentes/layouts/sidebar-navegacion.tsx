"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utilidades/cn";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarMiPerfil, usarMisCalculos } from "@/lib/hooks";
import { generarMarkdownPerfil } from "@/lib/utilidades/generar-markdown-perfil";

// ---------------------------------------------------------------------------
// Enlaces de navegacion
// ---------------------------------------------------------------------------
interface EnlaceNav {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
}

const enlacesNavegacion: EnlaceNav[] = [
  { etiqueta: "Inicio", ruta: "/dashboard", icono: "casa" },
  { etiqueta: "Podcasts", ruta: "/podcast", icono: "microfono" },
  { etiqueta: "Carta Astral", ruta: "/carta-natal", icono: "estrella" },
  { etiqueta: "Diseño Humano", ruta: "/diseno-humano", icono: "hexagono" },
  { etiqueta: "Numerología", ruta: "/numerologia", icono: "numeral" },
  { etiqueta: "Calendario", ruta: "/calendario-cosmico", icono: "planeta" },
  { etiqueta: "Retorno Solar", ruta: "/retorno-solar", icono: "retornoSolar" },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function SidebarNavegacion() {
  const pathname = usePathname();
  const { usuario } = useStoreAuth();
  const { sidebarAbierto, cerrarSidebar, sidebarColapsado } = useStoreUI();

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
          "hidden lg:flex flex-col flex-shrink-0 bg-[#190223] overflow-hidden transition-[width] duration-200 ease-in-out",
          colapsado ? "w-[64px]" : "w-[240px]"
        )}
      >
        {/* Navegacion */}
        <nav className={cn("pt-4 pb-2", colapsado ? "px-1.5" : "px-3")}>
          <ul className="flex flex-col gap-0.5">
            {enlacesNavegacion.map((enlace) => {
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
                      "flex items-center rounded-lg text-[13px] font-medium transition-all duration-200",
                      colapsado
                        ? "justify-center px-0 py-2.5"
                        : "gap-3 px-3 py-2.5",
                      estaActivo
                        ? "bg-[#7C4DFF]/15 text-white border border-[#7C4DFF]/20"
                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.05] border border-transparent"
                    )}
                  >
                    <Icono
                      nombre={enlace.icono}
                      tamaño={20}
                      peso={estaActivo ? "fill" : "regular"}
                      className={cn(
                        "transition-colors duration-200",
                        estaActivo ? "text-[#B388FF]" : "text-white/35 group-hover:text-white/70"
                      )}
                    />
                    {!colapsado && enlace.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Separador */}
        <div className={cn("my-3 h-px bg-white/[0.06]", colapsado ? "mx-2" : "mx-4")} />

        {/* Boton Descargar Perfil */}
        {!colapsado ? (
          <div className="px-3 pb-2">
            <button
              onClick={() => setModalDescarga(true)}
              disabled={!tieneCalculos || cargandoCalculos}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium border transition-all duration-200",
                tieneCalculos && !cargandoCalculos
                  ? "border-white/[0.08] text-white/35 hover:text-[#B388FF] hover:border-[#B388FF]/30 hover:bg-[#7C4DFF]/10"
                  : "border-white/[0.05] text-white/15 cursor-not-allowed"
              )}
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
                "w-full flex items-center justify-center py-2.5 rounded-lg transition-all duration-200",
                tieneCalculos && !cargandoCalculos
                  ? "text-white/35 hover:text-[#B388FF] hover:bg-[#7C4DFF]/10"
                  : "text-white/15 cursor-not-allowed"
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
            />
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarAbierto && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={cerrarSidebar}
          />
          <aside className="lg:hidden fixed top-[62px] left-0 bottom-0 w-[280px] z-50 shadow-xl overflow-y-auto bg-[#190223]">
            {/* Navegacion mobile (siempre expandida) */}
            <nav className="px-3 pt-4 pb-2">
              <ul className="flex flex-col gap-0.5">
                {enlacesNavegacion.map((enlace) => {
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
                            ? "bg-[#7C4DFF]/15 text-white border-[#7C4DFF]/20"
                            : "text-white/40 hover:text-white/80 hover:bg-white/[0.05] border-transparent"
                        )}
                      >
                        <Icono
                          nombre={enlace.icono}
                          tamaño={20}
                          peso={estaActivo ? "fill" : "regular"}
                          className={cn(
                            "transition-colors duration-200",
                            estaActivo ? "text-[#B388FF]" : "text-white/35"
                          )}
                        />
                        {enlace.etiqueta}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mx-4 my-3 h-px bg-white/[0.06]" />

            <div className="px-3 pb-2">
              <button
                onClick={() => setModalDescarga(true)}
                disabled={!tieneCalculos || cargandoCalculos}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium border transition-all duration-200",
                  tieneCalculos && !cargandoCalculos
                    ? "border-white/[0.08] text-white/35 hover:text-[#B388FF] hover:border-[#B388FF]/30 hover:bg-[#7C4DFF]/10"
                    : "border-white/[0.05] text-white/15 cursor-not-allowed"
                )}
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
              />
            </div>
          </aside>
        </>
      )}

      {/* Modal Descargar Perfil */}
      {modalDescarga && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-xl w-[340px] p-6 relative"
          >
            <button
              onClick={() => setModalDescarga(false)}
              className="absolute top-3 right-3 text-[#8A8580] hover:text-[#2C2926] transition-colors"
            >
              <Icono nombre="x" tamaño={20} />
            </button>

            <h3 className="text-lg font-semibold text-[#2C2926] mb-1">Descargar Perfil</h3>
            <p className="text-sm text-[#8A8580] mb-5">Elige el formato de descarga</p>

            <div className="flex gap-3">
              <button
                onClick={descargarPDF}
                disabled={descargando !== null}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E8E4E0] hover:border-[#7C4DFF] hover:bg-[#F5F0FF]/50 transition-colors disabled:opacity-50"
              >
                {descargando === "pdf" ? (
                  <Icono nombre="descarga" tamaño={24} className="text-[#7C4DFF] animate-bounce" />
                ) : (
                  <Icono nombre="descarga" tamaño={24} className="text-[#7C4DFF]" />
                )}
                <span className="text-sm font-semibold text-[#2C2926]">PDF</span>
                <span className="text-[11px] text-[#8A8580]">Con estilo ASTRA</span>
              </button>

              <button
                onClick={descargarMarkdown}
                disabled={descargando !== null}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E8E4E0] hover:border-[#7C4DFF] hover:bg-[#F5F0FF]/50 transition-colors disabled:opacity-50"
              >
                {descargando === "md" ? (
                  <Icono nombre="descarga" tamaño={24} className="text-[#7C4DFF] animate-bounce" />
                ) : (
                  <Icono nombre="descarga" tamaño={24} className="text-[#7C4DFF]" />
                )}
                <span className="text-sm font-semibold text-[#2C2926]">Markdown</span>
                <span className="text-[11px] text-[#8A8580]">Texto editable</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
