"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { usarSolicitarReset, usarVerificarOTP, usarConfirmarReset } from "@/lib/hooks";
import { cn } from "@/lib/utilidades/cn";

type Paso = "email" | "otp" | "nueva-contrasena" | "completado";

export default function PaginaOlvideContrasena() {
  const solicitar = usarSolicitarReset();
  const verificarOTP = usarVerificarOTP();
  const confirmar = usarConfirmarReset();

  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState("");
  const [codigoOTP, setCodigoOTP] = useState(["", "", "", "", "", ""]);
  const [tokenReset, setTokenReset] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mostrar, setMostrar] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // ── Paso 1: Enviar email ──
  function enviarEmail(e: FormEvent) {
    e.preventDefault();
    solicitar.mutate(
      { email },
      { onSuccess: () => setPaso("otp") },
    );
  }

  // ── Paso 2: OTP input handlers ──
  function handleOTPChange(index: number, valor: string) {
    if (!/^\d*$/.test(valor)) return;
    const nuevo = [...codigoOTP];
    nuevo[index] = valor.slice(-1);
    setCodigoOTP(nuevo);

    if (valor && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleOTPKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !codigoOTP[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handleOTPPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pegado = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pegado.length === 6) {
      setCodigoOTP(pegado.split(""));
      inputsRef.current[5]?.focus();
    }
  }

  function verificarCodigo(e: FormEvent) {
    e.preventDefault();
    const codigo = codigoOTP.join("");
    if (codigo.length !== 6) return;

    verificarOTP.mutate(
      { email, codigo },
      {
        onSuccess: (data) => {
          setTokenReset(data.token);
          setPaso("nueva-contrasena");
        },
      },
    );
  }

  // ── Paso 3: Nueva contraseña ──
  const tieneMayuscula = /[A-Z]/.test(contrasena);
  const tieneNumero = /\d/.test(contrasena);
  const tieneSimbolo = /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/`~]/.test(contrasena);
  const tieneMinimo = contrasena.length >= 8;
  const noCoinciden = confirmarContrasena.length > 0 && contrasena !== confirmarContrasena;
  const contrasenaValida = tieneMayuscula && tieneNumero && tieneSimbolo && tieneMinimo && !noCoinciden;

  function cambiarContrasena(e: FormEvent) {
    e.preventDefault();
    if (!contrasenaValida) return;

    confirmar.mutate(
      { token: tokenReset, contrasena_nueva: contrasena },
      { onSuccess: () => setPaso("completado") },
    );
  }

  // ── Completado ──
  if (paso === "completado") {
    return (
      <motion.div
        className="flex flex-col gap-6 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-exito/10">
          <Icono nombre="verificado" tamaño={28} className="text-exito" />
        </div>
        <h1 className="text-2xl font-bold text-texto">Contraseña actualizada</h1>
        <p className="text-texto-secundario">
          Tu contraseña fue restablecida exitosamente.
        </p>
        <Link
          href="/login"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Ir al inicio de sesión
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-texto">
          {paso === "email" && "Restablecer contraseña"}
          {paso === "otp" && "Código de verificación"}
          {paso === "nueva-contrasena" && "Nueva contraseña"}
        </h1>
        <p className="mt-2 text-texto-secundario">
          {paso === "email" && "Ingresá tu email y te enviaremos un código de verificación"}
          {paso === "otp" && `Ingresá el código de 6 dígitos que enviamos a ${email}`}
          {paso === "nueva-contrasena" && "Creá tu nueva contraseña"}
        </p>
      </div>

      {/* ── Paso 1: Email ── */}
      {paso === "email" && (
        <form onSubmit={enviarEmail} className="flex flex-col gap-4">
          <Input
            etiqueta="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            icono={<Icono nombre="email" tamaño={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {solicitar.error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
              <p className="text-sm text-error">{solicitar.error.message}</p>
            </div>
          )}

          <Boton
            type="submit"
            variante="primario"
            tamaño="lg"
            cargando={solicitar.isPending}
            className="w-full mt-2"
          >
            Enviar código
          </Boton>
        </form>
      )}

      {/* ── Paso 2: OTP ── */}
      {paso === "otp" && (
        <form onSubmit={verificarCodigo} className="flex flex-col gap-5">
          <div className="flex justify-center gap-2.5" onPaste={handleOTPPaste}>
            {codigoOTP.map((digito, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digito}
                onChange={(e) => handleOTPChange(i, e.target.value)}
                onKeyDown={(e) => handleOTPKeyDown(i, e)}
                className="h-14 w-11 rounded-xl border-2 border-gray-200 bg-violet-50 text-center text-xl font-bold text-gray-800 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors"
              />
            ))}
          </div>

          {verificarOTP.error && (
            <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3">
              <p className="text-sm text-error">{verificarOTP.error.message}</p>
            </div>
          )}

          <Boton
            type="submit"
            variante="primario"
            tamaño="lg"
            cargando={verificarOTP.isPending}
            disabled={codigoOTP.join("").length !== 6}
            className="w-full"
          >
            Verificar código
          </Boton>

          <button
            type="button"
            onClick={() => {
              setCodigoOTP(["", "", "", "", "", ""]);
              solicitar.mutate({ email });
            }}
            className="text-sm text-primario hover:text-primario-hover transition-colors"
          >
            Reenviar código
          </button>
        </form>
      )}

      {/* ── Paso 3: Nueva contraseña ── */}
      {paso === "nueva-contrasena" && (
        <form onSubmit={cambiarContrasena} className="flex flex-col gap-4">
          <div className="relative">
            <Input
              etiqueta="Nueva contraseña"
              type={mostrar ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              icono={<Icono nombre="candado" tamaño={18} />}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
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

          {/* Requisitos de contraseña */}
          {contrasena.length > 0 && (
            <div className="flex flex-col gap-1.5 text-[12px]">
              <Requisito cumple={tieneMinimo} texto="Mínimo 8 caracteres" />
              <Requisito cumple={tieneMayuscula} texto="Al menos una mayúscula" />
              <Requisito cumple={tieneNumero} texto="Al menos un número" />
              <Requisito cumple={tieneSimbolo} texto="Al menos un símbolo (!@#$...)" />
            </div>
          )}

          <Input
            etiqueta="Confirmar contraseña"
            type={mostrar ? "text" : "password"}
            placeholder="Repetí la contraseña"
            icono={<Icono nombre="candado" tamaño={18} />}
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            required
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
            disabled={!contrasenaValida}
            className="w-full mt-2"
          >
            Restablecer contraseña
          </Boton>
        </form>
      )}

      <p className="text-center text-sm text-texto-secundario">
        <Link
          href="/login"
          className="text-primario hover:text-primario-hover font-medium transition-colors"
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </motion.div>
  );
}

function Requisito({ cumple, texto }: { cumple: boolean; texto: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icono
        nombre={cumple ? "check" : "circulo"}
        tamaño={14}
        className={cumple ? "text-exito" : "text-gray-300"}
      />
      <span className={cn(cumple ? "text-exito" : "text-gray-400")}>
        {texto}
      </span>
    </div>
  );
}
