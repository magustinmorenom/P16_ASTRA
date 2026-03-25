"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarConfirmarReset } from "@/lib/hooks";

export default function PaginaResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const confirmar = usarConfirmarReset();

  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [completado, setCompletado] = useState(false);

  const noCoinciden = confirmarContrasena.length > 0 && contrasena !== confirmarContrasena;

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (noCoinciden || contrasena.length < 8) return;

    confirmar.mutate(
      { token, contrasena_nueva: contrasena },
      { onSuccess: () => setCompletado(true) },
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <Icono nombre="advertencia" tamaño={28} className="text-error" />
        </div>
        <h1 className="text-2xl font-bold text-texto">Enlace inválido</h1>
        <p className="text-texto-secundario">
          Este enlace no es válido. Solicitá uno nuevo desde la página de inicio de sesión.
        </p>
        <Link
          href="/olvide-contrasena"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (completado) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-exito/10">
          <Icono nombre="verificado" tamaño={28} className="text-exito" />
        </div>
        <h1 className="text-2xl font-bold text-texto">Contraseña actualizada</h1>
        <p className="text-texto-secundario">
          Tu contraseña fue restablecida exitosamente. Ya podés iniciar sesión.
        </p>
        <Link
          href="/login"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-texto">
          Nueva contraseña
        </h1>
        <p className="mt-2 text-texto-secundario">
          Ingresá tu nueva contraseña
        </p>
      </div>

      <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            etiqueta="Nueva contraseña"
            type={mostrar ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            icono={<Icono nombre="candado" tamaño={18} />}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setMostrar(!mostrar)}
            className="absolute right-3 top-[38px] text-texto-terciario hover:text-texto-secundario transition-colors"
            tabIndex={-1}
          >
            <Icono nombre={mostrar ? "ojoOculto" : "ojo"} tamaño={18} />
          </button>
        </div>

        <Input
          etiqueta="Confirmar contraseña"
          type={mostrar ? "text" : "password"}
          placeholder="Repetí la contraseña"
          icono={<Icono nombre="candado" tamaño={18} />}
          value={confirmarContrasena}
          onChange={(e) => setConfirmarContrasena(e.target.value)}
          required
          minLength={8}
        />

        {noCoinciden && (
          <p className="text-sm text-error">Las contraseñas no coinciden</p>
        )}

        {confirmar.error && (
          <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
            <p className="text-sm text-error">{confirmar.error.message}</p>
          </div>
        )}

        <Boton
          type="submit"
          variante="primario"
          tamaño="lg"
          cargando={confirmar.isPending}
          disabled={noCoinciden || contrasena.length < 8}
          className="w-full mt-2"
        >
          Restablecer contraseña
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
