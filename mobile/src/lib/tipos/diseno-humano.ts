export interface Activacion {
  planeta: string;
  longitud: number;
  puerta: number;
  linea: number;
  color: number;
}

export interface Canal {
  puertas: [number, number];
  nombre: string;
  centros: [string, string];
}

export interface CruzEncarnacion {
  puertas: (number | null)[];
  sol_consciente: number | null;
  tierra_consciente: number | null;
  sol_inconsciente: number | null;
  tierra_inconsciente: number | null;
}

export type MapaCentros = Record<string, "definido" | "abierto">;

export interface DisenoHumano {
  tipo: string;
  autoridad: string;
  perfil: string;
  definicion: string;
  cruz_encarnacion: CruzEncarnacion;
  centros: MapaCentros;
  canales: Canal[];
  activaciones_conscientes: Activacion[];
  activaciones_inconscientes: Activacion[];
  puertas_conscientes: number[];
  puertas_inconscientes: number[];
  dia_juliano_consciente: number;
  dia_juliano_inconsciente: number;
}

export interface DisenoHumanoConDatos extends DisenoHumano {
  nombre: string;
  fecha_nacimiento: string;
  hora_nacimiento: string;
  ciudad: string;
  pais: string;
  latitud: number;
  longitud: number;
  zona_horaria: string;
}
