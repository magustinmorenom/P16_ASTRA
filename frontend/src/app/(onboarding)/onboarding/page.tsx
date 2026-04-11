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

/* ─── Tipos ─── */

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

interface ResultadoGeo {
  nombre_mostrar: string;
  ciudad: string;
  estado: string;
  pais: string;
  latitud: number;
  longitud: number;
  zona_horaria: string;
}

type EstadoItem = "pendiente" | "en_curso" | "completado" | "error";

interface EstadoCalculo {
  perfil: EstadoItem;
  cartaNatal: EstadoItem;
  disenoHumano: EstadoItem;
  numerologia: EstadoItem;
  retornoSolar: EstadoItem;
}

/* ─── Estilos compartidos ─── */

const CLASE_INPUT =
  "h-12 w-full rounded-[18px] border border-white/[0.10] bg-white/[0.08] px-4 text-sm text-white outline-none placeholder:text-white/35 transition-all duration-200 focus:border-white/25 focus:bg-white/[0.12] focus:ring-2 focus:ring-white/[0.06]";

/* ─── Página principal ─── */

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

  return (
    <LayoutOnboarding>
      {paso === 0 ? (
        <PasoFormulario
          datos={datos}
          onChange={(parcial) => setDatos({ ...datos, ...parcial })}
          onSiguiente={() => setPaso(1)}
        />
      ) : (
        <PasoCalculando
          datos={datos}
          onFinalizar={async () => {
            await cargarUsuario();
            await queryClient.invalidateQueries({ queryKey: ["calculos", "me"] });
            router.push("/dashboard");
          }}
        />
      )}
    </LayoutOnboarding>
  );
}

/* ─── Paso 1: Formulario ─── */

