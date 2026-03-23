/**
 * Tipos para perfiles de nacimiento de CosmicEngine.
 * Datos persistidos para reutilizar en cálculos.
 */

/** Perfil de nacimiento almacenado en la base de datos. */
export interface Perfil {
  id: string;
  usuario_id?: string | null;
  nombre: string;
  /** Formato: YYYY-MM-DD */
  fecha_nacimiento: string;
  /** Formato: HH:MM:SS */
  hora_nacimiento: string;
  ciudad_nacimiento: string;
  pais_nacimiento: string;
  latitud: number | null;
  longitud: number | null;
  zona_horaria: string | null;
  /** Fecha ISO 8601 de creación. */
  creado_en?: string;
}
