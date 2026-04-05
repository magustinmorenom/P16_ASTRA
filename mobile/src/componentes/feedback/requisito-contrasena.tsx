import { View, Text } from "react-native";
import { CheckCircle, CircleDashed } from "phosphor-react-native";
import { usarTema } from "@/lib/hooks/usar-tema";
import type { ResultadoValidacion, ResultadoValidacionCompleta } from "@/lib/utilidades/validacion-contrasena";

function Requisito({ cumple, texto }: { cumple: boolean; texto: string }) {
  const { colores } = usarTema();
  const Icono = cumple ? CheckCircle : CircleDashed;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
      <Icono
        size={16}
        color={cumple ? colores.exito : colores.textoMuted}
        weight={cumple ? "fill" : "regular"}
      />
      <Text
        style={{
          marginLeft: 8,
          color: cumple ? colores.exito : colores.textoMuted,
          fontSize: 12,
        }}
      >
        {texto}
      </Text>
    </View>
  );
}

interface RequisitosContrasenaProps {
  validacion: ResultadoValidacion | ResultadoValidacionCompleta;
  mostrarCoincide?: boolean;
}

export function RequisitosContrasena({
  validacion,
  mostrarCoincide = false,
}: RequisitosContrasenaProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Requisito cumple={validacion.minimo} texto="Minimo 8 caracteres" />
      <Requisito cumple={validacion.mayuscula} texto="Al menos una mayuscula" />
      <Requisito cumple={validacion.numero} texto="Al menos un numero" />
      <Requisito cumple={validacion.simbolo} texto="Al menos un simbolo" />
      {mostrarCoincide && "coincide" in validacion && (
        <Requisito
          cumple={validacion.coincide}
          texto="Las contrasenas coinciden"
        />
      )}
    </View>
  );
}
