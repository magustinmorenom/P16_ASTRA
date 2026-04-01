"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import LayoutOnboarding from "@/componentes/layouts/layout-onboarding";
import { Icono } from "@/componentes/ui/icono";
import {
  usarCrearPerfil,
  usarCartaNatal,
  usarDisenoHumano,
  usarNumerologia,
  usarRetornoSolar,
} from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type { DatosNacimiento, DatosNumerologia } from "@/lib/tipos";
import { cn } from "@/lib/utilidades/cn";

/* ---------- Tipos locales ---------- */

interface DatosFormulario {
  nombre: string;
  fecha_nacimiento: string;
  hora_nacimiento: string;
  ciudad_nacimiento: string;
  pais_nacimiento: string;
  latitud?: number;
  longitud_geo?: number;
  zona_horaria?: string;
}

const TEXTOS_PANEL: Record<number, string> = {
  0: "Tu información de nacimiento es la clave para descifrar tu mapa estelar",
  1: "",
};

/* ---------- Barra de progreso (2 segmentos) ---------- */

function BarraProgreso({ paso }: { paso: number }) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-violet-500">
        Paso {paso + 1} de 2
      </p>
      <div className="flex gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-sm transition-colors duration-300",
              i <= paso ? "bg-violet-500" : "bg-gray-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Componente principal ---------- */

export default function PaginaOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { cargarUsuario } = useStoreAuth();
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<DatosFormulario>({
    nombre: "",
    fecha_nacimiento: "",
    hora_nacimiento: "",
    ciudad_nacimiento: "",
    pais_nacimiento: "",
  });

  // Paso 1 usa layout oscuro full-screen
  if (paso === 1) {
    return (
      <LayoutOnboarding modoOscuro>
        <BarraProgresoOscuro />
        <PasoCalculando
          datos={datos}
          onFinalizar={async () => {
            await cargarUsuario();
            await queryClient.invalidateQueries({ queryKey: ["calculos", "me"] });
            router.push("/dashboard");
          }}
        />
      </LayoutOnboarding>
    );
  }

  return (
    <LayoutOnboarding textoPanel={TEXTOS_PANEL[paso]}>
      <BarraProgreso paso={paso} />

      {paso === 0 && (
        <PasoDatosCompletos
          datos={datos}
          onChange={(parcial) => setDatos({ ...datos, ...parcial })}
          onSiguiente={() => setPaso(1)}
        />
      )}
    </LayoutOnboarding>
  );
}

/* ---------- Barra de progreso modo oscuro ---------- */

function BarraProgresoOscuro() {
  return (
    <div className="flex flex-col gap-2 mb-10">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-violet-300">
        Paso 2 de 2
      </p>
      <div className="flex gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-sm bg-violet-500" />
        ))}
      </div>
    </div>
  );
}

/* ========== Paso único: Datos Personales + Lugar ========== */

interface ResultadoGeo {
  nombre_mostrar: string;
  ciudad: string;
  estado: string;
  pais: string;
  latitud: number;
  longitud: number;
  zona_horaria: string;
}

