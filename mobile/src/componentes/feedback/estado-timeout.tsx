import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { CloudSlash } from "phosphor-react-native";
import { Boton } from "@/componentes/ui/boton";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { usarTema } from "@/lib/hooks/usar-tema";

interface EstadoTimeoutProps {
  /** Si la data está cargando */
  cargando: boolean;
  /** Si hay error */
  error?: unknown;
  /** Función para reintentar */
  onReintentar: () => void;
  /** Timeout en ms antes de mostrar retry (default: 15000) */
  timeoutMs?: number;
  /** Contenido a mostrar mientras carga (skeleton) */
  esqueleto?: React.ReactNode;
  /** Contenido normal cuando hay data */
  children: React.ReactNode;
}

/**
 * Wrapper que muestra skeleton durante la carga,
 * y un estado de error/timeout con botón reintentar
 * si la carga falla o tarda más de `timeoutMs`.
 */
export function EstadoTimeout({
  cargando,
  error,
  onReintentar,
  timeoutMs = 15000,
  esqueleto,
  children,
}: EstadoTimeoutProps) {
  const { colores } = usarTema();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!cargando) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [cargando, timeoutMs]);

  // Error o timeout → mostrar retry
  if (error || timedOut) {
    return (
      <AnimacionEntrada duracion={300}>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 48,
            paddingHorizontal: 24,
          }}
        >
          <CloudSlash size={48} color={colores.textoMuted} weight="regular" />
          <Text
            style={{
              color: colores.primario,
              fontSize: 17,
              fontFamily: "Inter_600SemiBold",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {error ? "No se pudieron cargar los datos" : "La carga está tardando más de lo esperado"}
          </Text>
          <Text
            style={{
              color: colores.textoSecundario,
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Verificá tu conexión y probá de nuevo.
          </Text>
          <Boton
            onPress={() => {
              setTimedOut(false);
              onReintentar();
            }}
            style={{ marginTop: 20, minWidth: 160 }}
          >
            Reintentar
          </Boton>
        </View>
      </AnimacionEntrada>
    );
  }

  // Cargando → mostrar skeleton si hay, o nada
  if (cargando) {
    return <>{esqueleto ?? null}</>;
  }

  // Data lista → mostrar contenido
  return <>{children}</>;
}
