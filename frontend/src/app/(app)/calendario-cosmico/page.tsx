"use client";

import HeaderMobile from "@/componentes/layouts/header-mobile";
import { FeatureProximamente } from "@/componentes/proximamente/feature-proximamente";

export default function PaginaCalendarioCosmico() {
  return (
    <>
      <HeaderMobile titulo="Calendario Cósmico" mostrarAtras />

      <FeatureProximamente
        titulo="Calendario Cósmico"
        descripcion="Un espacio para ordenar tu semana y tu mes con una lectura clara de tránsitos, ventanas energéticas y momentos personales de mayor expansión, pausa o introspección."
        icono="horoscopo"
        resumen={[
          {
            titulo: "Lectura diaria",
            descripcion: "Qué energía domina hoy y cómo conviene atravesarla.",
            icono: "sol",
          },
          {
            titulo: "Ventanas clave",
            descripcion: "Días para activar, revisar, cerrar o bajar el ritmo.",
            icono: "calendario",
          },
          {
            titulo: "Vista mensual",
            descripcion: "Panorama visual para anticiparte a los cambios del ciclo.",
            icono: "estrellaFugaz",
          },
        ]}
        puntos={[
          {
            titulo: "Cruce personalizado",
            descripcion: "Va a combinar tus tránsitos del día con tu carta natal y tu pulso personal para que la lectura no sea genérica.",
          },
          {
            titulo: "Señales accionables",
            descripcion: "Va a destacar cuándo conviene iniciar, sostener, observar o cuidar energía en lugar de mostrar solo datos técnicos.",
          },
          {
            titulo: "Ritmo de la semana",
            descripcion: "Va a traducir el movimiento cósmico en una agenda visual simple para planificar mejor tus decisiones.",
          },
        ]}
        nota="La primera versión va a priorizar una vista diaria y mensual con foco en claridad visual, prioridades energéticas y explicación breve de cada jornada."
      />
    </>
  );
}
