"""Servicio de tránsitos planetarios en tiempo real y persistidos."""

from datetime import datetime, date, timedelta

import pytz
from sqlalchemy.ext.asyncio import AsyncSession

from app.nucleo.servicio_efemerides import ServicioEfemerides
from app.nucleo.servicio_zona_horaria import ServicioZonaHoraria
from app.utilidades.constantes import ASPECTOS
from app.utilidades.convertidores import diferencia_angular


class ServicioTransitos:
    """Calcula posiciones planetarias actuales y aspectos con carta natal."""

    @classmethod
    def obtener_transitos_actuales(cls) -> dict:
        """Obtiene las posiciones actuales de todos los planetas."""
        ahora = datetime.now(pytz.UTC)
        jd_ahora = ServicioZonaHoraria.calcular_dia_juliano(ahora)

        planetas = ServicioEfemerides.calcular_todos_los_planetas(jd_ahora)

        return {
            "fecha_utc": ahora.isoformat(),
            "dia_juliano": round(jd_ahora, 6),
            "planetas": [
                {
                    "nombre": p.nombre,
                    "longitud": round(p.longitud, 4),
                    "latitud": round(p.latitud, 4),
                    "signo": p.signo,
                    "grado_en_signo": round(p.grado_en_signo, 4),
                    "retrogrado": p.retrogrado,
                    "velocidad": round(p.velocidad, 4),
                }
                for p in planetas
            ],
        }

    @classmethod
    def calcular_aspectos_transito_natal(
        cls,
        dia_juliano_natal: float,
        latitud_natal: float,
        longitud_natal: float,
    ) -> dict:
        """Calcula aspectos entre tránsitos actuales y carta natal.

        Args:
            dia_juliano_natal: JD del nacimiento
            latitud_natal: Latitud del nacimiento
            longitud_natal: Longitud del nacimiento

        Returns:
            Tránsitos actuales + aspectos con la carta natal
        """
        transitos = cls.obtener_transitos_actuales()

        # Obtener posiciones natales
        planetas_natales = ServicioEfemerides.calcular_todos_los_planetas(dia_juliano_natal)

        aspectos = []
        for pt in transitos["planetas"]:
            for pn in planetas_natales:
                diff = diferencia_angular(pt["longitud"], pn.longitud)
                for nombre, config in ASPECTOS.items():
                    orbe = abs(diff - config["angulo"])
                    if orbe <= config["orbe"]:
                        aspectos.append({
                            "planeta_transito": pt["nombre"],
                            "planeta_natal": pn.nombre,
                            "tipo": nombre,
                            "angulo": round(diff, 4),
                            "orbe": round(orbe, 4),
                        })

        transitos["aspectos_natal"] = aspectos
        return transitos

    @classmethod
    def obtener_transitos_fecha(cls, fecha: str) -> dict:
        """Obtiene las posiciones planetarias para una fecha específica a mediodía UTC.

        Args:
            fecha: Fecha en formato YYYY-MM-DD

        Returns:
            Dict con fecha, fecha_utc, dia_juliano y planetas
        """
        fecha_obj = date.fromisoformat(fecha)
        mediodia_utc = datetime(
            fecha_obj.year, fecha_obj.month, fecha_obj.day,
            12, 0, 0, tzinfo=pytz.UTC,
        )
        jd = ServicioZonaHoraria.calcular_dia_juliano(mediodia_utc)
        planetas = ServicioEfemerides.calcular_todos_los_planetas(jd)

        return {
            "fecha": fecha,
            "fecha_utc": mediodia_utc.isoformat(),
            "dia_juliano": round(jd, 6),
            "planetas": [
                {
                    "nombre": p.nombre,
                    "longitud": round(p.longitud, 4),
                    "latitud": round(p.latitud, 4),
                    "signo": p.signo,
                    "grado_en_signo": round(p.grado_en_signo, 4),
                    "retrogrado": p.retrogrado,
                    "velocidad": round(p.velocidad, 4),
                }
                for p in planetas
            ],
        }

    @classmethod
    def obtener_transitos_rango(cls, fecha_inicio: str, fecha_fin: str) -> dict:
        """Obtiene tránsitos para un rango de fechas (máximo 31 días).

        Args:
            fecha_inicio: Fecha inicio en formato YYYY-MM-DD
            fecha_fin: Fecha fin en formato YYYY-MM-DD

        Returns:
            Dict con fecha_inicio, fecha_fin y lista de días

        Raises:
            ValueError: Si el rango excede 31 días
        """
        inicio = date.fromisoformat(fecha_inicio)
        fin = date.fromisoformat(fecha_fin)
        cantidad_dias = (fin - inicio).days + 1

        if cantidad_dias > 31:
            raise ValueError("El rango no puede exceder 31 días")
        if cantidad_dias < 1:
            raise ValueError("La fecha de inicio debe ser anterior o igual a la fecha de fin")

        dias = []
        fecha_actual = inicio
        while fecha_actual <= fin:
            dia = cls.obtener_transitos_fecha(fecha_actual.isoformat())
            dias.append(dia)
            fecha_actual += timedelta(days=1)

        return {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "dias": dias,
        }

    # ------------------------------------------------------------------ #
    # Métodos con persistencia (DB-first, fallback cálculo en vivo)      #
    # ------------------------------------------------------------------ #

    @classmethod
    async def obtener_transitos_fecha_persistido(
        cls, fecha: str, sesion: AsyncSession
    ) -> dict:
        """Busca tránsitos en DB; si no existen, calcula en vivo y persiste.

        Args:
            fecha: Fecha en formato YYYY-MM-DD
            sesion: Sesión async de SQLAlchemy

        Returns:
            Dict con fecha, fecha_utc, dia_juliano, planetas, aspectos, fase_lunar
        """
        from app.datos.repositorio_transito import RepositorioTransito
        from app.servicios.servicio_transitos_persistidos import (
            calcular_transito_para_fecha,
            _determinar_estado,
        )

        fecha_obj = date.fromisoformat(fecha)
        repo = RepositorioTransito(sesion)
        transito = await repo.obtener_por_fecha(fecha_obj)

        if transito:
            return {
                "fecha": transito.fecha.isoformat(),
                "fecha_utc": datetime(
                    transito.fecha.year, transito.fecha.month, transito.fecha.day,
                    12, 0, 0, tzinfo=pytz.UTC,
                ).isoformat(),
                "dia_juliano": transito.dia_juliano,
                "planetas": transito.planetas,
                "aspectos": transito.aspectos,
                "fase_lunar": transito.fase_lunar,
            }

        # Fallback: calcular en vivo y persistir
        datos = calcular_transito_para_fecha(fecha_obj)
        datos["estado"] = _determinar_estado(fecha_obj, date.today())
        await repo.crear_lote([datos])
        await sesion.commit()

        return {
            "fecha": datos["fecha"].isoformat(),
            "fecha_utc": datetime(
                fecha_obj.year, fecha_obj.month, fecha_obj.day,
                12, 0, 0, tzinfo=pytz.UTC,
            ).isoformat(),
            "dia_juliano": datos["dia_juliano"],
            "planetas": datos["planetas"],
            "aspectos": datos["aspectos"],
            "fase_lunar": datos["fase_lunar"],
        }

    @classmethod
    async def obtener_transitos_rango_persistido(
        cls, fecha_inicio: str, fecha_fin: str, sesion: AsyncSession
    ) -> dict:
        """Obtiene tránsitos de un rango desde DB (sin límite de 31 días).

        Fechas no encontradas en DB se calculan en vivo y se persisten.
        """
        from app.datos.repositorio_transito import RepositorioTransito
        from app.servicios.servicio_transitos_persistidos import (
            calcular_transito_para_fecha,
            _determinar_estado,
        )

        inicio = date.fromisoformat(fecha_inicio)
        fin = date.fromisoformat(fecha_fin)
        if inicio > fin:
            raise ValueError("La fecha de inicio debe ser anterior o igual a la fecha de fin")

        repo = RepositorioTransito(sesion)
        existentes = await repo.obtener_rango(inicio, fin)
        fechas_existentes = {t.fecha for t in existentes}

        # Calcular y persistir los faltantes
        hoy = date.today()
        faltantes = []
        fecha_actual = inicio
        while fecha_actual <= fin:
            if fecha_actual not in fechas_existentes:
                datos = calcular_transito_para_fecha(fecha_actual)
                datos["estado"] = _determinar_estado(fecha_actual, hoy)
                faltantes.append(datos)
            fecha_actual += timedelta(days=1)

        if faltantes:
            await repo.crear_lote(faltantes)
            await sesion.commit()
            # Re-obtener todos
            existentes = await repo.obtener_rango(inicio, fin)

        dias = []
        for t in existentes:
            dias.append({
                "fecha": t.fecha.isoformat(),
                "dia_juliano": t.dia_juliano,
                "planetas": t.planetas,
                "aspectos": t.aspectos,
                "fase_lunar": t.fase_lunar,
            })

        return {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "dias": dias,
        }
