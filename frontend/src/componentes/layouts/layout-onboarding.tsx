"use client";

import Image from "next/image";

/**
 * Layout del onboarding — split premium.
 * Desktop: dos columnas — izquierda solo logo sobre fondo cósmico, derecha el wizard.
 * Mobile: stack — logo arriba, formulario abajo.
 */

export default function LayoutOnboarding({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full bg-[#16011b] text-white lg:flex-row flex-col">
      {/* ─── Columna izquierda: logo + fondo premium ─── */}
      <aside className="relative flex shrink-0 items-center justify-center overflow-hidden bg-[#16011b] lg:w-1/2 lg:min-h-screen min-h-[200px] py-10 lg:py-0">
        {/* Capas de fondo cósmico */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 25% 30%, rgba(124,77,255,0.22), transparent 38%), radial-gradient(circle at 75% 75%, rgba(192,132,252,0.14), transparent 32%), linear-gradient(135deg, #2d1b69 0%, #16011b 60%, #0f000f 100%)",
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-violet-600/18 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]" />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Image
            src="/img/logo-astra-blanco.png"
            alt="ASTRA"
            width={260}
            height={80}
            priority
            className="h-auto w-[180px] lg:w-[260px] drop-shadow-[0_4px_24px_rgba(124,77,255,0.45)]"
          />
          <p className="hidden lg:block text-center text-[12px] font-medium uppercase tracking-[0.32em] text-white/35">
            Tu cosmos, en una lectura
          </p>
        </div>
      </aside>

      {/* ─── Columna derecha: wizard ─── */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#1a0820] px-4 py-10 lg:px-8 lg:py-12">
        {/* Tinte sutil para diferenciar la superficie del wizard */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 100% 0%, rgba(124,77,255,0.08), transparent 40%)",
          }}
        />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
