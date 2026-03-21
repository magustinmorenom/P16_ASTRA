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

        return {
            "nombre": nombre,
            "fecha_nacimiento": str(fecha_nacimiento),
            "sistema": sistema,
            "camino_de_vida": {
                "numero": camino_vida,
                "descripcion": cls._descripcion_numero(camino_vida),
            },
            "expresion": {
                "numero": expresion,
                "descripcion": cls._descripcion_numero(expresion),
            },
            "impulso_del_alma": {
                "numero": impulso_alma,
                "descripcion": cls._descripcion_numero(impulso_alma),
            },
            "personalidad": {
                "numero": personalidad,
                "descripcion": cls._descripcion_numero(personalidad),
            },
            "numero_nacimiento": {
                "numero": numero_nacimiento,
                "descripcion": cls._descripcion_numero(numero_nacimiento),
            },
            "anio_personal": {
                "numero": anio_personal,
                "descripcion": cls._descripcion_numero(anio_personal),
            },
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
    def _anio_personal(cls, fecha_nacimiento: date) -> int:
        """Calcula el Año Personal basado en el año actual."""
        from datetime import date as date_cls
        anio_actual = date_cls.today().year
        dia = cls._reducir_numero(fecha_nacimiento.day)
        mes = cls._reducir_numero(fecha_nacimiento.month)
        anio = cls._reducir_numero(sum(int(d) for d in str(anio_actual)))
        return cls._reducir_numero(dia + mes + anio)

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
