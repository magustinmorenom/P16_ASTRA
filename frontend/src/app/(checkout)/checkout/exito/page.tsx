"use client";

import Image from "next/image";

import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";

const URL_APP = "https://theastra.xyz/suscripcion";

export default function PaginaCheckoutExito() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#16011B] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.2),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(179,136,255,0.12),transparent_26%)]" />

      <div className="relative z-10 mx-auto max-w-md">
        <div className="rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_30%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] p-6 text-center shadow-[0_24px_70px_rgba(8,2,22,0.38)]">
          <Image
            src="/img/logo-astra-blanco.png"
            alt="ASTRA"
            width={145}
            height={36}
            priority
            className="mx-auto mb-5 h-9 w-auto"
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-emerald-400/18 bg-emerald-500/[0.12]">
            <Icono nombre="check" tamaño={28} className="text-emerald-200" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
            Pago exitoso
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/62">
            Tu plan de pago ya quedó activo. Podés volver a ASTRA y seguir desde
            la sección de suscripción.
          </p>

          <a href={URL_APP} target="_blank" rel="noopener noreferrer" className="mt-6 block w-full">
            <Boton variante="primario" tamaño="lg" className="w-full rounded-full bg-[#7C4DFF] text-white hover:bg-[#8F66FF]">
              Abrir ASTRA
            </Boton>
          </a>

          <p className="mt-4 text-xs leading-5 text-white/42">
            Si no abre solo, ingresá manualmente a theastra.xyz/suscripcion.
          </p>
        </div>
      </div>
    </section>
  );
}
