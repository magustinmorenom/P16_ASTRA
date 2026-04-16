/**
 * Tipos de autenticación de CosmicEngine.
 * JWT stateless, Google OAuth, gestión de usuarios.
 */

/** Datos para registrar un nuevo usuario. */
export interface EsquemaRegistro {
  email: string;
  nombre?: string;
  /** Mínimo 8 caracteres, máximo 128. */
  contrasena: string;
}

/** Datos para iniciar sesión. */
export interface EsquemaLogin {
  email: string;
  contrasena: string;
}

/** Datos para cambiar contraseña. */
export interface EsquemaCambioContrasena {
  contrasena_actual: string;
  /** Mínimo 8 caracteres, máximo 128. */
  contrasena_nueva: string;
}

/** Datos para renovar token de acceso. */
export interface EsquemaRenovarToken {
  token_refresco: string;
}

/** Datos para cerrar sesión (invalidar refresh token). */
export interface EsquemaLogout {
  token_refresco: string;
}

/** Respuesta con tokens de autenticación. */
export interface RespuestaTokens {
  token_acceso: string;
  token_refresco: string;
  tipo: string;
}

/** Datos públicos del usuario. */
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  verificado: boolean;
  proveedor_auth: string;
  rol?: string;
  ultimo_acceso?: string | null;
  creado_en: string;
}

/**
 * Respuesta extendida de /auth/me.
 * Incluye datos de suscripción si el usuario tiene una activa.
 */
export interface UsuarioConSuscripcion extends Usuario {
  plan_slug?: string | null;
  plan_nombre?: string | null;
  suscripcion_estado?: string | null;
  tiene_perfil?: boolean;
}

/**
 * Datos contenidos en la respuesta de registro/login.
 * Combina datos del usuario con los tokens.
 */
export interface RespuestaRegistroLogin {
  usuario: Pick<Usuario, "id" | "email" | "nombre">;
  token_acceso: string;
  token_refresco: string;
  tipo: string;
}

/** Respuesta de registro que puede requerir verificación OTP. */
export interface RespuestaRegistro {
  requiere_verificacion?: boolean;
  email?: string;
  usuario?: Pick<Usuario, "id" | "email" | "nombre">;
  token_acceso?: string;
  token_refresco?: string;
}
