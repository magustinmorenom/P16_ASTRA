"use client";

import Link from "next/link";
import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

export default function PaginaSuscripcionExito() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      {/* Icono de exito */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-exito/15 border border-exito/30">
        <Icono nombre="check" tamaño={40} className="text-exito" />
      </div>

      {/* Texto */}
      <h1 className="text-3xl font-bold text-texto">
        Pago exitoso
      </h1>
      <p className="text-texto-secundario max-w-md">
        Tu suscripcion Premium esta activa. Ya puedes disfrutar de todas las
        funcionalidades avanzadas de CosmicEngine.
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
