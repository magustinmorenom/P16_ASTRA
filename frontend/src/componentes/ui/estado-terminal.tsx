"use client";

import Image from "next/image";
import Link from "next/link";

import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { cn } from "@/lib/utilidades/cn";

type TonoEstado = "exito" | "error" | "pendiente" | "verificando";

interface AccionEstado {
  etiqueta: string;
  href: string;
  icono?: NombreIcono;
  variante?: "primario" | "secundario";
  externo?: boolean;
}

interface EstadoTerminalProps {
  titulo: string;
  descripcion: string;
  nota?: string;
  etiqueta?: string;
  tono: TonoEstado;
  acciones: AccionEstado[];
  ocuparPantalla?: boolean;
}

const CLASE_ACCION_BASE =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium transition-all duration-200";

const ESTILO_ACCION_SECUNDARIA = {
  borderColor: "rgba(255, 255, 255, 0.12)",
  color: "var(--shell-hero-texto-secundario)",
} as const;

function obtenerTono(tono: TonoEstado) {
  switch (tono) {
    case "exito":
      return {
        icono: "check" as const,
        borde: "var(--shell-badge-exito-borde)",
        fondo: "var(--shell-badge-exito-fondo)",
        color: "var(--shell-badge-exito-texto)",
        animar: false,
      };
    case "error":
      return {
        icono: "x" as const,
        borde: "var(--shell-badge-error-borde)",
        fondo: "var(--shell-badge-error-fondo)",
        color: "var(--shell-badge-error-texto)",
        animar: false,
      };
    case "verificando":
      return {
        icono: "reloj" as const,
        borde: "var(--shell-badge-violeta-borde)",
        fondo: "var(--shell-badge-violeta-fondo)",
        color: "var(--shell-badge-violeta-texto)",
        animar: true,
      };
    case "pendiente":
    default:
      return {
        icono: "reloj" as const,
        borde: "var(--shell-badge-violeta-borde)",
        fondo: "var(--shell-badge-violeta-fondo)",
        color: "var(--shell-badge-violeta-texto)",
        animar: false,
      };
  }
}

export function EstadoTerminal({
  titulo,
  descripcion,
  nota,
  etiqueta = "Estado del pago",
  tono,
  acciones,
  ocuparPantalla = false,
}: EstadoTerminalProps) {
  const estado = obtenerTono(tono);

  return (
    <section
      className={`relative overflow-hidden px-4 py-10 ${ocuparPantalla ? "flex min-h-screen items-center justify-center" : "min-h-full"}`}
      style={{ background: "var(--shell-fondo)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-2), transparent 24%), radial-gradient(circle_at_bottom_right, var(--shell-glow-1), transparent 26%), linear-gradient(180deg, var(--shell-fondo-profundo) 0%, var(--shell-fondo) 100%)",
        }}
      />
      <div
        className="absolute right-[-80px] top-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <div className="tema-superficie-hero rounded-[28px] p-6 text-center sm:p-7">
          <Image
            src="/img/logo-astra-blanco.png"
            alt="ASTRA"
            width={145}
            height={36}
            priority
            className="mx-auto mb-5 h-9 w-auto"
          />

          <p className="tema-hero-tenue text-[11px] font-semibold uppercase tracking-[0.18em]">
            {etiqueta}
          </p>

          <div
            className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-[20px] border"
            style={{
              borderColor: estado.borde,
              background: estado.fondo,
              color: estado.color,
            }}
          >
            <div className={estado.animar ? "animate-spin" : undefined}>
              <Icono nombre={estado.icono} tamaño={28} />
            </div>
          </div>

          <h1 className="tema-hero-titulo mt-5 text-xl font-semibold tracking-tight">
            {titulo}
          </h1>
          <p className="tema-hero-secundario mx-auto mt-2 max-w-md text-sm leading-6">
            {descripcion}
          </p>

          {acciones.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {acciones.map((accion) => {
                const contenido = (
                  <span
                    className={cn(
                      CLASE_ACCION_BASE,
                      accion.variante === "secundario"
                        ? "border bg-transparent hover:bg-white/[0.06] hover:text-[color:var(--shell-hero-texto)]"
                        : "bg-primario text-white shadow-lg shadow-violet-500/25 hover:bg-primario-hover",
                    )}
                    style={accion.variante === "secundario" ? ESTILO_ACCION_SECUNDARIA : undefined}
                  >
                    {accion.icono ? <Icono nombre={accion.icono} tamaño={18} /> : null}
                    {accion.etiqueta}
                  </span>
                );

                if (accion.externo) {
                  return (
                    <a
                      key={`${accion.href}-${accion.etiqueta}`}
                      href={accion.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contenido}
                    </a>
                  );
                }

                return (
                  <Link key={`${accion.href}-${accion.etiqueta}`} href={accion.href}>
                    {contenido}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {nota ? (
            <p className="tema-hero-tenue mt-4 text-xs leading-5">
              {nota}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
