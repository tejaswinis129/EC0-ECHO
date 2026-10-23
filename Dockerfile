# ==============================================================================
# ECO-ECHO: Multi-Stage Enterprise Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend Assets (Node.js)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy client dependency declarations
COPY client/package.json ./

# Install frontend dependencies cleanly
RUN npm install --no-audit --prefer-offline

# Copy client source code
COPY client/ ./

# Compile production bundle to /app/client/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Runtime & Static SPA Server
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

WORKDIR /app

# Install essential system dependencies (curl for healthchecks, libgomp1 for SciPy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    DEBUG=false \
    PORT=8000

# Install Python backend dependencies
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r server/requirements.txt

# Copy server code
COPY server/ ./server/

# Copy compiled frontend assets from Stage 1 into the location expected by FastAPI
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create an unprivileged user for security compliance
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/server/app/data && \
    chown -R appuser:appuser /app

USER appuser

# Expose server port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start production server with dynamic port support
CMD ["sh", "-c", "uvicorn server.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
