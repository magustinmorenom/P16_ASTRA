"use client";

import Link from "next/link";
import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

export default function PaginaSuscripcionPendiente() {
  return (
    <section className="relative min-h-full overflow-hidden bg-[#16011B] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.2),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(179,136,255,0.12),transparent_26%)]" />
      <div className="relative z-10 mx-auto max-w-xl">
        <div className="rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_30%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] p-6 text-center shadow-[0_24px_70px_rgba(8,2,22,0.38)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06]">
            <Icono nombre="reloj" tamaño={28} className="text-[#D8C0FF]" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
            Pago pendiente
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/62">
            El pago se está procesando. Cuando MercadoPago lo confirme, el acceso
            se actualizará automáticamente.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Boton variante="primario" tamaño="lg" className="rounded-full bg-[#7C4DFF] text-white hover:bg-[#8F66FF]">
                Ir al dashboard
              </Boton>
            </Link>
            <Link href="/suscripcion">
              <Boton variante="fantasma" tamaño="lg" className="rounded-full border border-white/10 bg-transparent text-white/72 hover:bg-white/[0.06] hover:text-white">
                Ver mi suscripción
              </Boton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
