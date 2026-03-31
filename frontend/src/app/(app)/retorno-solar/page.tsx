"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { FeatureProximamente } from "@/componentes/proximamente/feature-proximamente";

export default function PaginaRetornoSolar() {
  return (
    <>
      <HeaderMobile titulo="Revolución Solar" mostrarAtras />

      <FeatureProximamente
        titulo="Revolución Solar"
        descripcion="Una lectura anual pensada para mostrar con precisión el instante de tu regreso solar y convertirlo en un mapa visual del ciclo que empieza para vos."
        icono="astrologia"
      />
    </>
  );
}
