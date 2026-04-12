"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarLogin, usarGoogleAuthUrl } from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";

const CLASE_INPUT_ACCESO =
  "h-12 rounded-[20px] border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie)] text-[color:var(--shell-texto)] placeholder:text-[color:var(--shell-texto-tenue)] focus:border-[color:var(--shell-borde-fuerte)] focus:bg-[color:var(--shell-superficie-fuerte)] focus:ring-[color:var(--shell-overlay-suave)]";

/* ── Stagger de campos ── */
const suave = [0.22, 1, 0.36, 1] as const;

const contenedor = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: suave } },
};

function LogoGoogleColor() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 48 48"
      className="shrink-0"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C34.3 31.1 29.6 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7 12.9 19.5C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.1C29.1 35.3 26.7 36 24 36c-5.6 0-10.3-3.7-11.8-8.8l-6.5 5C9 39.3 15.9 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.5 1.6-1.4 3-2.6 4.1-.1.1-.2.2-.4.3l6.2 5.1C38.1 37.8 44 33 44 24c0-1.3-.1-2.4-.4-3.5Z"
      />
    </svg>
  );
}

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
    <motion.div
      className="flex flex-col gap-5"
      variants={contenedor}
      initial="hidden"
      animate="animate"
    >
      <motion.h1
        className="text-2xl font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]"
        variants={item}
      >
        Iniciá sesión
      </motion.h1>

      <motion.div variants={item}>
        <Boton
          variante="secundario"
          tamaño="lg"
          icono={<LogoGoogleColor />}
          onClick={manejarGoogle}
          cargando={googleAuth.isPending}
          className="h-12 w-full rounded-[20px] border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie-fuerte)] text-[color:var(--shell-texto)] shadow-none hover:border-[color:var(--shell-borde-fuerte)] hover:bg-[color:var(--shell-chip-hover)]"
        >
          Continuar con Google
        </Boton>
      </motion.div>

      <motion.div className="flex items-center gap-4" variants={item}>
        <div className="h-px flex-1 bg-[color:var(--shell-borde)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
          o con email
        </span>
        <div className="h-px flex-1 bg-[color:var(--shell-borde)]" />
      </motion.div>

      <motion.form
        onSubmit={manejarEnvio}
        className="flex flex-col gap-4"
        variants={contenedor}
        initial="hidden"
        animate="animate"
      >
        <motion.div variants={item}>
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
        </motion.div>

        <motion.div className="relative" variants={item}>
          <Input
            etiqueta="Contraseña"
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Tu contraseña"
            icono={<Icono nombre="candado" tamaño={18} />}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className={CLASE_INPUT_ACCESO}
            required
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
        </motion.div>

        <motion.div className="flex justify-end -mt-1" variants={item}>
          <Link
            href="/olvide-contrasena"
            className="text-sm font-medium text-[color:var(--color-acento)] transition-colors hover:opacity-80"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </motion.div>

        {error && (
          <motion.div
            className="rounded-[20px] border px-4 py-3"
            style={{
              borderColor: "var(--shell-badge-error-borde)",
              background: "var(--shell-badge-error-fondo)",
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm leading-6 text-[color:var(--shell-badge-error-texto)]">
              {error}
            </p>
          </motion.div>
        )}

        <motion.div variants={item}>
          <Boton
            type="submit"
            variante="primario"
            tamaño="lg"
            cargando={login.isPending}
            className="mt-2 h-12 w-full rounded-[20px] border-0 shadow-[var(--shell-sombra-suave)] hover:brightness-[1.03]"
            style={{
              background: "var(--shell-gradiente-boton)",
            }}
          >
            Iniciar sesión
          </Boton>
        </motion.div>
      </motion.form>

      <motion.p
        className="pt-1 text-center text-sm text-[color:var(--shell-texto-secundario)]"
        variants={item}
      >
        ¿No tenés cuenta?{" "}
        <Link
          href="/registro"
          className="font-semibold text-[color:var(--color-acento)] transition-colors hover:opacity-80"
        >
          Crear cuenta
        </Link>
      </motion.p>
    </motion.div>
  );
}
