export interface PlanetaTransito {
  nombre: string;
  longitud: number;
  latitud: number;
  signo: string;
  grado_en_signo: number;
  retrogrado: boolean;
  velocidad: number;
}

export interface AspectoTransitoNatal {
  planeta1: string;
  planeta2: string;
  tipo: string;
  angulo_exacto: number;
  orbe: number;
  aplicativo: boolean;
}

export interface Transitos {
  fecha_utc: string;
  dia_juliano: number;
  planetas: PlanetaTransito[];
  aspectos_natal: AspectoTransitoNatal[] | null;
}
