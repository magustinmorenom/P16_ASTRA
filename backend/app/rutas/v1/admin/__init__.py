"""Router agregado de administración."""

from fastapi import APIRouter

from app.rutas.v1.admin.metricas import router as metricas_router
from app.rutas.v1.admin.usuarios import router as usuarios_router
from app.rutas.v1.admin.suscripciones import router as suscripciones_router
from app.rutas.v1.admin.costos import router as costos_router
from app.rutas.v1.admin.sistema import router as sistema_router

router = APIRouter(prefix="/admin", tags=["Administración"])

router.include_router(metricas_router)
router.include_router(usuarios_router)
router.include_router(suscripciones_router)
router.include_router(costos_router)
router.include_router(sistema_router)
