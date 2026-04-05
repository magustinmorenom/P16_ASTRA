"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { EstadoTerminal } from "@/componentes/ui/estado-terminal";
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
    <>
      {estadoVisual === "verificando" && (
        <EstadoTerminal
          tono="verificando"
          etiqueta="Confirmación de suscripción"
          titulo="Verificando pago..."
          descripcion="Estamos confirmando tu pago con MercadoPago. Esto puede tomar unos segundos."
          acciones={[]}
        />
      )}

      {estadoVisual === "confirmado" && (
        <EstadoTerminal
          tono="exito"
          etiqueta="Suscripción confirmada"
          titulo="Pago exitoso"
          descripcion="Tu suscripción de pago ya está activa y el acceso quedó actualizado."
          acciones={[
            { etiqueta: "Ir al dashboard", href: "/dashboard" },
            { etiqueta: "Ver mi suscripción", href: "/suscripcion", variante: "secundario" },
          ]}
        />
      )}

      {estadoVisual === "timeout" && (
        <EstadoTerminal
          tono="pendiente"
          etiqueta="Confirmación pendiente"
          titulo="Pago en proceso"
          descripcion="El pago fue recibido, pero todavía no se confirmó. El acceso se va a actualizar automáticamente cuando MercadoPago lo cierre."
          acciones={[
            { etiqueta: "Ir al dashboard", href: "/dashboard" },
            { etiqueta: "Ver mi suscripción", href: "/suscripcion", variante: "secundario" },
          ]}
        />
      )}
    </>
  );
}
