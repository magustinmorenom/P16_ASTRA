"""Tests para el servicio de retorno solar."""


from app.servicios.servicio_retorno_solar import ServicioRetornoSolar

# JD para 1990-01-15 16:30 UTC
JD_TEST = 2447908.1875


class TestRetornoSolar:
    """Tests del servicio de retorno solar."""

    def test_retorno_solar_basico(self):
        """Retorno solar debe devolver carta completa."""
        resultado = ServicioRetornoSolar.calcular_retorno_solar(
            JD_TEST, 2025, -34.6037, -58.3816
        )
        assert "carta_retorno" in resultado
        assert "fecha_retorno" in resultado
        assert resultado["anio"] == 2025

    def test_sol_retorno_igual_natal(self):
        """El Sol en el retorno debe estar en la misma posición que el natal."""
        resultado = ServicioRetornoSolar.calcular_retorno_solar(
            JD_TEST, 2025, -34.6037, -58.3816
        )
        error = resultado["error_grados"]
        assert error < 0.01  # Menos de 0.01°

    def test_retorno_tiene_aspectos_comparativos(self):
        resultado = ServicioRetornoSolar.calcular_retorno_solar(
            JD_TEST, 2025, -34.6037, -58.3816
        )
        assert "aspectos_natal_retorno" in resultado
        assert isinstance(resultado["aspectos_natal_retorno"], list)

    def test_retorno_diferentes_anios(self):
        """Retornos de años distintos deben tener fechas distintas."""
        r2024 = ServicioRetornoSolar.calcular_retorno_solar(
            JD_TEST, 2024, -34.6037, -58.3816
        )
        r2025 = ServicioRetornoSolar.calcular_retorno_solar(
            JD_TEST, 2025, -34.6037, -58.3816
        )
        assert r2024["dia_juliano_retorno"] != r2025["dia_juliano_retorno"]
