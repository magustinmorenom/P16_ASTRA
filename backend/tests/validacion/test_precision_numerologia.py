"""Tests de precisión de numerología contra cálculos manuales.

Criterio CA-03: números correctos según tablas Pitagóricas.
"""

import pytest
from datetime import date

from app.servicios.servicio_numerologia import ServicioNumerologia
from tests.validacion.datos_referencia import REFERENCIAS_NUMEROLOGIA


class TestCaminoDeVidaPrecision:
    """Validación del Camino de Vida contra cálculos manuales."""

    @pytest.mark.parametrize(
        "ref",
        REFERENCIAS_NUMEROLOGIA,
        ids=[r.nombre for r in REFERENCIAS_NUMEROLOGIA],
    )
    def test_camino_vida(self, ref):
        """Verifica Camino de Vida contra cálculo manual."""
        resultado = ServicioNumerologia._camino_de_vida(ref.fecha)
        assert resultado == ref.camino_vida_esperado, (
            f"{ref.nombre} ({ref.fecha}): camino calculado={resultado}, "
            f"esperado={ref.camino_vida_esperado}. {ref.notas}"
        )

    @pytest.mark.parametrize(
        "ref",
        REFERENCIAS_NUMEROLOGIA,
        ids=[r.nombre for r in REFERENCIAS_NUMEROLOGIA],
    )
    def test_numero_nacimiento(self, ref):
        """Verifica Número de Nacimiento contra cálculo manual."""
        resultado = ServicioNumerologia._numero_nacimiento(ref.fecha)
        assert resultado == ref.numero_nacimiento_esperado, (
            f"{ref.nombre}: nacimiento calculado={resultado}, "
            f"esperado={ref.numero_nacimiento_esperado}"
        )


class TestMaestrosNuncaReducidos:
    """Verifica que los números maestros NUNCA se reducen."""

    def test_11_preservado_en_carta(self):
        """Fecha que produce 11 en el día — debe preservarse."""
        carta = ServicioNumerologia.calcular_carta_completa(
            "Test", date(1992, 11, 29), "pitagorico"
        )
        # 29 → 11 (maestro)
        assert carta["numero_nacimiento"]["numero"] == 11

    def test_22_preservado_en_carta(self):
        """Fecha con día 22 — debe preservarse."""
        carta = ServicioNumerologia.calcular_carta_completa(
            "Test", date(1988, 4, 22), "pitagorico"
        )
        assert carta["numero_nacimiento"]["numero"] == 22

    def test_33_nunca_se_reduce(self):
        """33 directo nunca se reduce."""
        assert ServicioNumerologia._reducir_numero(33) == 33

    def test_44_si_se_reduce(self):
        """44 NO es maestro — debe reducirse a 8."""
        assert ServicioNumerologia._reducir_numero(44) == 8


class TestExpresionPitagorica:
    """Valida cálculos de Expresión con tabla Pitagórica."""

    def test_expresion_abc(self):
        """ABC → A=1 + B=2 + C=3 = 6."""
        from app.utilidades.constantes import TABLA_PITAGORICA
        resultado = ServicioNumerologia._numero_expresion("ABC", TABLA_PITAGORICA)
        assert resultado == 6

    def test_expresion_con_espacios(self):
        """Espacios y caracteres no-alfa se ignoran."""
        from app.utilidades.constantes import TABLA_PITAGORICA
        r1 = ServicioNumerologia._numero_expresion("AB CD", TABLA_PITAGORICA)
        r2 = ServicioNumerologia._numero_expresion("ABCD", TABLA_PITAGORICA)
        assert r1 == r2

    def test_vocales_vs_consonantes(self):
        """Vocales + consonantes deben cubrir todas las letras."""
        from app.utilidades.constantes import TABLA_PITAGORICA
        nombre = "ABCDE"
        # A=1, E=5 → vocales = 6
        alma = ServicioNumerologia._impulso_del_alma(nombre, TABLA_PITAGORICA)
        # B=2, C=3, D=4 → consonantes = 9
        personalidad = ServicioNumerologia._numero_personalidad(nombre, TABLA_PITAGORICA)
        assert alma == 6
        assert personalidad == 9


class TestSistemaCaldeo:
    """Valida que el sistema Caldeo produce resultados diferentes."""

    def test_caldeo_vs_pitagorico(self):
        """Los dos sistemas deben dar resultados diferentes para la mayoría de nombres."""
        carta_pit = ServicioNumerologia.calcular_carta_completa(
            "Albert Einstein", date(1879, 3, 14), "pitagorico"
        )
        carta_cal = ServicioNumerologia.calcular_carta_completa(
            "Albert Einstein", date(1879, 3, 14), "caldeo"
        )
        # El camino de vida es igual (depende solo de fecha)
        assert carta_pit["camino_de_vida"] == carta_cal["camino_de_vida"]
        # La expresión debe diferir (diferentes tablas de letras)
        assert carta_pit["expresion"]["numero"] != carta_cal["expresion"]["numero"] or \
               carta_pit["impulso_del_alma"]["numero"] != carta_cal["impulso_del_alma"]["numero"]


class TestCartaCompletaEstructura:
    """Verifica estructura de carta numerológica completa."""

    def test_todos_los_campos(self):
        carta = ServicioNumerologia.calcular_carta_completa(
            "María García López", date(1985, 7, 22), "pitagorico"
        )
        campos = [
            "camino_de_vida", "expresion", "impulso_del_alma",
            "personalidad", "numero_nacimiento", "anio_personal",
        ]
        for campo in campos:
            assert campo in carta
            assert "numero" in carta[campo]
            assert "descripcion" in carta[campo]
            assert carta[campo]["numero"] > 0
            assert len(carta[campo]["descripcion"]) > 0

    def test_deteccion_maestros(self):
        """Verifica que se detectan números maestros presentes."""
        carta = ServicioNumerologia.calcular_carta_completa(
            "Test", date(1992, 11, 29), "pitagorico"
        )
        # El número de nacimiento es 11, debería aparecer en maestros
        if 11 in [carta[c]["numero"] for c in [
            "camino_de_vida", "expresion", "impulso_del_alma", "personalidad"
        ]]:
            assert 11 in carta["numeros_maestros_presentes"]
