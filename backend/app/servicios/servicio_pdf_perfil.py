"""Servicio de generación de PDF del perfil completo del usuario."""

from __future__ import annotations

import io
import os
from datetime import datetime
from typing import Sequence
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, StyleSheet1, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Flowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


COLOR_CIRUELA = colors.HexColor("#2D1B69")
COLOR_CIRUELA_MEDIA = colors.HexColor("#4A2D8C")
COLOR_VIOLETA = colors.HexColor("#7C4DFF")
COLOR_VIOLETA_CLARO = colors.HexColor("#B388FF")
COLOR_LAVANDA = colors.HexColor("#EDE7FF")
COLOR_LILA = colors.HexColor("#F7F2FF")
COLOR_BORDE = colors.HexColor("#DDD2F8")
COLOR_TEXTO = colors.HexColor("#2C2926")
COLOR_TEXTO_SUAVE = colors.HexColor("#756F7D")
COLOR_TEXTO_CLARO = colors.HexColor("#F5F0FF")
COLOR_TEXTO_CLARO_SUAVE = colors.HexColor("#D8CCF6")
COLOR_DORADO = colors.HexColor("#D4A234")
COLOR_ESMERALDA = colors.HexColor("#147A62")
COLOR_ROJO_SUAVE = colors.HexColor("#B16474")

ANCHO_PAGINA, ALTO_PAGINA = A4
ANCHO_UTIL = 174 * mm

_DIR_ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "assets")
RUTA_LOGO = os.path.join(_DIR_ASSETS, "logo-astra.png")


class CajaEditorial(Flowable):
    """Caja con fondo y borde redondeado para construir paneles editoriales."""

    def __init__(
        self,
        contenido: Sequence[Flowable],
        *,
        ancho: float | None = None,
        fondo=colors.white,
        borde=COLOR_BORDE,
        radio: float = 7 * mm,
        relleno_horizontal: float = 6 * mm,
        relleno_vertical: float = 5 * mm,
        separacion: float = 2 * mm,
        barra_acento=None,
        ancho_barra: float = 3 * mm,
        trazo: float = 0.8,
    ) -> None:
        super().__init__()
        self.contenido = list(contenido)
        self.ancho = ancho
        self.fondo = fondo
        self.borde = borde
        self.radio = radio
        self.relleno_horizontal = relleno_horizontal
        self.relleno_vertical = relleno_vertical
        self.separacion = separacion
        self.barra_acento = barra_acento
        self.ancho_barra = ancho_barra if barra_acento else 0
        self.trazo = trazo
        self._wrapped: list[tuple[Flowable, float, float]] = []
        self.width = 0.0
        self.height = 0.0

    def wrap(self, availWidth, availHeight):  # noqa: N802 - firma reportlab
        ancho_real = min(self.ancho or availWidth, availWidth)
        reserva_barra = (self.ancho_barra + 2.4 * mm) if self.barra_acento else 0
        ancho_interior = ancho_real - (self.relleno_horizontal * 2) - reserva_barra
        ancho_interior = max(ancho_interior, 1)

        altura_total = self.relleno_vertical * 2
        self._wrapped = []

        for indice, elemento in enumerate(self.contenido):
            ancho_elemento, alto_elemento = elemento.wrap(ancho_interior, availHeight)
            self._wrapped.append((elemento, ancho_elemento, alto_elemento))
            altura_total += alto_elemento
            if indice < len(self.contenido) - 1:
                altura_total += self.separacion

        self.width = ancho_real
        self.height = altura_total
        return ancho_real, altura_total

    def draw(self):
        lienzo = self.canv
        lienzo.saveState()
        lienzo.setFillColor(self.fondo)
        lienzo.setStrokeColor(self.borde)
        lienzo.setLineWidth(self.trazo)
        lienzo.roundRect(0, 0, self.width, self.height, self.radio, fill=1, stroke=1)

        if self.barra_acento:
            lienzo.setFillColor(self.barra_acento)
            alto_barra = max(self.height - (6 * mm), 6 * mm)
            lienzo.roundRect(2 * mm, (self.height - alto_barra) / 2, self.ancho_barra, alto_barra, self.ancho_barra / 2, fill=1, stroke=0)

        cursor_y = self.height - self.relleno_vertical
        posicion_x = self.relleno_horizontal + ((self.ancho_barra + 2.4 * mm) if self.barra_acento else 0)

        for indice, (elemento, ancho_elemento, alto_elemento) in enumerate(self._wrapped):
            cursor_y -= alto_elemento
            elemento.drawOn(lienzo, posicion_x, cursor_y)
            if indice < len(self._wrapped) - 1:
                cursor_y -= self.separacion

        lienzo.restoreState()


