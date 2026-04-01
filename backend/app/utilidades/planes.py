"""Helpers para interpretar niveles de suscripción."""

JERARQUIA_PLANES = {
    "gratis": 0,
    "premium": 1,
    "max": 2,
}

PLANES_PAGO = {"premium", "max"}


def es_plan_pago(plan_slug: str | None) -> bool:
    """Retorna True si el plan habilita acceso pago."""
    return plan_slug in PLANES_PAGO


def cumple_nivel(plan_slug: str | None, nivel_minimo: str = "premium") -> bool:
    """Retorna True si el plan alcanza o supera el nivel requerido."""
    nivel_actual = JERARQUIA_PLANES.get(plan_slug or "gratis", 0)
    nivel_requerido = JERARQUIA_PLANES.get(nivel_minimo, 0)
    return nivel_actual >= nivel_requerido
