"use client";

import { useState, useEffect, useRef } from "react";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Badge } from "@/componentes/ui/badge";
import { Icono } from "@/componentes/ui/icono";
import { Separador } from "@/componentes/ui/separador";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { FormularioNacimiento } from "@/componentes/compuestos/formulario-nacimiento";
import { usarRetornoSolar, usarMiPerfil, usarMisCalculos } from "@/lib/hooks";
import { perfilADatosNacimiento } from "@/lib/utilidades/perfil-a-datos";
import { formatearGrado, obtenerSimbolo } from "@/lib/utilidades/formatear-grado";
import type { DatosNacimiento, RetornoSolar } from "@/lib/tipos";

/** Colores segun el tipo de aspecto */
function colorAspecto(tipo: string): string {
  const mapa: Record<string, string> = {
    conjuncion: "text-yellow-400",
    trigono: "text-green-400",
    sextil: "text-blue-400",
    cuadratura: "text-red-400",
    oposicion: "text-red-500",
  };
  const clave = tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return mapa[clave] || "text-texto-secundario";
}

/** Formatea la fecha del retorno solar legible */
function formatearFechaRetorno(fecha: {
  anio: number;
  mes: number;
  dia: number;
  hora_decimal: number;
}): string {
  const horas = Math.floor(fecha.hora_decimal);
  const minutosDecimal = (fecha.hora_decimal - horas) * 60;
  const minutos = Math.floor(minutosDecimal);
  const segundos = Math.floor((minutosDecimal - minutos) * 60);

  const dia = String(fecha.dia).padStart(2, "0");
  const mes = String(fecha.mes).padStart(2, "0");
  const horaStr = String(horas).padStart(2, "0");
  const minStr = String(minutos).padStart(2, "0");
  const segStr = String(segundos).padStart(2, "0");

  return `${dia}/${mes}/${fecha.anio} a las ${horaStr}:${minStr}:${segStr}`;
}

/** Badge de dignidad con color semantico */
function BadgeDignidad({ dignidad }: { dignidad: string | null }) {
  if (!dignidad) return <span className="text-texto-terciario">--</span>;

  const variantes: Record<string, "exito" | "advertencia" | "error" | "info"> = {
    domicilio: "exito",
    exaltacion: "exito",
    detrimento: "error",
    caida: "error",
    peregrino: "advertencia",
  };

  const clave = dignidad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const variante = variantes[clave] || "info";

  return <Badge variante={variante}>{dignidad}</Badge>;
}

