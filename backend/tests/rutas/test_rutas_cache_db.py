"""Tests de integración cache Redis + persistencia DB en rutas de cálculo.

Verifica el flujo: hash → Redis GET → miss → compute → Redis SET → DB INSERT
y que cache hits retornan sin recalcular.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.nucleo.servicio_geo import ResultadoGeo
from app.principal import (
    _obtener_db_placeholder,
    _obtener_redis_placeholder,
    crear_aplicacion,
)


# --- Fixtures ---


@pytest.fixture
def redis_falso():
    """Redis falso basado en diccionario en memoria."""
    almacen = {}

    redis = AsyncMock()

    async def fake_get(clave):
        return almacen.get(clave)

    async def fake_set(clave, valor):
        almacen[clave] = valor

    async def fake_setex(clave, ttl, valor):
        almacen[clave] = valor

    redis.get = AsyncMock(side_effect=fake_get)
    redis.set = AsyncMock(side_effect=fake_set)
    redis.setex = AsyncMock(side_effect=fake_setex)
    redis._almacen = almacen

    return redis


@pytest.fixture
def db_falsa():
    """Sesión de DB falsa que registra operaciones sin tocar PostgreSQL."""
    sesion = AsyncMock()
    sesion.add = MagicMock()
    sesion.commit = AsyncMock()
    sesion.refresh = AsyncMock()
    return sesion


@pytest.fixture
def app_test(redis_falso, db_falsa):
    """Aplicación FastAPI con dependencias mockeadas."""
    app = crear_aplicacion()

    async def override_redis():
        return redis_falso

    async def override_db():
        return db_falsa

    app.dependency_overrides[_obtener_db_placeholder] = override_db
    app.dependency_overrides[_obtener_redis_placeholder] = override_redis
    return app


@pytest.fixture
async def cliente(app_test):
    """Cliente HTTP async."""
    transport = ASGITransport(app=app_test)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


GEO_BUENOS_AIRES = ResultadoGeo(
    latitud=-34.6037,
    longitud=-58.3816,
    direccion_completa="Buenos Aires, Argentina",
)

DATOS_NATAL = {
    "nombre": "Test",
    "fecha_nacimiento": "1990-01-15",
    "hora_nacimiento": "14:30",
    "ciudad_nacimiento": "Buenos Aires",
    "pais_nacimiento": "Argentina",
}

DATOS_NUMEROLOGIA = {
    "nombre": "Juan Test",
    "fecha_nacimiento": "1990-01-15",
    "sistema": "pitagorico",
}


# --- Tests Carta Natal ---


class TestNatalCacheDB:
    """Verifica cache + DB en ruta /natal."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_primer_llamada_cache_miss(
        self, mock_geo, cliente, redis_falso, db_falsa
    ):
        """Primera llamada: cache miss → calcula → guarda en Redis y DB."""
        mock_geo.return_value = GEO_BUENOS_AIRES

        resp = await cliente.post("/api/v1/natal", json=DATOS_NATAL)

        assert resp.status_code == 200
        body = resp.json()
        assert body["exito"] is True
        assert body["cache"] is False
        assert "planetas" in body["datos"] or "casas" in body["datos"]

        # Redis: se guardó algo
        assert len(redis_falso._almacen) == 1

        # DB: se llamó add + commit
        db_falsa.add.assert_called_once()
        db_falsa.commit.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_segunda_llamada_cache_hit(
        self, mock_geo, cliente, redis_falso
    ):
        """Segunda llamada idéntica: cache hit → no recalcula."""
        mock_geo.return_value = GEO_BUENOS_AIRES

        # Primera llamada (llena cache)
        resp1 = await cliente.post("/api/v1/natal", json=DATOS_NATAL)
        assert resp1.json()["cache"] is False

        # Segunda llamada (cache hit)
        resp2 = await cliente.post("/api/v1/natal", json=DATOS_NATAL)
        body2 = resp2.json()

        assert body2["exito"] is True
        assert body2["cache"] is True
        assert body2["datos"] == resp1.json()["datos"]

        # Geo solo se llamó 1 vez (la segunda usó cache)
        assert mock_geo.call_count == 1

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_fallo_db_no_rompe_respuesta(
        self, mock_geo, cliente, db_falsa, redis_falso
    ):
        """Si la DB falla, la respuesta sigue siendo exitosa."""
        mock_geo.return_value = GEO_BUENOS_AIRES
        db_falsa.commit.side_effect = Exception("DB caída")

        resp = await cliente.post("/api/v1/natal", json=DATOS_NATAL)

        assert resp.status_code == 200
        assert resp.json()["exito"] is True
        assert resp.json()["cache"] is False


