"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Icono } from "@/componentes/ui/icono";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { useStoreUI } from "@/lib/stores/store-ui";
import { usarMiPerfil, usarMisCalculos } from "@/lib/hooks";
import { obtenerSimbolo } from "@/lib/utilidades/formatear-grado";

// ---------------------------------------------------------------------------
// Mapa de signo zodiacal a icono SVG
// ---------------------------------------------------------------------------
const ICONO_SIGNO: Record<string, string> = {
  Aries: "/img/icons/004-aries.svg",
  Tauro: "/img/icons/005-taurus.svg",
  "Géminis": "/img/icons/006-gemini.svg",
  "Cáncer": "/img/icons/007-cancer.svg",
  Leo: "/img/icons/008-leo.svg",
  Virgo: "/img/icons/009-virgo.svg",
  Libra: "/img/icons/010-libra.svg",
  Escorpio: "/img/icons/011-scorpio.svg",
  Sagitario: "/img/icons/017-sagittarius.svg",
  Capricornio: "/img/icons/001-capricorn.svg",
  Acuario: "/img/icons/002-aquarius.svg",
  Piscis: "/img/icons/003-pisces.svg",
};

export default function Navbar() {
  const router = useRouter();
  const { usuario, cerrarSesion } = useStoreAuth();
  const { toggleSidebar } = useStoreUI();

  const { data: perfil } = usarMiPerfil();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();

  const sol = calculos?.natal?.planetas?.find((p: { nombre: string }) => p.nombre === "Sol");
  const luna = calculos?.natal?.planetas?.find((p: { nombre: string }) => p.nombre === "Luna");
  const ascendente = calculos?.natal?.ascendente;

  const nombreRaw = perfil?.nombre ?? usuario?.nombre ?? "Usuario";
  const nombreUsuario = nombreRaw
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

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
    <nav className="fixed top-0 left-0 right-0 z-50 h-[62px] bg-[#2D1B69]">
      <div className="h-full mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Izquierda: Hamburguesa (mobile) + Logo + Home */}
        <div className="flex items-center gap-3 shrink-0">
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
              width={80}
              height={22}
              className="h-[22px] w-auto"
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

        {/* Centro: Ribbon glassmorphism con perfil cósmico */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.07] backdrop-blur-md border border-white/[0.10] max-w-md">
          {/* Nombre */}
          <span className="text-white/90 text-xs font-medium truncate max-w-[140px]">
            {nombreUsuario}
          </span>

          {/* Separador */}
          <div className="h-3.5 w-px bg-white/20 shrink-0" />

          {/* Sol / Luna / Asc */}
          {cargandoCalculos ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-8 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-8 rounded bg-white/10 animate-pulse" />
              <div className="h-4 w-8 rounded bg-white/10 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {sol && ICONO_SIGNO[sol.signo] ? (
                  <Image src={ICONO_SIGNO[sol.signo]} alt={sol.signo} width={14} height={14} className="brightness-0 invert opacity-80" />
                ) : (
                  <span className="text-white/70 text-[10px]">{sol ? obtenerSimbolo(sol.signo) : "—"}</span>
                )}
                <span className="text-white/50 text-[10px]">Sol</span>
              </div>
              <div className="flex items-center gap-1">
                {luna && ICONO_SIGNO[luna.signo] ? (
                  <Image src={ICONO_SIGNO[luna.signo]} alt={luna.signo} width={14} height={14} className="brightness-0 invert opacity-80" />
                ) : (
                  <span className="text-white/70 text-[10px]">{luna ? obtenerSimbolo(luna.signo) : "—"}</span>
                )}
                <span className="text-white/50 text-[10px]">Luna</span>
              </div>
              <div className="flex items-center gap-1">
                {ascendente && ICONO_SIGNO[ascendente.signo] ? (
                  <Image src={ICONO_SIGNO[ascendente.signo]} alt={ascendente.signo} width={14} height={14} className="brightness-0 invert opacity-80" />
                ) : (
                  <span className="text-white/70 text-[10px]">{ascendente ? obtenerSimbolo(ascendente.signo) : "—"}</span>
                )}
                <span className="text-white/50 text-[10px]">Asc</span>
              </div>
            </div>
          )}
        </div>

        {/* Derecha: avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Avatar / Menu de usuario */}
          <div className="relative" ref={refMenuUsuario}>
            <button
              onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
              className="relative flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-xs font-bold"
              aria-label="Menu de usuario"
            >
              {inicialesUsuario}
              {usuario?.plan_slug === "premium" && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[8px] text-yellow-900">
                  <Icono nombre="corona" tamaño={10} />
                </span>
              )}
            </button>

            {menuUsuarioAbierto && (
              <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                {usuario && (
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {usuario.nombre}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-500 truncate">
                        {usuario.email}
                      </p>
                      {usuario.plan_slug === "premium" && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                          <Icono nombre="corona" tamaño={10} />
                          Premium
                        </span>
                      )}
                    </div>
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
