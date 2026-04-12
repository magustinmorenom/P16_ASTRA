"use client";

/**
 * Tooltip de respuesta para "Explicame mejor".
 *
 * Muestra:
 *  - Estado 'cargando': skeleton con 3 dots pulsantes
 *  - Estado 'listo': respuesta de Haiku + badge cache/cuota + CTA "Seguir en el chat"
 *  - Estado 'error': mensaje de error + botón reintentar
 *
 * Posicionamiento: anclado bajo (o arriba) la selección original. NO se reposiciona
 * cuando cambia de fase.
 */

import { useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Icono } from "@/componentes/ui/icono";
import { useStoreExplicar } from "@/lib/stores/store-explicar";
import { usarExplicar } from "@/lib/hooks/usar-explicar";
import { usarNuevaConversacion } from "@/lib/hooks/usar-chat";
import { AvatarAstraMini } from "./avatar-astra-mini";

const ANCHO_TOOLTIP = 340;
const MARGEN_VIEWPORT = 12;
const ESPACIO_SELECCION = 14;
const ALTO_ESTIMADO = 260;
const MAX_ALTO_CUERPO = 150;

export function TooltipExplicacionAstra() {
  const seleccion = useStoreExplicar((s) => s.seleccion);
  const fase = useStoreExplicar((s) => s.fase);
  const respuesta = useStoreExplicar((s) => s.respuesta);
  const desdeCache = useStoreExplicar((s) => s.desdeCache);
  const mensajesRestantes = useStoreExplicar((s) => s.mensajesRestantes);
  const cerrar = useStoreExplicar((s) => s.cerrar);
  const explicarMutation = usarExplicar();
  const nuevaConversacionMutation = usarNuevaConversacion();
  const router = useRouter();

  const visible = fase === "cargando" || fase === "listo" || fase === "error";

  // Nota: el tooltip queda abierto hasta que el usuario lo cierre manualmente
  // con la X. No se cierra por click fuera ni por ESC.

  // Posición del tooltip a partir del rect de la selección original
  const posicion = useMemo(() => {
    if (!seleccion) return null;
    const { rect } = seleccion;

    // Por defecto: abajo de la selección
    let top = rect.bottom + ESPACIO_SELECCION;
    let left = rect.left + rect.width / 2 - ANCHO_TOOLTIP / 2;

    // Si no hay espacio abajo, ponerlo arriba
    if (top + ALTO_ESTIMADO > window.innerHeight - MARGEN_VIEWPORT) {
      top = rect.top - ALTO_ESTIMADO - ESPACIO_SELECCION;
      if (top < MARGEN_VIEWPORT) top = MARGEN_VIEWPORT;
    }

    // Clamp horizontal
    const maxLeft = window.innerWidth - ANCHO_TOOLTIP - MARGEN_VIEWPORT;
    if (left < MARGEN_VIEWPORT) left = MARGEN_VIEWPORT;
    if (left > maxLeft) left = maxLeft;

    return { top, left };
  }, [seleccion]);

  if (!visible || !seleccion || !posicion) return null;
  if (typeof document === "undefined") return null;

  const onSeguirEnChat = async () => {
    if (nuevaConversacionMutation.isPending) return;

    // Sembramos una conversación nueva con el intercambio del tooltip:
    // mensaje del usuario (texto seleccionado) + respuesta de Astra.
    // Si por algún motivo todavía no hay respuesta, abrimos el chat vacío.
    const seedTexto = seleccion.texto;
    const seedRespuesta = respuesta;
    const tituloSemilla = seedTexto.length > 60
      ? `${seedTexto.slice(0, 60)}…`
      : seedTexto;

    try {
      const data = seedRespuesta
        ? await nuevaConversacionMutation.mutateAsync({
            mensajes_iniciales: [
              {
                rol: "user",
                contenido: `Explicame mejor: "${seedTexto}"`,
              },
              { rol: "assistant", contenido: seedRespuesta },
            ],
            titulo: tituloSemilla,
          })
        : await nuevaConversacionMutation.mutateAsync(undefined);

      cerrar();
      window.getSelection()?.removeAllRanges();
      router.push(`/chat?conv=${data.conversacion_id}`);
    } catch {
      // Si falla la creación, abrimos el chat sin seed para no bloquear al usuario.
      cerrar();
      window.getSelection()?.removeAllRanges();
      router.push("/chat");
    }
  };

  const onReintentar = () => {
    explicarMutation.mutate({
      texto: seleccion.texto,
      contextoSeccion: seleccion.contextoSeccion,
      contextoExtendido: seleccion.contextoExtendido,
    });
  };

  return createPortal(
    <motion.div
      data-no-explicable="true"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed flex flex-col overflow-hidden rounded-2xl border"
      style={{
        top: posicion.top,
        left: posicion.left,
        width: ANCHO_TOOLTIP,
        zIndex: 9998,
        background: "var(--shell-panel)",
        borderColor: "var(--shell-borde)",
        boxShadow: "var(--shell-sombra-fuerte)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--shell-borde)" }}
      >
        <div className="flex items-center gap-2.5">
          <AvatarAstraMini tamaño={26} />
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--color-acento)" }}
            >
              Astra te explica
            </p>
            <p
              className="truncate text-[12px]"
              style={{ color: "var(--shell-texto-secundario)" }}
              title={seleccion.texto}
            >
              {seleccion.texto.length > 42
                ? `${seleccion.texto.slice(0, 42)}…`
                : seleccion.texto}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            cerrar();
            window.getSelection()?.removeAllRanges();
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--shell-superficie-suave)]"
          style={{ color: "var(--shell-texto-tenue)" }}
          aria-label="Cerrar explicación"
        >
          <Icono nombre="x" tamaño={16} />
        </button>
      </div>

      {/* Cuerpo (scrolleable si supera 150px) */}
      <div
        className="scroll-sutil overflow-y-auto px-4 py-4"
        style={{ maxHeight: MAX_ALTO_CUERPO }}
      >
        {fase === "cargando" && (
          <div className="flex items-center gap-1.5 py-3">
            {[0, 200, 400].map((delay) => (
              <span
                key={delay}
                className="block h-2 w-2 rounded-full animate-chat-soft-pulse"
                style={{
                  background: "var(--color-acento)",
                  animationDelay: `${delay}ms`,
                }}
              />
            ))}
            <span
              className="ml-2 text-[12px]"
              style={{ color: "var(--shell-texto-secundario)" }}
            >
              Astra está pensando…
            </span>
          </div>
        )}

        {fase === "listo" && respuesta && (
          <p
            className="text-[13px] leading-[1.6]"
            style={{ color: "var(--shell-texto)" }}
          >
            {respuesta}
          </p>
        )}

        {fase === "error" && (
          <div className="space-y-3">
            <p
              className="text-[13px] leading-[1.5]"
              style={{ color: "var(--shell-texto-secundario)" }}
            >
              Hubo un error al generar la explicación. Probá de nuevo en unos
              segundos.
            </p>
            <button
              type="button"
              onClick={onReintentar}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                borderColor: "var(--shell-borde)",
                background: "var(--shell-superficie)",
                color: "var(--color-acento)",
              }}
            >
              <Icono nombre="destello" tamaño={12} peso="fill" />
              Reintentar
            </button>
          </div>
        )}
      </div>

      {/* Footer (solo en estado listo) */}
      {fase === "listo" && respuesta && (
        <div
          className="flex items-center justify-between gap-2 border-t px-4 py-3"
          style={{ borderColor: "var(--shell-borde)" }}
        >
          <button
            type="button"
            onClick={onSeguirEnChat}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all hover:-translate-y-[1px]"
            style={{
              color: "#fff",
              background:
                "linear-gradient(135deg, var(--color-violet-500), var(--color-violet-700))",
              boxShadow: "0 4px 12px var(--shell-glow-1)",
            }}
          >
            <Icono nombre="chat" tamaño={12} peso="fill" />
            Seguir en el chat
          </button>

          <BadgeCuota
            desdeCache={desdeCache}
            mensajesRestantes={mensajesRestantes}
          />
        </div>
      )}
    </motion.div>,
    document.body,
  );
}

function BadgeCuota({
  desdeCache,
  mensajesRestantes,
}: {
  desdeCache: boolean;
  mensajesRestantes: number | null;
}) {
  if (desdeCache) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
        style={{
          borderColor: "var(--shell-borde)",
          color: "var(--color-favorable, var(--shell-texto-tenue))",
          background: "var(--shell-superficie-suave)",
        }}
        title="Esta respuesta ya estaba cacheada — no consumió tu cuota"
      >
        <Icono nombre="rayo" tamaño={10} peso="fill" />
        Desde caché
      </span>
    );
  }

  if (mensajesRestantes === null) {
    // Premium ilimitado: no mostrar nada para no saturar
    return null;
  }

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: "var(--shell-borde)",
        color: "var(--shell-texto-secundario)",
        background: "var(--shell-superficie-suave)",
      }}
      title="Mensajes que te quedan hoy"
    >
      {mensajesRestantes} {mensajesRestantes === 1 ? "mensaje" : "mensajes"}
    </span>
  );
}
