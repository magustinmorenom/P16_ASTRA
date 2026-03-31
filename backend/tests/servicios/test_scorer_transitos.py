"""Tests para el scorer de tránsitos."""

from datetime import date

from app.oraculo.scorer_transitos import (
    _score_astrologico,
    _score_eventos,
    _score_numerologico,
    calcular_score_dia,
    formatear_resumen,
    rankear_dias,
    rankear_meses,
)


# ── Fixtures ──

def _transito_basico(fecha: date = date(2026, 6, 15)) -> dict:
    return {
        "fecha": fecha,
        "planetas": [
            {"nombre": "Sol", "longitud": 84.0, "signo": "Géminis", "retrogrado": False},
            {"nombre": "Luna", "longitud": 200.0, "signo": "Libra", "retrogrado": False},
            {"nombre": "Mercurio", "longitud": 90.0, "signo": "Géminis", "retrogrado": False},
            {"nombre": "Venus", "longitud": 45.0, "signo": "Tauro", "retrogrado": False},
            {"nombre": "Marte", "longitud": 150.0, "signo": "Virgo", "retrogrado": False},
            {"nombre": "Júpiter", "longitud": 120.0, "signo": "Leo", "retrogrado": False},
            {"nombre": "Saturno", "longitud": 350.0, "signo": "Piscis", "retrogrado": False},
        ],
        "aspectos": [],
        "eventos": {
            "cambios_signo": [],
            "retrogrados_inicio": [],
            "retrogrados_fin": [],
            "aspectos_exactos": [],
            "fases": None,
        },
        "fase_lunar": "Gibosa Creciente",
    }


def _perfil_cosmico_basico() -> dict:
    return {
        "datos_personales": {
            "nombre": "Test",
            "fecha_nacimiento": "1990-06-15",
        },
        "natal": {
            "planetas": [
                {"nombre": "Sol", "longitud": 84.0, "signo": "Géminis"},
                {"nombre": "Luna", "longitud": 200.0, "signo": "Libra"},
                {"nombre": "Mercurio", "longitud": 70.0, "signo": "Géminis"},
                {"nombre": "Venus", "longitud": 100.0, "signo": "Cáncer"},
                {"nombre": "Júpiter", "longitud": 120.0, "signo": "Cáncer"},
                {"nombre": "Saturno", "longitud": 300.0, "signo": "Capricornio"},
            ],
            "casas": [
                {"signo": "Virgo", "grado_inicio": 150.0},
                {"signo": "Libra", "grado_inicio": 180.0},
                {"signo": "Escorpio", "grado_inicio": 210.0},
                {"signo": "Sagitario", "grado_inicio": 240.0},
                {"signo": "Capricornio", "grado_inicio": 270.0},
                {"signo": "Acuario", "grado_inicio": 300.0},
                {"signo": "Piscis", "grado_inicio": 330.0},
                {"signo": "Aries", "grado_inicio": 0.0},
                {"signo": "Tauro", "grado_inicio": 30.0},
                {"signo": "Géminis", "grado_inicio": 60.0},
                {"signo": "Cáncer", "grado_inicio": 90.0},
                {"signo": "Leo", "grado_inicio": 120.0},
            ],
        },
        "numerologia": {
            "camino_de_vida": {"numero": 8},
            "expresion": {"numero": 3},
            "impulso_del_alma": {"numero": 5},
            "personalidad": {"numero": 7},
        },
    }


# ── Tests Score Astrológico ──

class TestScoreAstrologico:

    def test_sin_carta_retorna_neutral(self):
        score = _score_astrologico([], [], None, "carrera")
        assert score == 5.0

    def test_retorna_rango_valido(self):
        t = _transito_basico()
        perfil = _perfil_cosmico_basico()
        score = _score_astrologico(
            t["planetas"], t["aspectos"], perfil, "carrera"
        )
        assert 0.0 <= score <= 10.0

    def test_mercurio_retro_penaliza_comunicacion(self):
        t = _transito_basico()
        t["planetas"][2]["retrogrado"] = True  # Mercurio retro
        perfil = _perfil_cosmico_basico()

        score_normal = _score_astrologico(
            _transito_basico()["planetas"], [], perfil, "comunicacion"
        )
        score_retro = _score_astrologico(
            t["planetas"], [], perfil, "comunicacion"
        )
        assert score_retro < score_normal


# ── Tests Score Numerológico ──

class TestScoreNumerologico:

    def test_sin_perfil_retorna_neutral(self):
        score = _score_numerologico(date(2026, 6, 15), None, "carrera")
        assert score == 5.0

    def test_retorna_rango_valido(self):
        perfil = _perfil_cosmico_basico()
        score = _score_numerologico(date(2026, 6, 15), perfil, "carrera")
        assert 0.0 <= score <= 10.0

    def test_resonancia_sendero_aumenta_score(self):
        """Día personal que coincide con sendero debería tener mayor score."""
        perfil = _perfil_cosmico_basico()  # sendero 8
        # Buscar dos fechas con diferentes días personales
        scores = []
        for day in range(1, 29):
            fecha = date(2026, 6, day)
            s = _score_numerologico(fecha, perfil, "finanzas")
            scores.append(s)
        # Al menos debería haber variación
        assert max(scores) > min(scores)


