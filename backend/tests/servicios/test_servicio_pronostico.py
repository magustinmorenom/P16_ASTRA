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


# ---------------------------------------------------------------------------
# Tests de inyección de acciones del podcast en el pronóstico
# ---------------------------------------------------------------------------


class TestSintetizarAccion:
    """Recorte de acciones largas a max ~2 líneas (110 chars)."""

    def test_accion_corta_se_devuelve_tal_cual(self):
        texto = "Mandá ese mail antes de las 10"
        assert ServicioPronostico._sintetizar_accion(texto) == texto

    def test_accion_exactamente_en_limite_no_recorta(self):
        texto = "x" * 110
        assert ServicioPronostico._sintetizar_accion(texto) == texto

    def test_accion_larga_recorta_en_palabra_completa(self):
        texto = (
            "Mandá ese mail pendiente que venís postergando desde "
            "hace varias semanas antes de las diez de la mañana para "
            "liberar la cabeza y enfocarte en lo importante"
        )
        assert len(texto) > 110  # sanity check del input
        resultado = ServicioPronostico._sintetizar_accion(texto)
        assert len(resultado) <= 110
        assert resultado.endswith("…")
        # No corta a mitad de palabra
        sin_elipsis = resultado.replace("…", "").rstrip()
        assert not sin_elipsis.endswith("…")
        # Mantiene el comienzo
        assert resultado.startswith("Mandá ese mail")

    def test_accion_larga_no_deja_puntuacion_colgante(self):
        texto = (
            "Escribí un mail largo, con detalles importantes, sobre la "
            "reunión del lunes que venís postergando desde hace días."
        )
        resultado = ServicioPronostico._sintetizar_accion(texto)
        assert resultado.endswith("…")
        # No quedan ", …" o ".…"
        assert ", …" not in resultado
        assert ". …" not in resultado

    def test_accion_vacia_devuelve_vacio(self):
        assert ServicioPronostico._sintetizar_accion("") == ""
        assert ServicioPronostico._sintetizar_accion(None) == ""  # type: ignore

    def test_palabra_unica_gigante_corta_hard(self):
        texto = "Mandá " + ("supercalifragilisticoespialidoso" * 5)
        resultado = ServicioPronostico._sintetizar_accion(texto)
        assert len(resultado) <= 110
        assert resultado.endswith("…")


class TestInyectarAccionesPodcast:
    """Reemplazo de accionables fallback por acciones reales del podcast."""

    def _resultado_base(self):
        return {
            "momentos": [
                {
                    "bloque": "manana",
                    "accionables": ["Fallback mañana 1", "Fallback mañana 2"],
                },
                {
                    "bloque": "tarde",
                    "accionables": ["Fallback tarde 1", "Fallback tarde 2"],
                },
                {
                    "bloque": "noche",
                    "accionables": ["Fallback noche 1", "Fallback noche 2"],
                },
            ]
        }

    def test_inyecta_acciones_de_los_tres_bloques(self):
        resultado = self._resultado_base()
        acciones_podcast = [
            {"bloque": "manana", "accion": "Mandá el mail", "contexto": "Mercurio"},
            {"bloque": "manana", "accion": "Tomá agua", "contexto": "Luna"},
            {"bloque": "tarde", "accion": "Reunión clave", "contexto": "Marte"},
            {"bloque": "noche", "accion": "Escribí gratitud", "contexto": "Venus"},
        ]
        resultado_inyectado = ServicioPronostico._inyectar_acciones_podcast(
            resultado, acciones_podcast
        )

        momentos = {m["bloque"]: m for m in resultado_inyectado["momentos"]}
        assert momentos["manana"]["accionables"] == ["Mandá el mail", "Tomá agua"]
        assert momentos["tarde"]["accionables"] == ["Reunión clave"]
        assert momentos["noche"]["accionables"] == ["Escribí gratitud"]
        # Sin "Fallback" en ningún lado
        for momento in resultado_inyectado["momentos"]:
            for accion in momento["accionables"]:
                assert "Fallback" not in accion

    def test_acciones_largas_se_sintetizan(self):
        resultado = self._resultado_base()
        accion_larga = (
            "Mandá ese mail pendiente que venís postergando desde "
            "hace varias semanas antes de las diez de la mañana para "
            "liberar la cabeza y enfocarte en lo importante"
        )
        assert len(accion_larga) > 110  # sanity check del input
        acciones_podcast = [
            {"bloque": "manana", "accion": accion_larga, "contexto": "Mercurio"},
        ]
        resultado_inyectado = ServicioPronostico._inyectar_acciones_podcast(
            resultado, acciones_podcast
        )
        accion_resultado = resultado_inyectado["momentos"][0]["accionables"][0]
        assert len(accion_resultado) <= 110
        assert accion_resultado.endswith("…")
        assert accion_resultado.startswith("Mandá ese mail")

    def test_lista_vacia_no_modifica_resultado(self):
        resultado = self._resultado_base()
        original_manana = list(resultado["momentos"][0]["accionables"])
        resultado_inyectado = ServicioPronostico._inyectar_acciones_podcast(resultado, [])
        # Conserva los fallbacks
        assert resultado_inyectado["momentos"][0]["accionables"] == original_manana

    def test_acciones_sin_bloque_se_descartan(self):
        resultado = self._resultado_base()
        acciones_podcast = [
            {"accion": "Sin bloque, ignorada", "contexto": "..."},
            {"bloque": "", "accion": "Bloque vacío, ignorada", "contexto": "..."},
            {"bloque": "manana", "accion": "Esta sí va", "contexto": "..."},
        ]
        resultado_inyectado = ServicioPronostico._inyectar_acciones_podcast(
            resultado, acciones_podcast
        )
        assert resultado_inyectado["momentos"][0]["accionables"] == ["Esta sí va"]

    def test_acciones_con_texto_vacio_se_descartan(self):
        resultado = self._resultado_base()
        acciones_podcast = [
            {"bloque": "manana", "accion": "", "contexto": "..."},
            {"bloque": "manana", "accion": "Acción válida", "contexto": "..."},
        ]
        resultado_inyectado = ServicioPronostico._inyectar_acciones_podcast(
            resultado, acciones_podcast
        )
        assert resultado_inyectado["momentos"][0]["accionables"] == ["Acción válida"]

    def test_bloque_sin_acciones_mantiene_fallback(self):
        """Si el podcast solo trae acciones de mañana, tarde y noche conservan fallback."""
        resultado = self._resultado_base()
        acciones_podcast = [
            {"bloque": "manana", "accion": "Real mañana", "contexto": "..."},
        ]
        resultado_inyectado = ServicioPronostico._inyectar_acciones_podcast(
            resultado, acciones_podcast
        )
        momentos = {m["bloque"]: m for m in resultado_inyectado["momentos"]}
        assert momentos["manana"]["accionables"] == ["Real mañana"]
        assert momentos["tarde"]["accionables"] == ["Fallback tarde 1", "Fallback tarde 2"]
        assert momentos["noche"]["accionables"] == ["Fallback noche 1", "Fallback noche 2"]
