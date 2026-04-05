"use client";

import { useEffect } from "react";

import { useStoreTema } from "@/lib/stores/store-tema";

const MEDIA_QUERY_OSCURO = "(prefers-color-scheme: dark)";

interface PropiedadesProveedorTema {
  children: React.ReactNode;
}

export function ProveedorTema({ children }: PropiedadesProveedorTema) {
  const inicializarTema = useStoreTema((estado) => estado.inicializarTema);
  const sincronizarSistema = useStoreTema((estado) => estado.sincronizarSistema);

  useEffect(() => {
    inicializarTema();

    const media = window.matchMedia(MEDIA_QUERY_OSCURO);
    const manejarCambio = () => sincronizarSistema();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", manejarCambio);
      return () => media.removeEventListener("change", manejarCambio);
    }

    media.addListener(manejarCambio);
    return () => media.removeListener(manejarCambio);
  }, [inicializarTema, sincronizarSistema]);

  return <>{children}</>;
}

