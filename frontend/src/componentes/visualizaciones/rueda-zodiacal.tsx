"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utilidades/cn";
import type { Planeta, Casa, Aspecto } from "@/lib/tipos";
import { mapearPlanetas, mapearCuspides, nombreInglesAEspanol } from "./mapeador-astrochart";
import { crearConfigAstrochart } from "./config-astrochart";

// ---------------------------------------------------------------------------
// Props (misma interfaz que el componente anterior — drop-in)
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
  const idBase = useId().replace(/:/g, "");
  const idChart = `astrochart-${idBase}`;
  const [montado, setMontado] = useState(false);

  // Mount guard para SSR
  useEffect(() => {
    setMontado(true);
  }, []);

  // Crear/actualizar el chart
  useEffect(() => {
    if (!montado || !planetas || !casas || !contenedorRef.current) return;

    const contenedor = contenedorRef.current;

    // Limpiar contenido previo
    contenedor.innerHTML = "";

    // Crear div interno con el id para astrochart
    const divChart = document.createElement("div");
    divChart.id = idChart;
    contenedor.appendChild(divChart);

    // Calcular tamaño basado en el contenedor
    const ancho = contenedor.clientWidth || 600;
    const alto = ancho; // cuadrado

    // Dynamic import para evitar SSR crash
    import("@astrodraw/astrochart").then(({ default: Chart }) => {
      if (!contenedorRef.current) return;

      const config = crearConfigAstrochart(claro);
      const chart = new Chart(idChart, ancho, alto, config);

      // Mapear datos ASTRA → astrochart
      const datosChart = {
        planets: mapearPlanetas(planetas),
        cusps: mapearCuspides(casas),
      };

      // Dibujar radix + aspectos
      const radix = chart.radix(datosChart);
      radix.aspects();

      // Click handling en planetas
      if (onPlanetaClick) {
        adjuntarClickPlanetas(contenedor, planetas, onPlanetaClick);
      }
    });

    // Cleanup
    return () => {
      contenedor.innerHTML = "";
    };
  }, [montado, planetas, casas, aspectos, claro, idChart, onPlanetaClick]);

  // Loading state
  if (!planetas || !casas) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-fondo-tarjeta p-8",
          className
        )}
      >
        <p className="text-texto-secundario">Cargando rueda zodiacal...</p>
      </div>
    );
  }

  return (
    <div
      ref={contenedorRef}
      className={cn("flex items-center justify-center", className)}
    />
  );
}

// ---------------------------------------------------------------------------
// Click handling — busca SVG elements de planetas y adjunta listeners
// ---------------------------------------------------------------------------

function adjuntarClickPlanetas(
  contenedor: HTMLElement,
  planetas: Planeta[],
  onPlanetaClick: (planeta: Planeta) => void
): void {
  // Esperar a que el SVG se renderice
  requestAnimationFrame(() => {
    const svg = contenedor.querySelector("svg");
    if (!svg) return;

    // astrochart genera grupos con data-name o podemos buscar por text content
    const textos = svg.querySelectorAll("text");

    for (const texto of textos) {
      const contenido = texto.textContent?.trim();
      if (!contenido) continue;

      // Buscar el planeta correspondiente por nombre inglés
      const nombreEs = nombreInglesAEspanol(contenido);
      const planeta = planetas.find(
        (p) =>
          p.nombre.toLowerCase() === nombreEs.toLowerCase() ||
          p.nombre === contenido
      );

      if (planeta) {
        const padre = texto.parentElement;
        if (padre) {
          padre.style.cursor = "pointer";
          padre.addEventListener("click", () => onPlanetaClick(planeta));
        }
      }
    }
  });
}
