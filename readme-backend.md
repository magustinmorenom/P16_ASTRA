# CosmicEngine — Backend

## Archivos creados: 73

| Capa | Archivos |
|------|----------|
| Scaffold | `pyproject.toml`, `docker-compose.yml`, `.env.ejemplo`, `Dockerfile`, `alembic/` |
| App Core | `principal.py`, `configuracion.py`, `dependencias.py`, `excepciones.py`, `registro.py` |
| Modelos | `base.py`, `perfil.py`, `calculo.py` |
| Esquemas | `entrada.py`, `respuesta.py`, `natal.py`, `diseno_humano.py`, `numerologia.py`, `retorno_solar.py`, `transitos.py` |
| Núcleo | `servicio_geo.py`, `servicio_zona_horaria.py`, `servicio_efemerides.py` |
| Servicios | `servicio_astro.py`, `servicio_diseno_humano.py`, `servicio_numerologia.py`, `servicio_retorno_solar.py`, `servicio_transitos.py` |
| Rutas | 6 endpoints: `/natal`, `/human-design`, `/numerology`, `/solar-return/{anio}`, `/transits`, `/profile` |
| Datos estáticos | `tabla_iching.json`, `puertas_centros.json`, `canales.json` |
| Cache/DB | `gestor_cache.py`, `repositorio_perfil.py`, `repositorio_calculo.py`, `sesion.py` |
| Tests | 53 tests — **todos pasan** |

## Endpoints registrados

```
POST /api/v1/natal
POST /api/v1/human-design
POST /api/v1/numerology
POST /api/v1/solar-return/{anio}
GET  /api/v1/transits
POST /api/v1/profile
GET  /api/v1/profile/{perfil_id}
GET  /health
```

## Para arrancar

```bash
cd backend
docker compose up -d postgres redis  # Infraestructura
source .venv/bin/activate
alembic upgrade head                 # Migraciones
uvicorn app.principal:aplicacion --reload --port 8000
```

## Tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```
