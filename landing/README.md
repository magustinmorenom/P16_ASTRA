# Landing ASTRA

App Next aislada para prototipar la landing pública de ASTRA sin mezclarla con
`frontend/` ni conectarla a producción.

## Comandos

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## Alcance

- Landing mobile-first con versión desktop editorial.
- CTAs internos por anclas, sin formularios ni backend.
- Contenido basado en `../docs/comunicacion-landing-astra.md`.
- Animaciones con Motion/Framer usando la dependencia ya instalada.
- Assets locales en `public/img/` para no depender de la app principal.
