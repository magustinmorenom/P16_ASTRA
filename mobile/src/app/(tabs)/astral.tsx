import { useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Esqueleto } from "@/componentes/ui/esqueleto";
import { AnimacionEntrada } from "@/componentes/ui/animacion-entrada";
import { RuedaZodiacal } from "@/componentes/visualizaciones/rueda-zodiacal";
import { usarMisCalculos } from "@/lib/hooks/usar-mis-calculos";
import { usarTema } from "@/lib/hooks/usar-tema";
import { generarEsencia } from "@/lib/utilidades/interpretaciones-natal";

import { SeccionTriada } from "@/componentes/carta-natal/seccion-triada";
import { DistribucionEnergetica } from "@/componentes/carta-natal/distribucion-energetica";
import { PlanetasNarrativo } from "@/componentes/carta-natal/planeta-narrativo";
import { AspectosNarrativo } from "@/componentes/carta-natal/aspectos-narrativo";
import { CasasGrid } from "@/componentes/carta-natal/casas-grid";
import { SheetDetalle, type SeleccionSheet } from "@/componentes/carta-natal/sheet-detalle";

import type { Planeta, Aspecto, Casa } from "@/lib/tipos";

export default function PantallaAstral() {
  const insets = useSafeAreaInsets();
  const { data: calculos, isLoading } = usarMisCalculos();
  const { colores } = usarTema();
  const natal = calculos?.natal;
  const [seleccion, setSeleccion] = useState<SeleccionSheet | null>(null);

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
      <View style={{ flex: 1, backgroundColor: colores.fondo, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: insets.top }}>
        <Text style={{ color: colores.primario, fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" }}>
          Carta Astral
        </Text>
        <Text style={{ color: colores.textoSecundario, textAlign: "center", marginTop: 8 }}>
          Completá tu perfil para ver tu carta natal
        </Text>
      </View>
    );
  }

  const sol = natal.planetas.find((p) => p.nombre === "Sol");
  const luna = natal.planetas.find((p) => p.nombre === "Luna");
  const esencia = sol && luna ? generarEsencia(sol.signo, luna.signo, natal.ascendente.signo) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 120,
          paddingHorizontal: 16,
        }}
      >
        {/* Título + Esencia */}
        <AnimacionEntrada>
          <Text style={{ color: colores.primario, fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 }}>
            Carta Astral
          </Text>
          {esencia && (
            <Text style={{ color: colores.acento, fontSize: 13, fontStyle: "italic", marginBottom: 12 }}>
              &ldquo;{esencia}&rdquo;
            </Text>
          )}
        </AnimacionEntrada>

        {/* Rueda Zodiacal */}
        <AnimacionEntrada retraso={100}>
          <RuedaZodiacal
            planetas={natal.planetas}
            casas={natal.casas}
            aspectos={natal.aspectos}
          />
        </AnimacionEntrada>

        {/* Tríada */}
        {sol && luna && (
          <AnimacionEntrada retraso={200}>
            <View style={{ marginTop: 16 }}>
              <SeccionTriada
                sol={sol}
                luna={luna}
                ascendente={natal.ascendente}
                onSeleccionar={seleccionarTriada}
              />
            </View>
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
