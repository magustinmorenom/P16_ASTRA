"use client";

import { type InputHTMLAttributes, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { Avatar } from "@/componentes/ui/avatar";
import { Boton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";

import {
  usarCambiarContrasena,
  usarEliminarCuenta,
  usarMiPerfil,
  usarActualizarPerfil,
  usarCartaNatal,
  usarDisenoHumano,
  usarNumerologia,
  usarRetornoSolar,
  usarMiSuscripcion,
  usarGenerarCodigo,
  usarEstadoVinculacion,
  usarDesvincular,
} from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type { DatosNacimiento } from "@/lib/tipos";
import { formatearFechaCorta } from "@/lib/utilidades/formatear-fecha";
import {
  esPlanPago,
  obtenerEtiquetaPlan,
} from "@/lib/utilidades/planes";
import HeaderMobile from "@/componentes/layouts/header-mobile";

const FONDO_PERFIL =
  "relative min-h-full overflow-hidden bg-[#16011B]";
const SUPERFICIE_HERO =
  "relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))] shadow-[0_24px_70px_rgba(8,2,22,0.38)]";
const SUPERFICIE_PANEL =
  "rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_40px_rgba(8,3,20,0.22)] backdrop-blur-xl";

function FondoPerfil() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(179,136,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(76,35,140,0.16),transparent_32%)]" />
      <div className="absolute right-[-80px] top-0 h-72 w-72 rounded-full bg-[#B388FF]/14 blur-3xl" />
      <div className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full bg-[#7C4DFF]/12 blur-3xl" />
    </>
  );
}

function EtiquetaPanel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/70">
      {children}
    </p>
  );
}

function BadgeEstado({
  children,
  tono = "neutral",
}: {
  children: string;
  tono?: "neutral" | "exito" | "error" | "violeta";
}) {
  const clases = {
    neutral: "border-white/10 bg-white/[0.06] text-white/72",
    exito: "border-emerald-400/20 bg-emerald-500/14 text-emerald-200",
    error: "border-rose-400/20 bg-rose-500/14 text-rose-200",
    violeta: "border-[#B388FF]/20 bg-[#7C4DFF]/12 text-[#E7DAFF]",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${clases[tono]}`}>
      {children}
    </span>
  );
}

function DatoCompacto({
  etiqueta,
  valor,
  icono,
}: {
  etiqueta: string;
  valor: string;
  icono: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-white/46">
        <Icono nombre={icono} tamaño={14} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
          {etiqueta}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-white/88">
        {valor || "—"}
      </p>
    </div>
  );
}

function CampoPerfil({
  etiqueta,
  icono,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  icono?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
        {icono ? <Icono nombre={icono} tamaño={14} /> : null}
        {etiqueta}
      </span>
      <input
        {...props}
        className={`h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/32 focus:border-[#B388FF] focus:ring-1 focus:ring-[#B388FF] ${icono ? "pl-4" : ""} ${className}`}
      />
    </label>
  );
}

function ModalConfirmacionEdicion({
  abierto,
  valor,
  onChange,
  onCancelar,
  onConfirmar,
  cargando,
}: {
  abierto: boolean;
  valor: string;
  onChange: (valor: string) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
  cargando: boolean;
}) {
  if (!abierto) return null;

  const confirmacionValida = valor.trim().toLowerCase() === "editar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120117]/78 px-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmacion-edicion"
        className="w-full max-w-md rounded-[30px] border border-white/[0.1] bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.18),transparent_34%),linear-gradient(180deg,rgba(34,8,54,0.94),rgba(19,2,29,0.98))] p-5 shadow-[0_28px_80px_rgba(4,1,14,0.5)]"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(124,77,255,0.9),rgba(179,136,255,0.7))] p-3 text-white shadow-[0_12px_28px_rgba(38,18,78,0.32)]">
            <Icono nombre="lapiz" tamaño={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200/70">
              Confirmación
            </p>
            <h3
              id="titulo-confirmacion-edicion"
              className="mt-2 text-lg font-semibold tracking-tight text-white"
            >
              Confirmá la edición
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/62">
              Guardar estos datos puede actualizar tu carta astral, diseño humano,
              numerología y retorno solar.
            </p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/48">
            Escribí editar para continuar
          </span>
          <input
            autoFocus
            value={valor}
            onChange={(event) => onChange(event.target.value)}
            placeholder="editar"
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[#B388FF] focus:ring-1 focus:ring-[#B388FF]"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <Boton
            variante="fantasma"
            onClick={onCancelar}
            disabled={cargando}
            className="rounded-full border border-white/10 bg-transparent px-5 text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            Seguir editando
          </Boton>
          <Boton
            onClick={onConfirmar}
            cargando={cargando}
            disabled={!confirmacionValida}
            className="rounded-full bg-[#7C4DFF] px-5 text-white hover:bg-[#8F66FF]"
          >
            Confirmar cambios
          </Boton>
        </div>
      </div>
    </div>
  );
}

