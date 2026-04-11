"""Utilidades de fecha con zona horaria Argentina.

Centraliza el "corte de día" usado por varios features (chat web,
bootstrap del podcast diario) para garantizar coherencia.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

TZ_ARG = ZoneInfo("America/Argentina/Buenos_Aires")


def dia_arg_actual() -> date:
    """Devuelve el día actual según la hora ARG."""
    return datetime.now(TZ_ARG).date()


def dia_arg_de_datetime(dt: datetime | None) -> date | None:
    """Devuelve el día (en hora ARG) de un datetime, o None si es None.

    Si el datetime es naive, se asume UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(TZ_ARG).date()


def es_primer_acceso_del_dia_arg(ultimo_acceso: datetime | None) -> bool:
    """True si el último acceso es de un día ARG distinto al de hoy.

    Si no hay registro previo (None), se considera primer acceso.
    """
    dia_previo = dia_arg_de_datetime(ultimo_acceso)
    if dia_previo is None:
        return True
    return dia_previo != dia_arg_actual()
