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

    # Interpretaciones deterministas por signo lunar
    _LUNA_EN_SIGNO = {
        "Aries": {
            "clima": "soleado",
            "amor": ("Día de pasión directa", "La Luna en Aries enciende el deseo y la iniciativa. Es un buen momento para dar el primer paso en lo romántico, expresar lo que sentís sin filtros y conectar desde la autenticidad. Evitá discusiones impulsivas — canalizá esa energía en gestos espontáneos."),
            "salud": ("Movete con intensidad", "Tu cuerpo pide acción. Aprovechá para entrenamientos de alta intensidad, caminatas enérgicas o cualquier actividad que descargue adrenalina. Cuidado con la cabeza y las tensiones cervicales — Aries gobierna esa zona."),
            "trabajo": ("Liderá sin atropellar", "Tenés energía de sobra para arrancar proyectos nuevos o tomar decisiones rápidas. Es un día para actuar, no para planificar. Ojo con imponer tu ritmo a los demás — la iniciativa funciona mejor cuando inspirás que cuando empujás."),
            "finanzas": ("Impulso para invertir", "La energía ariana te empuja a tomar decisiones financieras rápidas. Puede ser un buen día para iniciativas audaces, pero evitá compras compulsivas. Si algo te tienta, esperá 24 horas antes de decidir."),
            "creatividad": ("Inspiración explosiva", "Las ideas llegan rápido y con fuerza. Es un día para empezar cosas nuevas, bocetar, improvisar. No busques perfección — buscá arranque. Lo que empieces hoy con pasión puede convertirse en algo grande."),
            "crecimiento": ("Salí de la zona cómoda", "Aries te invita a enfrentar algo que venías postergando. El crecimiento hoy viene de la acción, no de la reflexión. Hacé algo que te dé un poco de miedo — ahí está la expansión."),
        },
        "Tauro": {
            "clima": "despejado",
            "amor": ("Conexión sensorial", "La Luna en Tauro favorece los encuentros tranquilos y sensoriales: una cena casera, un abrazo largo, estar en silencio cómodo con alguien. Hoy el amor se muestra en lo tangible — preparar algo rico, regalar algo con significado."),
            "salud": ("Nutrite con calma", "Tu cuerpo pide placer y descanso. Priorizá comidas nutritivas, caminatas en la naturaleza y contacto con lo físico. Evitá excesos alimentarios — Tauro tiende a buscar confort en la comida cuando hay estrés."),
            "trabajo": ("Avanzá con constancia", "No es día de grandes innovaciones sino de trabajo sólido y metódico. Terminá lo que empezaste, organizá tu espacio, cerrá temas pendientes. La productividad hoy está en la persistencia, no en la velocidad."),
            "finanzas": ("Consolidá lo que tenés", "Excelente día para revisar tus finanzas, armar presupuestos o buscar formas de generar ingresos estables. Tauro favorece las inversiones seguras y a largo plazo. Evitá riesgos innecesarios."),
            "creatividad": ("Creá con las manos", "La inspiración viene del mundo material: cocinar, dibujar, jardinear, construir algo tangible. Tauro conecta la creatividad con lo sensorial. Dejate llevar por lo que te da placer hacer."),
            "crecimiento": ("Enraizá tus valores", "El crecimiento hoy pasa por preguntarte qué es realmente valioso para vos. No lo que el mundo dice que deberías querer, sino lo que genuinamente te da seguridad y satisfacción."),
        },
        "Géminis": {
            "clima": "soleado",
            "amor": ("Hablá y conectá", "La Luna en Géminis activa las conversaciones profundas y juguetonas. Es un gran día para conocer gente nueva, flirtear con ingenio o tener esa charla pendiente con tu pareja. El amor hoy entra por las palabras."),
            "salud": ("Estimulá tu mente", "Tu sistema nervioso está más activo. Hacé pausas conscientes, meditaciones cortas o ejercicios de respiración entre actividades. Evitá el exceso de pantallas y la sobreestimulación. Una caminata charlando con alguien es ideal."),
            "trabajo": ("Comunicá y conectá", "Día ideal para reuniones, presentaciones, emails importantes y networking. Tu capacidad verbal está al máximo. Aprovechá para negociar, proponer ideas y establecer contactos. Evitá dispersarte en demasiados frentes."),
            "finanzas": ("Investigá opciones", "Buen momento para comparar precios, buscar información sobre inversiones o renegociar condiciones. Géminis favorece la investigación y las comparaciones. No cierres nada definitivo — hoy es para explorar."),
            "creatividad": ("Escribí y expresate", "Las ideas fluyen rápido. Es un día perfecto para escribir, hacer brainstorming, combinar conceptos o aprender algo nuevo. La curiosidad es tu mejor aliada creativa hoy."),
            "crecimiento": ("Aprendé algo nuevo", "El crecimiento viene de exponerte a perspectivas diferentes. Leé algo que no leerías normalmente, hablá con alguien de otro ámbito, escuchá un podcast que te desafíe. La versatilidad es expansión."),
        },
        "Cáncer": {
            "clima": "nublado",
            "amor": ("Cuidá y dejate cuidar", "La Luna en su domicilio intensifica las emociones. Es un día para la intimidad genuina, las demostraciones de afecto y la vulnerabilidad. Si estás en pareja, cocinale algo. Si estás solo/a, llamá a alguien que te haga sentir en casa."),
            "salud": ("Escuchá tus emociones", "Tu cuerpo refleja tu estado emocional más que nunca. Si sentís malestar estomacal o retención, revisá qué emoción estás guardando. Hidratate bien, comé alimentos reconfortantes y date permiso para sentir."),
            "trabajo": ("Intuición laboral activa", "Hoy captás el clima emocional de tu entorno laboral mejor que nadie. Usá esa sensibilidad para anticipar necesidades, mediar en conflictos o conectar con colegas. Evitá tomarte las cosas personalmente."),
            "finanzas": ("Protegé tu nido", "Cáncer activa el instinto de seguridad. Es un buen día para ahorrar, revisar seguros o pensar en inversiones que protejan a tu familia. Evitá gastar por impulso emocional — comprá solo lo necesario."),
            "creatividad": ("Creá desde la emoción", "La inspiración viene de los recuerdos, la nostalgia y lo que te conmueve. Escribí una carta, cociná una receta familiar, mirá fotos viejas. La creatividad canceriana nace de lo que te importa."),
            "crecimiento": ("Saná lo familiar", "El crecimiento hoy pasa por tu relación con tus raíces: familia, hogar, pertenencia. ¿Hay algo pendiente con alguien cercano? ¿Necesitás reconfigurar tu espacio? Atender lo emocional es avanzar."),
        },
        "Leo": {
            "clima": "soleado",
            "amor": ("Brillá y enamorá", "La Luna en Leo activa el magnetismo personal. Es un día para citas especiales, gestos románticos grandiosos y dejarte ver. Si estás en pareja, hacé algo fuera de la rutina. Si estás buscando, mostrá tu mejor versión sin miedo."),
            "salud": ("Recargá tu vitalidad", "Leo gobierna el corazón y la espalda. Hacé ejercicio que te haga sentir fuerte y radiante — no por obligación, sino por placer. Tomá sol si podés, bailá, movete con alegría. Tu cuerpo necesita expresión."),
            "trabajo": ("Destacate con confianza", "Día excelente para presentaciones, liderazgo y visibilidad. Tu carisma está al máximo — usalo para inspirar a tu equipo o impresionar en una reunión. Ojo con el ego: brillar no es opacar a otros."),
            "finanzas": ("Invertí en vos", "Leo favorece los gastos en imagen personal, formación o experiencias que te hagan sentir bien. No es tacañería — es inversión en tu marca personal. Eso sí, no exageres: el lujo tiene límites."),
            "creatividad": ("Expresión máxima", "Tu creatividad está en su punto más alto. Es un día para crear algo que muestre quién sos: arte, contenido, un proyecto personal. No te autocensures — Leo pide autenticidad y drama."),
            "crecimiento": ("Liderá tu vida", "El crecimiento viene de asumir protagonismo en tu propia historia. ¿En qué área te estás escondiendo? Leo te invita a ocupar ese espacio con orgullo y generosidad."),
        },
        "Virgo": {
            "clima": "despejado",
            "amor": ("Amá en los detalles", "La Luna en Virgo expresa amor a través del servicio: ordenar algo para el otro, resolver un problema práctico, estar presente en lo cotidiano. Hoy el romance no es un gran gesto — es atención genuina a los detalles."),
            "salud": ("Optimizá tu rutina", "Día ideal para ajustar tu alimentación, empezar una rutina de ejercicio o hacerte ese chequeo pendiente. Virgo favorece la salud preventiva y los hábitos saludables. Tu cuerpo agradece la disciplina amorosa."),
            "trabajo": ("Organizá y ejecutá", "Tu capacidad analítica está al máximo. Aprovechá para ordenar archivos, optimizar procesos, revisar detalles y corregir errores. No es día de grandes visiones sino de ejecución impecable."),
            "finanzas": ("Revisá los números", "Excelente momento para hacer cuentas, encontrar gastos innecesarios, comparar proveedores u optimizar tu presupuesto. Virgo ve lo que otros pasan por alto — usá esa precisión a tu favor."),
            "creatividad": ("Perfeccioná tu arte", "No es día de empezar sino de pulir. Revisá ese proyecto, editá ese texto, ajustá esos detalles. La creatividad virguiana está en la artesanía — el cuidado milimétrico que transforma algo bueno en algo excelente."),
            "crecimiento": ("Mejorá un hábito", "El crecimiento hoy es práctico y concreto. Elegí UN hábito que quieras mejorar y empezá hoy. No hace falta una revolución — Virgo entiende que los cambios pequeños y constantes son los que transforman."),
        },
        "Libra": {
            "clima": "despejado",
            "amor": ("Armonía y conexión", "La Luna en Libra favorece el equilibrio en las relaciones. Es un gran día para resolver diferencias con elegancia, tener citas armoniosas o fortalecer vínculos. Buscá el punto medio — hoy el amor florece en la diplomacia."),
            "salud": ("Buscá el equilibrio", "Libra gobierna los riñones y el equilibrio interno. Hidratate bien, evitá excesos y buscá actividades que armonicen cuerpo y mente: yoga, stretching, una caminata tranquila. Tu cuerpo pide simetría."),
            "trabajo": ("Negociá y colaborá", "Día ideal para acuerdos, alianzas, trabajo en equipo y mediación. Tu diplomacia natural está potenciada. Si tenés que cerrar un trato o resolver un conflicto laboral, hoy es el momento."),
            "finanzas": ("Asociate y compartí", "Libra favorece las sociedades y los acuerdos financieros equilibrados. Buen día para negociar, buscar socios o repartir responsabilidades económicas. Buscá el win-win — los tratos justos perduran."),
            "creatividad": ("Estética y belleza", "Tu sentido estético está agudizado. Es un día para diseñar, decorar, armonizar espacios o crear algo visualmente bello. Libra conecta la creatividad con la proporción y la elegancia."),
            "crecimiento": ("Equilibrá dar y recibir", "El crecimiento viene de revisar tus relaciones: ¿estás dando demasiado o recibiendo sin reciprocar? Libra te invita a encontrar el balance que te permita crecer sin desgastarte."),
        },
        "Escorpio": {
            "clima": "tormenta",
            "amor": ("Profundizá o soltá", "La Luna en Escorpio intensifica todo. Es un día para conversaciones profundas, intimidad genuina o para soltar relaciones que ya no te nutren. No hay grises hoy — el amor pide verdad absoluta."),
            "salud": ("Limpiá y regenerá", "Tu cuerpo pide depuración: hidratación profunda, ayuno intermitente si te sienta bien, o simplemente soltar tensiones acumuladas. Escorpio gobierna la eliminación — dejá ir lo que tu cuerpo ya procesó."),
            "trabajo": ("Investigá y transformá", "Día para ir al fondo de los temas: descubrir lo que otros no ven, resolver problemas complejos, transformar procesos. Tu capacidad de análisis profundo está al máximo. Usala estratégicamente."),
            "finanzas": ("Revisá lo oculto", "Buen día para revisar deudas, seguros, impuestos o inversiones compartidas. Escorpio destapa lo que estaba escondido — puede aparecer un gasto olvidado o una oportunidad que no veías."),
            "creatividad": ("Creá desde lo profundo", "La inspiración viene de las sombras, lo tabú, lo que otros no se animan a tocar. Si hacés arte, explorá temas intensos. Si escribís, andá donde duele. La creatividad escorpiana transforma dolor en poder."),
            "crecimiento": ("Enfrentá tu sombra", "El crecimiento más potente hoy viene de mirar lo que preferirías evitar. ¿Qué patrón se repite? ¿Qué miedo te limita? Escorpio no acepta superficialidad — crecés cuando te animás a ver todo."),
        },
        "Sagitario": {
            "clima": "soleado",
            "amor": ("Aventura compartida", "La Luna en Sagitario pide libertad y exploración. Es un día para planes espontáneos, viajes cortos o conversaciones sobre el futuro. El amor hoy se alimenta de visiones compartidas y risas, no de rutina."),
            "salud": ("Expandí tu cuerpo", "Tu cuerpo pide movimiento amplio: correr, andar en bici, hacer deporte al aire libre. Sagitario gobierna las caderas y los muslos — estirá bien esas zonas. La salud hoy mejora con naturaleza y libertad."),
            "trabajo": ("Pensá en grande", "Día para planificación estratégica, expansión y visión a largo plazo. No te enredes en detalles — mirá el panorama completo. Si tenés que presentar un proyecto ambicioso o buscar oportunidades internacionales, es hoy."),
            "finanzas": ("Expandí tus horizontes", "Sagitario favorece inversiones en educación, viajes o mercados internacionales. Es un buen día para pensar en grande financieramente, pero con pies en la tierra — el optimismo excesivo puede costarte."),
            "creatividad": ("Inspirate viajando", "La creatividad viene de lo diferente: una cultura nueva, un libro de filosofía, una conversación con alguien de otro mundo. Sagitario expande la mente — dejá que la curiosidad te lleve lejos."),
            "crecimiento": ("Buscá tu verdad", "El crecimiento hoy es filosófico y espiritual. ¿En qué creés realmente? ¿Hacia dónde apunta tu brújula interna? Sagitario te invita a alinear tu vida con tu sentido más profundo de dirección."),
        },
        "Capricornio": {
            "clima": "nublado",
            "amor": ("Compromiso real", "La Luna en Capricornio valora la estabilidad y el esfuerzo sostenido. No es día de fuegos artificiales sino de construir cimientos sólidos. Si estás en pareja, planifiquen algo juntos. Si buscás, priorizá personas serias y confiables."),
            "salud": ("Disciplina saludable", "Tu cuerpo responde bien a la estructura hoy: rutinas de ejercicio fijas, horarios de comida regulares, descanso suficiente. Capricornio gobierna los huesos y las articulaciones — cuidá tu postura y tus rodillas."),
            "trabajo": ("Construí con paciencia", "Excelente día para trabajo duro, planificación a largo plazo y asumir responsabilidades. Tu disciplina y resistencia están al máximo. Es momento de sentar bases, no de buscar atajos."),
            "finanzas": ("Planificá a largo plazo", "Capricornio favorece el ahorro, las inversiones conservadoras y la planificación financiera. Es un día para pensar en tu retiro, revisar metas económicas a 5 años o reducir gastos innecesarios."),
            "creatividad": ("Creá con estructura", "La inspiración viene de la disciplina: seguir un método, completar una técnica, dominar una herramienta. La creatividad capricorniana es artesanal — el resultado de horas de práctica deliberada."),
            "crecimiento": ("Aceptá la responsabilidad", "El crecimiento viene de asumir lo que te toca sin quejas. ¿Qué área de tu vida necesita más madurez? Capricornio te enseña que la libertad real viene después de cumplir con tus compromisos."),
        },
        "Acuario": {
            "clima": "arcoiris",
            "amor": ("Libertad y originalidad", "La Luna en Acuario valora la independencia dentro del vínculo. Hoy el amor se expresa siendo auténtico, respetando el espacio del otro y conectando desde lo mental. Sorprendé con algo inesperado y poco convencional."),
            "salud": ("Innová tu rutina", "Tu sistema nervioso está más activo. Probá algo diferente: un deporte nuevo, una app de meditación, técnicas de respiración que no conozcas. Acuario gobierna la circulación — mové las piernas y evitá estar mucho rato sentado/a."),
            "trabajo": ("Innová sin miedo", "Día para proponer ideas disruptivas, cuestionar procesos establecidos y pensar fuera de la caja. Tu mente está conectada con el futuro. Si algo te parece demasiado loco, probablemente sea exactamente lo que hace falta."),
            "finanzas": ("Explorá lo nuevo", "Acuario favorece las inversiones en tecnología, innovación y proyectos de impacto social. Es un buen día para explorar criptomonedas, fintech o economías alternativas — siempre con investigación previa."),
            "creatividad": ("Rompé las reglas", "La creatividad acuariana es rebelde y visionaria. Mezclá géneros, desafiá convenciones, creá algo que no existía. Hoy no buscas gustar — buscas ser fiel a tu visión aunque sea rara."),
            "crecimiento": ("Conectá con tu tribu", "El crecimiento viene de encontrar personas que piensen diferente y resonen con tu esencia. ¿Hay alguna comunidad, grupo o causa que te llame? Acuario crece en colectivo, no en soledad."),
        },
        "Piscis": {
            "clima": "nublado",
            "amor": ("Dejate sentir", "La Luna en Piscis disuelve las barreras emocionales. Es un día para la ternura, la compasión y la conexión espiritual con el otro. Si sentís ganas de llorar, llorá — Piscis sana a través de la entrega emocional."),
            "salud": ("Descansá profundo", "Tu sensibilidad está al máximo y tu cuerpo absorbe las energías del entorno. Priorizá el descanso, evitá multitudes ruidosas y conectá con el agua: un baño largo, nadar, caminar junto al mar o un río."),
            "trabajo": ("Fluí con la intuición", "No es día para lógica pura — dejá que tu intuición guíe tus decisiones laborales. Si algo no te cierra aunque los números digan que sí, hacele caso a esa corazonada. Piscis ve lo que la mente no alcanza."),
            "finanzas": ("Intuición financiera", "Piscis puede captar oportunidades que otros no ven, pero también caer en engaños. Hoy confiá en tu instinto pero verificá los datos. Si algo parece demasiado bueno para ser verdad, probablemente lo sea."),
            "creatividad": ("Canal abierto", "La creatividad pisciana es mística y fluida. Pintá, componé música, escribí poesía, dejate llevar sin rumbo fijo. Hoy no necesitás un plan — necesitás entregarte al flujo. Lo que salga puede ser mágico."),
            "crecimiento": ("Conectá con lo sagrado", "El crecimiento hoy es espiritual. Meditá, rezá, caminá en silencio, contemplá algo bello. Piscis te recuerda que no todo se entiende con la mente — a veces crecer es simplemente confiar."),
        },
    }

    # Tabla de claridad mental por número personal
    # Números analíticos/mentales (1,7,11) → alta claridad
    # Números emocionales/receptivos (2,6,9) → claridad moderada
    # Números de acción/impulso (3,5,8) → claridad media
    _CLARIDAD_POR_NUMERO = {
        1: 8, 2: 5, 3: 6, 4: 7, 5: 5, 6: 6, 7: 9, 8: 6, 9: 5, 11: 9, 22: 8, 33: 7,
    }

    # Tabla de intuición por número personal
    # Números receptivos/espirituales (2,7,9,11,33) → alta intuición
    # Números de acción/estructura (1,4,8,22) → intuición moderada
    _INTUICION_POR_NUMERO = {
        1: 5, 2: 8, 3: 6, 4: 4, 5: 6, 6: 7, 7: 9, 8: 5, 9: 8, 11: 10, 22: 6, 33: 9,
    }

    # Modificador de intuición por signo lunar
    # Signos de agua (alta intuición), fuego (baja), tierra (media), aire (media-alta)
    _INTUICION_MOD_SIGNO = {
        "Aries": -1, "Tauro": 0, "Géminis": 0, "Cáncer": 2,
        "Leo": -1, "Virgo": 0, "Libra": 0, "Escorpio": 2,
        "Sagitario": 0, "Capricornio": -1, "Acuario": 1, "Piscis": 3,
    }

    # Modificador de claridad por signo lunar
    # Signos de aire/tierra (mental claro), agua (nublado), fuego (variable)
    _CLARIDAD_MOD_SIGNO = {
        "Aries": 0, "Tauro": 1, "Géminis": 2, "Cáncer": -1,
        "Leo": 1, "Virgo": 2, "Libra": 1, "Escorpio": -2,
        "Sagitario": 1, "Capricornio": 1, "Acuario": 1, "Piscis": -2,
    }

    # Modificador por fase lunar
    # Luna nueva: más intuición, menos claridad. Luna llena: más claridad, más intuición.
    _MOD_FASE = {
        "Luna Nueva": {"intuicion": 1, "claridad": -1},
        "Creciente": {"intuicion": 0, "claridad": 1},
        "Cuarto Creciente": {"intuicion": 0, "claridad": 1},
        "Gibosa Creciente": {"intuicion": 1, "claridad": 0},
        "Luna Llena": {"intuicion": 2, "claridad": 1},
        "Gibosa Menguante": {"intuicion": 1, "claridad": 0},
        "Cuarto Menguante": {"intuicion": 0, "claridad": -1},
        "Menguante": {"intuicion": 1, "claridad": -1},
    }

    @classmethod
    def _calcular_claridad_intuicion(cls, num: int, signo_luna: str, fase_luna: str) -> tuple[int, int]:
        """Calcula claridad e intuición combinando número personal, signo lunar y fase."""
        claridad = cls._CLARIDAD_POR_NUMERO.get(num, 5)
        intuicion = cls._INTUICION_POR_NUMERO.get(num, 5)

        claridad += cls._CLARIDAD_MOD_SIGNO.get(signo_luna, 0)
        intuicion += cls._INTUICION_MOD_SIGNO.get(signo_luna, 0)

        mod_fase = cls._MOD_FASE.get(fase_luna, {"intuicion": 0, "claridad": 0})
        claridad += mod_fase["claridad"]
        intuicion += mod_fase["intuicion"]

        return max(1, min(10, claridad)), max(1, min(10, intuicion))

    @classmethod
    def _generar_fallback_diario(
        cls, numero_personal: dict, luna_info: dict
    ) -> dict:
        """Genera pronóstico personalizado basado en datos deterministas (sin AI)."""
        num = numero_personal["numero"]
        desc = numero_personal["descripcion"]

        energia_base = {1: 8, 2: 5, 3: 7, 4: 4, 5: 7, 6: 6, 7: 3, 8: 8, 9: 6, 11: 9, 22: 7, 33: 8}

        signo_luna = luna_info.get("signo", "Aries")
        fase_luna = luna_info.get("fase", "")
        significado_luna = luna_info.get("significado", "")

        # Interpretación por signo lunar
        interp = cls._LUNA_EN_SIGNO.get(signo_luna, cls._LUNA_EN_SIGNO["Aries"])

        claridad, intuicion = cls._calcular_claridad_intuicion(num, signo_luna, fase_luna)

        return {
            "clima": {
                "estado": interp["clima"],
                "titulo": f"Día {num} · Luna en {signo_luna}",
                "frase_sintesis": (
                    f"Hoy vibrás en la energía del {num}: {desc.lower()}. "
                    f"La Luna en {signo_luna} "
                    + (f"en fase de {fase_luna.lower()} " if fase_luna else "")
                    + f"te invita a {significado_luna.lower() if significado_luna else 'sintonizar con tu intuición'}."
                ),
                "energia": energia_base.get(num, 5),
                "claridad": claridad,
                "intuicion": intuicion,
            },
            "areas": [
                {"id": "trabajo", "nombre": "Trabajo", "nivel": "neutro", "icono": "briefcase",
                 "frase": interp["trabajo"][0], "detalle": interp["trabajo"][1]},
                {"id": "amor", "nombre": "Amor", "nivel": "neutro", "icono": "heart",
                 "frase": interp["amor"][0], "detalle": interp["amor"][1]},
                {"id": "salud", "nombre": "Salud", "nivel": "neutro", "icono": "activity",
                 "frase": interp["salud"][0], "detalle": interp["salud"][1]},
                {"id": "finanzas", "nombre": "Finanzas", "nivel": "neutro", "icono": "wallet",
                 "frase": interp["finanzas"][0], "detalle": interp["finanzas"][1]},
                {"id": "creatividad", "nombre": "Creatividad", "nivel": "neutro", "icono": "palette",
                 "frase": interp["creatividad"][0], "detalle": interp["creatividad"][1]},
                {"id": "crecimiento", "nombre": "Crecimiento", "nivel": "neutro", "icono": "trending-up",
                 "frase": interp["crecimiento"][0], "detalle": interp["crecimiento"][1]},
            ],
            "momentos": [
                {"bloque": "manana", "titulo": "Mañana", "icono": "sunrise",
                 "frase": "Empezá el día con calma", "nivel": "neutro",
                 "accionables": ["Dedicá los primeros 30 min a planificar", "Evitá revisar redes antes de las 9"]},
                {"bloque": "tarde", "titulo": "Tarde", "icono": "sun",
                 "frase": "Buen momento para avanzar tareas", "nivel": "neutro",
                 "accionables": ["Enfocate en la tarea más importante entre 14 y 16h", "Salí a caminar 10 min si podés"]},
                {"bloque": "noche", "titulo": "Noche", "icono": "moon",
                 "frase": "Descansá y recargá", "nivel": "neutro",
                 "accionables": ["Cerrá pantallas 1h antes de dormir", "Escribí 3 cosas buenas del día"]},
            ],
            "alertas": [],
            "consejo_hd": {
                "titulo": "Tu Estrategia Hoy",
                "mensaje": "Seguí tu estrategia natural y confiá en tu autoridad interna.",
                "centro_destacado": "g",
            },
            "luna": luna_info,
            "numero_personal": numero_personal,
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

        # 6. Buscar si existe lectura diaria (podcast) para resumir accionables
        lectura_diaria = None
        try:
            from app.datos.repositorio_podcast import RepositorioPodcast
            repo_podcast = RepositorioPodcast(sesion)
            podcast = await repo_podcast.obtener_episodio(usuario_id, fecha_obj, "dia")
            if podcast and podcast.estado == "listo" and podcast.guion_md:
                lectura_diaria = podcast.guion_md
                logger.debug("Lectura diaria encontrada para el usuario %s", usuario_id)
        except Exception as e:
            logger.warning("No se pudo recuperar la lectura diaria para el pronóstico: %s", e)

        # 7. Construir prompt con contexto
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
        )

        if lectura_diaria:
            mensaje_usuario += (
                f"## Lectura Diaria (Podcast Transcript)\n"
                f"IMPORTANTE: Usá este texto como fuente principal para los 'momentos' y 'accionables'. "
                f"Resumí e identificá qué hacer y qué evitar basándote en esta lectura:\n\n"
                f"{lectura_diaria}\n\n"
            )

        mensaje_usuario += "Generá el pronóstico cósmico completo en JSON."

        # 8. Llamar Claude API
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
            tokens_in = respuesta.usage.input_tokens or 0
            tokens_out = respuesta.usage.output_tokens or 0
            tokens = tokens_in + tokens_out
            logger.info("Pronóstico diario generado — %d tokens", tokens)

            # Registrar consumo API
            from app.servicios.servicio_consumo_api import registrar_consumo
            await registrar_consumo(
                sesion,
                usuario_id=usuario_id,
                servicio="anthropic",
                operacion="pronostico_diario",
                tokens_entrada=tokens_in,
                tokens_salida=tokens_out,
                modelo=config.pronostico_modelo,
            )

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
            semana_fallback = []
            for d in dias_info:
                energia_base = {1: 8, 2: 5, 3: 7, 4: 4, 5: 7, 6: 6, 7: 3, 8: 8, 9: 6, 11: 9, 22: 7, 33: 8}
                claridad, intuicion = cls._calcular_claridad_intuicion(
                    d["numero_personal"], d["luna_signo"], d["luna_fase"],
                )
                semana_fallback.append({
                    "fecha": d["fecha"],
                    "clima_estado": "nublado",
                    "energia": energia_base.get(d["numero_personal"], 5),
                    "claridad": claridad,
                    "intuicion": intuicion,
                    "frase_corta": f"Número personal {d['numero_personal']} — {d['desc_numero']}",
                    "numero_personal": d["numero_personal"],
                })
            return {"semana": semana_fallback}

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

            # Registrar consumo API
            from app.servicios.servicio_consumo_api import registrar_consumo
            t_in = respuesta.usage.input_tokens or 0
            t_out = respuesta.usage.output_tokens or 0
            await registrar_consumo(
                sesion,
                usuario_id=usuario_id,
                servicio="anthropic",
                operacion="pronostico_semanal",
                tokens_entrada=t_in,
                tokens_salida=t_out,
                modelo=config.pronostico_modelo,
            )

            if texto.startswith("```"):
                lineas = texto.split("\n")
                lineas = [l for l in lineas if not l.strip().startswith("```")]
                texto = "\n".join(lineas)

            resultado = json.loads(texto)
            validado = PronosticoSemanalSchema(**resultado)
            resultado = validado.model_dump()

            # Inyectar claridad/intuición deterministas (no dependen de AI)
            for dia_resultado, dia_info in zip(resultado["semana"], dias_info):
                cl, it = cls._calcular_claridad_intuicion(
                    dia_info["numero_personal"],
                    dia_info["luna_signo"],
                    dia_info["luna_fase"],
                )
                dia_resultado["claridad"] = cl
                dia_resultado["intuicion"] = it

        except Exception as e:
            logger.error("Error generando pronóstico semanal: %s", e)
            energia_base = {1: 8, 2: 5, 3: 7, 4: 4, 5: 7, 6: 6, 7: 3, 8: 8, 9: 6, 11: 9, 22: 7, 33: 8}
            semana_error = []
            for d in dias_info:
                cl, it = cls._calcular_claridad_intuicion(
                    d["numero_personal"], d["luna_signo"], d["luna_fase"],
                )
                semana_error.append({
                    "fecha": d["fecha"],
                    "clima_estado": "nublado",
                    "energia": energia_base.get(d["numero_personal"], 5),
                    "claridad": cl,
                    "intuicion": it,
                    "frase_corta": f"Número personal {d['numero_personal']} — {d['desc_numero']}",
                    "numero_personal": d["numero_personal"],
                })
            resultado = {"semana": semana_error}

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
