"use client";

import { EstadoTerminal } from "@/componentes/ui/estado-terminal";

const URL_APP = "https://theastra.xyz/suscripcion";

export default function PaginaCheckoutFallo() {
  return (
    <EstadoTerminal
      ocuparPantalla
      tono="error"
      etiqueta="Checkout con error"
      titulo="Error en el pago"
      descripcion="No pudimos procesarlo. Revisá el medio de pago y reintentá desde ASTRA."
      nota="Si no abre solo, ingresá manualmente a theastra.xyz/suscripcion."
      acciones={[
        {
          etiqueta: "Volver a ASTRA",
          href: URL_APP,
          externo: true,
        },
      ]}
    />
  );
}
