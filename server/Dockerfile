# ==============================================================================
# ECO-ECHO: Dedicated Production FastAPI Backend Dockerfile for AWS
# Suitable for: AWS App Runner, Amazon ECS (Fargate/EC2), or Amazon EC2
# ==============================================================================

FROM python:3.12-slim AS runner

WORKDIR /app

# Install minimal OS runtime dependencies (curl for healthcheck, libgomp1 for SciPy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Optimize Python execution environment
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    DEBUG=false \
    PORT=8000 \
    AWS_REGION=ap-south-1

# Install Python backend dependencies
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r server/requirements.txt

# Copy server code
COPY server/app/ ./server/app/

# Copy compiled frontend SPA assets
COPY client/dist/ ./client/dist/

# Create non-root unprivileged service user for security best practices
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/server/app/data && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Docker healthcheck pinging FastAPI health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Production ASGI server with dynamic port support
CMD ["sh", "-c", "uvicorn server.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
