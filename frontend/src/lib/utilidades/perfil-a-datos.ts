import type { Perfil, DatosNacimiento, DatosNumerologia } from "@/lib/tipos";

/**
 * Convierte un Perfil almacenado en DatosNacimiento para los endpoints de calculo.
 * hora_nacimiento viene como "HH:MM:SS" del backend → se recorta a "HH:MM".
 */
export function perfilADatosNacimiento(perfil: Perfil): DatosNacimiento {
  return {
    nombre: perfil.nombre,
    fecha_nacimiento: perfil.fecha_nacimiento,
    hora_nacimiento: perfil.hora_nacimiento.slice(0, 5),
    ciudad_nacimiento: perfil.ciudad_nacimiento,
    pais_nacimiento: perfil.pais_nacimiento,
  };
}

/**
 * Convierte un Perfil en DatosNumerologia (solo necesita nombre + fecha).
 */
export function perfilADatosNumerologia(perfil: Perfil): DatosNumerologia {
  return {
    nombre: perfil.nombre,
    fecha_nacimiento: perfil.fecha_nacimiento,
  };
}
