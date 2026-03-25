"use client";

import { useMemo } from "react";

import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { BloqueoPremium } from "@/componentes/ui/bloqueo-premium";
import {
  usarPodcastHoy,
  usarPodcastHistorial,
  usarGenerarPodcast,
} from "@/lib/hooks";
import { useStoreUI, type PistaReproduccion } from "@/lib/stores/store-ui";

import type { PodcastEpisodio, TipoPodcast } from "@/lib/tipos";
import HeaderMobile from "@/componentes/layouts/header-mobile";

/** Descarga el audio de un episodio vía fetch autenticado. */
async function descargarAudio(episodioId: string, titulo: string) {
  try {
    const token = localStorage.getItem("token_acceso");
    const res = await fetch(`/api/v1/podcast/audio/${episodioId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "")}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // silenciar error
  }
}

// ---------------------------------------------------------------------------
// Config visual por tipo
// ---------------------------------------------------------------------------
const TIPO_CONFIG: Record<
  TipoPodcast,
  {
    etiqueta: string;
    icono: "sol" | "destello" | "luna";
    gradiente: string;
    desc: string;
  }
> = {
  dia: {
    etiqueta: "Tu Día",
    icono: "sol",
    gradiente: "from-[#7C4DFF] to-[#D4A234]",
    desc: "Momento Clave de tu Día",
  },
  semana: {
    etiqueta: "Tu Semana",
    icono: "destello",
    gradiente: "from-[#4A2D8C] to-[#B388FF]",
    desc: "Tu Semana Cósmica",
  },
  mes: {
    etiqueta: "Tu Mes",
    icono: "luna",
    gradiente: "from-[#2D1B69] to-[#7C4DFF]",
    desc: "Tu Mes Cósmico",
  },
};

const TIPOS: TipoPodcast[] = ["dia", "semana", "mes"];

// ---------------------------------------------------------------------------
// Card de episodio on-demand
// ---------------------------------------------------------------------------
function CardEpisodio({
  tipo,
  episodio,
  onGenerar,
  generando,
}: {
  tipo: TipoPodcast;
  episodio: PodcastEpisodio | undefined;
  onGenerar: () => void;
  generando: boolean;
}) {
  const { setPistaActual, pistaActual } = useStoreUI();
  const config = TIPO_CONFIG[tipo];
  const enReproduccion = episodio && pistaActual?.id === episodio.id;

  const reproducir = () => {
    if (!episodio || episodio.estado !== "listo") return;
    const pista: PistaReproduccion = {
      id: episodio.id,
      titulo: episodio.titulo,
      subtitulo: `Podcast ${config.etiqueta}`,
      tipo: "podcast",
      duracionSegundos: episodio.duracion_segundos ?? 0,
      icono: config.icono,
      gradiente: config.gradiente,
      url: episodio.url_audio,
      segmentos: episodio.segmentos,
    };
    setPistaActual(pista);
  };

  const estado = episodio?.estado;
  const estaGenerando =
    generando || estado === "generando_guion" || estado === "generando_audio";

  return (
    <div className="rounded-2xl border border-[#E8E4E0]/60 bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${config.gradiente} flex items-center justify-center`}
        >
          <Icono
            nombre={config.icono}
            tamaño={22}
            peso="fill"
            className="text-white/90"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#2C2926] truncate">
            {episodio?.titulo ?? config.desc}
          </p>
          <p className="text-xs text-[#8A8580]">{config.desc}</p>
        </div>
      </div>

      {/* Estado */}
      {estado === "listo" ? (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8A8580]">
            {Math.floor((episodio!.duracion_segundos ?? 0) / 60)} min
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => descargarAudio(episodio!.id, episodio!.titulo)}
              className="h-10 w-10 rounded-full flex items-center justify-center bg-[#F5F0FF] text-[#7C4DFF] hover:bg-[#E8E4F5] transition-all"
              title="Descargar audio"
            >
              <Icono nombre="descarga" tamaño={16} />
            </button>
            <button
              onClick={reproducir}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                enReproduccion
                  ? "bg-[#7C4DFF] text-white scale-110"
                  : "bg-[#F5F0FF] text-[#7C4DFF] hover:bg-[#7C4DFF] hover:text-white"
              }`}
            >
              <Icono
                nombre={enReproduccion ? "pausar" : "reproducir"}
                tamaño={18}
                peso="fill"
              />
            </button>
          </div>
        </div>
      ) : estado === "error" ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-500">Error al generar</p>
          <button
            onClick={onGenerar}
            className="text-xs text-[#7C4DFF] hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : estaGenerando ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7C4DFF] border-t-transparent" />
          <span className="text-xs text-[#8A8580]">
            {estado === "generando_guion"
              ? "Escribiendo guión..."
              : "Generando audio..."}
          </span>
        </div>
      ) : (
        /* No existe — mostrar botón generar */
        <button
          onClick={onGenerar}
          className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#F5F0FF] text-[#7C4DFF] hover:bg-[#7C4DFF] hover:text-white transition-colors text-sm font-medium"
        >
          <Icono nombre="destello" tamaño={16} peso="fill" />
          Generar
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal de podcasts
// ---------------------------------------------------------------------------
export default function PaginaPodcast() {
  const generarMutation = usarGenerarPodcast();

  // Polling rápido si hay algún episodio generándose
  const hayGenerando = generarMutation.isPending;

  const { data: episodiosHoy, isLoading: cargando } =
    usarPodcastHoy(hayGenerando);
  const { data: historial, isLoading: cargandoHistorial } =
    usarPodcastHistorial();
  const { setPistaActual, pistaActual } = useStoreUI();

  const mapaHoy = useMemo(
    () => new Map((episodiosHoy ?? []).map((ep) => [ep.tipo, ep])),
    [episodiosHoy]
  );

  // Activar polling rápido también si hay episodios en proceso
  const hayEnProceso = (episodiosHoy ?? []).some(
    (ep) => ep.estado === "generando_guion" || ep.estado === "generando_audio"
  );
  const { data: _ } = usarPodcastHoy(hayEnProceso);

  return (
    <><HeaderMobile titulo="Podcasts" />
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C4DFF] to-[#B388FF] flex items-center justify-center">
          <Icono
            nombre="microfono"
            tamaño={22}
            peso="fill"
            className="text-white"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2C2926]">
            Tus Podcasts Cósmicos
          </h1>
          <p className="text-sm text-[#8A8580]">
            Generá tu podcast del día, la semana o el mes
          </p>
        </div>
      </div>

      {/* Episodios on-demand */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-[#8A8580] uppercase tracking-wider mb-4">
          Tus Podcasts
        </h2>
        <BloqueoPremium mensaje="Los podcasts cósmicos son exclusivos del plan Premium">
          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Esqueleto key={i} className="h-[140px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TIPOS.map((tipo) => (
                <CardEpisodio
                  key={tipo}
                  tipo={tipo}
                  episodio={mapaHoy.get(tipo)}
                  onGenerar={() => generarMutation.mutate(tipo)}
                  generando={
                    generarMutation.isPending &&
                    generarMutation.variables === tipo
                  }
                />
              ))}
            </div>
          )}
        </BloqueoPremium>
      </section>

      {/* Historial */}
      <section>
        <h2 className="text-sm font-semibold text-[#8A8580] uppercase tracking-wider mb-4">
          Historial
        </h2>
        {cargandoHistorial ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Esqueleto key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        ) : !historial || historial.length === 0 ? (
          <div className="text-center py-12 text-[#C5C0BC]">
            <Icono
              nombre="microfono"
              tamaño={32}
              className="mx-auto mb-2 opacity-40"
            />
            <p className="text-sm">Aún no tenés episodios generados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historial.map((ep) => {
              const config = TIPO_CONFIG[ep.tipo] ?? TIPO_CONFIG.dia;
              const enReproduccion = pistaActual?.id === ep.id;

              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    const pista: PistaReproduccion = {
                      id: ep.id,
                      titulo: ep.titulo,
                      subtitulo: `Podcast ${config.etiqueta} — ${ep.fecha}`,
                      tipo: "podcast",
                      duracionSegundos: ep.duracion_segundos ?? 0,
                      icono: config.icono,
                      gradiente: config.gradiente,
                      url: ep.url_audio,
                      segmentos: ep.segmentos,
                    };
                    setPistaActual(pista);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    enReproduccion
                      ? "bg-[#F5F0FF] border border-[#7C4DFF]/30"
                      : "hover:bg-[#F5F0FF]/50 border border-transparent"
                  }`}
                >
                  <div
                    className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${config.gradiente} flex items-center justify-center`}
                  >
                    <Icono
                      nombre={enReproduccion ? "pausar" : "reproducir"}
                      tamaño={16}
                      peso="fill"
                      className="text-white/80"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2C2926] truncate">
                      {ep.titulo}
                    </p>
                    <p className="text-xs text-[#8A8580]">
                      {ep.fecha} ·{" "}
                      {Math.floor((ep.duracion_segundos ?? 0) / 60)} min
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      descargarAudio(ep.id, ep.titulo);
                    }}
                    className="text-[#8A8580] hover:text-[#7C4DFF] transition-colors shrink-0"
                    title="Descargar audio"
                  >
                    <Icono nombre="descarga" tamaño={16} />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
    </>
  );
}
