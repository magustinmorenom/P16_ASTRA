"use client";

import { useCallback, useState, type ComponentProps } from "react";
import HeaderMobile from "@/componentes/layouts/header-mobile";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import {
  PanelContextualHD,
  obtenerClavePanelContextualHD,
  obtenerMetaPanelContextualHD,
} from "@/componentes/diseno-humano/panel-contextual";
import { RailLateral } from "@/componentes/layouts/rail-lateral";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import BodyGraph from "@/componentes/visualizaciones/body-graph";
import { usarDisenoHumano, usarMisCalculos, usarMiPerfil } from "@/lib/hooks";
import { cn } from "@/lib/utilidades/cn";
import {
  construirBajadaEditorialHD,
  construirTitularEditorialHD,
  crearIdCanal,
  nombreCentroHD,
  normalizarClaveHD,
  type SeleccionContextualHD,
} from "@/lib/utilidades/interpretaciones-diseno-humano";
import type { Activacion, Canal, DatosNacimiento, DisenoHumano } from "@/lib/tipos";

const PANEL_CLARO =
  "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(245,238,255,0.9))] shadow-[0_24px_70px_rgba(20,8,42,0.16)] backdrop-blur-xl";

const PANEL_OSCURO =
  "relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.98),rgba(28,6,39,0.98))] shadow-[0_28px_90px_rgba(8,2,22,0.38)]";

const TARJETA_TECNICA =
  "rounded-[24px] border border-white/[0.08] bg-white/[0.05] shadow-[0_18px_45px_rgba(8,3,20,0.2)] backdrop-blur-xl transition-all duration-200";

const FONDO_PAGINA_HD =
  "relative min-h-full bg-[#16011B] lg:h-full lg:min-h-0 lg:overflow-hidden";

const PANEL_SECUNDARIO =
  "rounded-[28px] border border-white/[0.08] bg-white/[0.05] shadow-[0_18px_50px_rgba(8,3,20,0.2)] backdrop-blur-xl";

type ModoExploracion = "centros" | "canales" | "activaciones";

function obtenerEstadoCentro(estado: string) {
  const definido = normalizarClaveHD(estado) === "definido";

  return {
    definido,
    etiqueta: definido ? "Definido" : "Abierto",
    descripcion: definido
      ? "Acá tu energía se sostiene de forma consistente."
      : "Acá absorbés, amplificás y aprendés por experiencia.",
  };
}

function CapasFondoHD() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.24),transparent_26%),radial-gradient(circle_at_top_right,rgba(179,136,255,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(76,35,140,0.16),transparent_30%)]" />
      <div className="absolute right-[-80px] top-0 h-72 w-72 rounded-full bg-[#B388FF]/14 blur-3xl" />
      <div className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full bg-[#7C4DFF]/12 blur-3xl" />
    </>
  );
}

function TarjetaAtributo({
  etiqueta,
  valor,
  descripcion,
  icono,
  activa,
  onClick,
}: {
  etiqueta: string;
  valor: string;
  descripcion: string;
  icono: ComponentProps<typeof Icono>["nombre"];
  activa: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-[24px] border p-4 text-left transition-all duration-200",
        activa
          ? "border-[#B388FF]/40 bg-[linear-gradient(135deg,rgba(124,77,255,0.22),rgba(179,136,255,0.1))] shadow-[0_16px_36px_rgba(60,24,118,0.2)]"
          : "border-white/10 bg-white/[0.04] hover:border-[#B388FF]/28 hover:bg-white/[0.08]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,77,255,0.3),rgba(179,136,255,0.14))] text-white">
          <Icono nombre={icono} tamaño={22} />
        </div>
        <Icono
          nombre="caretDerecha"
          tamaño={16}
          className={cn(
            "mt-1 transition-transform duration-200",
            activa ? "text-[#7C4DFF]" : "text-[#B388FF] group-hover:translate-x-0.5",
          )}
        />
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/74">
        {etiqueta}
      </p>
      <p className="mt-2 text-[20px] font-semibold leading-tight text-white">
        {valor}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-violet-100/62">
        {descripcion}
      </p>
    </button>
  );
}

function BotonModo({
  activo,
  titulo,
  contador,
  onClick,
}: {
  activo: boolean;
  titulo: string;
  contador: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-[12px] font-medium transition-all",
        activo
          ? "border-[#B388FF]/35 bg-[linear-gradient(135deg,rgba(124,77,255,0.28),rgba(179,136,255,0.16))] text-white"
          : "border-white/10 bg-white/[0.05] text-violet-100/72 hover:bg-white/[0.08]",
      )}
    >
      {titulo} <span className="text-white/55">({contador})</span>
    </button>
  );
}

