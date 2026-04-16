"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const suave = [0.22, 1, 0.36, 1] as const;

const fadeScale = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: suave } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.2, ease: suave },
  },
};

const formSlide = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.35, ease: suave },
  },
};

export default function LayoutOnboarding({
  children,
}: {
  children: React.ReactNode;
}) {
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
        {/* Pitch — logo + headline (solo desktop) */}
        <div className="hidden lg:flex lg:h-full lg:flex-col lg:py-2">
          <motion.div variants={fadeScale} initial="hidden" animate="visible">
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
            >
              Completá tu perfil para activar tu lectura.
            </motion.h1>
          </div>
        </div>

        {/* Formulario */}
        <main className="flex min-h-full items-center justify-center py-2 lg:h-full lg:py-0">
          <motion.div
            className="flex w-full max-w-[520px] flex-col justify-center"
            variants={formSlide}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile: solo logo */}
            <div className="mb-10 flex justify-center lg:hidden">
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
                {children}
              </div>
            </section>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
