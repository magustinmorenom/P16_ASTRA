"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import LayoutOnboarding from "@/componentes/layouts/layout-onboarding";
import { Icono } from "@/componentes/ui/icono";
import {
  IconoAstral,
  type NombreIconoAstral,
} from "@/componentes/ui/icono-astral";
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

type TonoBarra = "panel" | "hero";
type EstadoItem = "pendiente" | "en_curso" | "completado" | "error";

interface EstadoCalculo {
  perfil: EstadoItem;
  cartaNatal: EstadoItem;
  disenoHumano: EstadoItem;
  numerologia: EstadoItem;
  retornoSolar: EstadoItem;
}

const TEXTOS_PANEL: Record<number, string> = {
  0: "Con tu fecha, hora y lugar activamos una base precisa para astrología, Diseño Humano y numerología sin perder continuidad visual ni técnica.",
  1: "",
};

const MODULOS_GENERADOS: Array<{
  icono: NombreIconoAstral;
  titulo: string;
  descripcion: string;
}> = [
  {
    icono: "astrologia",
    titulo: "Carta natal",
    descripcion: "Posiciones, casas y aspectos base.",
  },
  {
    icono: "personal",
    titulo: "Diseño Humano",
    descripcion: "Tipo, autoridad y perfil inicial.",
  },
  {
    icono: "numerologia",
    titulo: "Numerología",
    descripcion: "Ritmo, núcleo y tono personal.",
  },
];

const PISTAS_PRECISION = [
  {
    icono: "reloj" as const,
    titulo: "Hora aproximada",
    descripcion:
      "Si no conocés tu hora exacta, usá 12:00. Algunas capas del perfil pueden variar después.",
  },
  {
    icono: "ubicacion" as const,
    titulo: "Zona horaria histórica",
    descripcion:
      "Usamos la ubicación seleccionada para resolver el huso horario real del nacimiento y evitar errores.",
  },
];

const CLASE_CAMPO_BASE =
  "h-12 w-full rounded-[20px] border px-4 text-sm outline-none transition-all duration-200 placeholder:text-[color:var(--shell-texto-tenue)] focus:border-[color:var(--shell-borde-fuerte)] focus:bg-[color:var(--shell-superficie-fuerte)] focus:ring-4 focus:ring-[color:var(--shell-overlay-suave)]";

const CLASE_CAMPO_PANEL = cn(
  CLASE_CAMPO_BASE,
  "border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie)] text-[color:var(--shell-texto)]",
);

