"""Servicio de generación de PDF del perfil completo del usuario."""

import io
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


# Colores de marca ASTRA
COLOR_MARCA = colors.HexColor("#4A00E0")
COLOR_MARCA_CLARO = colors.HexColor("#F0EAFF")
COLOR_GRIS = colors.HexColor("#8A8580")
COLOR_DORADO = colors.HexColor("#D4A234")

# Ruta al logo
_DIR_ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "assets")
RUTA_LOGO = os.path.join(_DIR_ASSETS, "logo-astra.png")


def _estilos():
    """Retorna diccionario de estilos reutilizables."""
    base = getSampleStyleSheet()
    return {
        "titulo_seccion": ParagraphStyle(
            "TituloSeccion",
            parent=base["Heading1"],
            fontSize=16,
            spaceAfter=4 * mm,
            spaceBefore=6 * mm,
            textColor=COLOR_MARCA,
        ),
        "subtitulo": ParagraphStyle(
            "Subtitulo",
            parent=base["Normal"],
            fontSize=10,
            textColor=COLOR_GRIS,
            spaceAfter=3 * mm,
        ),
        "normal": base["Normal"],
        "negrita": ParagraphStyle(
            "Negrita",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
        ),
        "dato_clave": ParagraphStyle(
            "DatoClave",
            parent=base["Normal"],
            fontSize=11,
            spaceAfter=2 * mm,
        ),
        "pie": ParagraphStyle(
            "Pie",
            parent=base["Normal"],
            fontSize=8,
            textColor=COLOR_GRIS,
        ),
    }


def _estilo_tabla_encabezado():
    """Estilo de tabla con encabezado violeta claro."""
    return TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_MARCA_CLARO),
        ("TEXTCOLOR", (0, 0), (-1, 0), COLOR_MARCA),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ])


def _portada(perfil: dict, estilos: dict) -> list:
    """Genera elementos de la portada."""
    elementos = []

    # Banner violeta con logo
    if os.path.exists(RUTA_LOGO):
        try:
            logo = Image(RUTA_LOGO, width=50 * mm, height=14 * mm)
            elementos.append(logo)
        except Exception:
            pass

    elementos.append(Spacer(1, 6 * mm))

    titulo = ParagraphStyle(
        "TituloPortada",
        fontName="Helvetica-Bold",
        fontSize=28,
        textColor=COLOR_MARCA,
        spaceAfter=4 * mm,
    )
    elementos.append(Paragraph("Perfil Cósmico", titulo))

    subtitulo_portada = ParagraphStyle(
        "SubPortada",
        fontName="Helvetica",
        fontSize=12,
        textColor=COLOR_GRIS,
        spaceAfter=8 * mm,
    )
    elementos.append(Paragraph("Carta Astral · Diseño Humano · Numerología", subtitulo_portada))

    # Datos del usuario
    nombre = perfil.get("nombre", "—")
    fecha = perfil.get("fecha_nacimiento", "—")
    hora = perfil.get("hora_nacimiento", "—")
    ciudad = perfil.get("ciudad_nacimiento", "—")
    pais = perfil.get("pais_nacimiento", "—")

    datos = [
        ["Nombre:", nombre],
        ["Nacimiento:", f"{fecha} a las {hora}"],
        ["Lugar:", f"{ciudad}, {pais}"],
        ["Generado:", datetime.now().strftime("%d/%m/%Y %H:%M")],
    ]

    tabla = Table(datos, colWidths=[35 * mm, 125 * mm])
    tabla.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), COLOR_MARCA),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elementos.append(tabla)

    elementos.append(Spacer(1, 10 * mm))

    # Linea separadora
    linea = Table([[""]],
                  colWidths=[170 * mm],
                  rowHeights=[0.5 * mm])
    linea.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_MARCA_CLARO),
        ("LINEBELOW", (0, 0), (-1, -1), 1, COLOR_MARCA),
    ]))
    elementos.append(linea)

    return elementos