export default function PaginaPerfil() {
  const { usuario } = useStoreAuth();
  const cambiarContrasena = usarCambiarContrasena();
  const queryClient = useQueryClient();

  // Perfil y mutations de cálculo
  const { data: perfil, isLoading: cargandoPerfil } = usarMiPerfil();
  const actualizarPerfil = usarActualizarPerfil();
  const cartaNatal = usarCartaNatal();
  const disenoHumano = usarDisenoHumano();
  const numerologia = usarNumerologia();
  const retornoSolar = usarRetornoSolar();

  // Estado de edición de datos de nacimiento
  const [editando, setEditando] = useState(false);
  const [formNacimiento, setFormNacimiento] = useState({
    nombre: "",
    fecha_nacimiento: "",
    hora_nacimiento: "",
    ciudad_nacimiento: "",
    pais_nacimiento: "",
  });
  const [recalculando, setRecalculando] = useState(false);
  const [mensajeNacimiento, setMensajeNacimiento] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);
  const [mostrarConfirmacionEdicion, setMostrarConfirmacionEdicion] = useState(false);
  const [textoConfirmacionEdicion, setTextoConfirmacionEdicion] = useState("");

  // Estado de cambio de contraseña
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [contrasenaConfirmar, setContrasenaConfirmar] = useState("");
  const [mensaje, setMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  const esProveedorLocal = usuario?.proveedor_auth === "local";

  // Suscripción
  const { data: miSuscripcion } = usarMiSuscripcion();
  const [seccionAbierta, setSeccionAbierta] = useState<string | null>(null);

  // Eliminar cuenta
  const eliminarCuenta = usarEliminarCuenta();
  const [contrasenaEliminar, setContrasenaEliminar] = useState("");
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);

  // Oráculo ASTRA (Telegram)
  const generarCodigo = usarGenerarCodigo();
  const { data: vinculacion, isLoading: cargandoVinculacion } = usarEstadoVinculacion();
  const desvincular = usarDesvincular();
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);

  function toggleSeccion(seccion: string) {
    setSeccionAbierta(seccionAbierta === seccion ? null : seccion);
  }

  function manejarEliminarCuenta() {
    const tokenRefresco = localStorage.getItem("token_refresco") || "";
    eliminarCuenta.mutate(
      {
        contrasena: esProveedorLocal ? contrasenaEliminar : undefined,
        token_refresco: tokenRefresco,
      },
      {
        onSuccess: () => {
          const { cerrarSesion } = useStoreAuth.getState();
          cerrarSesion();
        },
      },
    );
  }

  function iniciarEdicion() {
    if (!perfil) return;
    setFormNacimiento({
      nombre: perfil.nombre ?? "",
      fecha_nacimiento: perfil.fecha_nacimiento ?? "",
      hora_nacimiento: (perfil.hora_nacimiento ?? "").slice(0, 5),
      ciudad_nacimiento: perfil.ciudad_nacimiento ?? "",
      pais_nacimiento: perfil.pais_nacimiento ?? "",
    });
    setMensajeNacimiento(null);
    setEditando(true);
  }

  function cancelarEdicion() {
    setEditando(false);
    setMensajeNacimiento(null);
    setMostrarConfirmacionEdicion(false);
    setTextoConfirmacionEdicion("");
  }

  function validarDatosNacimiento(): boolean {
    if (!formNacimiento.nombre.trim()) {
      setMensajeNacimiento({ tipo: "error", texto: "El nombre es obligatorio." });
      return false;
    }
    if (!formNacimiento.fecha_nacimiento) {
      setMensajeNacimiento({ tipo: "error", texto: "La fecha de nacimiento es obligatoria." });
      return false;
    }
    if (!formNacimiento.hora_nacimiento) {
      setMensajeNacimiento({ tipo: "error", texto: "La hora de nacimiento es obligatoria." });
      return false;
    }
    if (!formNacimiento.ciudad_nacimiento.trim()) {
      setMensajeNacimiento({ tipo: "error", texto: "La ciudad de nacimiento es obligatoria." });
      return false;
    }
    if (!formNacimiento.pais_nacimiento.trim()) {
      setMensajeNacimiento({ tipo: "error", texto: "El pais de nacimiento es obligatorio." });
      return false;
    }

    setMensajeNacimiento(null);
    return true;
  }

  function solicitarGuardarDatosNacimiento() {
    if (!perfil) return;
    if (!validarDatosNacimiento()) return;

    setTextoConfirmacionEdicion("");
    setMostrarConfirmacionEdicion(true);
  }

  async function guardarDatosNacimiento() {
    if (!perfil) return;
    if (!validarDatosNacimiento()) return;

    setMostrarConfirmacionEdicion(false);
    setTextoConfirmacionEdicion("");

    try {
      const resultado = await actualizarPerfil.mutateAsync({
        nombre: formNacimiento.nombre.trim(),
        fecha_nacimiento: formNacimiento.fecha_nacimiento,
        hora_nacimiento: formNacimiento.hora_nacimiento,
        ciudad_nacimiento: formNacimiento.ciudad_nacimiento.trim(),
        pais_nacimiento: formNacimiento.pais_nacimiento.trim(),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cambiaron = (resultado as any).datos_nacimiento_cambiaron ?? false;

      if (cambiaron) {
        setRecalculando(true);
        setMensajeNacimiento({ tipo: "exito", texto: "Datos actualizados. Recalculando tus cartas..." });

        const datosCalculo: DatosNacimiento = {
          nombre: formNacimiento.nombre.trim(),
          fecha_nacimiento: formNacimiento.fecha_nacimiento,
          hora_nacimiento: formNacimiento.hora_nacimiento,
          ciudad_nacimiento: formNacimiento.ciudad_nacimiento.trim(),
          pais_nacimiento: formNacimiento.pais_nacimiento.trim(),
        };

        const anioActual = new Date().getFullYear();

        await Promise.allSettled([
          cartaNatal.mutateAsync({ datos: datosCalculo, perfilId: perfil.id }),
          disenoHumano.mutateAsync({ datos: datosCalculo, perfilId: perfil.id }),
          numerologia.mutateAsync({
            datos: { nombre: datosCalculo.nombre, fecha_nacimiento: datosCalculo.fecha_nacimiento },
            perfilId: perfil.id,
          }),
          retornoSolar.mutateAsync({
            datosNacimiento: datosCalculo,
            anio: anioActual,
            perfilId: perfil.id,
          }),
        ]);

        queryClient.invalidateQueries({ queryKey: ["calculos", "me"] });
        setRecalculando(false);
        setMensajeNacimiento({ tipo: "exito", texto: "Datos y cartas actualizados correctamente." });
      } else {
        setMensajeNacimiento({ tipo: "exito", texto: "Datos actualizados correctamente." });
      }

      setEditando(false);
    } catch {
      setRecalculando(false);
      setMensajeNacimiento({
        tipo: "error",
        texto: "No se pudieron actualizar los datos. Intenta nuevamente.",
      });
    }
  }

  function formatearFechaNacimiento(fecha: string | undefined | null): string {
    if (!fecha) return "—";
    try {
      return new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }

  function manejarCambioContrasena() {
    if (!contrasenaActual || !contrasenaNueva || !contrasenaConfirmar) {
      setMensaje({ tipo: "error", texto: "Todos los campos son obligatorios." });
      return;
    }
    if (contrasenaNueva.length < 8) {
      setMensaje({ tipo: "error", texto: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (contrasenaNueva !== contrasenaConfirmar) {
      setMensaje({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
      return;
    }

    setMensaje(null);
    cambiarContrasena.mutate(
      { contrasena_actual: contrasenaActual, contrasena_nueva: contrasenaNueva },
      {
        onSuccess: () => {
          setMensaje({ tipo: "exito", texto: "Contrasena actualizada correctamente." });
          setContrasenaActual("");
          setContrasenaNueva("");
          setContrasenaConfirmar("");
        },
        onError: () => {
          setMensaje({
            tipo: "error",
            texto: "No se pudo cambiar la contraseña. Verificá que la contraseña actual sea correcta.",
          });
        },
      }
    );
  }

  function formatearFechaRegistro(fechaISO: string | undefined | null): string {
    if (!fechaISO) return "—";
    try {
      return new Date(fechaISO).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  }

  function obtenerEtiquetaProveedor(proveedor: string | undefined): string {
    switch (proveedor) {
      case "local":
        return "Local (email y contraseña)";
      case "google":
        return "Google";
      default:
        return proveedor ?? "—";
    }
  }

  function obtenerBadgeSuscripcion(): { texto: string; tono: "exito" | "violeta" | "error" | "neutral" } {
    const estado = usuario?.suscripcion_estado;
    switch (estado) {
      case "activa":
        return { texto: "Activa", tono: "exito" };
      case "pendiente":
        return { texto: "Pendiente", tono: "violeta" };
      case "pausada":
        return { texto: "Pausada", tono: "violeta" };
      case "cancelada":
        return { texto: "Cancelada", tono: "error" };
      default:
        return { texto: "Sin suscripción", tono: "neutral" };
    }
  }

  const badgeSuscripcion = obtenerBadgeSuscripcion();
  const planLabel = obtenerEtiquetaPlan(usuario?.plan_slug, usuario?.plan_nombre);
  const tienePlanPago = esPlanPago(usuario?.plan_slug);

  return (
    <>
      <HeaderMobile titulo="Mi Perfil" />
      <div className={FONDO_PERFIL}>
        <FondoPerfil />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div className="absolute -right-14 top-[-64px] h-44 w-44 rounded-full bg-[#B388FF]/18 blur-3xl" />
            <div className="absolute bottom-[-76px] left-8 h-36 w-36 rounded-full bg-[#7C4DFF]/14 blur-3xl" />

            <div className="relative z-10 grid gap-5 xl:grid-cols-[1.25fr_0.75fr] xl:items-start">
              <div>
                <EtiquetaPanel>Cuenta ASTRA</EtiquetaPanel>

                <div className="mt-4 flex items-start gap-4">
                  <Avatar
                    nombre={usuario?.nombre ?? "Usuario"}
                    tamaño="lg"
                    className="ring-1 ring-white/15 shadow-[0_14px_32px_rgba(22,6,48,0.35)]"
                  />

                  <div className="min-w-0">
                    <h1 className="text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl">
                      {usuario?.nombre ?? "Tu cuenta"}
                    </h1>
                    <p className="mt-2 text-sm text-white/58 break-all">
                      {usuario?.email ?? "—"}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-white/62">
                  {planLabel} · {obtenerEtiquetaProveedor(usuario?.proveedor_auth)} · Alta{" "}
                  {formatearFechaRegistro(usuario?.creado_en)}
                  {perfil ? " · Base cargada" : ""}
                </p>
              </div>

              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.05] p-5 backdrop-blur-xl">
                <EtiquetaPanel>Estado</EtiquetaPanel>

                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-white">
                      Cuenta lista para usar
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {usuario?.activo ? "Sesión activa" : "Cuenta inactiva"} ·{" "}
                      {usuario?.verificado ? "Correo verificado" : "Correo pendiente"}
                    </p>
                  </div>

                  <BadgeEstado tono={badgeSuscripcion.tono}>
                    {badgeSuscripcion.texto}
                  </BadgeEstado>
                </div>

                {miSuscripcion?.cancelacion_programada && (
                  <p className="mt-4 text-sm leading-6 text-white/64">
                    Activo hasta{" "}
                    <span className="font-medium text-white">
                      {miSuscripcion.fecha_fin
                        ? formatearFechaCorta(miSuscripcion.fecha_fin)
                        : "—"}
                    </span>
                    .
                  </p>
                )}

                <Link
                  href="/suscripcion"
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/82 transition-colors hover:bg-white/[0.14]"
                >
                  <Icono nombre="corona" tamaño={16} />
                  {tienePlanPago ? "Gestionar plan" : "Ver planes"}
                </Link>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <section className={`${SUPERFICIE_PANEL} p-5 lg:p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <EtiquetaPanel>Datos base</EtiquetaPanel>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-white">
                    Datos de nacimiento
                  </h2>
                </div>

                {!editando && perfil && (
                  <button
                    type="button"
                    onClick={iniciarEdicion}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-white/76 transition-colors hover:bg-white/[0.1] hover:text-white"
                  >
                    <Icono nombre="lapiz" tamaño={15} />
                    Editar
                  </button>
                )}
              </div>

              <div className="mt-5">
                {cargandoPerfil ? (
                  <p className="text-sm text-white/60">Cargando datos...</p>
                ) : !perfil ? (
                  <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-5">
                    <p className="text-sm leading-7 text-white/62">
                      No tenés datos de nacimiento registrados. Completá el
                      onboarding para generar tus cartas base.
                    </p>
                  </div>
                ) : editando ? (
                  <div className="space-y-4">
                    <CampoPerfil
                      etiqueta="Nombre"
                      name="nombre"
                      placeholder="Tu nombre"
                      value={formNacimiento.nombre}
                      onChange={(e) => setFormNacimiento((p) => ({ ...p, nombre: e.target.value }))}
                      icono="usuario"
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <CampoPerfil
                        etiqueta="Fecha de nacimiento"
                        type="date"
                        name="fecha_nacimiento"
                        value={formNacimiento.fecha_nacimiento}
                        onChange={(e) => setFormNacimiento((p) => ({ ...p, fecha_nacimiento: e.target.value }))}
                        icono="calendario"
                      />
                      <CampoPerfil
                        etiqueta="Hora de nacimiento"
                        type="time"
                        name="hora_nacimiento"
                        value={formNacimiento.hora_nacimiento}
                        onChange={(e) => setFormNacimiento((p) => ({ ...p, hora_nacimiento: e.target.value }))}
                        icono="reloj"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <CampoPerfil
                        etiqueta="Ciudad de nacimiento"
                        name="ciudad_nacimiento"
                        placeholder="Ej: Buenos Aires"
                        value={formNacimiento.ciudad_nacimiento}
                        onChange={(e) => setFormNacimiento((p) => ({ ...p, ciudad_nacimiento: e.target.value }))}
                        icono="ubicacion"
                      />
                      <CampoPerfil
                        etiqueta="País de nacimiento"
                        name="pais_nacimiento"
                        placeholder="Ej: Argentina"
                        value={formNacimiento.pais_nacimiento}
                        onChange={(e) => setFormNacimiento((p) => ({ ...p, pais_nacimiento: e.target.value }))}
                        icono="globo"
                      />
                    </div>

                    {mensajeNacimiento && (
                      <div
                        className={`rounded-[22px] border px-4 py-3 text-sm ${
                          mensajeNacimiento.tipo === "exito"
                            ? "border-emerald-400/20 bg-emerald-500/12 text-emerald-200"
                            : "border-rose-400/20 bg-rose-500/12 text-rose-200"
                        }`}
                        role="alert"
                      >
                        {mensajeNacimiento.texto}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-1">
                      <Boton
                        onClick={solicitarGuardarDatosNacimiento}
                        cargando={actualizarPerfil.isPending || recalculando}
                        icono={<Icono nombre="check" tamaño={16} />}
                        className="rounded-full bg-[#7C4DFF] px-5 text-white hover:bg-[#8F66FF]"
                      >
                        {recalculando ? "Recalculando cartas..." : "Guardar"}
                      </Boton>
                      <Boton
                        variante="fantasma"
                        onClick={cancelarEdicion}
                        disabled={actualizarPerfil.isPending || recalculando}
                        className="rounded-full border border-white/10 bg-transparent px-5 text-white/68 hover:bg-white/[0.06] hover:text-white"
                      >
                        Cancelar
                      </Boton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <DatoCompacto etiqueta="Nombre" valor={perfil.nombre ?? "—"} icono="usuario" />
                      <DatoCompacto
                        etiqueta="Fecha"
                        valor={formatearFechaNacimiento(perfil.fecha_nacimiento)}
                        icono="calendario"
                      />
                      <DatoCompacto
                        etiqueta="Hora"
                        valor={perfil.hora_nacimiento ? perfil.hora_nacimiento.slice(0, 5) : "—"}
                        icono="reloj"
                      />
                      <DatoCompacto etiqueta="Ciudad" valor={perfil.ciudad_nacimiento ?? "—"} icono="ubicacion" />
                      <DatoCompacto etiqueta="País" valor={perfil.pais_nacimiento ?? "—"} icono="globo" />
                      <DatoCompacto etiqueta="Zona horaria" valor={perfil.zona_horaria ?? "—"} icono="planeta" />
                    </div>

                    {mensajeNacimiento && (
                      <div
                        className={`mt-4 rounded-[22px] border px-4 py-3 text-sm ${
                          mensajeNacimiento.tipo === "exito"
                            ? "border-emerald-400/20 bg-emerald-500/12 text-emerald-200"
                            : "border-rose-400/20 bg-rose-500/12 text-rose-200"
                        }`}
                        role="alert"
                      >
                        {mensajeNacimiento.texto}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <div className="space-y-6">
              <section className={`${SUPERFICIE_PANEL} p-5`}>
                <EtiquetaPanel>Configuración</EtiquetaPanel>
                <h2 className="mt-2 text-base font-semibold tracking-tight text-white">
                  Accesos y seguridad
                </h2>

                <div className="mt-4 divide-y divide-white/[0.08]">
                  {esProveedorLocal ? (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => toggleSeccion("contrasena")}
                        className="flex w-full items-center justify-between rounded-2xl px-1 py-3 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 text-white/72">
                            <Icono nombre="candado" tamaño={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Cambiar contraseña
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/48">
                              Actualizá tu acceso local cuando lo necesites.
                            </p>
                          </div>
                        </div>
                        <Icono
                          nombre={seccionAbierta === "contrasena" ? "caretArriba" : "caretAbajo"}
                          tamaño={16}
                          className="text-white/42"
                        />
                      </button>

                      {seccionAbierta === "contrasena" && (
                        <div className="space-y-4 px-1 pb-4">
                          <CampoPerfil
                            etiqueta="Contraseña actual"
                            type="password"
                            name="contrasena_actual"
                            placeholder="Ingresá tu contraseña actual"
                            value={contrasenaActual}
                            onChange={(e) => setContrasenaActual(e.target.value)}
                            icono="candado"
                          />
                          <CampoPerfil
                            etiqueta="Nueva contraseña"
                            type="password"
                            name="contrasena_nueva"
                            placeholder="Mínimo 8 caracteres"
                            value={contrasenaNueva}
                            onChange={(e) => setContrasenaNueva(e.target.value)}
                            icono="candado"
                          />
                          <CampoPerfil
                            etiqueta="Confirmar nueva contraseña"
                            type="password"
                            name="contrasena_confirmar"
                            placeholder="Repetí la nueva contraseña"
                            value={contrasenaConfirmar}
                            onChange={(e) => setContrasenaConfirmar(e.target.value)}
                            icono="candado"
                          />

                          {mensaje && (
                            <div
                              className={`rounded-[22px] border px-4 py-3 text-sm ${
                                mensaje.tipo === "exito"
                                  ? "border-emerald-400/20 bg-emerald-500/12 text-emerald-200"
                                  : "border-rose-400/20 bg-rose-500/12 text-rose-200"
                              }`}
                              role="alert"
                            >
                              {mensaje.texto}
                            </div>
                          )}

                          <Boton
                            onClick={manejarCambioContrasena}
                            cargando={cambiarContrasena.isPending}
                            icono={<Icono nombre="check" tamaño={16} />}
                            className="rounded-full bg-[#7C4DFF] px-5 text-white hover:bg-[#8F66FF]"
                          >
                            Cambiar contraseña
                          </Boton>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 text-white/72">
                          <Icono nombre="google" tamaño={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Cuenta vinculada con Google
                          </p>
                          <p className="mt-1 text-xs leading-5 text-white/48">
                            La contraseña se gestiona desde tu cuenta de Google.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="py-1">
                    {tienePlanPago ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleSeccion("oraculo")}
                          className="flex w-full items-center justify-between rounded-2xl px-1 py-3 text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 text-white/72">
                              <Icono nombre="chat" tamaño={16} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                Oráculo ASTRA (Telegram)
                              </p>
                              <p className="mt-1 text-xs leading-5 text-white/48">
                                Vinculación directa con tu cuenta.
                              </p>
                            </div>
                          </div>
                          <Icono
                            nombre={seccionAbierta === "oraculo" ? "caretArriba" : "caretAbajo"}
                            tamaño={16}
                            className="text-white/42"
                          />
                        </button>

                        {seccionAbierta === "oraculo" && (
                          <div className="space-y-4 px-1 pb-4">
                            {cargandoVinculacion ? (
                              <p className="text-sm text-white/60">
                                Verificando vinculación...
                              </p>
                            ) : vinculacion?.vinculado ? (
                              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <BadgeEstado tono="exito">Vinculado</BadgeEstado>
                                    <p className="mt-3 text-sm text-white/72">
                                      @{vinculacion.telegram_username || "usuario"}
                                    </p>
                                  </div>
                                  <Boton
                                    variante="fantasma"
                                    tamaño="sm"
                                    onClick={() =>
                                      desvincular.mutate(undefined, {
                                        onSuccess: () => {
                                          setCodigoGenerado(null);
                                          queryClient.invalidateQueries({ queryKey: ["oraculo-vinculacion"] });
                                        },
                                      })
                                    }
                                    cargando={desvincular.isPending}
                                    className="rounded-full border border-white/10 bg-transparent px-4 text-white/68 hover:bg-white/[0.06] hover:text-white"
                                  >
                                    Desvincular Telegram
                                  </Boton>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-sm leading-6 text-white/60">
                                  Vinculá Telegram para usar el Oráculo ASTRA con
                                  tu contexto personal.
                                </p>
                                {codigoGenerado ? (
                                  <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.05] p-4 text-center">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-200/70">
                                      Código de vinculación
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-[0.28em] text-[#D8C0FF]">
                                      {codigoGenerado}
                                    </p>
                                    <p className="mt-3 text-xs leading-5 text-white/50">
                                      Enviá este código al bot @AstraOraculoBot
                                      en Telegram.
                                    </p>
                                  </div>
                                ) : (
                                  <Boton
                                    variante="primario"
                                    tamaño="sm"
                                    onClick={() =>
                                      generarCodigo.mutate(undefined, {
                                        onSuccess: (data: { codigo?: string }) => {
                                          if (data?.codigo) setCodigoGenerado(data.codigo);
                                        },
                                      })
                                    }
                                    cargando={generarCodigo.isPending}
                                    className="rounded-full bg-[#7C4DFF] px-5 text-white hover:bg-[#8F66FF]"
                                  >
                                    Generar código de vinculación
                                  </Boton>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="px-1 py-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 text-white/72">
                            <Icono nombre="chat" tamaño={16} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Oráculo ASTRA (Telegram)
                            </p>
                            <p className="mt-1 text-xs leading-5 text-white/48">
                              Disponible en Premium y Max.
                            </p>
                            <Link
                              href="/suscripcion"
                              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#D8C0FF] transition-colors hover:text-white"
                            >
                              Ver planes
                              <Icono nombre="caretDerecha" tamaño={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className={`${SUPERFICIE_PANEL} p-5`}>
                <EtiquetaPanel>Cuenta</EtiquetaPanel>
                <h2 className="mt-2 text-base font-semibold tracking-tight text-white">
                  Sesión y privacidad
                </h2>

                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      const { cerrarSesion } = useStoreAuth.getState();
                      cerrarSesion();
                    }}
                    className="flex w-full items-center justify-between rounded-[22px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 text-white/72">
                        <Icono nombre="salir" tamaño={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Cerrar sesión
                        </p>
                        <p className="mt-1 text-xs text-white/46">
                          Salís de este dispositivo.
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="rounded-[22px] border border-rose-400/18 bg-rose-500/[0.05]">
                    <button
                      type="button"
                      onClick={() => toggleSeccion("eliminar")}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-rose-400/16 bg-rose-500/[0.08] p-2.5 text-rose-200">
                          <Icono nombre="papelera" tamaño={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-rose-200">
                            Eliminar cuenta
                          </p>
                          <p className="mt-1 text-xs text-rose-100/58">
                            Acción irreversible.
                          </p>
                        </div>
                      </div>
                      <Icono
                        nombre={seccionAbierta === "eliminar" ? "caretArriba" : "caretAbajo"}
                        tamaño={16}
                        className="text-rose-100/58"
                      />
                    </button>

                    {seccionAbierta === "eliminar" && (
                      <div className="space-y-4 border-t border-rose-400/12 px-4 pb-4 pt-2">
                        {!mostrarConfirmacionEliminar ? (
                          <>
                            <p className="text-sm leading-6 text-rose-100/70">
                              Esta acción desactiva tu cuenta, cancela las
                              suscripciones activas y no se puede revertir.
                            </p>
                            <Boton
                              variante="secundario"
                              onClick={() => setMostrarConfirmacionEliminar(true)}
                              className="rounded-full border border-rose-400/18 bg-transparent px-5 text-rose-200 hover:bg-rose-500/[0.08]"
                            >
                              Eliminar mi cuenta
                            </Boton>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-white">
                              ¿Estás seguro/a que querés eliminar tu cuenta?
                            </p>

                            {esProveedorLocal && (
                              <CampoPerfil
                                etiqueta="Confirmá tu contraseña"
                                type="password"
                                placeholder="Tu contraseña actual"
                                value={contrasenaEliminar}
                                onChange={(e) => setContrasenaEliminar(e.target.value)}
                                icono="candado"
                              />
                            )}

                            {eliminarCuenta.error && (
                              <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/12 px-4 py-3">
                                <p className="text-sm text-rose-200">
                                  {eliminarCuenta.error.message}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3">
                              <Boton
                                variante="primario"
                                onClick={manejarEliminarCuenta}
                                cargando={eliminarCuenta.isPending}
                                disabled={esProveedorLocal && !contrasenaEliminar}
                                className="rounded-full bg-[#E57373] px-5 text-white hover:bg-[#ef8484]"
                              >
                                Sí, eliminar
                              </Boton>
                              <Boton
                                variante="fantasma"
                                onClick={() => {
                                  setMostrarConfirmacionEliminar(false);
                                  setContrasenaEliminar("");
                                }}
                                className="rounded-full border border-white/10 bg-transparent px-5 text-white/68 hover:bg-white/[0.06] hover:text-white"
                              >
                                No, mantener
                              </Boton>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <ModalConfirmacionEdicion
          abierto={mostrarConfirmacionEdicion}
          valor={textoConfirmacionEdicion}
          onChange={setTextoConfirmacionEdicion}
          onCancelar={() => {
            setMostrarConfirmacionEdicion(false);
            setTextoConfirmacionEdicion("");
          }}
          onConfirmar={guardarDatosNacimiento}
          cargando={actualizarPerfil.isPending || recalculando}
        />
      </div>
    </>
  );
}
