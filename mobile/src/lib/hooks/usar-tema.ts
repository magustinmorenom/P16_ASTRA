import { useStoreTema, type PreferenciaTema } from "@/lib/stores/store-tema";
import type { TokensColor } from "@/constants/colores";

interface UsarTemaResult {
  colores: TokensColor;
  esOscuro: boolean;
  esquema: "light" | "dark";
  preferencia: PreferenciaTema;
  setPreferencia: (pref: PreferenciaTema) => void;
}

export function usarTema(): UsarTemaResult {
  const esquemaActivo = useStoreTema((s) => s.esquemaActivo);
  const colores = useStoreTema((s) => s.colores);
  const preferencia = useStoreTema((s) => s.preferencia);
  const setPreferencia = useStoreTema((s) => s.setPreferencia);

  return {
    colores,
    esOscuro: esquemaActivo === "dark",
    esquema: esquemaActivo,
    preferencia,
    setPreferencia,
  };
}
