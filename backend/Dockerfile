# ============================================================
# Dockerfile — Backend CosmicEngine (FastAPI + pyswisseph)
# ============================================================

# --- Etapa 1: Build ---
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir --prefix=/install .

# --- Etapa 2: Producción ---
FROM python:3.11-slim

WORKDIR /app

# Dependencias de runtime: ffmpeg (podcasts TTS), curl (healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar dependencias Python instaladas
COPY --from=builder /install /usr/local

# Copiar código de la app
COPY . .

# Copiar archivos de efemérides desde kerykeion (fallback si datos_efemerides está vacío)
RUN python -c "import kerykeion; import os; print(os.path.dirname(kerykeion.__file__))" > /tmp/kerykeion_path.txt && \
    KERYKEION_PATH=$(cat /tmp/kerykeion_path.txt) && \
    if [ -d "$KERYKEION_PATH/sweph" ] && [ -z "$(ls -A /app/datos_efemerides 2>/dev/null)" ]; then \
        mkdir -p /app/datos_efemerides && \
        cp -r "$KERYKEION_PATH/sweph/"* /app/datos_efemerides/ ; \
    fi && \
    rm -f /tmp/kerykeion_path.txt

# Crear directorio de assets
RUN mkdir -p /app/assets

# Usuario no-root
RUN groupadd --system cosmic && \
    useradd --system --gid cosmic cosmic && \
    chown -R cosmic:cosmic /app

USER cosmic

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.principal:aplicacion", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
