"""Tests para el detector de intent temporal."""

from app.oraculo.detector_intent import IntentTemporal, detectar_intent


class TestDetectorIntentBasico:
    """Tests de detección vs no-detección."""

    def test_mensaje_normal_no_temporal(self):
        result = detectar_intent("¿Cómo soy según mi carta natal?")
        assert result.es_temporal is False

    def test_saludo_no_temporal(self):
        result = detectar_intent("Hola, ¿cómo estás?")
        assert result.es_temporal is False

    def test_mejor_dia_es_temporal(self):
        result = detectar_intent("¿Cuál es el mejor día para viajar?")
        assert result.es_temporal is True

    def test_cuando_deberia_es_temporal(self):
        result = detectar_intent("¿Cuándo debería lanzar mi negocio?")
        assert result.es_temporal is True

    def test_buen_momento_es_temporal(self):
        result = detectar_intent("¿Es buen momento para invertir?")
        assert result.es_temporal is True


class TestDetectorVentana:
    """Tests de detección de ventana temporal."""

    def test_esta_semana(self):
        result = detectar_intent("¿Cuál es el mejor día esta semana para presentar?")
        assert result.ventana_dias == 7

    def test_este_mes(self):
        result = detectar_intent("¿Cuándo me conviene viajar este mes?")
        assert result.ventana_dias == 30

    def test_mes_especifico(self):
        result = detectar_intent("¿Cuál es el mejor momento en junio para mudarme?")
        assert result.mes_especifico == 6
        assert result.ventana_dias == 30

    def test_semestre(self):
        result = detectar_intent("¿Cuál es el mejor mes del semestre para emprender?")
        assert result.ventana_dias == 180
        assert result.granularidad == "mes"

    def test_anio(self):
        result = detectar_intent("¿Cuál es el mejor mes de este año para viajar?")
        assert result.ventana_dias == 365
        assert result.granularidad == "mes"

    def test_anio_especifico(self):
        result = detectar_intent("¿Cuándo me conviene invertir en 2027?")
        assert result.anio == 2027

    def test_default_30_dias(self):
        result = detectar_intent("¿Cuál es el mejor día para firmar?")
        assert result.ventana_dias == 30


class TestDetectorArea:
    """Tests de detección de área de vida."""

    def test_carrera(self):
        result = detectar_intent("¿Cuándo debería lanzar mi proyecto?")
        assert result.area == "carrera"

    def test_viajes(self):
        result = detectar_intent("¿Cuál es el mejor momento para viajar?")
        assert result.area == "viajes"

    def test_amor(self):
        result = detectar_intent("¿Cuándo es buen momento para buscar pareja?")
        assert result.area == "amor"

    def test_finanzas(self):
        result = detectar_intent("¿Cuál es el mejor día para invertir en cripto?")
        assert result.area == "finanzas"

    def test_comunicacion(self):
        result = detectar_intent("¿Cuándo debería publicar mi libro?")
        assert result.area == "comunicacion"

    def test_contratos(self):
        result = detectar_intent("¿Cuál es el mejor momento para firmar el contrato?")
        assert result.area == "contratos"

    def test_sin_area_retorna_none(self):
        result = detectar_intent("¿Cuál es el mejor día para esto?")
        assert result.area is None

    def test_salud(self):
        result = detectar_intent("¿Cuándo me conviene operarme?")
        assert result.area == "salud"
