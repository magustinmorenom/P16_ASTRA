"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  IconoAstral,
  type NombreIconoAstral,
} from "@/componentes/ui/icono-astral";
import { Icono } from "@/componentes/ui/icono";
import { useStoreAuth } from "@/lib/stores/store-auth";

const modulos: Array<{
  icono: NombreIconoAstral;
  titulo: string;
  descripcion: string;
}> = [
  {
    icono: "astrologia",
    titulo: "Carta natal",
    descripcion: "Planetas, casas y aspectos en un solo mapa legible.",
  },
  {
    icono: "personal",
    titulo: "Diseño Humano",
    descripcion: "Tipo, autoridad y perfil conectados con tu contexto real.",
  },
  {
    icono: "numerologia",
    titulo: "Numerología",
    descripcion: "Ritmos, ciclos y números personales sin ruido administrativo.",
  },
];

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { autenticado, cargando } = useStoreAuth();

  useEffect(() => {
    if (!cargando && autenticado) {
      router.replace("/dashboard");
    }
  }, [autenticado, cargando, router]);

  /* Si ya esta autenticado, no mostrar login/registro */
  if (autenticado) {
    return (
      <div
        className="flex h-[100dvh] items-center justify-center"
        style={{ background: "var(--shell-fondo)" }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="relative h-[100dvh] overflow-hidden"
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

      <div className="relative mx-auto grid h-full max-w-[1480px] gap-4 overflow-y-auto px-4 py-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(410px,520px)] lg:overflow-hidden lg:px-6 lg:py-6">
        <section className="tema-superficie-hero relative hidden h-full overflow-hidden rounded-[36px] p-10 lg:flex lg:flex-col lg:justify-between">
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
              Acceso ASTRA
            </span>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--shell-hero-texto-tenue)]">
              Ritual de ingreso
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[color:var(--shell-hero-texto)] xl:text-[52px]">
              Entrá a una experiencia más íntima, precisa y consistente.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[color:var(--shell-hero-texto-secundario)]">
              ASTRA reúne tu carta natal, tu Diseño Humano y tu numerología en un
              solo espacio de lectura continua, sin pantallas que se sientan ajenas
              al resto del producto.
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
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-white/10 text-white">
                <Icono nombre="escudo" tamaño={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-hero-texto-tenue)]">
                  Lo que recuperás al volver
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--shell-hero-texto-secundario)]">
                  Tu dashboard, el historial de lecturas y el contexto personal para
                  que la experiencia no arranque de cero cada vez que volvés.
                </p>
              </div>
            </div>
          </div>
        </section>

        <main className="flex min-h-full items-center justify-center py-2 lg:h-full lg:py-0">
          <div className="flex w-full max-w-[520px] flex-col justify-center">
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
                  Acceso personal
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--shell-hero-texto-secundario)]">
                  Tu mapa, tus cálculos y tu historial en una sola sesión coherente
                  con el resto de ASTRA.
                </p>
              </div>
            </section>

            <section className="tema-superficie-panel-suave relative overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-9">
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
