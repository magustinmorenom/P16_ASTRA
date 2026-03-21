"""Tests para el servicio de tránsitos."""

import pytest

from app.servicios.servicio_transitos import ServicioTransitos


class TestTransitos:
    """Tests del servicio de tránsitos."""

    def test_transitos_actuales(self):
        """Debe devolver posiciones de todos los planetas."""
        resultado = ServicioTransitos.obtener_transitos_actuales()
        assert "planetas" in resultado
        assert "fecha_utc" in resultado
        assert "dia_juliano" in resultado
        # 11 cuerpos (10 planetas + nodo norte)
        assert len(resultado["planetas"]) == 11

    def test_planetas_transito_tienen_campos(self):
        resultado = ServicioTransitos.obtener_transitos_actuales()
        for p in resultado["planetas"]:
            assert "nombre" in p
            assert "longitud" in p
            assert "signo" in p
            assert 0 <= p["longitud"] < 360

    def test_aspectos_transito_natal(self):
        """Debe calcular aspectos entre tránsitos y carta natal."""
        JD_TEST = 2447908.1875
        resultado = ServicioTransitos.calcular_aspectos_transito_natal(
            JD_TEST, -34.6037, -58.3816
        )
        assert "aspectos_natal" in resultado
        assert isinstance(resultado["aspectos_natal"], list)
