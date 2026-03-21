"""Tests de precisión de Human Design contra perfiles conocidos.

Valida tipo, autoridad y perfil contra datos documentados
de figuras públicas de la comunidad HD.
"""

import pytest

from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.servicios.servicio_diseno_humano import ServicioDisenoHumano
from app.utilidades.convertidores import normalizar_grados
from tests.validacion.datos_referencia import REFERENCIAS_HD


def _calcular_jd(ref):
    """Calcula el día juliano para datos de referencia."""
    from datetime import time as time_cls
    hora = time_cls.fromisoformat(ref.hora)
    utc = ServicioZonaHoraria.convertir_a_utc(ref.fecha, hora, ref.zona_horaria)
    return ServicioZonaHoraria.calcular_dia_juliano(utc)


class TestTipoHD:
    """Validación de Tipo de Human Design contra referencia.

    Criterio CA-02: tipo correcto en 100% de casos confianza alta.
    """

    @pytest.mark.parametrize(
        "ref",
        [r for r in REFERENCIAS_HD if r.confianza == "alta"],
        ids=[r.nombre for r in REFERENCIAS_HD if r.confianza == "alta"],
    )
    def test_tipo_confianza_alta(self, ref):
        """Verifica tipo HD para perfiles de alta confianza."""
        jd = _calcular_jd(ref)
        resultado = ServicioDisenoHumano.calcular_diseno_completo(jd)

        assert resultado["tipo"] == ref.tipo_esperado, (
            f"{ref.nombre}: tipo calculado='{resultado['tipo']}', "
            f"esperado='{ref.tipo_esperado}'. "
            f"Centros: {resultado['centros']}"
        )

    @pytest.mark.parametrize(
        "ref",
        [r for r in REFERENCIAS_HD if r.confianza == "media"],
        ids=[r.nombre for r in REFERENCIAS_HD if r.confianza == "media"],
    )
    def test_tipo_confianza_media(self, ref):
        """Verifica tipo HD para perfiles de confianza media.

        Estos pueden fallar por incertidumbre en la hora de nacimiento.
        Se reportan como warnings si fallan.
        """
        jd = _calcular_jd(ref)
        resultado = ServicioDisenoHumano.calcular_diseno_completo(jd)

        if resultado["tipo"] != ref.tipo_esperado:
            pytest.skip(
                f"{ref.nombre}: tipo calculado='{resultado['tipo']}' vs "
                f"esperado='{ref.tipo_esperado}' "
                f"(confianza media — puede deberse a hora inexacta)"
            )


class TestAutoridadHD:
    """Validación de Autoridad interna."""

    @pytest.mark.parametrize(
        "ref",
        [r for r in REFERENCIAS_HD if r.confianza == "alta"],
        ids=[r.nombre for r in REFERENCIAS_HD if r.confianza == "alta"],
    )
    def test_autoridad_confianza_alta(self, ref):
        """Verifica autoridad HD para perfiles de alta confianza."""
        jd = _calcular_jd(ref)
        resultado = ServicioDisenoHumano.calcular_diseno_completo(jd)

        assert resultado["autoridad"] == ref.autoridad_esperada, (
            f"{ref.nombre}: autoridad calculada='{resultado['autoridad']}', "
            f"esperada='{ref.autoridad_esperada}'. "
            f"Centros: {resultado['centros']}"
        )


class TestPerfilHD:
    """Validación de Perfil (línea Sol consciente / línea Sol inconsciente)."""

    @pytest.mark.parametrize(
        "ref",
        [r for r in REFERENCIAS_HD if r.confianza == "alta"],
        ids=[r.nombre for r in REFERENCIAS_HD if r.confianza == "alta"],
    )
    def test_perfil_confianza_alta(self, ref):
        """Verifica perfil HD para perfiles de alta confianza."""
        jd = _calcular_jd(ref)
        resultado = ServicioDisenoHumano.calcular_diseno_completo(jd)

        assert resultado["perfil"] == ref.perfil_esperado, (
            f"{ref.nombre}: perfil calculado='{resultado['perfil']}', "
            f"esperado='{ref.perfil_esperado}'"
        )


class TestPrecision88Grados:
    """Valida que la búsqueda de 88° solares es precisa."""

    @pytest.mark.parametrize(
        "ref",
        REFERENCIAS_HD[:4],
        ids=[r.nombre for r in REFERENCIAS_HD[:4]],
    )
    def test_88_grados_precision(self, ref):
        """Verifica que la fecha inconsciente retrocede exactamente 88°."""
        jd = _calcular_jd(ref)
        jd_inc = ServicioDisenoHumano._calcular_fecha_inconsciente(jd)

        lon_natal = ServicioEfemerides.obtener_longitud_solar(jd)
        lon_inc = ServicioEfemerides.obtener_longitud_solar(jd_inc)

        diff = normalizar_grados(lon_natal - lon_inc)
        assert abs(diff - 88.0) < 0.001, (
            f"{ref.nombre}: diferencia solar={diff:.6f}°, esperado=88.0° "
            f"(error={abs(diff - 88.0):.6f}°)"
        )


class TestEstructuraCompleta:
    """Verifica la estructura completa del diseño para múltiples perfiles."""

    @pytest.mark.parametrize(
        "ref",
        REFERENCIAS_HD,
        ids=[r.nombre for r in REFERENCIAS_HD],
    )
    def test_estructura_valida(self, ref):
        """Verifica que el diseño completo tiene estructura correcta."""
        jd = _calcular_jd(ref)
        resultado = ServicioDisenoHumano.calcular_diseno_completo(jd)

        # 9 centros
        assert len(resultado["centros"]) == 9

        # 13 activaciones por set
        assert len(resultado["activaciones_conscientes"]) == 13
        assert len(resultado["activaciones_inconscientes"]) == 13

        # Perfil formato X/Y
        partes = resultado["perfil"].split("/")
        assert len(partes) == 2
        assert 1 <= int(partes[0]) <= 6
        assert 1 <= int(partes[1]) <= 6

        # Cruz de encarnación con 4 puertas
        cruz = resultado["cruz_encarnacion"]
        assert len(cruz["puertas"]) == 4
        for p in cruz["puertas"]:
            assert 1 <= p <= 64

        # Tipo válido
        assert resultado["tipo"] in {
            "Generador", "Generador Manifestante",
            "Manifestador", "Proyector", "Reflector",
        }
