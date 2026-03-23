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
      setEstadoVisual("confirmado");
      // Invalidar queries para refrescar estado en toda la app
      queryClient.invalidateQueries({ queryKey: ["mi-suscripcion"] });
      queryClient.invalidateQueries({ queryKey: ["planes"] });
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      return;
    }

    if (intentosRef.current >= MAX_INTENTOS && !confirmedRef.current) {
      setEstadoVisual("timeout");
    }
  }, [data, habilitado, queryClient]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      {/* ---- Estado: Verificando ---- */}
      {estadoVisual === "verificando" && (
        <>
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-acento/15 border border-acento/30">
            <div className="animate-spin">
              <Icono nombre="reloj" tamaño={40} className="text-acento" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-texto">
            Verificando pago...
          </h1>
          <p className="text-texto-secundario max-w-md">
            Estamos confirmando tu pago con MercadoPago. Esto puede tomar unos
            segundos.
          </p>
        </>
      )}

      {/* ---- Estado: Confirmado ---- */}
      {estadoVisual === "confirmado" && (
        <>
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-exito/15 border border-exito/30">
            <Icono nombre="check" tamaño={40} className="text-exito" />
          </div>

          <h1 className="text-3xl font-bold text-texto">
            Pago exitoso
          </h1>
          <p className="text-texto-secundario max-w-md">
            Tu suscripcion Premium esta activa. Ya puedes disfrutar de todas las
            funcionalidades avanzadas de CosmicEngine.
          </p>

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
        </>
      )}

      {/* ---- Estado: Timeout ---- */}
      {estadoVisual === "timeout" && (
        <>
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-advertencia/15 border border-advertencia/30">
            <Icono nombre="reloj" tamaño={40} className="text-advertencia" />
          </div>

          <h1 className="text-3xl font-bold text-texto">
            Pago en proceso
          </h1>
          <p className="text-texto-secundario max-w-md">
            Tu pago fue recibido pero aun no se confirmo. Tu plan Premium se
            activara automaticamente en unos minutos cuando MercadoPago lo
            confirme.
          </p>

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
        </>
      )}
    </div>
  );
}
