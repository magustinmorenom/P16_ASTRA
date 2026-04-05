import * as Haptics from "expo-haptics";

/**
 * Taxonomia de feedback haptico ASTRA.
 * Cada funcion corresponde a un tipo de interaccion especifica.
 */
export const haptico = {
  /** Tap en boton, card, o elemento interactivo */
  toque: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Cambio de seleccion (tab, toggle, picker) */
  seleccion: () => Haptics.selectionAsync(),

  /** Accion completada con exito (perfil guardado, calculo listo) */
  exito: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Error o validacion fallida */
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Accion importante confirmada (eliminar cuenta, cancelar suscripcion) */
  impacto: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
};