# --- Tests Diseño Humano ---


class TestDisenoHumanoCacheDB:
    """Verifica cache + DB en ruta /human-design."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.diseno_humano.ServicioGeo.geocodificar")
    async def test_cache_miss_y_persistencia(
        self, mock_geo, cliente, redis_falso, db_falsa
    ):
        mock_geo.return_value = GEO_BUENOS_AIRES

        resp = await cliente.post("/api/v1/human-design", json=DATOS_NATAL)

        assert resp.status_code == 200
        assert resp.json()["cache"] is False
        assert len(redis_falso._almacen) == 1
        db_falsa.add.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.diseno_humano.ServicioGeo.geocodificar")
    async def test_cache_hit(self, mock_geo, cliente, redis_falso):
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/human-design", json=DATOS_NATAL)
        resp2 = await cliente.post("/api/v1/human-design", json=DATOS_NATAL)

        assert resp2.json()["cache"] is True
        assert mock_geo.call_count == 1


# --- Tests Numerología ---


class TestNumerologiaCacheDB:
    """Verifica cache + DB en ruta /numerology."""

    @pytest.mark.asyncio
    async def test_cache_miss_y_persistencia(
        self, cliente, redis_falso, db_falsa
    ):
        """Numerología no usa geo, solo nombre + fecha."""
        resp = await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)

        assert resp.status_code == 200
        assert resp.json()["cache"] is False
        assert len(redis_falso._almacen) == 1
        db_falsa.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_hit(self, cliente, redis_falso):
        await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)
        resp2 = await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)

        assert resp2.json()["cache"] is True

    @pytest.mark.asyncio
    async def test_parametros_distintos_cache_miss(
        self, cliente, redis_falso
    ):
        """Parámetros diferentes generan hashes distintos → cache miss."""
        await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)

        datos_caldeo = {**DATOS_NUMEROLOGIA, "sistema": "caldeo"}
        resp2 = await cliente.post("/api/v1/numerology", json=datos_caldeo)

        assert resp2.json()["cache"] is False
        assert len(redis_falso._almacen) == 2


# --- Tests Retorno Solar ---


class TestRetornoSolarCacheDB:
    """Verifica cache + DB en ruta /solar-return/{anio}."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.retorno_solar.ServicioGeo.geocodificar")
    async def test_cache_miss_y_persistencia(
        self, mock_geo, cliente, redis_falso, db_falsa
    ):
        mock_geo.return_value = GEO_BUENOS_AIRES

        resp = await cliente.post(
            "/api/v1/solar-return/2025", json=DATOS_NATAL
        )

        assert resp.status_code == 200
        assert resp.json()["cache"] is False
        assert len(redis_falso._almacen) == 1
        db_falsa.add.assert_called_once()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.retorno_solar.ServicioGeo.geocodificar")
    async def test_cache_hit(self, mock_geo, cliente, redis_falso):
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/solar-return/2025", json=DATOS_NATAL)
        resp2 = await cliente.post("/api/v1/solar-return/2025", json=DATOS_NATAL)

        assert resp2.json()["cache"] is True

    @pytest.mark.asyncio
    @patch("app.rutas.v1.retorno_solar.ServicioGeo.geocodificar")
    async def test_anios_distintos_cache_miss(
        self, mock_geo, cliente, redis_falso
    ):
        """Años distintos generan hashes distintos."""
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/solar-return/2025", json=DATOS_NATAL)
        resp2 = await cliente.post("/api/v1/solar-return/2026", json=DATOS_NATAL)

        assert resp2.json()["cache"] is False
        assert len(redis_falso._almacen) == 2


# --- Tests Tránsitos ---


class TestTransitosCacheDB:
    """Verifica que tránsitos usan cache pero NO persisten en DB."""

    @pytest.mark.asyncio
    async def test_transitos_no_persisten_en_db(
        self, cliente, db_falsa
    ):
        """Tránsitos son efímeros: solo cache, sin DB."""
        resp = await cliente.get("/api/v1/transits")

        assert resp.status_code == 200
        assert resp.json()["exito"] is True

        # NO debe tocar la DB
        db_falsa.add.assert_not_called()
        db_falsa.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_transitos_usan_cache_redis(
        self, cliente, redis_falso
    ):
        """Tránsitos sí usan cache Redis con TTL corto."""
        resp1 = await cliente.get("/api/v1/transits")
        assert resp1.json()["cache"] is False

        # El setex debe haberse llamado (TTL=600)
        redis_falso.setex.assert_called_once()

        resp2 = await cliente.get("/api/v1/transits")
        assert resp2.json()["cache"] is True


