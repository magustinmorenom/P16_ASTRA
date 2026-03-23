"use client";

import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral, IconoSigno } from "@/componentes/ui/icono-astral";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { usarTransitos } from "@/lib/hooks";
import { formatearFechaHora } from "@/lib/utilidades/formatear-fecha";

/** Mapa de elemento por signo para colorear tarjetas */
const ELEMENTO_SIGNO: Record<string, "fuego" | "tierra" | "aire" | "agua"> = {
  Aries: "fuego", Leo: "fuego", Sagitario: "fuego",
  Tauro: "tierra", Virgo: "tierra", Capricornio: "tierra",
  "Géminis": "aire", Libra: "aire", Acuario: "aire",
  Geminis: "aire",
  "Cáncer": "agua", Escorpio: "agua", Piscis: "agua",
  Cancer: "agua",
};

/** Variante de tarjeta según el elemento del signo */
function variantePorElemento(signo: string): "violeta" | "acento" | "cyan" | "default" {
  const elemento = ELEMENTO_SIGNO[signo];
  switch (elemento) {
    case "fuego": return "acento";
    case "agua": return "cyan";
    case "aire": return "violeta";
    default: return "default";
  }
}

export default function PaginaTransitos() {
  const { data: datos, isLoading, isError, error, refetch } = usarTransitos();

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
          <IconoAstral nombre="horoscopo" tamaño={32} className="text-acento" />
          Transitos Planetarios
        </h1>
        <div className="flex items-center gap-3">
          <p className="text-texto-secundario">
            Posiciones actuales de los astros
          </p>
          <Badge variante="info">Se actualiza cada 10 min</Badge>
        </div>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Esqueleto key={i} className="h-36" />
          ))}
        </div>
      )}

      {/* Estado de error */}
      {isError && (
        <div className="rounded-lg bg-error/10 border border-error/20 px-6 py-8 text-center">
          <p className="text-error mb-4">
            {error?.message || "Error al cargar los transitos planetarios."}
          </p>
          <Boton
            variante="secundario"
            onClick={() => refetch()}
            icono={<Icono nombre="flecha" tamaño={16} />}
          >
            Reintentar
          </Boton>
        </div>
      )}

      {/* Resultados */}
      {datos && (
        <div className="flex flex-col gap-6">
          {/* Ultima actualizacion */}
          <div className="flex items-center gap-3 text-sm text-texto-terciario">
            <Icono nombre="reloj" tamaño={16} />
            <span>
              Ultima actualizacion: {formatearFechaHora(datos.fecha_utc)}
            </span>
          </div>

          {/* Grid de planetas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {datos.planetas.map((planeta) => {
              const gradoEntero = Math.floor(planeta.grado_en_signo);
              const minutos = Math.floor(
                (planeta.grado_en_signo - gradoEntero) * 60
              );

              return (
                <Tarjeta
                  key={planeta.nombre}
                  variante={variantePorElemento(planeta.signo)}
                  padding="md"
                >
                  <div className="flex flex-col gap-2">
                    {/* Nombre del planeta */}
                    <p className="font-bold text-texto">{planeta.nombre}</p>

                    {/* Signo con icono SVG */}
                    <div className="flex items-center gap-1.5">
                      <IconoSigno signo={planeta.signo} tamaño={22} className="text-acento" />
                      <span className="text-sm text-texto-secundario">
                        {planeta.signo}
                      </span>
                    </div>

                    {/* Grado */}
                    <p className="text-sm text-texto">
                      {gradoEntero}°{minutos.toString().padStart(2, "0")}&apos;
                    </p>

                    {/* Retrogrado */}
                    {planeta.retrogrado && (
                      <Badge variante="advertencia">&#8478; Retrogrado</Badge>
                    )}

                    {/* Velocidad */}
                    <p className="text-xs text-texto-terciario">
                      {planeta.velocidad >= 0 ? "+" : ""}
                      {planeta.velocidad.toFixed(4)}°/dia
                    </p>
                  </div>
                </Tarjeta>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
