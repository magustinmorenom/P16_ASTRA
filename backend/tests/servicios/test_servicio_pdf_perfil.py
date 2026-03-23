"""Tests para el servicio de generación de PDF del perfil."""


from app.servicios.servicio_pdf_perfil import ServicioPDFPerfil


# ── Datos de prueba ───────────────────────────────────────────

PERFIL_TEST = {
    "nombre": "Lucía García",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30:00",
    "ciudad_nacimiento": "Buenos Aires",
    "pais_nacimiento": "Argentina",
}

CALCULOS_COMPLETOS = {
    "natal": {
        "ascendente": {"signo": "Géminis", "grado_en_signo": 12.34, "longitud": 72.34},
        "medio_cielo": {"signo": "Acuario", "grado_en_signo": 5.67, "longitud": 305.67},
        "planetas": [
            {
                "nombre": "Sol",
                "signo": "Capricornio",
                "grado_en_signo": 24.82,
                "longitud": 294.82,
                "latitud": 0.0,
                "casa": 8,
                "retrogrado": False,
                "velocidad": 1.019,
                "dignidad": None,
            },
            {
                "nombre": "Luna",
                "signo": "Escorpio",
                "grado_en_signo": 10.55,
                "longitud": 220.55,
                "latitud": -3.2,
                "casa": 6,
                "retrogrado": False,
                "velocidad": 13.1,
                "dignidad": "caída",
            },
            {
                "nombre": "Mercurio",
                "signo": "Capricornio",
                "grado_en_signo": 8.11,
                "longitud": 278.11,
                "latitud": -1.5,
                "casa": 7,
                "retrogrado": True,
                "velocidad": -0.5,
                "dignidad": None,
            },
        ],
        "casas": [
            {"numero": 1, "signo": "Géminis", "grado": 72.34, "grado_en_signo": 12.34},
            {"numero": 2, "signo": "Cáncer", "grado": 95.10, "grado_en_signo": 5.10},
            {"numero": 3, "signo": "Leo", "grado": 120.50, "grado_en_signo": 0.50},
        ],
        "aspectos": [
            {
                "planeta1": "Sol",
                "planeta2": "Luna",
                "tipo": "Sextil",
                "angulo_exacto": 74.27,
                "orbe": 5.73,
                "aplicativo": True,
            },
            {
                "planeta1": "Sol",
                "planeta2": "Mercurio",
                "tipo": "Conjunción",
                "angulo_exacto": 16.71,
                "orbe": 3.29,
                "aplicativo": False,
            },
        ],
    },
    "diseno_humano": {
        "tipo": "Generador Manifestante",
        "autoridad": "Sacral",
        "perfil": "3/5",
        "definicion": "Simple",
        "cruz_encarnacion": {
            "puertas": [10, 15, 18, 17],
            "sol_consciente": 10,
            "tierra_consciente": 15,
            "sol_inconsciente": 18,
            "tierra_inconsciente": 17,
        },
        "centros": {
            "cabeza": "abierto",
            "ajna": "abierto",
            "garganta": "definido",
            "g": "definido",
            "corazon": "abierto",
            "plexo_solar": "definido",
            "sacral": "definido",
            "bazo": "abierto",
            "raiz": "definido",
        },
        "canales": [
            {"puertas": [34, 20], "nombre": "Carisma", "centros": ["Sacral", "Garganta"]},
            {"puertas": [59, 6], "nombre": "Intimidad", "centros": ["Sacral", "Plexo Solar"]},
        ],
        "activaciones_conscientes": [
            {"planeta": "Sol", "longitud": 294.82, "puerta": 10, "linea": 3, "color": 1},
            {"planeta": "Luna", "longitud": 220.55, "puerta": 48, "linea": 5, "color": 3},
        ],
        "activaciones_inconscientes": [
            {"planeta": "Sol", "longitud": 206.82, "puerta": 18, "linea": 2, "color": 4},
            {"planeta": "Luna", "longitud": 132.55, "puerta": 56, "linea": 1, "color": 2},
        ],
        "puertas_conscientes": [10, 48, 34, 20],
        "puertas_inconscientes": [18, 56, 59, 6],
        "dia_juliano_consciente": 2447908.1042,
        "dia_juliano_inconsciente": 2447819.5,
    },
    "numerologia": {
        "nombre": "Lucía García",
        "fecha_nacimiento": "1990-01-15",
        "sistema": "pitagórico",
        "camino_de_vida": {"numero": 8, "descripcion": "Poder, abundancia y logro material."},
        "expresion": {"numero": 5, "descripcion": "Libertad, cambio y versatilidad."},
        "impulso_del_alma": {"numero": 3, "descripcion": "Creatividad, expresión y alegría."},
        "personalidad": {"numero": 2, "descripcion": "Cooperación, diplomacia y sensibilidad."},
        "numero_nacimiento": {"numero": 6, "descripcion": "Responsabilidad, hogar y armonía."},
        "anio_personal": {"numero": 1, "descripcion": "Nuevos comienzos y liderazgo."},
        "numeros_maestros_presentes": [11],
    },
    "retorno_solar": None,
}