function ItemCentro({
  nombre,
  estado,
  activo,
  onClick,
}: {
  nombre: string;
  estado: string;
  activo: boolean;
  onClick: () => void;
}) {
  const meta = obtenerEstadoCentro(estado);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start justify-between gap-3 rounded-[22px] border px-4 py-4 text-left transition-all",
        activo
          ? "border-[#B388FF]/35 bg-white/[0.12]"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
      )}
    >
      <div>
        <p className="text-[15px] font-semibold text-white">{nombre}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-violet-100/62">
          {meta.descripcion}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
          meta.definido
            ? "bg-[#B388FF]/18 text-[#E7D6FF]"
            : "bg-white/[0.08] text-violet-100/62",
        )}
      >
        {meta.etiqueta}
      </span>
    </button>
  );
}

function ItemCanal({
  canal,
  activo,
  onClick,
}: {
  canal: Canal;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[22px] border px-4 py-4 text-left transition-all",
        activo
          ? "border-[#B388FF]/35 bg-white/[0.12]"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-white">{canal.nombre}</p>
          <p className="mt-1.5 text-[13px] text-violet-100/62">
            {canal.centros[0]} · {canal.centros[1]}
          </p>
        </div>
        <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[#E5D3FF]">
          {canal.puertas[0]}–{canal.puertas[1]}
        </span>
      </div>
    </button>
  );
}

function ItemActivacion({
  activacion,
  origen,
  activo,
  onClick,
}: {
  activacion: Activacion;
  origen: "consciente" | "inconsciente";
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[20px] border px-4 py-3 text-left transition-all",
        activo
          ? "border-[#B388FF]/35 bg-white/[0.12]"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-semibold text-white">
            {activacion.planeta}
          </p>
          <p className="mt-1 text-[13px] text-violet-100/62">
            Puerta {activacion.puerta} · Línea {activacion.linea} · Color {activacion.color}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
            origen === "consciente"
              ? "bg-[#B388FF]/18 text-[#E6D4FF]"
              : "bg-white/[0.08] text-violet-100/62",
          )}
        >
          {origen === "consciente" ? "Consciente" : "Inconsciente"}
        </span>
      </div>
    </button>
  );
}

function TarjetaCruz({
  etiqueta,
  puerta,
  activo,
  onClick,
}: {
  etiqueta: string;
  puerta: number | null;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[24px] border p-4 text-left transition-all",
        activo
          ? "border-[#B388FF]/35 bg-[linear-gradient(135deg,rgba(124,77,255,0.2),rgba(179,136,255,0.08))]"
          : "border-white/10 bg-white/[0.04] hover:border-[#B388FF]/28 hover:bg-white/[0.08]",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/74">
        {etiqueta}
      </p>
      <p className="mt-3 text-[24px] font-semibold text-white">
        {puerta ?? "—"}
      </p>
    </button>
  );
}

function ListaVacia({ texto }: { texto: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-white/14 bg-white/[0.03] px-4 py-8 text-center">
      <p className="text-[14px] text-violet-100/62">{texto}</p>
    </div>
  );
}

