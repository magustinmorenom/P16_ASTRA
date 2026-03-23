"""Tests para el servicio astrológico."""


from app.servicios.servicio_astro import ServicioAstro


# JD para 1990-01-15 14:30 UTC (aprox)
JD_TEST = 2447908.1042


class TestServicioAstro:
    """Tests del servicio astrológico."""

    def test_calcular_carta_natal_completa(self):
        """Carta natal debe devolver planetas, casas y aspectos."""
        carta = ServicioAstro.calcular_carta_natal(
            JD_TEST, -34.6037, -58.3816
        )
        assert "planetas" in carta
        assert "casas" in carta
        assert "aspectos" in carta
        assert "ascendente" in carta
        assert "medio_cielo" in carta

    def test_planetas_tienen_campos_requeridos(self):
        carta = ServicioAstro.calcular_carta_natal(
            JD_TEST, -34.6037, -58.3816
        )
        for p in carta["planetas"]:
            assert "nombre" in p
            assert "longitud" in p
            assert "signo" in p
            assert "casa" in p
            assert "retrogrado" in p
            assert 1 <= p["casa"] <= 12
            assert 0 <= p["longitud"] < 360

    def test_doce_casas(self):
        carta = ServicioAstro.calcular_carta_natal(
            JD_TEST, -34.6037, -58.3816
        )
        assert len(carta["casas"]) == 12
        for c in carta["casas"]:
            assert 1 <= c["numero"] <= 12
            assert 0 <= c["grado"] < 360

    def test_aspectos_validos(self):
        carta = ServicioAstro.calcular_carta_natal(
            JD_TEST, -34.6037, -58.3816
        )
        for a in carta["aspectos"]:
            assert a["tipo"] in [
                "Conjunción", "Sextil", "Cuadratura", "Trígono", "Oposición"
            ]
            assert a["orbe"] >= 0
            assert isinstance(a["aplicativo"], bool)

    def test_dignidades(self):
        """Verificar que las dignidades se asignan correctamente."""
        carta = ServicioAstro.calcular_carta_natal(
            JD_TEST, -34.6037, -58.3816
        )
        dignidades_posibles = {None, "domicilio", "exaltación", "caída", "exilio"}
        for p in carta["planetas"]:
            assert p["dignidad"] in dignidades_posibles

    def test_sistema_casas_koch(self):
        carta = ServicioAstro.calcular_carta_natal(
            JD_TEST, -34.6037, -58.3816, sistema_casas="koch"
        )
        assert carta["sistema_casas"] == "Koch"