def _estilos() -> StyleSheet1:
    base = getSampleStyleSheet()

    estilos = StyleSheet1()
    estilos.add(base["Normal"])

    estilos.add(
        ParagraphStyle(
            "portada_badge",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=10,
            alignment=TA_CENTER,
            textColor=COLOR_TEXTO_CLARO,
        )
    )
    estilos.add(
        ParagraphStyle(
            "titulo_portada",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=30,
            leading=34,
            textColor=colors.white,
            spaceAfter=3 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "subtitulo_portada",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12.5,
            leading=16,
            textColor=COLOR_TEXTO_CLARO_SUAVE,
            spaceAfter=4 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "texto_portada",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=COLOR_TEXTO_CLARO,
        )
    )
    estilos.add(
        ParagraphStyle(
            "portada_etiqueta",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9,
            textColor=COLOR_TEXTO_CLARO_SUAVE,
            spaceAfter=1.3 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "portada_valor",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=17,
            textColor=colors.white,
            spaceAfter=1 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "portada_aux",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=COLOR_TEXTO_CLARO_SUAVE,
        )
    )
    estilos.add(
        ParagraphStyle(
            "kicker",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=COLOR_VIOLETA,
            spaceAfter=1.5 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "titulo_seccion",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=COLOR_CIRUELA,
            spaceAfter=2 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "resumen_seccion",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=COLOR_TEXTO,
        )
    )
    estilos.add(
        ParagraphStyle(
            "subtitulo_bloque",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=COLOR_CIRUELA,
            spaceAfter=2 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "texto_normal",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=COLOR_TEXTO,
        )
    )
    estilos.add(
        ParagraphStyle(
            "texto_auxiliar",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=12.5,
            textColor=COLOR_TEXTO_SUAVE,
        )
    )
    estilos.add(
        ParagraphStyle(
            "tarjeta_etiqueta",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9,
            textColor=COLOR_VIOLETA,
            spaceAfter=1.3 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "tarjeta_valor",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=16.5,
            textColor=COLOR_CIRUELA,
            spaceAfter=1 * mm,
        )
    )
    estilos.add(
        ParagraphStyle(
            "tarjeta_aux",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=12,
            textColor=COLOR_TEXTO_SUAVE,
        )
    )
    estilos.add(
        ParagraphStyle(
            "tabla_encabezado",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.7,
            leading=10.5,
            textColor=colors.white,
        )
    )
    estilos.add(
        ParagraphStyle(
            "tabla_celda",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=11.2,
            textColor=COLOR_TEXTO,
        )
    )
    estilos.add(
        ParagraphStyle(
            "tabla_celda_centrada",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=11.2,
            textColor=COLOR_TEXTO,
            alignment=TA_CENTER,
        )
    )
    estilos.add(
        ParagraphStyle(
            "pie",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=COLOR_TEXTO_SUAVE,
        )
    )
    return estilos


def _texto(valor, default="—") -> str:
    if valor is None:
        return default
    texto = str(valor).strip()
    return texto or default


def _texto_html(valor, default="—") -> str:
    return escape(_texto(valor, default)).replace("\n", "<br/>")


def _formatear_fecha(fecha: str | None) -> str:
    if not fecha:
        return "—"
    for formato in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(fecha, formato).strftime("%d/%m/%Y")
        except ValueError:
            continue
    return fecha


def _formatear_hora(hora: str | None) -> str:
    if not hora:
        return "—"
    for formato in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(hora, formato).strftime("%H:%M")
        except ValueError:
            continue
    return hora


def _buscar_planeta(natal: dict, nombre: str) -> dict:
    for planeta in natal.get("planetas", []):
        if str(planeta.get("nombre", "")).lower() == nombre.lower():
            return planeta
    return {}


def _signo_y_grado(dato: dict | None) -> str:
    if not dato:
        return "—"
    signo = _texto(dato.get("signo"))
    grado = dato.get("grado_en_signo")
    if isinstance(grado, (int, float)):
        return f"{signo} {grado:.1f}°"
    return signo


def _contar_centros_definidos(centros: dict) -> int:
    return sum(1 for estado in centros.values() if str(estado).lower() == "definido")


def _estado_retrogrado(planeta: dict) -> str:
    return "Retrógrado" if planeta.get("retrogrado") else "Directo"


def _resumen_carta_astral(natal: dict | None) -> str:
    if not natal:
        return "Todavía no hay datos astrales disponibles para esta persona. Cuando el cálculo exista, esta página mostrará la lectura técnica completa."

    sol = _buscar_planeta(natal, "Sol")
    luna = _buscar_planeta(natal, "Luna")
    asc = natal.get("ascendente", {})
    partes = []
    if sol:
        partes.append(f"Sol en {_texto(sol.get('signo'))}")
    if luna:
        partes.append(f"Luna en {_texto(luna.get('signo'))}")
    if asc:
        partes.append(f"Ascendente en {_texto(asc.get('signo'))}")

    cierre = (
        f"{len(natal.get('planetas', []))} posiciones planetarias, "
        f"{len(natal.get('casas', []))} casas y "
        f"{len(natal.get('aspectos', []))} aspectos principales listados."
    )
    return ". ".join(filter(None, [" · ".join(partes), cierre])).strip(". ")


