"use client";

import { EstadoTerminal } from "@/componentes/ui/estado-terminal";

const URL_APP = "https://theastra.xyz/suscripcion";

export default function PaginaCheckoutPendiente() {
  return (
    <EstadoTerminal
      ocuparPantalla
      tono="pendiente"
      etiqueta="Checkout pendiente"
      titulo="Pago pendiente"
      descripcion="El pago sigue en revisión. Cuando MercadoPago lo confirme, vas a ver el cambio reflejado en ASTRA."
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
