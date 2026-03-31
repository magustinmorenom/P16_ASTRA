"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { FeatureProximamente } from "@/componentes/proximamente/feature-proximamente";

export default function PaginaCalendarioCosmico() {
  return (
    <>
      <HeaderMobile titulo="Calendario Cósmico" mostrarAtras />

      <FeatureProximamente
        titulo="Calendario Cósmico"
        descripcion="Una agenda cósmica diseñada para leer tu día, tu semana y tu mes con foco, contraste y señales claras sobre cuándo avanzar, sostener, revisar o bajar el ritmo."
        icono="horoscopo"
      />
    </>
  );
}