def _seccion_carta_astral(natal: dict, estilos: dict) -> list:
    """Genera la sección de carta astral."""
    elementos = []
    elementos.append(PageBreak())
    elementos.append(Paragraph("Carta Astral", estilos["titulo_seccion"]))

    # Ascendente y MC
    asc = natal.get("ascendente", {})
    mc = natal.get("medio_cielo", {})
    if asc or mc:
        info = []
        if asc:
            info.append(f"<b>Ascendente:</b> {asc.get('signo', '—')} {asc.get('grado_en_signo', 0):.1f}°")
        if mc:
            info.append(f"<b>Medio Cielo:</b> {mc.get('signo', '—')} {mc.get('grado_en_signo', 0):.1f}°")
        elementos.append(Paragraph(" &nbsp;·&nbsp; ".join(info), estilos["dato_clave"]))
        elementos.append(Spacer(1, 4 * mm))

    # Tabla de planetas
    planetas = natal.get("planetas", [])
    if planetas:
        elementos.append(Paragraph("<b>Planetas</b>", estilos["negrita"]))
        elementos.append(Spacer(1, 2 * mm))

        filas = [["Planeta", "Signo", "Grado", "Casa", "R", "Dignidad"]]
        for p in planetas:
            retro = "R" if p.get("retrogrado") else ""
            dignidad = p.get("dignidad") or "—"
            filas.append([
                p.get("nombre", "—"),
                p.get("signo", "—"),
                f"{p.get('grado_en_signo', 0):.2f}°",
                str(p.get("casa", "—")),
                retro,
                dignidad,
            ])

        anchos = [30 * mm, 25 * mm, 22 * mm, 18 * mm, 12 * mm, 30 * mm]
        tabla = Table(filas, colWidths=anchos)
        tabla.setStyle(_estilo_tabla_encabezado())
        elementos.append(tabla)
        elementos.append(Spacer(1, 6 * mm))

    # Tabla de casas
    casas = natal.get("casas", [])
    if casas:
        elementos.append(Paragraph("<b>Casas</b>", estilos["negrita"]))
        elementos.append(Spacer(1, 2 * mm))

        filas = [["Casa", "Signo", "Grado"]]
        for c in casas:
            filas.append([
                str(c.get("numero", "—")),
                c.get("signo", "—"),
                f"{c.get('grado_en_signo', 0):.2f}°",
            ])

        tabla = Table(filas, colWidths=[25 * mm, 35 * mm, 30 * mm])
        tabla.setStyle(_estilo_tabla_encabezado())
        elementos.append(tabla)
        elementos.append(Spacer(1, 6 * mm))

    # Tabla de aspectos
    aspectos = natal.get("aspectos", [])
    if aspectos:
        elementos.append(Paragraph("<b>Aspectos</b>", estilos["negrita"]))
        elementos.append(Spacer(1, 2 * mm))

        filas = [["Planeta 1", "Aspecto", "Planeta 2", "Orbe", "Tipo"]]
        for a in aspectos:
            tipo_aplicativo = "Aplicativo" if a.get("aplicativo") else "Separativo"
            filas.append([
                a.get("planeta1", "—"),
                a.get("tipo", "—"),
                a.get("planeta2", "—"),
                f"{a.get('orbe', 0):.2f}°",
                tipo_aplicativo,
            ])

        anchos = [30 * mm, 28 * mm, 30 * mm, 22 * mm, 28 * mm]
        tabla = Table(filas, colWidths=anchos)
        tabla.setStyle(_estilo_tabla_encabezado())
        elementos.append(tabla)

    return elementos


def _seccion_diseno_humano(hd: dict, estilos: dict) -> list:
    """Genera la sección de Diseño Humano."""
    elementos = []
    elementos.append(PageBreak())
    elementos.append(Paragraph("Diseño Humano", estilos["titulo_seccion"]))

    # Datos principales
    datos = [
        ("Tipo", hd.get("tipo", "—")),
        ("Autoridad", hd.get("autoridad", "—")),
        ("Perfil", hd.get("perfil", "—")),
        ("Definición", hd.get("definicion", "—")),
    ]

    cruz = hd.get("cruz_encarnacion", {})
    if cruz:
        puertas_cruz = cruz.get("puertas", [])
        if puertas_cruz:
            datos.append(("Cruz de Encarnación", " / ".join(str(p) for p in puertas_cruz if p is not None)))

    filas = [["Atributo", "Valor"]]
    for nombre, valor in datos:
        filas.append([nombre, valor])

    tabla = Table(filas, colWidths=[50 * mm, 110 * mm])
    tabla.setStyle(_estilo_tabla_encabezado())
    elementos.append(tabla)
    elementos.append(Spacer(1, 6 * mm))

    # Centros
    centros = hd.get("centros", {})
    if centros:
        elementos.append(Paragraph("<b>Centros</b>", estilos["negrita"]))
        elementos.append(Spacer(1, 2 * mm))

        filas = [["Centro", "Estado"]]
        for nombre, estado in centros.items():
            filas.append([nombre.capitalize(), estado.capitalize()])

        tabla = Table(filas, colWidths=[50 * mm, 50 * mm])
        tabla.setStyle(_estilo_tabla_encabezado())
        elementos.append(tabla)
        elementos.append(Spacer(1, 6 * mm))

    # Canales
    canales = hd.get("canales", [])
    if canales:
        elementos.append(Paragraph("<b>Canales</b>", estilos["negrita"]))
        elementos.append(Spacer(1, 2 * mm))

        filas = [["Puertas", "Nombre", "Centros"]]
        for canal in canales:
            puertas = canal.get("puertas", [])
            centros_canal = canal.get("centros", [])
            filas.append([
                f"{puertas[0]}-{puertas[1]}" if len(puertas) == 2 else "—",
                canal.get("nombre", "—"),
                f"{centros_canal[0]} ↔ {centros_canal[1]}" if len(centros_canal) == 2 else "—",
            ])

        tabla = Table(filas, colWidths=[25 * mm, 75 * mm, 55 * mm])
        tabla.setStyle(_estilo_tabla_encabezado())
        elementos.append(tabla)
        elementos.append(Spacer(1, 6 * mm))

    # Activaciones conscientes
    act_consc = hd.get("activaciones_conscientes", [])
    if act_consc:
        elementos.append(Paragraph("<b>Activaciones Conscientes (Personalidad)</b>", estilos["negrita"]))
        elementos.append(Spacer(1, 2 * mm))

        filas = [["Planeta", "Puerta", "Línea"]]
        for a in act_consc:
            filas.append([
                a.get("planeta", "—"),
                str(a.get("puerta", "—")),
                str(a.get("linea", "—")),
            ])

        tabla = Table(filas, colWidths=[40 * mm, 30 * mm, 25 * mm])
        tabla.setStyle(_estilo_tabla_encabezado())
        elementos.append(tabla)
        elementos.append(Spacer(1, 6 * mm))

    # Activaciones inconscientes
    act_inconsc = hd.get("activaciones_inconscientes", [])
    if act_inconsc:
        elementos.append(Paragraph("<b>Activaciones Inconscientes (Diseño)</b>", estilos["negrita"]))
        elementos.append(Spacer(1, 2 * mm))

        filas = [["Planeta", "Puerta", "Línea"]]
        for a in act_inconsc:
            filas.append([
                a.get("planeta", "—"),
                str(a.get("puerta", "—")),
                str(a.get("linea", "—")),
            ])

        tabla = Table(filas, colWidths=[40 * mm, 30 * mm, 25 * mm])
        tabla.setStyle(_estilo_tabla_encabezado())
        elementos.append(tabla)

    return elementos


