import { useMutation, useQuery } from "@tanstack/react-query";
import { clienteApi } from "@/lib/api/cliente";
import type {
  Plan,
  Suscripcion,
  Pago,
  RespuestaCheckout,
  PaisDisponible,
  PaisDetectado,
  EstadoVerificacion,
} from "@/lib/tipos";

export function usarPlanes() {
  return useQuery({
    queryKey: ["planes"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: Plan[] }>("/suscripcion/planes");
      return data.datos;
    },
  });
}

export function usarMiSuscripcion() {
  return useQuery({
    queryKey: ["mi-suscripcion"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: Suscripcion }>(
        "/suscripcion/mi-suscripcion"
      );
      return data.datos;
    },
  });
}

interface ParamsSuscribirse {
  plan_id: string;
  pais_codigo: string;
}

export function usarSuscribirse() {
  return useMutation({
    mutationFn: async (datos: ParamsSuscribirse) => {
      const { data } = await clienteApi.post<{ datos: RespuestaCheckout }>(
        "/suscripcion/suscribirse",
        datos
      );
      return data.datos;
    },
  });
}

export function usarCancelarSuscripcion() {
  return useMutation({
    mutationFn: () => clienteApi.post("/suscripcion/cancelar"),
  });
}

export function usarPagos() {
  return useQuery({
    queryKey: ["pagos"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: Pago[] }>("/suscripcion/pagos");
      return data.datos;
    },
  });
}

export function usarPaises() {
  return useQuery({
    queryKey: ["paises"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: PaisDisponible[] }>(
        "/suscripcion/paises"
      );
      return data.datos;
    },
  });
}

export function usarDetectarPais() {
  return useQuery({
    queryKey: ["detectar-pais"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: PaisDetectado }>(
        "/suscripcion/detectar-pais"
      );
      return data.datos;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function usarVerificarEstado(habilitado: boolean) {
  return useQuery({
    queryKey: ["verificar-estado"],
    queryFn: async () => {
      const { data } = await clienteApi.get<{ datos: EstadoVerificacion }>(
        "/suscripcion/verificar-estado"
      );
      return data.datos;
    },
    enabled: habilitado,
    refetchInterval: habilitado ? 3000 : false,
  });
}
