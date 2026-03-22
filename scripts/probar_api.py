#!/usr/bin/env python3
"""
CosmicEngine — Consola interactiva de pruebas
Requiere: pip install rich httpx
"""

import sys
import time

import httpx
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, IntPrompt
from rich.text import Text
from rich import box

# ── Configuración ──
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"
TIMEOUT = 30.0

consola = Console()

# ── Glifos Unicode ──
GLIFOS_PLANETAS = {
    "Sol": "☉", "Luna": "☽", "Mercurio": "☿", "Venus": "♀",
    "Marte": "♂", "Júpiter": "♃", "Saturno": "♄", "Urano": "♅",
    "Neptuno": "♆", "Plutón": "♇", "Nodo Norte": "☊", "Nodo Sur": "☋",
    "Tierra": "⊕", "Quirón": "⚷",
}

GLIFOS_SIGNOS = {
    "Aries": "♈", "Tauro": "♉", "Géminis": "♊", "Cáncer": "♋",
    "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Escorpio": "♏",
    "Sagitario": "♐", "Capricornio": "♑", "Acuario": "♒", "Piscis": "♓",
}

GLIFOS_ASPECTOS = {
    "conjunción": "☌", "oposición": "☍", "trígono": "△",
    "cuadratura": "□", "sextil": "⚹", "quincuncio": "⚻",
}

# ── Estado global para defaults ──
ultimos_datos = {
    "nombre": "",
    "fecha": "",
    "hora": "",
    "ciudad": "",
    "pais": "",
}


# ─────────────────────────────────────────────
# Utilidades
# ─────────────────────────────────────────────

def pedir_dato(etiqueta: str, clave: str, obligatorio: bool = True) -> str:
    """Pide un dato al usuario con default del último valor usado."""
    default = ultimos_datos.get(clave, "")
    sufijo = f" [dim]\\[{default}][/dim]" if default else ""

    while True:
        valor = Prompt.ask(f"  {etiqueta}{sufijo}") or default
        if valor or not obligatorio:
            if valor:
                ultimos_datos[clave] = valor
            return valor
        consola.print("  [red]Este campo es obligatorio[/red]")


def pedir_datos_nacimiento(con_sistema_casas: bool = True) -> dict:
    """Pide datos de nacimiento interactivamente."""
    nombre = pedir_dato("Nombre", "nombre")
    fecha = pedir_dato("Fecha de nacimiento (YYYY-MM-DD)", "fecha")
    hora = pedir_dato("Hora de nacimiento (HH:MM)", "hora")
    ciudad = pedir_dato("Ciudad", "ciudad")
    pais = pedir_dato("País", "pais")

    datos = {
        "nombre": nombre,
        "fecha_nacimiento": fecha,
        "hora_nacimiento": hora,
        "ciudad_nacimiento": ciudad,
        "pais_nacimiento": pais,
    }

    if con_sistema_casas:
        sistema = Prompt.ask(
            "  Sistema de casas", default="placidus"
        )
        datos["sistema_casas"] = sistema

    return datos


def llamar_api(metodo: str, ruta: str, json_data: dict | None = None) -> tuple:
    """Llama a la API y retorna (datos, tiempo_ms, desde_cache, error)."""
    url = f"{API_URL}{ruta}" if ruta.startswith("/") else f"{BASE_URL}{ruta}"

    consola.print("\n  [cyan]⏳ Calculando...[/cyan]", end="")

    inicio = time.time()
    try:
        with httpx.Client(timeout=TIMEOUT) as cliente:
            if metodo == "GET":
                resp = cliente.get(url)
            else:
                resp = cliente.post(url, json=json_data)

        tiempo = time.time() - inicio
        cuerpo = resp.json()

        if resp.status_code >= 400 or not cuerpo.get("exito", False):
            error_msg = cuerpo.get("detalle") or cuerpo.get("error") or resp.text
            consola.print(f"\r  [red]✗ Error ({resp.status_code}): {error_msg}[/red]")
            return None, tiempo, False, error_msg

        desde_cache = cuerpo.get("cache", False)
        cache_txt = "[green]Sí[/green]" if desde_cache else "[yellow]No[/yellow]"
        consola.print(
            f"\r  [green]✓[/green] Respuesta en [bold]{tiempo:.2f}s[/bold]  "
            f"(cache: {cache_txt})"
        )
        return cuerpo.get("datos", cuerpo), tiempo, desde_cache, None

    except httpx.ConnectError:
        tiempo = time.time() - inicio
        consola.print(
            "\r  [red]✗ No se pudo conectar al servidor.[/red]\n"
            "    Asegurate de que esté corriendo: ./scripts/levantar.sh"
        )
        return None, tiempo, False, "Conexión rechazada"
    except httpx.TimeoutException:
        tiempo = time.time() - inicio
        consola.print(f"\r  [red]✗ Timeout después de {TIMEOUT}s[/red]")
        return None, tiempo, False, "Timeout"
    except Exception as e:
        tiempo = time.time() - inicio
        consola.print(f"\r  [red]✗ Error inesperado: {e}[/red]")
        return None, tiempo, False, str(e)


