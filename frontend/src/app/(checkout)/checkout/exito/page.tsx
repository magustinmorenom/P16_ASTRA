"use client";

import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

const URL_APP = "https://theastra.xyz/suscripcion";

export default function PaginaCheckoutExito() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center max-w-md">
      {/* Logo */}
      <img
        src="/img/logo-astra-blanco.png"
        alt="ASTRA"
        className="h-10 mb-2"
      />

      {/* Icono de éxito */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-exito/15 border border-exito/30">
        <Icono nombre="check" tamaño={40} className="text-exito" />
      </div>

      <h1 className="text-3xl font-bold text-texto">
        Pago exitoso
      </h1>
      <p className="text-texto-secundario">
        Tu suscripcion Premium esta activa. Ya podes disfrutar de todas las
        funcionalidades avanzadas de ASTRA.
      </p>

      {/* Botón que abre la app en el navegador real del usuario */}
      <a href={URL_APP} target="_blank" rel="noopener noreferrer" className="w-full">
        <Boton variante="primario" tamaño="lg" className="w-full">
          Abrir ASTRA
        </Boton>
      </a>

      <p className="text-xs text-texto-secundario/60">
        Si el boton no funciona, abri tu navegador e ingresa a theastra.xyz
      </p>
    </div>
  );
}
