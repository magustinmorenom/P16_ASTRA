import { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { RuedaZodiacal } from "@/componentes/visualizaciones/rueda-zodiacal";
import { usarMisCalculos } from "@/lib/hooks/usar-mis-calculos";
import { usarTema } from "@/lib/hooks/usar-tema";
import { EstadoVacio } from "@/componentes/feedback/estado-vacio";


import { SeccionTriada } from "@/componentes/carta-natal/seccion-triada";
import { DistribucionEnergetica } from "@/componentes/carta-natal/distribucion-energetica";
import { PlanetasNarrativo } from "@/componentes/carta-natal/planeta-narrativo";
import { AspectosNarrativo } from "@/componentes/carta-natal/aspectos-narrativo";
import { CasasGrid } from "@/componentes/carta-natal/casas-grid";
import { SheetDetalle, type SeleccionSheet } from "@/componentes/carta-natal/sheet-detalle";
import { useRouter } from "expo-router";

import type { Planeta, Aspecto, Casa } from "@/lib/tipos";

export default function PantallaAstral() {
  const insets = useSafeAreaInsets();
  const { data: calculos, isLoading, refetch } = usarMisCalculos();
  const { colores } = usarTema();
  const router = useRouter();
  const natal = calculos?.natal;
  const [seleccion, setSeleccion] = useState<SeleccionSheet | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const manejarRefresh = async () => {
    setRefrescando(true);
    await refetch();
    setRefrescando(false);
  };

  const seleccionarPlaneta = useCallback((p: Planeta) => {
    setSeleccion({ tipo: "planeta", planeta: p });
  }, []);

  const seleccionarAspecto = useCallback((a: Aspecto) => {
    setSeleccion({ tipo: "aspecto", aspecto: a });
  }, []);

  const seleccionarCasa = useCallback((c: Casa) => {
    setSeleccion({ tipo: "casa", casa: c });
  }, []);

  const seleccionarTriada = useCallback((subtipo: "sol" | "luna" | "ascendente") => {
    setSeleccion({ tipo: "triada", subtipo });
  }, []);

  const cerrarSheet = useCallback(() => {
    setSeleccion(null);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, paddingHorizontal: 16, paddingTop: insets.top + 16 }}>
        <Esqueleto style={{ height: 32, width: 160, marginBottom: 16 }} />
        <Esqueleto style={{ height: 288, borderRadius: 16, marginBottom: 16 }} />
        <Esqueleto style={{ height: 80, borderRadius: 12, marginBottom: 8 }} />
        <Esqueleto style={{ height: 80, borderRadius: 12 }} />
      </View>
    );
  }

  if (!natal) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, paddingTop: insets.top }}>
        <EstadoVacio
          icono="moon"
          titulo="Tu carta astral espera"
          descripcion="Completa tu perfil de nacimiento para descubrir lo que los astros tienen para vos."
          accion={{ texto: "Ir a Perfil", onPress: () => router.push("/(tabs)/perfil") }}
        />
      </View>
    );
  }

  const sol = natal.planetas.find((p) => p.nombre === "Sol");
  const luna = natal.planetas.find((p) => p.nombre === "Luna");

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 120,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={manejarRefresh} tintColor={colores.acento} />
        }
      >
        {/* Título */}
        <AnimacionEntrada>
          <Text style={{ color: colores.primario, fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 12 }}>
            Carta Astral
          </Text>
        </AnimacionEntrada>

        {/* Tríada — Sol, Luna, Ascendente */}
        {sol && luna && (
          <AnimacionEntrada retraso={100}>
            <SeccionTriada
              sol={sol}
              luna={luna}
              ascendente={natal.ascendente}
              onSeleccionar={seleccionarTriada}
            />
          </AnimacionEntrada>
        )}

        {/* Distribución Energética */}
        <AnimacionEntrada retraso={300}>
          <DistribucionEnergetica planetas={natal.planetas} />
        </AnimacionEntrada>

        {/* Planetas */}
        <AnimacionEntrada retraso={400}>
          <PlanetasNarrativo
            planetas={natal.planetas}
            onSeleccionar={seleccionarPlaneta}
          />
        </AnimacionEntrada>

        {/* Aspectos */}
        <AnimacionEntrada retraso={500}>
          <AspectosNarrativo
            aspectos={natal.aspectos}
            onSeleccionar={seleccionarAspecto}
          />
        </AnimacionEntrada>

        {/* Casas */}
        <AnimacionEntrada retraso={600}>
          <CasasGrid
            casas={natal.casas}
            onSeleccionar={seleccionarCasa}
          />
        </AnimacionEntrada>
      </ScrollView>

      {/* Bottom Sheet */}
      {seleccion && (
        <SheetDetalle
          seleccion={seleccion}
          datos={natal}
          onCerrar={cerrarSheet}
        />
      )}
    </View>
  );
}
