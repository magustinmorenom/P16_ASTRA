"""Tests para el sistema de tránsitos persistidos con ventana deslizante."""

import uuid
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.modelos.transito_diario import TransitoDiario
from app.servicios.servicio_transitos_persistidos import (
    DIAS_VENTANA_FUTURO,
    _determinar_estado,
    calcular_aspectos_entre_planetas,
    calcular_fase_lunar,
    calcular_transito_para_fecha,
    purgar_transitos_antiguos,
    verificar_y_completar_ventana,
)


# ================================================================== #
# Helpers                                                             #
# ================================================================== #


def _crear_transito_mock(fecha: date, estado: str = "futuro") -> TransitoDiario:
    """Crea un TransitoDiario mock para tests."""
    t = MagicMock(spec=TransitoDiario)
    t.id = uuid.uuid4()
    t.fecha = fecha
    t.dia_juliano = 2460000.0
    t.planetas = [{
        "nombre": "Sol",
        "longitud": 10.0,
        "signo": "Aries",
        "retrogrado": False,
        "velocidad": 1.0,
        "latitud": 0.0,
        "grado_en_signo": 10.0,
    }]
    t.aspectos = []
    t.fase_lunar = "Luna Nueva"
    t.eventos = None
    t.estado = estado
    return t


# ================================================================== #
# Tests de cálculo de contenido                                      #
# ================================================================== #


class TestCalculoTransito:
    """Tests de la función calcular_transito_para_fecha."""

    def test_planetas_completos(self):
        """Cada día debe tener los 11 cuerpos esperados."""
        resultado = calcular_transito_para_fecha(date(2025, 6, 15))
        assert len(resultado["planetas"]) == 11

    def test_campos_planetas(self):
        """Cada planeta debe tener todos los campos requeridos."""
        resultado = calcular_transito_para_fecha(date(2025, 6, 15))
        campos = {"nombre", "longitud", "latitud", "signo", "grado_en_signo", "retrogrado", "velocidad"}
        for p in resultado["planetas"]:
            assert campos.issubset(p.keys()), f"Faltan campos en {p['nombre']}"

    def test_longitudes_en_rango(self):
        """Las longitudes deben estar entre 0 y 360."""
        resultado = calcular_transito_para_fecha(date(2025, 3, 21))
        for p in resultado["planetas"]:
            assert 0 <= p["longitud"] < 360, f"{p['nombre']}: longitud {p['longitud']} fuera de rango"

    def test_determinismo(self):
        """Calcular misma fecha 2 veces debe dar resultado idéntico."""
        fecha = date(2025, 1, 1)
        r1 = calcular_transito_para_fecha(fecha)
        r2 = calcular_transito_para_fecha(fecha)
        assert r1["planetas"] == r2["planetas"]
        assert r1["dia_juliano"] == r2["dia_juliano"]
        assert r1["fase_lunar"] == r2["fase_lunar"]

    def test_coherencia_con_efemerides(self):
        """El resultado debe coincidir con cálculo directo de ServicioEfemerides."""
        from app.nucleo.servicio_efemerides import ServicioEfemerides
        from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
        from datetime import datetime
        import pytz

        fecha = date(2025, 6, 15)
        resultado = calcular_transito_para_fecha(fecha)

        mediodia = datetime(2025, 6, 15, 12, 0, 0, tzinfo=pytz.UTC)
        jd = ServicioZonaHoraria.calcular_dia_juliano(mediodia)
        planetas_directo = ServicioEfemerides.calcular_todos_los_planetas(jd)

        for pd, pp in zip(planetas_directo, resultado["planetas"]):
            assert pd.nombre == pp["nombre"]
            assert abs(pd.longitud - pp["longitud"]) < 0.001