function BarraProgreso({
  paso,
  tono = "panel",
}: {
  paso: number;
  tono?: TonoBarra;
}) {
  const esHero = tono === "hero";

  return (
    <div
      className={cn(
        "mb-8 rounded-[28px] border p-4 sm:p-5",
        esHero ? "border-white/10 bg-white/[0.06]" : "tema-superficie-panel-suave",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.18em]",
              esHero
                ? "text-[color:var(--shell-hero-texto-tenue)]"
                : "text-[color:var(--shell-texto-tenue)]",
            )}
          >
            Configuración inicial
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-semibold",
              esHero
                ? "text-[color:var(--shell-hero-texto)]"
                : "text-[color:var(--shell-texto)]",
            )}
          >
            Paso {paso + 1} de 2
          </p>
        </div>

        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
            esHero
              ? "border-white/12 bg-white/10 text-[color:var(--shell-hero-texto-secundario)]"
              : "border-[color:var(--shell-badge-violeta-borde)] bg-[color:var(--shell-badge-violeta-fondo)] text-[color:var(--shell-badge-violeta-texto)]",
          )}
        >
          {paso === 0 ? "Datos natales" : "Activando motor"}
        </span>
      </div>

      <div
        className={cn(
          "mt-4 h-2 overflow-hidden rounded-full",
          esHero ? "bg-white/10" : "bg-[color:var(--shell-superficie)]",
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((paso + 1) / 2) * 100}%`,
            background: esHero
              ? "linear-gradient(135deg, var(--color-dorado-300), var(--color-violet-300))"
              : "var(--shell-gradiente-boton)",
          }}
        />
      </div>
    </div>
  );
}

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

  if (paso === 1) {
    return (
      <LayoutOnboarding modoOscuro>
        <BarraProgreso paso={1} tono="hero" />
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

      <PasoDatosCompletos
        datos={datos}
        onChange={(parcial) => setDatos({ ...datos, ...parcial })}
        onSiguiente={() => setPaso(1)}
      />
    </LayoutOnboarding>
  );
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

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

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
    const handler = (evento: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(evento.target as Node)
      ) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{
            borderColor: "var(--shell-badge-violeta-borde)",
            background: "var(--shell-badge-violeta-fondo)",
            color: "var(--shell-badge-violeta-texto)",
          }}
        >
          <Icono nombre="destello" tamaño={14} />
          Datos natales
        </span>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[color:var(--shell-texto)]">
          Cargá tu momento de nacimiento
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
          Con esta base vamos a generar tu carta natal, tu Diseño Humano, tu
          numerología y tu retorno solar inicial sin obligarte a navegar pantallas
          desconectadas entre sí.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {MODULOS_GENERADOS.map((modulo) => (
          <article
            key={modulo.titulo}
            className="rounded-[24px] border p-4"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie)",
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[18px]"
              style={{
                background: "var(--shell-gradiente-acento-suave)",
                color: "var(--color-acento)",
              }}
            >
              <IconoAstral nombre={modulo.icono} tamaño={20} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[color:var(--shell-texto)]">
              {modulo.titulo}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
              {modulo.descripcion}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoFormulario etiqueta="Nombre completo">
            <input
              type="text"
              placeholder="Tu nombre"
              value={datos.nombre}
              onChange={(e) => onChange({ nombre: e.target.value })}
              className={CLASE_CAMPO_PANEL}
            />
          </CampoFormulario>

          <div
            className="rounded-[24px] border p-4"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
              Qué vamos a usar
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
              Fecha, hora y lugar reales para fijar la zona horaria histórica y
              calcular el perfil con precisión.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoFormulario etiqueta="Fecha de nacimiento">
            <input
              type="date"
              value={datos.fecha_nacimiento}
              onChange={(e) => onChange({ fecha_nacimiento: e.target.value })}
              className={CLASE_CAMPO_PANEL}
            />
          </CampoFormulario>

          <CampoFormulario etiqueta="Hora de nacimiento">
            <input
              type="time"
              value={datos.hora_nacimiento}
              onChange={(e) => onChange({ hora_nacimiento: e.target.value })}
              className={CLASE_CAMPO_PANEL}
            />
          </CampoFormulario>
        </div>

        <CampoFormulario etiqueta="Lugar de nacimiento">
          <div ref={dropdownRef} className="relative">
            <Icono
              nombre="ubicacion"
              tamaño={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--shell-texto-tenue)]"
            />
            <input
              type="text"
              placeholder="Ej: Buenos Aires, Argentina"
              value={consulta}
              onChange={(e) => handleLugarChange(e.target.value)}
              onFocus={() => resultados.length > 0 && setAbierto(true)}
              className={cn(
                CLASE_CAMPO_BASE,
                "pl-11 pr-12",
                lugarSeleccionado
                  ? "border-[color:var(--shell-badge-exito-borde)] bg-[color:var(--shell-badge-exito-fondo)] text-[color:var(--shell-texto)]"
                  : "border-[color:var(--shell-borde)] bg-[color:var(--shell-superficie)] text-[color:var(--shell-texto)]",
              )}
            />

            {buscando && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--shell-chip-borde)] border-t-[color:var(--color-acento)]" />
              </div>
            )}

            {lugarSeleccionado && !buscando && (
              <Icono
                nombre="check"
                tamaño={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[color:var(--shell-badge-exito-texto)]"
              />
            )}

            {abierto && resultados.length > 0 && (
              <div className="tema-superficie-panel absolute top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-[24px]">
                {resultados.map((resultado, indice) => (
                  <button
                    key={`${resultado.latitud}-${resultado.longitud}-${indice}`}
                    type="button"
                    onClick={() => seleccionar(resultado)}
                    className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[color:var(--shell-superficie-suave)]"
                    style={{ borderColor: "var(--shell-borde)" }}
                  >
                    <Icono
                      nombre="ubicacion"
                      tamaño={15}
                      className="shrink-0 text-[color:var(--color-acento)]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[color:var(--shell-texto)]">
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
              <div className="tema-superficie-panel absolute top-[calc(100%+8px)] z-50 w-full rounded-[24px] px-4 py-4">
                <p className="text-sm text-[color:var(--shell-texto-secundario)]">
                  No encontramos ubicaciones para esa búsqueda.
                </p>
              </div>
            )}
          </div>
        </CampoFormulario>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PISTAS_PRECISION.map((pista) => (
          <article
            key={pista.titulo}
            className="rounded-[24px] border p-4"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[16px]"
                style={{
                  background: "var(--shell-superficie-suave)",
                  color: "var(--color-acento)",
                }}
              >
                <Icono nombre={pista.icono} tamaño={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--shell-texto)]">
                  {pista.titulo}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                  {pista.descripcion}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onSiguiente}
        disabled={!puedeAvanzar}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[22px] px-5 text-sm font-semibold text-white transition-all hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
        style={{
          background: "var(--shell-gradiente-boton)",
          boxShadow: "var(--shell-sombra-suave)",
        }}
      >
        <Icono nombre="destello" tamaño={18} />
        Calcular mi perfil cósmico
      </button>
    </div>
  );
}

function CampoFormulario({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-texto-tenue)]">
        {etiqueta}
      </span>
      {children}
    </label>
  );
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

    setEstado((prev) => ({ ...prev, perfil: "en_curso" }));

    let perfilIdObtenido: string | null = null;

    try {
      const perfil = await crearPerfil.mutateAsync(datosNacimiento);
      perfilIdObtenido = perfil.id;
      setEstado((prev) => ({ ...prev, perfil: "completado" }));
    } catch {
      setEstado((prev) => ({ ...prev, perfil: "error" }));
    }

    setEstado((prev) => ({
      ...prev,
      cartaNatal: "en_curso",
      disenoHumano: "en_curso",
      numerologia: "en_curso",
      retornoSolar: "en_curso",
    }));

    const promesas = [
      cartaNatal
        .mutateAsync({
          datos: datosNacimiento,
          perfilId: perfilIdObtenido ?? undefined,
        })
        .then(() => setEstado((prev) => ({ ...prev, cartaNatal: "completado" })))
        .catch(() => setEstado((prev) => ({ ...prev, cartaNatal: "error" }))),

      disenoHumano
        .mutateAsync({
          datos: datosNacimiento,
          perfilId: perfilIdObtenido ?? undefined,
        })
        .then(() =>
          setEstado((prev) => ({ ...prev, disenoHumano: "completado" })),
        )
        .catch(() => setEstado((prev) => ({ ...prev, disenoHumano: "error" }))),

      numerologia
        .mutateAsync({
          datos: datosNumerologia,
          perfilId: perfilIdObtenido ?? undefined,
        })
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
      const timer = window.setTimeout(() => {
        void ejecutarCalculos();
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [ejecutarCalculos]);

  useEffect(() => {
    if (todoListo) {
      const timer = setTimeout(onFinalizar, 1500);
      return () => clearTimeout(timer);
    }
  }, [todoListo, onFinalizar]);

  const pasos = [
    {
      clave: "perfil" as const,
      textoEnCurso: "Creando tu perfil cósmico",
      textoListo: "Perfil creado",
    },
    {
      clave: "cartaNatal" as const,
      textoEnCurso: "Calculando carta natal",
      textoListo: "Carta natal lista",
    },
    {
      clave: "disenoHumano" as const,
      textoEnCurso: "Analizando Diseño Humano",
      textoListo: "Diseño Humano listo",
    },
    {
      clave: "numerologia" as const,
      textoEnCurso: "Procesando numerología",
      textoListo: "Numerología lista",
    },
    {
      clave: "retornoSolar" as const,
      textoEnCurso: "Calculando retorno solar",
      textoListo: "Retorno solar listo",
    },
  ];

  const tieneErrores = Object.values(estado).some((item) => item === "error");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative my-4 h-[120px] w-[120px]">
          <div className="absolute inset-0 animate-[spin_12s_linear_infinite] rounded-full border border-white/18">
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/55" />
          </div>
          <div className="absolute inset-3 animate-[spin_8s_linear_infinite_reverse] rounded-full border border-white/22">
            <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-violet-300" />
          </div>
          <div className="absolute inset-6 animate-[spin_5s_linear_infinite] rounded-full border border-white/18">
            <div className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-dorado-400" />
          </div>
          <div className="absolute inset-9 flex items-center justify-center rounded-full shadow-[var(--shell-sombra-fuerte)]" style={{ background: "linear-gradient(135deg, var(--color-dorado-300), var(--color-dorado-500))" }}>
            <Icono nombre="destello" tamaño={20} className="text-white" />
          </div>
        </div>

        <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-hero-texto-secundario)]">
          Activando tu perfil
        </span>
        <h2 className="mt-5 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[color:var(--shell-hero-texto)]">
          {todoListo && !tieneErrores
            ? "Tu perfil cósmico ya está listo"
            : todoListo
              ? "Terminamos la calibración inicial"
              : "Estamos construyendo tu primera lectura"}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--shell-hero-texto-secundario)]">
          {todoListo && !tieneErrores
            ? "Redirigiendo al dashboard para que veas tu mapa completo."
            : todoListo
              ? "Hubo módulos que van a necesitar revisión, pero ya te llevamos al dashboard para continuar."
              : "Procesamos efemérides históricas, zona horaria exacta y los cálculos base de ASTRA en paralelo."}
        </p>
      </div>

      <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:p-5">
        <div className="border-b border-white/10 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--shell-hero-texto-tenue)]">
            Estado del proceso
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--shell-hero-texto-secundario)]">
            Cada módulo se activa en secuencia para dejar la app lista desde el primer ingreso.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {pasos.map((item) => {
            const estadoActual = estado[item.clave];

            return (
              <div
                key={item.clave}
                className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/10 px-4 py-3"
              >
                <IndicadorEstado estado={estadoActual} />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      estadoActual === "pendiente" &&
                        "text-[color:var(--shell-hero-texto-tenue)]",
                      estadoActual === "en_curso" &&
                        "text-[color:var(--shell-hero-texto-secundario)]",
                      estadoActual === "completado" &&
                        "text-[color:var(--shell-hero-texto)]",
                      estadoActual === "error" && "text-red-200",
                    )}
                  >
                    {estadoActual === "completado"
                      ? item.textoListo
                      : item.textoEnCurso}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {tieneErrores ? (
          <div className="mt-4 rounded-[22px] border px-4 py-3" style={{ borderColor: "var(--shell-badge-error-borde)", background: "var(--shell-badge-error-fondo)" }}>
            <p className="text-sm leading-6 text-red-200">
              Algunos cálculos no terminaron correctamente. Podrás recalcularlos
              desde tu perfil o al volver a entrar a cada módulo.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IndicadorEstado({ estado }: { estado: EstadoItem }) {
  if (estado === "completado") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-exito/90 text-white shadow-[var(--shell-sombra-suave)]">
        <Icono nombre="check" tamaño={15} />
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-error/90 text-white shadow-[var(--shell-sombra-suave)]">
        <Icono nombre="x" tamaño={15} />
      </div>
    );
  }

  if (estado === "en_curso") {
    return (
      <div className="flex h-7 w-7 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/45 border-t-dorado-400" />
      </div>
    );
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center">
      <div className="h-2.5 w-2.5 rounded-full bg-white/28" />
    </div>
  );
}
