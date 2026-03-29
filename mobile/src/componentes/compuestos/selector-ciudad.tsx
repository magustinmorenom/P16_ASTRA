import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import { usarBuscarCiudad } from "@/lib/hooks/usar-geocodificacion";
import type { ResultadoGeo } from "@/lib/tipos";

interface SelectorCiudadProps {
  etiqueta?: string;
  placeholder?: string;
  valorInicial?: string;
  onSeleccionar: (resultado: ResultadoGeo) => void;
  error?: string;
}

export function SelectorCiudad({
  etiqueta = "Ciudad de nacimiento",
  placeholder = "Buscar ciudad...",
  valorInicial = "",
  onSeleccionar,
  error,
}: SelectorCiudadProps) {
  const { colores } = usarTema();
  const [texto, setTexto] = useState(valorInicial);
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: resultados, isFetching } = usarBuscarCiudad(consulta);

  // Debounce de 450ms
  const manejarCambio = useCallback((valor: string) => {
    setTexto(valor);
    setAbierto(true);

    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setConsulta(valor);
    }, 450);
  }, []);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const manejarSeleccion = useCallback(
    (item: ResultadoGeo) => {
      setTexto(item.nombre_mostrar);
      setConsulta("");
      setAbierto(false);
      Keyboard.dismiss();
      onSeleccionar(item);
    },
    [onSeleccionar]
  );

  const mostrarDropdown =
    abierto && consulta.trim().length >= 3 && (isFetching || (resultados && resultados.length > 0) || (resultados && resultados.length === 0));

  return (
    <View style={{ marginBottom: 16, zIndex: 10 }}>
      {etiqueta && (
        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 11,
            fontFamily: "Inter_500Medium",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {etiqueta}
        </Text>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colores.superficie,
          borderWidth: 1,
          borderColor: error ? colores.error : colores.borde,
          borderRadius: 12,
          paddingHorizontal: 16,
        }}
      >
        <TextInput
          value={texto}
          onChangeText={manejarCambio}
          placeholder={placeholder}
          placeholderTextColor={colores.textoMuted}
          onFocus={() => {
            if (consulta.trim().length >= 3) setAbierto(true);
          }}
          style={{
            flex: 1,
            color: colores.primario,
            fontSize: 16,
            fontFamily: "Inter_400Regular",
            paddingVertical: 12,
          }}
        />
        {isFetching && (
          <ActivityIndicator size="small" color={colores.acento} />
        )}
      </View>

      {mostrarDropdown && (
        <View
          style={{
            position: "absolute",
            top: etiqueta ? 70 : 50,
            left: 0,
            right: 0,
            backgroundColor: colores.superficie,
            borderWidth: 1,
            borderColor: colores.borde,
            borderRadius: 12,
            maxHeight: 240,
            overflow: "hidden",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            zIndex: 20,
          }}
        >
          {isFetching && (!resultados || resultados.length === 0) ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colores.acento} />
            </View>
          ) : resultados && resultados.length === 0 ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <Text
                style={{
                  color: colores.textoMuted,
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                }}
              >
                Sin resultados
              </Text>
            </View>
          ) : (
            <FlatList
              data={resultados}
              keyExtractor={(_, i) => String(i)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => manejarSeleccion(item)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colores.borde,
                  }}
                  activeOpacity={0.6}
                >
                  <Text
                    style={{
                      color: colores.primario,
                      fontSize: 15,
                      fontFamily: "Inter_500Medium",
                    }}
                    numberOfLines={1}
                  >
                    {item.ciudad || item.estado}
                  </Text>
                  <Text
                    style={{
                      color: colores.textoSecundario,
                      fontSize: 13,
                      fontFamily: "Inter_400Regular",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {[item.estado, item.pais].filter(Boolean).join(", ")}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {error && (
        <Text
          style={{
            color: colores.error,
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
