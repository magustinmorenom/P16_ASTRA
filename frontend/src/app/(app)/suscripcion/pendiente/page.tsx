"use client";

import { EstadoTerminal } from "@/componentes/ui/estado-terminal";

export default function PaginaSuscripcionPendiente() {
  return (
    <EstadoTerminal
      tono="pendiente"
      etiqueta="Suscripción pendiente"
      titulo="Pago pendiente"
      descripcion="El pago se está procesando. Cuando MercadoPago lo confirme, el acceso se actualizará automáticamente."
      acciones={[
        { etiqueta: "Ir al dashboard", href: "/dashboard" },
        { etiqueta: "Ver mi suscripción", href: "/suscripcion", variante: "secundario" },
      ]}
    />
  );
}
