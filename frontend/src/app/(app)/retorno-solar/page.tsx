"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { FeatureProximamente } from "@/componentes/proximamente/feature-proximamente";

export default function PaginaRetornoSolar() {
  return (
    <>
      <HeaderMobile titulo="Revolución Solar" mostrarAtras />

      <FeatureProximamente
        titulo="Revolución Solar"
        descripcion="Esta lectura va a mostrar el instante exacto en el que el Sol vuelve a tu posición natal y lo va a convertir en una guía visual del nuevo año personal que se abre para vos."
        icono="astrologia"
        resumen={[
          {
            titulo: "Instante exacto",
            descripcion: "Cálculo preciso del regreso solar para tu nuevo ciclo.",
            icono: "reloj",
          },
          {
            titulo: "Carta comparada",
            descripcion: "Lectura entre natal y revolución para entender énfasis del año.",
            icono: "retornoSolar",
          },
          {
            titulo: "Tema anual",
            descripcion: "Un resumen visual de focos, aprendizajes y oportunidades.",
            icono: "brujula",
          },
        ]}
        puntos={[
          {
            titulo: "Nuevo mapa del año",
            descripcion: "Va a sintetizar qué áreas toman protagonismo en tu próximo ciclo y dónde se concentra tu energía disponible.",
          },
          {
            titulo: "Comparativa natal",
            descripcion: "Va a señalar qué planetas y casas del retorno activan puntos sensibles de tu carta base para leer el año con contexto.",
          },
          {
            titulo: "Narrativa clara",
            descripcion: "Va a traducir la técnica astrológica en una experiencia más guiada, visual y fácil de interpretar.",
          },
        ]}
        nota="La idea es que esta sección combine precisión astronómica con una lectura anual más editorial: menos tabla cruda y más orientación sobre el ciclo que empieza."
      />
    </>
  );
}
