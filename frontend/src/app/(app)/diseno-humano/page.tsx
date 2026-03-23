"use client";

import { useState } from "react";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Icono } from "@/componentes/ui/icono";
import { IconoAstral } from "@/componentes/ui/icono-astral";
import { Separador } from "@/componentes/ui/separador";
import { Boton } from "@/componentes/ui/boton";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import BodyGraph from "@/componentes/visualizaciones/body-graph";
import { usarDisenoHumano, usarMisCalculos, usarMiPerfil } from "@/lib/hooks";
import type { DatosNacimiento, DisenoHumano } from "@/lib/tipos";

/** Mapeo de claves de centros a nombres legibles */
const MAPA_CENTROS: Record<string, string> = {
  cabeza: "Cabeza",
  ajna: "Ajna",
  garganta: "Garganta",
  g: "G (Identidad)",
  identidad: "G (Identidad)",
  corazon: "Corazon (Ego)",
  ego: "Corazon (Ego)",
  sacral: "Sacral",
  plexo_solar: "Plexo Solar",
  "plexo solar": "Plexo Solar",
  emocional: "Plexo Solar",
  bazo: "Bazo",
  esplenico: "Bazo",
  raiz: "Raiz",
};

function nombreCentroLegible(clave: string): string {
  return MAPA_CENTROS[clave.toLowerCase()] || clave;
}

