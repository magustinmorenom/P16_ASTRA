#!/usr/bin/env bash
# ──────────────────────────────────────────────
# CosmicEngine — Script de Infraestructura
# Uso:
#   ./scripts/levantar.sh            Levantar todo
#   ./scripts/levantar.sh reiniciar  Reiniciar desde cero
#   ./scripts/levantar.sh parar      Detener todo
# ──────────────────────────────────────────────

set -euo pipefail

# ── Colores ──
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
ROJO='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Rutas ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROYECTO_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROYECTO_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"
PID_FILE="$BACKEND_DIR/.uvicorn.pid"

# ── Funciones auxiliares ──
info()    { echo -e "${CYAN}ℹ ${RESET}$1"; }
ok()      { echo -e "${VERDE}✓ ${RESET}$1"; }
warn()    { echo -e "${AMARILLO}⚠ ${RESET}$1"; }
error()   { echo -e "${ROJO}✗ ${RESET}$1"; }
titulo()  { echo -e "\n${BOLD}${CYAN}═══ $1 ═══${RESET}\n"; }

banner() {
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════╗"
    echo "║     CosmicEngine — Infraestructura   ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${RESET}"
}

# ── Verificar requisitos ──
verificar_requisitos() {
    titulo "Verificando requisitos"

    # Docker
    if command -v docker &>/dev/null; then
        ok "Docker: $(docker --version | head -c 40)"
    else
        error "Docker no encontrado. Instalalo desde https://docker.com"
        exit 1
    fi

    # Docker Compose
    if docker compose version &>/dev/null; then
        ok "Docker Compose: $(docker compose version --short)"
    else
        error "Docker Compose no encontrado"
        exit 1
    fi

    # Python
    if command -v python3 &>/dev/null; then
        PY_VERSION=$(python3 --version 2>&1)
        ok "Python: $PY_VERSION"
    else
        error "Python 3 no encontrado"
        exit 1
    fi

    # Virtual environment
    if [ -d "$VENV_DIR" ]; then
        ok "Virtual environment: $VENV_DIR"
    else
        warn "Virtual environment no encontrado en $VENV_DIR"
        info "Creando virtual environment..."
        python3 -m venv "$VENV_DIR"
        ok "Virtual environment creado"
    fi
}

# ── Levantar Docker (Postgres + Redis) ──
levantar_docker() {
    titulo "Levantando Docker (PostgreSQL + Redis)"

    cd "$BACKEND_DIR"
    docker compose up -d postgres redis
    ok "Contenedores iniciados"

    # Esperar a que Postgres acepte conexiones
    info "Esperando a que PostgreSQL esté listo..."
    local intentos=0
    local max_intentos=30
    while [ $intentos -lt $max_intentos ]; do
        if docker compose exec -T postgres pg_isready -U cosmic -d cosmicengine &>/dev/null; then
            ok "PostgreSQL listo (${intentos}s)"
            break
        fi
        intentos=$((intentos + 1))
        sleep 1
    done

    if [ $intentos -ge $max_intentos ]; then
        error "PostgreSQL no respondió en ${max_intentos}s"
        exit 1
    fi

    # Verificar Redis
    if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
        ok "Redis listo"
    else
        warn "Redis no respondió al ping, pero puede estar inicializándose"
    fi
}

# ── Ejecutar migraciones ──
ejecutar_migraciones() {
    titulo "Ejecutando migraciones (Alembic)"

    cd "$BACKEND_DIR"
    source "$VENV_DIR/bin/activate"
    alembic upgrade head
    ok "Migraciones aplicadas"
}

