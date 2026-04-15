"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icono } from "@/componentes/ui/icono";
import PanelConversacionesWeb from "@/componentes/chat/panel-conversaciones-web";
import AreaChatWeb from "@/componentes/chat/area-chat-web";
import {
  usarConversaciones,
  usarCambiarConversacion,
  usarNuevaConversacion,
} from "@/lib/hooks/usar-chat";
import { usarEsMobile } from "@/lib/hooks/usar-es-mobile";
import HeaderMobile from "@/componentes/layouts/header-mobile";

export default function PaginaChat() {
  const esMobile = usarEsMobile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const convQuery = searchParams.get("conv");

  const [conversacionActiva, setConversacionActiva] = useState<string | null>(
    null,
  );
  const [tituloActiva, setTituloActiva] = useState<string | null>(null);
  const [panelMovilAbierto, setPanelMovilAbierto] = useState(false);
  const [inicializado, setInicializado] = useState(false);
  const convQueryProcesadaRef = useRef<string | null>(null);

  const { data: conversaciones = [], refetch: refetchConversaciones } =
    usarConversaciones();
  const cambiarMutation = usarCambiarConversacion();
  const nuevaMutation = usarNuevaConversacion();

  // Si llegamos con ?conv=<id> (por ejemplo desde el tooltip "Explicame mejor"),
  // priorizamos esa conversación: la activamos en backend, la seleccionamos en
  // el panel y limpiamos el query param para no re-disparar el efecto.
  // Usamos un ref para garantizar que cada convQuery se procese una sola vez —
  // de lo contrario, como `cambiarMutation` cambia de referencia en cada render,
  // el efecto entraría en bucle infinito mientras `router.replace` aún no se aplicó.
  useEffect(() => {
    if (!convQuery || conversaciones.length === 0) return;
    if (convQueryProcesadaRef.current === convQuery) return;
    const objetivo = conversaciones.find((c) => c.id === convQuery);
    if (!objetivo) return;

    convQueryProcesadaRef.current = convQuery;
    setConversacionActiva(objetivo.id);
    setTituloActiva(objetivo.titulo || objetivo.preview || null);
    setPanelMovilAbierto(false);
    setInicializado(true);
    cambiarMutation.mutate(objetivo.id);
    router.replace("/chat");
  }, [convQuery, conversaciones, cambiarMutation, router]);

  // Auto-seleccionar la conversacion activa al cargar.
  // Si la conversacion activa es de un dia anterior, crear una nueva automáticamente.
  useEffect(() => {
    if (inicializado || conversaciones.length === 0) return;
    if (convQuery) return; // dejamos que el efecto de arriba maneje el deep-link

    const activa = conversaciones.find((c) => c.activa && !c.archivada);
    if (activa) {
      const esDeHoy = (() => {
        if (!activa.ultimo_mensaje_en) return true; // conv nueva sin mensajes
        const ultimo = new Date(activa.ultimo_mensaje_en);
        const hoy = new Date();
        return (
          ultimo.getFullYear() === hoy.getFullYear() &&
          ultimo.getMonth() === hoy.getMonth() &&
          ultimo.getDate() === hoy.getDate()
        );
      })();

      if (esDeHoy) {
        setConversacionActiva(activa.id);
        setTituloActiva(activa.titulo || activa.preview || null);
        setInicializado(true);
        return;
      }
    }

    // No hay conversación de hoy — crear una nueva automáticamente
    nuevaMutation.mutate(undefined, {
      onSuccess: (data) => {
        setConversacionActiva(data.conversacion_id);
        setTituloActiva(null);
        refetchConversaciones();
      },
    });
    setInicializado(true);
  }, [conversaciones, inicializado]);

  const seleccionarConversacion = useCallback(
    (id: string) => {
      const conv = conversaciones.find((c) => c.id === id);
      setConversacionActiva(id);
      setTituloActiva(conv?.titulo || conv?.preview || null);
      setPanelMovilAbierto(false);

      cambiarMutation.mutate(id);
    },
    [conversaciones, cambiarMutation],
  );

  const crearNuevaConversacion = useCallback(() => {
    nuevaMutation.mutate(undefined, {
      onSuccess: (data) => {
        setConversacionActiva(data.conversacion_id);
        setTituloActiva(null);
        setPanelMovilAbierto(false);
        refetchConversaciones();
      },
    });
  }, [nuevaMutation, refetchConversaciones]);

  const alEnviarMensaje = useCallback(() => {
    refetchConversaciones();
  }, [refetchConversaciones]);

  return (
    <div className="flex flex-col h-full">
      {/* Mobile header */}
      {esMobile && (
        <HeaderMobile titulo="Chat">
          <button
            onClick={() => setPanelMovilAbierto(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              color: "var(--shell-texto-secundario)",
              background: "var(--shell-superficie)",
              border: "1px solid var(--shell-borde)",
            }}
          >
            <Icono nombre="menu" tamaño={18} />
          </button>
        </HeaderMobile>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Panel de conversaciones */}
        {(esMobile ? panelMovilAbierto : true) && (
          <PanelConversacionesWeb
            conversaciones={conversaciones}
            conversacionActiva={conversacionActiva}
            onSeleccionar={seleccionarConversacion}
            onNueva={crearNuevaConversacion}
            colapsado={esMobile ? !panelMovilAbierto : false}
            onCerrar={esMobile ? () => setPanelMovilAbierto(false) : undefined}
          />
        )}

        {/* Area de chat */}
        <AreaChatWeb
          conversacionId={conversacionActiva}
          tituloConversacion={tituloActiva}
          onMensajeEnviado={alEnviarMensaje}
        />
      </div>
    </div>
  );
}