def _resumen_diseno_humano(hd: dict | None) -> str:
    if not hd:
        return "Todavía no hay diseño humano calculado. Cuando exista, esta sección resumirá tipo, autoridad, perfil, centros y activaciones."

    centros = hd.get("centros", {})
    definidos = _contar_centros_definidos(centros)
    return (
        f"Tipo {_texto(hd.get('tipo'))}, autoridad {_texto(hd.get('autoridad'))} y perfil {_texto(hd.get('perfil'))}. "
        f"{definidos} centros definidos y {len(hd.get('canales', []))} canales visibles en la lectura."
    )


def _resumen_numerologia(num: dict | None) -> str:
    if not num:
        return "Todavía no hay numerología disponible. Cuando el cálculo exista, aquí aparecerán los números clave y sus descripciones."

    camino = num.get("camino_de_vida", {})
    expresion = num.get("expresion", {})
    anio = num.get("anio_personal", {})
    maestros = num.get("numeros_maestros_presentes", [])
    parte_maestros = (
        f" Números maestros presentes: {', '.join(str(valor) for valor in maestros)}."
        if maestros
        else ""
    )
    return (
        f"Sistema {_texto(num.get('sistema', 'pitagórico')).capitalize()} con camino de vida {_texto(camino.get('numero'))}, "
        f"expresión {_texto(expresion.get('numero'))} y año personal {_texto(anio.get('numero'))}."
        f"{parte_maestros}"
    )


def _insignia(texto: str, estilos: StyleSheet1) -> Table:
    tabla = Table([[Paragraph(_texto_html(texto), estilos["portada_badge"])]], colWidths=[54 * mm])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_CIRUELA_MEDIA),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_VIOLETA_CLARO),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return tabla


def _tarjeta_portada(etiqueta: str, valor: str, auxiliar: str, estilos: StyleSheet1) -> CajaEditorial:
    return CajaEditorial(
        [
            Paragraph(_texto_html(etiqueta.upper()), estilos["portada_etiqueta"]),
            Paragraph(_texto_html(valor), estilos["portada_valor"]),
            Paragraph(_texto_html(auxiliar), estilos["portada_aux"]),
        ],
        fondo=COLOR_CIRUELA_MEDIA,
        borde=COLOR_VIOLETA_CLARO,
        relleno_horizontal=5 * mm,
        relleno_vertical=4.4 * mm,
        separacion=1.3 * mm,
        radio=6 * mm,
    )


def _tarjeta_resumen(etiqueta: str, valor: str, auxiliar: str, estilos: StyleSheet1) -> CajaEditorial:
    return CajaEditorial(
        [
            Paragraph(_texto_html(etiqueta.upper()), estilos["tarjeta_etiqueta"]),
            Paragraph(_texto_html(valor), estilos["tarjeta_valor"]),
            Paragraph(_texto_html(auxiliar), estilos["tarjeta_aux"]),
        ],
        fondo=colors.white,
        borde=COLOR_BORDE,
        relleno_horizontal=5 * mm,
        relleno_vertical=4.2 * mm,
        separacion=1.2 * mm,
        radio=6 * mm,
        barra_acento=COLOR_VIOLETA,
    )


def _fila_tarjetas(tarjetas: Sequence[Flowable], anchos: Sequence[float]) -> Table:
    tabla = Table([list(tarjetas)], colWidths=list(anchos))
    tabla.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 1.2 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return tabla


def _tabla_estilizada(
    encabezados: Sequence[str],
    filas: Sequence[Sequence[str]],
    anchos: Sequence[float],
    estilos: StyleSheet1,
    *,
    columnas_centradas: Sequence[int] | None = None,
) -> Table:
    columnas_centradas = set(columnas_centradas or [])
    datos = []

    encabezado = [Paragraph(_texto_html(valor), estilos["tabla_encabezado"]) for valor in encabezados]
    datos.append(encabezado)

    for fila in filas:
        celdas = []
        for indice, valor in enumerate(fila):
            estilo = estilos["tabla_celda_centrada"] if indice in columnas_centradas else estilos["tabla_celda"]
            celdas.append(Paragraph(_texto_html(valor), estilo))
        datos.append(celdas)

    tabla = Table(datos, colWidths=list(anchos), repeatRows=1)
    instrucciones = [
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_CIRUELA),
        ("BOX", (0, 0), (-1, -1), 0.7, COLOR_BORDE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.7, COLOR_CIRUELA),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, COLOR_BORDE),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]

    for indice in range(1, len(datos)):
        color_fondo = COLOR_LILA if indice % 2 == 0 else colors.white
        instrucciones.append(("BACKGROUND", (0, indice), (-1, indice), color_fondo))

    tabla.setStyle(TableStyle(instrucciones))
    return tabla


def _hero_seccion(kicker: str, titulo: str, resumen: str, estilos: StyleSheet1) -> CajaEditorial:
    return CajaEditorial(
        [
            Paragraph(_texto_html(kicker.upper()), estilos["kicker"]),
            Paragraph(_texto_html(titulo), estilos["titulo_seccion"]),
            Paragraph(_texto_html(resumen), estilos["resumen_seccion"]),
        ],
        ancho=ANCHO_UTIL,
        fondo=COLOR_LILA,
        borde=COLOR_BORDE,
        radio=7 * mm,
        relleno_horizontal=8 * mm,
        relleno_vertical=6 * mm,
        separacion=1.8 * mm,
        barra_acento=COLOR_DORADO,
        ancho_barra=3.2 * mm,
    )


