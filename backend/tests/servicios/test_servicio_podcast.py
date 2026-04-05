"""Tests para ServicioPodcast."""

from datetime import date

from app.servicios.servicio_podcast import (
    ServicioPodcast,
    TIPOS_PODCAST,
    _calcular_fecha_clave,
)


class TestGenerarSegmentos:
    """Tests para _generar_segmentos."""

    def test_segmentos_proporcionales(self):
        """Los timestamps se distribuyen proporcionalmente por longitud."""
        texto = "Párrafo corto.\n\nPárrafo un poco más largo que el anterior.\n\nPárrafo final."
        duracion = 120.0
        segmentos = ServicioPodcast._generar_segmentos(texto, duracion)

        assert len(segmentos) == 3
        # Primer segmento empieza en 0
        assert segmentos[0]["inicio_seg"] == 0.0
        # Último segmento termina en la duración
        assert segmentos[-1]["fin_seg"] == 120.0
        # Segmentos consecutivos
        for i in range(len(segmentos) - 1):
            assert segmentos[i]["fin_seg"] == segmentos[i + 1]["inicio_seg"]
        # Segmento más largo tiene mayor duración
        dur_seg = [s["fin_seg"] - s["inicio_seg"] for s in segmentos]
        assert dur_seg[1] > dur_seg[0]  # párrafo 2 es más largo

    def test_texto_vacio(self):
        """Texto vacío retorna lista vacía."""
        assert ServicioPodcast._generar_segmentos("", 100.0) == []

    def test_un_solo_parrafo(self):
        """Un solo párrafo ocupa toda la duración."""
        segmentos = ServicioPodcast._generar_segmentos("Un solo párrafo.", 60.0)
        assert len(segmentos) == 1
        assert segmentos[0]["inicio_seg"] == 0.0
        assert segmentos[0]["fin_seg"] == 60.0

    def test_segmentos_contienen_texto(self):
        """Cada segmento tiene el texto del párrafo correspondiente."""
        texto = "Primero.\n\nSegundo.\n\nTercero."
        segmentos = ServicioPodcast._generar_segmentos(texto, 90.0)
        assert segmentos[0]["texto"] == "Primero."
        assert segmentos[1]["texto"] == "Segundo."
        assert segmentos[2]["texto"] == "Tercero."


class TestConstruirPrompt:
    """Tests para _construir_system_podcast."""

    def test_incluye_tipo_dia(self):
        """El prompt incluye información del tipo día."""
        prompt = ServicioPodcast._construir_system_podcast("dia")
        assert "DÍA" in prompt
        assert "energías" in prompt.lower()

    def test_incluye_tipo_semana(self):
        """El prompt incluye información del tipo semana."""
        prompt = ServicioPodcast._construir_system_podcast("semana")
        assert "SEMANA" in prompt
        assert "lunes a domingo" in prompt.lower()

    def test_incluye_tipo_mes(self):
        """El prompt incluye información del tipo mes."""
        prompt = ServicioPodcast._construir_system_podcast("mes")
        assert "MES" in prompt
        assert "lunas" in prompt.lower()

    def test_incluye_perfil(self):
        """El prompt incluye datos del perfil cósmico."""
        perfil = {
            "datos_personales": {"nombre": "Luna", "fecha_nacimiento": "1990-01-15"},
            "natal": {
                "planetas": [
                    {"nombre": "Sol", "signo": "Capricornio", "casa": 10},
                    {"nombre": "Luna", "signo": "Aries", "casa": 1},
                ],
            },
        }
        prompt = ServicioPodcast._construir_system_podcast("dia", perfil)
        assert "Capricornio" in prompt
        assert "Luna" in prompt

    def test_incluye_transitos(self):
        """El prompt incluye datos de tránsitos."""
        transitos = {
            "planetas": [
                {"nombre": "Mercurio", "signo": "Piscis", "grado_en_signo": 15.3},
            ]
        }
        prompt = ServicioPodcast._construir_system_podcast("semana", transitos=transitos)
        assert "Mercurio" in prompt
        assert "Piscis" in prompt


class TestTiposPodcast:
    """Tests para la configuración de tipos."""

    def test_tres_tipos(self):
        """Existen exactamente 3 tipos configurados."""
        assert len(TIPOS_PODCAST) == 3
        assert set(TIPOS_PODCAST.keys()) == {"dia", "semana", "mes"}

    def test_cada_tipo_tiene_template_y_prompt(self):
        """Cada tipo tiene titulo_template y prompt_extra."""
        for tipo, info in TIPOS_PODCAST.items():
            assert "titulo_template" in info
            assert "prompt_extra" in info
            assert len(info["prompt_extra"]) > 20


class TestCalcularFechaClave:
    """Tests para _calcular_fecha_clave."""

    def test_dia_misma_fecha(self):
        """Tipo 'dia' retorna la misma fecha."""
        hoy = date(2026, 3, 23)  # lunes
        assert _calcular_fecha_clave("dia", hoy) == hoy

    def test_semana_retorna_lunes(self):
        """Tipo 'semana' retorna el lunes de la semana."""
        # 2026-03-23 es lunes
        lunes = date(2026, 3, 23)
        assert _calcular_fecha_clave("semana", lunes) == lunes

        # Miércoles de la misma semana
        miercoles = date(2026, 3, 25)
        assert _calcular_fecha_clave("semana", miercoles) == lunes

        # Domingo de la misma semana
        domingo = date(2026, 3, 29)
        assert _calcular_fecha_clave("semana", domingo) == lunes

    def test_mes_retorna_dia_uno(self):
        """Tipo 'mes' retorna el primer día del mes."""
        dia_15 = date(2026, 3, 15)
        assert _calcular_fecha_clave("mes", dia_15) == date(2026, 3, 1)

        dia_1 = date(2026, 3, 1)
        assert _calcular_fecha_clave("mes", dia_1) == date(2026, 3, 1)

        dia_31 = date(2026, 1, 31)
        assert _calcular_fecha_clave("mes", dia_31) == date(2026, 1, 1)

    def test_semana_cruza_mes(self):
        """Semana que cruza frontera de mes normaliza al lunes."""
        # 2026-04-01 es miércoles → lunes sería 2026-03-30
        miercoles_abril = date(2026, 4, 1)
        lunes_esperado = date(2026, 3, 30)
        assert _calcular_fecha_clave("semana", miercoles_abril) == lunes_esperado


class TestConstruirTitulo:
    """Tests para _construir_titulo."""

    def test_titulo_dia(self):
        """El título del día incluye la fecha formateada."""
        titulo = ServicioPodcast._construir_titulo("dia", date(2026, 3, 23))
        assert "23/03" in titulo
        assert "tránsitos en vos" in titulo

    def test_titulo_semana(self):
        """El título de la semana incluye rango de fechas."""
        titulo = ServicioPodcast._construir_titulo("semana", date(2026, 3, 23))
        assert "23/03" in titulo
        assert "29/03" in titulo
        assert "Revisemos cómo viene tu semana" in titulo

    def test_titulo_mes(self):
        """El título del mes incluye nombre del mes y año."""
        titulo = ServicioPodcast._construir_titulo("mes", date(2026, 3, 1))
        assert "Marzo" in titulo
        assert "2026" in titulo
        assert "Ampliá tu horizonte para este mes" in titulo
