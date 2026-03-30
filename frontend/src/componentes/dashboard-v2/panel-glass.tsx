import { type ReactNode } from "react";

interface PanelGlassProps {
  children: ReactNode;
  className?: string;
}

export function PanelGlass({ children, className = "" }: PanelGlassProps) {
  return (
    <div
      className={`rounded-xl backdrop-blur-[21px] bg-white/[0.07] border border-white/[0.12] ${className}`}
    >
      {children}
    </div>
  );
}
