"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icono } from "@/componentes/ui/icono";
import { useStoreAuth } from "@/lib/stores/store-auth";

const caracteristicas = [
  {
    icono: "estrella" as const,
    titulo: "Carta Astral",
    descripcion: "Descubre las posiciones planetarias al momento de tu nacimiento.",
  },
  {
    icono: "cerebro" as const,
    titulo: "Diseno Humano",
    descripcion: "Conoce tu tipo, estrategia y autoridad interna.",
  },
  {
    icono: "numeral" as const,
    titulo: "Numerologia",
    descripcion: "Explora los ciclos y vibraciones de tus numeros personales.",
  },
];

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { autenticado, cargando } = useStoreAuth();

  useEffect(() => {
    if (!cargando && autenticado) {
      router.replace("/dashboard");
    }
  }, [autenticado, cargando, router]);

  /* Si ya esta autenticado, no mostrar login/registro */
  if (autenticado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo - gradient cosmico */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-950 via-violet-900 to-violet-800 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decoracion de estrellas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-1 h-1 rounded-full bg-white/60 animate-pulse" />
          <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse delay-300" />
          <div className="absolute bottom-[30%] left-[25%] w-1 h-1 rounded-full bg-white/50 animate-pulse delay-700" />
          <div className="absolute top-[60%] right-[35%] w-0.5 h-0.5 rounded-full bg-white/70 animate-pulse delay-500" />
          <div className="absolute bottom-[15%] right-[15%] w-1 h-1 rounded-full bg-white/30 animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center">
          <Image
            src="/img/logo-astra-blanco.png"
            alt="ASTRA"
            width={240}
            height={64}
            className="h-16 w-auto mb-4"
            priority
          />
          <p className="text-violet-300 text-lg mb-12">
            Tu mapa cósmico personal
          </p>

          <div className="space-y-6 max-w-sm text-left">
            {caracteristicas.map((item) => (
              <div key={item.titulo} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icono
                    nombre={item.icono}
                    tamaño={20}
                    className="text-violet-300"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.titulo}</h3>
                  <p className="text-sm text-violet-300/80">
                    {item.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex-1 flex items-center justify-center bg-fondo p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
