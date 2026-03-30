"""Servicio Pronóstico Cósmico — genera forecasts diarios y semanales."""

import json
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

import anthropic
import pytz
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuracion import obtener_configuracion
from app.datos.repositorio_calculo import RepositorioCalculo
from app.datos.repositorio_perfil import RepositorioPerfil
from app.esquemas.pronostico import PronosticoDiarioSchema, PronosticoSemanalSchema
from app.registro import logger
from app.servicios.servicio_numerologia import ServicioNumerologia
from app.servicios.servicio_oraculo import ServicioOraculo
from app.servicios.servicio_transitos import ServicioTransitos

_RUTA_PROMPT = Path(__file__).parent.parent / "oraculo" / "prompt_pronostico.md"

_TZ_AR = pytz.timezone("America/Argentina/Buenos_Aires")


class ServicioPronostico:
    """Orquesta la generación de pronósticos cósmicos diarios y semanales."""

    # ------------------------------------------------------------------
    # Helpers internos
    # ------------------------------------------------------------------

    @classmethod
    def _cargar_prompt(cls) -> str:
        try:
            return _RUTA_PROMPT.read_text(encoding="utf-8")
        except FileNotFoundError:
            logger.warning("prompt_pronostico.md no encontrado")
            return "Generá un pronóstico cósmico diario en formato JSON."

    @classmethod
    async def _obtener_contexto_cosmico(
        cls, sesion: AsyncSession, usuario_id: uuid.UUID
    ) -> dict | None:
        """Obtiene perfil cósmico completo del usuario (reutiliza patrón de podcast)."""
        repo_perfil = RepositorioPerfil(sesion)
        perfil = await repo_perfil.obtener_por_usuario(usuario_id)
        if not perfil:
            return None

        repo_calculo = RepositorioCalculo(sesion)
        calculos = await repo_calculo.obtener_todos_por_perfil(perfil.id)

        calculos["datos_personales"] = {
            "nombre": perfil.nombre,
            "fecha_nacimiento": perfil.fecha_nacimiento.isoformat(),
            "hora_nacimiento": perfil.hora_nacimiento.isoformat(),
            "ciudad_nacimiento": perfil.ciudad_nacimiento,
            "pais_nacimiento": perfil.pais_nacimiento,
        }

        return calculos

    @classmethod
    def _calcular_ttl_hasta_medianoche(cls) -> int:
        """Calcula segundos hasta medianoche ARG + 1h de gracia."""
        ahora = datetime.now(_TZ_AR)
        medianoche = ahora.replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)
        # 1h de gracia para que no expire justo en el cambio
        return int((medianoche - ahora).total_seconds()) + 3600

    @classmethod
    def _calcular_ttl_hasta_lunes(cls) -> int:
        """Calcula segundos hasta el próximo lunes 00:00 ARG."""
        ahora = datetime.now(_TZ_AR)
        dias_hasta_lunes = (7 - ahora.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = ahora.replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=dias_hasta_lunes)
        return int((proximo_lunes - ahora).total_seconds()) + 3600

    @classmethod
    def _generar_fallback_diario(
        cls, numero_personal: dict, luna_info: dict
    ) -> dict:
        """Genera pronóstico genérico sin AI cuando Claude falla."""
        num = numero_personal["numero"]
        desc = numero_personal["descripcion"]

        # Energía base según número personal
        energia_base = {1: 8, 2: 5, 3: 7, 4: 4, 5: 7, 6: 6, 7: 3, 8: 8, 9: 6, 11: 9, 22: 7, 33: 8}

        return {
            "clima": {
                "estado": "nublado",
                "titulo": "Pronóstico Parcial",
                "frase_sintesis": f"Tu número personal hoy es {num} — {desc}. "
                                  f"La Luna transita por {luna_info.get('signo', '?')}.",
                "energia": energia_base.get(num, 5),
                "claridad": 5,
                "conexion": 5,
            },
            "areas": [
                {"id": "trabajo", "nombre": "Trabajo", "nivel": "neutro", "icono": "briefcase",
                 "frase": "Día para mantener el ritmo", "detalle": "Pronóstico detallado no disponible."},
                {"id": "amor", "nombre": "Amor", "nivel": "neutro", "icono": "heart",
                 "frase": "Escuchá tu intuición", "detalle": "Pronóstico detallado no disponible."},
                {"id": "salud", "nombre": "Salud", "nivel": "neutro", "icono": "activity",
                 "frase": "Cuidá tu energía", "detalle": "Pronóstico detallado no disponible."},
                {"id": "finanzas", "nombre": "Finanzas", "nivel": "neutro", "icono": "wallet",
                 "frase": "Prudencia financiera", "detalle": "Pronóstico detallado no disponible."},
                {"id": "creatividad", "nombre": "Creatividad", "nivel": "neutro", "icono": "palette",
                 "frase": "Dejá fluir las ideas", "detalle": "Pronóstico detallado no disponible."},
                {"id": "crecimiento", "nombre": "Crecimiento", "nivel": "neutro", "icono": "trending-up",
                 "frase": "Momento de reflexión", "detalle": "Pronóstico detallado no disponible."},
            ],
            "momentos": [
                {"bloque": "manana", "titulo": "Mañana", "icono": "sunrise",
                 "frase": "Empezá el día con calma", "nivel": "neutro"},
                {"bloque": "tarde", "titulo": "Tarde", "icono": "sun",
                 "frase": "Buen momento para avanzar tareas", "nivel": "neutro"},
                {"bloque": "noche", "titulo": "Noche", "icono": "moon",
                 "frase": "Descansá y recargá", "nivel": "neutro"},
            ],
            "alertas": [],
            "consejo_hd": {
                "titulo": "Tu Estrategia Hoy",
                "mensaje": "Seguí tu estrategia natural y confiá en tu autoridad interna.",
                "centro_destacado": "g",
            },
            "luna": luna_info,
            "numero_personal": numero_personal,
            "_fallback": True,
        }

    @classmethod
    def _extraer_info_luna(cls, transitos: dict) -> dict:
        """Extrae signo, fase y significado de la Luna desde tránsitos."""
        planetas = transitos.get("planetas", [])
        sol = next((p for p in planetas if p.get("nombre") == "Sol"), None)
        luna = next((p for p in planetas if p.get("nombre") == "Luna"), None)

        signo_luna = luna.get("signo", "?") if luna else "?"
        fase = "Desconocida"

        if sol and luna:
            diff = (luna.get("longitud", 0) - sol.get("longitud", 0)) % 360
            if diff < 15:
                fase = "Luna Nueva"
            elif diff < 85:
                fase = "Creciente"
            elif diff < 95:
                fase = "Cuarto Creciente"
            elif diff < 175:
                fase = "Gibosa Creciente"
            elif diff < 185:
                fase = "Luna Llena"
            elif diff < 265:
                fase = "Gibosa Menguante"
            elif diff < 275:
                fase = "Cuarto Menguante"
            else:
                fase = "Menguante"

        significados = {
            "Luna Nueva": "Momento de intención y nuevos comienzos",
            "Creciente": "Crecimiento y acción gradual",
            "Cuarto Creciente": "Toma de decisiones y ajustes",
            "Gibosa Creciente": "Refinamiento y preparación",
            "Luna Llena": "Culminación y revelaciones",
            "Gibosa Menguante": "Gratitud y distribución",
            "Cuarto Menguante": "Soltar lo que no sirve",
            "Menguante": "Descanso y preparación interior",
        }

        return {
            "signo": signo_luna,
            "fase": fase,
            "significado": significados.get(fase, "Energía lunar presente"),
        }

    # ------------------------------------------------------------------
    # Métodos principales
    # ------------------------------------------------------------------

    @classmethod
    async def generar_pronostico_diario(
        cls,
        sesion: AsyncSession,
        redis: Redis,
        usuario_id: uuid.UUID,
        fecha: date | None = None,
    ) -> dict:
        """Genera o recupera el pronóstico cósmico del día."""
        fecha_obj = fecha or date.today()
        fecha_str = fecha_obj.isoformat()
        clave_cache = f"pronostico:diario:{usuario_id}:{fecha_str}"

        # 1. Check cache Redis
        try:
            datos_cache = await redis.get(f"cosmic:{clave_cache}")
            if datos_cache:
                logger.debug("Pronóstico diario cache HIT: %s", clave_cache)
                return json.loads(datos_cache)
        except Exception as e:
            logger.warning("Error leyendo cache pronóstico: %s", e)

        # 2. Cargar contexto cósmico del usuario
        perfil_cosmico = await cls._obtener_contexto_cosmico(sesion, usuario_id)
        if not perfil_cosmico:
            raise ValueError("El usuario no tiene un perfil cósmico configurado.")

        # 3. Obtener tránsitos del día
        transitos = ServicioTransitos.obtener_transitos_actuales()

        # 4. Calcular número personal del día
        fecha_nac_str = perfil_cosmico.get("datos_personales", {}).get("fecha_nacimiento")
        if fecha_nac_str:
            fecha_nac = date.fromisoformat(fecha_nac_str)
            numero_personal = ServicioNumerologia.calcular_dia_personal(fecha_nac, fecha_obj)
        else:
            numero_personal = {"numero": 5, "descripcion": "Libertad, aventura, cambio"}

        # 5. Extraer info lunar
        luna_info = cls._extraer_info_luna(transitos)

        # 6. Construir prompt con contexto
        config = obtener_configuracion()
        if not config.anthropic_api_key:
            logger.warning("Sin API key de Anthropic — retornando fallback")
            return cls._generar_fallback_diario(numero_personal, luna_info)

        system_prompt = cls._cargar_prompt()

        resumen_perfil = ServicioOraculo._resumir_perfil(perfil_cosmico)
        resumen_transitos = ServicioOraculo._resumir_transitos(transitos)

        mensaje_usuario = (
            f"## Fecha del Pronóstico\n{fecha_str}\n\n"
            f"## Perfil Cósmico del Usuario\n{resumen_perfil}\n\n"
            f"## Tránsitos del Día\n{resumen_transitos}\n\n"
            f"## Número Personal del Día\n"
            f"Número: {numero_personal['numero']} — {numero_personal['descripcion']}\n\n"
            f"Generá el pronóstico cósmico completo en JSON."
        )

        # 7. Llamar Claude API
        try:
            cliente = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
            respuesta = await cliente.messages.create(
                model=config.pronostico_modelo,
                max_tokens=2048,
                temperature=0.7,
                system=system_prompt,
                messages=[{"role": "user", "content": mensaje_usuario}],
            )

            texto = respuesta.content[0].text if respuesta.content else ""
            tokens = (respuesta.usage.input_tokens or 0) + (respuesta.usage.output_tokens or 0)
            logger.info("Pronóstico diario generado — %d tokens", tokens)

            # 8. Parsear JSON
            # Limpiar posibles backticks de markdown
            texto_limpio = texto.strip()
            if texto_limpio.startswith("```"):
                lineas = texto_limpio.split("\n")
                # Remover primera y última línea de backticks
                lineas = [l for l in lineas if not l.strip().startswith("```")]
                texto_limpio = "\n".join(lineas)

            pronostico = json.loads(texto_limpio)

            # Validar con Pydantic
            pronostico["numero_personal"] = numero_personal
            validado = PronosticoDiarioSchema(**pronostico)
            resultado = validado.model_dump()

        except (json.JSONDecodeError, Exception) as e:
            logger.error("Error generando pronóstico con Claude: %s", e)
            resultado = cls._generar_fallback_diario(numero_personal, luna_info)

        # 9. Guardar en Redis
        try:
            ttl = cls._calcular_ttl_hasta_medianoche()
            await redis.setex(
                f"cosmic:{clave_cache}",
                ttl,
                json.dumps(resultado, default=str, ensure_ascii=False),
            )
        except Exception as e:
            logger.warning("Error guardando pronóstico en cache: %s", e)

        return resultado

    @classmethod
    async def generar_pronostico_semanal(
        cls,
        sesion: AsyncSession,
        redis: Redis,
        usuario_id: uuid.UUID,
        fecha_inicio: date | None = None,
    ) -> dict:
        """Genera pronóstico resumido de 7 días."""
        hoy = date.today()
        # Calcular lunes de la semana solicitada (o la actual)
        if fecha_inicio:
            lunes = fecha_inicio - timedelta(days=fecha_inicio.weekday())
        else:
            lunes = hoy - timedelta(days=hoy.weekday())
        clave_cache = f"pronostico:semanal:{usuario_id}:{lunes.isoformat()}"

        # 1. Check cache
        try:
            datos_cache = await redis.get(f"cosmic:{clave_cache}")
            if datos_cache:
                logger.debug("Pronóstico semanal cache HIT")
                return json.loads(datos_cache)
        except Exception as e:
            logger.warning("Error leyendo cache semanal: %s", e)

        # 2. Cargar contexto
        perfil_cosmico = await cls._obtener_contexto_cosmico(sesion, usuario_id)
        if not perfil_cosmico:
            raise ValueError("El usuario no tiene un perfil cósmico configurado.")

        fecha_nac_str = perfil_cosmico.get("datos_personales", {}).get("fecha_nacimiento")
        fecha_nac = date.fromisoformat(fecha_nac_str) if fecha_nac_str else None

        # 3. Para cada día de la semana, obtener tránsitos y número personal
        dias_info = []
        for i in range(7):
            dia = lunes + timedelta(days=i)
            try:
                transitos_dia = ServicioTransitos.obtener_transitos_fecha(dia)
            except Exception:
                transitos_dia = ServicioTransitos.obtener_transitos_actuales()

            if fecha_nac:
                num_personal = ServicioNumerologia.calcular_dia_personal(fecha_nac, dia)
            else:
                num_personal = {"numero": 5, "descripcion": "Libertad, aventura, cambio"}

            luna_info = cls._extraer_info_luna(transitos_dia)
            resumen_transitos = ServicioOraculo._resumir_transitos(transitos_dia)

            dias_info.append({
                "fecha": dia.isoformat(),
                "numero_personal": num_personal["numero"],
                "desc_numero": num_personal["descripcion"],
                "luna_signo": luna_info["signo"],
                "luna_fase": luna_info["fase"],
                "resumen_transitos": resumen_transitos,
            })

        # 4. Llamar Claude con todo el contexto semanal
        config = obtener_configuracion()
        if not config.anthropic_api_key:
            # Fallback sin AI
            return {
                "semana": [
                    {
                        "fecha": d["fecha"],
                        "clima_estado": "nublado",
                        "energia": 5,
                        "frase_corta": f"Número personal {d['numero_personal']} — {d['desc_numero']}",
                        "numero_personal": d["numero_personal"],
                    }
                    for d in dias_info
                ]
            }

        resumen_perfil = ServicioOraculo._resumir_perfil(perfil_cosmico)

        contexto_dias = "\n\n".join([
            f"### {d['fecha']}\n"
            f"- Número personal: {d['numero_personal']} ({d['desc_numero']})\n"
            f"- Luna en {d['luna_signo']} ({d['luna_fase']})\n"
            f"- Tránsitos:\n{d['resumen_transitos']}"
            for d in dias_info
        ])

        mensaje = (
            f"## Perfil Cósmico del Usuario\n{resumen_perfil}\n\n"
            f"## Semana: {lunes.isoformat()} a {(lunes + timedelta(days=6)).isoformat()}\n\n"
            f"{contexto_dias}\n\n"
            f"Generá un resumen semanal. Respondé SOLO con JSON válido:\n"
            f'{{"semana": [{{"fecha": "YYYY-MM-DD", "clima_estado": "despejado|soleado|nublado|tormenta|arcoiris", '
            f'"energia": 1-10, "frase_corta": "frase de máx 60 chars", "numero_personal": N}}, ...]}}'
        )

        try:
            cliente = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
            respuesta = await cliente.messages.create(
                model=config.pronostico_modelo,
                max_tokens=1024,
                temperature=0.7,
                system=cls._cargar_prompt(),
                messages=[{"role": "user", "content": mensaje}],
            )

            texto = respuesta.content[0].text.strip() if respuesta.content else ""
            if texto.startswith("```"):
                lineas = texto.split("\n")
                lineas = [l for l in lineas if not l.strip().startswith("```")]
                texto = "\n".join(lineas)

            resultado = json.loads(texto)
            validado = PronosticoSemanalSchema(**resultado)
            resultado = validado.model_dump()

        except Exception as e:
            logger.error("Error generando pronóstico semanal: %s", e)
            resultado = {
                "semana": [
                    {
                        "fecha": d["fecha"],
                        "clima_estado": "nublado",
                        "energia": 5,
                        "frase_corta": f"Número personal {d['numero_personal']} — {d['desc_numero']}",
                        "numero_personal": d["numero_personal"],
                    }
                    for d in dias_info
                ]
            }

        # 5. Guardar en cache
        try:
            ttl = cls._calcular_ttl_hasta_lunes()
            await redis.setex(
                f"cosmic:{clave_cache}",
                ttl,
                json.dumps(resultado, default=str, ensure_ascii=False),
            )
        except Exception as e:
            logger.warning("Error guardando cache semanal: %s", e)

        return resultado