def _panel_vacio(titulo: str, mensaje: str, estilos: StyleSheet1) -> CajaEditorial:
    return CajaEditorial(
        [
            Paragraph(_texto_html(titulo), estilos["subtitulo_bloque"]),
            Paragraph(_texto_html(mensaje), estilos["texto_auxiliar"]),
        ],
        ancho=ANCHO_UTIL,
        fondo=colors.white,
        borde=COLOR_BORDE,
        radio=6 * mm,
        relleno_horizontal=7 * mm,
        relleno_vertical=5.5 * mm,
        separacion=1.5 * mm,
        barra_acento=COLOR_ROJO_SUAVE,
        ancho_barra=2.8 * mm,
    )


def _bloque_titulo(texto: str, estilos: StyleSheet1) -> Paragraph:
    return Paragraph(_texto_html(texto), estilos["subtitulo_bloque"])


def _portada(perfil: dict, calculos: dict, estilos: StyleSheet1, generado_en: datetime) -> list:
    nombre = _texto(perfil.get("nombre"))
    fecha = _formatear_fecha(perfil.get("fecha_nacimiento"))
    hora = _formatear_hora(perfil.get("hora_nacimiento"))
    ciudad = _texto(perfil.get("ciudad_nacimiento"))
    pais = _texto(perfil.get("pais_nacimiento"))
    generado = generado_en.strftime("%d/%m/%Y · %H:%M")

    natal = calculos.get("natal") or {}
    hd = calculos.get("diseno_humano") or {}
    num = calculos.get("numerologia") or {}

    resumen_astral = "Sin cálculo astral disponible"
    sol = _buscar_planeta(natal, "Sol")
    asc = natal.get("ascendente", {})
    if sol or asc:
        partes = []
        if sol:
            partes.append(f"Sol {_texto(sol.get('signo'))}")
        if asc:
            partes.append(f"Asc {_texto(asc.get('signo'))}")
        resumen_astral = " · ".join(partes)

    resumen_hd = "Sin diseño humano disponible"
    if hd:
        resumen_hd = " · ".join(
            filtro
            for filtro in [_texto(hd.get("tipo")), _texto(hd.get("perfil")), _texto(hd.get("autoridad"))]
            if filtro != "—"
        )

    resumen_num = "Sin numerología disponible"
    if num:
        camino = num.get("camino_de_vida", {})
        anio = num.get("anio_personal", {})
        resumen_num = f"Camino {_texto(camino.get('numero'))} · Año {_texto(anio.get('numero'))}"

    elementos: list[Flowable] = [Spacer(1, 6 * mm)]

    if os.path.exists(RUTA_LOGO):
        try:
            elementos.append(Image(RUTA_LOGO, width=52 * mm, height=15 * mm))
        except Exception:
            elementos.append(Paragraph("ASTRA", estilos["titulo_portada"]))
    else:
        elementos.append(Paragraph("ASTRA", estilos["titulo_portada"]))

    elementos.extend(
        [
            Spacer(1, 7 * mm),
            _insignia("PERFIL EDITORIAL ASTRA", estilos),
            Spacer(1, 8 * mm),
            Paragraph("Perfil Cósmico", estilos["titulo_portada"]),
            Paragraph(
                "Una lectura integrada de tu carta astral, tu arquitectura energética y tus ciclos numerológicos.",
                estilos["subtitulo_portada"],
            ),
            Paragraph(
                "Diseñado para leerse como un dossier claro y elegante: primero la identidad del perfil, después los tres sistemas con prioridad visual y datos técnicos listos para consulta.",
                estilos["texto_portada"],
            ),
            Spacer(1, 8 * mm),
        ]
    )

    tarjetas_identidad = _fila_tarjetas(
        [
            _tarjeta_portada("Nombre completo", nombre, "Perfil personalizado ASTRA", estilos),
            _tarjeta_portada("Nacimiento", f"{fecha} · {hora}", "Fecha y hora locales del perfil", estilos),
        ],
        [84 * mm, 84 * mm],
    )
    tarjetas_contexto = _fila_tarjetas(
        [
            _tarjeta_portada("Lugar", f"{ciudad}, {pais}", "Contexto geográfico del cálculo", estilos),
            _tarjeta_portada("Generado", generado, "Edición PDF de ASTRA", estilos),
        ],
        [84 * mm, 84 * mm],
    )
    tarjetas_resumen = _fila_tarjetas(
        [
            _tarjeta_portada("Carta Astral", resumen_astral, "Lectura natal y aspectos clave", estilos),
            _tarjeta_portada("Diseño Humano", resumen_hd, "Tipo, autoridad y perfil base", estilos),
            _tarjeta_portada("Numerología", resumen_num, "Camino de vida y ciclo actual", estilos),
        ],
        [55 * mm, 55 * mm, 55 * mm],
    )

    elementos.extend(
        [
            KeepTogether([tarjetas_identidad, Spacer(1, 4 * mm), tarjetas_contexto]),
            Spacer(1, 6 * mm),
            tarjetas_resumen,
            Spacer(1, 6 * mm),
            Paragraph(
                "Documento en español, con foco editorial y técnico. El contenido respeta la estructura ASTRA y se actualiza cada vez que descargás el perfil.",
                estilos["portada_aux"],
            ),
        ]
    )
    return elementos


