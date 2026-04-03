"use client";

import { EstadoTerminal } from "@/componentes/ui/estado-terminal";

export default function PaginaSuscripcionFallo() {
  return (
    <EstadoTerminal
      tono="error"
      etiqueta="Suscripción con error"
      titulo="Error en el pago"
      descripcion="No pudimos procesarlo. Revisá el medio de pago e intentá nuevamente."
      acciones={[
        { etiqueta: "Reintentar", href: "/suscripcion", icono: "cohete" },
        { etiqueta: "Ir al dashboard", href: "/dashboard", variante: "secundario" },
      ]}
    />
  );
}