function HeroDisenoHumano({
  datos,
  nombrePersona,
  onAbrirBodyGraph,
  onSeleccionar,
}: {
  datos: DisenoHumano;
  nombrePersona: string;
  onAbrirBodyGraph: () => void;
  onSeleccionar: (seleccion: SeleccionContextualHD) => void;
}) {
  const titularEditorial = construirTitularEditorialHD(datos);
  const bajadaEditorial = construirBajadaEditorialHD(datos);
  const chips = [
    { etiqueta: "Tipo", valor: datos.tipo, seleccion: { tipo: "tipo" } as const },
    {
      etiqueta: "Autoridad",
      valor: datos.autoridad,
      seleccion: { tipo: "autoridad" } as const,
    },
    { etiqueta: "Perfil", valor: datos.perfil, seleccion: { tipo: "perfil" } as const },
    {
      etiqueta: "Definición",
      valor: datos.definicion,
      seleccion: { tipo: "definicion" } as const,
    },
  ];
  const centrosDefinidos = Object.values(datos.centros ?? {}).filter(
    (valor) => normalizarClaveHD(valor) === "definido",
  ).length;

  return (
    <section className={cn(PANEL_OSCURO, "p-6 lg:p-7")}>
      <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-[#B388FF]/16 blur-3xl" />
      <div className="absolute left-12 top-14 h-24 w-24 rounded-full bg-[#D4A234]/10 blur-3xl" />

      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
          Lectura HD
        </p>

        <div className="mt-4 flex items-start gap-4">
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(124,77,255,0.48),rgba(179,136,255,0.22))] text-white shadow-[0_16px_40px_rgba(20,8,42,0.3)] sm:flex">
            <IconoAstral nombre="personal" tamaño={30} className="text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold tracking-tight text-white lg:text-[34px]">
              Diseño Humano
            </h1>
            {nombrePersona ? (
              <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-violet-100/48">
                Perfil calculado para {nombrePersona}
              </p>
            ) : null}
            <p className="mt-4 max-w-3xl text-[20px] font-semibold leading-tight text-white lg:text-[24px]">
              {titularEditorial}
            </p>
            <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-violet-100/68">
              {bajadaEditorial}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.etiqueta}
              type="button"
              onClick={() => onSeleccionar(chip.seleccion)}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-left transition-colors hover:bg-white/[0.1]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/64">
                {chip.etiqueta}
              </span>
              <span className="ml-2 text-[13px] font-medium text-white">
                {chip.valor}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAbrirBodyGraph}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.14]"
          >
            <Icono nombre="ojo" tamaño={16} />
            Ver Body Graph
          </button>
          <button
            type="button"
            onClick={() => onSeleccionar({ tipo: "default" })}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-[13px] font-medium text-violet-100/78 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Icono nombre="destello" tamaño={16} />
            Abrir guía
          </button>
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12px] text-violet-100/64">
            {centrosDefinidos} centros definidos · {(datos.canales ?? []).length} canales activos
          </span>
        </div>
      </div>
    </section>
  );
}

