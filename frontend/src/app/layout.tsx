import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProveedorQuery } from "@/proveedores/proveedor-query";
import { ProveedorAuth } from "@/proveedores/proveedor-auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ASTRA — Tu mapa cósmico personal",
  description:
    "Plataforma de cálculo esotérico-astronómico: Carta Astral, Diseño Humano, Numerología, Revolución Solar y Tránsitos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ProveedorQuery>
          <ProveedorAuth>{children}</ProveedorAuth>
        </ProveedorQuery>
      </body>
    </html>
  );
}
