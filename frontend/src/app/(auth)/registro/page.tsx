"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarRegistro, usarGoogleAuthUrl } from "@/lib/hooks";

function LogoGoogle({ tamaño = 20 }: { tamaño?: number }) {
  return (
    <svg width={tamaño} height={tamaño} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.02 24.02 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

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
      { email, contrasena, nombre: nombre.trim() || undefined },
      {
        onSuccess: (data) => {
          if (data.requiere_verificacion) {
            router.push(`/verificar-cuenta?email=${encodeURIComponent(email)}`);
          } else {
            if (data.token_acceso && data.token_refresco) {
              localStorage.setItem("token_acceso", data.token_acceso);
              localStorage.setItem("token_refresco", data.token_refresco);
            }
            router.push("/onboarding");
          }
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
    <motion.div
      className="flex flex-col gap-5"
      variants={contenedor}
      initial="hidden"
      animate="animate"
    >
      <motion.div variants={item}>
        <h1 className="text-center text-2xl font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]">
          Creá tu cuenta
        </h1>
      
      </motion.div>

      <motion.div variants={item}>
        <Boton
          variante="secundario"
          tamaño="lg"
          icono={<LogoGoogle tamaño={20} />}
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
            etiqueta="¿Cuál es tu nombre o apodo?"
            type="text"
            placeholder="Ej: Luna, Martín, Cami..."
            icono={<Icono nombre="usuario" tamaño={18} />}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={CLASE_INPUT_ACCESO}
            required
            minLength={1}
            maxLength={100}
          />
        </motion.div>

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
        </motion.div>

        <motion.div variants={item}>
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
            cargando={registro.isPending}
            className="mt-2 h-12 w-full rounded-[20px] border-0 shadow-[var(--shell-sombra-suave)] hover:brightness-[1.03]"
            style={{
              background: "var(--shell-gradiente-boton)",
            }}
          >
            Crear cuenta
          </Boton>
        </motion.div>
      </motion.form>

      <motion.p
        className="pt-1 text-center text-sm text-[color:var(--shell-texto-secundario)]"
        variants={item}
      >
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-[color:var(--color-acento)] transition-colors hover:opacity-80"
        >
          Iniciar sesión
        </Link>
      </motion.p>
    </motion.div>
  );
}