def _seccion_numerologia(num: dict, estilos: dict) -> list:
    """Genera la sección de Numerología."""
    elementos = []
    elementos.append(PageBreak())
    elementos.append(Paragraph("Numerología", estilos["titulo_seccion"]))

    sistema = num.get("sistema", "pitagórico").capitalize()
    elementos.append(Paragraph(f"Sistema: {sistema}", estilos["subtitulo"]))

    claves = [
        ("Camino de Vida", "camino_de_vida"),
        ("Expresión", "expresion"),
        ("Impulso del Alma", "impulso_del_alma"),
        ("Personalidad", "personalidad"),
        ("Número de Nacimiento", "numero_nacimiento"),
        ("Año Personal", "anio_personal"),
    ]

    filas = [["Número", "Valor", "Descripción"]]
    for etiqueta, clave in claves:
        dato = num.get(clave, {})
        if dato:
            numero = dato.get("numero", "—")
            desc = dato.get("descripcion", "—")
            # Truncar descripcion para que quepa en tabla
            if len(desc) > 80:
                desc = desc[:77] + "..."
            filas.append([etiqueta, str(numero), desc])

    anchos = [40 * mm, 20 * mm, 100 * mm]
    tabla = Table(filas, colWidths=anchos)
    tabla.setStyle(_estilo_tabla_encabezado())
    elementos.append(tabla)
    elementos.append(Spacer(1, 6 * mm))

    # Numeros maestros
    maestros = num.get("numeros_maestros_presentes", [])
    if maestros:
        texto = ", ".join(str(m) for m in maestros)
        elementos.append(Paragraph(
            f"<b>Números Maestros presentes:</b> {texto}",
            estilos["dato_clave"],
        ))

    return elementos


class ServicioPDFPerfil:
    """Genera un PDF completo con el perfil cósmico del usuario."""

    @staticmethod
    def generar(perfil: dict, calculos: dict) -> io.BytesIO:
        """Genera el PDF y retorna un buffer BytesIO listo para enviar."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )

        estilos = _estilos()
        elementos = []

        # Portada
        elementos.extend(_portada(perfil, estilos))

        # Carta Astral
        natal = calculos.get("natal")
        if natal:
            elementos.extend(_seccion_carta_astral(natal, estilos))
        else:
            elementos.append(PageBreak())
            elementos.append(Paragraph("Carta Astral", estilos["titulo_seccion"]))
            elementos.append(Paragraph("Datos no disponibles. Completa tu perfil para generar la carta astral.", estilos["subtitulo"]))

        # Diseño Humano
        hd = calculos.get("diseno_humano")
        if hd:
            elementos.extend(_seccion_diseno_humano(hd, estilos))
        else:
            elementos.append(PageBreak())
            elementos.append(Paragraph("Diseño Humano", estilos["titulo_seccion"]))
            elementos.append(Paragraph("Datos no disponibles. Completa tu perfil para generar el diseño humano.", estilos["subtitulo"]))

        # Numerología
        num = calculos.get("numerologia")
        if num:
            elementos.extend(_seccion_numerologia(num, estilos))
        else:
            elementos.append(PageBreak())
            elementos.append(Paragraph("Numerología", estilos["titulo_seccion"]))
            elementos.append(Paragraph("Datos no disponibles. Completa tu perfil para generar la numerología.", estilos["subtitulo"]))

        # Pie final
        elementos.append(Spacer(1, 15 * mm))
        elementos.append(Paragraph(
            f"Generado por ASTRA · CosmicEngine — {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            estilos["pie"],
        ))

        doc.build(elementos)
        buffer.seek(0)
        return buffer
