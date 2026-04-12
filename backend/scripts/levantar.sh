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

provisionar_efemerides() {
    local EPHE_DIR="$BACKEND_DIR/datos_efemerides"
    if ls "$EPHE_DIR"/*.se1 &>/dev/null; then
        info "Efemérides presentes ($(ls "$EPHE_DIR"/*.se1 | wc -l | tr -d ' ') archivos)"
        return
    fi

    info "Provisionando efemérides (Swiss Ephemeris)..."
    mkdir -p "$EPHE_DIR"
    source .venv/bin/activate 2>/dev/null || true

    local KERYKEION_SWEPH
    KERYKEION_SWEPH=$(python3 -c "import kerykeion, os; print(os.path.join(os.path.dirname(kerykeion.__file__), 'sweph'))" 2>/dev/null || true)

    if [ -d "$KERYKEION_SWEPH" ]; then
        for archivo in seas_18.se1 sepl_18.se1 semo_18.se1; do
            [ -f "$KERYKEION_SWEPH/$archivo" ] && cp "$KERYKEION_SWEPH/$archivo" "$EPHE_DIR/"
        done
        # Descargar los que falten
        for archivo in sepl_18.se1 semo_18.se1; do
            if [ ! -f "$EPHE_DIR/$archivo" ]; then
                info "Descargando $archivo..."
                curl -sL "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/$archivo" -o "$EPHE_DIR/$archivo" 2>/dev/null || warn "No se pudo descargar $archivo"
            fi
        done
        info "Efemérides listas ($(ls "$EPHE_DIR"/*.se1 2>/dev/null | wc -l | tr -d ' ') archivos)"
    else
        error "No se encontró kerykeion/sweph — instalá dependencias primero"
        exit 1
    fi
}

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
    # Efemérides
    provisionar_efemerides
    # Migraciones
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

    # Matar procesos anteriores si existen
    pgrep -f "uvicorn app.principal" | xargs kill 2>/dev/null || true
    pgrep -f "app.bot_main" | xargs kill 2>/dev/null || true
    sleep 1

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
