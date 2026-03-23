"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useStoreAuth } from "@/lib/stores/store-auth";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { autenticado, cargando, usuario } = useStoreAuth();

  useEffect(() => {
    if (!cargando && !autenticado) {
      router.replace("/login");
    } else if (!cargando && autenticado && usuario?.tiene_perfil) {
      router.replace("/dashboard");
    }
  }, [autenticado, cargando, usuario, router]);

  if (cargando || !autenticado || usuario?.tiene_perfil) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
