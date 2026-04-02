"use client";

import { useCallback, useState, type ReactNode } from "react";
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
import { usarDisenoHumano, usarMisCalculos } from "@/lib/hooks";
import { cn } from "@/lib/utilidades/cn";
import {
  crearIdCanal,
  nombreCentroHD,
  normalizarClaveHD,
  type SeleccionContextualHD,
} from "@/lib/utilidades/interpretaciones-diseno-humano";
import type { Activacion, Canal, DatosNacimiento, DisenoHumano } from "@/lib/tipos";

const PANEL_CLARO =
  "rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(245,238,255,0.9))] shadow-[0_24px_70px_rgba(20,8,42,0.16)] backdrop-blur-xl";

const PANEL_OSCURO =
  "relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.98),rgba(28,6,39,0.98))] shadow-[0_28px_90px_rgba(8,2,22,0.38)]";

const FONDO_PAGINA_HD =
  "relative min-h-full bg-[#16011B] lg:h-full lg:min-h-0 lg:overflow-hidden";

const PANEL_SECUNDARIO =
  "rounded-[22px] border border-white/[0.08] bg-white/[0.05] shadow-[0_18px_50px_rgba(8,3,20,0.2)] backdrop-blur-xl";

const PANEL_EXPLORACION_HD =
  "relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(34,10,47,0.96),rgba(34,10,47,0.96))] shadow-[0_22px_60px_rgba(8,3,20,0.24)]";

const BOTON_BODYGRAPH_VIOLETA =
  "inline-flex items-center gap-2 rounded-full border border-[#B388FF]/55 bg-gradient-to-r from-[#6C2BFF]/62 via-[#7C4DFF]/52 to-[#B388FF]/38 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:border-[#D9C2FF]/70 hover:from-[#7C4DFF]/78 hover:via-[#8F63FF]/68 hover:to-[#B388FF]/48 hover:shadow-[0_10px_28px_rgba(124,77,255,0.32)]";

const LISTA_EXPLORACION_HD =
  "divide-y divide-white/[0.06]";

type ModoExploracion = "centros" | "canales" | "activaciones";

function obtenerEstadoCentro(estado: string) {
  const definido = normalizarClaveHD(estado) === "definido";

  return {
    definido,
    etiqueta: definido ? "Definido" : "Abierto",
  };
}

function capitalizarEtiqueta(valor: string) {
  return valor
    .split(" ")
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(" ");
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
  activa,
  onClick,
}: {
  etiqueta: string;
  valor: string;
  activa: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full bg-white/[0.03] px-4 py-4 text-left transition-all duration-200",
        activa
          ? "bg-[linear-gradient(135deg,rgba(124,77,255,0.18),rgba(179,136,255,0.08))]"
          : "hover:bg-white/[0.06]",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/62">
        {etiqueta}
      </p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="min-w-0 text-[15px] font-semibold leading-tight text-white">
          {valor}
        </p>
        <Icono
          nombre="caretDerecha"
          tamaño={14}
          className={cn(
            "shrink-0 transition-transform duration-200",
            activa ? "text-[#D9C2FF]" : "text-[#B388FF]/72 group-hover:translate-x-0.5",
          )}
        />
      </div>
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
        "inline-flex items-center gap-2 border-b pb-2 text-[12px] font-medium transition-all",
        activo
          ? "border-[#B388FF]/70 text-white"
          : "border-transparent text-violet-100/56 hover:text-white/82",
      )}
    >
      <span>{titulo}</span>
      <span className="text-[11px] text-white/38">{contador}</span>
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
        "group flex w-full items-center justify-between gap-3 border-l-2 px-4 py-3 text-left transition-all duration-200",
        activo
          ? "border-l-[#B388FF] bg-white/[0.06]"
          : "border-l-transparent hover:bg-white/[0.04]",
      )}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-white">{nombre}</p>
        {!meta.definido ? (
          <p className="mt-1 text-[12px] text-violet-100/52">
            Amplifica y aprende por experiencia.
          </p>
        ) : null}
      </div>
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-violet-100/52">
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
        "group w-full border-l-2 px-4 py-3 text-left transition-all duration-200",
        activo
          ? "border-l-[#B388FF] bg-white/[0.06]"
          : "border-l-transparent hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-white">{canal.nombre}</p>
          <p className="mt-1 text-[12px] text-violet-100/52">
            {capitalizarEtiqueta(canal.centros[0])} · {capitalizarEtiqueta(canal.centros[1])}
          </p>
        </div>
        <span className="shrink-0 text-[12px] font-medium text-violet-100/62">
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
        "group w-full border-l-2 px-4 py-2.5 text-left transition-all duration-200",
        activo
          ? "border-l-[#B388FF] bg-white/[0.06]"
          : "border-l-transparent hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[13px] font-semibold text-white">
          {activacion.planeta}
        </p>
        <span className="shrink-0 text-right text-[11px] font-medium text-violet-100/54">
          P{activacion.puerta} · L{activacion.linea} · C{activacion.color} ·{" "}
          {origen === "consciente" ? "Conc." : "Inconc."}
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
        "flex w-full items-center justify-between gap-4 bg-white/[0.03] px-4 py-3 text-left transition-all",
        activo
          ? "bg-[linear-gradient(135deg,rgba(124,77,255,0.16),rgba(179,136,255,0.06))]"
          : "hover:bg-white/[0.06]",
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200/62">
          {etiqueta}
        </p>
      </div>
      <p className="shrink-0 text-[15px] font-semibold text-white">
        {puerta ?? "—"}
      </p>
    </button>
  );
}