export default function PaginaDisenoHumano() {
  const mutacion = usarDisenoHumano();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const { data: perfil } = usarMiPerfil();
  const [datosManual, setDatosManual] = useState<DisenoHumano | null>(null);
  const [modoManual, setModoManual] = useState(false);

  // Datos a mostrar: manual (si recalculó) o desde DB
  const datos = datosManual ?? (calculos?.diseno_humano as DisenoHumano | null) ?? null;
  const nombrePersona = perfil?.nombre ?? "";

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate({ datos: datosNacimiento }, {
      onSuccess: setDatosManual,
    });
  }

  function manejarNuevoCalculo() {
    setModoManual(true);
    setDatosManual(null);
  }

  // Estado de carga
  if (cargandoCalculos && !modoManual) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
            <IconoAstral nombre="personal" tamaño={32} className="text-acento" />
            Diseno Humano
          </h1>
        </div>
        <Tarjeta padding="lg">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-acento border-t-transparent" />
            <p className="text-texto-secundario">
              Cargando tu diseno humano...
            </p>
          </div>
        </Tarjeta>
      </div>
    );
  }

  // Sin datos: formulario
  if (!datos || modoManual) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
            <IconoAstral nombre="personal" tamaño={32} className="text-acento" />
            Diseno Humano
          </h1>
          <p className="mt-2 text-texto-secundario">
            Calcula tu Body Graph completo con tipo, autoridad, perfil,
            centros, canales y activaciones.
          </p>
        </div>

        <Tarjeta padding="lg">
          <FormularioNacimiento
            onSubmit={manejarCalculo}
            cargando={mutacion.isPending}
          />
        </Tarjeta>

        {mutacion.isError && (
          <div className="mt-4 rounded-lg bg-error/10 border border-error/20 px-4 py-3">
            <p className="text-sm text-error">
              {mutacion.error?.message || "Error al calcular el Diseno Humano."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Estado con resultados
  const centrosEntries = Object.entries(datos.centros);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
            <IconoAstral nombre="personal" tamaño={32} className="text-acento" />
            Diseno Humano de {nombrePersona}
          </h1>
          <p className="mt-1 text-texto-secundario">
            Body Graph completo con tipo energetico, autoridad y perfil.
          </p>
        </div>
        <Boton
          variante="secundario"
          tamaño="sm"
          icono={<Icono nombre="flechaIzquierda" tamaño={16} />}
          onClick={manejarNuevoCalculo}
        >
          Nuevo calculo
        </Boton>
      </div>

      {/* Tarjetas principales 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tarjeta variante="violeta" padding="md">
          <div className="text-center">
            <p className="text-sm text-texto-secundario uppercase tracking-wider mb-1">
              Tipo
            </p>
            <p className="text-2xl font-bold text-texto">{datos.tipo}</p>
          </div>
        </Tarjeta>

        <Tarjeta variante="acento" padding="md">
          <div className="text-center">
            <p className="text-sm text-texto-secundario uppercase tracking-wider mb-1">
              Autoridad
            </p>
            <p className="text-2xl font-bold text-texto">{datos.autoridad}</p>
          </div>
        </Tarjeta>

        <Tarjeta variante="cyan" padding="md">
          <div className="text-center">
            <p className="text-sm text-texto-secundario uppercase tracking-wider mb-1">
              Perfil
            </p>
            <p className="text-2xl font-bold text-texto">{datos.perfil}</p>
          </div>
        </Tarjeta>

        <Tarjeta variante="violeta" padding="md">
          <div className="text-center">
            <p className="text-sm text-texto-secundario uppercase tracking-wider mb-1">
              Definicion
            </p>
            <p className="text-2xl font-bold text-texto">{datos.definicion}</p>
          </div>
        </Tarjeta>
      </div>

      {/* Cruz de Encarnacion */}
      <section>
        <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
          <IconoAstral nombre="astrologia" tamaño={24} className="text-acento" />
          Cruz de Encarnacion
        </h2>
        <Tarjeta variante="acento" padding="md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-texto-terciario uppercase tracking-wider">
                Sol Consciente
              </p>
              <p className="text-2xl font-bold text-texto mt-1">
                {datos.cruz_encarnacion.sol_consciente ?? "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-texto-terciario uppercase tracking-wider">
                Tierra Consciente
              </p>
              <p className="text-2xl font-bold text-texto mt-1">
                {datos.cruz_encarnacion.tierra_consciente ?? "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-texto-terciario uppercase tracking-wider">
                Sol Inconsciente
              </p>
              <p className="text-2xl font-bold text-texto mt-1">
                {datos.cruz_encarnacion.sol_inconsciente ?? "--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-texto-terciario uppercase tracking-wider">
                Tierra Inconsciente
              </p>
              <p className="text-2xl font-bold text-texto mt-1">
                {datos.cruz_encarnacion.tierra_inconsciente ?? "--"}
              </p>
            </div>
          </div>
        </Tarjeta>
      </section>

      {/* Body Graph */}
      <Tarjeta padding="lg">
        <BodyGraph datos={datos} />
      </Tarjeta>

      <Separador />

      {/* Centros */}
      <section>
        <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
          <IconoAstral nombre="salud" tamaño={24} className="text-acento" />
          Centros
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {centrosEntries.map(([clave, estado]) => {
            const definido = estado === "definido";
            return (
              <Tarjeta
                key={clave}
                variante={definido ? "violeta" : "default"}
                padding="sm"
              >
                <div className="text-center py-2">
                  <p className="text-sm font-medium text-texto">
                    {nombreCentroLegible(clave)}
                  </p>
                  <Badge
                    variante={definido ? "exito" : "default"}
                    className="mt-2"
                  >
                    {definido ? "Definido" : "Abierto"}
                  </Badge>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      </section>

      <Separador />

      {/* Canales */}
      <section>
        <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
          <IconoAstral nombre="compatibilidad" tamaño={24} className="text-acento" />
          Canales Definidos
        </h2>
        {datos.canales.length === 0 ? (
          <Tarjeta padding="md">
            <p className="text-texto-secundario text-center">
              No se encontraron canales definidos.
            </p>
          </Tarjeta>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {datos.canales.map((canal) => (
              <Tarjeta key={`${canal.puertas[0]}-${canal.puertas[1]}`} variante="cyan" padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-texto">{canal.nombre}</p>
                    <p className="text-sm text-texto-secundario">
                      {canal.centros[0]} - {canal.centros[1]}
                    </p>
                  </div>
                  <Badge variante="default">
                    {canal.puertas[0]} - {canal.puertas[1]}
                  </Badge>
                </div>
              </Tarjeta>
            ))}
          </div>
        )}
      </section>

      <Separador />

      {/* Activaciones */}
      <section>
        <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
          <IconoAstral nombre="suerte" tamaño={24} className="text-acento" />
          Activaciones
        </h2>
        <Tarjeta padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde text-texto-secundario">
                  <th className="text-left py-3 px-4 font-medium">Planeta</th>
                  <th className="text-center py-3 px-4 font-medium">Puerta</th>
                  <th className="text-center py-3 px-4 font-medium">Linea</th>
                  <th className="text-center py-3 px-4 font-medium">Color</th>
                  <th className="text-center py-3 px-4 font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {datos.activaciones_conscientes.map((act) => (
                  <tr
                    key={`c-${act.planeta}-${act.puerta}`}
                    className="border-b border-borde/50 hover:bg-fondo-elevado/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-texto">
                      {act.planeta}
                    </td>
                    <td className="py-3 px-4 text-center text-acento font-mono font-bold">
                      {act.puerta}
                    </td>
                    <td className="py-3 px-4 text-center text-texto font-mono">
                      {act.linea}
                    </td>
                    <td className="py-3 px-4 text-center text-texto font-mono">
                      {act.color}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variante="exito">Consciente</Badge>
                    </td>
                  </tr>
                ))}
                {datos.activaciones_inconscientes.map((act) => (
                  <tr
                    key={`i-${act.planeta}-${act.puerta}`}
                    className="border-b border-borde/50 hover:bg-fondo-elevado/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-texto">
                      {act.planeta}
                    </td>
                    <td className="py-3 px-4 text-center text-acento font-mono font-bold">
                      {act.puerta}
                    </td>
                    <td className="py-3 px-4 text-center text-texto font-mono">
                      {act.linea}
                    </td>
                    <td className="py-3 px-4 text-center text-texto font-mono">
                      {act.color}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variante="advertencia">Inconsciente</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </section>
    </div>
  );
}