class TestFaseLunar:
    """Tests de cálculo de fase lunar."""

    def test_luna_nueva(self):
        assert calcular_fase_lunar(100.0, 105.0) == "Luna Nueva"

    def test_cuarto_creciente(self):
        assert calcular_fase_lunar(100.0, 190.0) == "Cuarto Creciente"

    def test_luna_llena(self):
        assert calcular_fase_lunar(100.0, 280.0) == "Luna Llena"

    def test_cuarto_menguante(self):
        # diff = (10 - 100) % 360 = 270 → Cuarto Menguante
        assert calcular_fase_lunar(100.0, 370.0 % 360) == "Cuarto Menguante"

    def test_menguante(self):
        # diff = (60 - 100 + 360) % 360 = 320 → Menguante
        assert calcular_fase_lunar(100.0, 60.0) == "Menguante"

    def test_fase_coherente_con_transito(self):
        """La fase calculada en un tránsito debe ser una fase válida."""
        resultado = calcular_transito_para_fecha(date.today())
        fases_validas = {
            "Luna Nueva", "Creciente", "Cuarto Creciente", "Gibosa Creciente",
            "Luna Llena", "Gibosa Menguante", "Cuarto Menguante", "Menguante",
        }
        assert resultado["fase_lunar"] in fases_validas


class TestAspectosEntreTransitos:
    """Tests de cálculo de aspectos entre planetas."""

    def test_detecta_conjuncion(self):
        planetas = [
            {"nombre": "Sol", "longitud": 100.0},
            {"nombre": "Luna", "longitud": 103.0},
        ]
        aspectos = calcular_aspectos_entre_planetas(planetas)
        assert any(a["tipo"] == "Conjunción" for a in aspectos)

    def test_detecta_oposicion(self):
        planetas = [
            {"nombre": "Sol", "longitud": 10.0},
            {"nombre": "Luna", "longitud": 190.0},
        ]
        aspectos = calcular_aspectos_entre_planetas(planetas)
        assert any(a["tipo"] == "Oposición" for a in aspectos)

    def test_sin_aspecto_fuera_de_orbe(self):
        planetas = [
            {"nombre": "Sol", "longitud": 10.0},
            {"nombre": "Luna", "longitud": 55.0},
        ]
        aspectos = calcular_aspectos_entre_planetas(planetas)
        assert len(aspectos) == 0

    def test_aspectos_tienen_campos_requeridos(self):
        resultado = calcular_transito_para_fecha(date(2025, 6, 15))
        for a in resultado["aspectos"]:
            assert "planeta_a" in a
            assert "planeta_b" in a
            assert "tipo" in a
            assert "angulo" in a
            assert "orbe" in a

    def test_orbe_dentro_del_limite(self):
        """Todos los aspectos detectados deben estar dentro del orbe máximo."""
        from app.utilidades.constantes import ASPECTOS
        resultado = calcular_transito_para_fecha(date(2025, 6, 15))
        for a in resultado["aspectos"]:
            tipo = a["tipo"]
            orbe_max = ASPECTOS[tipo]["orbe"]
            assert a["orbe"] <= orbe_max, f"{a}: orbe {a['orbe']} > máx {orbe_max}"


# ================================================================== #
# Tests de determinación de estado                                   #
# ================================================================== #


class TestDeterminarEstado:
    """Tests de la función _determinar_estado."""

    def test_pasado(self):
        assert _determinar_estado(date(2020, 1, 1), date(2025, 1, 1)) == "pasado"

    def test_presente(self):
        hoy = date.today()
        assert _determinar_estado(hoy, hoy) == "presente"

    def test_futuro(self):
        assert _determinar_estado(date(2099, 1, 1), date(2025, 1, 1)) == "futuro"


# ================================================================== #
# Tests de auto-reparación de ventana (mock de repositorio)          #
# ================================================================== #