function ListaVacia({ texto }: { texto: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-white/14 bg-white/[0.03] px-4 py-8 text-center">
      <p className="text-[14px] text-violet-100/62">{texto}</p>
    </div>
  );
}

function HeroDisenoHumano({
  datos,
  onAbrirBodyGraph,
}: {
  datos: DisenoHumano;
  onAbrirBodyGraph: () => void;
}) {
  const lineaTecnica = `${datos.tipo} · ${datos.autoridad} · Perfil ${datos.perfil} · ${datos.definicion}`;

  return (
    <section className={cn(PANEL_OSCURO, "p-6 lg:p-7")}>
      <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-[#B388FF]/16 blur-3xl" />
      <div className="absolute left-12 top-14 h-24 w-24 rounded-full bg-[#7C4DFF]/12 blur-3xl" />

      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
          Diseño Humano
        </p>

        <div className="mt-4 flex items-start gap-4">
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(124,77,255,0.48),rgba(179,136,255,0.22))] text-white shadow-[0_16px_40px_rgba(20,8,42,0.3)] sm:flex">
            <IconoAstral nombre="personal" tamaño={30} className="text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold tracking-tight text-white lg:text-[30px]">
              Diseño Humano
            </h1>
            <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-violet-100/56">
              {lineaTecnica}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAbrirBodyGraph}
            className={BOTON_BODYGRAPH_VIOLETA}
          >
            <Icono nombre="ojo" tamaño={16} peso="fill" />
            Ver Body Graph
          </button>
        </div>
      </div>
    </section>
  );
}

function SeccionPilaresHD({
  atributos,
  seleccion,
  onSeleccionar,
}: {
  atributos: Array<{
    tipo: "tipo" | "autoridad" | "perfil" | "definicion";
    etiqueta: string;
    valor: string;
  }>;
  seleccion: SeleccionContextualHD;
  onSeleccionar: (seleccion: SeleccionContextualHD) => void;
}) {
  return (
    <section className={cn(PANEL_SECUNDARIO, "mt-6 overflow-hidden p-0")}>
      <div className="grid gap-px bg-white/[0.08] md:grid-cols-2 xl:grid-cols-4">
        {atributos.map((atributo) => (
          <TarjetaAtributo
            key={atributo.etiqueta}
            etiqueta={atributo.etiqueta}
            valor={atributo.valor}
            activa={seleccion.tipo === atributo.tipo}
            onClick={() => onSeleccionar({ tipo: atributo.tipo })}
          />
        ))}
      </div>
    </section>
  );
}

function SeccionExploracionHD({
  modoExploracion,
  setModoExploracion,
  centrosEntries,
  canales,
  activacionesTotal,
  exploracionActual,
  onAbrirBodyGraph,
}: {
  modoExploracion: ModoExploracion;
  setModoExploracion: (modo: ModoExploracion) => void;
  centrosEntries: Array<[string, string]>;
  canales: Canal[];
  activacionesTotal: number;
  exploracionActual: ReactNode;
  onAbrirBodyGraph: () => void;
}) {
  return (
    <section className={cn(PANEL_EXPLORACION_HD, "mt-6 p-5 lg:p-6")}>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-3">
          <div className="flex flex-wrap gap-4">
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

          <button
            onClick={onAbrirBodyGraph}
            className={BOTON_BODYGRAPH_VIOLETA}
          >
            <Icono nombre="ojo" tamaño={16} peso="fill" />
            Body Graph
          </button>
        </div>

        <div className="mt-4">{exploracionActual}</div>
      </div>
    </section>
  );
}

