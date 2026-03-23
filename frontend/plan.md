# Plan: Bordes redondeados y espaciado entre paneles (estilo Spotify)

## Objetivo
Agregar `rounded-[10px]` a los 3 paneles, gap de 5px entre ellos, y margen de 7px en los bordes izquierdo y derecho.

## Referencia
Solo la **forma y espaciado** de la captura de Spotify: paneles separados con esquinas redondeadas y pequeño gap entre ellos.

## Cambios

### 1. `layout-app.tsx` — Contenedor de paneles
- Agregar `gap-[5px] px-[7px]` al flex container que envuelve sidebar + main
- Quitar borders entre paneles (ya no hacen falta, el gap los separa)

### 2. `sidebar-navegacion.tsx` — Panel izquierdo
- Agregar `rounded-[10px]` al `<aside>` desktop
- Quitar `border-r` (el gap ya separa visualmente)

### 3. `dashboard/page.tsx` — Panel central y panel derecho
- Panel central (`<section>`): agregar `rounded-[10px]`
- Panel derecho (`<aside>`): agregar `rounded-[10px]`, quitar `border-l`

### 4. `layout-app.tsx` — Main wrapper
- Agregar `rounded-[10px]` al `<main>` para que las páginas que no son dashboard también tengan bordes redondeados
