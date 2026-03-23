"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarLogin, usarGoogleAuthUrl } from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";

export default function PaginaLogin() {
  const router = useRouter();
  const login = usarLogin();
  const googleAuth = usarGoogleAuthUrl();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();

    login.mutate(
      { email, contrasena },
      {
        onSuccess: () => {
          const usuario = useStoreAuth.getState().usuario;
          router.push(usuario?.tiene_perfil ? "/dashboard" : "/onboarding");
        },
      },
    );
  }

  function manejarGoogle() {
    googleAuth.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.url;
      },
    });
  }

  const error = login.error?.message || googleAuth.error?.message || null;

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-texto">
          Bienvenido de vuelta
        </h1>
        <p className="mt-2 text-texto-secundario">
          Inicia sesion en tu cuenta
        </p>
      </div>

      {/* Boton Google */}
      <Boton
        variante="secundario"
        tamaño="lg"
        icono={<Icono nombre="google" tamaño={20} />}
        onClick={manejarGoogle}
        cargando={googleAuth.isPending}
        className="w-full"
      >
        Continuar con Google
      </Boton>

      {/* Separador */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-borde" />
        <span className="text-sm text-texto-terciario">o</span>
        <div className="h-px flex-1 bg-borde" />
      </div>

      {/* Formulario */}
      <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
        <Input
          etiqueta="Correo electronico"
          type="email"
          placeholder="tu@correo.com"
          icono={<Icono nombre="email" tamaño={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <Input
            etiqueta="Contrasena"
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Tu contrasena"
            icono={<Icono nombre="candado" tamaño={18} />}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setMostrarContrasena(!mostrarContrasena)}
            className="absolute right-3 top-[38px] text-texto-terciario hover:text-texto-secundario transition-colors"
            tabIndex={-1}
            aria-label={mostrarContrasena ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            <Icono
              nombre={mostrarContrasena ? "ojoOculto" : "ojo"}
              tamaño={18}
            />
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <Boton
          type="submit"
          variante="primario"
          tamaño="lg"
          cargando={login.isPending}
          className="w-full mt-2"
        >
          Iniciar sesion
        </Boton>
      </form>

      {/* Enlace a registro */}
      <p className="text-center text-sm text-texto-secundario">
        ¿No tienes cuenta?{" "}
        <Link
          href="/registro"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
