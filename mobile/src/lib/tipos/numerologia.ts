export interface NumeroRespuesta {
  numero: number;
  descripcion: string;
  descripcion_larga?: string;
}

export interface EtapaVida {
  numero: number;
  nombre?: string;
  descripcion: string;
  descripcion_larga?: string;
  edad_inicio: number;
  edad_fin: number | null;
}

export interface MesPersonalItem {
  mes: number;
  nombre_mes: string;
  numero: number;
  descripcion: string;
}

export interface Numerologia {
  nombre: string;
  fecha_nacimiento: string;
  sistema: string;
  camino_de_vida: NumeroRespuesta;
  expresion: NumeroRespuesta;
  impulso_del_alma: NumeroRespuesta;
  personalidad: NumeroRespuesta;
  numero_nacimiento: NumeroRespuesta;
  anio_personal: NumeroRespuesta;
  mes_personal: NumeroRespuesta;
  dia_personal: NumeroRespuesta;
  meses_personales?: MesPersonalItem[];
  etapas_de_la_vida: EtapaVida[];
  numeros_maestros_presentes: number[];
}
