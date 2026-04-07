import { View, Text, Pressable } from "react-native";
import { Sun, Moon, Compass } from "phosphor-react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import { ROMANO, ELEMENTO_SIGNO } from "@/lib/utilidades/interpretaciones-natal";
import type { Planeta, PuntoSensible } from "@/lib/tipos";

interface SeccionTriadaProps {
  sol: Planeta;
  luna: Planeta;
  ascendente: PuntoSensible;
  onSeleccionar: (tipo: "sol" | "luna" | "ascendente") => void;
}

const CONFIG = [
  { key: "sol" as const, label: "Sol", sublabel: "Esencia", Icono: Sun },
  { key: "luna" as const, label: "Luna", sublabel: "Emociones", Icono: Moon },
  { key: "ascendente" as const, label: "Ascendente", sublabel: "Presencia", Icono: Compass },
];

export function SeccionTriada({ sol, luna, ascendente, onSeleccionar }: SeccionTriadaProps) {
  const { colores } = usarTema();

  const items = [
    { config: CONFIG[0], signo: sol.signo, grado: sol.grado_en_signo, casa: sol.casa },
    { config: CONFIG[1], signo: luna.signo, grado: luna.grado_en_signo, casa: luna.casa },
    { config: CONFIG[2], signo: ascendente.signo, grado: ascendente.grado_en_signo, casa: null as number | null },
  ];

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 10 }}>
        La Tríada Principal
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {items.map(({ config, signo, grado, casa }) => {
          const elemento = ELEMENTO_SIGNO[signo] || "";
          const { Icono } = config;
          return (
            <Pressable
              key={config.key}
              onPress={() => onSeleccionar(config.key)}
              accessibilityRole="button"
              accessibilityLabel={`${config.label} en ${signo}`}
              style={{
                flex: 1,
                backgroundColor: colores.fondoSecundario,
                borderRadius: 16,
                padding: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colores.vidrioBorde,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colores.acento + "18",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}
              >
                <Icono size={22} color={colores.acento} weight="fill" />
              </View>
              <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colores.acento, textTransform: "uppercase", letterSpacing: 1 }}>
                {config.label}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colores.primario, marginTop: 2 }}>
                {signo}
              </Text>
              <Text style={{ fontSize: 11, color: colores.textoSecundario, marginTop: 2 }}>
                {grado.toFixed(1)}°{casa ? ` · Casa ${ROMANO[casa]}` : ""}
              </Text>
              <Text style={{ fontSize: 10, color: colores.textoMuted, marginTop: 2 }}>
                {elemento} · {config.sublabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
