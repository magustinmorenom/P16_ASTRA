"use client";

import { useState, type FormEvent } from "react";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { usarNumerologia, usarMisCalculos } from "@/lib/hooks";
import type { Numerologia, NumeroRespuesta, DatosNumerologia } from "@/lib/tipos";

/** Numeros maestros que reciben tarjeta dorada */
const NUMEROS_MAESTROS = [11, 22, 33];

/** Iconos para cada numero numerologico */
const ICONO_NUMERO: Record<string, { nombre: string; clase: string }> = {
  "Camino de Vida": { nombre: "suerte", clase: "text-acento" },
  "Expresion": { nombre: "emocion", clase: "text-primario" },
  "Impulso del Alma": { nombre: "salud", clase: "text-secundario" },
  "Personalidad": { nombre: "personal", clase: "text-acento" },
  "Numero de Nacimiento": { nombre: "astrologia", clase: "text-primario" },
  "Ano Personal": { nombre: "horoscopo", clase: "text-secundario" },
};

/** Tarjeta individual de un numero numerologico */
function TarjetaNumero({
  titulo,
  dato,
  esMaestro,
}: {
  titulo: string;
  dato: NumeroRespuesta;
  esMaestro: boolean;
}) {
  const iconoConfig = ICONO_NUMERO[titulo];

  return (
    <Tarjeta variante={esMaestro ? "dorado" : "default"} padding="md">
      <div className="text-center space-y-3">
        {iconoConfig && (
          <div className="flex justify-center">
            <IconoAstral
              nombre={iconoConfig.nombre as Parameters<typeof IconoAstral>[0]["nombre"]}
              tamaño={28}
              className={iconoConfig.clase}
            />
          </div>
        )}
        <p className="text-5xl font-bold text-primario">{dato.numero}</p>
        <p className="text-sm font-semibold text-texto uppercase tracking-wider">
          {titulo}
        </p>
        {esMaestro && (
          <Badge variante="advertencia" className="mx-auto">
            Numero Maestro
          </Badge>
        )}
        <p className="text-sm text-texto-secundario leading-relaxed">
          {dato.descripcion}
        </p>
      </div>
    </Tarjeta>
  );
}

export default function PaginaNumerologia() {
  const mutacion = usarNumerologia();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const [datosManual, setDatosManual] = useState<Numerologia | null>(null);
  const [modoManual, setModoManual] = useState(false);

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sistema, setSistema] = useState<"pitagorico" | "caldeo">("pitagorico");

  // Datos a mostrar: manual (si recalculó) o desde DB
  const datos = datosManual ?? (calculos?.numerologia as Numerologia | null) ?? null;

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();

    const payload: DatosNumerologia = {
      nombre,
      fecha_nacimiento: fechaNacimiento,
      sistema,
    };

    mutacion.mutate({ datos: payload }, {
      onSuccess: setDatosManual,
    });
  }

  /** Verifica si un numero es maestro segun la respuesta */
  function esNumeroMaestro(numero: number): boolean {
    if (!datos) return false;
    return (
      NUMEROS_MAESTROS.includes(numero) &&
      datos.numeros_maestros_presentes.includes(numero)
    );
  }

  // Estado de carga
  if (cargandoCalculos && !modoManual) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
            <IconoAstral nombre="numerologia" tamaño={32} className="text-acento" />
            Numerologia
          </h1>
        </div>
        <div className="space-y-4">
          <Esqueleto className="h-12 w-full" />
          <Esqueleto className="h-48 w-full" />
          <Esqueleto className="h-8 w-2/3" />
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-acento border-t-transparent" />
            <p className="text-texto-secundario">Cargando tu carta numerologica...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sin datos: formulario
  if (!datos || modoManual) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
            <IconoAstral nombre="numerologia" tamaño={32} className="text-acento" />
            Numerologia
          </h1>
          <p className="mt-2 text-texto-secundario">
            Calcula tu carta numerologica completa con camino de vida,
            expresion, impulso del alma y mas.
          </p>
        </div>

        <Tarjeta padding="lg">
          <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
            <Input
              etiqueta="Nombre completo"
              type="text"
              placeholder="Nombre completo"
              icono={<Icono nombre="usuario" tamaño={18} />}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <Input
              etiqueta="Fecha de nacimiento"
              type="date"
              icono={<Icono nombre="calendario" tamaño={18} />}
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
            />

            {/* Selector de sistema */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-texto-secundario">
                Sistema de calculo
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSistema("pitagorico")}
                  className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    sistema === "pitagorico"
                      ? "border-primario bg-primario/10 text-primario"
                      : "border-borde bg-fondo-input text-texto-secundario hover:border-borde-hover"
                  }`}
                >
                  Pitagorico
                </button>
                <button
                  type="button"
                  onClick={() => setSistema("caldeo")}
                  className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    sistema === "caldeo"
                      ? "border-primario bg-primario/10 text-primario"
                      : "border-borde bg-fondo-input text-texto-secundario hover:border-borde-hover"
                  }`}
                >
                  Caldeo
                </button>
              </div>
            </div>

            <Boton
              type="submit"
              variante="primario"
              tamaño="lg"
              cargando={mutacion.isPending}
              icono={<IconoAstral nombre="numerologia" tamaño={20} className="text-current" />}
              className="w-full mt-2"
            >
              Calcular
            </Boton>
          </form>
        </Tarjeta>

        {mutacion.isError && (
          <div className="mt-4 rounded-lg bg-error/10 border border-error/20 px-4 py-3">
            <p className="text-sm text-error">
              {mutacion.error?.message || "Error al calcular la numerologia."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Estado con resultados
  const numeros = [
    { titulo: "Camino de Vida", dato: datos.camino_de_vida },
    { titulo: "Expresion", dato: datos.expresion },
    { titulo: "Impulso del Alma", dato: datos.impulso_del_alma },
    { titulo: "Personalidad", dato: datos.personalidad },
    { titulo: "Numero de Nacimiento", dato: datos.numero_nacimiento },
    { titulo: "Ano Personal", dato: datos.anio_personal },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
            <IconoAstral nombre="numerologia" tamaño={32} className="text-acento" />
            Carta Numerologica de {datos.nombre}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-texto-secundario">
              Fecha: {datos.fecha_nacimiento}
            </p>
            <Badge variante="info">
              Sistema {datos.sistema === "pitagorico" ? "Pitagorico" : "Caldeo"}
            </Badge>
          </div>
        </div>
        <Boton
          variante="secundario"
          tamaño="sm"
          icono={<Icono nombre="flechaIzquierda" tamaño={16} />}
          onClick={() => {
            setModoManual(true);
            setDatosManual(null);
          }}
        >
          Nuevo calculo
        </Boton>
      </div>

      {/* Numeros maestros presentes */}
      {datos.numeros_maestros_presentes.length > 0 && (
        <Tarjeta variante="dorado" padding="md">
          <div className="flex items-center gap-3">
            <IconoAstral nombre="suerte" tamaño={24} className="text-yellow-400" />
            <div>
              <p className="font-semibold text-texto">
                Numeros Maestros presentes
              </p>
              <p className="text-sm text-texto-secundario">
                {datos.numeros_maestros_presentes.join(", ")} - Estos numeros no se
                reducen y tienen un significado especial.
              </p>
            </div>
          </div>
        </Tarjeta>
      )}

      {/* Grid de numeros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {numeros.map(({ titulo, dato }) => (
          <TarjetaNumero
            key={titulo}
            titulo={titulo}
            dato={dato}
            esMaestro={esNumeroMaestro(dato.numero)}
          />
        ))}
      </div>
    </div>
  );
}
