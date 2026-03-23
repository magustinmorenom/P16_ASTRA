"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarRegistro, usarGoogleAuthUrl } from "@/lib/hooks";

export default function PaginaRegistro() {
  const router = useRouter();
  const registro = usarRegistro();
  const googleAuth = usarGoogleAuthUrl();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setErrorValidacion(null);

    if (contrasena.length < 8) {
      setErrorValidacion("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setErrorValidacion("Las contrasenas no coinciden.");
      return;
    }

    registro.mutate(
      { email, nombre, contrasena },
      {
        onSuccess: () => {
          router.push("/onboarding");
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

  const errorApi = registro.error?.message || googleAuth.error?.message || null;
  const error = errorValidacion || errorApi;

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-texto">Crea tu cuenta</h1>
        <p className="mt-2 text-texto-secundario">
          Comienza tu viaje cosmico
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
          etiqueta="Nombre"
          type="text"
          placeholder="Tu nombre completo"
          icono={<Icono nombre="usuario" tamaño={18} />}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

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
            placeholder="Minimo 8 caracteres"
            icono={<Icono nombre="candado" tamaño={18} />}
            value={contrasena}
            onChange={(e) => {
              setContrasena(e.target.value);
              setErrorValidacion(null);
            }}
            required
            minLength={8}
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

        <Input
          etiqueta="Confirmar contrasena"
          type={mostrarContrasena ? "text" : "password"}
          placeholder="Repite tu contrasena"
          icono={<Icono nombre="candado" tamaño={18} />}
          value={confirmarContrasena}
          onChange={(e) => {
            setConfirmarContrasena(e.target.value);
            setErrorValidacion(null);
          }}
          required
          minLength={8}
        />

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
          cargando={registro.isPending}
          className="w-full mt-2"
        >
          Crear cuenta
        </Boton>
      </form>

      {/* Enlace a login */}
      <p className="text-center text-sm text-texto-secundario">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Iniciar sesion
        </Link>
      </p>
    </div>
  );
}
