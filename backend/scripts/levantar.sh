#!/bin/bash
# Levanta toda la infraestructura de CosmicEngine
# Uso:
#   ./scripts/levantar.sh              — Levanta infra + backend + bot
#   ./scripts/levantar.sh infra        — Solo Docker (PostgreSQL + Redis)
#   ./scripts/levantar.sh backend      — Solo backend (uvicorn)
#   ./scripts/levantar.sh bot          — Solo bot Telegram
#   ./scripts/levantar.sh reiniciar    — Destruye y recrea contenedores + DB

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

cd "$BACKEND_DIR"

# Colores
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${VERDE}[INFO]${NC} $1"; }
warn()  { echo -e "${AMARILLO}[WARN]${NC} $1"; }
error() { echo -e "${ROJO}[ERROR]${NC} $1"; }

# ------------------------------------------------------------------ #
# Funciones                                                            #
# ------------------------------------------------------------------ #

levantar_infra() {
    info "Levantando PostgreSQL (5434) y Redis (6380)..."
    docker compose up -d
    info "Esperando a que PostgreSQL esté listo..."
    sleep 2
    # Verificar conexión
    for i in {1..10}; do
        if docker compose exec -T postgres pg_isready -U cosmic > /dev/null 2>&1; then
            info "PostgreSQL listo"
            break
        fi
        sleep 1
    done
    info "Ejecutando migraciones..."
    source .venv/bin/activate 2>/dev/null || true
    alembic upgrade head
    info "Infraestructura lista"
}

levantar_backend() {
    info "Iniciando backend (uvicorn en :8000)..."
    source .venv/bin/activate 2>/dev/null || true
    uvicorn app.principal:aplicacion --reload --host 0.0.0.0 --port 8000
}

levantar_bot() {
    # Verificar que TELEGRAM_BOT_TOKEN esté configurado
    source .venv/bin/activate 2>/dev/null || true
    TOKEN=$(python -c "from app.configuracion import obtener_configuracion; print(obtener_configuracion().telegram_bot_token)" 2>/dev/null)
    if [ -z "$TOKEN" ]; then
        error "TELEGRAM_BOT_TOKEN no configurado en .env"
        exit 1
    fi
    info "Iniciando bot Telegram — Oráculo ASTRA..."
    python -m app.bot_main
}

reiniciar() {
    warn "Destruyendo contenedores y volúmenes..."
    docker compose down -v
    levantar_infra
    info "Base de datos recreada desde cero"
}

levantar_todo() {
    levantar_infra

    # Backend en background
    info "Iniciando backend en background..."
    source .venv/bin/activate 2>/dev/null || true
    uvicorn app.principal:aplicacion --reload --host 0.0.0.0 --port 8000 &
    PID_BACKEND=$!
    info "Backend PID: $PID_BACKEND"

    # Bot en foreground (si tiene token)
    TOKEN=$(python -c "from app.configuracion import obtener_configuracion; print(obtener_configuracion().telegram_bot_token)" 2>/dev/null)
    if [ -n "$TOKEN" ]; then
        info "Iniciando bot Telegram..."
        python -m app.bot_main &
        PID_BOT=$!
        info "Bot PID: $PID_BOT"
    else
        warn "TELEGRAM_BOT_TOKEN no configurado — bot no iniciado"
    fi

    info "Todo listo. Ctrl+C para detener."
    trap "kill $PID_BACKEND $PID_BOT 2>/dev/null; exit" INT TERM
    wait
}

# ------------------------------------------------------------------ #
# Main                                                                 #
# ------------------------------------------------------------------ #

case "${1:-todo}" in
    infra)      levantar_infra ;;
    backend)    levantar_backend ;;
    bot)        levantar_bot ;;
    reiniciar)  reiniciar ;;
    todo)       levantar_todo ;;
    *)
        echo "Uso: $0 {infra|backend|bot|reiniciar|todo}"
        exit 1
        ;;
esac
