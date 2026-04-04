"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarRegistro, usarGoogleAuthUrl } from "@/lib/hooks";

const CLASE_INPUT_ACCESO =
  "h-12 rounded-[20px] border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie)] text-[color:var(--shell-texto)] placeholder:text-[color:var(--shell-texto-tenue)] focus:border-[color:var(--shell-borde-fuerte)] focus:bg-[color:var(--shell-superficie-fuerte)] focus:ring-[color:var(--shell-overlay-suave)]";

const etapas = [
  "Creás tu cuenta",
  "Completás tus datos natales",
  "ASTRA activa tus cálculos base",
];

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
      setErrorValidacion("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setErrorValidacion("Las contraseñas no coinciden.");
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
    <div className="flex flex-col gap-6">
      <div>
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{
            borderColor: "var(--shell-badge-violeta-borde)",
            background: "var(--shell-badge-violeta-fondo)",
            color: "var(--shell-badge-violeta-texto)",
          }}
        >
          <Icono nombre="destello" tamaño={14} />
          Primer acceso
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--shell-texto)] sm:text-[34px]">
          Creá tu cuenta y dejá listo tu perfil
        </h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
          El registro es corto. Después te vamos a pedir tu momento de nacimiento
          para generar todas tus lecturas base sin pasos innecesarios.
        </p>
      </div>

      <div
        className="grid gap-2 rounded-[24px] border p-4 sm:grid-cols-3"
        style={{
          borderColor: "var(--shell-borde)",
          background: "var(--shell-superficie)",
        }}
      >
        {etapas.map((etapa, indice) => (
          <div
            key={etapa}
            className="rounded-[20px] border px-3 py-3"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie-suave)",
            }}
          >
            <span
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-semibold"
              style={{
                background: "var(--shell-badge-violeta-fondo)",
                color: "var(--shell-badge-violeta-texto)",
              }}
            >
              {indice + 1}
            </span>
            <p className="mt-3 text-sm font-medium leading-6 text-[color:var(--shell-texto)]">
              {etapa}
            </p>
          </div>
        ))}
      </div>

      <Boton
        variante="secundario"
        tamaño="lg"
        icono={<Icono nombre="google" tamaño={20} />}
        onClick={manejarGoogle}
        cargando={googleAuth.isPending}
        className="h-12 w-full rounded-[20px] border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie-fuerte)] text-[color:var(--shell-texto)] shadow-none hover:bg-[color:var(--shell-superficie)]"
      >
        Continuar con Google
      </Boton>

      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-[color:var(--shell-borde)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          o con email
        </span>
        <div className="h-px flex-1 bg-[color:var(--shell-borde)]" />
      </div>

      <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
        <Input
          etiqueta="Nombre"
          type="text"
          placeholder="Tu nombre completo"
          icono={<Icono nombre="usuario" tamaño={18} />}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={CLASE_INPUT_ACCESO}
          required
        />

        <Input
          etiqueta="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          icono={<Icono nombre="email" tamaño={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={CLASE_INPUT_ACCESO}
          required
        />

        <div className="relative">
          <Input
            etiqueta="Contraseña"
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            icono={<Icono nombre="candado" tamaño={18} />}
            value={contrasena}
            onChange={(e) => {
              setContrasena(e.target.value);
              setErrorValidacion(null);
            }}
            className={CLASE_INPUT_ACCESO}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setMostrarContrasena(!mostrarContrasena)}
            className="absolute right-4 top-[40px] text-[color:var(--shell-texto-tenue)] transition-colors hover:text-[color:var(--shell-texto-secundario)]"
            tabIndex={-1}
            aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <Icono
              nombre={mostrarContrasena ? "ojoOculto" : "ojo"}
              tamaño={18}
            />
          </button>
        </div>

        <Input
          etiqueta="Confirmar contraseña"
          type={mostrarContrasena ? "text" : "password"}
          placeholder="Repetí tu contraseña"
          icono={<Icono nombre="candado" tamaño={18} />}
          value={confirmarContrasena}
          onChange={(e) => {
            setConfirmarContrasena(e.target.value);
            setErrorValidacion(null);
          }}
          className={CLASE_INPUT_ACCESO}
          required
          minLength={8}
        />

        {error && (
          <div
            className="rounded-[20px] border px-4 py-3"
            style={{
              borderColor: "var(--shell-badge-error-borde)",
              background: "var(--shell-badge-error-fondo)",
            }}
          >
            <p className="text-sm leading-6 text-[color:var(--shell-badge-error-texto)]">
              {error}
            </p>
          </div>
        )}

        <Boton
          type="submit"
          variante="primario"
          tamaño="lg"
          cargando={registro.isPending}
          className="mt-2 h-12 w-full rounded-[20px] border-0 shadow-[var(--shell-sombra-suave)] hover:brightness-[1.03]"
          style={{
            background: "var(--shell-gradiente-boton)",
          }}
        >
          Crear cuenta
        </Boton>
      </form>

      <div
        className="rounded-[24px] border px-4 py-4 text-center"
        style={{
          borderColor: "var(--shell-borde)",
          background: "var(--shell-superficie)",
        }}
      >
        <p className="text-sm text-[color:var(--shell-texto-secundario)]">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[color:var(--color-acento)] transition-colors hover:opacity-80"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
