import type { Metadata, Viewport } from "next";
import { Inter, Inria_Sans } from "next/font/google";
import "./globals.css";
import { ProveedorQuery } from "@/proveedores/proveedor-query";
import { ProveedorAuth } from "@/proveedores/proveedor-auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const inriaSans = Inria_Sans({
  variable: "--font-inria",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2D1B69",
};

export const metadata: Metadata = {
  title: "ASTRA — Tu mapa cósmico personal",
  description:
    "Plataforma de cálculo esotérico-astronómico: Carta Astral, Diseño Humano, Numerología, Revolución Solar y Tránsitos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ASTRA",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${inriaSans.variable} h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/img/icon-192.png" />
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <ProveedorQuery>
          <ProveedorAuth>{children}</ProveedorAuth>
        </ProveedorQuery>
      </body>
    </html>
  );
}
