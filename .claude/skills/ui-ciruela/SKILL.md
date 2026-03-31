---
name: ui-ciruela
description: Referente visual oficial de ASTRA para interfaces premium ciruela. Usar en cualquier tarea de diseño o refinamiento visual de producto dentro del proyecto.
user-invocable: true
disable-model-invocation: false
effort: max
---

# UI Ciruela — Referente Visual de ASTRA

`ui-ciruela` reemplaza a `ux-designer` como referencia principal para diseño visual dentro de ASTRA.

## Cuándo usarlo

Usar este skill cuando:

- haya que diseñar o refinar pantallas del producto;
- se necesite unificar estética entre módulos;
- una interfaz se vea correcta pero genérica, plana o sobredimensionada;
- el usuario pida algo premium, editorial, más ASTRA o más ciruela.

No usarlo para:

- tareas puramente funcionales sin impacto visual;
- diseño de una marca nueva ajena al sistema ASTRA.

## Principios

1. Ciruela profunda, no negro vacío.
2. Jerarquía editorial con foco inmediato.
3. Superficies integradas, no cards blancas pegadas.
4. Tipografía contenida: premium no es gigantismo.
5. Menos ruido, menos bloques redundantes.

## Reglas no negociables

- Toda interfaz queda en español.
- Nunca usar naranja o amber.
- El dorado solo aparece como acento mínimo.
- Nunca usar emojis ni símbolos zodiacales Unicode.
- Para contenido astral usar `IconoAstral` o `IconoSigno`.

## Patrones

### Hero

- Badge corto.
- Título claro, no inflado.
- Una sola tesis editorial.
- CTA principal visible.
- Sin métricas decorativas compitiendo.

### Superficies

- Fondo ciruela con gradiente o glow.
- Cards con `bg-white/[0.04]`, `bg-white/[0.08]`, `border-white/[0.08]`.
- Evitar slabs blancas puras sobre fondos nocturnos.

### Navegación y paneles

- Sidebar y navbar deben sentirse premium, no admin panel.
- Un panel contextual sólo se sostiene si realmente ayuda a decidir o entender.
- Si compite con el contenido principal, debe bajar su presencia.

### Artefactos complejos

- Un gráfico, rueda o mapa no debe dominar la pantalla si no es el centro real de la experiencia.
- Si funciona mejor como consulta, llevarlo a modal o vista secundaria.

## Anti-patrones

- Títulos gigantes sólo para “hacer impacto”.
- Overline + título + bajada repetidos en todos los bloques.
- Cards blancas importadas dentro de una pantalla ciruela.
- Explicar demasiado antes de dejar explorar.
- Usar el artefacto visual como protagonista cuando debería ser accesorio.

## Heurística de decisión

Antes de editar una pantalla, responder:

1. Qué bloque tiene que dominar visualmente.
2. Qué dato realmente cambia comprensión o acción.
3. Qué sobra.
4. Qué escala está inflada.
5. Qué artefacto conviene pasar a modal.

## Definición de terminado

La pantalla está lista cuando:

- el foco principal se entiende en menos de 2 segundos;
- el hero no depende de texto gigante;
- el sistema visual se siente coherente con ASTRA;
- el contenido técnico no abruma;
- la UI se siente premium, sobria y precisa.
