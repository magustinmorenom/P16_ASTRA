export interface ResultadoValidacion {
  minimo: boolean;
  mayuscula: boolean;
  numero: boolean;
  simbolo: boolean;
}

export interface ResultadoValidacionCompleta extends ResultadoValidacion {
  coincide: boolean;
}

/** Valida los requisitos individuales de una contrasena */
export function validarContrasena(contrasena: string): ResultadoValidacion {
  return {
    minimo: contrasena.length >= 8,
    mayuscula: /[A-Z]/.test(contrasena),
    numero: /\d/.test(contrasena),
    simbolo: /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/`~]/.test(contrasena),
  };
}

/** Valida contrasena + confirmacion */
export function validarContrasenaCompleta(
  contrasena: string,
  confirmacion: string,
): ResultadoValidacionCompleta {
  return {
    ...validarContrasena(contrasena),
    coincide:
      confirmacion.length > 0 && contrasena.length > 0
        ? contrasena === confirmacion
        : false,
  };
}

/** Retorna true si todos los requisitos se cumplen */
export function esContrasenaValida(validacion: ResultadoValidacion): boolean {
  return (
    validacion.minimo &&
    validacion.mayuscula &&
    validacion.numero &&
    validacion.simbolo
  );
}

/** Retorna true si contrasena + confirmacion son validas */
export function esContrasenaCompletaValida(
  validacion: ResultadoValidacionCompleta,
): boolean {
  return esContrasenaValida(validacion) && validacion.coincide;
}
