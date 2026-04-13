# ASTRA - Backlog Fundamental

> **PROMPT DE INGRESO AL BACKLOG (REGLAS DE FORMATO)**
> Cada vez que ingreses un nuevo item a este backlog, DEBES respetar este formato:
>
> ### [ETIQUETA] - (AREA) - Titulo conciso
> **Ingreso:** YYYY-MM-DD ~HH:MM (ARG)
> **Origen probable / Approach sugerido:** (Donde empezar a investigar o resolver — archivo, servicio, endpoint, flujo. No es mandatorio pero orienta al dev que lo tome.)
>
> - **Detalles:** Breve explicacion del problema o idea
> - **Objetivo:** Que buscamos resolver o lograr
>
> Etiquetas: BUG | FEAT | UX/UI | DEV
> Areas: Backend | Frontend | Mobile | Pipeline | IA

---

## Tareas Pendientes

### BUG - (Backend / IA) - Desfasaje de fechas en calculos
**Ingreso:** 2026-04-12 ~22:00 (ARG)
**Origen probable:** Revisar como llega la fecha desde el frontend (`cliente.ts` o headers), como la interpreta el backend (`servicio_pronostico.py`, `servicio_podcast.py`), y si se usa `datetime.now()` del servidor vs la timezone del usuario. Comparar con `ServicioZonaHoraria`.

- **Detalles:** Revisar de donde se saca la fecha para el calculo (si del usuario, del navegador, o del servidor). Hubo un desfasaje de fecha entre ayer y hoy. Hay que comprobar que zona horaria se esta utilizando.
- **Objetivo:** Asegurar que los calculos astrologicos se alineen de forma exacta con el dia y la zona horaria real del usuario.

---

### BUG - (Pipeline) - Cartel "No pudimos generar tu pronostico" post-podcast
**Ingreso:** 2026-04-12 ~22:00 (ARG)
**Origen probable:** Flujo en `servicio_podcast.py` y el endpoint que lo invoca. Verificar que status/response codes del pipeline se propaguen correctamente al frontend (`hero-seccion.tsx` o `momentos-dia.tsx`). Posible race condition o estado stale en el store/cliente.

- **Detalles:** Despues de generar/reproducir el podcast, la app sigue arrojando el cartel de error indicando que no se pudo generar el pronostico.
- **Objetivo:** Que la UI responda de manera exitosa y sin mensajes de error tras la generacion del podcast.

---

### UX/UI - (IA / Pipeline) - Podcast adaptativo segun el momento del dia
**Ingreso:** 2026-04-12 ~22:00 (ARG)
**Origen probable:** Modificar `prompt_podcast.md` para inyectar la hora actual como variable de contexto. En `servicio_podcast.py` pasar `datetime.now(tz_usuario)` al prompt. El TTS no necesita cambios, solo el guion generado por Claude.

- **Detalles:** Si el usuario genera el podcast a las 8 AM, el saludo y contenido es de "buenos dias". Si lo genera a las 15 PM, debe tenerlo en cuenta.
- **Objetivo:** Adaptar el guion del podcast dinamicamente segun la hora de generacion para que contextualice sobre lo que resta del dia.
