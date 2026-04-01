const PLANES_PAGO = new Set(["premium", "max"]);

export function esPlanPago(planSlug?: string | null): boolean {
  return !!planSlug && PLANES_PAGO.has(planSlug);
}

export function esPlanMax(planSlug?: string | null): boolean {
  return planSlug === "max";
}

export function obtenerEtiquetaPlan(
  planSlug?: string | null,
  planNombre?: string | null,
): string {
  if (planSlug === "gratis") return "Free";
  if (planSlug === "premium") return "Premium";
  if (planSlug === "max") return "Max";

  return planNombre ?? "Free";
}

export function obtenerFrasePlan(planSlug?: string | null): string {
  if (planSlug === "max") {
    return "Tu capa más alta en ASTRA. Beneficios y acceso en expansión.";
  }

  if (planSlug === "premium") {
    return "Tu cuenta ya tiene acceso a la experiencia completa actual.";
  }

  return "Tu base está lista. Subís de plan sólo cuando necesitás más profundidad.";
}
