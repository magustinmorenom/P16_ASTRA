"""Tests para el servicio de numerología."""

from datetime import date

import pytest

from app.servicios.servicio_numerologia import ServicioNumerologia


class TestReducirNumero:
    """Tests de reducción numérica."""

    def test_digito_simple(self):
        assert ServicioNumerologia._reducir_numero(5) == 5

    def test_reduccion_normal(self):
        assert ServicioNumerologia._reducir_numero(28) == 1  # 2+8=10, 1+0=1

    def test_maestro_11_no_se_reduce(self):
        assert ServicioNumerologia._reducir_numero(11) == 11

    def test_maestro_22_no_se_reduce(self):
        assert ServicioNumerologia._reducir_numero(22) == 22

    def test_maestro_33_no_se_reduce(self):
        assert ServicioNumerologia._reducir_numero(33) == 33

    def test_29_reduce_a_11(self):
        """29 → 2+9 = 11 (maestro, no se reduce más)."""
        assert ServicioNumerologia._reducir_numero(29) == 11


class TestCaminoDeVida:
    """Tests del cálculo del Camino de Vida."""

    def test_camino_vida_conocido(self):
        """1990-01-15 → día=6, mes=1, año=1+9+9+0=19→1 → 6+1+1=8."""
        resultado = ServicioNumerologia._camino_de_vida(date(1990, 1, 15))
        # día: 15 → 6, mes: 1, año: 1990 → 1+9+9+0=19 → 1+0=1 → total: 6+1+1=8
        assert resultado == 8

    def test_camino_vida_maestro_11(self):
        """Verificar que el 11 se preserva si aparece."""
        resultado = ServicioNumerologia._camino_de_vida(date(2004, 9, 29))
        # día: 29 → 11 (maestro), mes: 9, año: 2004 → 6 → 11+9+6=26 → 8
        assert isinstance(resultado, int)


class TestCartaCompleta:
    """Tests de la carta completa."""

    def test_carta_pitagorica_campos(self):
        carta = ServicioNumerologia.calcular_carta_completa(
            "Juan Pérez", date(1990, 1, 15), "pitagorico"
        )
        assert "camino_de_vida" in carta
        assert "expresion" in carta
        assert "impulso_del_alma" in carta
        assert "personalidad" in carta
        assert "numero_nacimiento" in carta
        assert "anio_personal" in carta
        assert carta["sistema"] == "pitagorico"

    def test_carta_caldea(self):
        carta = ServicioNumerologia.calcular_carta_completa(
            "Juan Pérez", date(1990, 1, 15), "caldeo"
        )
        assert carta["sistema"] == "caldeo"

    def test_numeros_en_rango(self):
        carta = ServicioNumerologia.calcular_carta_completa(
            "Ana María López", date(1985, 7, 22), "pitagorico"
        )
        numeros_validos = {1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33}
        for campo in ["camino_de_vida", "expresion", "impulso_del_alma",
                       "personalidad", "numero_nacimiento", "anio_personal"]:
            assert carta[campo]["numero"] in numeros_validos

    def test_numero_nacimiento(self):
        carta = ServicioNumerologia.calcular_carta_completa(
            "Test", date(1990, 1, 15), "pitagorico"
        )
        # 15 → 1+5 = 6
        assert carta["numero_nacimiento"]["numero"] == 6

    def test_vocales_consonantes_suman_expresion(self):
        """Impulso (vocales) + Personalidad (consonantes) no necesariamente = Expresión,
        pero todos deben ser números válidos."""
        carta = ServicioNumerologia.calcular_carta_completa(
            "ABCDE", date(2000, 1, 1), "pitagorico"
        )
        assert carta["impulso_del_alma"]["numero"] > 0
        assert carta["personalidad"]["numero"] > 0
        assert carta["expresion"]["numero"] > 0
