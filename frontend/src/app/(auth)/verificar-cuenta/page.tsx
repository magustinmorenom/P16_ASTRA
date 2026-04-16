"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { Boton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";
import { usarVerificarCuenta, usarReenviarVerificacion } from "@/lib/hooks";

const suave = [0.22, 1, 0.36, 1] as const;

const contenedor = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: suave } },
};

export default function PaginaVerificarCuenta() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const verificar = usarVerificarCuenta();
  const reenviar = usarReenviarVerificacion();

  const [codigoOTP, setCodigoOTP] = useState(["", "", "", "", "", ""]);
  const [reenviado, setReenviado] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.replace("/registro");
  }, [email, router]);

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

  function manejarVerificar(e: FormEvent) {
    e.preventDefault();
    const codigo = codigoOTP.join("");
    if (codigo.length !== 6) return;

    verificar.mutate(
      { email, codigo },
      {
        onSuccess: () => {
          router.push("/onboarding");
        },
      },
    );
  }

  function manejarReenviar() {
    reenviar.mutate(
      { email },
      {
        onSuccess: () => {
          setReenviado(true);
          setCodigoOTP(["", "", "", "", "", ""]);
          setTimeout(() => setReenviado(false), 5000);
        },
      },
    );
  }

  const error = verificar.error?.message || null;

  if (!email) return null;

  return (
    <motion.div
      className="flex flex-col gap-5"
      variants={contenedor}
      initial="hidden"
      animate="animate"
    >
      <motion.div variants={item} className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--shell-chip)" }}>
          <Icono nombre="email" tamaño={28} className="text-[color:var(--color-acento)]" />
        </div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]">
          Verificá tu correo
        </h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
          Enviamos un código de 6 dígitos a{" "}
          <span className="font-semibold text-[color:var(--shell-texto)]">{email}</span>
        </p>
      </motion.div>

      <motion.form
        onSubmit={manejarVerificar}
        className="flex flex-col gap-5"
        variants={contenedor}
        initial="hidden"
        animate="animate"
      >
        <motion.div variants={item}>
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
                className="h-14 w-11 rounded-xl border-2 text-center text-xl font-bold transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--shell-borde)",
                  background: "var(--shell-superficie)",
                  color: "var(--shell-texto)",
                }}
              />
            ))}
          </div>
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
            cargando={verificar.isPending}
            disabled={codigoOTP.join("").length !== 6}
            className="h-12 w-full rounded-[20px] border-0 shadow-[var(--shell-sombra-suave)] hover:brightness-[1.03]"
            style={{ background: "var(--shell-gradiente-boton)" }}
          >
            Verificar cuenta
          </Boton>
        </motion.div>
      </motion.form>

      <motion.div variants={item} className="text-center">
        {reenviado ? (
          <p className="text-sm text-[color:var(--color-acento)] font-medium">
            Código reenviado
          </p>
        ) : (
          <button
            type="button"
            onClick={manejarReenviar}
            disabled={reenviar.isPending}
            className="text-sm font-semibold text-[color:var(--color-acento)] transition-colors hover:opacity-80"
          >
            {reenviar.isPending ? "Reenviando..." : "Reenviar código"}
          </button>
        )}
        <p className="mt-2 text-xs text-[color:var(--shell-texto-tenue)]">
          El código expira en 10 minutos
        </p>
      </motion.div>
    </motion.div>
  );
}
