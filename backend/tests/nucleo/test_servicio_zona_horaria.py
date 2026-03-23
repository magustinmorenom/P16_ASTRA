"""Tests para el servicio de zona horaria."""

from datetime import date, time


from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria


class TestServicioZonaHoraria:
    """Tests del servicio de zona horaria."""

    def test_obtener_zona_horaria_buenos_aires(self):
        zona = ServicioZonaHoraria.obtener_zona_horaria(-34.6037, -58.3816)
        assert "Buenos_Aires" in zona

    def test_obtener_zona_horaria_madrid(self):
        zona = ServicioZonaHoraria.obtener_zona_horaria(40.4168, -3.7038)
        assert "Madrid" in zona or "Europe" in zona

    def test_convertir_a_utc_argentina(self):
        """Argentina enero 1990 — horario de verano UTC-2."""
        utc = ServicioZonaHoraria.convertir_a_utc(
            date(1990, 1, 15),
            time(14, 30),
            "America/Argentina/Buenos_Aires",
        )
        # Argentina en enero 1990 observaba horario de verano (UTC-2)
        assert utc.hour == 16
        assert utc.minute == 30

    def test_convertir_a_utc_espana_verano(self):
        """España en verano = UTC+2 (CEST)."""
        utc = ServicioZonaHoraria.convertir_a_utc(
            date(1990, 7, 15),
            time(12, 0),
            "Europe/Madrid",
        )
        assert utc.hour == 10

    def test_calcular_dia_juliano_j2000(self):
        """J2000.0 = 2451545.0 (2000-01-01T12:00 UTC)."""
        from datetime import datetime
        import pytz

        dt_utc = datetime(2000, 1, 1, 12, 0, 0, tzinfo=pytz.UTC)
        jd = ServicioZonaHoraria.calcular_dia_juliano(dt_utc)
        assert abs(jd - 2451545.0) < 0.001

    def test_resolver_completo(self):
        """Pipeline completo: fecha+hora+coords → UTC + JD + zona."""
        utc, jd, zona = ServicioZonaHoraria.resolver_completo(
            date(1990, 1, 15),
            "14:30",
            -34.6037,
            -58.3816,
        )
        assert "Buenos_Aires" in zona
        assert utc.hour == 16
        assert jd > 2440000  # Razonabilidad
