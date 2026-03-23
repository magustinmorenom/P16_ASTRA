/**
 * Tipos de CosmicEngine -- Re-exportacion centralizada.
 * Importar desde aqui: import type { CartaNatal, Usuario, Plan } from "@/lib/tipos";
 */

// Tipos base de la API
export type {
  RespuestaBase,
  RespuestaError,
  RespuestaSalud,
  DatosNacimiento,
  DatosNumerologia,
} from "./api";

// Autenticacion
export type {
  EsquemaRegistro,
  EsquemaLogin,
  EsquemaCambioContrasena,
  EsquemaRenovarToken,
  EsquemaLogout,
  RespuestaTokens,
  Usuario,
  UsuarioConSuscripcion,
  RespuestaRegistroLogin,
} from "./auth";

// Carta Natal
export type {
  Planeta,
  Casa,
  Aspecto,
  PuntoSensible,
  CartaNatal,
} from "./natal";

// Diseno Humano
export type {
  Activacion,
  Canal,
  CruzEncarnacion,
  MapaCentros,
  DisenoHumano,
  DisenoHumanoConDatos,
} from "./diseno-humano";

// Numerologia
export type {
  NumeroRespuesta,
  Numerologia,
} from "./numerologia";

// Revolucion Solar
export type {
  FechaRetorno,
  CartaRetorno,
  AspectoNatalRetorno,
  RetornoSolar,
} from "./retorno-solar";

// Transitos
export type {
  PlanetaTransito,
  AspectoTransitoNatal,
  Transitos,
} from "./transitos";

// Perfil
export type {
  Perfil,
} from "./perfil";

// Cálculos persistidos
export type {
  CalculosPerfil,
} from "./calculos";

// Suscripciones y Pagos
export type {
  Plan,
  PrecioPais,
  PrecioPlan,
  Suscripcion,
  Pago,
  RespuestaCheckout,
  EsquemaSuscribirse,
  PaisDisponible,
  PaisDetectado,
  Factura,
  EstadoVerificacion,
} from "./suscripcion";
