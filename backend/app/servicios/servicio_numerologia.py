"""Servicio de numerología — sistemas Pitagórico y Caldeo."""

from datetime import date

from app.utilidades.constantes import (
    NUMEROS_MAESTROS,
    TABLA_CALDEA,
    TABLA_PITAGORICA,
    VOCALES,
)


class ServicioNumerologia:
    """Calcula carta numerológica completa."""

    @classmethod
    def calcular_carta_completa(
        cls,
        nombre: str,
        fecha_nacimiento: date,
        sistema: str = "pitagorico",
    ) -> dict:
        """Calcula todos los números de la carta numerológica.

        Args:
            nombre: Nombre completo
            fecha_nacimiento: Fecha de nacimiento
            sistema: "pitagorico" o "caldeo"

        Returns:
            Dict con todos los números calculados
        """
        tabla = TABLA_PITAGORICA if sistema == "pitagorico" else TABLA_CALDEA

        camino_vida = cls._camino_de_vida(fecha_nacimiento)
        expresion = cls._numero_expresion(nombre, tabla)
        impulso_alma = cls._impulso_del_alma(nombre, tabla)
        personalidad = cls._numero_personalidad(nombre, tabla)
        numero_nacimiento = cls._numero_nacimiento(fecha_nacimiento)
        anio_personal = cls._anio_personal(fecha_nacimiento)
        mes_personal = cls._mes_personal(fecha_nacimiento)
        dia_personal = cls._dia_personal(fecha_nacimiento)
        etapas = cls._etapas_de_la_vida(fecha_nacimiento)
        meses = cls._meses_personales_anio(fecha_nacimiento)

        def _num_resp(numero: int) -> dict:
            return {
                "numero": numero,
                "descripcion": cls._descripcion_numero(numero),
                "descripcion_larga": cls._descripcion_larga_numero(numero),
            }

        return {
            "nombre": nombre,
            "fecha_nacimiento": str(fecha_nacimiento),
            "sistema": sistema,
            "camino_de_vida": _num_resp(camino_vida),
            "expresion": _num_resp(expresion),
            "impulso_del_alma": _num_resp(impulso_alma),
            "personalidad": _num_resp(personalidad),
            "numero_nacimiento": _num_resp(numero_nacimiento),
            "anio_personal": _num_resp(anio_personal),
            "mes_personal": _num_resp(mes_personal),
            "dia_personal": _num_resp(dia_personal),
            "meses_personales": meses,
            "etapas_de_la_vida": etapas,
            "numeros_maestros_presentes": cls._detectar_maestros(
                [camino_vida, expresion, impulso_alma, personalidad]
            ),
        }

    @classmethod
    def _reducir_numero(cls, n: int) -> int:
        """Reduce un número a un solo dígito, PRESERVANDO maestros 11, 22, 33."""
        while n > 9 and n not in NUMEROS_MAESTROS:
            n = sum(int(d) for d in str(n))
        return n

    @classmethod
    def _camino_de_vida(cls, fecha: date) -> int:
        """Calcula el Camino de Vida desde la fecha completa.

        Se reduce cada componente (día, mes, año) por separado antes de sumar.
        """
        dia = cls._reducir_numero(fecha.day)
        mes = cls._reducir_numero(fecha.month)
        anio = cls._reducir_numero(sum(int(d) for d in str(fecha.year)))
        return cls._reducir_numero(dia + mes + anio)

    @classmethod
    def _numero_expresion(cls, nombre: str, tabla: dict) -> int:
        """Calcula el número de Expresión (nombre completo)."""
        total = sum(tabla.get(c, 0) for c in nombre.upper() if c.isalpha())
        return cls._reducir_numero(total)

    @classmethod
    def _impulso_del_alma(cls, nombre: str, tabla: dict) -> int:
        """Calcula el Impulso del Alma (solo vocales)."""
        total = sum(
            tabla.get(c, 0)
            for c in nombre.upper()
            if c.isalpha() and c in VOCALES
        )
        return cls._reducir_numero(total)

    @classmethod
    def _numero_personalidad(cls, nombre: str, tabla: dict) -> int:
        """Calcula el número de Personalidad (solo consonantes)."""
        total = sum(
            tabla.get(c, 0)
            for c in nombre.upper()
            if c.isalpha() and c not in VOCALES
        )
        return cls._reducir_numero(total)

    @classmethod
    def _numero_nacimiento(cls, fecha: date) -> int:
        """Calcula el Número de Nacimiento (solo el día)."""
        return cls._reducir_numero(fecha.day)

    @classmethod
    def _anio_personal(cls, fecha_nacimiento: date, fecha_objetivo: date | None = None) -> int:
        """Calcula el Año Personal basado en el año objetivo (o actual)."""
        anio_actual = (fecha_objetivo or date.today()).year
        dia = cls._reducir_numero(fecha_nacimiento.day)
        mes = cls._reducir_numero(fecha_nacimiento.month)
        anio = cls._reducir_numero(sum(int(d) for d in str(anio_actual)))
        return cls._reducir_numero(dia + mes + anio)

    @classmethod
    def _mes_personal(cls, fecha_nacimiento: date, fecha_objetivo: date | None = None) -> int:
        """Calcula el Mes Personal: año personal + mes objetivo, reducido."""
        ref = fecha_objetivo or date.today()
        anio_personal = cls._anio_personal(fecha_nacimiento, ref)
        return cls._reducir_numero(anio_personal + ref.month)

    @classmethod
    def _dia_personal(cls, fecha_nacimiento: date, fecha_objetivo: date | None = None) -> int:
        """Calcula el Día Personal: mes personal + día objetivo, reducido."""
        ref = fecha_objetivo or date.today()
        mes_personal = cls._mes_personal(fecha_nacimiento, ref)
        return cls._reducir_numero(mes_personal + ref.day)

    _NOMBRES_MES = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ]

    @classmethod
    def _meses_personales_anio(cls, fecha_nacimiento: date, fecha_objetivo: date | None = None) -> list[dict]:
        """Calcula el número personal de cada mes del año actual."""
        ref = fecha_objetivo or date.today()
        resultado = []
        for mes in range(1, 13):
            fecha_mes = date(ref.year, mes, 1)
            num = cls._mes_personal(fecha_nacimiento, fecha_mes)
            resultado.append({
                "mes": mes,
                "nombre_mes": cls._NOMBRES_MES[mes],
                "numero": num,
                "descripcion": cls._descripcion_numero(num),
            })
        return resultado

    @classmethod
    def calcular_dia_personal(cls, fecha_nacimiento: date, fecha_objetivo: date | None = None) -> dict:
        """Retorna número personal del día con descripción."""
        num = cls._dia_personal(fecha_nacimiento, fecha_objetivo)
        return {"numero": num, "descripcion": cls._descripcion_numero(num)}

    @classmethod
    def _etapas_de_la_vida(cls, fecha_nacimiento: date) -> list[dict]:
        """Calcula los 4 pináculos (etapas de la vida).

        - 1ra: mes + día de nacimiento, hasta edad 36 - camino_vida
        - 2da: día + año de nacimiento, 9 años
        - 3ra: suma 1ra + 2da, 9 años
        - 4ta: mes + año de nacimiento, resto de la vida
        """
        camino_vida = cls._camino_de_vida(fecha_nacimiento)

        dia = cls._reducir_numero(fecha_nacimiento.day)
        mes = cls._reducir_numero(fecha_nacimiento.month)
        anio = cls._reducir_numero(sum(int(d) for d in str(fecha_nacimiento.year)))

        etapa1 = cls._reducir_numero(mes + dia)
        etapa2 = cls._reducir_numero(dia + anio)
        etapa3 = cls._reducir_numero(etapa1 + etapa2)
        etapa4 = cls._reducir_numero(mes + anio)

        # Para el timing, reducir maestros a un dígito
        cv_reducido = camino_vida
        while cv_reducido > 9:
            cv_reducido = sum(int(d) for d in str(cv_reducido))
        edad_fin_1 = max(36 - cv_reducido, 27)

        nums_etapa = [etapa1, etapa2, etapa3, etapa4]
        edades = [
            (0, edad_fin_1),
            (edad_fin_1, edad_fin_1 + 9),
            (edad_fin_1 + 9, edad_fin_1 + 18),
            (edad_fin_1 + 18, None),
        ]

        return [
            {
                "numero": nums_etapa[i],
                "nombre": cls._nombre_etapa(i),
                "descripcion": cls._descripcion_numero(nums_etapa[i]),
                "descripcion_larga": cls._descripcion_larga_etapa(i, nums_etapa[i]),
                "edad_inicio": edades[i][0],
                "edad_fin": edades[i][1],
            }
            for i in range(4)
        ]

    @staticmethod
    def _detectar_maestros(numeros: list[int]) -> list[int]:
        """Detecta qué números maestros están presentes."""
        return sorted([n for n in numeros if n in NUMEROS_MAESTROS])

    @staticmethod
    def _descripcion_numero(numero: int) -> str:
        """Descripción breve del significado de cada número."""
        descripciones = {
            1: "Liderazgo, independencia, originalidad",
            2: "Cooperación, diplomacia, sensibilidad",
            3: "Expresión, creatividad, comunicación",
            4: "Estabilidad, trabajo duro, organización",
            5: "Libertad, aventura, cambio",
            6: "Responsabilidad, amor, armonía del hogar",
            7: "Análisis, espiritualidad, introspección",
            8: "Poder, abundancia, logro material",
            9: "Humanitarismo, compasión, culminación",
            11: "Maestro intuitivo, iluminación espiritual",
            22: "Maestro constructor, materialización de sueños",
            33: "Maestro sanador, servicio compasivo",
        }
        return descripciones.get(numero, "")

    @staticmethod
    def _descripcion_larga_numero(numero: int) -> str:
        """Descripción extendida con fortaleza y desafío de cada número."""
        descripciones = {
            1: (
                "Representa la energía del pionero y el iniciador. "
                "Tu fortaleza reside en la capacidad de abrir caminos donde otros no ven posibilidades. "
                "El desafío es aprender a colaborar sin perder tu individualidad."
            ),
            2: (
                "Encarna la energía del mediador y el compañero. "
                "Tu fortaleza está en la empatía y la habilidad para crear armonía entre opuestos. "
                "El desafío es no perderte en las necesidades de los demás y mantener tus propios límites."
            ),
            3: (
                "Canaliza la energía de la expresión creativa y la alegría. "
                "Tu fortaleza es la capacidad de comunicar ideas y emociones de forma inspiradora. "
                "El desafío es mantener el enfoque y no dispersar tu talento en demasiadas direcciones."
            ),
            4: (
                "Representa los cimientos sólidos y la disciplina constructiva. "
                "Tu fortaleza es la perseverancia y la capacidad de materializar planes paso a paso. "
                "El desafío es no caer en la rigidez y permitirte flexibilidad ante lo inesperado."
            ),
            5: (
                "Encarna la energía del cambio, la aventura y la libertad. "
                "Tu fortaleza está en la adaptabilidad y el coraje para explorar lo desconocido. "
                "El desafío es encontrar estabilidad sin sentir que estás renunciando a tu esencia."
            ),
            6: (
                "Canaliza la energía del amor, la responsabilidad y el hogar. "
                "Tu fortaleza es la capacidad de nutrir y crear espacios de armonía. "
                "El desafío es no cargar con responsabilidades ajenas ni caer en el sacrificio excesivo."
            ),
            7: (
                "Representa la búsqueda interior y el conocimiento profundo. "
                "Tu fortaleza es la mente analítica y la conexión con lo espiritual. "
                "El desafío es no aislarte del mundo ni perderte en la sobreintelectualización."
            ),
            8: (
                "Encarna el poder personal y la manifestación material. "
                "Tu fortaleza es la visión estratégica y la capacidad de generar abundancia. "
                "El desafío es equilibrar ambición con generosidad y no confundir poder con control."
            ),
            9: (
                "Canaliza la energía de la compasión universal y la sabiduría. "
                "Tu fortaleza es la visión amplia y el impulso de servir a un bien mayor. "
                "El desafío es soltar el pasado y las heridas emocionales para avanzar con ligereza."
            ),
            11: (
                "Número maestro de la intuición elevada y la inspiración espiritual. "
                "Tu fortaleza es la capacidad de percibir verdades que otros no ven y guiar con tu visión. "
                "El desafío es manejar la hipersensibilidad y canalizar tu don sin sentirte abrumado."
            ),
            22: (
                "Número maestro del constructor visionario. "
                "Tu fortaleza es la capacidad de transformar sueños ambiciosos en realidades tangibles. "
                "El desafío es no paralizarte ante la magnitud de tu propia visión y dar pasos concretos."
            ),
            33: (
                "Número maestro del sanador y maestro compasivo. "
                "Tu fortaleza es la capacidad de elevar y sanar a otros a través del amor incondicional. "
                "El desafío es no absorber el dolor ajeno y mantener tu propia luz interior."
            ),
        }
        return descripciones.get(numero, "")

    @staticmethod
    def _nombre_etapa(indice: int) -> str:
        """Retorna el nombre descriptivo de cada pináculo."""
        nombres = {
            0: "Primer Pináculo — Formación",
            1: "Segundo Pináculo — Desarrollo",
            2: "Tercer Pináculo — Madurez",
            3: "Cuarto Pináculo — Cosecha",
        }
        return nombres.get(indice, "")

    @classmethod
    def _descripcion_larga_etapa(cls, indice: int, numero: int) -> str:
        """Genera descripción contextual de cada etapa de vida según su índice y número."""
        contextos = {
            0: (
                "Esta es tu etapa de formación, donde las experiencias tempranas "
                "moldean tu carácter y establecen las bases de tu camino. "
                "Bajo la influencia del número {n}, este período te enseña {ens}."
            ),
            1: (
                "En esta etapa de desarrollo, enfrentás los desafíos de la vida adulta "
                "y construís sobre los cimientos de tu juventud. "
                "El número {n} guía este período hacia {ens}."
            ),
            2: (
                "La etapa de madurez es el punto de mayor potencial y cosecha interior. "
                "Aquí integrás todo lo aprendido. "
                "Con el número {n}, esta fase te impulsa a {ens}."
            ),
            3: (
                "Tu última etapa es la cosecha de toda una vida. "
                "Es un período de legado y sabiduría compartida. "
                "El número {n} te invita a {ens}."
            ),
        }
        ensenanzas = {
            1: "confiar en tu independencia y liderazgo innato",
            2: "cultivar la paciencia y las relaciones significativas",
            3: "expresar tu creatividad y comunicarte con autenticidad",
            4: "construir estructuras sólidas con esfuerzo y disciplina",
            5: "abrazar el cambio y expandir tus horizontes",
            6: "asumir responsabilidades y nutrir tu entorno",
            7: "profundizar en el autoconocimiento y la espiritualidad",
            8: "desarrollar tu poder personal y gestionar recursos",
            9: "servir a los demás con compasión y soltar lo que ya no sirve",
            11: "despertar tu intuición y guiar con visión espiritual",
            22: "materializar grandes proyectos con visión y disciplina",
            33: "sanar y elevar a otros a través del amor incondicional",
        }
        plantilla = contextos.get(indice, "")
        ens = ensenanzas.get(numero, "evolucionar con este número")
        return plantilla.format(n=numero, ens=ens)
