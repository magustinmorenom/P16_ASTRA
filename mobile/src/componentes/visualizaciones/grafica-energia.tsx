import { useEffect, useMemo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Svg, {
  Path,
  Circle as SvgCircle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { DiaSemanalDTO } from "@/lib/tipos";

const ALTO_SVG = 200;
const PAD_IZQ = 30;
const PAD_DER = 8;
const PAD_TOP = 16;
const PAD_BOT = 44;
const Y_MIN = 1;
const Y_MAX = 10;
const LINE_COLOR = "#7C4DFF";

const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

function mapX(i: number, total: number, anchoSvg: number): number {
  const ancho = anchoSvg - PAD_IZQ - PAD_DER;
  if (total <= 1) return PAD_IZQ + ancho / 2;
  return PAD_IZQ + (i / (total - 1)) * ancho;
}

function mapY(val: number): number {
  const alto = ALTO_SVG - PAD_TOP - PAD_BOT;
  return PAD_TOP + ((Y_MAX - val) / (Y_MAX - Y_MIN)) * alto;
}

/** Interpolación monotónica (sin overshoot) — idéntica a la versión web */
function generarPathSuave(puntos: [number, number][]): string {
  if (puntos.length === 0) return "";
  if (puntos.length === 1) return `M ${puntos[0][0]},${puntos[0][1]}`;
  if (puntos.length === 2) {
    return `M ${puntos[0][0]},${puntos[0][1]} L ${puntos[1][0]},${puntos[1][1]}`;
  }

  const n = puntos.length;
  const m: number[] = new Array(n - 1);
  const dx: number[] = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    dx[i] = puntos[i + 1][0] - puntos[i][0];
    const dy = puntos[i + 1][1] - puntos[i][1];
    m[i] = dx[i] === 0 ? 0 : dy / dx[i];
  }

  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0;
    } else {
      t[i] = 2 / (1 / m[i - 1] + 1 / m[i]);
    }
  }

  let d = `M ${puntos[0][0]},${puntos[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = puntos[i];
    const p1 = puntos[i + 1];
    const cp1x = p0[0] + dx[i] / 3;
    const cp1y = p0[1] + (t[i] * dx[i]) / 3;
    const cp2x = p1[0] - dx[i] / 3;
    const cp2y = p1[1] - (t[i + 1] * dx[i]) / 3;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1[0]},${p1[1]}`;
  }
  return d;
}

function obtenerDiaSemana(fechaStr: string): string {
  const f = new Date(fechaStr + "T12:00:00");
  return DIAS_SEMANA[f.getDay()];
}

function obtenerDiaMes(fechaStr: string): number {
  return new Date(fechaStr + "T12:00:00").getDate();
}

const COLOR_ALTO = "#34d399"; // verde esmeralda
const COLOR_BAJO = "#f59e0b"; // naranja/amber

/** Punto que emite pulsos animados */
function PuntoPulso({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const radio = useSharedValue(4);
  const opacidad = useSharedValue(0.4);

  useEffect(() => {
    radio.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 1200, easing: Easing.out(Easing.quad) }),
        withTiming(4, { duration: 0 }),
      ),
      -1,
    );
    opacidad.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.quad) }),
        withTiming(0.4, { duration: 0 }),
      ),
      -1,
    );
  }, []);

  const pulsoProps = useAnimatedProps(() => ({
    r: radio.value,
    opacity: opacidad.value,
  }));

  return (
    <G>
      <AnimatedCircle
        cx={cx}
        cy={cy}
        fill={color}
        animatedProps={pulsoProps}
      />
      <SvgCircle cx={cx} cy={cy} r={4} fill={color} />
    </G>
  );
}

interface GraficaEnergiaProps {
  datos: DiaSemanalDTO[];
  datosSiguiente?: DiaSemanalDTO[];
  fechaHoy: string;
}

