import { View } from "react-native";
import Svg, { Rect, Circle, Line, Text as SvgText, G, Polygon } from "react-native-svg";
import type { DisenoHumano, MapaCentros } from "@/lib/tipos";
import { usarTema } from "@/lib/hooks/usar-tema";

interface Centro {
  nombre: string;
  x: number;
  y: number;
  forma: "cuadrado" | "triangulo" | "diamante";
}

const CENTROS: Centro[] = [
  { nombre: "cabeza", x: 150, y: 30, forma: "triangulo" },
  { nombre: "ajna", x: 150, y: 85, forma: "triangulo" },
  { nombre: "garganta", x: 150, y: 145, forma: "cuadrado" },
  { nombre: "g", x: 150, y: 210, forma: "diamante" },
  { nombre: "corazon", x: 95, y: 210, forma: "triangulo" },
  { nombre: "plexo_solar", x: 205, y: 275, forma: "triangulo" },
  { nombre: "sacral", x: 150, y: 290, forma: "cuadrado" },
  { nombre: "bazo", x: 95, y: 290, forma: "triangulo" },
  { nombre: "raiz", x: 150, y: 360, forma: "cuadrado" },
];

const CONEXIONES: [string, string][] = [
  ["cabeza", "ajna"],
  ["ajna", "garganta"],
  ["garganta", "g"],
  ["garganta", "corazon"],
  ["garganta", "plexo_solar"],
  ["g", "sacral"],
  ["g", "corazon"],
  ["corazon", "sacral"],
  ["plexo_solar", "sacral"],
  ["sacral", "raiz"],
  ["bazo", "sacral"],
  ["bazo", "raiz"],
  ["bazo", "g"],
  ["bazo", "garganta"],
];

const TAM = 22;

function obtenerCentro(nombre: string) {
  return CENTROS.find((c) => c.nombre === nombre)!;
}

function estaDefinido(centros: MapaCentros, nombre: string): boolean {
  return centros[nombre] === "definido";
}

interface Props {
  datos?: DisenoHumano;
}

export function BodyGraph({ datos }: Props) {
  const { colores } = usarTema();
  const centros = datos?.centros ?? {};
  const canalesDefinidos = datos?.canales ?? [];

  const colorDefinido = colores.acento;
  const colorAbierto = colores.textoMuted;

  const canalConecta = (c1: string, c2: string) => {
    return canalesDefinidos.some(
      (canal) =>
        (canal.centros[0] === c1 && canal.centros[1] === c2) ||
        (canal.centros[0] === c2 && canal.centros[1] === c1)
    );
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={300} height={400} viewBox="0 0 300 400">
        {/* Conexiones */}
        {CONEXIONES.map(([c1, c2]) => {
          const p1 = obtenerCentro(c1);
          const p2 = obtenerCentro(c2);
          const definida = canalConecta(c1, c2);
          return (
            <Line
              key={`${c1}-${c2}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={definida ? colorDefinido : colorAbierto}
              strokeWidth={definida ? 3 : 1.5}
              opacity={definida ? 0.8 : 0.3}
            />
          );
        })}

        {/* Centros */}
        {CENTROS.map((centro) => {
          const definido = estaDefinido(centros, centro.nombre);
          const fill = definido ? colorDefinido : "transparent";
          const stroke = definido ? colorDefinido : colorAbierto;
          const labelColor = definido ? colores.fondoTarjeta : colorAbierto;

          if (centro.forma === "cuadrado") {
            return (
              <G key={centro.nombre}>
                <Rect
                  x={centro.x - TAM}
                  y={centro.y - TAM}
                  width={TAM * 2}
                  height={TAM * 2}
                  rx={4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2}
                  opacity={definido ? 0.9 : 0.4}
                />
                <SvgText
                  x={centro.x}
                  y={centro.y + 1}
                  fill={labelColor}
                  fontSize={8}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="central"
                >
                  {centro.nombre.toUpperCase().slice(0, 3)}
                </SvgText>
              </G>
            );
          }

          if (centro.forma === "diamante") {
            const pts = `${centro.x},${centro.y - TAM} ${centro.x + TAM},${centro.y} ${centro.x},${centro.y + TAM} ${centro.x - TAM},${centro.y}`;
            return (
              <G key={centro.nombre}>
                <Polygon
                  points={pts}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2}
                  opacity={definido ? 0.9 : 0.4}
                />
                <SvgText
                  x={centro.x}
                  y={centro.y + 1}
                  fill={labelColor}
                  fontSize={8}
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="central"
                >
                  G
                </SvgText>
              </G>
            );
          }

          // Triángulo
          const pts = `${centro.x},${centro.y - TAM} ${centro.x + TAM},${centro.y + TAM} ${centro.x - TAM},${centro.y + TAM}`;
          return (
            <G key={centro.nombre}>
              <Polygon
                points={pts}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                opacity={definido ? 0.9 : 0.4}
              />
              <SvgText
                x={centro.x}
                y={centro.y + 6}
                fill={labelColor}
                fontSize={7}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="central"
              >
                {centro.nombre.toUpperCase().slice(0, 3)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
