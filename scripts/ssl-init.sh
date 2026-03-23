#!/usr/bin/env bash
# ============================================================
# Inicialización SSL con Certbot — CosmicEngine
# ============================================================
# Uso:
#   ./scripts/ssl-init.sh tu-dominio.com email@ejemplo.com
# ============================================================

set -euo pipefail

DOMINIO="${1:?Uso: $0 <dominio> <email>}"
EMAIL="${2:?Uso: $0 <dominio> <email>}"

DIR_RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$DIR_RAIZ/docker-compose.prod.yml"
ENV_FILE="$DIR_RAIZ/.env.prod"

ROJO='\033[0;31m'
VERDE='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${VERDE}[OK]${NC} $1"; }
error() { echo -e "${ROJO}[ERROR]${NC} $1" >&2; exit 1; }

# --- Paso 1: Crear directorios ---
info "Creando directorios para certbot..."
mkdir -p "$DIR_RAIZ/certbot/conf"
mkdir -p "$DIR_RAIZ/certbot/www"

# --- Paso 2: Configuración temporal de nginx (solo HTTP) ---
info "Creando configuración temporal de nginx (solo HTTP)..."
cat > "$DIR_RAIZ/nginx/astra.conf.tmp" << 'TMPCONF'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'CosmicEngine — esperando SSL';
        add_header Content-Type text/plain;
    }
}
TMPCONF

# Backup config original
cp "$DIR_RAIZ/nginx/astra.conf" "$DIR_RAIZ/nginx/astra.conf.bak"
cp "$DIR_RAIZ/nginx/astra.conf.tmp" "$DIR_RAIZ/nginx/astra.conf"

# --- Paso 3: Levantar nginx temporal ---
info "Levantando nginx temporal..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d nginx

sleep 3

# --- Paso 4: Obtener certificado ---
info "Solicitando certificado SSL para $DOMINIO..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm certbot \
    certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMINIO" \
    -d "www.$DOMINIO"

# --- Paso 5: Restaurar configuración completa ---
info "Restaurando configuración nginx completa..."
cp "$DIR_RAIZ/nginx/astra.conf.bak" "$DIR_RAIZ/nginx/astra.conf"
rm -f "$DIR_RAIZ/nginx/astra.conf.tmp" "$DIR_RAIZ/nginx/astra.conf.bak"

# Reemplazar placeholder de dominio en nginx config
sed -i.bak "s/\${DOMINIO}/$DOMINIO/g" "$DIR_RAIZ/nginx/astra.conf"
rm -f "$DIR_RAIZ/nginx/astra.conf.bak"

# --- Paso 6: Reiniciar nginx con SSL ---
info "Reiniciando nginx con SSL..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart nginx

sleep 3
ok "SSL configurado correctamente para $DOMINIO"
echo ""
info "Verificar: curl -I https://$DOMINIO"
info "La renovación automática está activa via el servicio certbot."
