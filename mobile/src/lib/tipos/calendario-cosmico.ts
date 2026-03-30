export interface PlanetaCalendario {
  nombre: string;
  longitud: number;
  latitud: number;
  signo: string;
  grado_en_signo: number;
  retrogrado: boolean;
  velocidad: number;
}

export interface TransitosDia {
  fecha: string;
  fecha_utc: string;
  dia_juliano: number;
  planetas: PlanetaCalendario[];
}

export interface CalendarioRango {
  fecha_inicio: string;
  fecha_fin: string;
  dias: TransitosDia[];
}
