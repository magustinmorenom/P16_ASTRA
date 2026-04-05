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
import { usarTema } from "@/lib/hooks/usar-tema";
import type { PreferenciaTema } from "@/lib/stores/store-tema";

const FONDO_PERFIL =
  "relative min-h-full overflow-hidden";
const SUPERFICIE_HERO =
  "tema-superficie-hero relative overflow-hidden rounded-[24px]";
const SUPERFICIE_PANEL =
  "tema-superficie-panel rounded-[24px]";
const ESTILO_BOTON_PRIMARIO = {
  background: "var(--color-primario)",
  color: "var(--shell-hero-texto)",
} as const;
const ESTILO_BOTON_PELIGRO = {
  background: "var(--color-error)",
  color: "var(--shell-hero-texto)",
} as const;
const ESTILO_ICONO_ITEM = {
  borderColor: "var(--shell-borde)",
  background: "var(--shell-superficie-suave)",
  color: "var(--shell-texto-secundario)",
} as const;
const ESTILO_ALERTA_EXITO = {
  borderColor: "var(--shell-badge-exito-borde)",
  background: "var(--shell-badge-exito-fondo)",
  color: "var(--shell-badge-exito-texto)",
} as const;
const ESTILO_ALERTA_ERROR = {
  borderColor: "var(--shell-badge-error-borde)",
  background: "var(--shell-badge-error-fondo)",
  color: "var(--shell-badge-error-texto)",
} as const;

function FondoPerfil() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle_at_top_left, var(--shell-glow-1), transparent 26%), radial-gradient(circle_at_top_right, var(--shell-glow-2), transparent 24%), radial-gradient(circle_at_bottom_left, var(--shell-glow-1), transparent 32%)",
        }}
      />
      <div
        className="absolute right-[-80px] top-0 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-2)" }}
      />
      <div
        className="absolute left-[-40px] top-1/3 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--shell-glow-1)" }}
      />
    </>
  );
}

function EtiquetaPanel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
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
  const estilos = {
    neutral: {
      borderColor: "var(--shell-badge-neutral-borde)",
      background: "var(--shell-badge-neutral-fondo)",
      color: "var(--shell-badge-neutral-texto)",
    },
    exito: {
      borderColor: "var(--shell-badge-exito-borde)",
      background: "var(--shell-badge-exito-fondo)",
      color: "var(--shell-badge-exito-texto)",
    },
    error: {
      borderColor: "var(--shell-badge-error-borde)",
      background: "var(--shell-badge-error-fondo)",
      color: "var(--shell-badge-error-texto)",
    },
    violeta: {
      borderColor: "var(--shell-badge-violeta-borde)",
      background: "var(--shell-badge-violeta-fondo)",
      color: "var(--shell-badge-violeta-texto)",
    },
  };

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold"
      style={estilos[tono]}
    >
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
    <div
      className="rounded-[22px] border p-4"
      style={{
        borderColor: "var(--shell-borde)",
        background: "var(--shell-superficie)",
      }}
    >
      <div className="flex items-center gap-2 text-[color:var(--shell-texto-tenue)]">
        <Icono nombre={icono} tamaño={14} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
          {etiqueta}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-[color:var(--shell-texto)]">
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
      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
        {icono ? <Icono nombre={icono} tamaño={14} /> : null}
        {etiqueta}
      </span>
      <input
        {...props}
        className={`h-11 w-full rounded-2xl border px-4 text-sm outline-none transition-colors placeholder:text-[color:var(--shell-texto-tenue)] focus:ring-1 focus:ring-[var(--color-acento)] ${icono ? "pl-4" : ""} ${className}`}
        style={{
          borderColor: "var(--shell-borde)",
          background: "var(--shell-superficie)",
          color: "var(--shell-texto)",
        }}
      />
    </label>
  );
}

