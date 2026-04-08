"use client";

/**
 * Layout del onboarding — Cosmic Minimal.
 * Fondo oscuro unificado con orbes decorativos.
 * Centra el contenido vertical y horizontalmente.
 */

export default function LayoutOnboarding({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#16011b] px-4 py-8">
      {/* Orbes decorativos */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(124,77,255,0.12), transparent 30%), radial-gradient(circle at 80% 80%, rgba(180,100,255,0.08), transparent 26%)",
        }}
      />
      <div className="pointer-events-none absolute -left-16 top-8 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-fuchsia-500/8 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