export default function PaginaRetornoSolar() {
  const mutacion = usarRetornoSolar();
  const { data: perfil, isLoading: cargandoPerfil } = usarMiPerfil();
  const { data: calculos, isLoading: cargandoCalculos } = usarMisCalculos();
  const [datosManual, setDatosManual] = useState<RetornoSolar | null>(null);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const autoCargadoRef = useRef(false);

  // Prioridad: datos manuales > datos de DB > auto-calculo
  const datosDB = (calculos?.retorno_solar as RetornoSolar | null) ?? null;
  const datos = datosManual ?? datosDB;

  // Auto-calcular solo si no hay datos en DB ni manuales
  useEffect(() => {
    if (perfil && !datos && !autoCargadoRef.current && !mutacion.isPending && !cargandoCalculos) {
      autoCargadoRef.current = true;
      mutacion.mutate(
        { datosNacimiento: perfilADatosNacimiento(perfil), anio, perfilId: perfil.id },
        { onSuccess: setDatosManual }
      );
    }
  }, [perfil, datos, mutacion, anio, cargandoCalculos]);

  // Estado de carga: esperando perfil/calculos o calculando automaticamente
  if (cargandoPerfil || cargandoCalculos || (perfil && !datos && mutacion.isPending)) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-acento border-t-transparent" />
        <p className="text-texto-secundario">Cargando tu revolución solar...</p>
      </div>
    );
  }

  function manejarCalculo(datosNacimiento: DatosNacimiento) {
    mutacion.mutate(
      { datosNacimiento, anio },
      {
        onSuccess: setDatosManual,
      }
    );
  }

  // Estado inicial: formulario (fallback cuando no hay perfil o se reseteo)
  if (!datos) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-texto flex items-center gap-3">
            <Icono nombre="sol" tamaño={32} className="text-acento" />
            Revolucion Solar
          </h1>
          <p className="mt-2 text-texto-secundario">
            Calcula el momento exacto en que el Sol retorna a su posicion natal
            y genera la carta comparativa para el ano seleccionado.
          </p>
        </div>

        <Tarjeta padding="lg">
          <FormularioNacimiento
            onSubmit={manejarCalculo}
            cargando={mutacion.isPending}
          >
            {/* Selector de ano */}
            <Input
              etiqueta="Ano de la revolucion solar"
              type="number"
              icono={<Icono nombre="calendario" tamaño={18} />}
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              min={1900}
              max={2100}
              required
            />
          </FormularioNacimiento>
        </Tarjeta>

        {mutacion.isError && (
          <div className="mt-4 rounded-lg bg-error/10 border border-error/20 px-4 py-3">
            <p className="text-sm text-error">
              {mutacion.error?.message || "Error al calcular la revolucion solar."}
            </p>
          </div>
        )}
      </div>
    );
  }

  const carta = datos.carta_retorno;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-texto">
            Revolucion Solar {datos.anio} de {datos.nombre}
          </h1>
          <p className="mt-1 text-texto-secundario">
            {datos.fecha_nacimiento} - {datos.ciudad}, {datos.pais}
          </p>
        </div>
        <div className="flex gap-2">
          {perfil && (
            <Boton
              variante="secundario"
              tamaño="sm"
              icono={<Icono nombre="calendario" tamaño={16} />}
              onClick={() => {
                setDatosManual(null);
              }}
            >
              Calcular otro año
            </Boton>
          )}
          <Boton
            variante="secundario"
            tamaño="sm"
            icono={<Icono nombre="flechaIzquierda" tamaño={16} />}
            onClick={() => {
              setDatosManual(null);
              autoCargadoRef.current = false;
            }}
          >
            Nuevo cálculo
          </Boton>
        </div>
      </div>

      {/* Fecha exacta del retorno */}
      <Tarjeta variante="violeta" padding="lg">
        <div className="text-center space-y-2">
          <p className="text-sm text-texto-secundario uppercase tracking-wider">
            Fecha exacta del retorno solar
          </p>
          <p className="text-3xl font-bold text-texto">
            {formatearFechaRetorno(datos.fecha_retorno)}
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-xs text-texto-terciario">Sol Natal</p>
              <p className="text-sm text-acento font-mono">
                {formatearGrado(datos.longitud_sol_natal)}
              </p>
            </div>
            <Icono nombre="flecha" tamaño={16} className="text-texto-terciario" />
            <div className="text-center">
              <p className="text-xs text-texto-terciario">Sol Retorno</p>
              <p className="text-sm text-acento font-mono">
                {formatearGrado(datos.longitud_sol_retorno)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-texto-terciario">Error</p>
              <p className="text-sm text-texto-secundario font-mono">
                {datos.error_grados.toFixed(6)}°
              </p>
            </div>
          </div>
        </div>
      </Tarjeta>

      {/* Ascendente y Medio Cielo del Retorno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Tarjeta variante="violeta" padding="md">
          <div className="text-center">
            <p className="text-sm text-texto-secundario uppercase tracking-wider mb-1">
              Ascendente del Retorno
            </p>
            <p className="text-2xl font-bold text-texto">
              {obtenerSimbolo(carta.ascendente.signo)} {carta.ascendente.signo}
            </p>
            <p className="text-sm text-acento mt-1">
              {carta.ascendente.grado_en_signo.toFixed(2)}°
            </p>
          </div>
        </Tarjeta>

        <Tarjeta variante="violeta" padding="md">
          <div className="text-center">
            <p className="text-sm text-texto-secundario uppercase tracking-wider mb-1">
              Medio Cielo del Retorno
            </p>
            <p className="text-2xl font-bold text-texto">
              {obtenerSimbolo(carta.medio_cielo.signo)} {carta.medio_cielo.signo}
            </p>
            <p className="text-sm text-acento mt-1">
              {carta.medio_cielo.grado_en_signo.toFixed(2)}°
            </p>
          </div>
        </Tarjeta>
      </div>

      {/* Seccion Planetas del Retorno */}
      <section>
        <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
          <Icono nombre="planeta" tamaño={24} className="text-acento" />
          Planetas del Retorno
        </h2>
        <Tarjeta padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde text-texto-secundario">
                  <th className="text-left py-3 px-4 font-medium">Planeta</th>
                  <th className="text-left py-3 px-4 font-medium">Signo</th>
                  <th className="text-left py-3 px-4 font-medium">Grado</th>
                  <th className="text-center py-3 px-4 font-medium">Casa</th>
                  <th className="text-center py-3 px-4 font-medium">Retrogrado</th>
                  <th className="text-left py-3 px-4 font-medium">Dignidad</th>
                </tr>
              </thead>
              <tbody>
                {carta.planetas.map((planeta) => (
                  <tr
                    key={planeta.nombre}
                    className="border-b border-borde/50 hover:bg-fondo-elevado/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-texto">
                      {planeta.nombre}
                    </td>
                    <td className="py-3 px-4 text-texto">
                      {obtenerSimbolo(planeta.signo)} {planeta.signo}
                    </td>
                    <td className="py-3 px-4 text-acento font-mono">
                      {planeta.grado_en_signo.toFixed(2)}°
                    </td>
                    <td className="py-3 px-4 text-center text-texto">
                      {planeta.casa}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {planeta.retrogrado ? (
                        <Badge variante="advertencia">&#8478;</Badge>
                      ) : (
                        <span className="text-texto-terciario">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <BadgeDignidad dignidad={planeta.dignidad} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </section>

      <Separador />

      {/* Seccion Casas del Retorno */}
      <section>
        <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
          <Icono nombre="casa" tamaño={24} className="text-acento" />
          Casas del Retorno
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {carta.casas.map((casa) => (
            <Tarjeta key={casa.numero} padding="sm">
              <div className="text-center">
                <p className="text-xs text-texto-terciario uppercase tracking-wider">
                  Casa {casa.numero}
                </p>
                <p className="text-lg font-bold text-texto mt-1">
                  {obtenerSimbolo(casa.signo)}
                </p>
                <p className="text-sm text-texto-secundario">{casa.signo}</p>
                <p className="text-xs text-acento font-mono mt-1">
                  {casa.grado_en_signo.toFixed(2)}°
                </p>
              </div>
            </Tarjeta>
          ))}
        </div>
      </section>

      <Separador />

      {/* Seccion Aspectos del Retorno */}
      <section>
        <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
          <Icono nombre="grafico" tamaño={24} className="text-acento" />
          Aspectos del Retorno
        </h2>
        <Tarjeta padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde text-texto-secundario">
                  <th className="text-left py-3 px-4 font-medium">Planeta 1</th>
                  <th className="text-center py-3 px-4 font-medium">Aspecto</th>
                  <th className="text-left py-3 px-4 font-medium">Planeta 2</th>
                  <th className="text-right py-3 px-4 font-medium">Orbe</th>
                </tr>
              </thead>
              <tbody>
                {carta.aspectos.map((aspecto, idx) => (
                  <tr
                    key={`${aspecto.planeta1}-${aspecto.planeta2}-${idx}`}
                    className="border-b border-borde/50 hover:bg-fondo-elevado/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-texto">
                      {aspecto.planeta1}
                    </td>
                    <td className={`py-3 px-4 text-center font-medium ${colorAspecto(aspecto.tipo)}`}>
                      {aspecto.tipo}
                    </td>
                    <td className="py-3 px-4 font-medium text-texto">
                      {aspecto.planeta2}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-texto-secundario">
                      {aspecto.orbe.toFixed(2)}°
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </section>

      {/* Seccion Aspectos Natal <-> Retorno */}
      {datos.aspectos_natal_retorno && datos.aspectos_natal_retorno.length > 0 && (
        <>
          <Separador />
          <section>
            <h2 className="text-xl font-bold text-texto mb-4 flex items-center gap-2">
              <Icono nombre="grafico" tamaño={24} className="text-acento" />
              Aspectos Natal &#8596; Retorno
            </h2>
            <Tarjeta padding="sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-borde text-texto-secundario">
                      <th className="text-left py-3 px-4 font-medium">
                        Planeta Retorno
                      </th>
                      <th className="text-center py-3 px-4 font-medium">Aspecto</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Planeta Natal
                      </th>
                      <th className="text-right py-3 px-4 font-medium">Orbe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.aspectos_natal_retorno.map((aspecto, idx) => (
                      <tr
                        key={`nr-${aspecto.planeta_retorno}-${aspecto.planeta_natal}-${idx}`}
                        className="border-b border-borde/50 hover:bg-fondo-elevado/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-texto">
                          {aspecto.planeta_retorno}
                        </td>
                        <td className={`py-3 px-4 text-center font-medium ${colorAspecto(aspecto.tipo)}`}>
                          {aspecto.tipo}
                        </td>
                        <td className="py-3 px-4 font-medium text-texto">
                          {aspecto.planeta_natal}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-texto-secundario">
                          {aspecto.orbe.toFixed(2)}°
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tarjeta>
          </section>
        </>
      )}
    </div>
  );
}