def grado_a_texto(grado: float) -> str:
    """Convierte grado decimal a formato DD°MM'."""
    grados_int = int(grado)
    minutos = int((grado - grados_int) * 60)
    return f"{grados_int:02d}°{minutos:02d}'"


def preguntar_repetir() -> bool:
    """Pregunta si repetir con los mismos datos."""
    resp = Prompt.ask("\n  ¿Repetir con los mismos datos?", choices=["s", "n"], default="n")
    return resp == "s"


# ─────────────────────────────────────────────
# Formateadores
# ─────────────────────────────────────────────

def formatear_planetas(planetas: list):
    """Muestra tabla de posiciones planetarias."""
    tabla = Table(
        title="Posiciones Planetarias",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    tabla.add_column("", justify="center", width=3)
    tabla.add_column("Planeta", style="bold")
    tabla.add_column("Posición", justify="right")
    tabla.add_column("Signo", justify="center")
    tabla.add_column("Casa", justify="center")
    tabla.add_column("Vel.", justify="right")
    tabla.add_column("Dig.", justify="center")

    for p in planetas:
        nombre = p["nombre"]
        glifo = GLIFOS_PLANETAS.get(nombre, "·")
        signo = p.get("signo", "")
        glifo_signo = GLIFOS_SIGNOS.get(signo, "")
        retro = " ℞" if p.get("retrogrado") else ""
        casa = str(p["casa"]) if "casa" in p else "—"
        grado = grado_a_texto(p.get("grado_en_signo", 0))
        vel = f"{p.get('velocidad', 0):.3f}"
        dig = p.get("dignidad") or "—"

        tabla.add_row(
            glifo, f"{nombre}{retro}", grado,
            f"{glifo_signo} {signo}", casa, vel, dig
        )

    consola.print(tabla)


def formatear_casas(casas: list):
    """Muestra tabla de cúspides de casas."""
    tabla = Table(
        title="Casas",
        box=box.SIMPLE,
        show_header=True,
        header_style="bold",
    )
    tabla.add_column("Casa", justify="center")
    tabla.add_column("Signo", justify="center")
    tabla.add_column("Grado", justify="right")

    for c in casas:
        signo = c.get("signo", "")
        glifo = GLIFOS_SIGNOS.get(signo, "")
        grado = grado_a_texto(c.get("grado_en_signo", 0))
        tabla.add_row(str(c["numero"]), f"{glifo} {signo}", grado)

    consola.print(tabla)


def formatear_aspectos(aspectos: list):
    """Muestra tabla de aspectos."""
    if not aspectos:
        consola.print("  [dim]Sin aspectos[/dim]")
        return

    tabla = Table(
        title="Aspectos",
        box=box.SIMPLE,
        show_header=True,
        header_style="bold",
    )
    tabla.add_column("Planeta 1", justify="center")
    tabla.add_column("Aspecto", justify="center")
    tabla.add_column("Planeta 2", justify="center")
    tabla.add_column("Orbe", justify="right")
    tabla.add_column("Tipo", justify="center")

    for a in aspectos:
        p1 = GLIFOS_PLANETAS.get(a["planeta1"], "") + " " + a["planeta1"]
        p2 = GLIFOS_PLANETAS.get(a["planeta2"], "") + " " + a["planeta2"]
        tipo = a.get("tipo", "")
        glifo_asp = GLIFOS_ASPECTOS.get(tipo, "·")
        orbe = f"{a.get('orbe', 0):.2f}°"
        aplicativo = "Aplicativo" if a.get("aplicativo") else "Separativo"

        tabla.add_row(p1, f"{glifo_asp} {tipo}", p2, orbe, aplicativo)

    consola.print(tabla)


def formatear_hd(datos: dict):
    """Muestra panel de Diseño Humano."""
    # Info principal
    info = Table(box=box.SIMPLE, show_header=False, pad_edge=False)
    info.add_column("Campo", style="bold cyan", width=22)
    info.add_column("Valor")

    info.add_row("Tipo", f"[bold]{datos.get('tipo', '—')}[/bold]")
    info.add_row("Autoridad", datos.get("autoridad", "—"))
    info.add_row("Perfil", datos.get("perfil", "—"))
    info.add_row("Definición", datos.get("definicion", "—"))

    cruz = datos.get("cruz_encarnacion", {})
    puertas_cruz = cruz.get("puertas", [])
    info.add_row("Cruz de Encarnación", " - ".join(str(p) for p in puertas_cruz if p))

    consola.print(Panel(info, title="Diseño Humano", border_style="magenta"))

    # Centros
    centros = datos.get("centros", {})
    if centros:
        tabla_centros = Table(
            title="Centros",
            box=box.SIMPLE,
            show_header=True,
            header_style="bold",
        )
        tabla_centros.add_column("Centro")
        tabla_centros.add_column("Estado", justify="center")

        for centro, estado in centros.items():
            nombre_centro = centro.replace("_", " ").title()
            if estado == "definido":
                estilo = "[bold green]■ Definido[/bold green]"
            else:
                estilo = "[dim]□ Indefinido[/dim]"
            tabla_centros.add_row(nombre_centro, estilo)

        consola.print(tabla_centros)

    # Canales
    canales = datos.get("canales", [])
    if canales:
        tabla_canales = Table(
            title="Canales Activos",
            box=box.SIMPLE,
            show_header=True,
            header_style="bold",
        )
        tabla_canales.add_column("Puertas", justify="center")
        tabla_canales.add_column("Nombre")
        tabla_canales.add_column("Centros")

        for canal in canales:
            puertas = "-".join(str(p) for p in canal.get("puertas", []))
            tabla_canales.add_row(
                puertas,
                canal.get("nombre", ""),
                " ↔ ".join(canal.get("centros", [])),
            )

        consola.print(tabla_canales)

    # Activaciones
    for tipo_act, etiqueta in [
        ("activaciones_conscientes", "Activaciones Conscientes (Personalidad)"),
        ("activaciones_inconscientes", "Activaciones Inconscientes (Diseño)"),
    ]:
        acts = datos.get(tipo_act, [])
        if acts:
            tabla = Table(title=etiqueta, box=box.SIMPLE, header_style="bold")
            tabla.add_column("Planeta")
            tabla.add_column("Puerta", justify="center")
            tabla.add_column("Línea", justify="center")
            tabla.add_column("Color", justify="center")
            tabla.add_column("Longitud", justify="right")

            for a in acts:
                planeta = a.get("planeta", "")
                glifo = GLIFOS_PLANETAS.get(planeta, "")
                tabla.add_row(
                    f"{glifo} {planeta}",
                    str(a.get("puerta", "")),
                    str(a.get("linea", "")),
                    str(a.get("color", "")),
                    f"{a.get('longitud', 0):.2f}°",
                )

            consola.print(tabla)


def formatear_numerologia(datos: dict):
    """Muestra grid numerológico."""
    campos = [
        ("Camino de Vida", "camino_de_vida"),
        ("Expresión", "expresion"),
        ("Impulso del Alma", "impulso_del_alma"),
        ("Personalidad", "personalidad"),
        ("Número de Nacimiento", "numero_nacimiento"),
        ("Año Personal", "anio_personal"),
    ]

    tabla = Table(
        title=f"Carta Numerológica ({datos.get('sistema', 'pitagórico').title()})",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    tabla.add_column("Aspecto", style="bold", width=22)
    tabla.add_column("Número", justify="center", width=8)
    tabla.add_column("Descripción", width=50)

    for etiqueta, clave in campos:
        valor = datos.get(clave, {})
        if isinstance(valor, dict):
            numero = str(valor.get("numero", "—"))
            desc = valor.get("descripcion", "")
            # Truncar descripción larga
            if len(desc) > 50:
                desc = desc[:47] + "..."
            tabla.add_row(etiqueta, f"[bold]{numero}[/bold]", desc)

    consola.print(tabla)

    maestros = datos.get("numeros_maestros_presentes", [])
    if maestros:
        consola.print(
            f"  [bold magenta]Números maestros presentes:[/bold magenta] "
            f"{', '.join(str(n) for n in maestros)}"
        )


def formatear_retorno_solar(datos: dict):
    """Muestra datos de revolución solar."""
    info = Table(box=box.SIMPLE, show_header=False)
    info.add_column("Campo", style="bold cyan", width=25)
    info.add_column("Valor")

    info.add_row("Año", str(datos.get("anio", "")))

    fecha_ret = datos.get("fecha_retorno", {})
    if fecha_ret:
        hora_dec = fecha_ret.get("hora_decimal", 0)
        horas = int(hora_dec)
        minutos = int((hora_dec - horas) * 60)
        fecha_str = (
            f"{fecha_ret.get('dia', 0):02d}/"
            f"{fecha_ret.get('mes', 0):02d}/"
            f"{fecha_ret.get('anio', 0)} "
            f"{horas:02d}:{minutos:02d}"
        )
        info.add_row("Momento del Retorno", fecha_str)

    info.add_row("JD Retorno", f"{datos.get('dia_juliano_retorno', 0):.6f}")
    info.add_row("Sol Natal", f"{datos.get('longitud_sol_natal', 0):.4f}°")
    info.add_row("Sol Retorno", f"{datos.get('longitud_sol_retorno', 0):.4f}°")
    info.add_row("Error", f"{datos.get('error_grados', 0):.6f}°")

    consola.print(Panel(info, title="Revolución Solar", border_style="yellow"))

    # Carta del retorno
    carta = datos.get("carta_retorno", {})
    if carta:
        planetas = carta.get("planetas", [])
        if planetas:
            consola.print("\n  [bold]Carta del Retorno:[/bold]")
            formatear_planetas(planetas)

        aspectos = carta.get("aspectos", [])
        if aspectos:
            formatear_aspectos(aspectos)

    # Aspectos natal-retorno
    asp_cruzados = datos.get("aspectos_natal_retorno", [])
    if asp_cruzados:
        tabla = Table(
            title="Aspectos Natal ↔ Retorno",
            box=box.SIMPLE,
            header_style="bold",
        )
        tabla.add_column("Planeta Retorno")
        tabla.add_column("Aspecto", justify="center")
        tabla.add_column("Planeta Natal")
        tabla.add_column("Orbe", justify="right")

        for a in asp_cruzados:
            p_ret = a.get("planeta_retorno", a.get("planeta1", ""))
            p_nat = a.get("planeta_natal", a.get("planeta2", ""))
            tipo = a.get("tipo", "")
            glifo = GLIFOS_ASPECTOS.get(tipo, "·")
            orbe = f"{a.get('orbe', 0):.2f}°"
            tabla.add_row(p_ret, f"{glifo} {tipo}", p_nat, orbe)

        consola.print(tabla)


def formatear_transitos(datos: dict):
    """Muestra posiciones de tránsitos actuales."""
    consola.print(f"  [dim]Fecha UTC: {datos.get('fecha_utc', '—')}[/dim]")
    consola.print(f"  [dim]JD: {datos.get('dia_juliano', 0):.6f}[/dim]\n")

    planetas = datos.get("planetas", [])
    if planetas:
        tabla = Table(
            title="Posiciones Planetarias Actuales",
            box=box.ROUNDED,
            show_header=True,
            header_style="bold cyan",
        )
        tabla.add_column("", justify="center", width=3)
        tabla.add_column("Planeta", style="bold")
        tabla.add_column("Posición", justify="right")
        tabla.add_column("Signo", justify="center")
        tabla.add_column("Vel.", justify="right")

        for p in planetas:
            nombre = p["nombre"]
            glifo = GLIFOS_PLANETAS.get(nombre, "·")
            signo = p.get("signo", "")
            glifo_signo = GLIFOS_SIGNOS.get(signo, "")
            retro = " [red]℞[/red]" if p.get("retrogrado") else ""
            grado = grado_a_texto(p.get("grado_en_signo", 0))
            vel = f"{p.get('velocidad', 0):.3f}"

            tabla.add_row(glifo, f"{nombre}{retro}", grado, f"{glifo_signo} {signo}", vel)

        consola.print(tabla)


# ─────────────────────────────────────────────
# Opciones del menú
# ─────────────────────────────────────────────

def probar_natal():
    """Probar POST /natal."""
    consola.print("\n[bold cyan]─── Carta Natal ───[/bold cyan]\n")

    while True:
        datos = pedir_datos_nacimiento(con_sistema_casas=True)
        resultado, _, _, error = llamar_api("POST", "/natal", datos)

        if resultado and not error:
            consola.print()
            # Encabezado
            panel_info = (
                f"[bold]{resultado.get('nombre', '')}[/bold]\n"
                f"Fecha: {resultado.get('fecha_nacimiento', '')} "
                f"{resultado.get('hora_nacimiento', '')}\n"
                f"Ubicación: {resultado.get('ciudad', '')}, "
                f"{resultado.get('pais', '')}\n"
                f"Zona horaria: {resultado.get('zona_horaria', '')}\n"
                f"Día Juliano: {resultado.get('dia_juliano', 0):.6f}"
            )
            consola.print(Panel(panel_info, title="Datos", border_style="blue"))

            formatear_planetas(resultado.get("planetas", []))
            formatear_casas(resultado.get("casas", []))
            formatear_aspectos(resultado.get("aspectos", []))

        if not preguntar_repetir():
            break


def probar_diseno_humano():
    """Probar POST /human-design."""
    consola.print("\n[bold magenta]─── Diseño Humano ───[/bold magenta]\n")

    while True:
        datos = pedir_datos_nacimiento(con_sistema_casas=False)
        resultado, _, _, error = llamar_api("POST", "/human-design", datos)

        if resultado and not error:
            consola.print()
            panel_info = (
                f"[bold]{resultado.get('nombre', '')}[/bold]\n"
                f"Fecha: {resultado.get('fecha_nacimiento', '')} "
                f"{resultado.get('hora_nacimiento', '')}\n"
                f"Ubicación: {resultado.get('ciudad', '')}, "
                f"{resultado.get('pais', '')}"
            )
            consola.print(Panel(panel_info, title="Datos", border_style="magenta"))
            formatear_hd(resultado)

        if not preguntar_repetir():
            break


def probar_numerologia():
    """Probar POST /numerology."""
    consola.print("\n[bold green]─── Numerología ───[/bold green]\n")

    while True:
        nombre = pedir_dato("Nombre completo", "nombre")
        fecha = pedir_dato("Fecha de nacimiento (YYYY-MM-DD)", "fecha")
        sistema = Prompt.ask("  Sistema", choices=["pitagorico", "caldeo"], default="pitagorico")

        datos = {
            "nombre": nombre,
            "fecha_nacimiento": fecha,
            "sistema": sistema,
        }

        resultado, _, _, error = llamar_api("POST", "/numerology", datos)

        if resultado and not error:
            consola.print()
            formatear_numerologia(resultado)

        if not preguntar_repetir():
            break


def probar_retorno_solar():
    """Probar POST /solar-return/{anio}."""
    consola.print("\n[bold yellow]─── Revolución Solar ───[/bold yellow]\n")

    while True:
        datos = pedir_datos_nacimiento(con_sistema_casas=True)
        anio = IntPrompt.ask("  Año del retorno", default=2025)

        resultado, _, _, error = llamar_api(
            "POST", f"/solar-return/{anio}", datos
        )

        if resultado and not error:
            consola.print()
            formatear_retorno_solar(resultado)

        if not preguntar_repetir():
            break


def probar_transitos():
    """Probar GET /transits."""
    consola.print("\n[bold blue]─── Tránsitos ───[/bold blue]\n")

    while True:
        resultado, _, _, error = llamar_api("GET", "/transits")

        if resultado and not error:
            consola.print()
            formatear_transitos(resultado)

        if not preguntar_repetir():
            break


def probar_perfiles():
    """Submenu de gestión de perfiles."""
    consola.print("\n[bold]─── Perfiles ───[/bold]\n")

    while True:
        consola.print("  1. Crear perfil")
        consola.print("  2. Buscar perfil por ID")
        consola.print("  0. Volver\n")

        opcion = Prompt.ask("  → Elegí una opción", choices=["0", "1", "2"], default="0")

        if opcion == "0":
            break
        elif opcion == "1":
            datos = pedir_datos_nacimiento(con_sistema_casas=False)
            resultado, _, _, error = llamar_api("POST", "/profile", datos)

            if resultado and not error:
                consola.print()
                perfil_id = resultado.get("id", "—")
                info = Table(box=box.SIMPLE, show_header=False)
                info.add_column("Campo", style="bold cyan")
                info.add_column("Valor")

                info.add_row("ID", f"[bold green]{perfil_id}[/bold green]")
                info.add_row("Nombre", resultado.get("nombre", ""))
                info.add_row("Fecha", str(resultado.get("fecha_nacimiento", "")))
                info.add_row("Hora", str(resultado.get("hora_nacimiento", "")))
                info.add_row("Ciudad", resultado.get("ciudad_nacimiento", ""))
                info.add_row("País", resultado.get("pais_nacimiento", ""))
                info.add_row("Lat/Lng", (
                    f"{resultado.get('latitud', 0)}, {resultado.get('longitud', 0)}"
                ))
                info.add_row("Zona Horaria", resultado.get("zona_horaria", ""))

                consola.print(Panel(info, title="Perfil Creado", border_style="green"))

        elif opcion == "2":
            perfil_id = Prompt.ask("  ID del perfil (UUID)")
            resultado, _, _, error = llamar_api("GET", f"/profile/{perfil_id}")

            if resultado and not error:
                consola.print()
                info = Table(box=box.SIMPLE, show_header=False)
                info.add_column("Campo", style="bold cyan")
                info.add_column("Valor")

                for campo, valor in resultado.items():
                    info.add_row(campo, str(valor))

                consola.print(Panel(info, title="Perfil", border_style="blue"))

        consola.print()


def health_check():
    """Probar GET /health."""
    consola.print("\n[bold]─── Health Check ───[/bold]")

    url = f"{BASE_URL}/health"
    try:
        with httpx.Client(timeout=5.0) as cliente:
            resp = cliente.get(url)
            datos = resp.json()

        info = Table(box=box.SIMPLE, show_header=False)
        info.add_column("Servicio", style="bold")
        info.add_column("Estado", justify="center")

        estado_general = datos.get("estado", "desconocido")
        color = "green" if estado_general == "saludable" else "yellow"

        info.add_row("Estado General", f"[bold {color}]{estado_general}[/bold {color}]")
        info.add_row("Versión", datos.get("version", "—"))

        for servicio in ["base_datos", "redis", "efemerides"]:
            valor = datos.get(servicio, "—")
            s_color = "green" if "conectado" in valor or "archivos" in valor else "red"
            info.add_row(
                servicio.replace("_", " ").title(),
                f"[{s_color}]{valor}[/{s_color}]",
            )

        consola.print(Panel(info, title="Estado del Sistema", border_style=color))

    except httpx.ConnectError:
        consola.print(
            "\n  [red]✗ No se pudo conectar al servidor.[/red]\n"
            "    Levantalo con: ./scripts/levantar.sh"
        )
    except Exception as e:
        consola.print(f"\n  [red]✗ Error: {e}[/red]")


# ─────────────────────────────────────────────
# Menú principal
# ─────────────────────────────────────────────

OPCIONES = {
    "1": ("Carta Natal", probar_natal),
    "2": ("Diseño Humano", probar_diseno_humano),
    "3": ("Numerología", probar_numerologia),
    "4": ("Revolución Solar", probar_retorno_solar),
    "5": ("Tránsitos (posiciones actuales)", probar_transitos),
    "6": ("Gestión de Perfiles", probar_perfiles),
    "7": ("Health Check", health_check),
    "0": ("Salir", None),
}


def menu_principal():
    """Loop principal del menú."""
    while True:
        consola.print()
        consola.print(
            Panel(
                "[bold cyan]CosmicEngine — Consola de Pruebas[/bold cyan]",
                box=box.DOUBLE,
                style="cyan",
                expand=False,
            )
        )
        consola.print()
        consola.print("  [bold]¿Qué querés probar?[/bold]\n")

        for key, (nombre, _) in OPCIONES.items():
            if key == "0":
                consola.print(f"  [dim]{key}. {nombre}[/dim]")
            else:
                consola.print(f"  {key}. {nombre}")

        consola.print()
        opcion = Prompt.ask(
            "  → Elegí una opción",
            choices=list(OPCIONES.keys()),
            default="0",
        )

        if opcion == "0":
            consola.print("\n  [cyan]¡Hasta la próxima! ✦[/cyan]\n")
            break

        _, funcion = OPCIONES[opcion]
        if funcion:
            try:
                funcion()
            except KeyboardInterrupt:
                consola.print("\n  [yellow]Cancelado[/yellow]")


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────

if __name__ == "__main__":
    try:
        menu_principal()
    except KeyboardInterrupt:
        consola.print("\n\n  [cyan]¡Chau! ✦[/cyan]\n")
        sys.exit(0)
