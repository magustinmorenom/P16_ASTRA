# Diagnóstico UX — Chatbot Personal Espiritual ASTRA

## 1. Estado Actual: Qué Ya Existe

| Componente | Estado | Dónde |
|---|---|---|
| Claude API integrado | Funcionando | `servicio_oraculo.py` |
| System prompt del oráculo | 210+ líneas, maduro | `oraculo/system_prompt.md` |
| Inyección de perfil cósmico | Completo | `_obtener_contexto_cosmico()` |
| Historial conversacional | JSONB multi-turno | `ConversacionOraculo` model |
| Tránsitos en tiempo real | Funcionando | `ServicioTransitos` |
| Feature gating Premium | Implementado | `requiere_plan("premium")` |

**Lo que NO existe:** Una interfaz de chat dentro de la app. El oráculo solo vive en Telegram.

---

## 2. Identidad del Chatbot

Es **el Oráculo personal** — la misma entidad que habla por Telegram y narra los podcasts.

**Personalidad:**
- Habla en español rioplatense
- Usa el nombre del usuario siempre
- Cruza las tres disciplinas (astrología + HD + numerología) naturalmente
- Tiene límites epistémicos honestos

**Qué NO debe hacer:**
- No diagnostica salud
- No predice el futuro — interpreta tendencias energéticas
- No reemplaza terapia
- No inventa datos
- No inicia conversación no solicitada

---

## 3. Jerarquía de Presencia — "Siempre Ahí, Nunca Estorba"

### Nivel 0 — Invisible (scroll activo / pantallas inmersivas)
### Nivel 1 — FAB pasivo (estado por defecto)
- 48x48px, glow violeta sutil, icono sparkle
- Breathing lento (6s ciclo)
- Badge dorado cuando hay insight contextual relevante

### Nivel 2 — Panel deslizable (conversando)
- Mobile: Bottom sheet 65% pantalla
- Desktop: Panel lateral derecho 380px

### Nivel 3 — Fullscreen (solo por elección del usuario)

---

## 4. Patrones de Interacción

### Sugerencias contextuales por pantalla

| Pantalla actual | Sugerencia si abre chat |
|---|---|
| Dashboard | "¿Cómo viene mi energía hoy?" |
| Carta Natal | "¿Qué significa este aspecto en mi carta?" |
| Diseño Humano | "Explicame mi autoridad" |
| Numerología | "¿Qué significa mi año personal?" |
| Tránsitos | "¿Cómo me afecta este tránsito?" |

### Respuestas
- 3-6 párrafos cortos
- Cruza las 3 disciplinas naturalmente
- Cierra con algo accionable
- Texto plano con negrita ocasional

---

## 5. Monetización — Free vs Premium

### Plan Gratis
- 3 mensajes por día
- Respuestas completas (no degradadas)
- Contador se resetea a medianoche hora local

### Plan Premium
- Mensajes ilimitados
- Historial persistente
- Acceso a sugerencias proactivas (badge dorado)

---

## 6. Estados del Chatbot

| Estado | Visual |
|---|---|
| Disponible | FAB visible, sparkle icon |
| Con insight | FAB + badge dorado |
| Cargando respuesta | Typing indicator (3 dots breathing) |
| Error de red | Toast sutil, fade out 4s |
| Sin perfil | FAB oculto |
| Plan Gratis con límite | FAB visible, 3 msgs/día |

---

## 7. Anti-patrones a Evitar

- No pop-up al entrar a la app
- No notificaciones push del chat
- No respuestas larguísimas (max 150 palabras default)
- No gamificar el chat (no streaks, no badges)
- No animaciones de entrada agresivas
- No sonidos de notificación
