# Casos de Uso — CosmicEngine

Registro de casos de uso que se van definiendo durante el diseño y desarrollo de la plataforma.

---

## CU-001: Podcasts y Lecturas Cósmicas

**Descripción:** El usuario accede a contenido de audio (podcasts) y lecturas generados con IA, personalizados según su perfil natal. La sección ofrece tres niveles de profundidad temporal: diario, semanal y mensual.

**Actor principal:** Usuario autenticado

**Trigger:** El usuario toca el botón de play (▶) o el botón de lectura (📖) en una tarjeta de podcast en la pantalla Home.

**Contenidos disponibles:**

| Tarjeta | Tipo | Duración | Acciones |
|---------|------|----------|----------|
| **Momento Clave de tu Día** | Podcast diario matutino | ~3 min | Audio |
| **Tu Semana Cósmica** | Resumen semanal | ~8 min | Audio + Lectura |
| **Tu Mes Cósmico** | Análisis mensual profundo | ~15 min | Audio + Lectura |

**Flujo principal — Audio:**
1. El usuario ve la sección "Podcasts y Lecturas" en la pantalla principal.
2. Cada tarjeta muestra cover art con gradiente violeta, título, descripción, duración y botones de acción.
3. El usuario toca el botón de play (círculo violeta con ícono play blanco).
4. El sistema genera (o recupera del cache) un podcast con IA personalizado al perfil natal del usuario.
5. Se reproduce el audio con controles de reproducción (play/pausa, progreso).

**Flujo principal — Lectura:**
1. El usuario toca el botón de lectura (círculo violeta claro con ícono book-open).
2. Se abre una vista de lectura con el contenido textual del análisis correspondiente.
3. El contenido es el mismo que el podcast pero en formato texto enriquecido.

**Consideraciones:**
- Todo el contenido es personalizado según el perfil natal del usuario.
- Los contenidos generados deben cachearse (mismo período + mismo perfil = mismo contenido).
- El podcast diario se renueva cada mañana; el semanal cada lunes; el mensual el 1ro de cada mes.
- Idioma: español.
- Cada tarjeta tiene un cover art con gradiente que va de tonos más cálidos (diario) a más profundos (mensual).
- Botones: play (`$violet-500` fondo, ícono blanco), lectura (`$violet-50` fondo, ícono `$violet-500`).
- Las tarjetas semanal y mensual ofrecen ambos formatos (audio + lectura); la diaria solo audio.

**Referencia de diseño:** Pantalla Home → Sección "Podcasts y Lecturas" → Tarjetas estilo Spotify (`pencil-new.pen`).
