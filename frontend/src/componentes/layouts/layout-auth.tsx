"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreAuth } from "@/lib/stores/store-auth";

/* ── Variantes de animación ── */
const suave = [0.22, 1, 0.36, 1] as const;

const fadeScale = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: suave } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: suave },
  }),
};

const formSlide = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.35, ease: suave },
  },
};

/* Transición entre páginas auth (login ↔ registro ↔ olvidé) */
const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: suave } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: suave } },
};

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { autenticado, cargando } = useStoreAuth();

  useEffect(() => {
    if (!cargando && autenticado) {
      router.replace("/dashboard");
    }
  }, [autenticado, cargando, router]);

  if (autenticado) {
    return (
      <div
        className="flex h-[100dvh] items-center justify-center"
        style={{ background: "var(--shell-hero)" }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      </div>
    );
  }

  return (
    <div
      className="relative h-[100dvh] overflow-hidden"
      style={{ background: "var(--shell-hero)" }}
    >
      {/* Glows atmosféricos */}
      <motion.div
        className="absolute left-[-72px] top-12 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "rgba(179, 136, 255, 0.18)" }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-[-40px] h-72 w-72 rounded-full blur-3xl"
        style={{ background: "rgba(124, 77, 255, 0.14)" }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto grid h-full max-w-[1480px] gap-6 overflow-y-auto px-5 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(410px,520px)] lg:items-center lg:overflow-hidden lg:px-10 lg:py-8">
        {/* Pitch — logo + headline sobre fondo ciruela */}
        <div className="hidden lg:flex lg:h-full lg:flex-col lg:py-2">
          <motion.div
            variants={fadeScale}
            initial="hidden"
            animate="visible"
          >
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={160}
              height={44}
              className="h-10 w-auto"
              priority
            />
          </motion.div>

          <div className="flex flex-1 items-center">
            <motion.h1
              className="max-w-lg text-[44px] font-semibold leading-[1.08] tracking-[-0.04em] text-white xl:text-[54px]"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.2}
            >
              Una I.A. que conoce cada rincón de tu mapa cósmico.
            </motion.h1>
          </div>
        </div>

        {/* Formulario — único contenedor */}
        <main className="flex min-h-full items-center justify-center py-2 lg:h-full lg:py-0">
          <motion.div
            className="flex w-full max-w-[520px] flex-col justify-center"
            variants={formSlide}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile: solo logo */}
            <div className="mb-6 flex justify-center lg:hidden">
              <Image
                src="/img/logo-astra-blanco.png"
                alt="ASTRA"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </div>

            <section className="tema-superficie-panel-suave relative overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-9">
              <div className="absolute right-[-44px] top-[-36px] h-32 w-32 rounded-full blur-3xl" style={{ background: "var(--shell-glow-2)" }} />
              <div className="absolute bottom-[-44px] left-[-28px] h-32 w-32 rounded-full blur-3xl" style={{ background: "var(--shell-glow-1)" }} />
              <div className="relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    variants={pageTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
