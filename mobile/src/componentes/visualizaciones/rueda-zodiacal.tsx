import { View } from "react-native";
import Svg, { Circle, Line, Text as SvgText, G } from "react-native-svg";
import type { Planeta, Casa, Aspecto } from "@/lib/tipos";
import { usarTema } from "@/lib/hooks/usar-tema";

const SIGNOS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

const SIMBOLOS = ["Ar", "Ta", "Ge", "Cn", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];

const COLORES_ELEMENTO: Record<string, string> = {
  Aries: "#ef4444", Tauro: "#22c55e", "Géminis": "#eab308", "Cáncer": "#3b82f6",
  Leo: "#ef4444", Virgo: "#22c55e", Libra: "#eab308", Escorpio: "#3b82f6",
  Sagitario: "#ef4444", Capricornio: "#22c55e", Acuario: "#eab308", Piscis: "#3b82f6",
};

const COLORES_ASPECTO: Record<string, string> = {
  conjunción: "#c084fc",
  trígono: "#34d399",
  sextil: "#60a5fa",
  cuadratura: "#f87171",
  oposición: "#ef4444",
};

const ABREV_PLANETAS: Record<string, string> = {
  Sol: "So", Luna: "Lu", Mercurio: "Me", Venus: "Ve", Marte: "Ma",
  Júpiter: "Ju", Saturno: "Sa", Urano: "Ur", Neptuno: "Ne", Plutón: "Pl",
  "Nodo Norte": "NN", "Nodo Sur": "NS",
};

const CX = 170;
const CY = 170;
const R_EXTERIOR = 160;
const R_SIGNOS = 140;
const R_CASAS = 115;
const R_PLANETAS = 90;

function polar(cx: number, cy: number, r: number, angulo: number) {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface Props {
  planetas?: Planeta[];
  casas?: Casa[];
  aspectos?: Aspecto[];
}

export function RuedaZodiacal({ planetas = [], casas = [], aspectos = [] }: Props) {
  const { colores } = usarTema();
  const ascGrado = casas.length > 0 ? casas[0].grado : 0;

  const convertir = (longitud: number) => ((ascGrado - longitud + 360) % 360);

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={340} height={340} viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
        {/* Círculos */}
        <Circle cx={CX} cy={CY} r={R_EXTERIOR} stroke={colores.svgStrokeSecundario} strokeWidth={1} fill="none" />
        <Circle cx={CX} cy={CY} r={R_SIGNOS} stroke={colores.svgStrokeSecundario} strokeWidth={0.5} fill="none" />
        <Circle cx={CX} cy={CY} r={R_CASAS} stroke={colores.svgStrokeSecundario} strokeWidth={0.5} fill="none" />
        <Circle cx={CX} cy={CY} r={R_PLANETAS - 20} stroke={colores.svgStrokeSecundario} strokeWidth={0.3} fill="none" />

        {/* Signos (12 segmentos de 30°) */}
        {SIGNOS.map((signo, i) => {
          const anguloInicio = convertir(i * 30);
          const anguloMedio = anguloInicio - 15;
          const p1 = polar(CX, CY, R_EXTERIOR, anguloInicio);
          const p2 = polar(CX, CY, R_SIGNOS, anguloInicio);
          const pTexto = polar(CX, CY, (R_EXTERIOR + R_SIGNOS) / 2, anguloMedio);

          return (
            <G key={signo}>
              <Line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={colores.svgStrokeSecundario} strokeWidth={0.5} />
              <SvgText
                x={pTexto.x}
                y={pTexto.y}
                fill={COLORES_ELEMENTO[signo] ?? colores.textoMuted}
                fontSize={9}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="central"
              >
                {SIMBOLOS[i]}
              </SvgText>
            </G>
          );
        })}

        {/* Líneas de casas */}
        {casas.map((casa) => {
          const angulo = convertir(casa.grado);
          const p1 = polar(CX, CY, R_SIGNOS, angulo);
          const p2 = polar(CX, CY, R_PLANETAS - 20, angulo);
          const esCardinal = [1, 4, 7, 10].includes(casa.numero);
          return (
            <Line
              key={casa.numero}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={esCardinal ? colores.svgStrokePrincipal : colores.svgStrokeSecundario}
              strokeWidth={esCardinal ? 1.5 : 0.5}
            />
          );
        })}

        {/* Aspectos */}
        {aspectos.slice(0, 20).map((asp, i) => {
          const p1Data = planetas.find((p) => p.nombre === asp.planeta1);
          const p2Data = planetas.find((p) => p.nombre === asp.planeta2);
          if (!p1Data || !p2Data) return null;
          const a1 = convertir(p1Data.longitud);
          const a2 = convertir(p2Data.longitud);
          const pt1 = polar(CX, CY, R_PLANETAS - 25, a1);
          const pt2 = polar(CX, CY, R_PLANETAS - 25, a2);
          return (
            <Line
              key={i}
              x1={pt1.x}
              y1={pt1.y}
              x2={pt2.x}
              y2={pt2.y}
              stroke={COLORES_ASPECTO[asp.tipo] ?? colores.textoMuted}
              strokeWidth={0.8}
              opacity={0.5}
            />
          );
        })}

        {/* Planetas */}
        {planetas.map((planeta) => {
          const angulo = convertir(planeta.longitud);
          const pos = polar(CX, CY, R_PLANETAS, angulo);
          const abrev = ABREV_PLANETAS[planeta.nombre] ?? planeta.nombre.slice(0, 2);
          return (
            <G key={planeta.nombre}>
              <Circle cx={pos.x} cy={pos.y} r={10} fill={colores.svgFondoCentro} stroke={colores.svgStrokePrincipal} strokeWidth={1} />
              <SvgText
                x={pos.x}
                y={pos.y}
                fill={colores.svgTexto}
                fontSize={8}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="central"
              >
                {abrev}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
