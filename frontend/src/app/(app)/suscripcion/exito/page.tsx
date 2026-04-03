"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { Icono } from "@/componentes/ui/icono";
import { Boton } from "@/componentes/ui/boton";
import { usarVerificarEstado } from "@/lib/hooks";

type EstadoVisual = "verificando" | "confirmado" | "timeout";

const MAX_INTENTOS = 20; // 20 * 3s = 60s

export default function PaginaSuscripcionExito() {
  const queryClient = useQueryClient();
  const [estadoVisual, setEstadoVisual] = useState<EstadoVisual>("verificando");
  const intentosRef = useRef(0);
  const confirmedRef = useRef(false);

  const habilitado = estadoVisual === "verificando";
  const { data } = usarVerificarEstado(habilitado);

  useEffect(() => {
    if (!habilitado) return;

    // Contar intentos
    intentosRef.current += 1;

    if (data?.es_premium && !confirmedRef.current) {
      confirmedRef.current = true;
      const timeoutId = window.setTimeout(() => {
        setEstadoVisual("confirmado");
        queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
        queryClient.invalidateQueries({ queryKey: ["planes"] });
        queryClient.invalidateQueries({ queryKey: ["pagos"] });
        queryClient.invalidateQueries({ queryKey: ["facturas"] });
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    if (intentosRef.current >= MAX_INTENTOS && !confirmedRef.current) {
      const timeoutId = window.setTimeout(() => {
        setEstadoVisual("timeout");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [data, habilitado, queryClient]);

  return (
    <section className="relative min-h-full overflow-hidden bg-[#16011B] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.2),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(179,136,255,0.12),transparent_26%)]" />
      <div className="relative z-10 mx-auto max-w-xl">
        <div className="rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_30%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] p-6 text-center shadow-[0_24px_70px_rgba(8,2,22,0.38)]">
      {/* ---- Estado: Verificando ---- */}
      {estadoVisual === "verificando" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,77,255,0.88),rgba(179,136,255,0.7))]">
            <div className="animate-spin">
              <Icono nombre="reloj" tamaño={28} className="text-white" />
            </div>
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
            Verificando pago...
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/62">
            Estamos confirmando tu pago con MercadoPago. Esto puede tomar unos
            segundos.
          </p>
        </>
      )}

      {/* ---- Estado: Confirmado ---- */}
      {estadoVisual === "confirmado" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-emerald-400/18 bg-emerald-500/[0.12]">
            <Icono nombre="check" tamaño={28} className="text-emerald-200" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
            Pago exitoso
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/62">
            Tu suscripción de pago ya está activa y el acceso quedó actualizado.
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
        </>
      )}

      {/* ---- Estado: Timeout ---- */}
      {estadoVisual === "timeout" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06]">
            <Icono nombre="reloj" tamaño={28} className="text-[#D8C0FF]" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-white">
            Pago en proceso
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/62">
            El pago fue recibido, pero todavía no se confirmó. El acceso se va a
            actualizar automáticamente cuando MercadoPago lo cierre.
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
        </>
      )}
        </div>
      </div>
    </section>
  );
}
