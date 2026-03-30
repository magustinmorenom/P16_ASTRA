export interface Perfil {
  id: string;
  usuario_id?: string | null;
  nombre: string;
  fecha_nacimiento: string;
  hora_nacimiento: string;
  ciudad_nacimiento: string;
  pais_nacimiento: string;
  latitud: number | null;
  longitud: number | null;
  zona_horaria: string | null;
  creado_en?: string;
}
