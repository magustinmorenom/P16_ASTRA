"use client";

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
  { etiqueta: "Tránsitos", ruta: "/transitos", icono: "planeta" },
  { etiqueta: "Retorno Solar", ruta: "/retorno-solar", icono: "retornoSolar" },
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
    </>
  );
}