function ModalBodyGraph({
  abierta,
  datos,
  onCerrar,
}: {
  abierta: boolean;
  datos: DisenoHumano | null;
  onCerrar: () => void;
}) {
  if (!abierta || !datos) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#11091f]/72 px-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="Cerrar Body Graph"
        onClick={onCerrar}
        className="absolute inset-0"
      />

      <div
        className="relative z-10 w-full max-w-[920px] overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.16),transparent_28%),linear-gradient(135deg,#170d2c_0%,#241148_54%,#34205f_100%)] shadow-[0_30px_100px_rgba(10,4,25,0.48)]"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 lg:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
              Body Graph
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-white">
              Mapa completo del diseño
            </h2>
            <p className="mt-1 text-[13px] text-violet-100/66">
              Vista de consulta del gráfico. La interpretación vive en el panel contextual.
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full border border-white/10 bg-white/[0.08] p-2 text-violet-100/75 transition-colors hover:bg-white/[0.14] hover:text-white"
          >
            <Icono nombre="x" tamaño={18} />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto flex max-w-[640px] items-center justify-center rounded-[28px] border border-white/10 bg-[#110A21]/70 p-5 lg:p-8">
            <BodyGraph datos={datos} className="min-h-[520px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaginaDisenoHumano() {
  const mutacion = usarDisenoHumano();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const { data: perfil } = usarMiPerfil();

  const [datosManual, setDatosManual] = useState<DisenoHumano | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [modoExploracion, setModoExploracion] = useState<ModoExploracion>("centros");
  const [modalBodyGraphAbierto, setModalBodyGraphAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<SeleccionContextualHD>({ tipo: "default" });

  const datos =
    datosManual ?? (calculos?.diseno_humano as DisenoHumano | null) ?? null;
  const nombrePersona = perfil?.nombre ?? "";

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate(
      { datos: datosNacimiento },
      {
        onSuccess: (respuesta) => {
          setDatosManual(respuesta);
          setModoManual(false);
          setSeleccion({ tipo: "default" });
        },
      },
    );
  }

  const abrirModalBodyGraph = useCallback(() => {
    setModalBodyGraphAbierto(true);
  }, []);

  const cerrarModalBodyGraph = useCallback(() => {
    setModalBodyGraphAbierto(false);
  }, []);

  const cerrarSeleccion = useCallback(() => {
    setSeleccion({ tipo: "default" });
  }, []);

  if (cargandoCalculos && !modoManual) {
    return (
      <>
        <HeaderMobile titulo="Diseño Humano" mostrarAtras />
        <div className={FONDO_PAGINA_HD}>
          <CapasFondoHD />

          <section className="relative z-10 flex h-full flex-col gap-6 overflow-y-auto scroll-sutil p-5 lg:p-[28px_32px]">
            <div className={cn(PANEL_OSCURO, "p-6 lg:p-8")}>
              <div className="absolute -right-14 top-10 h-36 w-36 rounded-full bg-[#B388FF]/18 blur-3xl" />
              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
                  Diseño Humano
                </p>
                <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-white lg:text-[34px]">
                  Diseño Humano
                </h1>
                <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-violet-100/68">
                  Estamos preparando tu lectura HD para mostrarla con el mismo patrón premium, contextual y sobrio de la Carta Astral.
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Esqueleto className="h-[460px] rounded-[28px]" />
              <div className="grid gap-4">
                <Esqueleto className="h-[180px] rounded-[28px]" />
                <Esqueleto className="h-[260px] rounded-[28px]" />
              </div>
            </div>

            <div className={cn(PANEL_CLARO, "flex items-center justify-center gap-3 px-5 py-4")}>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7C4DFF] border-t-transparent" />
              <p className="text-[13px] text-[#5D546B]">
                Cargando tu Diseño Humano…
              </p>
            </div>
          </section>
        </div>
      </>
    );
  }

  if (!datos || modoManual) {
    return (
      <>
        <HeaderMobile titulo="Diseño Humano" mostrarAtras />
        <div className={FONDO_PAGINA_HD}>
          <CapasFondoHD />

          <section className="relative z-10 flex h-full flex-col gap-6 overflow-y-auto scroll-sutil p-5 lg:p-[28px_32px]">
            <div className={cn(PANEL_OSCURO, "p-6 lg:p-8")}>
              <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#7C4DFF]/16 blur-3xl" />

              <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/75">
                    Cabina editorial
                  </p>
                  <h1 className="mt-3 flex items-center gap-3 text-[30px] font-semibold tracking-tight text-white lg:text-[40px]">
                    <IconoAstral nombre="personal" tamaño={34} className="text-[#D4A234]" />
                    Diseño Humano
                  </h1>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-violet-100/72">
                    Calculá tu Body Graph completo con una lectura premium: tipo, autoridad, perfil, centros, canales y activaciones con explicación breve y sentido personal.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        titulo: "Mapa interactivo",
                        descripcion: "El gráfico deja de ser un póster y pasa a ser una navegación.",
                      },
                      {
                        titulo: "Panel contextual",
                        descripcion: "Cada dato técnico abre una explicación breve y una lectura aplicada a vos.",
                      },
                      {
                        titulo: "Capas de lectura",
                        descripcion: "Primero esencia, después conexiones, después propósito y matices.",
                      },
                    ].map((item) => (
                      <div
                        key={item.titulo}
                        className="rounded-[22px] border border-white/10 bg-white/[0.08] p-4 backdrop-blur-md"
                      >
                        <p className="text-sm font-semibold text-white">
                          {item.titulo}
                        </p>
                        <p className="mt-2 text-[13px] leading-relaxed text-violet-100/65">
                          {item.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/12 bg-white/[0.08] p-4 backdrop-blur-xl lg:p-5">
                  <div className="rounded-[24px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,240,255,0.9))] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7C4DFF]">
                      Datos de nacimiento
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#5D546B]">
                      Ingresá tus datos para abrir la lectura completa de Diseño Humano.
                    </p>

                    <div className="mt-5">
                      <FormularioNacimiento
                        onSubmit={manejarCalculo}
                        cargando={mutacion.isPending}
                      />
                    </div>
                  </div>

                  {mutacion.isError && (
                    <div className="mt-4 rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-3">
                      <p className="text-[13px] text-red-600">
                        {mutacion.error?.message ||
                          "Error al calcular el Diseño Humano."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  const centrosEntries = Object.entries(datos.centros ?? {});
  const centrosDefinidos = centrosEntries.filter(
    ([, estado]) => normalizarClaveHD(estado) === "definido",
  ).length;
  const canales = datos.canales ?? [];
  const activacionesConscientes = datos.activaciones_conscientes ?? [];
  const activacionesInconscientes = datos.activaciones_inconscientes ?? [];
  const activacionesTotal = activacionesConscientes.length + activacionesInconscientes.length;
  const haySeleccionMobile = seleccion.tipo !== "default";
  const metaPanel = obtenerMetaPanelContextualHD(seleccion, datos);
  const cruzItems = [
    {
      clave: "sol_consciente" as const,
      etiqueta: "Sol Consciente",
      valor: datos.cruz_encarnacion?.sol_consciente ?? null,
    },
    {
      clave: "tierra_consciente" as const,
      etiqueta: "Tierra Consciente",
      valor: datos.cruz_encarnacion?.tierra_consciente ?? null,
    },
    {
      clave: "sol_inconsciente" as const,
      etiqueta: "Sol Inconsciente",
      valor: datos.cruz_encarnacion?.sol_inconsciente ?? null,
    },
    {
      clave: "tierra_inconsciente" as const,
      etiqueta: "Tierra Inconsciente",
      valor: datos.cruz_encarnacion?.tierra_inconsciente ?? null,
    },
  ];

  const atributos = [
    {
      tipo: "tipo" as const,
      etiqueta: "Tipo",
      valor: datos.tipo,
      descripcion: "Tu forma base de moverte.",
      icono: "hexagono" as const,
    },
    {
      tipo: "autoridad" as const,
      etiqueta: "Autoridad",
      valor: datos.autoridad,
      descripcion: "La señal que conviene seguir.",
      icono: "brujula" as const,
    },
    {
      tipo: "perfil" as const,
      etiqueta: "Perfil",
      valor: datos.perfil,
      descripcion: "Tu estilo de aprendizaje.",
      icono: "usuario" as const,
    },
    {
      tipo: "definicion" as const,
      etiqueta: "Definición",
      valor: datos.definicion,
      descripcion: "Cómo se enlaza tu energía.",
      icono: "grafico" as const,
    },
  ];

  const exploracionActual = (() => {
    if (modoExploracion === "centros") {
      return (
        <div className="grid gap-3">
          {centrosEntries.map(([clave, estado]) => (
            <ItemCentro
              key={clave}
              nombre={nombreCentroHD(clave)}
              estado={estado}
              activo={seleccion.tipo === "centro" && normalizarClaveHD(seleccion.clave) === normalizarClaveHD(clave)}
              onClick={() => setSeleccion({ tipo: "centro", clave, estado })}
            />
          ))}
        </div>
      );
    }

    if (modoExploracion === "canales") {
      if (canales.length === 0) {
        return <ListaVacia texto="No se encontraron canales definidos en este gráfico." />;
      }

      return (
        <div className="grid gap-3">
          {canales.map((canal) => (
            <ItemCanal
              key={crearIdCanal(canal)}
              canal={canal}
              activo={seleccion.tipo === "canal" && crearIdCanal(seleccion.canal) === crearIdCanal(canal)}
              onClick={() => setSeleccion({ tipo: "canal", canal })}
            />
          ))}
        </div>
      );
    }

    if (activacionesTotal === 0) {
      return <ListaVacia texto="No se encontraron activaciones técnicas para mostrar." />;
    }

    return (
      <div className="grid gap-3">
        {activacionesConscientes.map((activacion) => (
          <ItemActivacion
            key={`consciente-${activacion.planeta}-${activacion.puerta}-${activacion.linea}`}
            activacion={activacion}
            origen="consciente"
            activo={
              seleccion.tipo === "activacion" &&
              seleccion.origen === "consciente" &&
              seleccion.activacion.planeta === activacion.planeta &&
              seleccion.activacion.puerta === activacion.puerta &&
              seleccion.activacion.linea === activacion.linea
            }
            onClick={() => setSeleccion({ tipo: "activacion", activacion, origen: "consciente" })}
          />
        ))}
        {activacionesInconscientes.map((activacion) => (
          <ItemActivacion
            key={`inconsciente-${activacion.planeta}-${activacion.puerta}-${activacion.linea}`}
            activacion={activacion}
            origen="inconsciente"
            activo={
              seleccion.tipo === "activacion" &&
              seleccion.origen === "inconsciente" &&
              seleccion.activacion.planeta === activacion.planeta &&
              seleccion.activacion.puerta === activacion.puerta &&
              seleccion.activacion.linea === activacion.linea
            }
            onClick={() => setSeleccion({ tipo: "activacion", activacion, origen: "inconsciente" })}
          />
        ))}
      </div>
    );
  })();

  return (
    <>
      <HeaderMobile titulo="Diseño Humano" mostrarAtras />
      <div className={FONDO_PAGINA_HD}>
        <CapasFondoHD />

        <div className="relative z-10 flex min-h-full flex-col lg:h-full lg:min-h-0 lg:flex-row lg:overflow-hidden">
          <div className="flex-1 overflow-y-auto scroll-sutil lg:hidden">
            <div className="p-5 pb-24">
              <HeroDisenoHumano
                datos={datos}
                nombrePersona={nombrePersona}
                onAbrirBodyGraph={abrirModalBodyGraph}
                onSeleccionar={setSeleccion}
              />

              <section className={cn(PANEL_SECUNDARIO, "mt-6 p-5 lg:p-6")}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                      Esencia
                    </p>
                    <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                      Tus pilares de lectura
                    </h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {atributos.map((atributo) => (
                    <TarjetaAtributo
                      key={atributo.etiqueta}
                      etiqueta={atributo.etiqueta}
                      valor={atributo.valor}
                      descripcion={atributo.descripcion}
                      icono={atributo.icono}
                      activa={seleccion.tipo === atributo.tipo}
                      onClick={() => setSeleccion({ tipo: atributo.tipo })}
                    />
                  ))}
                </div>
              </section>

              <section className={cn(PANEL_OSCURO, "mt-6 p-5 lg:p-6")}>
                <div className="absolute -left-10 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#B388FF]/10 blur-3xl" />

                <div className="relative z-10">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                        Lectura técnica
                      </p>
                      <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                        Abrí una capa del diseño
                      </h2>
                      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-violet-100/68">
                        Centros, canales y activaciones viven acá. El Body Graph queda como consulta visual bajo demanda.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSeleccion({ tipo: "bodygraph" })}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-violet-100/82 transition-colors hover:bg-white/[0.1] hover:text-white"
                      >
                        <Icono nombre="destello" tamaño={16} />
                        Cómo leer este sistema
                      </button>
                      <button
                        onClick={abrirModalBodyGraph}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-violet-100/82 transition-colors hover:bg-white/[0.1] hover:text-white"
                      >
                        <Icono nombre="ojo" tamaño={16} />
                        Ver Body Graph
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className={cn(TARJETA_TECNICA, "p-4")}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                        Centros definidos
                      </p>
                      <p className="mt-2 text-[22px] font-semibold text-white">
                        {centrosDefinidos}
                      </p>
                    </div>
                    <div className={cn(TARJETA_TECNICA, "p-4")}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                        Canales activos
                      </p>
                      <p className="mt-2 text-[22px] font-semibold text-white">
                        {canales.length}
                      </p>
                    </div>
                    <div className={cn(TARJETA_TECNICA, "p-4")}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                        Activaciones
                      </p>
                      <p className="mt-2 text-[22px] font-semibold text-white">
                        {activacionesTotal}
                      </p>
                    </div>
                  </div>

                  <div className={cn(TARJETA_TECNICA, "mt-4 p-4")}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                      Qué explorar
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <BotonModo
                        activo={modoExploracion === "centros"}
                        titulo="Centros"
                        contador={centrosEntries.length}
                        onClick={() => setModoExploracion("centros")}
                      />
                      <BotonModo
                        activo={modoExploracion === "canales"}
                        titulo="Canales"
                        contador={canales.length}
                        onClick={() => setModoExploracion("canales")}
                      />
                      <BotonModo
                        activo={modoExploracion === "activaciones"}
                        titulo="Activaciones"
                        contador={activacionesTotal}
                        onClick={() => setModoExploracion("activaciones")}
                      />
                    </div>
                  </div>

                  <div className={cn(TARJETA_TECNICA, "mt-4 p-4")}>{exploracionActual}</div>
                </div>
              </section>

              <section className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
                <div className={cn(PANEL_SECUNDARIO, "p-5 lg:p-6")}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                    Propósito
                  </p>
                  <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                    Cruz de encarnación
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-violet-100/68">
                    Estos cuatro ejes ordenan el tono general del diseño. Cada puerta abre su explicación en el panel contextual.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {cruzItems.map((item) => (
                      <TarjetaCruz
                        key={item.etiqueta}
                        etiqueta={item.etiqueta}
                        puerta={item.valor}
                        activo={seleccion.tipo === "cruz" && seleccion.clave === item.clave}
                        onClick={() =>
                          setSeleccion({
                            tipo: "cruz",
                            clave: item.clave,
                            etiqueta: item.etiqueta,
                            puerta: item.valor,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className={cn(PANEL_SECUNDARIO, "p-5 lg:p-6")}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                        Activaciones
                      </p>
                      <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                        Señales dominantes
                      </h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/70">
                      {activacionesTotal} disponibles
                    </div>
                  </div>

                  {activacionesTotal === 0 ? (
                    <div className="mt-5 rounded-[24px] border border-dashed border-white/12 bg-white/[0.04] px-4 py-8 text-center">
                      <p className="text-[14px] text-violet-100/62">
                        No se encontraron activaciones dominantes para mostrar.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                          Conscientes
                        </p>
                        <div className="mt-3 flex flex-col gap-3">
                          {activacionesConscientes.slice(0, 6).map((activacion) => (
                            <button
                              key={`bloque-consciente-${activacion.planeta}-${activacion.puerta}-${activacion.linea}`}
                              onClick={() => setSeleccion({ tipo: "activacion", activacion, origen: "consciente" })}
                              className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.08]"
                            >
                              <p className="text-[14px] font-semibold text-white">
                                {activacion.planeta}
                              </p>
                              <p className="mt-1 text-[13px] text-violet-100/62">
                                Puerta {activacion.puerta} · Línea {activacion.linea} · Color {activacion.color}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                          Inconscientes
                        </p>
                        <div className="mt-3 flex flex-col gap-3">
                          {activacionesInconscientes.slice(0, 6).map((activacion) => (
                            <button
                              key={`bloque-inconsciente-${activacion.planeta}-${activacion.puerta}-${activacion.linea}`}
                              onClick={() => setSeleccion({ tipo: "activacion", activacion, origen: "inconsciente" })}
                              className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.08]"
                            >
                              <p className="text-[14px] font-semibold text-white">
                                {activacion.planeta}
                              </p>
                              <p className="mt-1 text-[13px] text-violet-100/62">
                                Puerta {activacion.puerta} · Línea {activacion.linea} · Color {activacion.color}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {haySeleccionMobile && (
            <div className="fixed inset-0 z-50 flex items-end lg:hidden">
              <button
                onClick={cerrarSeleccion}
                className="absolute inset-0 bg-[#05020B]/52 backdrop-blur-[1px]"
                aria-label="Cerrar detalle"
              />
              <div className="relative z-10 max-h-[85vh] w-full overflow-hidden rounded-t-[28px]">
                <PanelContextualHD
                  seleccion={seleccion}
                  datos={datos}
                  onCerrar={cerrarSeleccion}
                  modo="movil"
                />
              </div>
            </div>
          )}

          <div className="hidden lg:flex flex-1 min-h-0">
            <section className="min-w-0 flex-1 overflow-y-auto scroll-sutil px-6 py-6 xl:px-8 xl:py-7">
              <div className="mx-auto max-w-[1120px]">
                <HeroDisenoHumano
                  datos={datos}
                  nombrePersona={nombrePersona}
                  onAbrirBodyGraph={abrirModalBodyGraph}
                  onSeleccionar={setSeleccion}
                />

                <section className={cn(PANEL_SECUNDARIO, "mt-6 p-5 lg:p-6")}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                        Esencia
                      </p>
                      <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                        Tus pilares de lectura
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {atributos.map((atributo) => (
                      <TarjetaAtributo
                        key={atributo.etiqueta}
                        etiqueta={atributo.etiqueta}
                        valor={atributo.valor}
                        descripcion={atributo.descripcion}
                        icono={atributo.icono}
                        activa={seleccion.tipo === atributo.tipo}
                        onClick={() => setSeleccion({ tipo: atributo.tipo })}
                      />
                    ))}
                  </div>
                </section>

                <section className={cn(PANEL_OSCURO, "mt-6 p-5 lg:p-6")}>
                  <div className="absolute -left-10 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#B388FF]/10 blur-3xl" />

                  <div className="relative z-10">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                          Lectura técnica
                        </p>
                        <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                          Abrí una capa del diseño
                        </h2>
                        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-violet-100/68">
                          Centros, canales y activaciones viven acá. El Body Graph queda como consulta visual bajo demanda.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSeleccion({ tipo: "bodygraph" })}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-violet-100/82 transition-colors hover:bg-white/[0.1] hover:text-white"
                        >
                          <Icono nombre="destello" tamaño={16} />
                          Cómo leer este sistema
                        </button>
                        <button
                          onClick={abrirModalBodyGraph}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-violet-100/82 transition-colors hover:bg-white/[0.1] hover:text-white"
                        >
                          <Icono nombre="ojo" tamaño={16} />
                          Ver Body Graph
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className={cn(TARJETA_TECNICA, "p-4")}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                          Centros definidos
                        </p>
                        <p className="mt-2 text-[22px] font-semibold text-white">
                          {centrosDefinidos}
                        </p>
                      </div>
                      <div className={cn(TARJETA_TECNICA, "p-4")}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                          Canales activos
                        </p>
                        <p className="mt-2 text-[22px] font-semibold text-white">
                          {canales.length}
                        </p>
                      </div>
                      <div className={cn(TARJETA_TECNICA, "p-4")}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                          Activaciones
                        </p>
                        <p className="mt-2 text-[22px] font-semibold text-white">
                          {activacionesTotal}
                        </p>
                      </div>
                    </div>

                    <div className={cn(TARJETA_TECNICA, "mt-4 p-4")}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                        Qué explorar
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <BotonModo
                          activo={modoExploracion === "centros"}
                          titulo="Centros"
                          contador={centrosEntries.length}
                          onClick={() => setModoExploracion("centros")}
                        />
                        <BotonModo
                          activo={modoExploracion === "canales"}
                          titulo="Canales"
                          contador={canales.length}
                          onClick={() => setModoExploracion("canales")}
                        />
                        <BotonModo
                          activo={modoExploracion === "activaciones"}
                          titulo="Activaciones"
                          contador={activacionesTotal}
                          onClick={() => setModoExploracion("activaciones")}
                        />
                      </div>
                    </div>

                    <div className={cn(TARJETA_TECNICA, "mt-4 p-4")}>{exploracionActual}</div>
                  </div>
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
                  <div className={cn(PANEL_SECUNDARIO, "p-5 lg:p-6")}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                      Propósito
                    </p>
                    <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                      Cruz de encarnación
                    </h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-violet-100/68">
                      Estos cuatro ejes ordenan el tono general del diseño. Cada puerta abre su explicación en el panel contextual.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {cruzItems.map((item) => (
                        <TarjetaCruz
                          key={item.etiqueta}
                          etiqueta={item.etiqueta}
                          puerta={item.valor}
                          activo={seleccion.tipo === "cruz" && seleccion.clave === item.clave}
                          onClick={() =>
                            setSeleccion({
                              tipo: "cruz",
                              clave: item.clave,
                              etiqueta: item.etiqueta,
                              puerta: item.valor,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className={cn(PANEL_SECUNDARIO, "p-5 lg:p-6")}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                          Activaciones
                        </p>
                        <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-white">
                          Señales dominantes
                        </h2>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/70">
                        {activacionesTotal} disponibles
                      </div>
                    </div>

                    {activacionesTotal === 0 ? (
                      <div className="mt-5 rounded-[24px] border border-dashed border-white/12 bg-white/[0.04] px-4 py-8 text-center">
                        <p className="text-[14px] text-violet-100/62">
                          No se encontraron activaciones dominantes para mostrar.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                            Conscientes
                          </p>
                          <div className="mt-3 flex flex-col gap-3">
                            {activacionesConscientes.slice(0, 6).map((activacion) => (
                              <button
                                key={`bloque-consciente-${activacion.planeta}-${activacion.puerta}-${activacion.linea}`}
                                onClick={() => setSeleccion({ tipo: "activacion", activacion, origen: "consciente" })}
                                className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.08]"
                              >
                                <p className="text-[14px] font-semibold text-white">
                                  {activacion.planeta}
                                </p>
                                <p className="mt-1 text-[13px] text-violet-100/62">
                                  Puerta {activacion.puerta} · Línea {activacion.linea} · Color {activacion.color}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/72">
                            Inconscientes
                          </p>
                          <div className="mt-3 flex flex-col gap-3">
                            {activacionesInconscientes.slice(0, 6).map((activacion) => (
                              <button
                                key={`bloque-inconsciente-${activacion.planeta}-${activacion.puerta}-${activacion.linea}`}
                                onClick={() => setSeleccion({ tipo: "activacion", activacion, origen: "inconsciente" })}
                                className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.08]"
                              >
                                <p className="text-[14px] font-semibold text-white">
                                  {activacion.planeta}
                                </p>
                                <p className="mt-1 text-[13px] text-violet-100/62">
                                  Puerta {activacion.puerta} · Línea {activacion.linea} · Color {activacion.color}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </section>

            <RailLateral
              etiqueta={metaPanel.etiqueta}
              titulo={metaPanel.titulo}
              subtitulo={metaPanel.subtitulo}
              onCerrar={seleccion.tipo !== "default" ? cerrarSeleccion : undefined}
              cuerpoClassName="!p-0 overflow-hidden"
              claveContenido={obtenerClavePanelContextualHD(seleccion)}
            >
              <div className="h-full min-h-0">
                <PanelContextualHD
                  seleccion={seleccion}
                  datos={datos}
                  onCerrar={cerrarSeleccion}
                  modo="escritorio"
                />
              </div>
            </RailLateral>
          </div>
        </div>

        <ModalBodyGraph
          abierta={modalBodyGraphAbierto}
          datos={datos}
          onCerrar={cerrarModalBodyGraph}
        />
      </div>
      </>
    );
  }
