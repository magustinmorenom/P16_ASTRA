"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Avatar } from "@/componentes/ui/avatar";
import { Badge } from "@/componentes/ui/badge";
import { Boton } from "@/componentes/ui/boton";
import { Input } from "@/componentes/ui/input";
import { Icono } from "@/componentes/ui/icono";
import { Separador } from "@/componentes/ui/separador";

import {
  usarCambiarContrasena,
  usarMiPerfil,
  usarActualizarPerfil,
  usarCartaNatal,
  usarDisenoHumano,
  usarNumerologia,
  usarRetornoSolar,
} from "@/lib/hooks";
import { useStoreAuth } from "@/lib/stores/store-auth";
import type { DatosNacimiento } from "@/lib/tipos";

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

  // Estado de cambio de contraseña
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [contrasenaConfirmar, setContrasenaConfirmar] = useState("");
  const [mensaje, setMensaje] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  const esProveedorLocal = usuario?.proveedor_auth === "local";

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
  }

  async function guardarDatosNacimiento() {
    if (!perfil) return;

    // Validaciones básicas
    if (!formNacimiento.nombre.trim()) {
      setMensajeNacimiento({ tipo: "error", texto: "El nombre es obligatorio." });
      return;
    }
    if (!formNacimiento.fecha_nacimiento) {
      setMensajeNacimiento({ tipo: "error", texto: "La fecha de nacimiento es obligatoria." });
      return;
    }
    if (!formNacimiento.hora_nacimiento) {
      setMensajeNacimiento({ tipo: "error", texto: "La hora de nacimiento es obligatoria." });
      return;
    }
    if (!formNacimiento.ciudad_nacimiento.trim()) {
      setMensajeNacimiento({ tipo: "error", texto: "La ciudad de nacimiento es obligatoria." });
      return;
    }
    if (!formNacimiento.pais_nacimiento.trim()) {
      setMensajeNacimiento({ tipo: "error", texto: "El pais de nacimiento es obligatorio." });
      return;
    }

    setMensajeNacimiento(null);

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
      setMensaje({ tipo: "error", texto: "La nueva contrasena debe tener al menos 8 caracteres." });
      return;
    }
    if (contrasenaNueva !== contrasenaConfirmar) {
      setMensaje({ tipo: "error", texto: "Las contrasenas nuevas no coinciden." });
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
            texto: "No se pudo cambiar la contrasena. Verifica que la contrasena actual sea correcta.",
          });
        },
      }
    );
  }

  function formatearFechaCompleta(fechaISO: string | undefined | null): string {
    if (!fechaISO) return "—";
    try {
      return new Date(fechaISO).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
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
        return "Local (email y contrasena)";
      case "google":
        return "Google";
      default:
        return proveedor ?? "—";
    }
  }

  function obtenerBadgeSuscripcion(): { texto: string; variante: "exito" | "advertencia" | "error" | "default" | "info" } {
    const estado = usuario?.suscripcion_estado;
    switch (estado) {
      case "activa":
        return { texto: "Activa", variante: "exito" };
      case "pendiente":
        return { texto: "Pendiente", variante: "advertencia" };
      case "pausada":
        return { texto: "Pausada", variante: "advertencia" };
      case "cancelada":
        return { texto: "Cancelada", variante: "error" };
      default:
        return { texto: "Sin suscripcion", variante: "default" };
    }
  }

  const badgeSuscripcion = obtenerBadgeSuscripcion();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-texto mb-6">Mi Perfil</h1>

      {/* ================================================================ */}
      {/* Informacion del usuario                                          */}
      {/* ================================================================ */}
      <Tarjeta className="mb-6">
        <div className="flex items-center gap-4 mb-5">
          <Avatar
            nombre={usuario?.nombre ?? "Usuario"}
            tamaño="lg"
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-texto truncate">
              {usuario?.nombre ?? "—"}
            </p>
            <p className="text-sm text-texto-secundario truncate">
              {usuario?.email ?? "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Nombre
            </p>
            <p className="text-sm text-texto">{usuario?.nombre ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Email
            </p>
            <p className="text-sm text-texto">{usuario?.email ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Proveedor de autenticacion
            </p>
            <div className="flex items-center gap-2">
              <Icono
                nombre={usuario?.proveedor_auth === "google" ? "google" : "email"}
                tamaño={16}
                className="text-texto-secundario"
              />
              <p className="text-sm text-texto">
                {obtenerEtiquetaProveedor(usuario?.proveedor_auth)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Fecha de registro
            </p>
            <p className="text-sm text-texto">
              {formatearFechaRegistro(usuario?.creado_en)}
            </p>
          </div>

          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Ultimo acceso
            </p>
            <p className="text-sm text-texto">
              {formatearFechaCompleta(usuario?.ultimo_acceso)}
            </p>
          </div>

          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Estado
            </p>
            <div className="flex items-center gap-2">
              {usuario?.activo ? (
                <Badge variante="exito">Activo</Badge>
              ) : (
                <Badge variante="error">Inactivo</Badge>
              )}
              {usuario?.verificado ? (
                <Badge variante="exito">Verificado</Badge>
              ) : (
                <Badge variante="advertencia">Sin verificar</Badge>
              )}
            </div>
          </div>
        </div>
      </Tarjeta>

      {/* ================================================================ */}
      {/* Datos de Nacimiento                                              */}
      {/* ================================================================ */}
      <Tarjeta className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icono nombre="estrella" tamaño={20} className="text-acento" />
            <h2 className="text-lg font-semibold text-texto">
              Datos de Nacimiento
            </h2>
          </div>
          {!editando && perfil && (
            <Boton variante="fantasma" tamaño="sm" onClick={iniciarEdicion}>
              <Icono nombre="lapiz" tamaño={16} />
              Editar
            </Boton>
          )}
        </div>

        {cargandoPerfil ? (
          <p className="text-sm text-texto-secundario">Cargando datos...</p>
        ) : !perfil ? (
          <p className="text-sm text-texto-secundario">
            No tienes datos de nacimiento registrados. Completa el onboarding para comenzar.
          </p>
        ) : editando ? (
          <div className="space-y-4">
            <Input
              etiqueta="Nombre"
              name="nombre"
              placeholder="Tu nombre"
              value={formNacimiento.nombre}
              onChange={(e) => setFormNacimiento((p) => ({ ...p, nombre: e.target.value }))}
              icono={<Icono nombre="usuario" tamaño={16} />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                etiqueta="Fecha de nacimiento"
                type="date"
                name="fecha_nacimiento"
                value={formNacimiento.fecha_nacimiento}
                onChange={(e) => setFormNacimiento((p) => ({ ...p, fecha_nacimiento: e.target.value }))}
                icono={<Icono nombre="calendario" tamaño={16} />}
              />

              <Input
                etiqueta="Hora de nacimiento"
                type="time"
                name="hora_nacimiento"
                value={formNacimiento.hora_nacimiento}
                onChange={(e) => setFormNacimiento((p) => ({ ...p, hora_nacimiento: e.target.value }))}
                icono={<Icono nombre="reloj" tamaño={16} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                etiqueta="Ciudad de nacimiento"
                name="ciudad_nacimiento"
                placeholder="Ej: Buenos Aires"
                value={formNacimiento.ciudad_nacimiento}
                onChange={(e) => setFormNacimiento((p) => ({ ...p, ciudad_nacimiento: e.target.value }))}
                icono={<Icono nombre="ubicacion" tamaño={16} />}
              />

              <Input
                etiqueta="Pais de nacimiento"
                name="pais_nacimiento"
                placeholder="Ej: Argentina"
                value={formNacimiento.pais_nacimiento}
                onChange={(e) => setFormNacimiento((p) => ({ ...p, pais_nacimiento: e.target.value }))}
                icono={<Icono nombre="globo" tamaño={16} />}
              />
            </div>

            {mensajeNacimiento && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  mensajeNacimiento.tipo === "exito"
                    ? "bg-exito/10 text-exito border border-exito/20"
                    : "bg-error/10 text-error border border-error/20"
                }`}
                role="alert"
              >
                {mensajeNacimiento.texto}
              </div>
            )}

            <div className="flex gap-3">
              <Boton
                onClick={guardarDatosNacimiento}
                cargando={actualizarPerfil.isPending || recalculando}
                icono={<Icono nombre="check" tamaño={16} />}
              >
                {recalculando ? "Recalculando cartas..." : "Guardar"}
              </Boton>
              <Boton
                variante="fantasma"
                onClick={cancelarEdicion}
                disabled={actualizarPerfil.isPending || recalculando}
              >
                Cancelar
              </Boton>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
                  Nombre
                </p>
                <p className="text-sm text-texto">{perfil.nombre ?? "—"}</p>
              </div>

              <div>
                <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
                  Fecha de nacimiento
                </p>
                <p className="text-sm text-texto">
                  {formatearFechaNacimiento(perfil.fecha_nacimiento)}
                </p>
              </div>

              <div>
                <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
                  Hora de nacimiento
                </p>
                <p className="text-sm text-texto">
                  {perfil.hora_nacimiento ? perfil.hora_nacimiento.slice(0, 5) : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
                  Ciudad
                </p>
                <p className="text-sm text-texto">{perfil.ciudad_nacimiento ?? "—"}</p>
              </div>

              <div>
                <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
                  Pais
                </p>
                <p className="text-sm text-texto">{perfil.pais_nacimiento ?? "—"}</p>
              </div>

              {perfil.zona_horaria && (
                <div>
                  <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
                    Zona horaria
                  </p>
                  <p className="text-sm text-texto">{perfil.zona_horaria}</p>
                </div>
              )}
            </div>

            {mensajeNacimiento && (
              <div
                className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                  mensajeNacimiento.tipo === "exito"
                    ? "bg-exito/10 text-exito border border-exito/20"
                    : "bg-error/10 text-error border border-error/20"
                }`}
                role="alert"
              >
                {mensajeNacimiento.texto}
              </div>
            )}
          </>
        )}
      </Tarjeta>

      {/* ================================================================ */}
      {/* Suscripcion y plan                                               */}
      {/* ================================================================ */}
      <Tarjeta className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Icono nombre="corona" tamaño={20} className="text-acento" />
          <h2 className="text-lg font-semibold text-texto">
            Plan y Suscripcion
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Plan actual
            </p>
            <p className="text-sm text-texto font-medium">
              {usuario?.plan_nombre ?? "Gratis"}
            </p>
          </div>

          <div>
            <p className="text-xs text-texto-terciario uppercase tracking-wider mb-1">
              Estado de suscripcion
            </p>
            <Badge variante={badgeSuscripcion.variante}>
              {badgeSuscripcion.texto}
            </Badge>
          </div>
        </div>

        {usuario?.plan_slug !== "premium" && (
          <>
            <Separador className="my-4" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-texto-secundario">
                Mejora tu plan para acceder a todas las funcionalidades.
              </p>
              <a href="/suscripcion">
                <Boton variante="primario" tamaño="sm">
                  <Icono nombre="corona" tamaño={16} />
                  Mejorar plan
                </Boton>
              </a>
            </div>
          </>
        )}
      </Tarjeta>

      {/* ================================================================ */}
      {/* Cambiar contrasena (solo proveedor local)                        */}
      {/* ================================================================ */}
      {esProveedorLocal && (
        <Tarjeta className="mb-6">
          <h2 className="text-lg font-semibold text-texto mb-1">
            Cambiar Contrasena
          </h2>
          <p className="text-sm text-texto-secundario mb-5">
            Actualiza tu contrasena de acceso. La nueva contrasena debe tener
            al menos 8 caracteres.
          </p>

          <div className="space-y-4">
            <Input
              etiqueta="Contrasena actual"
              type="password"
              name="contrasena_actual"
              placeholder="Ingresa tu contrasena actual"
              value={contrasenaActual}
              onChange={(e) => setContrasenaActual(e.target.value)}
              icono={<Icono nombre="candado" tamaño={16} />}
            />

            <Separador />

            <Input
              etiqueta="Nueva contrasena"
              type="password"
              name="contrasena_nueva"
              placeholder="Minimo 8 caracteres"
              value={contrasenaNueva}
              onChange={(e) => setContrasenaNueva(e.target.value)}
              icono={<Icono nombre="candado" tamaño={16} />}
            />

            <Input
              etiqueta="Confirmar nueva contrasena"
              type="password"
              name="contrasena_confirmar"
              placeholder="Repite la nueva contrasena"
              value={contrasenaConfirmar}
              onChange={(e) => setContrasenaConfirmar(e.target.value)}
              icono={<Icono nombre="candado" tamaño={16} />}
            />

            {mensaje && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  mensaje.tipo === "exito"
                    ? "bg-exito/10 text-exito border border-exito/20"
                    : "bg-error/10 text-error border border-error/20"
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
            >
              Cambiar contrasena
            </Boton>
          </div>
        </Tarjeta>
      )}

      {/* Mensaje para usuarios con Google OAuth */}
      {!esProveedorLocal && usuario && (
        <Tarjeta>
          <div className="flex items-center gap-3">
            <Icono nombre="google" tamaño={24} className="text-texto-secundario" />
            <div>
              <h2 className="text-base font-semibold text-texto">
                Cuenta vinculada con Google
              </h2>
              <p className="text-sm text-texto-secundario">
                Tu cuenta esta vinculada con Google. La contrasena se gestiona
                desde tu cuenta de Google.
              </p>
            </div>
          </div>
        </Tarjeta>
      )}
    </div>
  );
}
