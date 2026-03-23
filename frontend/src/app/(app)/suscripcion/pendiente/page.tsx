"use client";

import Link from "next/link";
import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

export default function PaginaSuscripcionPendiente() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      {/* Icono de pendiente */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-advertencia/15 border border-advertencia/30">
        <Icono nombre="reloj" tamaño={40} className="text-advertencia" />
      </div>

      {/* Texto */}
      <h1 className="text-3xl font-bold text-texto">
        Pago pendiente
      </h1>
      <p className="text-texto-secundario max-w-md">
        Tu pago esta siendo procesado. Te notificaremos cuando se confirme.
        Esto puede tardar unos minutos.
      </p>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Boton variante="primario" tamaño="lg">
            Ir al dashboard
          </Boton>
        </Link>
        <Link href="/suscripcion">
          <Boton variante="secundario" tamaño="lg">
            Ver mi suscripcion
          </Boton>
        </Link>
      </div>
    </div>
  );
}
