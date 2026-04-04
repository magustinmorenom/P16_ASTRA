import { type CSSProperties, type ReactNode } from "react";

interface PanelGlassProps {
  children: ReactNode;
  className?: string;
  tono?: "panel" | "hero";
  style?: CSSProperties;
}

export function PanelGlass({
  children,
  className = "",
  tono = "panel",
  style,
}: PanelGlassProps) {
  const esHero = tono === "hero";

  return (
    <div
      className={`rounded-xl border backdrop-blur-[21px] ${className}`}
      style={{
        background: esHero ? "var(--shell-hero-superficie)" : "var(--shell-superficie)",
        borderColor: esHero ? "var(--shell-hero-superficie-fuerte)" : "var(--shell-borde)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
