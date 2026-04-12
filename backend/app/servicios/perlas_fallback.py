"""Perlas estáticas curadas usadas como fallback cuando Haiku no está disponible.

Cada terna apunta a una dimensión distinta (mente / acción / emoción) para que
la composición se sienta variada incluso sin generación dinámica.
"""

from __future__ import annotations

import random
from datetime import date

# Voseo argentino (Argentina y similares).
PERLAS_VOSEO: list[list[str]] = [
    [
        "Recordá que tu silencio es estrategia, no ausencia.",
        "Esperá la pregunta antes de ofrecer la respuesta.",
        "Lo que vos intuís primero suele ser lo correcto.",
    ],
    [
        "Tu lentitud no es duda, es precisión.",
        "Vos llegás más lejos cuando esperás la pregunta.",
        "Recordá que sentís antes de entender, no al revés.",
    ],
    [
        "Vos no naciste para encajar, naciste para reflejar.",
        "Tu manera de pensar no necesita testigos.",
        "Lo que sostenés en silencio también te define.",
    ],
    [
        "Recordá que tu intuición no se explica, se obedece.",
        "Vos sos de los que recuerdan todo, incluso lo que decidieron olvidar.",
        "Tu fuerza no grita, ordena.",
    ],
    [
        "Tu forma de mirar ya es una decisión.",
        "Vos no perseguís: convocás.",
        "Recordá que descansar también es trabajo tuyo.",
    ],
    [
        "Vos pensás mejor cuando dejás de buscar la respuesta.",
        "Tu mejor versión no se apura.",
        "Recordá que lo profundo en vos no necesita prueba.",
    ],
    [
        "Vos sabés cuando algo no es para vos antes de poder explicarlo.",
        "Tu calma incomoda a quien necesita ruido.",
        "Recordá que tu energía es un préstamo, no un regalo.",
    ],
    [
        "Vos cuidás incluso cuando estás cansado.",
        "Tu sensibilidad es información, no debilidad.",
        "Recordá que pertenecés a vos antes que a nadie.",
    ],
    [
        "Vos sos puente entre lo que se dice y lo que no.",
        "Tu manera de empezar es propia, no la copies.",
        "Recordá que merecés lo que pedís en voz baja.",
    ],
    [
        "Vos transformás lo que tocás sin proponerlo.",
        "Tu presencia ya es una respuesta.",
        "Recordá que la pausa también es movimiento tuyo.",
    ],
]

# Español neutro latino (resto del mundo hispanohablante).
PERLAS_NEUTRO: list[list[str]] = [
    [
        "Recuerda que tu silencio es estrategia, no ausencia.",
        "Espera la pregunta antes de ofrecer la respuesta.",
        "Lo que tú intuyes primero suele ser lo correcto.",
    ],
    [
        "Tu lentitud no es duda, es precisión.",
        "Tú llegas más lejos cuando esperas la pregunta.",
        "Recuerda que sientes antes de entender, no al revés.",
    ],
    [
        "Tú no naciste para encajar, naciste para reflejar.",
        "Tu manera de pensar no necesita testigos.",
        "Lo que sostienes en silencio también te define.",
    ],
    [
        "Recuerda que tu intuición no se explica, se obedece.",
        "Tú eres de los que recuerdan todo, incluso lo que decidieron olvidar.",
        "Tu fuerza no grita, ordena.",
    ],
    [
        "Tu forma de mirar ya es una decisión.",
        "Tú no persigues: convocas.",
        "Recuerda que descansar también es trabajo tuyo.",
    ],
    [
        "Tú piensas mejor cuando dejas de buscar la respuesta.",
        "Tu mejor versión no se apura.",
        "Recuerda que lo profundo en ti no necesita prueba.",
    ],
    [
        "Tú sabes cuando algo no es para ti antes de poder explicarlo.",
        "Tu calma incomoda a quien necesita ruido.",
        "Recuerda que tu energía es un préstamo, no un regalo.",
    ],
    [
        "Tú cuidas incluso cuando estás cansado.",
        "Tu sensibilidad es información, no debilidad.",
        "Recuerda que perteneces a ti antes que a nadie.",
    ],
    [
        "Tú eres puente entre lo que se dice y lo que no.",
        "Tu manera de empezar es propia, no la copies.",
        "Recuerda que mereces lo que pides en voz baja.",
    ],
    [
        "Tú transformas lo que tocas sin proponerlo.",
        "Tu presencia ya es una respuesta.",
        "Recuerda que la pausa también es movimiento tuyo.",
    ],
]


def obtener_terna_fallback(es_voseo: bool, semilla: str) -> list[str]:
    """Devuelve una terna estable para una semilla dada (típicamente fecha+usuario).

    Estable: el mismo `semilla` devuelve siempre la misma terna, así el fallback
    no parpadea entre requests del mismo día.
    """
    fuente = PERLAS_VOSEO if es_voseo else PERLAS_NEUTRO
    rng = random.Random(semilla)
    return rng.choice(fuente)


def obtener_terna_aleatoria(es_voseo: bool) -> list[str]:
    """Devuelve una terna aleatoria sin semilla — útil para tests."""
    fuente = PERLAS_VOSEO if es_voseo else PERLAS_NEUTRO
    return random.choice(fuente)


def obtener_terna_del_dia(es_voseo: bool, usuario_id: str, fecha: date) -> list[str]:
    """Helper de uso típico: terna estable por (usuario, fecha)."""
    semilla = f"{usuario_id}:{fecha.isoformat()}"
    return obtener_terna_fallback(es_voseo, semilla)
