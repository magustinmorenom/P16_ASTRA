import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { HeaderMobile } from "@/componentes/layouts/header-mobile";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { IconoSigno } from "@/componentes/ui/icono-astral";
import { usarTransitosDia } from "@/lib/hooks/usar-calendario-cosmico";
import { usarTema } from "@/lib/hooks/usar-tema";

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatearISOLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function obtenerDiasSemana(fecha: Date): Date[] {
  const dias: Date[] = [];
  const inicio = new Date(fecha);
  inicio.setDate(inicio.getDate() - inicio.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    dias.push(d);
  }
  return dias;
}

export default function CalendarioCosmicoScreen() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const { colores } = usarTema();
  const fechaStr = formatearISOLocal(fechaSeleccionada);
  const diasSemana = obtenerDiasSemana(fechaSeleccionada);
  const { data: transitosDia, isLoading } = usarTransitosDia(fechaStr);

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <HeaderMobile titulo="Calendario Cósmico" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 16 }}>
          {diasSemana.map((dia) => {
            const esHoy = formatearISOLocal(dia) === formatearISOLocal(new Date());
            const seleccionado = formatearISOLocal(dia) === fechaStr;
            return (
              <Pressable
                key={dia.toISOString()}
                onPress={() => setFechaSeleccionada(dia)}
                style={{
                  alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12,
                  backgroundColor: seleccionado ? colores.acento + "33" : "transparent",
                }}
              >
                <Text style={{ color: colores.textoMuted, fontSize: 12 }}>{DIAS_SEMANA[dia.getDay()]}</Text>
                <Text style={{
                  fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4,
                  color: seleccionado ? colores.acento : esHoy ? colores.primario : colores.textoSecundario,
                }}>
                  {dia.getDate()}
                </Text>
                {esHoy && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colores.acento, marginTop: 4 }} />}
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <Pressable onPress={() => { const d = new Date(fechaSeleccionada); d.setDate(d.getDate() - 7); setFechaSeleccionada(d); }}>
            <Text style={{ color: colores.acento, fontFamily: "Inter_600SemiBold" }}>← Semana anterior</Text>
          </Pressable>
          <Pressable onPress={() => { const d = new Date(fechaSeleccionada); d.setDate(d.getDate() + 7); setFechaSeleccionada(d); }}>
            <Text style={{ color: colores.acento, fontFamily: "Inter_600SemiBold" }}>Semana siguiente →</Text>
          </Pressable>
        </View>
        <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", fontSize: 18, marginBottom: 12 }}>
          Tránsitos del {fechaSeleccionada.getDate()}/{fechaSeleccionada.getMonth() + 1}
        </Text>
        {isLoading ? (
          <View style={{ gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => <Esqueleto key={i} style={{ height: 56, borderRadius: 12 }} />)}
          </View>
        ) : transitosDia ? (
          <View style={{ gap: 8 }}>
            {transitosDia.planetas.map((p) => (
              <Tarjeta key={p.nombre} padding="sm">
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <IconoSigno signo={p.signo} tamaño={20} />
                  <Text style={{ color: colores.primario, fontFamily: "Inter_600SemiBold", marginLeft: 12, flex: 1 }}>{p.nombre}</Text>
                  <Text style={{ color: colores.textoSecundario, fontSize: 14 }}>{p.signo} {p.grado_en_signo.toFixed(1)}°</Text>
                </View>
              </Tarjeta>
            ))}
          </View>
        ) : (
          <Text style={{ color: colores.textoMuted, textAlign: "center" }}>Sin datos</Text>
        )}
      </ScrollView>
    </View>
  );
}
