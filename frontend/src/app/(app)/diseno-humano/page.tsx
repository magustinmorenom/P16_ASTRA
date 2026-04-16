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
  "tema-superficie-panel rounded-[22px]";

const PANEL_OSCURO =
  "tema-superficie-panel relative overflow-hidden rounded-[26px]";

const FONDO_PAGINA_HD =
  "relative min-h-full lg:h-full lg:min-h-0 lg:overflow-hidden";

const PANEL_SECUNDARIO =
  "tema-superficie-panel-suave rounded-[20px]";

const PANEL_EXPLORACION_HD =
  "tema-superficie-panel relative overflow-hidden rounded-[20px]";

const BOTON_BODYGRAPH_VIOLETA =
  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors hover:text-[color:var(--shell-texto)]";

const LISTA_EXPLORACION_HD = "divide-y";
const ESTILO_FONDO_HD = {
  background: "var(--shell-fondo)",
} as const;
const ESTILO_PANEL_HD = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie)",
} as const;
const ESTILO_PANEL_HD_SUAVE = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie-suave)",
} as const;
const ESTILO_BOTON_BODYGRAPH = {
  borderColor: "var(--shell-chip-borde)",
  background: "var(--shell-chip)",
  color: "var(--shell-texto)",
} as const;

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
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 22%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 30%)",
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
        "group w-full px-4 py-4 text-left transition-all duration-200",
        !activa && "hover:bg-[var(--shell-superficie-suave)]",
      )}
      style={activa ? { background: "var(--shell-chip)" } : undefined}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
        {etiqueta}
      </p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="min-w-0 text-[14px] font-semibold leading-tight text-[color:var(--shell-texto)]">
          {valor}
        </p>
        <Icono
          nombre="caretDerecha"
          tamaño={14}
          className={cn(
            "shrink-0 transition-transform duration-200",
            activa
              ? "text-[color:var(--shell-badge-violeta-texto)]"
              : "text-[color:var(--shell-texto-tenue)] group-hover:translate-x-0.5",
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
          ? "text-[color:var(--shell-texto)]"
          : "border-transparent text-[color:var(--shell-texto-secundario)] hover:text-[color:var(--shell-texto)]",
      )}
      style={activo ? { borderBottomColor: "var(--color-acento)" } : undefined}
    >
      <span>{titulo}</span>
      <span className="text-[11px] text-[color:var(--shell-texto-tenue)]">{contador}</span>
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
        !activo && "border-l-transparent hover:bg-[var(--shell-superficie-suave)]",
      )}
      style={
        activo
          ? {
              borderLeftColor: "var(--color-acento)",
              background: "var(--shell-chip)",
            }
          : undefined
      }
    >
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[color:var(--shell-texto)]">{nombre}</p>
      </div>
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--shell-texto-tenue)]">
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
        !activo && "border-l-transparent hover:bg-[var(--shell-superficie-suave)]",
      )}
      style={
        activo
          ? {
              borderLeftColor: "var(--color-acento)",
              background: "var(--shell-chip)",
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-5 text-[color:var(--shell-texto)]">{canal.nombre}</p>
          <p className="mt-1 text-[12px] text-[color:var(--shell-texto-secundario)]">
            {capitalizarEtiqueta(canal.centros[0])} · {capitalizarEtiqueta(canal.centros[1])}
          </p>
        </div>
        <span className="shrink-0 text-[12px] font-medium text-[color:var(--shell-texto-secundario)]">
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
        !activo && "border-l-transparent hover:bg-[var(--shell-superficie-suave)]",
      )}
      style={
        activo
          ? {
              borderLeftColor: "var(--color-acento)",
              background: "var(--shell-chip)",
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold leading-5 text-[color:var(--shell-texto)]">
          {activacion.planeta}
        </p>
        <span className="shrink-0 text-right text-[11px] font-medium text-[color:var(--shell-texto-secundario)]">
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
        "flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-all",
        !activo && "hover:bg-[var(--shell-superficie-suave)]",
      )}
      style={activo ? { background: "var(--shell-chip)" } : undefined}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
          {etiqueta}
        </p>
      </div>
      <p className="shrink-0 text-[15px] font-semibold text-[color:var(--shell-texto)]">
        {puerta ?? "—"}
      </p>
    </button>
  );
}

