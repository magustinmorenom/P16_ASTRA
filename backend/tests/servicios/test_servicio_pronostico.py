"""Tests para el servicio de pronóstico cósmico."""

import json
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.esquemas.pronostico import PronosticoDiarioSchema, PronosticoSemanalSchema
from app.servicios.servicio_numerologia import ServicioNumerologia
from app.servicios.servicio_pronostico import ServicioPronostico


# ---------------------------------------------------------------------------
# Tests de extensión de numerología con fecha_objetivo
# ---------------------------------------------------------------------------


class TestNumerologiaFechaObjetivo:
    """Verifica que _anio_personal, _mes_personal, _dia_personal aceptan fecha_objetivo."""

    def test_anio_personal_sin_fecha_objetivo(self):
        """Sin fecha_objetivo usa la fecha actual (retrocompat)."""
        num = ServicioNumerologia._anio_personal(date(1990, 1, 15))
        assert isinstance(num, int)
        assert num > 0

    def test_anio_personal_con_fecha_objetivo(self):
        """Con fecha_objetivo usa el año especificado."""
        num_2024 = ServicioNumerologia._anio_personal(date(1990, 1, 15), date(2024, 6, 1))
        num_2025 = ServicioNumerologia._anio_personal(date(1990, 1, 15), date(2025, 6, 1))
        # Años distintos → probablemente valores distintos
        assert isinstance(num_2024, int)
        assert isinstance(num_2025, int)

    def test_mes_personal_con_fecha_objetivo(self):
        num_enero = ServicioNumerologia._mes_personal(date(1990, 1, 15), date(2025, 1, 10))
        num_julio = ServicioNumerologia._mes_personal(date(1990, 1, 15), date(2025, 7, 10))
        assert isinstance(num_enero, int)
        assert isinstance(num_julio, int)

    def test_dia_personal_con_fecha_objetivo(self):
        num_dia1 = ServicioNumerologia._dia_personal(date(1990, 1, 15), date(2025, 3, 1))
        num_dia15 = ServicioNumerologia._dia_personal(date(1990, 1, 15), date(2025, 3, 15))
        assert isinstance(num_dia1, int)
        assert isinstance(num_dia15, int)

    def test_calcular_dia_personal_retorna_dict(self):
        resultado = ServicioNumerologia.calcular_dia_personal(date(1990, 1, 15), date(2025, 3, 26))
        assert "numero" in resultado
        assert "descripcion" in resultado
        assert isinstance(resultado["numero"], int)
        assert resultado["numero"] > 0

    def test_calcular_dia_personal_sin_fecha(self):
        """Sin fecha_objetivo retorna resultado para hoy."""
        resultado = ServicioNumerologia.calcular_dia_personal(date(1990, 1, 15))
        assert "numero" in resultado
        assert "descripcion" in resultado

    def test_dia_personal_determinista(self):
        """Misma fecha_objetivo → mismo resultado."""
        fecha_nac = date(1990, 1, 15)
        fecha_obj = date(2025, 3, 26)
        r1 = ServicioNumerologia.calcular_dia_personal(fecha_nac, fecha_obj)
        r2 = ServicioNumerologia.calcular_dia_personal(fecha_nac, fecha_obj)
        assert r1 == r2


# ---------------------------------------------------------------------------
# Tests de esquemas Pydantic
# ---------------------------------------------------------------------------


class TestEsquemasPronostico:
    """Verifica que los esquemas validan correctamente."""

    def test_pronostico_diario_valido(self):
        datos = {
            "clima": {
                "estado": "soleado",
                "titulo": "Día Soleado",
                "frase_sintesis": "Un gran día para emprender.",
                "energia": 8,
                "claridad": 7,
                "intuicion": 6,
            },
            "areas": [
                {
                    "id": "trabajo",
                    "nombre": "Trabajo",
                    "nivel": "favorable",
                    "icono": "briefcase",
                    "frase": "Ideal para negociar",
                    "detalle": "Detalle extendido",
                },
            ],
            "momentos": [
                {
                    "bloque": "manana",
                    "titulo": "Mañana",
                    "icono": "sunrise",
                    "frase": "Arrancá temprano",
                    "nivel": "favorable",
                },
            ],
            "alertas": [],
            "consejo_hd": {
                "titulo": "Tu Estrategia",
                "mensaje": "Esperá a responder",
                "centro_destacado": "sacral",
            },
            "luna": {
                "signo": "Sagitario",
                "fase": "Creciente",
                "significado": "Expansión",
            },
            "numero_personal": {"numero": 1, "descripcion": "Liderazgo"},
        }
        schema = PronosticoDiarioSchema(**datos)
        assert schema.clima.estado == "soleado"
        assert schema.clima.energia == 8
        assert len(schema.areas) == 1
        assert schema.numero_personal.numero == 1

    def test_pronostico_semanal_valido(self):
        datos = {
            "semana": [
                {
                    "fecha": "2025-03-24",
                    "clima_estado": "despejado",
                    "energia": 7,
                    "frase_corta": "Buen día para iniciar",
                    "numero_personal": 1,
                },
            ]
        }
        schema = PronosticoSemanalSchema(**datos)
        assert len(schema.semana) == 1
        assert schema.semana[0].energia == 7

    def test_energia_fuera_de_rango(self):
        datos = {
            "estado": "soleado",
            "titulo": "Test",
            "frase_sintesis": "Test",
            "energia": 15,  # fuera de rango
            "claridad": 5,
            "intuicion": 5,
        }
        from app.esquemas.pronostico import ClimaCosmicoSchema
        with pytest.raises(Exception):
            ClimaCosmicoSchema(**datos)


