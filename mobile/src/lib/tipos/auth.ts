export interface EsquemaRegistro {
  email: string;
  nombre: string;
  contrasena: string;
}

export interface EsquemaLogin {
  email: string;
  contrasena: string;
}

export interface EsquemaCambioContrasena {
  contrasena_actual: string;
  contrasena_nueva: string;
}

export interface EsquemaSolicitarReset {
  email: string;
}

export interface EsquemaVerificarOtp {
  email: string;
  codigo: string;
}

export interface EsquemaConfirmarReset {
  token: string;
  contrasena_nueva: string;
}

export interface EsquemaEliminarCuenta {
  contrasena?: string;
  token_refresco: string;
}

export interface RespuestaTokens {
  token_acceso: string;
  token_refresco: string;
  tipo: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
  verificado: boolean;
  proveedor_auth: string;
  ultimo_acceso?: string | null;
  creado_en: string;
}

export interface UsuarioConSuscripcion extends Usuario {
  plan_slug?: string | null;
  plan_nombre?: string | null;
  suscripcion_estado?: string | null;
  tiene_perfil?: boolean;
}

export interface RespuestaRegistroLogin {
  usuario: Pick<Usuario, "id" | "email" | "nombre">;
  token_acceso: string;
  token_refresco: string;
  tipo: string;
}

export interface RespuestaTokenReset {
  token: string;
}
