"""Tests para el servicio de Diseño Humano."""

import pytest

from app.servicios.servicio_diseno_humano import ServicioDisenoHumano
from app.utilidades.constantes import ORDEN_PUERTAS_HD


# JD para 1990-01-15 16:30 UTC (Buenos Aires 14:30 local, verano UTC-2)
JD_TEST = 2447908.1875


class TestMapeoLongitudPuerta:
    """Tests del mapeo de longitud a puerta/línea."""

    def test_puerta_41_inicio(self):
        """302.0° (2° Acuario) debe mapear a puerta 41, línea 1."""
        puerta, linea = ServicioDisenoHumano._mapear_longitud_a_puerta_linea(302.0)
        assert puerta == 41
        assert linea == 1

    def test_puerta_siguiente(self):
        """302.0 + 5.625 = 307.625° debe ser puerta 19 (segunda en el orden)."""
        puerta, linea = ServicioDisenoHumano._mapear_longitud_a_puerta_linea(307.625)
        assert puerta == 19
        assert linea == 1

    def test_lineas_1_a_6(self):
        """Dentro de una puerta, las 6 líneas deben estar correctas."""
        base = 302.0  # Inicio puerta 41
        for i in range(6):
            lon = base + i * 0.9375 + 0.01  # Pequeño offset para estar dentro
            _, linea = ServicioDisenoHumano._mapear_longitud_a_puerta_linea(lon)
            assert linea == i + 1

    def test_wrap_around_360(self):
        """Longitudes cercanas a 0° (después de pasar 360°)."""
        puerta, linea = ServicioDisenoHumano._mapear_longitud_a_puerta_linea(0.0)
        assert 1 <= puerta <= 64
        assert 1 <= linea <= 6


class TestFechaInconsciente:
    """Tests del cálculo de la fecha inconsciente (88° solares)."""

    def test_fecha_inconsciente_88_grados(self):
        """La fecha inconsciente debe retroceder exactamente 88° solares."""
        from app.nucleo.servicio_efemerides import ServicioEfemerides
        from app.utilidades.convertidores import normalizar_grados

        jd_inc = ServicioDisenoHumano._calcular_fecha_inconsciente(JD_TEST)
        lon_natal = ServicioEfemerides.obtener_longitud_solar(JD_TEST)
        lon_inc = ServicioEfemerides.obtener_longitud_solar(jd_inc)

        # La diferencia debe ser ~88°
        diff = normalizar_grados(lon_natal - lon_inc)
        assert abs(diff - 88.0) < 0.001

    def test_fecha_inconsciente_es_anterior(self):
        """La fecha inconsciente debe ser anterior a la natal."""
        jd_inc = ServicioDisenoHumano._calcular_fecha_inconsciente(JD_TEST)
        assert jd_inc < JD_TEST


class TestDisenoCompleto:
    """Tests del diseño humano completo."""

    def test_diseno_tiene_campos_requeridos(self):
        resultado = ServicioDisenoHumano.calcular_diseno_completo(JD_TEST)
        assert "tipo" in resultado
        assert "autoridad" in resultado
        assert "perfil" in resultado
        assert "definicion" in resultado
        assert "centros" in resultado
        assert "canales" in resultado
        assert "activaciones_conscientes" in resultado
        assert "activaciones_inconscientes" in resultado

    def test_tipo_valido(self):
        resultado = ServicioDisenoHumano.calcular_diseno_completo(JD_TEST)
        tipos_validos = {
            "Generador", "Generador Manifestante",
            "Manifestador", "Proyector", "Reflector",
        }
        assert resultado["tipo"] in tipos_validos

    def test_autoridad_valida(self):
        resultado = ServicioDisenoHumano.calcular_diseno_completo(JD_TEST)
        autoridades_validas = {
            "Emocional", "Sacral", "Esplénica",
            "Ego Manifestado", "Self Proyectada",
            "Entorno", "Lunar",
        }
        assert resultado["autoridad"] in autoridades_validas

    def test_perfil_formato(self):
        resultado = ServicioDisenoHumano.calcular_diseno_completo(JD_TEST)
        partes = resultado["perfil"].split("/")
        assert len(partes) == 2
        assert 1 <= int(partes[0]) <= 6
        assert 1 <= int(partes[1]) <= 6

    def test_9_centros(self):
        resultado = ServicioDisenoHumano.calcular_diseno_completo(JD_TEST)
        assert len(resultado["centros"]) == 9
        for estado in resultado["centros"].values():
            assert estado in {"definido", "abierto"}

    def test_activaciones_tienen_13_cuerpos(self):
        """Cada set de activaciones debe tener 13 cuerpos."""
        resultado = ServicioDisenoHumano.calcular_diseno_completo(JD_TEST)
        # 10 planetas + Tierra + Nodo Norte + Nodo Sur = 13
        assert len(resultado["activaciones_conscientes"]) == 13
        assert len(resultado["activaciones_inconscientes"]) == 13

    def test_cruz_encarnacion(self):
        resultado = ServicioDisenoHumano.calcular_diseno_completo(JD_TEST)
        cruz = resultado["cruz_encarnacion"]
        assert len(cruz["puertas"]) == 4
        for p in cruz["puertas"]:
            assert 1 <= p <= 64