# ── Lanzar servidor ──
lanzar_servidor() {
    titulo "Lanzando servidor (uvicorn)"

    cd "$BACKEND_DIR"
    source "$VENV_DIR/bin/activate"

    # Matar proceso anterior si existe
    if [ -f "$PID_FILE" ]; then
        local pid_anterior
        pid_anterior=$(cat "$PID_FILE")
        if kill -0 "$pid_anterior" 2>/dev/null; then
            warn "Deteniendo servidor anterior (PID $pid_anterior)"
            kill "$pid_anterior" 2>/dev/null || true
            sleep 1
        fi
        rm -f "$PID_FILE"
    fi

    # Lanzar uvicorn en background
    uvicorn app.principal:aplicacion \
        --reload \
        --host 0.0.0.0 \
        --port 8000 \
        --log-level info &

    local pid=$!
    echo "$pid" > "$PID_FILE"
    ok "Servidor lanzado (PID $pid)"
    info "URL: http://localhost:8000"
    info "Docs: http://localhost:8000/docs"

    # Esperar un momento y verificar que siga vivo
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
        ok "Servidor corriendo correctamente"
    else
        error "El servidor se detuvo inesperadamente. Revisá los logs."
        rm -f "$PID_FILE"
        exit 1
    fi
}

# ── Health check ──
health_check() {
    titulo "Health Check"

    sleep 1
    local respuesta
    if respuesta=$(curl -s --max-time 5 http://localhost:8000/health 2>/dev/null); then
        echo -e "${VERDE}$respuesta${RESET}" | python3 -m json.tool 2>/dev/null || echo "$respuesta"
        ok "Sistema operativo"
    else
        warn "Health check falló — el servidor puede estar inicializándose"
        info "Probá manualmente: curl http://localhost:8000/health"
    fi
}

# ── Detener todo ──
detener_todo() {
    titulo "Deteniendo servicios"

    # Matar uvicorn
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            ok "Servidor detenido (PID $pid)"
        else
            info "Servidor ya no estaba corriendo"
        fi
        rm -f "$PID_FILE"
    else
        # Buscar por proceso
        local pids
        pids=$(pgrep -f "uvicorn app.principal" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs kill 2>/dev/null || true
            ok "Procesos uvicorn detenidos"
        else
            info "No hay servidor corriendo"
        fi
    fi

    # Docker
    cd "$BACKEND_DIR"
    docker compose down
    ok "Contenedores detenidos"
}

# ── Reiniciar desde cero ──
reiniciar() {
    titulo "Reiniciando desde cero"

    warn "Esto detendrá todo y borrará los volúmenes de Docker"

    # Matar uvicorn
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        kill "$pid" 2>/dev/null || true
        rm -f "$PID_FILE"
        ok "Servidor detenido"
    else
        pgrep -f "uvicorn app.principal" | xargs kill 2>/dev/null || true
    fi

    # Docker down con volúmenes
    cd "$BACKEND_DIR"
    docker compose down -v
    ok "Contenedores y volúmenes eliminados"

    # Volver a levantar
    levantar_docker
    ejecutar_migraciones
    lanzar_servidor
    health_check
}

# ── Main ──
main() {
    banner

    local modo="${1:-levantar}"

    case "$modo" in
        levantar|"")
            verificar_requisitos
            levantar_docker
            ejecutar_migraciones
            lanzar_servidor
            health_check

            echo ""
            echo -e "${BOLD}${VERDE}══════════════════════════════════════${RESET}"
            echo -e "${BOLD}${VERDE}  CosmicEngine listo para usar${RESET}"
            echo -e "${BOLD}${VERDE}══════════════════════════════════════${RESET}"
            echo ""
            info "API:  http://localhost:8000/api/v1/"
            info "Docs: http://localhost:8000/docs"
            info "Para probar: python scripts/probar_api.py"
            info "Para parar:  ./scripts/levantar.sh parar"
            echo ""
            ;;
        reiniciar)
            reiniciar

            echo ""
            ok "Sistema reiniciado completamente"
            echo ""
            ;;
        parar)
            detener_todo

            echo ""
            ok "Todo detenido"
            echo ""
            ;;
        *)
            echo "Uso: $0 [levantar|reiniciar|parar]"
            echo ""
            echo "  levantar   Levanta Docker + migraciones + servidor (default)"
            echo "  reiniciar  Para todo, borra volúmenes y vuelve a levantar"
            echo "  parar      Detiene servidor + Docker"
            exit 1
            ;;
    esac
}

main "$@"