function SeccionCruzHD({
  cruzItems,
  seleccion,
  setSeleccion,
}: {
  cruzItems: Array<{
    clave: "sol_consciente" | "tierra_consciente" | "sol_inconsciente" | "tierra_inconsciente";
    etiqueta: string;
    valor: number | null;
  }>;
  seleccion: SeleccionContextualHD;
  setSeleccion: (seleccion: SeleccionContextualHD) => void;
}) {
  return (
    <section className={cn(PANEL_SECUNDARIO, "mt-6 overflow-hidden p-0")}>
      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/68">
          Cruz
        </p>
      </div>
      <div className="grid gap-px bg-white/[0.08] sm:grid-cols-2 xl:grid-cols-4">
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
        className="relative z-10 w-full max-w-[1080px] overflow-hidden rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.16),transparent_28%),linear-gradient(135deg,#170d2c_0%,#241148_54%,#34205f_100%)] shadow-[0_30px_100px_rgba(10,4,25,0.48)]"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 lg:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/72">
              Body Graph
            </p>
            <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-white">
              Mapa del diseño
            </h2>
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
          <div className="mx-auto flex max-w-[820px] items-center justify-center rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.08),transparent_30%),linear-gradient(180deg,rgba(13,7,27,0.96),rgba(22,10,37,0.92))] p-6 lg:p-10">
            <BodyGraph datos={datos} className="min-h-[620px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaginaDisenoHumano() {
  const mutacion = usarDisenoHumano();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();

  const [datosManual, setDatosManual] = useState<DisenoHumano | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [modoExploracion, setModoExploracion] = useState<ModoExploracion>("centros");
  const [modalBodyGraphAbierto, setModalBodyGraphAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<SeleccionContextualHD>({ tipo: "default" });

  const datos =
    datosManual ?? (calculos?.diseno_humano as DisenoHumano | null) ?? null;

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

  const cerrarSeleccion = () => {
    setSeleccion({ tipo: "default" });
  };

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
                <h1 className="mt-3 text-[24px] font-semibold tracking-tight text-white lg:text-[28px]">
                  Preparando tu lectura
                </h1>
                <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-violet-100/62">
                  Cargando tipo, autoridad, centros y activaciones.
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
                    Diseño Humano
                  </p>
                  <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-white lg:text-[30px]">
                    Calculá tu diseño
                  </h1>
                  <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-violet-100/68">
                    Ingresá tus datos para abrir tipo, autoridad, perfil, centros, canales y activaciones en una lectura compacta.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl lg:p-5">
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7C4DFF]">
                      Datos de nacimiento
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-violet-100/62">
                      Abrí tu lectura completa desde acá.
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
    },
    {
      tipo: "autoridad" as const,
      etiqueta: "Autoridad",
      valor: datos.autoridad,
    },
    {
      tipo: "perfil" as const,
      etiqueta: "Perfil",
      valor: datos.perfil,
    },
    {
      tipo: "definicion" as const,
      etiqueta: "Definición",
      valor: datos.definicion,
    },
  ];

  const exploracionActual = (() => {
    if (modoExploracion === "centros") {
      return (
        <div className={cn(LISTA_EXPLORACION_HD, "divide-y divide-white/[0.06]")}>
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
        <div className={cn(LISTA_EXPLORACION_HD, "divide-y divide-white/[0.06]")}>
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
      <div className={cn(LISTA_EXPLORACION_HD, "divide-y divide-white/[0.06]")}>
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
                onAbrirBodyGraph={abrirModalBodyGraph}
              />

              <SeccionPilaresHD
                atributos={atributos}
                seleccion={seleccion}
                onSeleccionar={setSeleccion}
              />

              <SeccionCruzHD
                cruzItems={cruzItems}
                seleccion={seleccion}
                setSeleccion={setSeleccion}
              />

              <SeccionExploracionHD
                modoExploracion={modoExploracion}
                setModoExploracion={setModoExploracion}
                centrosEntries={centrosEntries}
                canales={canales}
                activacionesTotal={activacionesTotal}
                exploracionActual={exploracionActual}
                onAbrirBodyGraph={abrirModalBodyGraph}
              />
            </div>
          </div>

          {haySeleccionMobile && (
            <div className="fixed inset-0 z-50 flex items-end lg:hidden">
              <button
                onClick={cerrarSeleccion}
                className="absolute inset-0 bg-[#05020B]/52 backdrop-blur-[1px]"
                aria-label="Cerrar detalle"
              />
              <div className="relative z-10 max-h-[85vh] w-full overflow-hidden rounded-t-[22px]">
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
                  onAbrirBodyGraph={abrirModalBodyGraph}
                />

                <SeccionPilaresHD
                  atributos={atributos}
                  seleccion={seleccion}
                  onSeleccionar={setSeleccion}
                />

                <SeccionCruzHD
                  cruzItems={cruzItems}
                  seleccion={seleccion}
                  setSeleccion={setSeleccion}
                />

                <SeccionExploracionHD
                  modoExploracion={modoExploracion}
                  setModoExploracion={setModoExploracion}
                  centrosEntries={centrosEntries}
                  canales={canales}
                  activacionesTotal={activacionesTotal}
                  exploracionActual={exploracionActual}
                  onAbrirBodyGraph={abrirModalBodyGraph}
                />
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
