"""Tests para el Calendario Cósmico (tránsitos por fecha y rango)."""

import pytest

from app.servicios.servicio_transitos import ServicioTransitos


class TestCalendarioCosmico:
    """Tests de tránsitos por fecha y rango."""

    def test_transitos_fecha_devuelve_planetas(self):
        """Debe devolver 11 planetas para una fecha específica."""
        resultado = ServicioTransitos.obtener_transitos_fecha("2026-03-23")
        assert "planetas" in resultado
        assert len(resultado["planetas"]) == 11
        assert resultado["fecha"] == "2026-03-23"

    def test_transitos_fecha_determinista(self):
        """Misma fecha debe devolver exactamente el mismo resultado."""
        r1 = ServicioTransitos.obtener_transitos_fecha("2000-01-01")
        r2 = ServicioTransitos.obtener_transitos_fecha("2000-01-01")
        assert r1["dia_juliano"] == r2["dia_juliano"]
        for p1, p2 in zip(r1["planetas"], r2["planetas"]):
            assert p1["longitud"] == p2["longitud"]
            assert p1["signo"] == p2["signo"]

    def test_transitos_rango_7_dias(self):
        """Rango de 7 días debe retornar 7 items."""
        resultado = ServicioTransitos.obtener_transitos_rango("2026-03-23", "2026-03-29")
        assert len(resultado["dias"]) == 7
        assert resultado["fecha_inicio"] == "2026-03-23"
        assert resultado["fecha_fin"] == "2026-03-29"

    def test_transitos_rango_limite_31_dias(self):
        """Rango mayor a 31 días debe lanzar ValueError."""
        with pytest.raises(ValueError, match="31 días"):
            ServicioTransitos.obtener_transitos_rango("2026-01-01", "2026-03-01")

    def test_transitos_fecha_mediodia_utc(self):
        """La fecha UTC debe ser a mediodía (12:00:00)."""
        resultado = ServicioTransitos.obtener_transitos_fecha("2026-06-15")
        assert "T12:00:00" in resultado["fecha_utc"]