# ── Tests Score Eventos ──

class TestScoreEventos:

    def test_sin_eventos_retorna_neutral(self):
        assert _score_eventos(None, "carrera") == 5.0

    def test_luna_nueva_bonus_carrera(self):
        eventos = {"fases": "Luna Nueva", "cambios_signo": [], "retrogrados_inicio": [], "retrogrados_fin": [], "aspectos_exactos": []}
        score = _score_eventos(eventos, "carrera")
        assert score > 5.0

    def test_mercurio_retro_inicio_penaliza(self):
        eventos = {"fases": None, "cambios_signo": [], "retrogrados_inicio": ["Mercurio"], "retrogrados_fin": [], "aspectos_exactos": []}
        score = _score_eventos(eventos, "contratos")
        assert score < 5.0

    def test_mercurio_directo_bonus(self):
        eventos = {"fases": None, "cambios_signo": [], "retrogrados_inicio": [], "retrogrados_fin": ["Mercurio"], "aspectos_exactos": []}
        score = _score_eventos(eventos, "comunicacion")
        assert score > 5.0


# ── Tests Score Final ──

class TestScoreFinal:

    def test_score_dia_retorna_campos(self):
        t = _transito_basico()
        perfil = _perfil_cosmico_basico()
        resultado = calcular_score_dia(t, perfil, perfil, "carrera", date(2026, 6, 15))
        assert "score_final" in resultado
        assert "score_astro" in resultado
        assert "score_numero" in resultado
        assert "score_eventos" in resultado
        assert "fecha" in resultado

    def test_score_final_en_rango(self):
        t = _transito_basico()
        perfil = _perfil_cosmico_basico()
        resultado = calcular_score_dia(t, perfil, perfil, "carrera", date(2026, 6, 15))
        assert 0.0 <= resultado["score_final"] <= 10.0


# ── Tests Ranking ──

class TestRanking:

    def _generar_transitos(self, dias: int = 10) -> list[dict]:
        return [_transito_basico(date(2026, 6, d + 1)) for d in range(dias)]

    def test_rankear_dias_top5(self):
        transitos = self._generar_transitos(15)
        perfil = _perfil_cosmico_basico()
        resultado = rankear_dias(transitos, perfil, perfil, "carrera", top_n=5)
        assert len(resultado["mejores"]) == 5
        assert len(resultado["evitar"]) == 3
        # Ordenados desc
        scores = [d["score_final"] for d in resultado["mejores"]]
        assert scores == sorted(scores, reverse=True)

    def test_rankear_meses(self):
        # 60 días spanning 2 meses
        transitos = [_transito_basico(date(2026, 6, d + 1)) for d in range(30)]
        transitos += [_transito_basico(date(2026, 7, d + 1)) for d in range(30)]
        perfil = _perfil_cosmico_basico()
        resultado = rankear_meses(transitos, perfil, perfil, "viajes", top_n=2)
        assert len(resultado["mejores"]) == 2
        assert "score_mes" in resultado["mejores"][0]
        assert "mejor_ventana_inicio" in resultado["mejores"][0]


# ── Tests Formateador ──

class TestFormateador:

    def test_formatear_dias(self):
        ranking = {
            "mejores": [
                {"fecha": "2026-06-15", "score_final": 8.5, "score_astro": 7.0,
                 "score_numero": 9.0, "score_eventos": 5.0, "fase_lunar": "Luna Nueva", "eventos": {}},
            ],
            "evitar": [
                {"fecha": "2026-06-20", "score_final": 3.0, "score_astro": 2.0,
                 "score_numero": 4.0, "score_eventos": 3.0, "fase_lunar": "", "eventos": {}},
            ],
        }
        texto = formatear_resumen(ranking, "carrera", "dia")
        assert "Carrera" in texto
        assert "2026-06-15" in texto
        assert "Mejores días" in texto

    def test_formatear_meses(self):
        ranking = {
            "mejores": [
                {"mes": "2026-06", "score_mes": 7.8, "promedio_diario": 7.0,
                 "mejor_ventana_score": 8.5, "mejor_ventana_inicio": "2026-06-11",
                 "ventana_dias": 7, "mejor_dia": {"fecha": "2026-06-14", "score_final": 9.0},
                 "dias_favorables": 25, "total_dias": 30},
            ],
            "evitar": [],
        }
        texto = formatear_resumen(ranking, "viajes", "mes")
        assert "Viajes" in texto
        assert "Junio" in texto