function PasoDatosCompletos({
  datos,
  onChange,
  onSiguiente,
}: {
  datos: DatosFormulario;
  onChange: (parcial: Partial<DatosFormulario>) => void;
  onSiguiente: () => void;
}) {
  const [consulta, setConsulta] = useState(
    datos.ciudad_nacimiento
      ? `${datos.ciudad_nacimiento}, ${datos.pais_nacimiento}`
      : ""
  );
  const [resultados, setResultados] = useState<ResultadoGeo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [lugarSeleccionado, setLugarSeleccionado] = useState(!!datos.latitud);
  const [abierto, setAbierto] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const puedeAvanzar =
    datos.nombre.trim() !== "" &&
    datos.fecha_nacimiento !== "" &&
    datos.hora_nacimiento !== "" &&
    lugarSeleccionado &&
    datos.ciudad_nacimiento.trim() !== "";

  // Buscar ubicaciones con debounce
  const buscar = useCallback(async (texto: string) => {
    if (texto.length < 3) {
      setResultados([]);
      setAbierto(false);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(
        `/api/v1/geo/buscar?q=${encodeURIComponent(texto)}&limite=6`
      );
      if (res.ok) {
        const json = await res.json();
        const d = json.datos ?? json;
        setResultados(Array.isArray(d) ? d : []);
        setAbierto(true);
      }
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }, []);

  const handleLugarChange = (texto: string) => {
    setConsulta(texto);
    setLugarSeleccionado(false);
    onChange({
      ciudad_nacimiento: "",
      pais_nacimiento: "",
      latitud: undefined,
      longitud_geo: undefined,
      zona_horaria: undefined,
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(texto), 400);
  };

  const seleccionar = (resultado: ResultadoGeo) => {
    setConsulta(resultado.nombre_mostrar);
    setLugarSeleccionado(true);
    setAbierto(false);
    setResultados([]);
    onChange({
      ciudad_nacimiento: resultado.ciudad,
      pais_nacimiento: resultado.pais,
      latitud: resultado.latitud,
      longitud_geo: resultado.longitud,
      zona_horaria: resultado.zona_horaria,
    });
  };

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const inputClase = "h-12 w-full px-4 rounded-xl bg-violet-50 border border-gray-200 text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[26px] font-semibold text-gray-800 leading-tight">
          Datos de nacimiento
        </h2>
        <p className="mt-2 text-gray-500 text-sm">
          Necesitamos esta información para calcular tu mapa cósmico
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">Nombre completo</label>
          <input
            type="text"
            placeholder="Tu nombre"
            value={datos.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            className={inputClase}
          />
        </div>

        {/* Fecha y hora en fila */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Fecha de nacimiento</label>
            <input
              type="date"
              value={datos.fecha_nacimiento}
              onChange={(e) => onChange({ fecha_nacimiento: e.target.value })}
              className={inputClase}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">Hora de nacimiento</label>
            <input
              type="time"
              value={datos.hora_nacimiento}
              onChange={(e) => onChange({ hora_nacimiento: e.target.value })}
              className={inputClase}
            />
          </div>
        </div>

        {/* Lugar de nacimiento — autocomplete */}
        <div ref={dropdownRef} className="relative flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-600">Lugar de nacimiento</label>
          <div className="relative">
            <Icono
              nombre="ubicacion"
              tamaño={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Ej: Buenos Aires, Argentina"
              value={consulta}
              onChange={(e) => handleLugarChange(e.target.value)}
              onFocus={() => resultados.length > 0 && setAbierto(true)}
              className={cn(
                "h-12 w-full pl-11 pr-10 rounded-xl bg-violet-50 border text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors",
                lugarSeleccionado
                  ? "border-emerald-400 bg-emerald-50/50"
                  : "border-gray-200 focus:border-violet-400"
              )}
            />
            {buscando && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
              </div>
            )}
            {lugarSeleccionado && !buscando && (
              <Icono
                nombre="check"
                tamaño={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
              />
            )}
          </div>

          {/* Dropdown */}
          {abierto && resultados.length > 0 && (
            <div className="absolute top-[calc(100%+6px)] z-50 w-full rounded-xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
              {resultados.map((r, i) => (
                <button
                  key={`${r.latitud}-${r.longitud}-${i}`}
                  type="button"
                  onClick={() => seleccionar(r)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-violet-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <Icono nombre="ubicacion" tamaño={15} className="text-violet-400 shrink-0" />
                  <p className="text-sm text-gray-800 truncate">{r.nombre_mostrar}</p>
                </button>
              ))}
            </div>
          )}

          {abierto && resultados.length === 0 && !buscando && consulta.length >= 3 && (
            <div className="absolute top-[calc(100%+6px)] z-50 w-full rounded-xl border border-gray-200 bg-white shadow-lg px-4 py-3">
              <p className="text-sm text-gray-400 text-center">No se encontraron ubicaciones</p>
            </div>
          )}
        </div>
      </div>

      {/* Nota hora */}
      <div className="flex gap-3 bg-violet-50 rounded-xl p-3.5">
        <Icono nombre="info" tamaño={16} className="text-violet-500 mt-0.5 shrink-0" />
        <p className="text-xs text-violet-700 leading-relaxed">
          Si no conocés tu hora exacta, usá 12:00. Algunos cálculos pueden variar.
        </p>
      </div>

      <button
        type="button"
        onClick={onSiguiente}
        disabled={!puedeAvanzar}
        className="w-full h-12 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Icono nombre="destello" tamaño={18} />
        Calcular mi perfil
      </button>
    </div>
  );
}

/* ========== Paso 3: Calculando (modo oscuro full-screen) ========== */

type EstadoItem = "pendiente" | "en_curso" | "completado" | "error";

interface EstadoCalculo {
  perfil: EstadoItem;
  cartaNatal: EstadoItem;
  disenoHumano: EstadoItem;
  numerologia: EstadoItem;
  retornoSolar: EstadoItem;
}

function PasoCalculando({
  datos,
  onFinalizar,
}: {
  datos: DatosFormulario;
  onFinalizar: () => void | Promise<void>;
}) {
  const crearPerfil = usarCrearPerfil();
  const cartaNatal = usarCartaNatal();
  const disenoHumano = usarDisenoHumano();
  const numerologia = usarNumerologia();
  const retornoSolar = usarRetornoSolar();

  const [estado, setEstado] = useState<EstadoCalculo>({
    perfil: "pendiente",
    cartaNatal: "pendiente",
    disenoHumano: "pendiente",
    numerologia: "pendiente",
    retornoSolar: "pendiente",
  });
  const [todoListo, setTodoListo] = useState(false);
  const ejecutadoRef = useRef(false);

  const ejecutarCalculos = useCallback(async () => {
    const datosNacimiento: DatosNacimiento = {
      nombre: datos.nombre,
      fecha_nacimiento: datos.fecha_nacimiento,
      hora_nacimiento: datos.hora_nacimiento,
      ciudad_nacimiento: datos.ciudad_nacimiento,
      pais_nacimiento: datos.pais_nacimiento,
      ...(datos.latitud != null && { latitud: datos.latitud }),
      ...(datos.longitud_geo != null && { longitud: datos.longitud_geo }),
      ...(datos.zona_horaria && { zona_horaria: datos.zona_horaria }),
    };

    const datosNumerologia: DatosNumerologia = {
      nombre: datos.nombre,
      fecha_nacimiento: datos.fecha_nacimiento,
    };

    // 1. Primero crear perfil para obtener perfil_id
    setEstado((prev) => ({ ...prev, perfil: "en_curso" }));

    let perfilIdObtenido: string | null = null;

    try {
      const perfil = await crearPerfil.mutateAsync(datosNacimiento);
      perfilIdObtenido = perfil.id;
      setEstado((prev) => ({ ...prev, perfil: "completado" }));
    } catch {
      setEstado((prev) => ({ ...prev, perfil: "error" }));
    }

    // 2. En paralelo: carta natal, diseño humano, numerología, retorno solar (con perfil_id)
    setEstado((prev) => ({
      ...prev,
      cartaNatal: "en_curso",
      disenoHumano: "en_curso",
      numerologia: "en_curso",
      retornoSolar: "en_curso",
    }));

    const promesas = [
      cartaNatal
        .mutateAsync({ datos: datosNacimiento, perfilId: perfilIdObtenido ?? undefined })
        .then(() => setEstado((prev) => ({ ...prev, cartaNatal: "completado" })))
        .catch(() => setEstado((prev) => ({ ...prev, cartaNatal: "error" }))),

      disenoHumano
        .mutateAsync({ datos: datosNacimiento, perfilId: perfilIdObtenido ?? undefined })
        .then(() => setEstado((prev) => ({ ...prev, disenoHumano: "completado" })))
        .catch(() => setEstado((prev) => ({ ...prev, disenoHumano: "error" }))),

      numerologia
        .mutateAsync({ datos: datosNumerologia, perfilId: perfilIdObtenido ?? undefined })
        .then(() => setEstado((prev) => ({ ...prev, numerologia: "completado" })))
        .catch(() => setEstado((prev) => ({ ...prev, numerologia: "error" }))),

      retornoSolar
        .mutateAsync({
          datosNacimiento,
          anio: new Date().getFullYear(),
          perfilId: perfilIdObtenido ?? undefined,
        })
        .then(() => setEstado((prev) => ({ ...prev, retornoSolar: "completado" })))
        .catch(() => setEstado((prev) => ({ ...prev, retornoSolar: "error" }))),
    ];

    await Promise.allSettled(promesas);
    setTodoListo(true);
  }, [datos, crearPerfil, cartaNatal, disenoHumano, numerologia, retornoSolar]);

  useEffect(() => {
    if (!ejecutadoRef.current) {
      ejecutadoRef.current = true;
      ejecutarCalculos();
    }
  }, [ejecutarCalculos]);

  // Auto-redirect cuando todo está listo
  useEffect(() => {
    if (todoListo) {
      const timer = setTimeout(onFinalizar, 1500);
      return () => clearTimeout(timer);
    }
  }, [todoListo, onFinalizar]);

  const pasos = [
    { clave: "perfil" as const, textoEnCurso: "Creando tu perfil cósmico...", textoListo: "Perfil creado" },
    { clave: "cartaNatal" as const, textoEnCurso: "Calculando carta natal...", textoListo: "Carta natal lista" },
    { clave: "disenoHumano" as const, textoEnCurso: "Analizando diseño humano...", textoListo: "Diseño humano listo" },
    { clave: "numerologia" as const, textoEnCurso: "Procesando numerología...", textoListo: "Numerología lista" },
    { clave: "retornoSolar" as const, textoEnCurso: "Calculando revolución solar...", textoListo: "Revolución solar lista" },
  ];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Animación orbital */}
      <div className="relative w-28 h-28 my-4">
        {/* Anillo exterior */}
        <div className="absolute inset-0 rounded-full border border-violet-400/20 animate-[spin_12s_linear_infinite]">
          <div className="absolute -top-1 left-1/2 -ml-1 w-2 h-2 rounded-full bg-violet-400/40" />
        </div>
        {/* Anillo medio */}
        <div className="absolute inset-3 rounded-full border border-violet-400/30 animate-[spin_8s_linear_infinite_reverse]">
          <div className="absolute -top-1 left-1/2 -ml-1 w-2 h-2 rounded-full bg-violet-300/50" />
        </div>
        {/* Anillo interior */}
        <div className="absolute inset-6 rounded-full border border-violet-300/40 animate-[spin_5s_linear_infinite]">
          <div className="absolute -top-0.5 left-1/2 -ml-0.5 w-1.5 h-1.5 rounded-full bg-violet-200/60" />
        </div>
        {/* Core sparkle dorado */}
        <div className="absolute inset-9 rounded-full bg-gradient-to-br from-[#F0D68A] to-[#D4A234] flex items-center justify-center animate-pulse">
          <Icono nombre="destello" tamaño={20} className="text-white" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-[26px] font-semibold text-white leading-tight">
          {todoListo ? "¡Tu mapa cósmico está listo!" : "Calculando tu mapa cósmico"}
        </h2>
        <p className="mt-2 text-[#B388FF] text-sm">
          {todoListo
            ? "Redirigiendo al dashboard..."
            : "Estamos procesando tus datos con las efemérides astronómicas"}
        </p>
      </div>

      {/* Lista de progreso */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {pasos.map((item) => {
          const estadoActual = estado[item.clave];
          return (
            <div
              key={item.clave}
              className="flex items-center gap-3 px-4 py-3"
            >
              {/* Icono de estado */}
              {estadoActual === "completado" && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Icono nombre="check" tamaño={14} className="text-white" />
                </div>
              )}
              {estadoActual === "error" && (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <Icono nombre="x" tamaño={14} className="text-white" />
                </div>
              )}
              {estadoActual === "en_curso" && (
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                </div>
              )}
              {estadoActual === "pendiente" && (
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
              )}

              <span
                className={cn(
                  "text-sm transition-colors",
                  estadoActual === "completado" && "text-white font-medium",
                  estadoActual === "error" && "text-red-400",
                  estadoActual === "en_curso" && "text-[#B388FF]",
                  estadoActual === "pendiente" && "text-white/30",
                )}
              >
                {estadoActual === "completado"
                  ? item.textoListo
                  : item.textoEnCurso}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
