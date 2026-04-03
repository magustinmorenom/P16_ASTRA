"use client";

import Image from "next/image";
import {
  IconoAstral,
  type NombreIconoAstral,
} from "@/componentes/ui/icono-astral";

interface PropsLayoutOnboarding {
  children: React.ReactNode;
  /** Texto descriptivo que aparece en el panel izquierdo, cambia según el paso */
  textoPanel?: string;
  /** Si es true, usa layout full-screen oscuro (paso calculando) */
  modoOscuro?: boolean;
}

const modulos: Array<{
  icono: NombreIconoAstral;
  titulo: string;
  descripcion: string;
}> = [
  {
    icono: "astrologia",
    titulo: "Carta natal",
    descripcion: "Planetas, casas y aspectos iniciales.",
  },
  {
    icono: "personal",
    titulo: "Diseño Humano",
    descripcion: "Tipo, autoridad y perfil base.",
  },
  {
    icono: "numerologia",
    titulo: "Numerología",
    descripcion: "Núcleo, ritmo y vibración personal.",
  },
];

export default function LayoutOnboarding({
  children,
  textoPanel = "Configuremos tu perfil cósmico",
  modoOscuro = false,
}: PropsLayoutOnboarding) {
  if (modoOscuro) {
    return (
      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: "var(--shell-fondo)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 28%), radial-gradient(circle_at_bottom_right, var(--shell-glow-2), transparent 24%)",
          }}
        />
        <div
          className="absolute left-[-60px] top-10 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-1)" }}
        />
        <div
          className="absolute bottom-[-80px] right-[-40px] h-80 w-80 rounded-full blur-3xl"
          style={{ background: "var(--shell-glow-2)" }}
        />

        <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-8 sm:px-6">
          <div className="tema-superficie-hero w-full rounded-[36px] p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--shell-fondo)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 24%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 32%)",
        }}
      />
      <div
        className="absolute left-[-72px] top-12 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="absolute bottom-0 right-[-40px] h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-[1480px] gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(470px,620px)] lg:px-6 lg:py-6">
        <section className="tema-superficie-hero relative hidden overflow-hidden rounded-[36px] p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-[-10%] top-[-16%] h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-[-16%] right-[-10%] h-64 w-64 rounded-full bg-[#B388FF]/20 blur-3xl" />
            <div className="absolute right-14 top-[72px] h-2 w-2 rounded-full bg-white/60" />
            <div className="absolute left-20 top-28 h-1 w-1 rounded-full bg-white/40" />
            <div className="absolute bottom-24 left-16 h-1.5 w-1.5 rounded-full bg-white/40" />
            <div className="absolute bottom-16 right-20 h-1 w-1 rounded-full bg-white/50" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={176}
              height={48}
              className="h-11 w-auto"
              priority
            />
            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-hero-texto-secundario)]">
              Perfil base
            </span>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--shell-hero-texto-tenue)]">
              Configuración inicial
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[color:var(--shell-hero-texto)] xl:text-[52px]">
              Tu lectura empieza con datos precisos, no con formularios genéricos.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[color:var(--shell-hero-texto-secundario)]">
              {textoPanel}
            </p>
          </div>

          <div className="relative z-10 grid gap-3 xl:grid-cols-3">
            {modulos.map((item) => (
              <article
                key={item.titulo}
                className="rounded-[26px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,rgba(124,77,255,0.96),rgba(179,136,255,0.78))] text-white shadow-[0_16px_30px_rgba(18,1,23,0.28)]">
                  <IconoAstral nombre={item.icono} tamaño={22} className="text-white" />
                </div>
                <h2 className="mt-5 text-base font-semibold text-[color:var(--shell-hero-texto)]">
                  {item.titulo}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--shell-hero-texto-secundario)]">
                  {item.descripcion}
                </p>
              </article>
            ))}
          </div>

          <div className="relative z-10 rounded-[28px] border border-white/10 bg-black/10 p-5 backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-hero-texto-tenue)]">
              Precisión primero
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--shell-hero-texto-secundario)]">
              ASTRA usa la zona horaria histórica del nacimiento y las efemérides
              exactas para evitar interpretaciones infladas o imprecisas.
            </p>
          </div>
        </section>

        <main className="flex items-center justify-center py-2 lg:py-0">
          <div className="w-full max-w-[620px]">
            <section className="tema-superficie-hero relative mb-5 overflow-hidden rounded-[30px] p-5 text-[color:var(--shell-hero-texto)] lg:hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%)]" />
              <div className="relative z-10">
                <Image
                  src="/img/logo-astra-blanco.png"
                  alt="ASTRA"
                  width={152}
                  height={40}
                  className="h-10 w-auto"
                  priority
                />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-hero-texto-tenue)]">
                  Perfil base
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--shell-hero-texto-secundario)]">
                  {textoPanel}
                </p>
              </div>
            </section>

            <section className="tema-superficie-panel-suave relative overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-10">
              <div className="absolute right-[-44px] top-[-36px] h-32 w-32 rounded-full blur-3xl" style={{ background: "var(--shell-glow-2)" }} />
              <div className="absolute bottom-[-44px] left-[-28px] h-32 w-32 rounded-full blur-3xl" style={{ background: "var(--shell-glow-1)" }} />
              <div className="relative z-10">{children}</div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
