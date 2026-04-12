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
  EtapaVida,
  MesPersonalItem,
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

// Calendario Cósmico
export type {
  PlanetaCalendario,
  TransitosDia,
  CalendarioRango,
} from "./calendario-cosmico";

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

// Oráculo
export type {
  CodigoVinculacion,
  EstadoVinculacion,
} from "./oraculo";

// Podcasts
export type {
  TipoPodcast,
  SegmentoLetra,
  PodcastEpisodio,
} from "./podcast";

// Chat
export type {
  MensajeChat,
  RespuestaChat,
  HistorialChat,
  NuevaConversacion,
  ConversacionResumen,
  CambiarConversacionRespuesta,
} from "./chat";

// Explicar (micro-chat sobre selección)
export type {
  ExplicarRequest,
  ExplicarResponse,
  SeleccionActiva,
} from "./explicar";

// Pronóstico Cósmico
export type {
  ClimaCosmicoDTO,
  AreaVidaDTO,
  MomentoClaveDTO,
  AlertaCosmicaDTO,
  ConsejoHDDTO,
  LunaInfoDTO,
  NumeroPersonalDTO,
  AccesoPronosticoDTO,
  PronosticoDiarioDTO,
  DiaSemanalDTO,
  PronosticoSemanalDTO,
} from "./pronostico";
