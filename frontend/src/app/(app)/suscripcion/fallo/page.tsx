"use client";

import Link from "next/link";
import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

export default function PaginaSuscripcionFallo() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      {/* Icono de error */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-error/15 border border-error/30">
        <Icono nombre="x" tamaño={40} className="text-error" />
      </div>

      {/* Texto */}
      <h1 className="text-3xl font-bold text-texto">
        Error en el pago
      </h1>
      <p className="text-texto-secundario max-w-md">
        No pudimos procesar tu pago. Verifica los datos de tu medio de pago
        e intenta nuevamente.
      </p>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        <Link href="/suscripcion">
          <Boton variante="primario" tamaño="lg" icono={<Icono nombre="cohete" tamaño={18} />}>
            Reintentar
          </Boton>
        </Link>
        <Link href="/dashboard">
          <Boton variante="secundario" tamaño="lg">
            Ir al dashboard
          </Boton>
        </Link>
      </div>
    </div>
  );
}