# --- Tests genéricos de hash ---


class TestHashDeterminista:
    """Verifica que el mismo input genera el mismo hash."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_mismos_params_mismo_cache(
        self, mock_geo, cliente, redis_falso
    ):
        """Dos requests idénticos deben usar la misma clave de cache."""
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/natal", json=DATOS_NATAL)
        assert len(redis_falso._almacen) == 1

        await cliente.post("/api/v1/natal", json=DATOS_NATAL)
        # Sigue siendo 1 entrada (cache hit, no se agregó nueva)
        assert len(redis_falso._almacen) == 1

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_params_distintos_hashes_distintos(
        self, mock_geo, cliente, redis_falso
    ):
        """Parámetros diferentes generan entradas de cache distintas."""
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/natal", json=DATOS_NATAL)

        datos_distintos = {
            **DATOS_NATAL,
            "hora_nacimiento": "08:00",
        }
        await cliente.post("/api/v1/natal", json=datos_distintos)

        assert len(redis_falso._almacen) == 2


# --- Tests de resiliencia Redis ---


class TestResilienciaRedis:
    """Verifica que si Redis falla, las rutas siguen funcionando."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_redis_caido_natal_sigue_funcionando(
        self, mock_geo, cliente, redis_falso, db_falsa
    ):
        """Si Redis lanza excepción, la ruta calcula y responde igual."""
        mock_geo.return_value = GEO_BUENOS_AIRES
        redis_falso.get.side_effect = Exception("Redis caído")
        redis_falso.set.side_effect = Exception("Redis caído")

        resp = await cliente.post("/api/v1/natal", json=DATOS_NATAL)

        assert resp.status_code == 200
        assert resp.json()["exito"] is True
        assert resp.json()["cache"] is False
        # DB sigue recibiendo el cálculo
        db_falsa.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_redis_caido_transitos_sigue_funcionando(
        self, cliente, redis_falso
    ):
        """Tránsitos funciona incluso si Redis está caído."""
        redis_falso.get.side_effect = Exception("Redis caído")
        redis_falso.setex.side_effect = Exception("Redis caído")

        resp = await cliente.get("/api/v1/transits")

        assert resp.status_code == 200
        assert resp.json()["exito"] is True


# --- Tests cache hit no toca DB ---


class TestCacheHitNoPersiste:
    """Verifica que en cache hit NO se escribe a la DB."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_cache_hit_natal_no_llama_db(
        self, mock_geo, cliente, redis_falso, db_falsa
    ):
        mock_geo.return_value = GEO_BUENOS_AIRES

        # Primera llamada: llena cache + escribe DB
        await cliente.post("/api/v1/natal", json=DATOS_NATAL)
        db_falsa.reset_mock()

        # Segunda llamada: cache hit
        resp = await cliente.post("/api/v1/natal", json=DATOS_NATAL)
        assert resp.json()["cache"] is True

        # DB no fue tocada
        db_falsa.add.assert_not_called()
        db_falsa.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_hit_numerologia_no_llama_db(
        self, cliente, redis_falso, db_falsa
    ):
        await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)
        db_falsa.reset_mock()

        resp = await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)
        assert resp.json()["cache"] is True

        db_falsa.add.assert_not_called()
        db_falsa.commit.assert_not_called()


# --- Tests TTL correcto por tipo ---


class TestTTLPorTipo:
    """Verifica que las rutas deterministas usan set (sin TTL)
    y tránsitos usa setex (con TTL)."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_natal_usa_set_sin_ttl(
        self, mock_geo, cliente, redis_falso
    ):
        """Natal es determinista → redis.set, no redis.setex."""
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/natal", json=DATOS_NATAL)

        redis_falso.set.assert_called_once()
        redis_falso.setex.assert_not_called()

    @pytest.mark.asyncio
    @patch("app.rutas.v1.diseno_humano.ServicioGeo.geocodificar")
    async def test_hd_usa_set_sin_ttl(
        self, mock_geo, cliente, redis_falso
    ):
        """HD es determinista → redis.set, no redis.setex."""
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/human-design", json=DATOS_NATAL)

        redis_falso.set.assert_called_once()
        redis_falso.setex.assert_not_called()

    @pytest.mark.asyncio
    async def test_transitos_usa_setex_con_ttl(
        self, cliente, redis_falso
    ):
        """Tránsitos es efímero → redis.setex con TTL=600."""
        await cliente.get("/api/v1/transits")

        redis_falso.setex.assert_called_once()
        # Verificar que el TTL es 600
        args = redis_falso.setex.call_args
        assert args[0][1] == 600
        redis_falso.set.assert_not_called()