class TestVerificarYCompletarVentana:
    """Tests de la lógica de auto-reparación de ventana."""

    @pytest.mark.anyio
    async def test_ventana_completa_no_calcula(self):
        """Si la ventana ya está completa, no inserta nada."""
        hoy = date.today()
        repo = AsyncMock()
        repo.actualizar_estados = AsyncMock()
        repo.obtener_ultima_fecha_futuro = AsyncMock(
            return_value=hoy + timedelta(days=DIAS_VENTANA_FUTURO + 1)
        )

        insertados = await verificar_y_completar_ventana(repo)
        assert insertados == 0
        repo.crear_lote.assert_not_called()

    @pytest.mark.anyio
    async def test_ventana_con_gap_rellena(self):
        """Si faltan días, los calcula e inserta."""
        hoy = date.today()
        dias_existentes = DIAS_VENTANA_FUTURO - 5
        repo = AsyncMock()
        repo.actualizar_estados = AsyncMock()
        repo.obtener_ultima_fecha_futuro = AsyncMock(
            return_value=hoy + timedelta(days=dias_existentes)
        )
        repo.crear_lote = AsyncMock(return_value=5)

        insertados = await verificar_y_completar_ventana(repo)
        assert insertados == 5
        repo.crear_lote.assert_called_once()
        datos = repo.crear_lote.call_args[0][0]
        assert len(datos) == 5

    @pytest.mark.anyio
    async def test_rotacion_estados(self):
        """Siempre rota estados al verificar la ventana."""
        hoy = date.today()
        repo = AsyncMock()
        repo.actualizar_estados = AsyncMock()
        repo.obtener_ultima_fecha_futuro = AsyncMock(
            return_value=hoy + timedelta(days=DIAS_VENTANA_FUTURO + 1)
        )

        await verificar_y_completar_ventana(repo)
        repo.actualizar_estados.assert_called_once_with(hoy)

    @pytest.mark.anyio
    async def test_ventana_vacia_carga_desde_hoy(self):
        """Si la DB está vacía, carga desde hoy hasta hoy+365."""
        hoy = date.today()
        repo = AsyncMock()
        repo.actualizar_estados = AsyncMock()
        repo.obtener_ultima_fecha_futuro = AsyncMock(return_value=None)
        repo.obtener_primera_fecha = AsyncMock(return_value=None)
        repo.crear_lote = AsyncMock(return_value=DIAS_VENTANA_FUTURO + 1)

        insertados = await verificar_y_completar_ventana(repo)
        assert insertados == DIAS_VENTANA_FUTURO + 1
        datos = repo.crear_lote.call_args[0][0]
        assert datos[0]["fecha"] == hoy
        assert datos[-1]["fecha"] == hoy + timedelta(days=DIAS_VENTANA_FUTURO)

    @pytest.mark.anyio
    async def test_auto_reparacion_idempotente(self):
        """Llamar 2 veces con ventana completa no inserta nada la segunda vez."""
        hoy = date.today()
        repo = AsyncMock()
        repo.actualizar_estados = AsyncMock()
        repo.obtener_ultima_fecha_futuro = AsyncMock(
            return_value=hoy + timedelta(days=DIAS_VENTANA_FUTURO)
        )

        insertados = await verificar_y_completar_ventana(repo)
        assert insertados == 0


# ================================================================== #
# Tests de purga                                                     #
# ================================================================== #


class TestPurgaTransitos:
    """Tests de purga de tránsitos antiguos."""

    @pytest.mark.anyio
    async def test_purga_ejecuta_con_fecha_correcta(self):
        """La purga usa la fecha límite de 5 años."""
        repo = AsyncMock()
        repo.purgar_antiguos = AsyncMock(return_value=100)

        eliminados = await purgar_transitos_antiguos(repo)
        assert eliminados == 100
        llamada = repo.purgar_antiguos.call_args[0][0]
        # La fecha límite debe ser ~5 años atrás (tolerancia de 2 días)
        esperada = date.today() - timedelta(days=365 * 5)
        assert abs((llamada - esperada).days) <= 2


# ================================================================== #
# Tests del modelo                                                   #
# ================================================================== #


class TestModeloTransitoDiario:
    """Tests del modelo TransitoDiario."""

    def test_tablename(self):
        assert TransitoDiario.__tablename__ == "transitos_diarios"

    def test_campos_requeridos(self):
        """El modelo tiene los campos esperados."""
        columnas = {c.name for c in TransitoDiario.__table__.columns}
        esperadas = {"id", "fecha", "dia_juliano", "planetas", "aspectos", "fase_lunar", "estado", "creado_en"}
        assert esperadas.issubset(columnas)

    def test_fecha_unique(self):
        """La columna fecha tiene constraint unique."""
        col_fecha = TransitoDiario.__table__.columns["fecha"]
        assert col_fecha.unique is True