def _seccion_carta_astral(natal: dict | None, estilos: StyleSheet1) -> list:
    elementos: list[Flowable] = [PageBreak(), _hero_seccion("Astrología natal", "Carta Astral", _resumen_carta_astral(natal), estilos)]

    if not natal:
        elementos.extend(
            [
                Spacer(1, 5 * mm),
                _panel_vacio(
                    "Datos no disponibles",
                    "Todavía no se guardó una carta astral para este perfil. Cuando el cálculo esté listo, esta sección mostrará posiciones planetarias, casas y aspectos.",
                    estilos,
                ),
            ]
        )
        return elementos

    sol = _buscar_planeta(natal, "Sol")
    luna = _buscar_planeta(natal, "Luna")
    asc = natal.get("ascendente", {})
    mc = natal.get("medio_cielo", {})
    retrogrados = sum(1 for planeta in natal.get("planetas", []) if planeta.get("retrogrado"))
    aspectos = natal.get("aspectos", [])

    tarjetas_1 = _fila_tarjetas(
        [
            _tarjeta_resumen("Sol", _signo_y_grado(sol), "Centro de identidad y propósito", estilos),
            _tarjeta_resumen("Luna", _signo_y_grado(luna), "Registro emocional y memoria", estilos),
            _tarjeta_resumen("Ascendente", _signo_y_grado(asc), "Modo de entrada al mundo", estilos),
        ],
        [56 * mm, 56 * mm, 56 * mm],
    )
    tarjetas_2 = _fila_tarjetas(
        [
            _tarjeta_resumen("Medio Cielo", _signo_y_grado(mc), "Dirección vocacional visible", estilos),
            _tarjeta_resumen("Planetas retrógrados", str(retrogrados), "Puntos de revisión interna", estilos),
            _tarjeta_resumen("Aspectos listados", str(len(aspectos)), "Tramas activas de la carta", estilos),
        ],
        [56 * mm, 56 * mm, 56 * mm],
    )

    elementos.extend([Spacer(1, 5 * mm), KeepTogether([tarjetas_1, Spacer(1, 3.5 * mm), tarjetas_2]), Spacer(1, 6 * mm)])

    elementos.extend([_bloque_titulo("Posiciones planetarias", estilos), Spacer(1, 2 * mm)])
    filas_planetas = [
        [
            _texto(planeta.get("nombre")),
            _texto(planeta.get("signo")),
            f"{planeta.get('grado_en_signo', 0):.2f}°" if isinstance(planeta.get("grado_en_signo"), (int, float)) else "—",
            _texto(planeta.get("casa")),
            _estado_retrogrado(planeta),
            _texto(planeta.get("dignidad"), "Sin dignidad especial"),
        ]
        for planeta in natal.get("planetas", [])
    ]
    if filas_planetas:
        elementos.append(
            _tabla_estilizada(
                ["Planeta", "Signo", "Grado", "Casa", "Estado", "Dignidad"],
                filas_planetas,
                [28 * mm, 26 * mm, 23 * mm, 16 * mm, 27 * mm, 36 * mm],
                estilos,
                columnas_centradas=[2, 3],
            )
        )
        elementos.append(Spacer(1, 5 * mm))

    casas = natal.get("casas", [])
    if casas:
        elementos.extend([_bloque_titulo("Casas", estilos), Spacer(1, 2 * mm)])
        filas_casas = [
            [
                f"Casa {casa.get('numero', '—')}",
                _texto(casa.get("signo")),
                f"{casa.get('grado_en_signo', 0):.2f}°" if isinstance(casa.get("grado_en_signo"), (int, float)) else "—",
            ]
            for casa in casas
        ]
        elementos.append(
            _tabla_estilizada(
                ["Casa", "Signo", "Grado"],
                filas_casas,
                [42 * mm, 56 * mm, 35 * mm],
                estilos,
                columnas_centradas=[2],
            )
        )
        elementos.append(Spacer(1, 5 * mm))

    if aspectos:
        elementos.extend([_bloque_titulo("Aspectos principales", estilos), Spacer(1, 2 * mm)])
        filas_aspectos = [
            [
                _texto(aspecto.get("planeta1")),
                _texto(aspecto.get("tipo")),
                _texto(aspecto.get("planeta2")),
                f"{aspecto.get('orbe', 0):.2f}°" if isinstance(aspecto.get("orbe"), (int, float)) else "—",
                "Aplicativo" if aspecto.get("aplicativo") else "Separativo",
            ]
            for aspecto in aspectos
        ]
        elementos.append(
            _tabla_estilizada(
                ["Planeta 1", "Aspecto", "Planeta 2", "Orbe", "Dinámica"],
                filas_aspectos,
                [30 * mm, 30 * mm, 30 * mm, 20 * mm, 36 * mm],
                estilos,
                columnas_centradas=[3],
            )
        )

    return elementos


