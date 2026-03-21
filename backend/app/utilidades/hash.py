"""Utilidades de hashing para cache."""

import hashlib
import json
from typing import Any


def generar_hash_parametros(**parametros: Any) -> str:
    """Genera un hash SHA-256 determinista a partir de parámetros.

    Los parámetros se serializan en JSON con claves ordenadas
    para garantizar determinismo.
    """
    datos = json.dumps(parametros, sort_keys=True, default=str)
    return hashlib.sha256(datos.encode("utf-8")).hexdigest()
