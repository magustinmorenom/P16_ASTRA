"""Tests para helpers de fecha ARG."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from app.nucleo.utilidades_fecha import (
    TZ_ARG,
    dia_arg_actual,
    dia_arg_de_datetime,
    es_primer_acceso_del_dia_arg,
)


class TestDiaArgActual:
    def test_coincide_con_ahora_en_arg(self):
        esperado = datetime.now(TZ_ARG).date()
        assert dia_arg_actual() == esperado


class TestDiaArgDeDatetime:
    def test_none(self):
        assert dia_arg_de_datetime(None) is None

    def test_utc_se_convierte_a_arg(self):
        # 02:30 UTC → 23:30 ARG del día anterior
        dt = datetime(2026, 4, 11, 2, 30, tzinfo=timezone.utc)
        assert dia_arg_de_datetime(dt).isoformat() == "2026-04-10"

    def test_naive_se_asume_utc(self):
        dt = datetime(2026, 4, 11, 15, 0)  # naive
        assert dia_arg_de_datetime(dt).isoformat() == "2026-04-11"

    def test_con_offset_explicito(self):
        dt = datetime(2026, 4, 11, 15, 0, tzinfo=ZoneInfo("UTC"))
        assert dia_arg_de_datetime(dt).isoformat() == "2026-04-11"


class TestEsPrimerAccesoDelDiaArg:
    def test_sin_acceso_previo_es_primer_acceso(self):
        assert es_primer_acceso_del_dia_arg(None) is True

    def test_acceso_de_ayer_es_primer_acceso(self):
        ayer = datetime.now(TZ_ARG) - timedelta(days=1)
        assert es_primer_acceso_del_dia_arg(ayer) is True

    def test_acceso_de_hoy_no_es_primer_acceso(self):
        # 1 minuto atrás en ARG → mismo día ARG
        hace_un_minuto = datetime.now(TZ_ARG) - timedelta(minutes=1)
        assert es_primer_acceso_del_dia_arg(hace_un_minuto) is False

    def test_frontera_medianoche_arg(self):
        """03:30 UTC de hoy = 00:30 ARG de hoy → mismo día."""
        hoy_arg = datetime.now(TZ_ARG).date()
        # Construir un datetime en UTC que en ARG sea 00:30 del día de hoy ARG
        medianoche_arg = datetime.combine(
            hoy_arg, datetime.min.time(), tzinfo=TZ_ARG
        ) + timedelta(minutes=30)
        assert es_primer_acceso_del_dia_arg(medianoche_arg) is False