# ---------------------------------------------------------------------------
# Tests de ServicioPronostico
# ---------------------------------------------------------------------------


class TestServicioPronostico:
    """Tests del servicio de pronóstico."""

    def test_extraer_info_luna_nueva(self):
        """Luna muy cerca del Sol → Luna Nueva."""
        transitos = {
            "planetas": [
                {"nombre": "Sol", "longitud": 10.0, "signo": "Aries"},
                {"nombre": "Luna", "longitud": 12.0, "signo": "Aries"},
            ]
        }
        info = ServicioPronostico._extraer_info_luna(transitos)
        assert info["fase"] == "Luna Nueva"
        assert info["signo"] == "Aries"

    def test_extraer_info_luna_llena(self):
        """Luna opuesta al Sol → Luna Llena."""
        transitos = {
            "planetas": [
                {"nombre": "Sol", "longitud": 10.0, "signo": "Aries"},
                {"nombre": "Luna", "longitud": 190.0, "signo": "Libra"},
            ]
        }
        info = ServicioPronostico._extraer_info_luna(transitos)
        assert info["fase"] == "Luna Llena"
        assert info["signo"] == "Libra"

    def test_extraer_info_luna_sin_datos(self):
        info = ServicioPronostico._extraer_info_luna({"planetas": []})
        assert info["signo"] == "?"
        assert info["fase"] == "Desconocida"

    def test_fallback_diario_estructura(self):
        """El fallback tiene la estructura correcta."""
        num = {"numero": 5, "descripcion": "Libertad, aventura, cambio"}
        luna = {"signo": "Géminis", "fase": "Creciente", "significado": "Crecimiento"}
        resultado = ServicioPronostico._generar_fallback_diario(num, luna)

        assert resultado["clima"]["estado"] in ("despejado", "soleado", "nublado", "tormenta", "arcoiris")
        assert resultado["clima"]["energia"] == 7  # número 5 → energía 7
        assert len(resultado["areas"]) == 6
        assert len(resultado["momentos"]) == 3
        assert resultado["alertas"] == []
        assert resultado["numero_personal"]["numero"] == 5
        assert resultado["luna"]["signo"] == "Géminis"
        # Cada área tiene un detalle personalizado (no genérico)
        for area in resultado["areas"]:
            assert len(area["detalle"]) > 50, f"Área {area['id']} sin detalle personalizado"

    def test_fallback_diario_energia_por_numero(self):
        """Cada número personal produce energía diferente en el fallback."""
        luna = {"signo": "Leo", "fase": "Llena", "significado": "Test"}
        energia_1 = ServicioPronostico._generar_fallback_diario(
            {"numero": 1, "descripcion": "test"}, luna
        )["clima"]["energia"]
        energia_7 = ServicioPronostico._generar_fallback_diario(
            {"numero": 7, "descripcion": "test"}, luna
        )["clima"]["energia"]
        # Número 1 = más energía que 7
        assert energia_1 > energia_7

    def test_ttl_medianoche_positivo(self):
        """El TTL hasta medianoche siempre es positivo."""
        ttl = ServicioPronostico._calcular_ttl_hasta_medianoche()
        assert ttl > 0
        assert ttl < 90000  # máximo ~25h

    def test_ttl_lunes_positivo(self):
        ttl = ServicioPronostico._calcular_ttl_hasta_lunes()
        assert ttl > 0
        assert ttl < 700000  # máximo ~8 días


# ---------------------------------------------------------------------------
# Tests de cache (mock Redis)
# ---------------------------------------------------------------------------


class TestPronosticoCache:
    """Tests de cache Redis."""

    @pytest.mark.asyncio
    async def test_cache_hit_no_genera(self):
        """Si hay cache, no se llama a Claude."""
        datos_cached = json.dumps({
            "clima": {"estado": "soleado", "titulo": "Test", "frase_sintesis": "Test",
                      "energia": 8, "claridad": 7, "intuicion": 6},
            "areas": [], "momentos": [], "alertas": [],
            "consejo_hd": {"titulo": "Test", "mensaje": "Test", "centro_destacado": "sacral"},
            "luna": {"signo": "Aries", "fase": "Nueva", "significado": "Test"},
            "numero_personal": {"numero": 1, "descripcion": "Test"},
        })

        redis_mock = AsyncMock()
        redis_mock.get = AsyncMock(return_value=datos_cached)

        sesion_mock = AsyncMock()

        resultado = await ServicioPronostico.generar_pronostico_diario(
            sesion=sesion_mock,
            redis=redis_mock,
            usuario_id="test-user-id",
            fecha=date(2025, 3, 26),
        )

        assert resultado["clima"]["estado"] == "soleado"
        # Redis fue consultado
        redis_mock.get.assert_called_once()
        # La sesión de BD no fue usada (no se cargó perfil)
        sesion_mock.execute.assert_not_called()


# ---------------------------------------------------------------------------
# Tests de gating features
# ---------------------------------------------------------------------------


class TestConfigFeatures:
    """Tests de configuración de gating."""

    def test_freemium_acceso_total(self):
        from app.configuracion_features import obtener_acceso_pronostico
        acceso = obtener_acceso_pronostico("gratis")
        assert acceso["pronostico_clima"] is True
        assert acceso["pronostico_areas"] is True
        assert acceso["pronostico_semana"] is True

    def test_premium_acceso_total(self):
        from app.configuracion_features import obtener_acceso_pronostico
        acceso = obtener_acceso_pronostico("premium")
        assert all(v is True for v in acceso.values())