# ================================================================== #
# Tests de integración: ServicioTransitos con persistencia           #
# ================================================================== #


class TestServicioTransitosPersistido:
    """Tests de los métodos DB-first de ServicioTransitos."""

    @pytest.mark.anyio
    async def test_obtener_fecha_desde_db(self):
        """Si el tránsito existe en DB, lo retorna sin recalcular."""
        from app.servicios.servicio_transitos import ServicioTransitos

        fecha = date(2025, 6, 15)
        transito_mock = _crear_transito_mock(fecha, "futuro")

        sesion = AsyncMock()
        with patch("app.datos.repositorio_transito.RepositorioTransito") as MockRepo:
            mock_repo = MockRepo.return_value
            mock_repo.obtener_por_fecha = AsyncMock(side_effect=[transito_mock, None])

            resultado = await ServicioTransitos.obtener_transitos_fecha_persistido(
                "2025-06-15", sesion
            )

        assert resultado["fecha"] == "2025-06-15"
        assert resultado["planetas"] == transito_mock.planetas
        assert "eventos" in resultado
        assert resultado["estado"] == "futuro"

    @pytest.mark.anyio
    async def test_obtener_fecha_fallback_calculo(self):
        """Si no existe en DB, calcula en vivo y persiste."""
        from app.servicios.servicio_transitos import ServicioTransitos

        sesion = AsyncMock()
        with patch("app.datos.repositorio_transito.RepositorioTransito") as MockRepo:
            mock_repo = MockRepo.return_value
            mock_repo.obtener_por_fecha = AsyncMock(return_value=None)
            mock_repo.crear_lote = AsyncMock(return_value=1)

            resultado = await ServicioTransitos.obtener_transitos_fecha_persistido(
                "2025-06-15", sesion
            )

        assert resultado["fecha"] == "2025-06-15"
        assert len(resultado["planetas"]) == 11
        mock_repo.crear_lote.assert_called_once()

    @pytest.mark.anyio
    async def test_obtener_rango_incluye_eventos_y_estado(self):
        """El rango persistido debe exponer eventos y estado por cada día."""
        from app.servicios.servicio_transitos import ServicioTransitos

        sesion = AsyncMock()
        dia_1 = _crear_transito_mock(date(2025, 6, 15), "presente")
        dia_1.eventos = {
            "cambios_signo": [],
            "retrogrados_inicio": ["Mercurio"],
            "retrogrados_fin": [],
            "aspectos_exactos": [],
            "fases": "Luna Nueva",
        }
        dia_2 = _crear_transito_mock(date(2025, 6, 16), "futuro")
        dia_2.planetas = [{
            "nombre": "Sol",
            "longitud": 12.0,
            "signo": "Aries",
            "retrogrado": False,
            "velocidad": 1.0,
            "latitud": 0.0,
            "grado_en_signo": 12.0,
        }]
        dia_2.fase_lunar = "Creciente"

        with patch("app.datos.repositorio_transito.RepositorioTransito") as MockRepo:
            mock_repo = MockRepo.return_value
            mock_repo.obtener_rango = AsyncMock(return_value=[dia_1, dia_2])
            mock_repo.obtener_por_fecha = AsyncMock(return_value=dia_1)
            mock_repo.crear_lote = AsyncMock(return_value=0)

            resultado = await ServicioTransitos.obtener_transitos_rango_persistido(
                "2025-06-15",
                "2025-06-16",
                sesion,
            )

        assert resultado["fecha_inicio"] == "2025-06-15"
        assert len(resultado["dias"]) == 2
        assert resultado["dias"][0]["eventos"]["retrogrados_inicio"] == ["Mercurio"]
        assert resultado["dias"][0]["estado"] == "presente"
        assert "eventos" in resultado["dias"][1]
