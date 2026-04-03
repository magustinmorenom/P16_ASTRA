"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icono } from "@/componentes/ui/icono";
import { clienteApi } from "@/lib/api/cliente";
import { useStoreAuth } from "@/lib/stores/store-auth";

export default function PaginaLoginAdmin() {
  const router = useRouter();
  const { usuario, cargarUsuario } = useStoreAuth();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirigiendo, setRedirigiendo] = useState(false);

  // Si ya está logueado como admin, redirigir (una sola vez)
  useEffect(() => {
    if (usuario?.rol === "admin" && !redirigiendo) {
      setRedirigiendo(true);
      router.replace("/admin");
    }
  }, [usuario, router, redirigiendo]);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      // Login directo sin hook — control total del flujo
      const resp = await clienteApi.post<{
        token_acceso: string;
        token_refresco: string;
      }>("/auth/login", { email, contrasena });

      localStorage.setItem("token_acceso", resp.token_acceso);
      localStorage.setItem("token_refresco", resp.token_refresco);

      // Cargar usuario para obtener el rol
      await cargarUsuario();

      const usuarioActual = useStoreAuth.getState().usuario;
      if (usuarioActual?.rol !== "admin") {
        // Limpiar tokens — no es admin
        localStorage.removeItem("token_acceso");
        localStorage.removeItem("token_refresco");
        useStoreAuth.getState().cerrarSesion();
        setError("No tenés permisos de administrador.");
        setCargando(false);
        return;
      }

      setRedirigiendo(true);
      router.push("/admin");
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(mensaje);
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08041a]">
      {/* Glow sutil */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 ring-1 ring-violet-500/20">
              <Icono nombre="escudo" tamaño={20} className="text-violet-400" />
            </div>
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={120}
              height={32}
              className="h-8 w-auto opacity-80"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">Backoffice</h1>
            <p className="mt-1 text-[13px] text-white/36">
              Acceso restringido a administradores
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-white/40">
              Correo electrónico
            </label>
            <div className="relative">
              <Icono
                nombre="email"
                tamaño={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/24"
              />
              <input
                type="email"
                placeholder="admin@astra.xyz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-white/40">
              Contraseña
            </label>
            <div className="relative">
              <Icono
                nombre="candado"
                tamaño={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/24"
              />
              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="••••••••"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/24 transition-colors hover:text-white/50"
                tabIndex={-1}
              >
                <Icono
                  nombre={mostrarContrasena ? "ojoOculto" : "ojo"}
                  tamaño={16}
                />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5">
              <p className="text-[13px] text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
            ) : (
              <>
                <Icono nombre="escudo" tamaño={16} />
                Ingresar al panel
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-white/20">
          ASTRA · Panel de administración
        </p>
      </div>
    </div>
  );
}