def _seccion_diseno_humano(hd: dict | None, estilos: StyleSheet1) -> list:
    elementos: list[Flowable] = [PageBreak(), _hero_seccion("Arquitectura energética", "Diseño Humano", _resumen_diseno_humano(hd), estilos)]

    if not hd:
        elementos.extend(
            [
                Spacer(1, 5 * mm),
                _panel_vacio(
                    "Datos no disponibles",
                    "Todavía no se guardó un cálculo de diseño humano para este perfil. Cuando exista, esta sección mostrará tipo, autoridad, centros, canales y activaciones.",
                    estilos,
                ),
            ]
        )
        return elementos

    centros = hd.get("centros", {})
    definidos = _contar_centros_definidos(centros)
    canales = hd.get("canales", [])
    cruz = hd.get("cruz_encarnacion", {})
    puertas_cruz = cruz.get("puertas", [])
    resumen_cruz = " / ".join(str(puerta) for puerta in puertas_cruz if puerta is not None) or "Sin detalle"

    tarjetas_1 = _fila_tarjetas(
        [
            _tarjeta_resumen("Tipo", _texto(hd.get("tipo")), "Estructura base del diseño", estilos),
            _tarjeta_resumen("Autoridad", _texto(hd.get("autoridad")), "Modo sano de decidir", estilos),
            _tarjeta_resumen("Perfil", _texto(hd.get("perfil")), "Rol experiencial dominante", estilos),
        ],
        [56 * mm, 56 * mm, 56 * mm],
    )
    tarjetas_2 = _fila_tarjetas(
        [
            _tarjeta_resumen("Definición", _texto(hd.get("definicion")), "Conectividad interna del gráfico", estilos),
            _tarjeta_resumen("Centros definidos", str(definidos), "Consistencias energéticas activas", estilos),
            _tarjeta_resumen("Canales", str(len(canales)), "Vínculos completos entre centros", estilos),
        ],
        [56 * mm, 56 * mm, 56 * mm],
    )

    elementos.extend([Spacer(1, 5 * mm), KeepTogether([tarjetas_1, Spacer(1, 3.5 * mm), tarjetas_2]), Spacer(1, 6 * mm)])

    filas_principales = [
        ["Tipo", _texto(hd.get("tipo"))],
        ["Autoridad", _texto(hd.get("autoridad"))],
        ["Perfil", _texto(hd.get("perfil"))],
        ["Definición", _texto(hd.get("definicion"))],
        ["Cruz de encarnación", resumen_cruz],
    ]
    elementos.extend([_bloque_titulo("Resumen estructural", estilos), Spacer(1, 2 * mm)])
    elementos.append(_tabla_estilizada(["Atributo", "Valor"], filas_principales, [52 * mm, 116 * mm], estilos))
    elementos.append(Spacer(1, 5 * mm))

    if centros:
        filas_centros = [[_texto(nombre).capitalize(), _texto(estado).capitalize()] for nombre, estado in centros.items()]
        elementos.extend([_bloque_titulo("Centros", estilos), Spacer(1, 2 * mm)])
        elementos.append(_tabla_estilizada(["Centro", "Estado"], filas_centros, [84 * mm, 84 * mm], estilos))
        elementos.append(Spacer(1, 5 * mm))

    if canales:
        filas_canales = []
        for canal in canales:
            puertas = canal.get("puertas", [])
            centros_canal = canal.get("centros", [])
            filas_canales.append(
                [
                    f"{puertas[0]}-{puertas[1]}" if len(puertas) == 2 else "—",
                    _texto(canal.get("nombre")),
                    f"{centros_canal[0]} ↔ {centros_canal[1]}" if len(centros_canal) == 2 else "—",
                ]
            )
        elementos.extend([_bloque_titulo("Canales", estilos), Spacer(1, 2 * mm)])
        elementos.append(
            _tabla_estilizada(
                ["Puertas", "Canal", "Centros"],
                filas_canales,
                [28 * mm, 80 * mm, 60 * mm],
                estilos,
                columnas_centradas=[0],
            )
        )
        elementos.append(Spacer(1, 5 * mm))

    activaciones_conscientes = hd.get("activaciones_conscientes", [])
    if activaciones_conscientes:
        filas_conscientes = [
            [_texto(act.get("planeta")), _texto(act.get("puerta")), _texto(act.get("linea"))]
            for act in activaciones_conscientes
        ]
        elementos.extend([_bloque_titulo("Activaciones conscientes", estilos), Spacer(1, 2 * mm)])
        elementos.append(
            _tabla_estilizada(
                ["Planeta", "Puerta", "Línea"],
                filas_conscientes,
                [60 * mm, 40 * mm, 40 * mm],
                estilos,
                columnas_centradas=[1, 2],
            )
        )
        elementos.append(Spacer(1, 5 * mm))

    activaciones_inconscientes = hd.get("activaciones_inconscientes", [])
    if activaciones_inconscientes:
        filas_inconscientes = [
            [_texto(act.get("planeta")), _texto(act.get("puerta")), _texto(act.get("linea"))]
            for act in activaciones_inconscientes
        ]
        elementos.extend([_bloque_titulo("Activaciones inconscientes", estilos), Spacer(1, 2 * mm)])
        elementos.append(
            _tabla_estilizada(
                ["Planeta", "Puerta", "Línea"],
                filas_inconscientes,
                [60 * mm, 40 * mm, 40 * mm],
                estilos,
                columnas_centradas=[1, 2],
            )
        )

    return elementos


