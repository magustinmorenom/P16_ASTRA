// frontend/src/tests/componentes/barra-navegacion-inferior.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUsePathname = vi.fn(() => "/dashboard");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import BarraNavegacionInferior from "@/componentes/layouts/barra-navegacion-inferior";

describe("BarraNavegacionInferior", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("muestra 4 tabs: Inicio, Astral, Explorar, Podcast", () => {
    render(<BarraNavegacionInferior />);

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Astral")).toBeInTheDocument();
    expect(screen.getByText("Explorar")).toBeInTheDocument();
    expect(screen.getByText("Podcast")).toBeInTheDocument();
  });

  it("NO muestra el tab Perfil", () => {
    render(<BarraNavegacionInferior />);

    expect(screen.queryByText("Perfil")).not.toBeInTheDocument();
  });

  it("incluye un enlace al chat con aria-label 'Abrir chat'", () => {
    render(<BarraNavegacionInferior />);

    const fabChat = screen.getByRole("link", { name: "Abrir chat" });
    expect(fabChat).toBeInTheDocument();
    expect(fabChat).toHaveAttribute("href", "/chat");
  });

  it("el FAB usa fondo #7C4DFF cuando NO está en /chat", () => {
    render(<BarraNavegacionInferior />);

    const fabChat = screen.getByRole("link", { name: "Abrir chat" });
    const innerBtn = fabChat.querySelector("div");
    expect(innerBtn?.className).toContain("7C4DFF");
    expect(innerBtn?.className).not.toContain("9333EA");
  });

  it("el FAB usa fondo #9333EA cuando está en /chat", () => {
    mockUsePathname.mockReturnValue("/chat");
    render(<BarraNavegacionInferior />);

    const fabChat = screen.getByRole("link", { name: "Abrir chat" });
    const innerBtn = fabChat.querySelector("div");
    expect(innerBtn?.className).toContain("9333EA");
    expect(innerBtn?.className).not.toContain("7C4DFF");
  });
});
