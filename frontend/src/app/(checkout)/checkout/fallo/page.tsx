"use client";

import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

const URL_APP = "https://theastra.xyz/suscripcion";

export default function PaginaCheckoutFallo() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center max-w-md">
      {/* Logo */}
      <img
        src="/img/logo-astra-blanco.png"
        alt="ASTRA"
        className="h-10 mb-2"
      />

      {/* Icono de error */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-error/15 border border-error/30">
        <Icono nombre="x" tamaño={40} className="text-error" />
      </div>

      <h1 className="text-3xl font-bold text-texto">
        Error en el pago
      </h1>
      <p className="text-texto-secundario">
        No pudimos procesar tu pago. Verifica los datos de tu medio de pago
        e intenta nuevamente desde la app.
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