export function GraficaEnergia({ datos, datosSiguiente, fechaHoy }: GraficaEnergiaProps) {
  const { colores } = usarTema();
  const { width: anchoPantalla } = useWindowDimensions();
  const ANCHO_SVG = anchoPantalla - 64;
  const CHART_H = ALTO_SVG - PAD_TOP - PAD_BOT;

  // Combinar datos desde HOY + 9 días siguientes = 10 días total
  const diasCombinados = useMemo(() => {
    const todos: DiaSemanalDTO[] = [];
    const fechasVistas = new Set<string>();

    for (const d of datos) {
      if (!fechasVistas.has(d.fecha)) {
        fechasVistas.add(d.fecha);
        todos.push(d);
      }
    }
    if (datosSiguiente) {
      for (const d of datosSiguiente) {
        if (!fechasVistas.has(d.fecha)) {
          fechasVistas.add(d.fecha);
          todos.push(d);
        }
      }
    }

    // Filtrar: solo desde hoy en adelante
    const desdeHoy = todos.filter((d) => d.fecha >= fechaHoy);
    return desdeHoy.slice(0, 10);
  }, [datos, datosSiguiente, fechaHoy]);

  const total = diasCombinados.length;
  if (total < 2) return null;

  const puntos: [number, number][] = diasCombinados.map((d, i) => [
    mapX(i, total, ANCHO_SVG),
    mapY(d.energia ?? 5),
  ]);

  const pathLinea = generarPathSuave(puntos);
  const bottomY = PAD_TOP + CHART_H;
  const pathArea = `${pathLinea} L ${puntos[total - 1][0]},${bottomY} L ${puntos[0][0]},${bottomY} Z`;

  const indiceHoy = diasCombinados.findIndex((d) => d.fecha === fechaHoy);
  const anchoCol = total > 1 ? (ANCHO_SVG - PAD_IZQ - PAD_DER) / (total - 1) : ANCHO_SVG;

  return (
    <Tarjeta style={{ marginBottom: 24 }}>
      <Text
        style={{
          color: colores.primario,
          fontSize: 15,
          fontFamily: "Inter_700Bold",
          marginBottom: 4,
        }}
      >
        Tendencia de energía
      </Text>
      <Text
        style={{
          color: colores.textoMuted,
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        Próximos {total} días
      </Text>

      <Svg
        width={ANCHO_SVG}
        height={ALTO_SVG}
        viewBox={`0 0 ${ANCHO_SVG} ${ALTO_SVG}`}
      >
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
          </SvgGradient>
          <SvgGradient id="hoyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0} />
            <Stop offset="50%" stopColor={LINE_COLOR} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
          </SvgGradient>
        </Defs>

        {/* Gridlines Y con labels */}
        {[2, 5, 8].map((v) => (
          <G key={v}>
            <Line
              x1={PAD_IZQ}
              y1={mapY(v)}
              x2={ANCHO_SVG - PAD_DER}
              y2={mapY(v)}
              stroke={colores.borde}
              strokeWidth={0.5}
              strokeDasharray="4,4"
              opacity={0.5}
            />
            <SvgText
              x={PAD_IZQ - 8}
              y={mapY(v) + 3}
              textAnchor="end"
              fill={colores.textoMuted}
              fontSize={9}
              fontWeight="500"
              opacity={0.6}
            >
              {v}
            </SvgText>
          </G>
        ))}

        {/* Columna highlight HOY */}
        {indiceHoy >= 0 && (
          <G>
            <Rect
              x={puntos[indiceHoy][0] - anchoCol / 2 + 2}
              y={PAD_TOP}
              width={anchoCol - 4}
              height={CHART_H}
              rx={8}
              fill="url(#hoyGrad)"
            />
            <Line
              x1={puntos[indiceHoy][0]}
              y1={PAD_TOP}
              x2={puntos[indiceHoy][0]}
              y2={bottomY}
              stroke={LINE_COLOR}
              strokeDasharray="2,4"
              strokeWidth={1.5}
              opacity={0.3}
            />
          </G>
        )}

        {/* Área bajo la curva */}
        <Path d={pathArea} fill="url(#areaGrad)" />

        {/* Curva principal */}
        <Path
          d={pathLinea}
          stroke={LINE_COLOR}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Puntos por día */}
        {puntos.map((p, i) => {
          const energia = diasCombinados[i]?.energia ?? 5;
          const esHoy = i === indiceHoy;
          const esAlto = energia >= 9;
          const esBajo = energia < 5;

          // Punto HOY con halo violeta
          if (esHoy) {
            return (
              <G key={`pt-${i}`}>
                <SvgCircle cx={p[0]} cy={p[1]} r={7} fill={LINE_COLOR} opacity={0.15} />
                <SvgCircle cx={p[0]} cy={p[1]} r={3.5} fill={LINE_COLOR} stroke={colores.fondo} strokeWidth={2} />
              </G>
            );
          }

          // Punto alto (>=9): verde con pulso
          if (esAlto) {
            return <PuntoPulso key={`pt-${i}`} cx={p[0]} cy={p[1]} color={COLOR_ALTO} />;
          }

          // Punto bajo (<5): naranja con pulso
          if (esBajo) {
            return <PuntoPulso key={`pt-${i}`} cx={p[0]} cy={p[1]} color={COLOR_BAJO} />;
          }

          // Punto normal
          return (
            <SvgCircle
              key={`pt-${i}`}
              cx={p[0]}
              cy={p[1]}
              r={2.5}
              fill={colores.fondo}
              stroke={LINE_COLOR}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Labels X: día semana + número */}
        {diasCombinados.map((d, i) => {
          const x = mapX(i, total, ANCHO_SVG);
          const esHoy = i === indiceHoy;
          return (
            <G key={d.fecha}>
              <SvgText
                x={x}
                y={ALTO_SVG - PAD_BOT + 18}
                textAnchor="middle"
                fill={esHoy ? LINE_COLOR : colores.textoMuted}
                fontSize={esHoy ? 10 : 9}
                fontWeight={esHoy ? "600" : "400"}
                opacity={esHoy ? 1 : 0.6}
              >
                {esHoy ? "HOY" : obtenerDiaSemana(d.fecha)}
              </SvgText>
              <SvgText
                x={x}
                y={ALTO_SVG - PAD_BOT + 32}
                textAnchor="middle"
                fill={esHoy ? colores.primario : colores.textoMuted}
                fontSize={10}
                fontWeight={esHoy ? "700" : "500"}
                opacity={esHoy ? 1 : 0.4}
              >
                {obtenerDiaMes(d.fecha)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </Tarjeta>
  );
}
