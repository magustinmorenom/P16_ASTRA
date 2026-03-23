import type { CartaNatal } from "./natal";
import type { DisenoHumano } from "./diseno-humano";
import type { Numerologia } from "./numerologia";
import type { RetornoSolar } from "./retorno-solar";

/**
 * Cálculos persistidos del usuario, agrupados por tipo.
 * Devuelto por GET /profile/me/calculos.
 */
export interface CalculosPerfil {
  natal: CartaNatal | null;
  diseno_humano: DisenoHumano | null;
  numerologia: Numerologia | null;
  retorno_solar: RetornoSolar | null;
}
