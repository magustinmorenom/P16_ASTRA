"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icono } from "@/componentes/ui/icono";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarEsMobile } from "@/lib/hooks/usar-es-mobile";
import { usarEnviarMensaje, usarHistorialChat, usarNuevaConversacion } from "@/lib/hooks/usar-chat";
import type { MensajeChat } from "@/lib/tipos";

// ─────────────────────────────────────────────────────────────
// Sugerencias rápidas para el primer mensaje
// ─────────────────────────────────────────────────────────────
const SUGERENCIAS = [
  { etiqueta: "Mi día", mensaje: "¿Cómo viene mi energía hoy?" },
  { etiqueta: "Mi perfil", mensaje: "Contame sobre mi perfil cósmico" },
  { etiqueta: "Consejo", mensaje: "Necesito un consejo para hoy" },
];

// ─────────────────────────────────────────────────────────────
// Indicador de escritura (3 puntos animados)
// ─────────────────────────────────────────────────────────────
function IndicadorEscribiendo() {
  return (
    <div className="flex justify-start items-end animate-chat-msg">
      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-300 to-violet-400 shrink-0 mb-2.5 mr-2 animate-chat-soft-pulse" />
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center"
        style={{
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.45)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-300 to-violet-400"
            style={{
              animation: `chat-dot 1.6s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Burbuja de mensaje
// ─────────────────────────────────────────────────────────────
function BurbujaMensaje({ msg }: { msg: MensajeChat }) {
  const esUsuario = msg.rol === "user";

  return (
    <div
      className={`flex items-end animate-chat-msg ${esUsuario ? "justify-end" : "justify-start"}`}
    >
      {!esUsuario && (
        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-300 to-violet-400 shrink-0 mb-2.5 mr-2 animate-chat-soft-pulse" />
      )}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed ${
          esUsuario
            ? "rounded-2xl rounded-br-sm text-white"
            : "rounded-2xl rounded-bl-sm text-texto"
        }`}
        style={
          esUsuario
            ? {
                background:
                  "linear-gradient(135deg, var(--color-violet-600), var(--color-violet-500))",
                border: "1px solid var(--color-violet-400)",
                boxShadow: "0 3px 14px rgba(124,77,255,0.18)",
              }
            : {
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.45)",
                boxShadow: "0 2px 10px rgba(124,77,255,0.04)",
              }
        }
      >
        {msg.contenido}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Widget principal
// ─────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [input, setInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { autenticado, usuario } = useStoreAuth();
  const esMobile = usarEsMobile();

  const { data: historial, refetch: refetchHistorial } = usarHistorialChat(abierto && !historialCargado);
  const enviarMutation = usarEnviarMensaje();
  const nuevaConvMutation = usarNuevaConversacion();

  // Cargar historial cuando se abre por primera vez
  useEffect(() => {
    if (historial?.mensajes && !historialCargado) {
      setMensajes(historial.mensajes);
      setHistorialCargado(true);
    }
  }, [historial, historialCargado]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, escribiendo]);

  // Focus en input al abrir
  useEffect(() => {
    if (abierto && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [abierto]);

  const enviar = useCallback(() => {
    const texto = input.trim();
    if (!texto || escribiendo || limiteAlcanzado) return;

    const ahora = new Date().toISOString();

    // Agregar mensaje del usuario inmediatamente (optimistic)
    setMensajes((prev) => [
      ...prev,
      { rol: "user", contenido: texto, fecha: ahora },
    ]);
    setInput("");
    setEscribiendo(true);

    enviarMutation.mutate(texto, {
      onSuccess: (data) => {
        setMensajes((prev) => [
          ...prev,
          { rol: "assistant", contenido: data.respuesta, fecha: new Date().toISOString() },
        ]);
        setRestantes(data.mensajes_restantes);
        setEscribiendo(false);
      },
      onError: (error) => {
        const errorMsg = (error as Error).message || "";
        if (errorMsg.includes("límite")) {
          setLimiteAlcanzado(true);
          setMensajes((prev) => [
            ...prev,
            {
              rol: "assistant",
              contenido:
                "Llegaste a tu límite de mensajes diarios. Con Premium, hablamos sin límites.",
              fecha: new Date().toISOString(),
            },
          ]);
        } else {
          setMensajes((prev) => [
            ...prev,
            {
              rol: "assistant",
              contenido: "Disculpá, hubo un error. Intentá de nuevo.",
              fecha: new Date().toISOString(),
            },
          ]);
        }
        setEscribiendo(false);
      },
    });
  }, [input, escribiendo, limiteAlcanzado, enviarMutation]);

  const enviarSugerencia = useCallback(
    (mensaje: string) => {
      setInput(mensaje);
      setTimeout(() => {
        setInput("");
        const ahora = new Date().toISOString();
        setMensajes((prev) => [
          ...prev,
          { rol: "user", contenido: mensaje, fecha: ahora },
        ]);
        setEscribiendo(true);

        enviarMutation.mutate(mensaje, {
          onSuccess: (data) => {
            setMensajes((prev) => [
              ...prev,
              { rol: "assistant", contenido: data.respuesta, fecha: new Date().toISOString() },
            ]);
            setRestantes(data.mensajes_restantes);
            setEscribiendo(false);
          },
          onError: () => {
            setMensajes((prev) => [
              ...prev,
              {
                rol: "assistant",
                contenido: "Disculpá, hubo un error. Intentá de nuevo.",
                fecha: new Date().toISOString(),
              },
            ]);
            setEscribiendo(false);
          },
        });
      }, 50);
    },
    [enviarMutation],
  );

  const iniciarNueva = useCallback(() => {
    nuevaConvMutation.mutate(undefined, {
      onSuccess: () => {
        setMensajes([]);
        setLimiteAlcanzado(false);
        setHistorialCargado(false);
      },
    });
  }, [nuevaConvMutation]);

  // No mostrar si no está autenticado o no tiene perfil
  if (!autenticado || !usuario?.tiene_perfil) return null;

  const nombre = usuario?.nombre?.split(" ")[0] || "ahí";
  const mostrarSugerencias = mensajes.length === 0;

  return (
    <>
      {/* ── Overlay (solo cuando está abierto) ── */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-[9998] animate-fade-in"
          style={{
            background: "rgba(15,10,30,0.18)",
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── Panel del Chat ── */}
      <div
        className="fixed z-[9999] font-sans"
        style={{
          bottom: 12,
          right: 12,
          left: esMobile ? 12 : "auto",
          width: esMobile ? "auto" : 400,
          maxHeight: abierto ? "80vh" : 0,
          opacity: abierto ? 1 : 0,
          transform: abierto ? "translateY(0)" : "translateY(24px)",
          transition:
            "max-height 0.5s cubic-bezier(0.33,1,0.68,1), opacity 0.45s ease 0.04s, transform 0.5s cubic-bezier(0.33,1,0.68,1)",
          overflow: "hidden",
          pointerEvents: abierto ? "auto" : "none",
        }}
      >
        <div
          className="flex flex-col overflow-hidden"
          style={{
            maxWidth: esMobile ? "100%" : 400,
            marginLeft: "auto",
            borderRadius: 22,
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(32px) saturate(190%)",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow:
              "0 -4px 60px rgba(124,77,255,0.07), 0 8px 40px rgba(124,77,255,0.11), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.65)",
            maxHeight: "78vh",
          }}
        >
          {/* Aurora background decorativo */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: `
                radial-gradient(ellipse at 20% 0%, rgba(124,77,255,0.07) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 100%, rgba(124,77,255,0.05) 0%, transparent 50%)
              `,
            }}
          />

          {/* ── Header ── */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-violet-100/30 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white relative"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-violet-700), var(--color-violet-500))",
                  boxShadow: "0 2px 12px rgba(124,77,255,0.18)",
                }}
              >
                <Icono nombre="destello" tamaño={16} peso="fill" />
                <div
                  className="absolute -inset-0.5 rounded-[14px] border border-violet-300/25 animate-chat-breathe"
                />
              </div>
              <div>
                <div className="font-semibold text-[15px] text-texto tracking-tight">
                  Oráculo
                </div>
                <div className="text-[10.5px] text-primario font-medium flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primario animate-chat-soft-pulse" />
                  En línea
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {mensajes.length > 0 && (
                <button
                  onClick={iniciarNueva}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-texto-secundario hover:text-primario hover:bg-violet-50/50 transition-all"
                  title="Nueva conversación"
                >
                  <Icono nombre="avion" tamaño={14} />
                </button>
              )}
              <button
                onClick={() => setAbierto(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-texto-secundario hover:text-primario hover:bg-violet-50/50 transition-all hover:rotate-90"
                style={{ transition: "all 0.3s ease" }}
              >
                <Icono nombre="x" tamaño={14} />
              </button>
            </div>
          </div>

          {/* ── Mensajes ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 pt-4 pb-2 flex flex-col gap-3 relative z-10 scroll-sutil"
            style={{ minHeight: 200, maxHeight: "50vh" }}
          >
            {/* Mensaje de bienvenida si no hay historial */}
            {mostrarSugerencias && (
              <div className="animate-chat-msg">
                <div className="flex justify-start items-end">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-300 to-violet-400 shrink-0 mb-2.5 mr-2" />
                  <div
                    className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm text-[13px] leading-relaxed text-texto"
                    style={{
                      background: "rgba(255,255,255,0.5)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.45)",
                    }}
                  >
                    Hola {nombre}. Soy tu oráculo personal. Conozco tu carta
                    natal, tu diseño humano y tu numerología. Preguntame lo que
                    necesites.
                  </div>
                </div>
              </div>
            )}

            {mensajes.map((msg, i) => (
              <BurbujaMensaje key={i} msg={msg} />
            ))}

            {escribiendo && <IndicadorEscribiendo />}
          </div>

          {/* ── Sugerencias rápidas ── */}
          {mostrarSugerencias && (
            <div className="flex gap-1.5 px-3 pb-2 flex-wrap relative z-10 animate-chat-msg">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s.etiqueta}
                  onClick={() => enviarSugerencia(s.mensaje)}
                  className="px-3 py-1.5 rounded-full text-[11.5px] font-medium text-primario transition-all hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid var(--color-violet-200)",
                  }}
                >
                  {s.etiqueta}
                </button>
              ))}
            </div>
          )}

          {/* ── Límite alcanzado ── */}
          {restantes !== null && restantes <= 0 && (
            <div className="px-3 pb-1 relative z-10">
              <div className="text-[10px] text-center text-texto-secundario">
                Sin mensajes restantes hoy.{" "}
                <a href="/suscripcion" className="text-primario font-medium hover:underline">
                  Pasate a Premium
                </a>
              </div>
            </div>
          )}

          {/* ── Contador restante (solo gratis) ── */}
          {restantes !== null && restantes > 0 && (
            <div className="px-3 pb-1 relative z-10">
              <div className="text-[10px] text-center text-texto-terciario">
                {restantes} mensaje{restantes !== 1 ? "s" : ""} restante{restantes !== 1 ? "s" : ""} hoy
              </div>
            </div>
          )}

          {/* ── Input ── */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-violet-100/20 shrink-0 relative z-10">
            <div
              className="flex-1 rounded-2xl transition-all"
              style={{
                background: "rgba(255,255,255,0.45)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--color-violet-100)",
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviar()}
                placeholder="Preguntale al oráculo..."
                disabled={limiteAlcanzado}
                className="w-full px-4 py-2.5 rounded-2xl border-none bg-transparent outline-none text-[13px] text-texto placeholder:text-texto-terciario disabled:opacity-50"
              />
            </div>
            <button
              onClick={enviar}
              disabled={!input.trim() || escribiendo || limiteAlcanzado}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, var(--color-violet-600), var(--color-violet-500))"
                  : "rgba(255,255,255,0.35)",
                border: "1px solid var(--color-violet-200)",
                color: input.trim() ? "#fff" : "var(--color-violet-300)",
                boxShadow: input.trim()
                  ? "0 3px 16px rgba(124,77,255,0.22)"
                  : "none",
                transform: input.trim() ? "scale(1.02)" : "scale(1)",
                cursor: input.trim() ? "pointer" : "default",
              }}
            >
              <Icono nombre="enviarMensaje" tamaño={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── FAB (Floating Action Button) ── */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="fixed z-[10000] flex items-center justify-center text-white transition-all group"
        style={{
          bottom: 20,
          right: 20,
          width: abierto ? 0 : 52,
          height: abierto ? 0 : 52,
          borderRadius: 18,
          background:
            "linear-gradient(135deg, var(--color-violet-700), var(--color-violet-500))",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 5px 22px rgba(124,77,255,0.28), 0 0 35px rgba(124,77,255,0.07), inset 0 1px 0 rgba(255,255,255,0.12)",
          opacity: abierto ? 0 : 1,
          transform: abierto
            ? "scale(0.3) rotate(180deg)"
            : "scale(1)",
          overflow: "hidden",
          border: "none",
          cursor: "pointer",
        }}
      >
        {/* Anillos de pulso iniciales */}
        {!abierto && (
          <>
            <div
              className="absolute rounded-[22px] border border-violet-400/30"
              style={{
                inset: -5,
                animation: "chat-pulse-ring 2.5s ease-out infinite",
              }}
            />
            <div
              className="absolute rounded-[28px] border border-violet-300/18"
              style={{
                inset: -11,
                animation: "chat-pulse-ring 2.5s ease-out 0.5s infinite",
              }}
            />
          </>
        )}
        {/* Reflejo glassmorphic */}
        <div
          className="absolute inset-0 rounded-[18px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), transparent 55%)",
          }}
        />
        <Icono
          nombre="destello"
          tamaño={22}
          peso="fill"
          className="relative z-10 group-hover:scale-110 transition-transform"
        />
      </button>
    </>
  );
}
