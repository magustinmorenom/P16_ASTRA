"use client";

import { Icono } from "@/componentes/ui/icono";
import { ErrorAPI } from "@/lib/api/cliente";
import { usarPerfilEspiritual } from "@/lib/hooks/usar-perfil-espiritual";
import type { ItemFODA } from "@/lib/tipos/perfil-espiritual";
import type { NombreIcono } from "@/componentes/ui/icono";

const CUADRANTES: {
  clave: "fortalezas" | "oportunidades" | "debilidades" | "amenazas";
  titulo: string;
  icono: NombreIcono;
  acento: string;
  fondo: string;
}[] = [
  {
    clave: "fortalezas",
    titulo: "Fortalezas",
    icono: "escudo",
    acento: "text-exito",
    fondo: "bg-exito/8",
  },
  {
    clave: "oportunidades",
    titulo: "Oportunidades",
    icono: "brujula",
    acento: "text-[color:var(--color-acento)]",
    fondo: "bg-[color:var(--color-acento)]/8",
  },
  {
    clave: "debilidades",
    titulo: "Debilidades",
    icono: "ojo",
    acento: "text-error",
    fondo: "bg-error/8",
  },
  {
    clave: "amenazas",
    titulo: "Amenazas",
    icono: "rayo",
    acento: "text-violet-300",
    fondo: "bg-violet-300/8",
  },
];

function ItemFodaCard({ item }: { item: ItemFODA }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p
        className="text-[13px] font-semibold leading-tight"
        style={{ color: "var(--shell-texto)" }}
      >
        {item.titulo}
      </p>
      <p
        className="mt-1 text-[12.5px] leading-relaxed"
        style={{ color: "var(--shell-texto-secundario)" }}
      >
        {item.descripcion}
      </p>
    </div>
  );
}

function AnimacionOrbital() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 rounded-2xl border py-16"
      style={{
        borderColor: "var(--shell-borde)",
        background: "var(--shell-superficie)",
      }}
    >
      {/* Animación orbital — misma que onboarding */}
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 animate-[spin_12s_linear_infinite] rounded-full border border-[color:var(--color-acento)]/20">
          <div className="absolute -top-1 left-1/2 -ml-1 h-2 w-2 rounded-full bg-[color:var(--color-acento)]/40" />
        </div>
        <div className="absolute inset-3 animate-[spin_8s_linear_infinite_reverse] rounded-full border border-[color:var(--color-acento)]/30">
          <div className="absolute -top-1 left-1/2 -ml-1 h-2 w-2 rounded-full bg-[color:var(--color-acento)]/50" />
        </div>
        <div className="absolute inset-6 animate-[spin_5s_linear_infinite] rounded-full border border-[color:var(--color-acento)]/40">
          <div className="absolute -top-0.5 left-1/2 -ml-0.5 h-1.5 w-1.5 rounded-full bg-[color:var(--color-acento)]/60" />
        </div>
        <div className="absolute inset-8 flex animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-violet-300 to-violet-500">
          <Icono nombre="destello" tamaño={16} className="text-white" />
        </div>
      </div>

      <div className="text-center">
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--shell-texto)" }}
        >
          Generando tu perfil espiritual
        </p>
        <p
          className="mt-1 text-[12px]"
          style={{ color: "var(--shell-texto-secundario)" }}
        >
          Analizando carta natal, diseño humano y numerología...
        </p>
      </div>
    </div>
  );
}

export default function PaginaPerfilEspiritual() {
  const { data, isLoading, error } = usarPerfilEspiritual();
  const mensajeError =
    error instanceof ErrorAPI
      ? error.detalle
      : "No pudimos generar tu perfil espiritual en este momento.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-acento)]">
          Perfil espiritual
        </p>
        <h1
          className="mt-2 text-[24px] font-bold leading-tight"
          style={{ color: "var(--shell-texto)" }}
        >
          Tu mapa interior
        </h1>
        <p
          className="mt-1 text-[13px]"
          style={{ color: "var(--shell-texto-secundario)" }}
        >
          Síntesis de tu carta natal, diseño humano y numerología
        </p>
      </div>

      {/* Loading o generando — animación orbital */}
      {(isLoading || data === null) && <AnimacionOrbital />}

      {/* Error */}
      {error && !isLoading && !data && (
        <div
          className="rounded-2xl border px-6 py-8 text-center"
          style={{
            borderColor: "var(--shell-borde)",
            background: "var(--shell-superficie)",
          }}
        >
          <Icono
            nombre="info"
            tamaño={24}
            className="mx-auto mb-3 text-[color:var(--color-acento)]"
          />
          <p
            className="text-sm"
            style={{ color: "var(--shell-texto-secundario)" }}
          >
            {mensajeError}
          </p>
        </div>
      )}

      {/* Content */}
      {data && (
        <div className="space-y-6 animate-[fadeIn_400ms_ease-out]">
          {/* Resumen */}
          <div
            className="rounded-2xl border px-[10px] py-5"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie)",
            }}
          >
            <p
              className="text-[14px] leading-[1.7]"
              style={{ color: "var(--shell-texto)" }}
            >
              {data.resumen}
            </p>
          </div>

          {/* FODA Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CUADRANTES.map((q) => {
              const items = data.foda[q.clave];
              return (
                <div
                  key={q.clave}
                  className="rounded-2xl border px-5 py-4"
                  style={{
                    borderColor: "var(--shell-borde)",
                    background: "var(--shell-superficie)",
                  }}
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${q.fondo}`}
                    >
                      <Icono
                        nombre={q.icono}
                        tamaño={14}
                        className={q.acento}
                      />
                    </div>
                    <h3
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--shell-texto)" }}
                    >
                      {q.titulo}
                    </h3>
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--shell-borde)" }}>
                    {items.map((item, i) => (
                      <ItemFodaCard key={i} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
