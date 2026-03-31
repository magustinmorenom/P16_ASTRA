---
name: experto-ui-premium-ciruela
description: Especialista en interfaces ASTRA con estetica premium ciruela. Usar cuando haya que disenar, refinar o unificar pantallas con hero editorial, glass violeta oscuro, cards consistentes, sidebar/navbar premium y menos ruido visual. Tambien dispara si el usuario pide "premium ciruela", "mas premium", "mas editorial", "como la pantalla de podcasts" o coherencia visual entre pantallas.
user-invocable: true
disable-model-invocation: false
effort: max
---

# Experto en UI Premium Ciruela

Este skill define un lenguaje visual consistente para ASTRA cuando la interfaz debe sentirse mas premium, mas editorial y mas enfocada. No busca inventar una marca nueva: ordena y repite un sistema.

## Cuando usarlo

Usar este skill cuando:

- el usuario pida una UI "premium", "ciruela", "mas pro", "mas editorial" o "como podcasts";
- haya que unificar varias pantallas bajo el mismo lenguaje visual;
- una pantalla se vea correcta pero todavia generica, plana o inconsistente;
- haya que mejorar jerarquia, contraste, hero, cards, historial, sidebar o navbar.

No usarlo para:

- landing pages promocionales completamente ajenas al lenguaje actual de ASTRA;
- cambios visuales minimos donde ya exista un patron claro y suficiente;
- tareas puramente funcionales sin impacto de interfaz.

## Identidad visual

La UI premium ciruela de ASTRA se apoya en 5 ideas:

1. **Ciruela profunda, no negro vacio**
   - Fondo base: `#16011B`, `#1C0627`, `#2D1B69`
   - Evitar superficies planas sin modulación
   - Siempre introducir una capa de radial glow, gradiente o glass

2. **Jerarquia editorial**
   - Un hero claro con badge, icono, titulo y subtitulo
   - El usuario debe entender primero "que es esta pantalla" y despues "que acciones hago"
   - No meter metricas decorativas si compiten con el foco principal

3. **Superficies integradas**
   - Preferir `bg-white/[0.04]`, `bg-white/[0.08]`, `border-white/[0.08]`
   - Evitar slabs blancas puras si el resto de la pantalla es nocturno/cosmico
   - Los bordes son suaves, no grises duros

4. **Consistencia de patrones**
   - Cards: icono, overline, titulo, descripcion, estado, CTA
   - Historiales/listas: superficie propia, metadata clara, accion visible
   - Sidebar/navbar: chrome premium, no admin panel generico

5. **Ruido visual bajo**
   - Quitar bloques redundantes
   - Quitar tarjetas secundarias que no cambian decisiones
   - Si un dato no activa una accion o no mejora comprension, probablemente sobra

## Reglas no negociables para ASTRA

- Toda interfaz debe quedar en espanol.
- Nunca usar naranja o amber agresivo.
- El dorado solo se usa como acento minimo.
- No usar emojis ni simbolos zodiacales Unicode.
- Para contenido astral usar `IconoAstral` o `IconoSigno`.
- Mantener la compatibilidad con el sistema visual existente del producto.

## Patrones del sistema

### 1. Hero premium ciruela

Objetivo: abrir la pantalla con una sola idea fuerte.

Debe incluir:

- badge superior corto;
- icono o bloque visual dominante;
- titulo grande con tracking levemente negativo;
- descripcion de 1 o 2 lineas;
- fondo con gradiente ciruela + glow sutil.

Evitar:

- tres metricas apiladas que no disparan accion;
- subtitulos largos o explicativos en exceso;
- botones secundarios compitiendo con el contenido principal.

### 2. Cards principales

Cada card debe compartir el mismo esqueleto:

- icono dentro de un tile con gradiente;
- overline o etiqueta;
- titulo principal;
- descripcion breve;
- bloque de estado;
- fila de acciones consistente.

Clases utiles:

