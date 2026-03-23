#!/bin/bash
# Inicia el bot de Telegram del Oráculo ASTRA
# Uso: ./scripts/iniciar_bot.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

cd "$BACKEND_DIR"

echo "Iniciando bot Telegram — Oráculo ASTRA..."
python -m app.bot_main
