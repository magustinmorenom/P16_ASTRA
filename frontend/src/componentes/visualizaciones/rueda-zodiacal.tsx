"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utilidades/cn";
import type { Planeta, Casa, Aspecto } from "@/lib/tipos";
import { mapearPlanetas, mapearCuspides, nombreInglesAEspanol } from "./mapeador-astrochart";
import { crearConfigAstrochart } from "./config-astrochart";
import TooltipRueda, { type DatosTooltip } from "./tooltip-rueda";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PropsRuedaZodiacal {
  planetas?: Planeta[];
  casas?: Casa[];
  aspectos?: Aspecto[];
  className?: string;
  claro?: boolean;
  onPlanetaClick?: (planeta: Planeta) => void;
}

// ---------------------------------------------------------------------------
// Zona interactiva
// ---------------------------------------------------------------------------

interface ZonaInteractiva {
  cx: number;
  cy: number;
  datos: DatosTooltip;
  planeta?: Planeta;
}

const RADIO_ACTIVACION = 18;

const SIGNOS_EN_A_ES: Record<string, string> = {
  Aries: "Aries", Taurus: "Tauro", Gemini: "Géminis", Cancer: "Cáncer",
  Leo: "Leo", Virgo: "Virgo", Libra: "Libra", Scorpio: "Escorpio",
  Sagittarius: "Sagitario", Capricorn: "Capricornio", Aquarius: "Acuario",
  Pisces: "Piscis",
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export default function RuedaZodiacal({
  planetas,
  casas,
  aspectos,
  className,
  claro = false,
  onPlanetaClick,
}: PropsRuedaZodiacal) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const zonasRef = useRef<ZonaInteractiva[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zonaActivaRef = useRef<ZonaInteractiva | null>(null);
  const idBase = useId().replace(/:/g, "");
  const idChart = `astrochart-${idBase}`;
  const [montado, setMontado] = useState(false);
  const [tooltip, setTooltip] = useState<{
    datos: DatosTooltip;
    x: number;
    y: number;
  } | null>(null);
  const [tooltipSaliendo, setTooltipSaliendo] = useState(false);

  useEffect(() => { setMontado(true); }, []);

  const mostrarEnPosicion = useCallback(
    (datos: DatosTooltip, clientX: number, clientY: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setTooltipSaliendo(false);
      const x = Math.min(Math.max(8, clientX - 125), window.innerWidth - 258);
      const y = Math.max(8, clientY - 140);
      setTooltip({ datos, x, y });
    },
    []
  );

  const ocultarTooltip = useCallback(() => {
    setTooltipSaliendo(true);
    timeoutRef.current = setTimeout(() => {
      setTooltip(null);
      setTooltipSaliendo(false);
      zonaActivaRef.current = null;
    }, 200);
  }, []);

  // Mouse move — proximidad
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const svg = contenedorRef.current?.querySelector("svg");
      if (!svg || zonasRef.current.length === 0) return;

      const rect = svg.getBoundingClientRect();
      const svgW = svg.viewBox?.baseVal?.width || rect.width;
      const escala = svgW / rect.width;
      const mx = (e.clientX - rect.left) * escala;
      const my = (e.clientY - rect.top) * escala;
      const radio = RADIO_ACTIVACION * escala;

      let mejorZona: ZonaInteractiva | null = null;
      let mejorDist = Infinity;

      for (const zona of zonasRef.current) {
        const dx = zona.cx - mx;
        const dy = zona.cy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radio && dist < mejorDist) {
          mejorDist = dist;
          mejorZona = zona;
        }
      }

      if (mejorZona) {
        if (zonaActivaRef.current !== mejorZona) {
          zonaActivaRef.current = mejorZona;
          mostrarEnPosicion(mejorZona.datos, e.clientX, e.clientY);
        }
      } else if (zonaActivaRef.current) {
        ocultarTooltip();
      }
    },
    [mostrarEnPosicion, ocultarTooltip]
  );

  const handleClick = useCallback(() => {
    if (zonaActivaRef.current?.planeta && onPlanetaClick) {
      onPlanetaClick(zonaActivaRef.current.planeta);
    }
  }, [onPlanetaClick]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Crear chart
  useEffect(() => {
    if (!montado || !planetas || !casas || !contenedorRef.current) return;

    const contenedor = contenedorRef.current;
    const existente = contenedor.querySelector(`#${CSS.escape(idChart)}`);
    if (existente) existente.remove();

    const divChart = document.createElement("div");
    divChart.id = idChart;
    contenedor.insertBefore(divChart, contenedor.firstChild);

    const ancho = contenedor.clientWidth || 600;
    const alto = ancho;

    import("@astrodraw/astrochart").then(({ default: Chart }) => {
      if (!contenedorRef.current) return;

      const config = crearConfigAstrochart(claro);
      const chart = new Chart(idChart, ancho, alto, config);

      const datosChart = {
        planets: mapearPlanetas(planetas),
        cusps: mapearCuspides(casas),
      };

      const radix = chart.radix(datosChart);
      radix.aspects();

      requestAnimationFrame(() => {
        zonasRef.current = extraerZonas(contenedor, planetas, casas);
      });
    });

    return () => {
      const div = contenedor.querySelector(`#${CSS.escape(idChart)}`);
      if (div) div.remove();
      zonasRef.current = [];
    };
  }, [montado, planetas, casas, aspectos, claro, idChart]);

  // Adjuntar eventos de mouse
  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    contenedor.addEventListener("mousemove", handleMouseMove);
    contenedor.addEventListener("click", handleClick);
    contenedor.addEventListener("mouseleave", ocultarTooltip);

    return () => {
      contenedor.removeEventListener("mousemove", handleMouseMove);
      contenedor.removeEventListener("click", handleClick);
      contenedor.removeEventListener("mouseleave", ocultarTooltip);
    };
  }, [handleMouseMove, handleClick, ocultarTooltip]);

  if (!planetas || !casas) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl p-8", className)}>
        <p className="text-violet-200/50">Cargando rueda zodiacal...</p>
      </div>
    );
  }

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div
        ref={contenedorRef}
        className="w-full cursor-pointer"
      />

      {tooltip && (
        <TooltipRueda
          datos={tooltip.datos}
          x={tooltip.x}
          y={tooltip.y}
          saliendo={tooltipSaliendo}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Extraer zonas interactivas del SVG — usando IDs de grupo predecibles
// ---------------------------------------------------------------------------

function extraerZonas(
  contenedor: HTMLElement,
  planetas: Planeta[],
  casas: Casa[]
): ZonaInteractiva[] {
  const svg = contenedor.querySelector("svg");
  if (!svg) return [];

  const zonas: ZonaInteractiva[] = [];

  // ── Planetas ──
  // astrochart genera grupos: *-radix-planets-Sun, *-radix-planets-Moon, etc.
  for (const planeta of planetas) {
    const nombreEn = mapearNombreAIngles(planeta.nombre);
    const grupo = svg.querySelector(`[id$="-planets-${nombreEn}"]`);
    if (!grupo) continue;

    const centro = centroDeGrupo(grupo);
    if (!centro) continue;

    zonas.push({
      cx: centro.cx,
      cy: centro.cy,
      datos: {
        tipo: "planeta",
        nombre: planeta.nombre,
        signo: planeta.signo,
        casa: planeta.casa,
        retrogrado: planeta.retrogrado,
      },
      planeta,
    });
  }

  // ── Signos ──
  // Grupos: *-radix-signs-Aries, *-radix-signs-Taurus, etc.
  for (const [en, es] of Object.entries(SIGNOS_EN_A_ES)) {
    const grupo = svg.querySelector(`[id$="-signs-${en}"]`);
    if (!grupo) continue;

    const centro = centroDeGrupo(grupo);
    if (!centro) continue;

    zonas.push({
      cx: centro.cx,
      cy: centro.cy,
      datos: { tipo: "signo", nombre: es },
    });
  }

  // ── Casas ──
  // Grupos: *-radix-cusps-1, *-radix-cusps-2, etc.
  for (let i = 1; i <= 12; i++) {
    const grupo = svg.querySelector(`[id$="-cusps-${i}"]`);
    if (!grupo) continue;

    const centro = centroDeGrupo(grupo);
    if (!centro) continue;

    const casa = casas.find((c) => c.numero === i);
    zonas.push({
      cx: centro.cx,
      cy: centro.cy,
      datos: { tipo: "casa", numero: i, signo: casa?.signo },
    });
  }

  // ── Ejes ──
  // Textos "As", "Ds", "Mc", "Ic" dentro del grupo axis
  const grupoEjes = svg.querySelector(`[id$="-axis"]`);
  if (grupoEjes) {
    const textos = grupoEjes.querySelectorAll("text");
    for (const texto of textos) {
      const contenido = texto.textContent?.trim();
      if (contenido && ["As", "Ds", "Mc", "Ic"].includes(contenido)) {
        const centro = centroDeElemento(texto);
        if (centro) {
          zonas.push({
            cx: centro.cx,
            cy: centro.cy,
            datos: { tipo: "eje", nombre: contenido },
          });
        }
      }
    }
  }

  return zonas;
}

function centroDeGrupo(grupo: Element): { cx: number; cy: number } | null {
  // Buscar paths y texts dentro del grupo para calcular bounding box
  const hijos = grupo.querySelectorAll("path, text, circle, use");
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let found = false;

  for (const hijo of hijos) {
    try {
      if (hijo instanceof SVGGraphicsElement) {
        const bbox = hijo.getBBox();
        if (bbox.width === 0 && bbox.height === 0) continue;
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
        found = true;
      }
    } catch { /* getBBox puede fallar */ }
  }

  if (!found) return null;
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function centroDeElemento(el: Element): { cx: number; cy: number } | null {
  try {
    if (el instanceof SVGGraphicsElement) {
      const bbox = el.getBBox();
      if (bbox.width === 0 && bbox.height === 0) return null;
      return { cx: bbox.x + bbox.width / 2, cy: bbox.y + bbox.height / 2 };
    }
  } catch { /* */ }
  return null;
}

// Mapeo rápido español → inglés para buscar IDs en el SVG
function mapearNombreAIngles(nombre: string): string {
  const mapa: Record<string, string> = {
    "Sol": "Sun", "Luna": "Moon", "Mercurio": "Mercury", "Venus": "Venus",
    "Marte": "Mars", "Júpiter": "Jupiter", "Saturno": "Saturn",
    "Urano": "Uranus", "Neptuno": "Neptune", "Plutón": "Pluto",
    "Nodo Norte": "NNode", "Nodo Sur": "SNode", "Quirón": "Chiron",
  };
  return mapa[nombre] ?? nombre;
}