function PasoFormulario({
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
      : "",
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

  const buscar = useCallback(async (texto: string) => {
    if (texto.length < 3) {
      setResultados([]);
      setAbierto(false);
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(
        `/api/v1/geo/buscar?q=${encodeURIComponent(texto)}&limite=6`,
      );
      if (res.ok) {
        const json = await res.json();
        const datosRespuesta = json.datos ?? json;
        setResultados(Array.isArray(datosRespuesta) ? datosRespuesta : []);
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-start text-left">
        <PillPaso paso={1} />

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
          Cargá tu momento exacto de nacimiento
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Necesitamos fecha, hora y lugar para construir tu carta natal con precisión.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3">
        <div>
          <input
            type="text"
            placeholder="Nombre completo"
            value={datos.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            className={CLASE_INPUT}
          />
          <p className="mt-1.5 px-1 text-[11px] text-white/30">
            Tal como figura en tu cédula de identificación.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="date"
              value={datos.fecha_nacimiento}
              onChange={(e) => onChange({ fecha_nacimiento: e.target.value })}
              className={cn(CLASE_INPUT, "[color-scheme:dark]")}
            />
            <p className="mt-1.5 px-1 text-[11px] text-white/30">
              Día exacto de nacimiento.
            </p>
          </div>
          <div>
            <input
              type="time"
              value={datos.hora_nacimiento}
              onChange={(e) => onChange({ hora_nacimiento: e.target.value })}
              className={cn(CLASE_INPUT, "[color-scheme:dark]")}
            />
            <p className="mt-1.5 px-1 text-[11px] text-white/30">
              Si no la sabés, usá 12:00.
            </p>
          </div>
        </div>

        {/* Lugar con autocomplete */}
        <div ref={dropdownRef} className="relative">
          <Icono
            nombre="ubicacion"
            tamaño={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            type="text"
            placeholder="Lugar de nacimiento"
            value={consulta}
            onChange={(e) => handleLugarChange(e.target.value)}
            onFocus={() => resultados.length > 0 && setAbierto(true)}
            className={cn(CLASE_INPUT, "pl-10 pr-10")}
          />

          {buscando && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            </div>
          )}

          {lugarSeleccionado && !buscando && (
            <Icono
              nombre="check"
              tamaño={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400"
            />
          )}

          {abierto && resultados.length > 0 && (
            <div className="absolute top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-2xl border border-white/[0.10] bg-[#1a1128]/95 backdrop-blur-xl">
              {resultados.map((resultado, i) => (
                <button
                  key={`${resultado.latitud}-${resultado.longitud}-${i}`}
                  type="button"
                  onClick={() => seleccionar(resultado)}
                  className="flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/[0.06]"
                >
                  <Icono
                    nombre="ubicacion"
                    tamaño={14}
                    className="shrink-0 text-violet-300"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/90">
                      {resultado.nombre_mostrar}
                    </p>
                    <p className="text-xs text-white/40">
                      {resultado.estado ? `${resultado.estado}, ` : ""}
                      {resultado.pais}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {abierto && resultados.length === 0 && !buscando && consulta.length >= 3 && (
            <div className="absolute top-[calc(100%+6px)] z-50 w-full rounded-2xl border border-white/[0.10] bg-[#1a1128]/95 px-4 py-3 backdrop-blur-xl">
              <p className="text-sm text-white/40">Sin resultados para esa búsqueda.</p>
            </div>
          )}
          <p className="mt-1.5 px-1 text-[11px] text-white/30">
            Ciudad donde naciste — usamos la zona horaria histórica.
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onSiguiente}
        disabled={!puedeAvanzar}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-white/[0.10] bg-white/[0.10] text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-35"
      >
        Calcular mi perfil
        <Icono nombre="flecha-derecha" tamaño={16} />
      </button>
    </div>
  );
}

/* ─── Paso 2: Calculando ─── */

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

    // Crear perfil
    setEstado((prev) => ({ ...prev, perfil: "en_curso" }));
    let perfilIdObtenido: string | null = null;

    try {
      const perfil = await crearPerfil.mutateAsync(datosNacimiento);
      perfilIdObtenido = perfil.id;
      setEstado((prev) => ({ ...prev, perfil: "completado" }));
    } catch {
      setEstado((prev) => ({ ...prev, perfil: "error" }));
    }

    // Cálculos en paralelo
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos]);

  useEffect(() => {
    if (!ejecutadoRef.current) {
      ejecutadoRef.current = true;
      void ejecutarCalculos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (todoListo) {
      const timer = setTimeout(onFinalizar, 1200);
      return () => clearTimeout(timer);
    }
  }, [todoListo, onFinalizar]);

  const pasos: Array<{ clave: keyof EstadoCalculo; texto: string }> = [
    { clave: "perfil", texto: "Perfil cósmico" },
    { clave: "cartaNatal", texto: "Carta natal" },
    { clave: "disenoHumano", texto: "Diseño Humano" },
    { clave: "numerologia", texto: "Numerología" },
    { clave: "retornoSolar", texto: "Retorno solar" },
  ];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <PillPaso paso={2} />

        {/* Orbits animation — compact */}
        <div className="relative my-5 h-20 w-20">
          <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border border-white/15">
            <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/50" />
          </div>
          <div className="absolute inset-2.5 animate-[spin_7s_linear_infinite_reverse] rounded-full border border-white/20">
            <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-300" />
          </div>
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/20">
            <Icono nombre="destello" tamaño={16} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {todoListo ? "Tu lectura está lista" : "Construyendo tu lectura"}
        </h1>
      </div>

      {/* Progress items — compact */}
      <div className="flex w-full flex-col gap-1.5">
        {pasos.map((item, idx) => {
          const estadoActual = estado[item.clave];

          return (
            <div
              key={item.clave}
              className="flex items-center gap-3 px-1 py-1.5"
              style={{
                opacity: estadoActual === "pendiente" ? 0.35 : 1,
                transition: "opacity 300ms ease",
                animationDelay: `${idx * 50}ms`,
              }}
            >
              <IndicadorEstado estado={estadoActual} />
              <span
                className={cn(
                  "text-sm",
                  estadoActual === "completado" && "text-white/90",
                  estadoActual === "en_curso" && "text-white/70",
                  estadoActual === "error" && "text-red-300/80",
                  estadoActual === "pendiente" && "text-white/50",
                )}
              >
                {item.texto}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Componentes auxiliares ─── */

function PillPaso({ paso }: { paso: number }) {
  return (
    <span className="rounded-full border border-white/[0.10] bg-white/[0.06] px-4 py-1.5 text-[11px] font-medium tracking-widest text-white/50">
      {paso} / 2
    </span>
  );
}

function IndicadorEstado({ estado }: { estado: EstadoItem }) {
  if (estado === "completado") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/90">
        <Icono nombre="check" tamaño={12} className="text-white" />
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-400/80">
        <Icono nombre="x" tamaño={12} className="text-white" />
      </div>
    );
  }

  if (estado === "en_curso") {
    return (
      <div className="flex h-5 w-5 items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-white/30 border-t-violet-300" />
      </div>
    );
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center">
      <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
    </div>
  );
}
