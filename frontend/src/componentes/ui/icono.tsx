import { type ComponentType } from "react";
import {
  Star,
  Sun,
  Moon,
  User,
  House,
  Planet,
  MagnifyingGlass,
  Bell,
  Gear,
  SignOut,
  GoogleLogo,
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  List,
  Heart,
  Brain,
  Hash,
  Calendar,
  Clock,
  MapPin,
  ChartLine,
  ChatCircle,
  Info,
  Lightning,
  Crown,
  Rocket,
  Download,
  Sparkle,
  Hexagon,
  PaperPlaneTilt,
  CaretRight,
  CaretLeft,
  CaretDown,
  CaretUp,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerSlash,
  Queue,
  Repeat,
  Shuffle,
  CornersOut,
  Compass,
  PencilSimple,
  ShootingStar,
  SunHorizon,
  Microphone,
  Heartbeat,
  CurrencyDollar,
  FlowerLotus,
  WifiHigh,
  type IconProps as PhosphorIconProps,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utilidades/cn";

const mapaIconos: Record<string, ComponentType<PhosphorIconProps>> = {
  estrella: Star,
  sol: Sun,
  luna: Moon,
  usuario: User,
  casa: House,
  planeta: Planet,
  buscar: MagnifyingGlass,
  campana: Bell,
  configuracion: Gear,
  salir: SignOut,
  google: GoogleLogo,
  email: Envelope,
  candado: Lock,
  ojo: Eye,
  ojoOculto: EyeSlash,
  flecha: ArrowRight,
  flechaIzquierda: ArrowLeft,
  check: Check,
  x: X,
  menu: List,
  corazon: Heart,
  latido: Heartbeat,
  cerebro: Brain,
  moneda: CurrencyDollar,
  loto: FlowerLotus,
  wifi: WifiHigh,
  numeral: Hash,
  calendario: Calendar,
  reloj: Clock,
  ubicacion: MapPin,
  grafico: ChartLine,
  chat: ChatCircle,
  info: Info,
  rayo: Lightning,
  corona: Crown,
  cohete: Rocket,
  descarga: Download,
  destello: Sparkle,
  hexagono: Hexagon,
  enviarMensaje: PaperPlaneTilt,
  caretDerecha: CaretRight,
  caretIzquierda: CaretLeft,
  caretAbajo: CaretDown,
  caretArriba: CaretUp,
  avion: PaperPlaneTilt,
  reproducir: Play,
  pausar: Pause,
  retroceder: SkipBack,
  avanzar: SkipForward,
  volumenAlto: SpeakerHigh,
  volumenMudo: SpeakerSlash,
  cola: Queue,
  repetir: Repeat,
  aleatorio: Shuffle,
  expandir: CornersOut,
  brujula: Compass,
  lapiz: PencilSimple,
  estrellaFugaz: ShootingStar,
  retornoSolar: SunHorizon,
  microfono: Microphone,
};

export type NombreIcono = keyof typeof mapaIconos;

interface IconoProps {
  nombre: NombreIcono;
  tamaño?: number;
  peso?: "regular" | "bold" | "fill";
  className?: string;
}

export function Icono({
  nombre,
  tamaño = 20,
  peso = "regular",
  className,
}: IconoProps) {
  const Componente = mapaIconos[nombre];

  if (!Componente) {
    return null;
  }

  return (
    <Componente
      size={tamaño}
      weight={peso}
      className={cn("shrink-0", className)}
    />
  );
}

/** Lista de nombres disponibles (util para autocompletar) */
export const nombresIconos = Object.keys(mapaIconos) as NombreIcono[];
