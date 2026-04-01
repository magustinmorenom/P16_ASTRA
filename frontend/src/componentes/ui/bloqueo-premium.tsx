"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { esPlanPago } from "@/lib/utilidades/planes";

interface BloqueoPremiumProps {
  children: ReactNode;
  mensaje?: string;
}

/**
 * Wrapper que bloquea el contenido si el usuario no tiene un plan pago.
 * Muestra un overlay con blur + CTA a /suscripcion.
 */
export function BloqueoPremium({
  children,
  mensaje = "Esta función es exclusiva de los planes Premium y Max",
}: BloqueoPremiumProps) {
  const usuario = useStoreAuth((s) => s.usuario);
  const tienePlanPago = esPlanPago(usuario?.plan_slug);

  if (tienePlanPago) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-fondo/60 backdrop-blur-[2px] rounded-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-advertencia/10">
          <Icono nombre="corona" tamaño={24} className="text-advertencia" />
        </div>
        <p className="text-sm text-texto-secundario text-center max-w-xs px-4">
          {mensaje}
        </p>
        <Link href="/suscripcion">
          <Boton variante="primario" tamaño="sm">
            <Icono nombre="corona" tamaño={14} />
            Ver planes
          </Boton>
        </Link>
      </div>
    </div>
  );
}
