import { Image, type ImageStyle } from "react-native";
import { usarTema } from "@/lib/hooks/usar-tema";

// Mapa de iconos temáticos
const ICONOS_TEMATICOS: Record<string, ReturnType<typeof require>> = {
  astrologia: require("../../../assets/icons/020-astrology.svg"),
  numerologia: require("../../../assets/icons/021-numerology.svg"),
  horoscopo: require("../../../assets/icons/016-horoscope.svg"),
  personal: require("../../../assets/icons/014-personal.svg"),
  compatibilidad: require("../../../assets/icons/012-compatibility.svg"),
  tarot: require("../../../assets/icons/013-tarot.svg"),
  suerte: require("../../../assets/icons/018-luck.svg"),
  salud: require("../../../assets/icons/019-healthy.svg"),
  emocion: require("../../../assets/icons/022-emotion.svg"),
  libro: require("../../../assets/icons/023-book.svg"),
  carrera: require("../../../assets/icons/024-career.svg"),
  "bola-cristal": require("../../../assets/icons/028-crystal ball.svg"),
};

// Mapa de signos zodiacales
const ICONOS_SIGNOS: Record<string, ReturnType<typeof require>> = {
  Aries: require("../../../assets/icons/004-aries.svg"),
  Tauro: require("../../../assets/icons/005-taurus.svg"),
  "Géminis": require("../../../assets/icons/006-gemini.svg"),
  Geminis: require("../../../assets/icons/006-gemini.svg"),
  "Cáncer": require("../../../assets/icons/007-cancer.svg"),
  Cancer: require("../../../assets/icons/007-cancer.svg"),
  Leo: require("../../../assets/icons/008-leo.svg"),
  Virgo: require("../../../assets/icons/009-virgo.svg"),
  Libra: require("../../../assets/icons/010-libra.svg"),
  Escorpio: require("../../../assets/icons/011-scorpio.svg"),
  Sagitario: require("../../../assets/icons/017-sagittarius.svg"),
  Capricornio: require("../../../assets/icons/001-capricorn.svg"),
  Acuario: require("../../../assets/icons/002-aquarius.svg"),
  Piscis: require("../../../assets/icons/003-pisces.svg"),
};

interface IconoAstralProps {
  nombre: string;
  tamaño?: number;
  style?: ImageStyle;
}

export function IconoAstral({ nombre, tamaño = 24, style }: IconoAstralProps) {
  const { colores } = usarTema();
  const fuente = ICONOS_TEMATICOS[nombre];
  if (!fuente) return null;

  return (
    <Image
      source={fuente}
      style={[{ width: tamaño, height: tamaño, tintColor: colores.acento }, style]}
      resizeMode="contain"
    />
  );
}

interface IconoSignoProps {
  signo: string;
  tamaño?: number;
  style?: ImageStyle;
}

export function IconoSigno({ signo, tamaño = 24, style }: IconoSignoProps) {
  const { colores } = usarTema();
  const fuente = ICONOS_SIGNOS[signo];
  if (!fuente) return null;

  return (
    <Image
      source={fuente}
      style={[{ width: tamaño, height: tamaño, tintColor: colores.acento }, style]}
      resizeMode="contain"
    />
  );
}