```tsx
rounded-[28px] border border-white/[0.12]
bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))]
shadow-[0_18px_45px_rgba(8,3,20,0.24)]
hover:border-[#B388FF]/35
```

### 3. Historiales y listas

El historial no debe parecer texto perdido sobre fondo oscuro.

Usar:

- un contenedor propio;
- items con fondo y borde sutil;
- metadata con contraste intermedio;
- CTA de descarga o accion al extremo derecho;
- hover claro, pero elegante.

### 4. Sidebar premium

El sidebar tiene que sentirse parte de la marca:

- fondo ciruela con gradiente vertical;
- item activo con glow leve, borde suave y mejor contraste;
- texto inactivo legible;
- evitar truncado agresivo en labels.

Si hay badges tipo "Proximamente", deben ser pequeños, respirados y no romper la lectura.

### 5. Navbar premium

La topbar no debe sentirse plana.

Usar:

- gradiente suave;
- borde inferior tenue;
- ribbon central con glass;
- avatar con mejor presencia;
- signos mostrados con `IconoSigno`, no SVGs directos ni texto.

## Heuristicas de decision

Antes de editar una pantalla, responder mentalmente:

1. Que bloque tiene que dominar visualmente.
2. Que informacion es de contexto y cual es accion.
3. Que elementos estan compitiendo sin necesidad.
4. Donde falta contraste util.
5. Donde un patron se rompe respecto de cards, listas o chrome.

Si la pantalla se siente "oscura pero vacia", agregar capas.
Si se siente "completa pero ruidosa", quitar bloques.

## Recetas Tailwind reutilizables

### Hero

```tsx
relative overflow-hidden rounded-[32px] border border-white/[0.08]
bg-[radial-gradient(circle_at_top_left,rgba(179,136,255,0.2),transparent_32%),linear-gradient(135deg,rgba(45,27,105,0.96),rgba(22,1,27,0.98))]
shadow-[0_24px_70px_rgba(8,2,22,0.38)]
```

### Panel secundario

```tsx
rounded-[30px] border border-white/[0.08]
bg-white/[0.04] backdrop-blur-xl
shadow-[0_18px_40px_rgba(8,3,20,0.22)]
```

### Item de lista

```tsx
rounded-[24px] border border-white/[0.08]
bg-black/10 hover:border-white/15 hover:bg-white/[0.05]
transition-all duration-200
```

### Item activo en sidebar

```tsx
border border-[#B388FF]/20
bg-[linear-gradient(135deg,rgba(124,77,255,0.24),rgba(179,136,255,0.08))]
shadow-[0_12px_28px_rgba(20,8,42,0.26)]
```

## Anti-patrones

No hacer esto:

- cards blancas puras encima de una pantalla completamente ciruela sin integracion;
- metrico por defecto solo "porque llena espacio";
- sidebars con texto gris casi ilegible;
- headers que parecen barra administrativa;
- una card con CTA ancho y otra con iconos circulares sin justificacion;
- badges gigantes que rompen el ritmo;
- exceso de blur o glow hasta perder nitidez.

## Flujo de trabajo

1. Leer la pantalla y detectar jerarquia rota, ruido y falta de consistencia.
2. Identificar si hace falta hero, limpieza o solo refinamiento de surfaces.
3. Unificar cards, listas y chrome bajo el patron premium ciruela.
4. Ajustar contraste y tipografia antes de agregar mas componentes.
5. Validar desktop y mobile.
6. Correr lint sobre los archivos tocados.
7. Si el cambio es relevante, actualizar `context/resumen-de-cambios.md`.

## Definicion de terminado

La pantalla esta lista cuando:

- se reconoce claramente el foco principal en menos de 2 segundos;
- el hero no compite con metricas innecesarias;
- cards, historial y navegacion hablan el mismo lenguaje;
- los textos secundarios siguen siendo legibles;
- la UI se siente premium sin volverse barroca.
