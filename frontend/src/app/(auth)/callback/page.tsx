"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Icono } from "@/componentes/ui/icono";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type { RespuestaRegistroLogin } from "@/lib/tipos";

export default function PaginaCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cargarUsuario } = useStoreAuth();

  const [error, setError] = useState<string | null>(null);
  const procesadoRef = useRef(false);

  useEffect(() => {
    if (procesadoRef.current) return;
    procesadoRef.current = true;

    const code = searchParams.get("code");

    if (!code) {
      setError("No se recibio el codigo de autorizacion de Google.");
      return;
    }

    async function procesarCallback(codigo: string) {
      try {
        const resp = await clienteApi.get<RespuestaRegistroLogin>(
          `/auth/google/callback?code=${encodeURIComponent(codigo)}`,
        );

        localStorage.setItem("token_acceso", resp.token_acceso);
        localStorage.setItem("token_refresco", resp.token_refresco);

        await cargarUsuario();

        const usuario = useStoreAuth.getState().usuario;
        router.push(usuario?.tiene_perfil ? "/dashboard" : "/onboarding");
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : "Error al procesar la autenticacion con Google.";
        setError(mensaje);
      }
    }

    procesarCallback(code);
  }, [searchParams, cargarUsuario, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <Icono nombre="x" tamaño={32} className="text-error" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-texto">
            Error de autenticacion
          </h2>
          <p className="mt-2 text-texto-secundario text-sm max-w-sm">
            {error}
          </p>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Volver al inicio de sesion
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-400/40 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 animate-pulse flex items-center justify-center">
          <Icono nombre="google" tamaño={20} className="text-white" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-texto">
          Conectando con Google...
        </h2>
        <p className="mt-2 text-texto-secundario text-sm">
          Espera un momento mientras completamos la autenticacion
        </p>
      </div>
    </div>
  );
}
