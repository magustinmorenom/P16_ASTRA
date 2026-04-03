import { useEffect, useMemo, useState } from "react";
import { View, Text, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Input } from "@/componentes/ui/input";
import { Boton } from "@/componentes/ui/boton";
import { SelectorCiudad } from "@/componentes/compuestos/selector-ciudad";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { DatosNacimiento, ResultadoGeo } from "@/lib/tipos";

interface FormularioNacimientoProps {
  onEnviar: (datos: DatosNacimiento) => void;
  cargando?: boolean;
  valoresIniciales?: Partial<DatosNacimiento>;
  textoBoton?: string;
}

export function FormularioNacimiento({
  onEnviar,
  cargando = false,
  valoresIniciales,
  textoBoton = "Calcular",
}: FormularioNacimientoProps) {
  const { esOscuro, colores } = usarTema();
  const geoInicial = useMemo<ResultadoGeo | null>(() => {
    if (
      !valoresIniciales?.ciudad_nacimiento ||
      !valoresIniciales?.pais_nacimiento ||
      typeof valoresIniciales.latitud !== "number" ||
      typeof valoresIniciales.longitud !== "number" ||
      !valoresIniciales.zona_horaria
    ) {
      return null;
    }

    const nombreMostrar = [
      valoresIniciales.ciudad_nacimiento,
      valoresIniciales.pais_nacimiento,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      nombre_mostrar: nombreMostrar,
      ciudad: valoresIniciales.ciudad_nacimiento,
      estado: "",
      pais: valoresIniciales.pais_nacimiento,
      latitud: valoresIniciales.latitud,
      longitud: valoresIniciales.longitud,
      zona_horaria: valoresIniciales.zona_horaria,
    };
  }, [
    valoresIniciales?.ciudad_nacimiento,
    valoresIniciales?.pais_nacimiento,
    valoresIniciales?.latitud,
    valoresIniciales?.longitud,
    valoresIniciales?.zona_horaria,
  ]);

  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? "");
  const [fecha, setFecha] = useState<Date>(
    valoresIniciales?.fecha_nacimiento
      ? new Date(valoresIniciales.fecha_nacimiento + "T12:00:00")
      : new Date(1990, 0, 1)
  );
  const [hora, setHora] = useState<Date>(() => {
    if (valoresIniciales?.hora_nacimiento) {
      const [h, m] = valoresIniciales.hora_nacimiento.split(":");
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0);
      return d;
    }
    return new Date(2000, 0, 1, 12, 0);
  });
  const [geoSeleccionado, setGeoSeleccionado] = useState<ResultadoGeo | null>(geoInicial);
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [mostrarHora, setMostrarHora] = useState(false);

  useEffect(() => {
    if (typeof valoresIniciales?.nombre === "string") {
      setNombre(valoresIniciales.nombre);
    }
    if (valoresIniciales?.fecha_nacimiento) {
      setFecha(new Date(valoresIniciales.fecha_nacimiento + "T12:00:00"));
    }
    if (valoresIniciales?.hora_nacimiento) {
      const [h, m] = valoresIniciales.hora_nacimiento.split(":");
      const d = new Date(2000, 0, 1, 12, 0);
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      setHora(d);
    }
    setGeoSeleccionado(geoInicial);
  }, [
    geoInicial,
    valoresIniciales?.fecha_nacimiento,
    valoresIniciales?.hora_nacimiento,
    valoresIniciales?.nombre,
  ]);

  const formatearFechaLocal = (d: Date) => {
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}/${d.getFullYear()}`;
  };

  const formatearHoraLocal = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const esValido = nombre.trim() && geoSeleccionado !== null;

  const manejarEnvio = () => {
    if (!geoSeleccionado) return;

    const yy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");

    onEnviar({
      nombre: nombre.trim(),
      fecha_nacimiento: `${yy}-${mm}-${dd}`,
      hora_nacimiento: formatearHoraLocal(hora),
      ciudad_nacimiento: geoSeleccionado.ciudad || geoSeleccionado.estado,
      pais_nacimiento: geoSeleccionado.pais,
      latitud: geoSeleccionado.latitud,
      longitud: geoSeleccionado.longitud,
      zona_horaria: geoSeleccionado.zona_horaria,
    });
  };

  // Valor inicial para el selector si ya hay datos previos
  const ciudadInicial = valoresIniciales?.ciudad_nacimiento
    ? [valoresIniciales.ciudad_nacimiento, valoresIniciales.pais_nacimiento]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <View style={{ gap: 4 }}>
      <Input
        etiqueta="Nombre completo"
        placeholder="Tu nombre"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 11,
            fontFamily: "Inter_500Medium",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Fecha de nacimiento
        </Text>
        <Boton variante="secundario" onPress={() => setMostrarFecha(true)}>
          {formatearFechaLocal(fecha)}
        </Boton>
        {mostrarFecha && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            themeVariant={esOscuro ? "dark" : "light"}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={(_, d) => {
              setMostrarFecha(Platform.OS === "ios");
              if (d) setFecha(d);
            }}
          />
        )}
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            color: colores.textoSecundario,
            fontSize: 11,
            fontFamily: "Inter_500Medium",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Hora de nacimiento
        </Text>
        <Boton variante="secundario" onPress={() => setMostrarHora(true)}>
          {formatearHoraLocal(hora)}
        </Boton>
        {mostrarHora && (
          <DateTimePicker
            value={hora}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            themeVariant={esOscuro ? "dark" : "light"}
            onChange={(_, d) => {
              setMostrarHora(Platform.OS === "ios");
              if (d) setHora(d);
            }}
          />
        )}
      </View>

      <View style={{ zIndex: 10 }}>
        <SelectorCiudad
          valorInicial={ciudadInicial}
          onSeleccionar={setGeoSeleccionado}
          onCambioTexto={() => setGeoSeleccionado(null)}
        />
      </View>

      <Boton
        onPress={manejarEnvio}
        cargando={cargando}
        disabled={!esValido}
        style={{ marginTop: 8 }}
      >
        {textoBoton}
      </Boton>
    </View>
  );
}