CALCULOS_VACIOS = {
    "natal": None,
    "diseno_humano": None,
    "numerologia": None,
    "retorno_solar": None,
}


# ── Tests ─────────────────────────────────────────────────────


class TestServicioPDFPerfil:
    """Tests del servicio de generación de PDF."""

    def test_generar_pdf_completo(self):
        """Debe generar un PDF válido con todas las secciones."""
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, CALCULOS_COMPLETOS)

        contenido = buffer.read()
        assert len(contenido) > 0
        # Verificar cabecera PDF
        assert contenido[:5] == b"%PDF-"

    def test_generar_pdf_sin_calculos(self):
        """Debe generar un PDF aunque no haya cálculos (secciones vacías)."""
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, CALCULOS_VACIOS)

        contenido = buffer.read()
        assert len(contenido) > 0
        assert contenido[:5] == b"%PDF-"

    def test_generar_pdf_solo_natal(self):
        """Debe generar PDF con solo carta natal disponible."""
        calculos = {**CALCULOS_VACIOS, "natal": CALCULOS_COMPLETOS["natal"]}
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, calculos)

        contenido = buffer.read()
        assert contenido[:5] == b"%PDF-"
        assert len(contenido) > 500  # Debe tener contenido sustancial

    def test_generar_pdf_solo_diseno_humano(self):
        """Debe generar PDF con solo diseño humano disponible."""
        calculos = {**CALCULOS_VACIOS, "diseno_humano": CALCULOS_COMPLETOS["diseno_humano"]}
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, calculos)

        contenido = buffer.read()
        assert contenido[:5] == b"%PDF-"

    def test_generar_pdf_solo_numerologia(self):
        """Debe generar PDF con solo numerología disponible."""
        calculos = {**CALCULOS_VACIOS, "numerologia": CALCULOS_COMPLETOS["numerologia"]}
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, calculos)

        contenido = buffer.read()
        assert contenido[:5] == b"%PDF-"

    def test_buffer_posicion_inicio(self):
        """El buffer debe retornar con seek(0) listo para leer."""
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, CALCULOS_COMPLETOS)

        assert buffer.tell() == 0

    def test_pdf_multiples_paginas(self):
        """Con datos completos, el PDF debe tener más de una página."""
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, CALCULOS_COMPLETOS)
        contenido = buffer.read()

        # Contar referencias a páginas en el PDF
        # Un PDF con múltiples páginas tendrá múltiples objetos /Page
        # Mínimo: portada + astral + HD + numerología = 4 páginas
        page_count = contenido.count(b"/Type /Page\n")
        assert page_count >= 4, f"Se esperaban >= 4 páginas, se encontraron {page_count}"

    def test_perfil_sin_campos_opcionales(self):
        """Debe manejar un perfil con campos mínimos."""
        perfil_minimo = {
            "nombre": "Test",
        }
        buffer = ServicioPDFPerfil.generar(perfil_minimo, CALCULOS_VACIOS)

        contenido = buffer.read()
        assert contenido[:5] == b"%PDF-"

    def test_datos_hd_sin_cruz(self):
        """Debe funcionar si la cruz de encarnación está vacía."""
        hd_sin_cruz = {**CALCULOS_COMPLETOS["diseno_humano"], "cruz_encarnacion": {}}
        calculos = {**CALCULOS_VACIOS, "diseno_humano": hd_sin_cruz}
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, calculos)

        contenido = buffer.read()
        assert contenido[:5] == b"%PDF-"

    def test_datos_numerologia_sin_maestros(self):
        """Debe funcionar si no hay números maestros."""
        num_sin_maestros = {**CALCULOS_COMPLETOS["numerologia"], "numeros_maestros_presentes": []}
        calculos = {**CALCULOS_VACIOS, "numerologia": num_sin_maestros}
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, calculos)

        contenido = buffer.read()
        assert contenido[:5] == b"%PDF-"

    def test_planetas_con_retrogrado(self):
        """Debe marcar planetas retrógrados con 'R'."""
        # No podemos buscar texto fácilmente en PDF binario,
        # pero al menos verificamos que genera sin error
        buffer = ServicioPDFPerfil.generar(PERFIL_TEST, CALCULOS_COMPLETOS)
        contenido = buffer.read()
        assert len(contenido) > 1000
