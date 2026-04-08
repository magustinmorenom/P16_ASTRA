"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Icono } from "@/componentes/ui/icono";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { useStoreAuth } from "@/lib/stores/store-auth";
import { usarHistorialChat, usarEnviarMensaje } from "@/lib/hooks/usar-chat";
import { esPlanPago } from "@/lib/utilidades/planes";
import type { MensajeChat } from "@/lib/tipos";

// ─────────────────────────────────────────────────────────────
// Renderizado de markdown inline (negrita, cursiva)
// ─────────────────────────────────────────────────────────────
function renderizarTexto(texto: string): React.ReactNode[] {
  const partes: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let ultimo = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimo) {
      partes.push(texto.slice(ultimo, match.index));
    }
    if (match[1]) {
      partes.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      partes.push(
        <em key={key++} className="italic">
          {match[4]}
        </em>,
      );
    }
    ultimo = match.index + match[0].length;
  }

  if (ultimo < texto.length) {
    partes.push(texto.slice(ultimo));
  }

  return partes.length > 0 ? partes : [texto];
}

function renderizarContenido(contenido: string): React.ReactNode {
  return contenido.split("\n").map((linea, i, arr) => (
    <span key={i}>
      {renderizarTexto(linea)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ─────────────────────────────────────────────────────────────
// Sugerencias para estado vacio
// ─────────────────────────────────────────────────────────────
const SUGERENCIAS = [
  {
    icono: "sol" as const,
    etiqueta: "Mi energia hoy",
    mensaje: "¿Como viene mi energia hoy?",
  },
  {
    icono: "estrella" as const,
    etiqueta: "Mi perfil cosmico",
    mensaje: "Contame sobre mi perfil cosmico",
  },
  {
    icono: "destello" as const,
    etiqueta: "Consejo del dia",
    mensaje: "Necesito un consejo para hoy",
  },
];

// ─────────────────────────────────────────────────────────────
// Indicador de escritura (3 puntos animados)
// ─────────────────────────────────────────────────────────────
function IndicadorEscribiendo() {
  return (
    <div className="flex justify-start items-end animate-[fadeIn_200ms_ease-out]">
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center"
        style={{
          background: "var(--shell-superficie)",
          border: "1px solid var(--shell-borde)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--color-acento)",
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
function BurbujaMensaje({
  msg,
  indice,
}: {
  msg: MensajeChat;
  indice: number;
}) {
  const esUsuario = msg.rol === "user";

  return (
    <div
      className={`flex items-end ${esUsuario ? "justify-end" : "justify-start"} animate-[fadeSlideIn_250ms_ease-out_both]`}
      style={{ animationDelay: `${indice * 30}ms` }}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-line ${
          esUsuario
            ? "rounded-2xl rounded-br-sm text-white"
            : "rounded-2xl rounded-bl-sm"
        }`}
        style={
          esUsuario
            ? {
                background:
                  "linear-gradient(135deg, #7C4DFF, #4A2D8C)",
                boxShadow: "0 2px 8px rgba(124,77,255,0.2)",
              }
            : {
                background: "var(--shell-superficie)",
                border: "1px solid var(--shell-borde)",
                color: "var(--shell-texto)",
              }
        }
      >
        {esUsuario ? msg.contenido : renderizarContenido(msg.contenido)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Esqueleto de carga
// ─────────────────────────────────────────────────────────────
function EsqueletoCargando() {
  const anchos = ["w-60", "w-80", "w-44", "w-72"];
  return (
    <div className="flex flex-col gap-4 p-6">
      {anchos.map((w, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Esqueleto className={`rounded-2xl h-11 ${w}`} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
export interface AreaChatWebProps {
  conversacionId: string | null;
  tituloConversacion: string | null;
  onMensajeEnviado?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export default function AreaChatWeb({
  conversacionId,
  tituloConversacion,
  onMensajeEnviado,
}: AreaChatWebProps) {
  const usuario = useStoreAuth((s) => s.usuario);
  const esPremium = esPlanPago(usuario?.plan_slug);

  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [input, setInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tieneConversacion = conversacionId !== null;

  // Cargar historial de la conversacion activa
  const { data: historial, isLoading: cargandoHistorial } =
    usarHistorialChat(tieneConversacion);
  const enviarMutation = usarEnviarMensaje();

  // Sincronizar mensajes cuando cambia el historial o la conversacion
  useEffect(() => {
    if (historial?.mensajes) {
      setMensajes(historial.mensajes);
    } else if (!tieneConversacion) {
      setMensajes([]);
    }
  }, [historial, tieneConversacion, conversacionId]);

  // Reset al cambiar de conversacion
  useEffect(() => {
    setInput("");
    setEscribiendo(false);
    setLimiteAlcanzado(false);
    setRestantes(null);
  }, [conversacionId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [mensajes, escribiendo]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const enviar = useCallback(
    (textoDirecto?: string) => {
      const texto = (textoDirecto || input).trim();
      if (!texto || escribiendo || limiteAlcanzado) return;

      const ahora = new Date().toISOString();
      setMensajes((prev) => [
        ...prev,
        { rol: "user", contenido: texto, fecha: ahora },
      ]);
      setInput("");
      setEscribiendo(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      enviarMutation.mutate(texto, {
        onSuccess: (data) => {
          setMensajes((prev) => [
            ...prev,
            {
              rol: "assistant",
              contenido: data.respuesta,
              fecha: new Date().toISOString(),
            },
          ]);
          setRestantes(data.mensajes_restantes);
          if (data.mensajes_restantes !== null && data.mensajes_restantes <= 0) {
            setLimiteAlcanzado(true);
          }
          setEscribiendo(false);
          onMensajeEnviado?.();
        },
        onError: (error) => {
          const errorMsg = (error as Error).message || "";
          if (errorMsg.includes("limite") || errorMsg.includes("límite")) {
            setLimiteAlcanzado(true);
            setMensajes((prev) => [
              ...prev,
              {
                rol: "assistant",
                contenido:
                  "Llegaste a tu limite de mensajes diarios. Con Premium, hablamos sin limites.",
                fecha: new Date().toISOString(),
              },
            ]);
          } else {
            setMensajes((prev) => [
              ...prev,
              {
                rol: "assistant",
                contenido: "Disculpa, hubo un error. Intenta de nuevo.",
                fecha: new Date().toISOString(),
              },
            ]);
          }
          setEscribiendo(false);
        },
      });
    },
    [input, escribiendo, limiteAlcanzado, enviarMutation, onMensajeEnviado],
  );

  const manejarTecla = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        enviar();
      }
    },
    [enviar],
  );

  // ── Estado vacio (sin conversacion seleccionada) ──
  if (!tieneConversacion) {
    return (
      <div key="empty" className="flex-1 flex flex-col items-center justify-center px-6 animate-[fadeIn_300ms_ease-out]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "linear-gradient(135deg, #7C4DFF20, #4A2D8C20)",
            border: "1px solid var(--shell-borde)",
          }}
        >
          <Icono
            nombre="destello"
            tamaño={28}
            peso="fill"
            className="text-[#7C4DFF]"
          />
        </div>
        <h2
          className="text-[20px] font-semibold mb-2 tracking-tight"
          style={{ color: "var(--shell-texto)" }}
        >
          Tu oraculo personal
        </h2>
        <p
          className="text-[13.5px] text-center max-w-sm mb-8 leading-relaxed"
          style={{ color: "var(--shell-texto-secundario)" }}
        >
          Conozco tu carta natal, tu diseno humano y tu numerologia.
          Preguntame lo que necesites saber.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {SUGERENCIAS.map((s, i) => (
            <button
              key={s.etiqueta}
              onClick={() => enviar(s.mensaje)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95 animate-[fadeIn_250ms_ease-out_both]"
              style={{
                background: "var(--shell-superficie)",
                border: "1px solid var(--shell-borde)",
                color: "var(--shell-texto)",
                animationDelay: `${i * 80}ms`,
              }}
            >
              <Icono nombre={s.icono} tamaño={14} className="text-[#7C4DFF]" />
              {s.etiqueta}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Conversacion activa ──
  return (
    <div key={conversacionId} className="flex-1 flex flex-col h-full min-w-0 animate-[fadeIn_200ms_ease-out]">
      {/* Header conversacion */}
      {tituloConversacion && (
        <div
          className="shrink-0 px-5 py-3 border-b flex items-center gap-2"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <Icono
            nombre="chat"
            tamaño={16}
            className="text-[#7C4DFF] shrink-0"
          />
          <h3
            className="text-[14px] font-medium truncate"
            style={{ color: "var(--shell-texto)" }}
          >
            {tituloConversacion}
          </h3>
        </div>
      )}

      {/* Mensajes */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-sutil px-5 py-5 flex flex-col gap-3"
      >
        {cargandoHistorial ? (
          <EsqueletoCargando />
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p
              className="text-[15px] text-center"
              style={{ color: "var(--shell-texto-secundario)" }}
            >
              Hola 👋 {usuario?.nombre?.split(" ")[0] ?? ""}
              <br />
              ¿Qué asunto querés revisar?
            </p>
          </div>
        ) : (
          mensajes.map((msg, i) => (
            <BurbujaMensaje key={`${conversacionId}-${i}`} msg={msg} indice={i} />
          ))
        )}

        {escribiendo && <IndicadorEscribiendo />}
      </div>

      {/* Estado del plan */}
      {restantes !== null && !esPremium && (
        <div className="px-5 pb-1 shrink-0">
          {restantes <= 0 ? (
            <p className="text-[11px] text-center text-red-400">
              Sin mensajes restantes hoy.{" "}
              <a
                href="/suscripcion"
                className="text-[#7C4DFF] font-medium hover:underline"
              >
                Pasate a Premium
              </a>
            </p>
          ) : (
            <p
              className="text-[11px] text-center"
              style={{ color: "var(--shell-texto-terciario)" }}
            >
              {restantes} consulta{restantes !== 1 ? "s" : ""} restante
              {restantes !== 1 ? "s" : ""} hoy
            </p>
          )}
        </div>
      )}
      {esPremium && restantes !== null && (
        <div className="px-5 pb-1 shrink-0">
          <p
            className="text-[11px] text-center"
            style={{ color: "var(--shell-texto-terciario)" }}
          >
            Sin limite de consultas
          </p>
        </div>
      )}

      {/* Input */}
      <div
        className="shrink-0 px-4 py-3 border-t"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-4 py-2 transition-colors duration-200"
          style={{
            background: "var(--shell-superficie)",
            border: "1px solid var(--shell-borde)",
            outline: "none",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={manejarTecla}
            placeholder={
              limiteAlcanzado
                ? "Limite alcanzado — actualiza a Premium"
                : "¿Qué asunto querés revisar?"
            }
            disabled={limiteAlcanzado}
            rows={1}
            className="flex-1 bg-transparent text-[13.5px] leading-relaxed resize-none disabled:opacity-40 py-1"
            style={{
              color: "var(--shell-texto)",
              maxHeight: 120,
              border: "none",
              boxShadow: "none",
              outline: "none",
            }}
          />
          <button
            onClick={() => enviar()}
            disabled={!input.trim() || escribiendo || limiteAlcanzado}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-30 active:scale-90"
            style={{
              background: input.trim()
                ? "linear-gradient(135deg, #7C4DFF, #4A2D8C)"
                : "var(--shell-superficie)",
              color: input.trim() ? "white" : "var(--shell-texto-terciario)",
              cursor: input.trim() && !escribiendo ? "pointer" : "default",
            }}
          >
            <Icono nombre="flechaArriba" tamaño={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
