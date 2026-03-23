"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Icono } from "@/componentes/ui/icono";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI } from "@/lib/stores/store-ui";

export default function Navbar() {
  const router = useRouter();
  const { usuario, cerrarSesion } = useStoreAuth();
  const { toggleSidebar } = useStoreUI();

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const refMenuUsuario = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function manejarClickFuera(evento: MouseEvent) {
      if (
        refMenuUsuario.current &&
        !refMenuUsuario.current.contains(evento.target as Node)
      ) {
        setMenuUsuarioAbierto(false);
      }
    }

    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  function manejarCerrarSesion() {
    cerrarSesion();
    setMenuUsuarioAbierto(false);
    router.push("/login");
  }

  const inicialesUsuario = (usuario?.nombre ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[56px] bg-[#2D1B69]">
      <div className="h-full mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Izquierda: Hamburguesa (mobile) + Logo + Home */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-white p-1"
            onClick={toggleSidebar}
            aria-label="Abrir menu"
          >
            <Icono nombre="menu" tamaño={22} />
          </button>

          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={100}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <Link
            href="/dashboard"
            className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] transition-colors text-white"
            aria-label="Inicio"
          >
            <Icono nombre="casa" tamaño={18} peso="fill" />
          </Link>
        </div>

        {/* Derecha: campana + avatar */}
        <div className="flex items-center gap-2">
          <button
            className="relative p-2 text-violet-300 hover:text-white transition-colors"
            aria-label="Notificaciones"
          >
            <Icono nombre="campana" tamaño={20} />
          </button>

          {/* Avatar / Menu de usuario */}
          <div className="relative" ref={refMenuUsuario}>
            <button
              onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-xs font-bold"
              aria-label="Menu de usuario"
            >
              {inicialesUsuario}
            </button>

            {menuUsuarioAbierto && (
              <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                {usuario && (
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {usuario.nombre}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {usuario.email}
                    </p>
                  </div>
                )}

                <Link
                  href="/perfil"
                  onClick={() => setMenuUsuarioAbierto(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Icono nombre="usuario" tamaño={16} />
                  Mi perfil
                </Link>

                <Link
                  href="/suscripcion"
                  onClick={() => setMenuUsuarioAbierto(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Icono nombre="corona" tamaño={16} />
                  Suscripción
                </Link>

                <Link
                  href="/perfil"
                  onClick={() => setMenuUsuarioAbierto(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Icono nombre="configuracion" tamaño={16} />
                  Configuración
                </Link>

                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={manejarCerrarSesion}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                  >
                    <Icono nombre="salir" tamaño={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
