"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icono } from "@/componentes/ui/icono";
import {
  usarRenombrarConversacion,
  usarAnclarConversacion,
  usarArchivarConversacion,
  usarEliminarConversacion,
} from "@/lib/hooks/usar-chat";
import { cn } from "@/lib/utilidades/cn";
import type { ConversacionResumen } from "@/lib/tipos";

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────
export interface PanelConversacionesWebProps {
  conversaciones: ConversacionResumen[];
  conversacionActiva: string | null;
  onSeleccionar: (id: string) => void;
  onNueva: () => void;
  colapsado?: boolean;
  onCerrar?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────
function fechaRelativa(fecha: string | null): string {
  if (!fecha) return "";
  const ahora = Date.now();
  const dt = new Date(fecha).getTime();
  const diffMs = ahora - dt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  const diffS = Math.floor(diffD / 7);
  if (diffS < 5) return `${diffS}sem`;
  const diffM = Math.floor(diffD / 30);
  return `${diffM}mes${diffM > 1 ? "es" : ""}`;
}

function ordenarConversaciones(
  lista: ConversacionResumen[],
): ConversacionResumen[] {
  return [...lista]
    .filter((c) => !c.archivada)
    .sort((a, b) => {
      if (a.anclada && !b.anclada) return -1;
      if (!a.anclada && b.anclada) return 1;
      const fa = a.creado_en ? new Date(a.creado_en).getTime() : 0;
      const fb = b.creado_en ? new Date(b.creado_en).getTime() : 0;
      return fb - fa;
    });
}

// ─────────────────────────────────────────────────────────────
// Menu contextual por item
// ─────────────────────────────────────────────────────────────
function MenuContextual({
  conversacion,
  onCerrar,
}: {
  conversacion: ConversacionResumen;
  onCerrar: () => void;
}) {
  const renombrar = usarRenombrarConversacion();
  const anclar = usarAnclarConversacion();
  const archivar = usarArchivarConversacion();
  const eliminar = usarEliminarConversacion();
  const menuRef = useRef<HTMLDivElement>(null);

  const [modoRenombrar, setModoRenombrar] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState(
    conversacion.titulo || conversacion.preview || "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modoRenombrar && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [modoRenombrar]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function manejarClickFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCerrar();
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, [onCerrar]);

  const ejecutarRenombrar = useCallback(() => {
    const titulo = nuevoTitulo.trim();
    if (titulo && titulo !== conversacion.titulo) {
      renombrar.mutate({ id: conversacion.id, titulo });
    }
    setModoRenombrar(false);
    onCerrar();
  }, [nuevoTitulo, conversacion, renombrar, onCerrar]);

  if (modoRenombrar) {
    return (
      <div
        ref={menuRef}
        className="absolute right-0 top-full mt-1 z-50 rounded-xl p-2 min-w-[200px] animate-[fadeIn_150ms_ease-out]"
        style={{
          background: "var(--shell-superficie-fuerte)",
          border: "1px solid var(--shell-borde)",
          boxShadow: "var(--shell-sombra-fuerte)",
          backdropFilter: "blur(20px)",
        }}
      >
        <input
          ref={inputRef}
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ejecutarRenombrar();
            if (e.key === "Escape") onCerrar();
          }}
          className="w-full px-3 py-1.5 rounded-lg text-[13px] bg-transparent outline-none"
          style={{
            color: "var(--shell-texto)",
            border: "1px solid var(--shell-borde-fuerte)",
          }}
          placeholder="Nuevo nombre..."
        />
        <div className="flex justify-end gap-1 mt-2">
          <button
            onClick={onCerrar}
            className="px-2 py-1 rounded-md text-[11px] transition-colors"
            style={{ color: "var(--shell-texto-secundario)" }}
          >
            Cancelar
          </button>
          <button
            onClick={ejecutarRenombrar}
            className="px-2 py-1 rounded-md text-[11px] font-medium text-white transition-colors"
            style={{ background: "var(--color-acento)" }}
          >
            Guardar
          </button>
        </div>
      </div>
    );
  }

  const opciones = [
    {
      icono: "lapiz" as const,
      texto: "Renombrar",
      accion: () => setModoRenombrar(true),
    },
    {
      icono: "estrella" as const,
      texto: conversacion.anclada ? "Desanclar" : "Anclar",
      accion: () => {
        anclar.mutate(conversacion.id);
        onCerrar();
      },
    },
    {
      icono: "descarga" as const,
      texto: "Archivar",
      accion: () => {
        archivar.mutate(conversacion.id);
        onCerrar();
      },
    },
    {
      icono: "papelera" as const,
      texto: "Eliminar",
      accion: () => {
        const confirmar = window.confirm(
          "¿Estás seguro de que querés eliminar esta conversación? Esta acción no se puede deshacer.",
        );
        if (confirmar) {
          eliminar.mutate(conversacion.id);
        }
        onCerrar();
      },
      peligro: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[160px] animate-[fadeIn_150ms_ease-out]"
      style={{
        background: "var(--shell-superficie-fuerte)",
        border: "1px solid var(--shell-borde)",
        boxShadow: "var(--shell-sombra-fuerte)",
        backdropFilter: "blur(20px)",
      }}
    >
      {opciones.map((op) => (
        <button
          key={op.texto}
          onClick={op.accion}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] transition-colors",
            op.peligro
              ? "text-[color:var(--color-peligro-texto)] hover:bg-[var(--color-peligro-suave)]"
              : "hover:bg-[var(--shell-chip-hover)]",
          )}
          style={
            op.peligro
              ? undefined
              : { color: "var(--shell-texto)" }
          }
        >
          <Icono nombre={op.icono} tamaño={14} />
          {op.texto}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Item de conversacion
// ─────────────────────────────────────────────────────────────
function ItemConversacion({
  conversacion,
  activa,
  onSeleccionar,
}: {
  conversacion: ConversacionResumen;
  activa: boolean;
  onSeleccionar: () => void;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const titulo =
    conversacion.titulo ||
    (conversacion.preview.length > 40
      ? conversacion.preview.slice(0, 40) + "..."
      : conversacion.preview) ||
    "Conversacion sin titulo";

  return (
    <div className="relative group">
      <button
        onClick={onSeleccionar}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all duration-200",
          activa
            ? "bg-[var(--shell-chip)] border border-[var(--shell-borde-fuerte)]"
            : "border border-transparent hover:bg-[var(--shell-chip-hover)]",
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {conversacion.anclada && (
              <Icono
                nombre="estrella"
                tamaño={11}
                peso="fill"
                className="text-[var(--color-acento)] shrink-0"
              />
            )}
            <span
              className="text-[13px] font-medium truncate block"
              style={{ color: activa ? "var(--shell-texto)" : "var(--shell-texto)" }}
            >
              {titulo}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10.5px]"
              style={{ color: "var(--shell-texto-terciario)" }}
            >
              {fechaRelativa(conversacion.creado_en)}
            </span>
            {conversacion.total_mensajes > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  color: "var(--shell-texto-secundario)",
                  background: "var(--shell-superficie)",
                }}
              >
                {conversacion.total_mensajes}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Boton de menu contextual */}
      <div className="absolute right-2 top-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuAbierto((v) => !v);
          }}
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200",
            menuAbierto
              ? "opacity-100 bg-[var(--shell-superficie)]"
              : "opacity-0 group-hover:opacity-100",
          )}
          style={{ color: "var(--shell-texto-secundario)" }}
        >
          <Icono nombre="caretAbajo" tamaño={12} />
        </button>

        {menuAbierto && (
          <MenuContextual
            conversacion={conversacion}
            onCerrar={() => setMenuAbierto(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panel principal
// ─────────────────────────────────────────────────────────────
export default function PanelConversacionesWeb({
  conversaciones,
  conversacionActiva,
  onSeleccionar,
  onNueva,
  colapsado = false,
  onCerrar,
}: PanelConversacionesWebProps) {
  const ordenadas = ordenarConversaciones(conversaciones);

  const contenido = (
    <div
      className="flex flex-col h-full"
      style={{
        background: "var(--shell-superficie-fuerte)",
        borderRight: "1px solid var(--shell-borde)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        <h2
          className="text-[15px] font-semibold tracking-tight"
          style={{ color: "var(--shell-texto)" }}
        >
          Conversaciones
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNueva}
            title="Nueva conversación"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              color: "#7C4DFF",
              background: "var(--shell-superficie)",
              border: "1px solid var(--shell-borde)",
            }}
          >
            <Icono nombre="plus" tamaño={18} />
          </button>
          {onCerrar && (
            <button
              onClick={onCerrar}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors lg:hidden"
              style={{ color: "var(--shell-texto-secundario)" }}
            >
              <Icono nombre="x" tamaño={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto scroll-sutil px-2 py-2 flex flex-col gap-0.5">
        {ordenadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12 px-4">
            <Icono
              nombre="chat"
              tamaño={28}
              className="opacity-30"
              peso="regular"
            />
            <p
              className="text-[12.5px] text-center"
              style={{ color: "var(--shell-texto-terciario)" }}
            >
              No hay conversaciones todavia. Inicia una nueva para hablar con tu
              oraculo.
            </p>
          </div>
        ) : (
          ordenadas.map((c, i) => (
            <div
              key={c.id}
              className="animate-[fadeIn_200ms_ease-out]"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
            >
              <ItemConversacion
                conversacion={c}
                activa={c.id === conversacionActiva}
                onSeleccionar={() => onSeleccionar(c.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Desktop: panel fijo
  // Mobile: drawer con overlay
  return (
    <>
      {/* Mobile overlay */}
      {!colapsado && onCerrar && (
        <div
          className="fixed inset-0 z-40 lg:hidden animate-[fadeIn_200ms_ease-out]"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          onClick={onCerrar}
        />
      )}

      <aside
        className={cn(
          // Desktop
          "hidden lg:flex lg:flex-col lg:w-[280px] lg:shrink-0 h-full",
          // Mobile: slide-over
          !colapsado &&
            "!flex fixed inset-y-0 left-0 z-50 w-[300px] shadow-2xl lg:relative lg:shadow-none lg:z-auto",
        )}
        style={{
          transition: "transform 300ms cubic-bezier(0.33,1,0.68,1)",
        }}
      >
        {contenido}
      </aside>
    </>
  );
}
