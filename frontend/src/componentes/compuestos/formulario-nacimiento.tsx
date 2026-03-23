"use client";

import { useState, type FormEvent } from "react";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import type { DatosNacimiento } from "@/lib/tipos";

interface FormularioNacimientoProps {
  onSubmit: (datos: DatosNacimiento) => void;
  cargando?: boolean;
  /** Contenido adicional antes del boton de envio (ej: selector de sistema) */
  children?: React.ReactNode;
}

/**
 * Formulario reutilizable para datos de nacimiento.
 * Se usa en carta natal, diseno humano, numerologia y retorno solar.
 */
export function FormularioNacimiento({
  onSubmit,
  cargando = false,
  children,
}: FormularioNacimientoProps) {
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [horaNacimiento, setHoraNacimiento] = useState("");
  const [ciudadNacimiento, setCiudadNacimiento] = useState("");
  const [paisNacimiento, setPaisNacimiento] = useState("");

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();

    const datos: DatosNacimiento = {
      nombre,
      fecha_nacimiento: fechaNacimiento,
      hora_nacimiento: horaNacimiento,
      ciudad_nacimiento: ciudadNacimiento,
      pais_nacimiento: paisNacimiento,
    };

    onSubmit(datos);
  }

  return (
    <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
      <Input
        etiqueta="Nombre"
        type="text"
        placeholder="Nombre completo"
        icono={<Icono nombre="usuario" tamaño={18} />}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          etiqueta="Fecha de nacimiento"
          type="date"
          icono={<Icono nombre="calendario" tamaño={18} />}
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          required
        />

        <Input
          etiqueta="Hora de nacimiento"
          type="time"
          icono={<Icono nombre="reloj" tamaño={18} />}
          value={horaNacimiento}
          onChange={(e) => setHoraNacimiento(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          etiqueta="Ciudad de nacimiento"
          type="text"
          placeholder="Buenos Aires"
          icono={<Icono nombre="ubicacion" tamaño={18} />}
          value={ciudadNacimiento}
          onChange={(e) => setCiudadNacimiento(e.target.value)}
          required
        />

        <Input
          etiqueta="Pais de nacimiento"
          type="text"
          placeholder="Argentina"
          icono={<Icono nombre="ubicacion" tamaño={18} />}
          value={paisNacimiento}
          onChange={(e) => setPaisNacimiento(e.target.value)}
          required
        />
      </div>

      {children}

      <Boton
        type="submit"
        variante="primario"
        tamaño="lg"
        cargando={cargando}
        icono={<Icono nombre="estrella" tamaño={20} />}
        className="w-full mt-2"
      >
        Calcular
      </Boton>
    </form>
  );
}
