import type { TipoPodcast } from "@/lib/tipos";

export const LIMITE_VISIBLE_HISTORIAL_PODCAST = 5;

export const COPY_PODCAST_WEB: Record<
  TipoPodcast,
  {
    etiquetaCard: string;
    mensajeCard: string;
    etiquetaReproductor: string;
  }
> = {
  dia: {
    etiquetaCard: "Podcast diario",
    mensajeCard: "Cómo influyen hoy los tránsitos específicamente en vos.",
    etiquetaReproductor: "Podcast del día",
  },
  semana: {
    etiquetaCard: "Podcast semanal",
    mensajeCard: "Revisemos cómo viene tu semana y dónde conviene enfocarte.",
    etiquetaReproductor: "Podcast de la semana",
  },
  mes: {
    etiquetaCard: "Podcast mensual",
    mensajeCard: "Ampliá tu horizonte y preparate sabiendo cómo viene tu mes.",
    etiquetaReproductor: "Podcast del mes",
  },
};
