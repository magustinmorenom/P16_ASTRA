"use client";

import { EstadoTerminal } from "@/componentes/ui/estado-terminal";

const URL_APP = "https://theastra.xyz/suscripcion";

export default function PaginaCheckoutExito() {
  return (
    <EstadoTerminal
      ocuparPantalla
      tono="exito"
      etiqueta="Checkout confirmado"
      titulo="Pago exitoso"
      descripcion="Tu plan de pago ya quedó activo. Podés volver a ASTRA y seguir desde la sección de suscripción."
      nota="Si no abre solo, ingresá manualmente a theastra.xyz/suscripcion."
      acciones={[
        {
          etiqueta: "Abrir ASTRA",
          href: URL_APP,
          externo: true,
        },
      ]}
    />
  );
}
