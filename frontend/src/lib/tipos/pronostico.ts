/** Tipos del Pronóstico Cósmico */

export interface ClimaCosmicoDTO {
  estado: "despejado" | "soleado" | "nublado" | "tormenta" | "arcoiris";
  titulo: string;
  frase_sintesis: string;
  energia: number;
  claridad: number;
  intuicion: number;
}

export interface AreaVidaDTO {
  id: string;
  nombre: string;
  nivel: "favorable" | "neutro" | "precaucion";
  icono: string;
  frase: string;
  detalle: string;
}

export interface MomentoClaveDTO {
  bloque: "manana" | "tarde" | "noche";
  titulo: string;
  icono: string;
  frase: string;
  nivel: "favorable" | "neutro" | "precaucion";
  accionables?: string[];
}

export interface AlertaCosmicaDTO {
  tipo: string;
  titulo: string;
  descripcion: string;
  urgencia: "baja" | "media" | "alta";
}

export interface ConsejoHDDTO {
  titulo: string;
  mensaje: string;
  centro_destacado: string;
}

export interface LunaInfoDTO {
  signo: string;
  fase: string;
  significado: string;
}

export interface NumeroPersonalDTO {
  numero: number;
  descripcion: string;
}

export interface AccesoPronosticoDTO {
  pronostico_clima: boolean;
  pronostico_areas: boolean;
  pronostico_momentos: boolean;
  pronostico_alertas: boolean;
  pronostico_semana: boolean;
  pronostico_consejo_hd: boolean;
  pronostico_detalle_area: boolean;
}

export interface PronosticoDiarioDTO {
  clima: ClimaCosmicoDTO;
  areas: AreaVidaDTO[];
  momentos: MomentoClaveDTO[];
  alertas: AlertaCosmicaDTO[];
  consejo_hd: ConsejoHDDTO;
  luna: LunaInfoDTO;
  numero_personal: NumeroPersonalDTO;
  acceso: AccesoPronosticoDTO;
}

export interface DiaSemanalDTO {
  fecha: string;
  clima_estado: string;
  energia: number;
  claridad: number;
  intuicion: number;
  frase_corta: string;
  numero_personal: number;
}

export interface PronosticoSemanalDTO {
  semana: DiaSemanalDTO[];
  acceso: AccesoPronosticoDTO;
}