function ListaVacia({ texto }: { texto: string }) {
  return (
    <div
      className="rounded-[18px] border border-dashed px-4 py-8 text-center"
      style={ESTILO_PANEL_HD_SUAVE}
    >
      <p className="text-[14px] text-[color:var(--shell-texto-secundario)]">{texto}</p>
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
      <div
        className="absolute -right-16 top-8 h-44 w-44 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="absolute left-12 top-14 h-24 w-24 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />

      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
          Diseño Humano
        </p>

        <div className="mt-4 flex items-start gap-4">
          <div className="tema-gradiente-acento-suave hidden h-16 w-16 shrink-0 items-center justify-center rounded-[18px] text-white shadow-[var(--shell-sombra-fuerte)] sm:flex">
            <IconoAstral nombre="personal" tamaño={30} className="text-white" />
          </div>

          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold tracking-tight text-[color:var(--shell-texto)] lg:text-[24px]">
              Diseño Humano
            </h1>
            <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-[color:var(--shell-texto-secundario)]">
              {lineaTecnica}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAbrirBodyGraph}
            className={BOTON_BODYGRAPH_VIOLETA}
            style={ESTILO_BOTON_BODYGRAPH}
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
      <div className="grid gap-px md:grid-cols-2 xl:grid-cols-4" style={{ background: "var(--shell-borde)" }}>
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
        <div
          className="flex flex-wrap items-center justify-between gap-4 border-b pb-3"
          style={{ borderColor: "var(--shell-borde)" }}
        >
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
            style={ESTILO_BOTON_BODYGRAPH}
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
      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4" style={{ background: "var(--shell-borde)" }}>
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
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4 backdrop-blur-md"
      style={{ background: "var(--shell-overlay)" }}
    >
      <button
        type="button"
        aria-label="Cerrar Body Graph"
        onClick={onCerrar}
        className="absolute inset-0"
      />

      <div
        className="tema-superficie-panel relative z-10 w-full max-w-[1180px] overflow-hidden rounded-[24px]"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4 lg:px-6"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
              Body Graph
            </p>
            <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[color:var(--shell-texto)]">
              Mapa del diseño
            </h2>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full border p-2 text-[color:var(--shell-texto-secundario)] transition-colors hover:text-[color:var(--shell-texto)]"
            style={ESTILO_PANEL_HD}
          >
            <Icono nombre="x" tamaño={18} />
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-4 lg:p-6">
          <div
            className="tema-superficie-panel-suave mx-auto flex max-w-[900px] items-center justify-center rounded-[20px] p-6 lg:p-10"
          >
            <BodyGraph datos={datos} className="min-h-[700px]" />
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
        <div className={FONDO_PAGINA_HD} style={ESTILO_FONDO_HD}>
          <CapasFondoHD />

          <section className="relative z-10 flex h-full flex-col gap-6 overflow-y-auto scroll-sutil p-5 lg:p-[28px_32px]">
            <div className={cn(PANEL_OSCURO, "p-6 lg:p-8")}>
              <div
                className="absolute -right-14 top-10 h-36 w-36 rounded-full blur-3xl"
                style={{ background: "var(--shell-glow-2)" }}
              />
              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
                  Diseño Humano
                </p>
                <h1 className="mt-3 text-[24px] font-semibold tracking-tight text-[color:var(--shell-texto)] lg:text-[28px]">
                  Preparando tu lectura
                </h1>
                <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[color:var(--shell-texto-secundario)]">
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
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-[13px] text-[color:var(--shell-texto-secundario)]">
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
        <div className={FONDO_PAGINA_HD} style={ESTILO_FONDO_HD}>
          <CapasFondoHD />

          <section className="relative z-10 flex h-full flex-col gap-6 overflow-y-auto scroll-sutil p-5 lg:p-[28px_32px]">
            <div className={cn(PANEL_OSCURO, "p-6 lg:p-8")}>
              <div
                className="absolute -right-16 top-0 h-44 w-44 rounded-full blur-3xl"
                style={{ background: "var(--shell-glow-2)" }}
              />
              <div
                className="absolute -left-10 bottom-0 h-36 w-36 rounded-full blur-3xl"
                style={{ background: "var(--shell-glow-1)" }}
              />

              <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
                    Diseño Humano
                  </p>
                  <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-[color:var(--shell-texto)] lg:text-[30px]">
                    Calculá tu diseño
                  </h1>
                  <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[color:var(--shell-texto-secundario)]">
                    Ingresá tus datos para abrir tipo, autoridad, perfil, centros, canales y activaciones en una lectura compacta.
                  </p>
                </div>

                <div className={cn(PANEL_CLARO, "p-4 lg:p-5")}>
                  <div className="rounded-[18px] border p-5" style={ESTILO_PANEL_HD_SUAVE}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
                      Datos de nacimiento
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--shell-texto-secundario)]">
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
                    <div className="mt-4 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--shell-badge-error-borde)", background: "var(--shell-badge-error-fondo)" }}>
                      <p className="text-[13px] text-[color:var(--shell-badge-error-texto)]">
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
        <div className={cn(LISTA_EXPLORACION_HD, "divide-y divide-[var(--shell-borde)]")}>
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
        <div className={cn(LISTA_EXPLORACION_HD, "divide-y divide-[var(--shell-borde)]")}>
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
      <div className={cn(LISTA_EXPLORACION_HD, "divide-y divide-[var(--shell-borde)]")}>
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
      <div className={FONDO_PAGINA_HD} style={ESTILO_FONDO_HD}>
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
            <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
              <button
                onClick={cerrarSeleccion}
                className="absolute inset-0"
                style={{ background: "var(--shell-overlay-suave)" }}
                aria-label="Cerrar detalle"
              />
              <div
                className="tema-superficie-panel relative overflow-y-auto overflow-x-hidden scroll-sutil rounded-t-[28px] border-t"
                style={{
                  maxHeight: "calc(90vh - var(--tab-bar-height) - env(safe-area-inset-bottom, 0px))",
                  paddingBottom: "calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div
                  className="sticky top-0 z-10 flex justify-center rounded-t-[28px] pt-3 pb-2"
                  style={{ background: "var(--shell-superficie-fuerte)" }}
                >
                  <div className="h-1 w-10 rounded-full" style={{ background: "var(--shell-borde-fuerte)" }} />
                </div>
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
