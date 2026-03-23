#!/usr/bin/env bash
# ============================================================
# Script de despliegue — CosmicEngine
# ============================================================
# Uso:
#   ./scripts/desplegar.sh full     — Build + migraciones + deploy
#   ./scripts/desplegar.sh build    — Solo build de imágenes
#   ./scripts/desplegar.sh deploy   — Solo levantar servicios
#   ./scripts/desplegar.sh migrate  — Solo ejecutar migraciones
#   ./scripts/desplegar.sh logs     — Ver logs en vivo
#   ./scripts/desplegar.sh status   — Estado de servicios
# ============================================================

set -euo pipefail

# Colores
ROJO='\033[0;31m'
VERDE='\033[0;32m'
AMARILLO='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Directorio raíz del proyecto
DIR_RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DIR_RAIZ/docker-compose.prod.yml"
ENV_FILE="$DIR_RAIZ/.env.prod"

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${VERDE}[OK]${NC} $1"; }
warn()  { echo -e "${AMARILLO}[WARN]${NC} $1"; }
error() { echo -e "${ROJO}[ERROR]${NC} $1" >&2; exit 1; }

# Verificar que existe .env.prod
verificar_env() {
    if [ ! -f "$ENV_FILE" ]; then
        error "No se encontró $ENV_FILE. Copiar .env.ejemplo.prod como .env.prod y completar valores."
    fi
    info "Archivo .env.prod encontrado"
}

# Build de imágenes Docker
build() {
    info "Construyendo imágenes Docker..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    ok "Imágenes construidas"
}

# Ejecutar migraciones de BD
migrate() {
    info "Ejecutando migraciones de base de datos..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend \
        alembic upgrade head
    ok "Migraciones aplicadas"
}

# Levantar servicios
deploy() {
    info "Levantando servicios..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    ok "Servicios levantados"

    info "Esperando health checks..."
    sleep 10

    # Verificar salud
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy"; then
        warn "Algunos servicios no están saludables:"
        docker compose -f "$COMPOSE_FILE" ps
    else
        ok "Todos los servicios saludables"
    fi
}

# Deploy completo
full() {
    verificar_env
    build
    deploy
    sleep 5
    migrate
    status
    echo ""
    ok "Deploy completo. Verificar con: curl https://\$(grep DOMINIO $ENV_FILE | cut -d= -f2)/health"
}

# Ver logs
logs() {
    docker compose -f "$COMPOSE_FILE" logs -f --tail=100
}

# Estado de servicios
status() {
    info "Estado de servicios:"
    docker compose -f "$COMPOSE_FILE" ps
}

# --- Main ---
COMANDO="${1:-help}"

case "$COMANDO" in
    full)    full ;;
    build)   verificar_env && build ;;
    deploy)  verificar_env && deploy ;;
    migrate) verificar_env && migrate ;;
    logs)    logs ;;
    status)  status ;;
    *)
        echo "Uso: $0 {full|build|deploy|migrate|logs|status}"
        exit 1
        ;;
esac
