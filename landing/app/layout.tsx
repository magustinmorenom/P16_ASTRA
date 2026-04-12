import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ASTRA | Autoconocimiento con astrología, numerología y agente IA",
  description:
    "ASTRA es una plataforma web y app de autoconocimiento con un agente IA que integra carta astrológica, numerología, Diseño Humano y tránsitos planetarios en tiempo real.",
  icons: {
    icon: "/img/isotipo-ciruela.png",
    apple: "/img/isotipo-ciruela.png",
  },
  keywords: [
    "autoconocimiento",
    "agente IA astrología",
    "carta astrológica online",
    "astrología personalizada",
    "numerología personalizada",
    "Diseño Humano",
    "tránsitos planetarios",
    "mejores momentos para tomar decisiones",
    "herramienta de autoconocimiento",
    "energía diaria",
    "mapa personal",
    "app de astrología",
    "astrología Argentina",
    "lectura integrada",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
