"""Configuración de gating freemium/premium para features."""

from app.utilidades.planes import es_plan_pago

# Valores posibles: "freemium" (acceso libre) o "premium" (requiere suscripción)
FEATURES_CONFIG = {
    "pronostico_clima": "freemium",
    "pronostico_areas": "freemium",
    "pronostico_momentos": "freemium",
    "pronostico_alertas": "freemium",
    "pronostico_semana": "freemium",
    "pronostico_consejo_hd": "freemium",
    "pronostico_detalle_area": "freemium",
}


def obtener_acceso_pronostico(plan_usuario: str = "gratis") -> dict[str, bool]:
    """Retorna un mapa de acceso por sección según el plan del usuario."""
    acceso = {}
    for feature, nivel in FEATURES_CONFIG.items():
        if nivel == "freemium":
            acceso[feature] = True
        else:
            acceso[feature] = es_plan_pago(plan_usuario)
    return acceso
