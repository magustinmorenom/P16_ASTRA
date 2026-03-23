"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreAuth } from "@/lib/stores/store-auth";

export default function PaginaInicio() {
  const router = useRouter();
  const { autenticado, cargando } = useStoreAuth();

  useEffect(() => {
    if (cargando) return;
    if (autenticado) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [autenticado, cargando, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-fondo">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
        <p className="text-texto-secundario text-sm">Cargando ASTRA...</p>
      </div>
    </div>
  );
}
