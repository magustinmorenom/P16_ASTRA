"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { motion } from "framer-motion";

import LayoutOnboarding from "@/componentes/layouts/layout-onboarding";
import { Input } from "@/componentes/ui/input";
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
  "h-12 w-full rounded-[20px] border border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie)] px-4 text-sm text-[color:var(--shell-texto)] outline-none placeholder:text-[color:var(--shell-texto-tenue)] transition-all duration-200 focus:border-[color:var(--shell-borde-fuerte)] focus:bg-[color:var(--shell-superficie-fuerte)] focus:ring-2 focus:ring-[color:var(--shell-overlay-suave)]";

const CLASE_INPUT_ACCESO =
  "h-12 rounded-[20px] border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie)] text-[color:var(--shell-texto)] placeholder:text-[color:var(--shell-texto-tenue)] focus:border-[color:var(--shell-borde-fuerte)] focus:bg-[color:var(--shell-superficie-fuerte)] focus:ring-[color:var(--shell-overlay-suave)]";

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

  // Validación nombre: solo letras, espacios, acentos, apóstrofes, guiones. Min 2 chars.
  const nombreValido = /^[a-zA-ZÀ-ÿ\u00f1\u00d1' -]{2,100}$/.test(datos.nombre.trim());

  // Validación fecha: entre 1 y 100 años de edad
  const fechaValida = (() => {
    if (!datos.fecha_nacimiento) return false;
    const partes = datos.fecha_nacimiento.split("-");
    if (partes.length !== 3) return false;
    const [anio, mes, dia] = partes.map(Number);
    if (!anio || !mes || !dia || anio < 1900 || anio > 9999) return false;
    const nacimiento = new Date(anio, mes - 1, dia);
    if (isNaN(nacimiento.getTime())) return false;
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear() -
      (hoy < new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate()) ? 1 : 0);
    return edad >= 1 && edad <= 100;
  })();

  const errorNombre = datos.nombre.length > 0 && !nombreValido;
  const errorFecha = datos.fecha_nacimiento.length > 0 && !fechaValida;

  const puedeAvanzar =
    nombreValido &&
    fechaValida &&
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

  const suave = [0.22, 1, 0.36, 1] as const;
  const contenedor = { animate: { transition: { staggerChildren: 0.07 } } };
  const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: suave } },
  };

  return (
    <motion.div
      className="flex flex-col gap-5"
      variants={contenedor}
      initial="hidden"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={itemAnim}>
        <h1 className="text-center text-2xl font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]">
          Cargá tus datos de nacimiento
        </h1>
        <p className="mt-2 text-center text-[13px] text-[color:var(--shell-texto-tenue)]">
          Necesitamos fecha, hora y lugar para construir tu carta natal.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div className="flex flex-col gap-4" variants={contenedor} initial="hidden" animate="animate">
        <motion.div variants={itemAnim}>
          <Input
            etiqueta="Nombre completo"
            type="text"
            placeholder="Tal como figura en tu documento"
            icono={<Icono nombre="usuario" tamaño={18} />}
            value={datos.nombre}
            onChange={(e) => {
              const valor = e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1' -]/g, "");
              onChange({ nombre: valor });
            }}
            className={CLASE_INPUT_ACCESO}
            required
            minLength={2}
            maxLength={100}
          />
          {errorNombre && (
            <p className="mt-1 px-1 text-[10px] text-red-400">
              Ingresá un valor correcto
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={itemAnim}>
            <Input
              etiqueta="Fecha de nacimiento"
              type="date"
              value={datos.fecha_nacimiento}
              onChange={(e) => {
                let valor = e.target.value;
                const partes = valor.split("-");
                if (partes[0] && partes[0].length > 4) {
                  partes[0] = partes[0].slice(0, 4);
                  valor = partes.join("-");
                }
                onChange({ fecha_nacimiento: valor });
              }}
              min="1925-01-01"
              max={new Date(Date.now() - 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              className={cn(CLASE_INPUT_ACCESO, "[color-scheme:dark]")}
              required
            />
            {errorFecha && (
              <p className="mt-1 px-1 text-[10px] text-red-400">
                Ingresá un valor correcto
              </p>
            )}
          </motion.div>
          <motion.div variants={itemAnim}>
            <Input
              etiqueta="Hora de nacimiento"
              type="time"
              value={datos.hora_nacimiento}
              onChange={(e) => onChange({ hora_nacimiento: e.target.value })}
              className={cn(CLASE_INPUT_ACCESO, "[color-scheme:dark]")}
              required
            />
            <p className="mt-1 px-1 text-[10px] text-[color:var(--shell-texto-tenue)]">
              Si no la sabés, usá 12:00.
            </p>
          </motion.div>
        </div>

        {/* Lugar con autocomplete */}
        <motion.div variants={itemAnim} ref={dropdownRef} className="relative">
          <Icono
            nombre="ubicacion"
            tamaño={16}
            className="pointer-events-none absolute left-4 top-[38px] text-[color:var(--shell-texto-tenue)]"
          />
          <Input
            etiqueta="Lugar de nacimiento"
            type="text"
            placeholder="Ej: Buenos Aires, Argentina"
            value={consulta}
            onChange={(e) => handleLugarChange(e.target.value)}
            onFocus={() => resultados.length > 0 && setAbierto(true)}
            className={cn(CLASE_INPUT_ACCESO, "pl-10 pr-10")}
            required
          />

          {buscando && (
            <div className="absolute right-4 top-[38px]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--shell-borde)] border-t-[color:var(--color-acento)]" />
            </div>
          )}

          {lugarSeleccionado && !buscando && (
            <Icono
              nombre="check"
              tamaño={16}
              className="absolute right-4 top-[38px] text-emerald-400"
            />
          )}

          {abierto && resultados.length > 0 && (
            <div
              className="tema-superficie-panel absolute top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--shell-borde)", boxShadow: "var(--shell-sombra-fuerte)" }}
            >
              {resultados.map((resultado, i) => (
                <button
                  key={`${resultado.latitud}-${resultado.longitud}-${i}`}
                  type="button"
                  onClick={() => seleccionar(resultado)}
                  className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--shell-chip-hover)]"
                  style={{ borderColor: "var(--shell-borde)" }}
                >
                  <Icono
                    nombre="ubicacion"
                    tamaño={14}
                    className="shrink-0 text-[color:var(--color-acento)]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[color:var(--shell-texto)]">
                      {resultado.nombre_mostrar}
                    </p>
                    <p className="text-xs text-[color:var(--shell-texto-tenue)]">
                      {resultado.estado ? `${resultado.estado}, ` : ""}
                      {resultado.pais}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {abierto && resultados.length === 0 && !buscando && consulta.length >= 3 && (
            <div
              className="tema-superficie-panel absolute top-[calc(100%+6px)] z-50 w-full rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--shell-borde)" }}
            >
              <p className="text-sm text-[color:var(--shell-texto-tenue)]">Sin resultados para esa búsqueda.</p>
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemAnim}>
          <button
            type="button"
            onClick={onSiguiente}
            disabled={!puedeAvanzar}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[20px] border text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              borderColor: "rgba(124,77,255,0.3)",
              background: "linear-gradient(135deg, #7C4DFF, #5B2DBF)",
              boxShadow: "0 2px 8px rgba(124,77,255,0.3)",
            }}
          >
            Calcular mi perfil
            <Icono nombre="flecha" tamaño={16} />
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
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
        {/* Orbits animation — compact */}
        <div className="relative my-5 h-20 w-20">
          <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border" style={{ borderColor: "var(--shell-borde)" }}>
            <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[color:var(--shell-texto-tenue)]" />
          </div>
          <div className="absolute inset-2.5 animate-[spin_7s_linear_infinite_reverse] rounded-full border" style={{ borderColor: "var(--shell-borde-fuerte)" }}>
            <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-400" />
          </div>
          <div className="absolute inset-5 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/20">
            <Icono nombre="destello" tamaño={16} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[color:var(--shell-texto)]">
          {todoListo ? "Tu lectura está lista" : "Construyendo tu lectura"}
        </h1>
      </div>

      {/* Progress items */}
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
                  estadoActual === "completado" && "text-[color:var(--shell-texto)]",
                  estadoActual === "en_curso" && "text-[color:var(--shell-texto-secundario)]",
                  estadoActual === "error" && "text-red-400",
                  estadoActual === "pendiente" && "text-[color:var(--shell-texto-tenue)]",
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
        <div className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-[color:var(--shell-borde)] border-t-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center">
      <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--shell-texto-tenue)" }} />
    </div>
  );
}