def _seccion_numerologia(num: dict | None, estilos: StyleSheet1) -> list:
    elementos: list[Flowable] = [PageBreak(), _hero_seccion("Ciclos y significado", "Numerología", _resumen_numerologia(num), estilos)]

    if not num:
        elementos.extend(
            [
                Spacer(1, 5 * mm),
                _panel_vacio(
                    "Datos no disponibles",
                    "Todavía no se guardó una carta numerológica para este perfil. Cuando exista, esta página mostrará números clave, sistema usado y descripciones interpretativas.",
                    estilos,
                ),
            ]
        )
        return elementos

    camino = num.get("camino_de_vida", {})
    expresion = num.get("expresion", {})
    anio = num.get("anio_personal", {})
    alma = num.get("impulso_del_alma", {})
    personalidad = num.get("personalidad", {})
    maestros = num.get("numeros_maestros_presentes", [])

    tarjetas_1 = _fila_tarjetas(
        [
            _tarjeta_resumen("Camino de vida", _texto(camino.get("numero")), "Trayectoria central del perfil", estilos),
            _tarjeta_resumen("Expresión", _texto(expresion.get("numero")), "Cómo se despliega la voz propia", estilos),
            _tarjeta_resumen("Año personal", _texto(anio.get("numero")), "Clima del ciclo actual", estilos),
        ],
        [56 * mm, 56 * mm, 56 * mm],
    )
    tarjetas_2 = _fila_tarjetas(
        [
            _tarjeta_resumen("Impulso del alma", _texto(alma.get("numero")), "Deseo interno y motivación", estilos),
            _tarjeta_resumen("Personalidad", _texto(personalidad.get("numero")), "Imagen que otros reciben", estilos),
            _tarjeta_resumen(
                "Números maestros",
                ", ".join(str(numero) for numero in maestros) if maestros else "Ninguno",
                "Resonancias de alta intensidad",
                estilos,
            ),
        ],
        [56 * mm, 56 * mm, 56 * mm],
    )

    elementos.extend([Spacer(1, 5 * mm), KeepTogether([tarjetas_1, Spacer(1, 3.5 * mm), tarjetas_2]), Spacer(1, 6 * mm)])

    filas = []
    for etiqueta, clave in [
        ("Camino de Vida", "camino_de_vida"),
        ("Expresión", "expresion"),
        ("Impulso del Alma", "impulso_del_alma"),
        ("Personalidad", "personalidad"),
        ("Número de Nacimiento", "numero_nacimiento"),
        ("Año Personal", "anio_personal"),
    ]:
        dato = num.get(clave, {})
        if dato:
            filas.append(
                [
                    etiqueta,
                    _texto(dato.get("numero")),
                    _texto(dato.get("descripcion"), "Sin descripción disponible"),
                ]
            )

    sistema = _texto(num.get("sistema", "pitagórico")).capitalize()
    elementos.extend([_bloque_titulo(f"Números clave · Sistema {sistema}", estilos), Spacer(1, 2 * mm)])
    if filas:
        elementos.append(
            _tabla_estilizada(
                ["Número", "Valor", "Descripción"],
                filas,
                [48 * mm, 20 * mm, 100 * mm],
                estilos,
                columnas_centradas=[1],
            )
        )

    if maestros:
        elementos.extend(
            [
                Spacer(1, 5 * mm),
                CajaEditorial(
                    [
                        Paragraph("NÚMEROS MAESTROS", estilos["kicker"]),
                        Paragraph(", ".join(str(numero) for numero in maestros), estilos["titulo_seccion"]),
                        Paragraph(
                            "Estos números no se reducen y concentran una capa extra de intensidad simbólica dentro del perfil.",
                            estilos["texto_auxiliar"],
                        ),
                    ],
                    ancho=ANCHO_UTIL,
                    fondo=COLOR_LILA,
                    borde=COLOR_BORDE,
                    radio=6 * mm,
                    relleno_horizontal=8 * mm,
                    relleno_vertical=5.2 * mm,
                    separacion=1.5 * mm,
                    barra_acento=COLOR_ESMERALDA,
                    ancho_barra=3 * mm,
                ),
            ]
        )

    return elementos


