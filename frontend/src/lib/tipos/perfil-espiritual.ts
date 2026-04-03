export interface ItemFODA {
  titulo: string;
  descripcion: string;
}

export interface FODA {
  fortalezas: ItemFODA[];
  oportunidades: ItemFODA[];
  debilidades: ItemFODA[];
  amenazas: ItemFODA[];
}

export interface PerfilEspiritual {
  resumen: string;
  foda: FODA;
}
