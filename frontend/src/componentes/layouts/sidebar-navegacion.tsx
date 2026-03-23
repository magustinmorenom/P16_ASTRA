"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utilidades/cn";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarMiPerfil, usarMisCalculos } from "@/lib/hooks";
import { obtenerSimbolo } from "@/lib/utilidades/formatear-grado";
import { generarMarkdownPerfil } from "@/lib/utilidades/generar-markdown-perfil";

// ---------------------------------------------------------------------------
// Mapa de signo zodiacal a icono SVG
// ---------------------------------------------------------------------------
const ICONO_SIGNO: Record<string, string> = {
  Aries: "/img/icons/004-aries.svg",
  Tauro: "/img/icons/005-taurus.svg",
  "Géminis": "/img/icons/006-gemini.svg",
  "Cáncer": "/img/icons/007-cancer.svg",
  Leo: "/img/icons/008-leo.svg",
  Virgo: "/img/icons/009-virgo.svg",
  Libra: "/img/icons/010-libra.svg",
  Escorpio: "/img/icons/011-scorpio.svg",
  Sagitario: "/img/icons/017-sagittarius.svg",
  Capricornio: "/img/icons/001-capricorn.svg",
  Acuario: "/img/icons/002-aquarius.svg",
  Piscis: "/img/icons/003-pisces.svg",
};

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
  { etiqueta: "Carta Astral", ruta: "/carta-natal", icono: "estrella" },
  { etiqueta: "Diseño Humano", ruta: "/diseno-humano", icono: "hexagono" },
  { etiqueta: "Numerología", ruta: "/numerologia", icono: "numeral" },
  { etiqueta: "Calendario", ruta: "/calendario-cosmico", icono: "planeta" },
  { etiqueta: "Retorno Solar", ruta: "/retorno-solar", icono: "retornoSolar" },
  { etiqueta: "Podcasts", ruta: "/podcast", icono: "microfono" },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function SidebarNavegacion({
  alturaContenido = "h-full",
}: {
  alturaContenido?: string;
}) {
  const pathname = usePathname();
  const { usuario } = useStoreAuth();
  const { sidebarAbierto, cerrarSidebar } = useStoreUI();

  const { data: perfil, isLoading: cargandoPerfil } = usarMiPerfil();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();

  const sol = calculos?.natal?.planetas?.find((p: { nombre: string }) => p.nombre === "Sol");
  const luna = calculos?.natal?.planetas?.find((p: { nombre: string }) => p.nombre === "Luna");
  const ascendente = calculos?.natal?.ascendente;

  const nombreUsuario = perfil?.nombre ?? usuario?.nombre ?? "Usuario";
  const inicialesUsuario = nombreUsuario
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const esMaestro = (n: number) => [11, 22, 33].includes(n);

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

  const contenidoSidebar = (
    <div className="flex flex-col h-full bg-white scroll-sutil overflow-y-auto">
      {/* Navegacion */}
      <nav className="px-3 pt-4 pb-2">
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
                  onClick={cerrarSidebar}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    estaActivo
                      ? "bg-[#F5F0FF] text-[#7C4DFF]"
                      : "text-[#8A8580] hover:text-[#2C2926] hover:bg-[#F5F0FF]/50"
                  )}
                >
                  <Icono
                    nombre={enlace.icono}
                    tamaño={20}
                    peso={estaActivo ? "fill" : "regular"}
                    className={estaActivo ? "text-[#7C4DFF]" : ""}
                  />
                  {enlace.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Separador */}
      <div className="mx-4 my-2 h-px bg-[#E8E4E0]" />

      {/* Perfil cosmico compacto */}
      <div className="px-3 pb-2">
        <div className="rounded-xl bg-gradient-to-b from-[#2D1B69] to-[#4A2D8C] p-4 flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-b from-[#7C4DFF] to-[#B388FF] flex items-center justify-center text-white text-base font-semibold shrink-0">
            {inicialesUsuario}
          </div>
          <p className="text-white font-semibold text-sm">{nombreUsuario}</p>

          {/* Sol / Luna / Ascendente en fila */}
          <div className="flex items-center justify-around w-full">
            {cargandoCalculos ? (
              <>
                <Esqueleto className="h-8 w-12 bg-white/20" />
                <Esqueleto className="h-8 w-12 bg-white/20" />
                <Esqueleto className="h-8 w-12 bg-white/20" />
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-0.5">
                  {sol && ICONO_SIGNO[sol.signo] ? (
                    <Image src={ICONO_SIGNO[sol.signo]} alt={sol.signo} width={22} height={22} className="brightness-150 opacity-90" />
                  ) : (
                    <p className="text-[#F0D68A] text-sm">{sol ? obtenerSimbolo(sol.signo) : "—"}</p>
                  )}
                  <p className="text-[#B388FF] text-[9px]">Sol</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  {luna && ICONO_SIGNO[luna.signo] ? (
                    <Image src={ICONO_SIGNO[luna.signo]} alt={luna.signo} width={22} height={22} className="brightness-150 opacity-90" />
                  ) : (
                    <p className="text-[#F0D68A] text-sm">{luna ? obtenerSimbolo(luna.signo) : "—"}</p>
                  )}
                  <p className="text-[#B388FF] text-[9px]">Luna</p>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  {ascendente && ICONO_SIGNO[ascendente.signo] ? (
                    <Image src={ICONO_SIGNO[ascendente.signo]} alt={ascendente.signo} width={22} height={22} className="brightness-150 opacity-90" />
                  ) : (
                    <p className="text-[#F0D68A] text-sm">{ascendente ? obtenerSimbolo(ascendente.signo) : "—"}</p>
                  )}
                  <p className="text-[#B388FF] text-[9px]">Asc</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cards resumen compactas */}
      <div className="px-3 flex flex-col gap-2 pb-3">
        {/* Card Astrologia mini */}
        <Link href="/carta-natal" onClick={cerrarSidebar} className="block rounded-xl bg-[#F5F0FF] p-3 hover:bg-[#EDE5FF] transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Icono nombre="estrella" tamaño={16} peso="fill" className="text-violet-500" />
            <span className="text-xs font-semibold text-[#2C2926]">Carta Astral</span>
          </div>
          {cargandoCalculos ? (
            <Esqueleto className="h-3 w-full" />
          ) : sol && luna ? (
            <p className="text-[11px] text-[#8A8580] leading-snug">
              Sol en {sol.signo} · Luna en {luna.signo}
            </p>
          ) : (
            <p className="text-[11px] text-[#8A8580]">Completa tu perfil</p>
          )}
        </Link>

        {/* Card HD mini */}
        <Link href="/diseno-humano" onClick={cerrarSidebar} className="block rounded-xl bg-[#FDF6E3] p-3 hover:bg-[#FBF0D0] transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Icono nombre="hexagono" tamaño={16} peso="fill" className="text-[#D4A234]" />
            <span className="text-xs font-semibold text-[#2C2926]">Human Design</span>
          </div>
          {cargandoCalculos ? (
            <Esqueleto className="h-3 w-full" />
          ) : calculos?.diseno_humano ? (
            <p className="text-[11px] text-[#8A8580] leading-snug">
              {calculos.diseno_humano.tipo} · {calculos.diseno_humano.perfil}
            </p>
          ) : (
            <p className="text-[11px] text-[#8A8580]">Completa tu perfil</p>
          )}
        </Link>

        {/* Card Numerologia mini */}
        <Link href="/numerologia" onClick={cerrarSidebar} className="block rounded-xl bg-[#F5F0FF] p-3 hover:bg-[#EDE5FF] transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Icono nombre="numeral" tamaño={16} peso="bold" className="text-violet-500" />
            <span className="text-xs font-semibold text-[#2C2926]">Numerología</span>
          </div>
          {cargandoCalculos ? (
            <Esqueleto className="h-3 w-full" />
          ) : calculos?.numerologia ? (
            <p className="text-[11px] text-[#8A8580] leading-snug">
              Camino de vida:{" "}
              <span className={cn("font-bold", esMaestro(calculos.numerologia.camino_de_vida?.numero) ? "text-[#D4A234]" : "text-violet-600")}>
                {calculos.numerologia.camino_de_vida?.numero}
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-[#8A8580]">Completa tu perfil</p>
          )}
        </Link>
      </div>

      {/* Boton Descargar Perfil */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setModalDescarga(true)}
          disabled={!tieneCalculos || cargandoCalculos}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors",
            tieneCalculos && !cargandoCalculos
              ? "border-[#E8E4E0] text-[#8A8580] hover:text-[#7C4DFF] hover:border-[#7C4DFF] hover:bg-[#F5F0FF]/50"
              : "border-[#E8E4E0]/50 text-[#C5C0BC] cursor-not-allowed"
          )}
        >
          <Icono nombre="descarga" tamaño={18} />
          Descargar Perfil
        </button>
      </div>

      {/* Logo ASTRA pie */}
      <div className="py-3 flex justify-center opacity-30 shrink-0">
        <Image
          src="/img/logo-astra-blanco.png"
          alt="ASTRA"
          width={72}
          height={20}
          className="h-4 w-auto invert"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex w-[240px] flex-shrink-0 border-r border-[#E8E4E0]/40 overflow-hidden ${alturaContenido}`}>
        {contenidoSidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarAbierto && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={cerrarSidebar}
          />
          <aside className="lg:hidden fixed top-[56px] left-0 bottom-0 w-[280px] z-50 shadow-xl overflow-y-auto">
            {contenidoSidebar}
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
            {/* Boton cerrar */}
            <button
              onClick={() => setModalDescarga(false)}
              className="absolute top-3 right-3 text-[#8A8580] hover:text-[#2C2926] transition-colors"
            >
              <Icono nombre="x" tamaño={20} />
            </button>

            <h3 className="text-lg font-semibold text-[#2C2926] mb-1">Descargar Perfil</h3>
            <p className="text-sm text-[#8A8580] mb-5">Elige el formato de descarga</p>

            <div className="flex gap-3">
              {/* PDF */}
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

              {/* Markdown */}
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
