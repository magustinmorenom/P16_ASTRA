"""Tests para el cálculo de eventos notables."""

from app.servicios.servicio_transitos_persistidos import calcular_eventos


class TestCalcularEventos:

    def _planetas_base(self) -> list[dict]:
        return [
            {"nombre": "Sol", "longitud": 84.0, "signo": "Géminis", "retrogrado": False, "velocidad": 1.0},
            {"nombre": "Luna", "longitud": 200.0, "signo": "Libra", "retrogrado": False, "velocidad": 13.0},
            {"nombre": "Mercurio", "longitud": 90.0, "signo": "Cáncer", "retrogrado": False, "velocidad": 1.5},
            {"nombre": "Venus", "longitud": 45.0, "signo": "Tauro", "retrogrado": False, "velocidad": 1.2},
        ]

    def test_sin_dia_anterior(self):
        """Sin día anterior, solo detecta aspectos exactos."""
        planetas = self._planetas_base()
        eventos = calcular_eventos(planetas, None, "Creciente")
        assert "cambios_signo" in eventos
        assert "retrogrados_inicio" in eventos
        assert len(eventos["cambios_signo"]) == 0

    def test_detecta_cambio_signo(self):
        ayer = self._planetas_base()
        hoy = self._planetas_base()
        hoy[2]["signo"] = "Leo"  # Mercurio cambió de Cáncer a Leo

        eventos = calcular_eventos(hoy, ayer, "Creciente")
        assert len(eventos["cambios_signo"]) == 1
        assert eventos["cambios_signo"][0]["planeta"] == "Mercurio"
        assert eventos["cambios_signo"][0]["de"] == "Cáncer"
        assert eventos["cambios_signo"][0]["a"] == "Leo"

    def test_detecta_inicio_retrogradacion(self):
        ayer = self._planetas_base()
        hoy = self._planetas_base()
        hoy[2]["retrogrado"] = True  # Mercurio ahora retrógrado

        eventos = calcular_eventos(hoy, ayer, "Creciente")
        assert "Mercurio" in eventos["retrogrados_inicio"]
        assert len(eventos["retrogrados_fin"]) == 0

    def test_detecta_fin_retrogradacion(self):
        ayer = self._planetas_base()
        ayer[2]["retrogrado"] = True  # Mercurio era retrógrado
        hoy = self._planetas_base()  # Mercurio ahora directo

        eventos = calcular_eventos(hoy, ayer, "Creciente")
        assert "Mercurio" in eventos["retrogrados_fin"]
        assert len(eventos["retrogrados_inicio"]) == 0

    def test_detecta_fase_principal(self):
        planetas = self._planetas_base()
        eventos = calcular_eventos(planetas, planetas, "Luna Nueva")
        assert eventos["fases"] == "Luna Nueva"

    def test_ignora_fase_intermedia(self):
        planetas = self._planetas_base()
        eventos = calcular_eventos(planetas, planetas, "Creciente")
        assert eventos["fases"] is None

    def test_detecta_aspecto_exacto(self):
        """Dos planetas en conjunción exacta (orbe < 1°)."""
        hoy = [
            {"nombre": "Sol", "longitud": 84.0, "signo": "Géminis", "retrogrado": False, "velocidad": 1.0},
            {"nombre": "Luna", "longitud": 84.5, "signo": "Géminis", "retrogrado": False, "velocidad": 13.0},
        ]
        eventos = calcular_eventos(hoy, None, "Creciente")
        assert len(eventos["aspectos_exactos"]) > 0
        assert eventos["aspectos_exactos"][0]["tipo"] == "Conjunción"

    def test_sin_cambios_retorna_vacio(self):
        planetas = self._planetas_base()
        eventos = calcular_eventos(planetas, planetas, "Creciente")
        assert len(eventos["cambios_signo"]) == 0
        assert len(eventos["retrogrados_inicio"]) == 0
        assert len(eventos["retrogrados_fin"]) == 0
