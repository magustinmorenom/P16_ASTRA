"use client";

import {
  useStoreTema,
  type EsquemaTema,
  type PreferenciaTema,
} from "@/lib/stores/store-tema";

interface ResultadoUsarTema {
  preferencia: PreferenciaTema;
  esquema: EsquemaTema;
  esOscuro: boolean;
  cargado: boolean;
  setPreferencia: (preferencia: PreferenciaTema) => void;
}

export function usarTema(): ResultadoUsarTema {
  const preferencia = useStoreTema((estado) => estado.preferencia);
  const esquema = useStoreTema((estado) => estado.esquemaActivo);
  const cargado = useStoreTema((estado) => estado.cargado);
  const setPreferencia = useStoreTema((estado) => estado.setPreferencia);

  return {
    preferencia,
    esquema,
    esOscuro: esquema === "oscuro",
    cargado,
    setPreferencia,
  };
}

