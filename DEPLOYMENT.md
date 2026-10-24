# ECO-ECHO: Production Deployment Handbook

This guide details how to build, containerize, and deploy the complete **ECO-ECHO Urban Sustainability Decision Engine** across cloud providers and local container runtimes.

---

## 1. Live Production Deployment on AWS EC2 (Current Production)

ECO-ECHO is deployed in production on an **Amazon EC2** instance in `ap-south-1` (Mumbai) fronted by an automated **Caddy TLS reverse proxy**:

| Service / View | Protocol | Production Endpoint | Verified Status |
| :--- | :---: | :--- | :---: |
| **Secure Web Frontend SPA** | **HTTPS** | **[https://3.110.42.213.sslip.io/](https://3.110.42.213.sslip.io/)** | **`200 OK` (Strict TLS)** |
| **Secure Backend API Base** | **HTTPS** | **[https://3.110.42.213.sslip.io/api](https://3.110.42.213.sslip.io/api)** | **`200 OK`** |
| **System Health Check** | **HTTPS** | **[https://3.110.42.213.sslip.io/api/health](https://3.110.42.213.sslip.io/api/health)** | **`200 OK`** |
| **Settings & DB Diagnostics** | **HTTPS** | **[https://3.110.42.213.sslip.io/api/settings/status](https://3.110.42.213.sslip.io/api/settings/status)** | **`200 OK` (`WAL Mode`)** |
| **Implementation Planner API**| **HTTPS** | **[https://3.110.42.213.sslip.io/api/planner/plans](https://3.110.42.213.sslip.io/api/planner/plans)** | **`200 OK`** |
| **Legacy Direct HTTP URL** | HTTP | [http://3.110.42.213/](http://3.110.42.213/) | `200 OK` |

### Production Architecture on EC2:
- **Server:** AWS EC2 `t3.micro` (`i-04a3958b5664f9576`, IP: `3.110.42.213`, Region: `ap-south-1`).
- **TLS Reverse Proxy:** `caddy:alpine` on host network ports `80` & `443` managing Let's Encrypt certificates automatically for `3.110.42.213.sslip.io`.
- **Backend Service:** Multi-stage production container `eco-echo-backend` on port `8000` executing FastAPI with Uvicorn workers.
- **Persistence:** Host directory `/var/data/eco-echo` bind-mounted to `/app/data` with SQLite in WAL mode (`PRAGMA journal_mode = WAL; busy_timeout = 30000;`).
- **ECR Repository:** `931238251287.dkr.ecr.ap-south-1.amazonaws.com/eco-echo-backend`.

---

## 2. Architecture Overview for Deployment

ECO-ECHO is packaged as a **single-container full-stack application**:
- **Frontend SPA**: React 19 + TypeScript + Vite, compiled into `client/dist`.
- **Backend API**: FastAPI on Python 3.12, serving both `/api/*` endpoints and the static SPA bundle (`/`) with client-side routing fallback.
- **Single Link**: Entire application runs on one port (default `8000`, or dynamic `$PORT` in cloud environments), eliminating CORS issues and multi-domain configuration overhead.
- **Persistence**: Relational SQLite storage (`eco_echo.db`) stored in a persistent volume with optional Amazon Bedrock and S3 connectors.

---

## 2. Option A: Vercel Deployment (Serverless Python + React SPA)

ECO-ECHO is pre-configured for Vercel with [`vercel.json`](vercel.json), root [`requirements.txt`](requirements.txt), and [`api/index.py`](api/index.py).

### How Vercel Runs ECO-ECHO:
- **Frontend Build**: Vercel compiles the React SPA via `cd client && npm install && npm run build` and serves static assets from `client/dist`.
- **Backend API**: All `/api/*` routes are handled serverlessly by `@vercel/python` executing the FastAPI app via `api/index.py`.
- **Database**: SQLite automatically adapts to `/tmp/eco_echo.db` in serverless mode.

### Steps to Deploy via Vercel Web Dashboard:
1. Push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: configure Vercel deployment with serverless API and client build"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
3. Import your GitHub repository: `https://github.com/tejaswinis129/EC0-ECHO`.
4. Vercel automatically detects [`vercel.json`](vercel.json). Verify project settings:
   - **Framework Preset**: `Vite` (or `Other`)
   - **Root Directory**: `./`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
5. *(Optional)* Add any Environment Variables in the Vercel dashboard:
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `false`
6. Click **Deploy**. Vercel will build both the frontend bundle and serverless Python API function, outputting your live production URL (e.g. `https://eco-echo.vercel.app`).

### Steps to Deploy via Vercel CLI:
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

---

## 3. Option B: 1-Click Cloud Deployment (Render Blueprint)

ECO-ECHO includes a native [`render.yaml`](render.yaml) blueprint for fast cloud deployment.

### Steps:
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository (`https://github.com/tejaswinis129/EC0-ECHO`).
4. Render will automatically detect `render.yaml` and configure:
   - **Environment:** Docker (multi-stage build from `Dockerfile`)
   - **Health Check Path:** `/api/health`
   - **Port:** Dynamically managed via `$PORT`
5. Click **Apply**.
6. Once built, your live application URL will be available (e.g. `https://eco-echo.onrender.com`).

---

## 3. Option B: Docker Container Deployment

### Prerequisites:
- [Docker](https://docs.docker.com/get-docker/) installed and running.

### 1-Command Deployment via Docker Compose:
```bash
# Clone the repository
git clone https://github.com/tejaswinis129/EC0-ECHO.git
cd EC0-ECHO

# Build and start in detached mode
docker compose up -d --build
```
*Application is immediately accessible at:* `http://localhost:8000`

### Verify Container Health:
```bash
docker compose ps
curl http://localhost:8000/api/health
```

### Stop Containers:
```bash
docker compose down
```

### Manual Docker CLI Commands:
```bash
# Build Docker image
docker build -t eco-echo:latest .

# Run container with volume persistence
docker run -d \
  --name eco-echo-app \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e PORT=8000 \
  -v eco_echo_data:/app/server/app/data \
  --restart unless-stopped \
  eco-echo:latest
```

---

## 4. Option C: Railway or Fly.io Deployment

### Railway:
1. Connect your GitHub repository in [Railway.app](https://railway.app/).
2. Railway detects `Dockerfile` automatically.
3. Add a persistent volume mounted at `/app/server/app/data` for database persistence.
4. Set `ENVIRONMENT=production`. Railway automatically binds to `$PORT`.

### Fly.io:
```bash
# Launch app
fly launch

# Deploy
fly deploy
```

---

## 5. Option D: AWS Deployment (App Runner or ECS)

### AWS App Runner:
1. Build and push the image to **Amazon ECR**:
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com
   docker tag eco-echo:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/eco-echo:latest
   docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/eco-echo:latest
   ```
2. Create an **App Runner Service**:
   - Source: Container image from ECR
   - Port: `8000`
   - Health check: `/api/health`

---

## 6. Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Set to `production` in live deployments (disables Swagger `/docs` and debug traces). |
| `PORT` | `8000` | Port for the Uvicorn web server. Automatically bound on cloud PaaS. |
| `DEBUG` | `false` | Enable verbose logging and live reloading. |
| `DATABASE_URL` | `sqlite:////app/server/app/data/eco_echo.db` | SQLAlchemy connection string. |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8000` | Comma-separated allowed external origins. |
| `USE_AWS_BEDROCK` | `false` | Enable AWS Bedrock Claude 3 AI Explainer (defaults to deterministic scientific analytics engine when false). |
| `USE_AWS_S3` | `false` | Enable cloud report archiving in S3. |
| `AWS_REGION` | `ap-south-1` | Target AWS region. |
| `AWS_ACCESS_KEY_ID` | `""` | AWS IAM credentials (leave empty if using IAM Role / Instance Profile). |
| `AWS_SECRET_ACCESS_KEY` | `""` | AWS IAM secret. |

---

## 7. Security Hardening Checklist

- [x] **Non-Root User:** Container runs under unprivileged `appuser` (UID 1000).
- [x] **No Baked Secrets:** `.dockerignore` prevents `.env`, credentials, or keys from entering image layers.
- [x] **Defensive HTTP Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`.
- [x] **Request Size Limits:** 10MB ceiling prevents buffer overflow and denial of service.
- [x] **Rate Limiting:** In-memory sliding window rate limiter protects endpoints from scrapers.
- [x] **Automated Healthchecks:** Periodically polls `/api/health` to restart unhealthy containers.

---

## 8. Post-Deployment Verification

After deployment, test the health check and core planning API:

```bash
# 1. System Health Check
curl -s https://<YOUR_DOMAIN>/api/health

# Expected response:
# {"status":"healthy","app":"ECO-ECHO","version":"1.0.0","timestamp":...}

# 2. Implementation Planner Verification
curl -s -X POST https://<YOUR_DOMAIN>/api/implementation/plan \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Improve drainage near homes during heavy rain", "location_or_neighbourhood": "Koramangala 4th Block, Bengaluru"}'
```