function SelectorTema({
  valor,
  activo,
  icono,
  etiqueta,
  onClick,
}: {
  valor: PreferenciaTema;
  activo: boolean;
  icono: "sol" | "luna" | "circuloMitad";
  etiqueta: string;
  onClick: (valor: PreferenciaTema) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(valor)}
      className="flex flex-1 items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition-colors"
      style={{
        borderColor: activo ? "var(--shell-borde-fuerte)" : "var(--shell-borde)",
        background: activo ? "var(--shell-chip)" : "var(--shell-superficie)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: "var(--shell-superficie-suave)", color: "var(--color-acento)" }}
      >
        <Icono nombre={icono} tamaño={18} peso="fill" />
      </div>
      <div>
        <p className="text-sm font-medium text-[color:var(--shell-texto)]">{etiqueta}</p>
        <p className="mt-1 text-xs text-[color:var(--shell-texto-tenue)]">
          {valor === "automatico" ? "Sigue al sistema" : `Modo ${etiqueta.toLowerCase()}`}
        </p>
      </div>
    </button>
  );
}

function IconoItemPerfil({
  nombre,
  tono = "neutral",
}: {
  nombre: string;
  tono?: "neutral" | "error";
}) {
  const style =
    tono === "error"
      ? {
          borderColor: "var(--shell-badge-error-borde)",
          background: "var(--shell-badge-error-fondo)",
          color: "var(--color-error)",
        }
      : ESTILO_ICONO_ITEM;

  return (
    <div className="rounded-2xl border p-2.5" style={style}>
      <Icono nombre={nombre} tamaño={16} />
    </div>
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md"
      style={{ background: "var(--shell-overlay)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmacion-edicion"
        className="tema-superficie-panel w-full max-w-md rounded-[30px] p-5"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-[22px] border border-shell-borde tema-gradiente-acento p-3 text-white shadow-[var(--shell-sombra-suave)]">
            <Icono nombre="lapiz" tamaño={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-acento)]">
              Confirmación
            </p>
            <h3
              id="titulo-confirmacion-edicion"
              className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--shell-texto)]"
            >
              Confirmá la edición
            </h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
              Guardar estos datos puede actualizar tu carta astral, diseño humano,
              numerología y retorno solar.
            </p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--shell-texto-tenue)]">
            Escribí editar para continuar
          </span>
          <input
            autoFocus
            value={valor}
            onChange={(event) => onChange(event.target.value)}
            placeholder="editar"
            className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition-colors placeholder:text-[color:var(--shell-texto-tenue)] focus:ring-1 focus:ring-[var(--color-acento)]"
            style={{
              borderColor: "var(--shell-borde)",
              background: "var(--shell-superficie)",
              color: "var(--shell-texto)",
            }}
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <Boton
            variante="fantasma"
            onClick={onCancelar}
            disabled={cargando}
            className="rounded-full border px-5"
            style={{
              borderColor: "var(--shell-borde)",
              color: "var(--shell-texto-secundario)",
            }}
          >
            Seguir editando
          </Boton>
          <Boton
            variante="primario"
            onClick={onConfirmar}
            cargando={cargando}
            disabled={!confirmacionValida}
            className="rounded-full px-5"
            style={ESTILO_BOTON_PRIMARIO}
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
  const { preferencia, setPreferencia } = usarTema();
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
      <div className={FONDO_PERFIL} style={{ background: "var(--shell-fondo)" }}>
        <FondoPerfil />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 lg:px-6 lg:py-6">
          <section className={`${SUPERFICIE_HERO} p-5 sm:p-6 lg:p-7`}>
            <div
              className="absolute -right-14 top-[-64px] h-44 w-44 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-2)" }}
            />
            <div
              className="absolute bottom-[-76px] left-8 h-36 w-36 rounded-full blur-3xl"
              style={{ background: "var(--shell-glow-1)" }}
            />

            <div className="relative z-10 grid gap-5 xl:grid-cols-[1.25fr_0.75fr] xl:items-start">
              <div>
                <EtiquetaPanel>Cuenta ASTRA</EtiquetaPanel>

                <div className="mt-4 flex items-start gap-4">
                  <Avatar
                    nombre={usuario?.nombre ?? "Usuario"}
                    tamaño="lg"
                    className="ring-1 ring-shell-borde shadow-[var(--shell-sombra-fuerte)]"
                  />

                  <div className="min-w-0">
                    <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--shell-texto-inverso)] sm:text-xl">
                      {usuario?.nombre ?? "Tu cuenta"}
                    </h1>
                    <p className="tema-hero-secundario mt-2 break-all text-sm">
                      {usuario?.email ?? "—"}
                    </p>
                  </div>
                </div>

                <p className="tema-hero-secundario mt-5 text-sm leading-6">
                  {planLabel} · {obtenerEtiquetaProveedor(usuario?.proveedor_auth)} · Alta{" "}
                  {formatearFechaRegistro(usuario?.creado_en)}
                  {perfil ? " · Base cargada" : ""}
                </p>
              </div>

              <div
                className="rounded-[22px] border p-5 backdrop-blur-xl"
                style={{
                  borderColor: "var(--shell-borde)",
                  background: "var(--shell-superficie)",
                }}
              >
                <EtiquetaPanel>Estado</EtiquetaPanel>

                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-[color:var(--shell-texto)]">
                      Cuenta lista para usar
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                      {usuario?.activo ? "Sesión activa" : "Cuenta inactiva"} ·{" "}
                      {usuario?.verificado ? "Correo verificado" : "Correo pendiente"}
                    </p>
                  </div>

                  <BadgeEstado tono={badgeSuscripcion.tono}>
                    {badgeSuscripcion.texto}
                  </BadgeEstado>
                </div>

                {miSuscripcion?.cancelacion_programada && (
                  <p className="mt-4 text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                    Activo hasta{" "}
                    <span className="font-medium text-[color:var(--shell-texto)]">
                      {miSuscripcion.fecha_fin
                        ? formatearFechaCorta(miSuscripcion.fecha_fin)
                        : "—"}
                    </span>
                    .
                  </p>
                )}

                <Link
                  href="/suscripcion"
                  className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: "var(--shell-borde)",
                    background: "var(--shell-superficie)",
                    color: "var(--shell-texto)",
                  }}
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
                  <h2 className="mt-2 text-lg font-semibold tracking-tight text-[color:var(--shell-texto)]">
                    Datos de nacimiento
                  </h2>
                </div>

                {!editando && perfil && (
                  <button
                    type="button"
                    onClick={iniciarEdicion}
                    className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors"
                    style={{
                      borderColor: "var(--shell-borde)",
                      background: "var(--shell-superficie)",
                      color: "var(--shell-texto-secundario)",
                    }}
                  >
                    <Icono nombre="lapiz" tamaño={15} />
                    Editar
                  </button>
                )}
              </div>

              <div className="mt-5">
                {cargandoPerfil ? (
                  <p className="text-sm text-[color:var(--shell-texto-secundario)]">Cargando datos...</p>
                ) : !perfil ? (
                  <div
                    className="rounded-[24px] border p-5"
                    style={{
                      borderColor: "var(--shell-borde)",
                      background: "var(--shell-superficie)",
                    }}
                  >
                    <p className="text-sm leading-7 text-[color:var(--shell-texto-secundario)]">
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
                        className="rounded-[22px] border px-4 py-3 text-sm"
                        style={mensajeNacimiento.tipo === "exito" ? ESTILO_ALERTA_EXITO : ESTILO_ALERTA_ERROR}
                        role="alert"
                      >
                        {mensajeNacimiento.texto}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-1">
                      <Boton
                        variante="primario"
                        onClick={solicitarGuardarDatosNacimiento}
                        cargando={actualizarPerfil.isPending || recalculando}
                        icono={<Icono nombre="check" tamaño={16} />}
                        className="rounded-full px-5"
                        style={ESTILO_BOTON_PRIMARIO}
                      >
                        {recalculando ? "Recalculando cartas..." : "Guardar"}
                      </Boton>
                      <Boton
                        variante="fantasma"
                        onClick={cancelarEdicion}
                        disabled={actualizarPerfil.isPending || recalculando}
                        className="rounded-full border px-5"
                        style={{
                          borderColor: "var(--shell-borde)",
                          color: "var(--shell-texto-secundario)",
                        }}
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
                        className="mt-4 rounded-[22px] border px-4 py-3 text-sm"
                        style={mensajeNacimiento.tipo === "exito" ? ESTILO_ALERTA_EXITO : ESTILO_ALERTA_ERROR}
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
                <h2 className="mt-2 text-base font-semibold tracking-tight text-[color:var(--shell-texto)]">
                  Accesos y seguridad
                </h2>

                <div className="mt-5">
                  <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                    Apariencia
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
                    Elegí cómo querés ver ASTRA en esta web.
                  </p>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <SelectorTema
                      valor="claro"
                      activo={preferencia === "claro"}
                      icono="sol"
                      etiqueta="Claro"
                      onClick={setPreferencia}
                    />
                    <SelectorTema
                      valor="oscuro"
                      activo={preferencia === "oscuro"}
                      icono="luna"
                      etiqueta="Oscuro"
                      onClick={setPreferencia}
                    />
                    <SelectorTema
                      valor="automatico"
                      activo={preferencia === "automatico"}
                      icono="circuloMitad"
                      etiqueta="Automático"
                      onClick={setPreferencia}
                    />
                  </div>
                </div>

                <div className="mt-4 divide-y" style={{ borderColor: "var(--shell-borde)" }}>
                  {esProveedorLocal ? (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => toggleSeccion("contrasena")}
                        className="flex w-full items-center justify-between rounded-2xl px-1 py-3 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <IconoItemPerfil nombre="candado" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                              Cambiar contraseña
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
                              Actualizá tu acceso local cuando lo necesites.
                            </p>
                          </div>
                        </div>
                        <Icono
                          nombre={seccionAbierta === "contrasena" ? "caretArriba" : "caretAbajo"}
                          tamaño={16}
                          className="text-[color:var(--shell-texto-tenue)]"
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
                              className="rounded-[22px] border px-4 py-3 text-sm"
                              style={mensaje.tipo === "exito" ? ESTILO_ALERTA_EXITO : ESTILO_ALERTA_ERROR}
                              role="alert"
                            >
                              {mensaje.texto}
                            </div>
                          )}

                          <Boton
                            variante="primario"
                            onClick={manejarCambioContrasena}
                            cargando={cambiarContrasena.isPending}
                            icono={<Icono nombre="check" tamaño={16} />}
                            className="rounded-full px-5"
                            style={ESTILO_BOTON_PRIMARIO}
                          >
                            Cambiar contraseña
                          </Boton>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="flex items-start gap-3">
                        <IconoItemPerfil nombre="google" />
                        <div>
                          <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                            Cuenta vinculada con Google
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
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
                            <div className="mt-0.5">
                              <IconoItemPerfil nombre="chat" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                                Oráculo ASTRA (Telegram)
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
                                Vinculación directa con tu cuenta.
                              </p>
                            </div>
                          </div>
                          <Icono
                            nombre={seccionAbierta === "oraculo" ? "caretArriba" : "caretAbajo"}
                            tamaño={16}
                            className="text-[color:var(--shell-texto-tenue)]"
                          />
                        </button>

                        {seccionAbierta === "oraculo" && (
                          <div className="space-y-4 px-1 pb-4">
                            {cargandoVinculacion ? (
                              <p className="text-sm text-[color:var(--shell-texto-secundario)]">
                                Verificando vinculación...
                              </p>
                            ) : vinculacion?.vinculado ? (
                              <div
                                className="rounded-[22px] border p-4"
                                style={{
                                  borderColor: "var(--shell-borde)",
                                  background: "var(--shell-superficie)",
                                }}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <BadgeEstado tono="exito">Vinculado</BadgeEstado>
                                    <p className="mt-3 text-sm text-[color:var(--shell-texto-secundario)]">
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
                                    className="rounded-full border px-4"
                                    style={{
                                      borderColor: "var(--shell-borde)",
                                      color: "var(--shell-texto-secundario)",
                                    }}
                                  >
                                    Desvincular Telegram
                                  </Boton>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-sm leading-6 text-[color:var(--shell-texto-secundario)]">
                                  Vinculá Telegram para usar el Oráculo ASTRA con
                                  tu contexto personal.
                                </p>
                                {codigoGenerado ? (
                                  <div
                                    className="rounded-[22px] border p-4 text-center"
                                    style={{
                                      borderColor: "var(--shell-borde)",
                                      background: "var(--shell-superficie)",
                                    }}
                                  >
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-acento)]">
                                      Código de vinculación
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-[0.28em] text-[color:var(--color-acento)]">
                                      {codigoGenerado}
                                    </p>
                                    <p className="mt-3 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
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
                                    className="rounded-full px-5"
                                    style={ESTILO_BOTON_PRIMARIO}
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
                          <IconoItemPerfil nombre="chat" />
                          <div>
                            <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                              Oráculo ASTRA (Telegram)
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[color:var(--shell-texto-tenue)]">
                              Disponible en Premium y Max.
                            </p>
                            <Link
                              href="/suscripcion"
                              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-acento)] transition-colors hover:opacity-80"
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
                <h2 className="mt-2 text-base font-semibold tracking-tight text-[color:var(--shell-texto)]">
                  Sesión y privacidad
                </h2>

                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      const { cerrarSesion } = useStoreAuth.getState();
                      cerrarSesion();
                    }}
                    className="flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition-colors"
                    style={{
                      borderColor: "var(--shell-borde)",
                      background: "var(--shell-superficie)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <IconoItemPerfil nombre="salir" />
                      <div>
                        <p className="text-sm font-medium text-[color:var(--shell-texto)]">
                          Cerrar sesión
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--shell-texto-tenue)]">
                          Salís de este dispositivo.
                        </p>
                      </div>
                    </div>
                  </button>

                  <div
                    className="rounded-[22px] border"
                    style={{
                      borderColor: "var(--shell-badge-error-borde)",
                      background: "var(--shell-badge-error-fondo)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSeccion("eliminar")}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <IconoItemPerfil nombre="papelera" tono="error" />
                        <div>
                          <p className="text-sm font-medium text-[color:var(--color-error)]">
                            Eliminar cuenta
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--shell-badge-error-texto)]/80">
                            Acción irreversible.
                          </p>
                        </div>
                      </div>
                      <Icono
                        nombre={seccionAbierta === "eliminar" ? "caretArriba" : "caretAbajo"}
                        tamaño={16}
                        className="text-[color:var(--shell-badge-error-texto)]/70"
                      />
                    </button>

                    {seccionAbierta === "eliminar" && (
                      <div
                        className="space-y-4 border-t px-4 pb-4 pt-2"
                        style={{ borderColor: "var(--shell-badge-error-borde)" }}
                      >
                        {!mostrarConfirmacionEliminar ? (
                          <>
                            <p className="text-sm leading-6 text-[color:var(--shell-badge-error-texto)]/80">
                              Esta acción desactiva tu cuenta, cancela las
                              suscripciones activas y no se puede revertir.
                            </p>
                            <Boton
                              variante="secundario"
                              onClick={() => setMostrarConfirmacionEliminar(true)}
                              className="rounded-full border bg-transparent px-5 hover:bg-[var(--shell-badge-error-fondo)]"
                              style={{
                                borderColor: "var(--shell-badge-error-borde)",
                                color: "var(--shell-badge-error-texto)",
                              }}
                            >
                              Eliminar mi cuenta
                            </Boton>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-[color:var(--shell-texto)]">
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
                              <div className="rounded-[22px] border px-4 py-3" style={ESTILO_ALERTA_ERROR}>
                                <p className="text-sm text-[color:var(--shell-badge-error-texto)]">
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
                                className="rounded-full px-5"
                                style={ESTILO_BOTON_PELIGRO}
                              >
                                Sí, eliminar
                              </Boton>
                              <Boton
                                variante="fantasma"
                                onClick={() => {
                                  setMostrarConfirmacionEliminar(false);
                                  setContrasenaEliminar("");
                                }}
                                className="rounded-full border px-5"
                                style={{
                                  borderColor: "var(--shell-borde)",
                                  color: "var(--shell-texto-secundario)",
                                }}
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
