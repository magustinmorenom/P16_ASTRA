# Scripts de desarrollo

Utilidades para simular estados y probar features localmente sin esperar ciclos reales (cambio de día, regeneración de podcasts, etc.). **No usar en producción.**

---

## `resetear_dia_usuario.py`

Resetea el estado del usuario para simular un **primer login del día ARG** y dispara el pipeline de auto-generación del podcast del día. Sirve para probar end-to-end el banner del header + el background task sin tener que esperar 24 horas.

### Qué toca

1. **`usuarios.ultimo_acceso = NULL`** — así `/auth/me` detecta "primer acceso del día" la próxima vez que el frontend lo llame, y encola `bootstrap_dia_podcast` como background task.
2. **`DELETE FROM podcast_episodios WHERE usuario_id = ? AND fecha = <hoy ARG> AND momento = 'dia'`** — borra el episodio del día si ya existía. Si no se borra, el pipeline es idempotente y devuelve el episodio `listo` de una, el banner no ve el estado `generando` y no aparece.
3. **(Opcional) MinIO** — con `--incluir-minio` elimina también el MP3 del bucket. No es necesario porque la key es determinística y se sobreescribe al regenerar.

El corte de día usa `dia_arg_actual()` (zona `America/Argentina/Buenos_Aires`), la misma función que usa el backend real — así la fecha coincide exactamente con la fecha_clave del pipeline.

### Uso

Desde `backend/` con el venv activado:

```bash
cd backend
source .venv/bin/activate

# Default — resetea magustin.morenom@gmail.com
python -m scripts.dev.resetear_dia_usuario

# Otro usuario
python -m scripts.dev.resetear_dia_usuario otro@email.com

# También borra el MP3 del bucket MinIO
python -m scripts.dev.resetear_dia_usuario --incluir-minio
python -m scripts.dev.resetear_dia_usuario otro@email.com --incluir-minio
```

### Output esperado

```
→ Reseteando día de magustin.morenom@gmail.com
  id        : 550e8400-e29b-41d4-a716-446655440000
  nombre    : Agustin
  último ac.: 2026-04-11 08:45:12+00:00

  ✓ ultimo_acceso: NULL
  ✓ podcast_episodios: 1 fila(s) eliminada(s) para fecha=2026-04-11

Listo. Ahora:
  1. Abrí DevTools → Console y ejecutá:
     Object.keys(localStorage).filter(k => k.startsWith("astra:podcast_banner_")).forEach(k => localStorage.removeItem(k));
  2. Refrescá la página.
  3. El banner debería aparecer en unos segundos.
```

### Flujo completo de prueba

1. **Correr el script.**

   ```bash
   python -m scripts.dev.resetear_dia_usuario
   ```

2. **Limpiar localStorage del navegador** (el banner persiste la flag "listo visto" para no repetirse). Abrí DevTools → Console y ejecutá:

   ```js
   Object.keys(localStorage)
     .filter(k => k.startsWith("astra:podcast_banner_"))
     .forEach(k => localStorage.removeItem(k));
   ```

3. **Refrescar la página.** No hace falta cerrar sesión — el token sigue válido y el bootstrap se dispara en `/auth/me`, no en `/login`.

4. **Observar el flujo:**
   - En ~1 segundo debería aparecer el banner con shimmer violeta: *"Hola Agustin 👋, hoy es un nuevo día! Te estoy preparando tu día."* + dots pulsantes + etiqueta "Escribiendo guión".
   - A los ~15–30s la etiqueta cambia a "Generando audio".
   - A los ~30–60s totales, el banner cross-fade a *"Tu día está listo"* con un botón "Escuchar" que carga el episodio en el reproductor cósmico.
   - El banner se oculta solo a los 8s después de aparecer en estado listo.

### Errores controlados

| Caso | Comportamiento |
|------|----------------|
| Usuario inexistente | Sale con código `1` y mensaje `✗ Usuario <email> no encontrado`. |
| No hay episodio previo | Lo informa (`no había episodio tipo 'dia' para fecha=<hoy>`) pero sigue — el reset de `ultimo_acceso` igual se aplica. |
| MinIO caído | El bloque `try/except` aísla el fallo, no rompe el reset de DB. |
| DB caída | `crear_motor_async` falla al conectar — revisá que el contenedor postgres esté arriba en el puerto 5434 (`docker compose ps`). |

### Por qué no toca otros lugares

- **Token JWT**: sigue válido, no necesitamos invalidarlo. Al refrescar, el frontend llama `/auth/me` con el token existente y ahí es donde el backend dispara el bootstrap.
- **`conversaciones_oraculo`**: el chat tiene su propio "corte de día" independiente del podcast. Si querés probar también el reset del chat, esa lógica vive en `RepositorioConversacion.obtener_o_crear_web` y se dispara automáticamente al enviar el primer mensaje del día siguiente.
- **Redis**: el contador diario del chat gratis usa `chat:limite:{usuario_id}:{YYYY-MM-DD}` con TTL 24h. Se auto-resetea al día siguiente y no afecta al podcast.

### Ubicación en el código relacionada

- `backend/app/servicios/servicio_podcast_bootstrap.py` — función `bootstrap_dia_podcast` que el script busca disparar indirectamente.
- `backend/app/rutas/v1/auth.py` endpoint `/auth/me` — donde se evalúa si encolar el bootstrap.
- `backend/app/nucleo/utilidades_fecha.py` — `dia_arg_actual()` + `es_primer_acceso_del_dia_arg()`.
- `frontend/src/componentes/layouts/banner-podcast-dia.tsx` — el banner que visualiza el progreso.
