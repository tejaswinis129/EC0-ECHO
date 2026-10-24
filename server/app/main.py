import time
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .api.data_routes import router as data_router
from .api.risk_routes import router as risk_router
from .api.intervention_routes import router as intervention_router
from .api.optimisation_routes import router as optimisation_router
from .api.scenario_routes import router as scenario_router
from .api.consequence_routes import router as consequence_router
from .api.ai_routes import router as ai_router
from .api.report_routes import router as report_router
from .api.settings_routes import router as settings_router
from .api.s3_routes import router as s3_router
from .api.implementation_routes import router as implementation_router
from .api.evidence_routes import router as evidence_router
from .api.diagram_routes import router as diagram_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ECO-ECHO: AI-Driven Urban Sustainability Decision Engine",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# 1. CORS Middleware
cors_origins = list(settings.CORS_ORIGINS)
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if not allow_all else ["*"],
    allow_origin_regex=r"^https://.*(\.sslip\.io|\.nip\.io|\.cloudfront\.net|\.onrender\.com|\.vercel\.app)$" if not allow_all else None,
    allow_credentials=not allow_all,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 2. Security Headers & Request Sizing Middleware
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # Enforce request size limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.MAX_UPLOAD_SIZE_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": f"Payload exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB"}
        )

    response = await call_next(request)
    
    # Inject defensive security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
    return response

# 3. Simple In-Memory Rate Limiting Tracker
RATE_LIMIT_BUCKET = {}
MAX_REQUESTS_PER_MINUTE = 120

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_min = int(time.time() // 60)
    key = f"{client_ip}:{current_min}"
    
    RATE_LIMIT_BUCKET[key] = RATE_LIMIT_BUCKET.get(key, 0) + 1
    if RATE_LIMIT_BUCKET[key] > MAX_REQUESTS_PER_MINUTE:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down."}
        )
        
    # Clean up older keys
    if len(RATE_LIMIT_BUCKET) > 1000:
        for k in list(RATE_LIMIT_BUCKET.keys()):
            if int(k.split(":")[-1]) < current_min - 2:
                del RATE_LIMIT_BUCKET[k]

    return await call_next(request)

# 4. Safe Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. Please contact system support."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )

# 5. Health Check Endpoints
@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": time.time()
    }

# 6. Mount Module Routers
app.include_router(data_router, prefix="/api")
app.include_router(risk_router, prefix="/api")
app.include_router(intervention_router, prefix="/api")
app.include_router(optimisation_router, prefix="/api")
app.include_router(scenario_router, prefix="/api")
app.include_router(consequence_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(report_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(s3_router, prefix="/api")
app.include_router(implementation_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(diagram_router, prefix="/api")

# 7. Single-Link Full-Stack Delivery: Serve Frontend SPA from FastAPI
client_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "client", "dist"))
if os.path.isdir(client_dist):
    assets_dir = os.path.join(client_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if (
            full_path.startswith("api/")
            or full_path == "api"
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path == "openapi.json"
        ):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(client_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(client_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("server.app.main:app", host="0.0.0.0", port=port, reload=settings.DEBUG)