# --- Tests perfil_id=None en DB ---


class TestPerfilIdNulo:
    """Verifica que los cálculos anónimos guardan perfil_id=None."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_natal_guarda_perfil_id_none(
        self, mock_geo, cliente, db_falsa
    ):
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/natal", json=DATOS_NATAL)

        # Verificar el objeto Calculo que se pasó a db.add
        calculo = db_falsa.add.call_args[0][0]
        assert calculo.perfil_id is None
        assert calculo.tipo == "natal"
        assert calculo.hash_parametros is not None
        assert calculo.resultado_json is not None

    @pytest.mark.asyncio
    @patch("app.rutas.v1.diseno_humano.ServicioGeo.geocodificar")
    async def test_hd_guarda_tipo_correcto(
        self, mock_geo, cliente, db_falsa
    ):
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/human-design", json=DATOS_NATAL)

        calculo = db_falsa.add.call_args[0][0]
        assert calculo.perfil_id is None
        assert calculo.tipo == "human-design"

    @pytest.mark.asyncio
    async def test_numerologia_guarda_tipo_correcto(
        self, cliente, db_falsa
    ):
        await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)

        calculo = db_falsa.add.call_args[0][0]
        assert calculo.perfil_id is None
        assert calculo.tipo == "numerology"

    @pytest.mark.asyncio
    @patch("app.rutas.v1.retorno_solar.ServicioGeo.geocodificar")
    async def test_retorno_solar_guarda_tipo_correcto(
        self, mock_geo, cliente, db_falsa
    ):
        mock_geo.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/solar-return/2025", json=DATOS_NATAL)

        calculo = db_falsa.add.call_args[0][0]
        assert calculo.perfil_id is None
        assert calculo.tipo == "solar-return"


# --- Tests aislamiento de hash entre tipos ---


class TestAislamientoHashTipos:
    """Verifica que la misma persona en rutas distintas genera hashes distintos."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.diseno_humano.ServicioGeo.geocodificar")
    @patch("app.rutas.v1.natal.ServicioGeo.geocodificar")
    async def test_natal_vs_hd_hashes_distintos(
        self, mock_geo_natal, mock_geo_hd, cliente, redis_falso
    ):
        """Mismos datos en /natal y /human-design generan hashes distintos."""
        mock_geo_natal.return_value = GEO_BUENOS_AIRES
        mock_geo_hd.return_value = GEO_BUENOS_AIRES

        await cliente.post("/api/v1/natal", json=DATOS_NATAL)
        await cliente.post("/api/v1/human-design", json=DATOS_NATAL)

        # Deben ser 2 entradas distintas en cache
        assert len(redis_falso._almacen) == 2


# --- Tests DB failure en otras rutas ---


class TestResilienciaDB:
    """Verifica que fallo de DB no rompe respuesta en todas las rutas."""

    @pytest.mark.asyncio
    @patch("app.rutas.v1.diseno_humano.ServicioGeo.geocodificar")
    async def test_fallo_db_hd(self, mock_geo, cliente, db_falsa):
        mock_geo.return_value = GEO_BUENOS_AIRES
        db_falsa.commit.side_effect = Exception("DB caída")

        resp = await cliente.post("/api/v1/human-design", json=DATOS_NATAL)
        assert resp.status_code == 200
        assert resp.json()["exito"] is True

    @pytest.mark.asyncio
    async def test_fallo_db_numerologia(self, cliente, db_falsa):
        db_falsa.commit.side_effect = Exception("DB caída")

        resp = await cliente.post("/api/v1/numerology", json=DATOS_NUMEROLOGIA)
        assert resp.status_code == 200
        assert resp.json()["exito"] is True

    @pytest.mark.asyncio
    @patch("app.rutas.v1.retorno_solar.ServicioGeo.geocodificar")
    async def test_fallo_db_retorno_solar(self, mock_geo, cliente, db_falsa):
        mock_geo.return_value = GEO_BUENOS_AIRES
        db_falsa.commit.side_effect = Exception("DB caída")

        resp = await cliente.post("/api/v1/solar-return/2025", json=DATOS_NATAL)
        assert resp.status_code == 200
        assert resp.json()["exito"] is True