def _dibujar_fondo_portada(lienzo, documento, generado_en: datetime):
    lienzo.saveState()
    lienzo.setTitle("Perfil Cósmico ASTRA")
    lienzo.setAuthor("ASTRA")
    lienzo.setSubject("Perfil integrado de astrología, diseño humano y numerología")
    lienzo.setCreator("ASTRA · CosmicEngine")

    lienzo.setFillColor(COLOR_CIRUELA)
    lienzo.rect(0, 0, ANCHO_PAGINA, ALTO_PAGINA, fill=1, stroke=0)

    lienzo.setFillColor(COLOR_CIRUELA_MEDIA)
    lienzo.circle(ANCHO_PAGINA - 18 * mm, ALTO_PAGINA - 20 * mm, 42 * mm, fill=1, stroke=0)
    lienzo.setFillColor(COLOR_VIOLETA)
    lienzo.circle(25 * mm, 48 * mm, 28 * mm, fill=1, stroke=0)
    lienzo.setStrokeColor(COLOR_DORADO)
    lienzo.setLineWidth(1.2)
    lienzo.line(18 * mm, ALTO_PAGINA - 42 * mm, ANCHO_PAGINA - 18 * mm, ALTO_PAGINA - 42 * mm)

    lienzo.setStrokeColor(COLOR_VIOLETA_CLARO)
    lienzo.setLineWidth(0.6)
    for radio in (11 * mm, 20 * mm, 29 * mm):
        lienzo.circle(ANCHO_PAGINA - 35 * mm, 60 * mm, radio, fill=0, stroke=1)

    lienzo.setFillColor(colors.white)
    for pos_x, pos_y, radio in [
        (30 * mm, ALTO_PAGINA - 30 * mm, 1.4 * mm),
        (38 * mm, ALTO_PAGINA - 25 * mm, 1.1 * mm),
        (46 * mm, ALTO_PAGINA - 31 * mm, 1.0 * mm),
        (54 * mm, ALTO_PAGINA - 24 * mm, 0.9 * mm),
    ]:
        lienzo.circle(pos_x, pos_y, radio, fill=1, stroke=0)

    lienzo.setFillColor(COLOR_TEXTO_CLARO_SUAVE)
    lienzo.setFont("Helvetica", 8.5)
    lienzo.drawRightString(ANCHO_PAGINA - 18 * mm, 12 * mm, generado_en.strftime("%d/%m/%Y · %H:%M"))
    lienzo.restoreState()


def _dibujar_fondo_interno(lienzo, documento, generado_en: datetime):
    lienzo.saveState()
    lienzo.setFillColor(colors.white)
    lienzo.rect(0, 0, ANCHO_PAGINA, ALTO_PAGINA, fill=1, stroke=0)

    lienzo.setFillColor(COLOR_LILA)
    lienzo.roundRect(15 * mm, ALTO_PAGINA - 27 * mm, ANCHO_PAGINA - 30 * mm, 13 * mm, 5 * mm, fill=1, stroke=0)
    lienzo.setFillColor(colors.HexColor("#EEE7FF"))
    lienzo.circle(ANCHO_PAGINA - 20 * mm, ALTO_PAGINA - 10 * mm, 14 * mm, fill=1, stroke=0)

    lienzo.setFillColor(COLOR_CIRUELA)
    lienzo.setFont("Helvetica-Bold", 10)
    lienzo.drawString(22 * mm, ALTO_PAGINA - 20 * mm, "ASTRA · Perfil Cósmico")

    lienzo.setFillColor(COLOR_TEXTO_SUAVE)
    lienzo.setFont("Helvetica", 8.4)
    lienzo.drawRightString(ANCHO_PAGINA - 22 * mm, ALTO_PAGINA - 20 * mm, generado_en.strftime("%d/%m/%Y · %H:%M"))

    lienzo.setStrokeColor(COLOR_BORDE)
    lienzo.setLineWidth(0.5)
    lienzo.line(18 * mm, 17 * mm, ANCHO_PAGINA - 18 * mm, 17 * mm)

    lienzo.setFillColor(COLOR_TEXTO_SUAVE)
    lienzo.drawString(18 * mm, 10.5 * mm, "Documento generado por ASTRA · CosmicEngine")
    lienzo.drawRightString(ANCHO_PAGINA - 18 * mm, 10.5 * mm, f"Página {lienzo.getPageNumber():02d}")
    lienzo.restoreState()


class ServicioPDFPerfil:
    """Genera un PDF completo con el perfil cósmico del usuario."""

    @staticmethod
    def generar(perfil: dict, calculos: dict) -> io.BytesIO:
        """Genera el PDF y retorna un buffer BytesIO listo para enviar."""
        buffer = io.BytesIO()
        generado_en = datetime.now()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=24 * mm,
            bottomMargin=22 * mm,
        )

        estilos = _estilos()
        elementos: list[Flowable] = []

        elementos.extend(_portada(perfil, calculos, estilos, generado_en))
        elementos.extend(_seccion_carta_astral(calculos.get("natal"), estilos))
        elementos.extend(_seccion_diseno_humano(calculos.get("diseno_humano"), estilos))
        elementos.extend(_seccion_numerologia(calculos.get("numerologia"), estilos))

        def primera_pagina(lienzo, documento):
            _dibujar_fondo_portada(lienzo, documento, generado_en)

        def paginas_internas(lienzo, documento):
            _dibujar_fondo_interno(lienzo, documento, generado_en)

        doc.build(elementos, onFirstPage=primera_pagina, onLaterPages=paginas_internas)
        buffer.seek(0)
        return buffer
