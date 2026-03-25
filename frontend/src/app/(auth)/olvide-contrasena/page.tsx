"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarSolicitarReset } from "@/lib/hooks";

export default function PaginaOlvideContrasena() {
  const reset = usarSolicitarReset();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    reset.mutate(
      { email },
      { onSuccess: () => setEnviado(true) },
    );
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-exito/10">
          <Icono nombre="email" tamaño={28} className="text-exito" />
        </div>
        <h1 className="text-2xl font-bold text-texto">Revisá tu email</h1>
        <p className="text-texto-secundario">
          Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
          Revisá también la carpeta de spam.
        </p>
        <Link
          href="/login"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-texto">
          Restablecer contraseña
        </h1>
        <p className="mt-2 text-texto-secundario">
          Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
        <Input
          etiqueta="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          icono={<Icono nombre="email" tamaño={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {reset.error && (
          <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
            <p className="text-sm text-error">{reset.error.message}</p>
          </div>
        )}

        <Boton
          type="submit"
          variante="primario"
          tamaño="lg"
          cargando={reset.isPending}
          className="w-full mt-2"
        >
          Enviar enlace
        </Boton>
      </form>

      <p className="text-center text-sm text-texto-secundario">
        <Link
          href="/login"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
