"""Tests para el servicio de efemérides."""


from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.utilidades.constantes import ID_SOL, ID_LUNA, ID_JUPITER


# J2000.0 = 2000-01-01T12:00 UTC
JD_J2000 = 2451545.0


class TestServicioEfemerides:
    """Tests del servicio de efemérides."""

    def test_posicion_sol_j2000(self):
        """Sol en J2000.0 debe estar ~280.37° (Capricornio)."""
        pos = ServicioEfemerides.calcular_posicion_planeta(JD_J2000, ID_SOL)
        assert abs(pos.longitud - 280.37) < 0.1
        assert pos.signo == "Capricornio"
        assert pos.nombre == "Sol"
        assert not pos.retrogrado

    def test_posicion_luna_j2000(self):
        """Luna en J2000.0 — verificar que calcula."""
        pos = ServicioEfemerides.calcular_posicion_planeta(JD_J2000, ID_LUNA)
        assert 0 <= pos.longitud < 360
        assert pos.nombre == "Luna"

    def test_todos_los_planetas(self):
        """Debe calcular 11 cuerpos (10 planetas + nodo norte)."""
        planetas = ServicioEfemerides.calcular_todos_los_planetas(JD_J2000)
        assert len(planetas) == 11

    def test_planetas_sin_nodos(self):
        """Sin nodos debe calcular 10 planetas."""
        planetas = ServicioEfemerides.calcular_todos_los_planetas(
            JD_J2000, incluir_nodos=False
        )
        assert len(planetas) == 10

    def test_calcular_casas_placidus(self):
        """Casas Placidus para Buenos Aires."""
        casas = ServicioEfemerides.calcular_casas(
            JD_J2000, -34.6037, -58.3816
        )
        assert len(casas.cuspides) == 12
        assert casas.sistema == "Placidus"
        assert 0 <= casas.ascendente < 360
        assert 0 <= casas.medio_cielo < 360

    def test_busqueda_longitud_solar(self):
        """Buscar JD para longitud solar conocida."""
        # Sol en J2000.0 ≈ 280.37°
        lon_objetivo = 280.37
        jd_encontrado = ServicioEfemerides.buscar_fecha_por_longitud_solar(
            lon_objetivo, JD_J2000, precision=0.001
        )
        # Verificar que el sol está en esa longitud
        lon_verificacion = ServicioEfemerides.obtener_longitud_solar(jd_encontrado)
        assert abs(lon_verificacion - lon_objetivo) < 0.01

    def test_determinar_casa(self):
        """Test de asignación de casa."""
        cuspides = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
        assert ServicioEfemerides.determinar_casa(15.0, cuspides) == 1
        assert ServicioEfemerides.determinar_casa(45.0, cuspides) == 2
        assert ServicioEfemerides.determinar_casa(315.0, cuspides) == 11

    def test_retrogrado_jupiter(self):
        """Verificar que el campo retrogrado se calcula."""
        pos = ServicioEfemerides.calcular_posicion_planeta(JD_J2000, ID_JUPITER)
        assert isinstance(pos.retrogrado, bool)
