"use client";

import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

const URL_APP = "https://theastra.xyz/suscripcion";

export default function PaginaCheckoutPendiente() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center max-w-md">
      {/* Logo */}
      <img
        src="/img/logo-astra-blanco.png"
        alt="ASTRA"
        className="h-10 mb-2"
      />

      {/* Icono de pendiente */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-advertencia/15 border border-advertencia/30">
        <Icono nombre="reloj" tamaño={40} className="text-advertencia" />
      </div>

      <h1 className="text-3xl font-bold text-texto">
        Pago pendiente
      </h1>
      <p className="text-texto-secundario">
        Tu pago esta siendo procesado. Te notificaremos cuando se confirme.
        Esto puede tardar unos minutos.
      </p>

      <a href={URL_APP} target="_blank" rel="noopener noreferrer" className="w-full">
        <Boton variante="primario" tamaño="lg" className="w-full">
          Volver a ASTRA
        </Boton>
      </a>

      <p className="text-xs text-texto-secundario/60">
        Si el boton no funciona, abri tu navegador e ingresa a theastra.xyz
      </p>
    </div>
  );
}
