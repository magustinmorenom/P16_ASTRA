"use client";

import Image from "next/image";

interface PropsLayoutOnboarding {
  children: React.ReactNode;
  /** Texto descriptivo que aparece en el panel izquierdo, cambia según el paso */
  textoPanel?: string;
  /** Si es true, usa layout full-screen oscuro (paso calculando) */
  modoOscuro?: boolean;
}

export default function LayoutOnboarding({
  children,
  textoPanel = "Configuremos tu perfil cósmico",
  modoOscuro = false,
}: PropsLayoutOnboarding) {
  // Modo oscuro: layout full-screen con gradiente (paso 3 - calculando)
  if (modoOscuro) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-[#0F0A1A] via-[#2D1B69] via-60% to-[#7C4DFF] flex items-center justify-center p-8">
        <div className="w-full max-w-xl">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-t from-[#0F0A1A] via-[#2D1B69] via-60% to-[#7C4DFF]">
      {/* Panel izquierdo - branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Estrellas decorativas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[8%] left-[20%] w-1 h-1 rounded-full bg-white/60 animate-pulse" />
          <div className="absolute top-[12%] left-[28%] w-0.5 h-0.5 rounded-full bg-white/40 animate-pulse delay-200" />
          <div className="absolute top-[18%] right-[30%] w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse delay-500" />
          <div className="absolute top-[35%] left-[12%] w-1 h-1 rounded-full bg-white/70 animate-pulse delay-300" />
          <div className="absolute top-[45%] right-[18%] w-0.5 h-0.5 rounded-full bg-white/50 animate-pulse delay-700" />
          <div className="absolute top-[55%] left-[35%] w-1 h-1 rounded-full bg-white/30 animate-pulse delay-1000" />
          <div className="absolute top-[70%] right-[25%] w-1 h-1 rounded-full bg-white/60 animate-pulse delay-400" />
          <div className="absolute bottom-[20%] left-[18%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse delay-600" />
          <div className="absolute bottom-[10%] right-[35%] w-0.5 h-0.5 rounded-full bg-white/50 animate-pulse delay-800" />

          {/* Lineas de constelación */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            viewBox="0 0 400 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="80" y1="60" x2="160" y2="120" stroke="white" strokeWidth="0.5" />
            <line x1="160" y1="120" x2="140" y2="200" stroke="white" strokeWidth="0.5" />
            <line x1="140" y1="200" x2="220" y2="250" stroke="white" strokeWidth="0.5" />
            <line x1="220" y1="250" x2="280" y2="180" stroke="white" strokeWidth="0.5" />
            <line x1="280" y1="180" x2="320" y2="300" stroke="white" strokeWidth="0.5" />
            <line x1="120" y1="350" x2="200" y2="400" stroke="white" strokeWidth="0.5" />
            <line x1="200" y1="400" x2="260" y2="380" stroke="white" strokeWidth="0.5" />
            <line x1="260" y1="380" x2="300" y2="450" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-sm">
          {/* Logo ASTRA con sparkle dorado */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.09 8.26L20 9.27L15.45 13.14L16.82 20L12 16.77L7.18 20L8.55 13.14L4 9.27L9.91 8.26L12 2Z" fill="#F0D68A" />
            </svg>
            <Image
              src="/img/logo-astra-blanco.png"
              alt="ASTRA"
              width={160}
              height={44}
              className="h-11 w-auto"
              priority
            />
          </div>
          <p className="text-[#B388FF] text-base leading-relaxed">
            {textoPanel}
          </p>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="w-full lg:w-[620px] flex-shrink-0 flex items-center justify-center bg-white lg:rounded-l-[32px] relative z-10 p-8 lg:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
