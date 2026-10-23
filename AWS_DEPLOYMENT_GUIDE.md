# ECO-ECHO — Amazon Web Services (AWS) Deployment Guide

This guide details how to prepare, deploy, and operate the **ECO-ECHO** Urban Sustainability Decision-Intelligence platform on Amazon Web Services (**AWS**) in the `ap-south-1` (Mumbai) region.

---

## 1. Architectural Overview

```
                                [ End Users / Urban Planners ]
                                              │
                                       (HTTPS Port 443)
                                              ▼
                                 ┌─────────────────────────┐
                                 │   Amazon CloudFront     │
                                 │      (Global CDN)       │
                                 └────────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │ Path: /* (Static Assets)                      │ Path: /api/* (REST API)
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │       Amazon S3         │                     │     AWS App Runner      │
         │ (Private Static Bucket) │                     │   or Amazon EC2 t4g     │
         │  Origin Access Control  │                     │    (FastAPI Backend)    │
         └─────────────────────────┘                     └────────────┬────────────┘
                                                                      │ (IAM Role - No Keys)
                                                                      ▼
                                                         ┌─────────────────────────┐
                                                         │   Existing Amazon S3    │
                                                         │ eco-echo-sustainability │
                                                         │       -data-2026        │
                                                         └─────────────────────────┘
```

### Why this Architecture?
1. **Frontend on S3 + CloudFront (OAC)**:
   - The S3 bucket is **100% private** with *Block All Public Access* enabled.
   - CloudFront Origin Access Control (**OAC**) securely signs requests into S3.
   - Global HTTPS with low latency for urban planning teams across India.
   - React SPA routing handled automatically via CloudFront Custom Error Responses (404/403 -> `/index.html` with status 200).
   - **Cost: $0.00 / month** on the AWS Always-Free Tier (1 TB data transfer + 10M requests free).

2. **Backend on AWS App Runner (or Amazon EC2 t4g.small)**:
   - **App Runner** runs the container image directly from Amazon ECR with automatic TLS, zero load-balancer fees, and auto-scaling.
   - **EC2 `t3.micro` / `t4g.small`** qualifies for **750 hours/month FREE** under the AWS 12-Month Free Tier.
   - Seamlessly assumes an **IAM Role** (no AWS keys in source code or `.env`).

3. **Existing Private Data Bucket**:
   - `eco-echo-sustainability-data-2026` in `ap-south-1` is preserved with all existing evidence and datasets intact.

---

## 2. Estimated AWS Costs & Free Tier Analysis

| Service | Architecture Option | Free Tier Allowance | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Amazon S3** (Frontend Static) | Standard | 5 GB Storage, 20k GET requests | **$0.00** (< $0.02) |
| **Amazon CloudFront** | CDN Distribution | **1 TB Data Transfer Out, 10,000,000 requests/mo FREE** | **$0.00** |
| **Backend Compute (Option A: App Runner)** | 1 vCPU / 2 GB RAM | Auto-pauses or scales down | **~$5.00 – $15.00 / mo** (no ALB required) |
| **Backend Compute (Option B: EC2 t3/t4g)** | `t3.micro` / `t4g.small` | **750 hours/month FREE** (12-month Free Tier) + 30 GB EBS | **$0.00 / mo** |
| **Existing S3 Bucket** (`eco-echo...`) | Evidence & Reports | 5 GB Free Tier; $0.023/GB-mo | **~$0.02 / mo** |
| **Amazon Bedrock** (Optional) | Claude 3 Sonnet | Pay-per-token (Only if `USE_AWS_BEDROCK=true`) | **$0.00** (Default engine is deterministic & local) |

> **Cost Optimization Note:** Unlike Amazon ECS with an Application Load Balancer (which incurs a mandatory ~$16–$22/month fixed fee just for the idle balancer), **App Runner** and **EC2** require **no separate load balancer**.

---

## 3. Security & IAM Least-Privilege Policies

### A. Backend Execution IAM Policy
Attach this policy to the backend's IAM Role (`eco-echo-backend-role` for App Runner or EC2 instance profile). It grants access **only** to the designated S3 bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcoEchoS3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::eco-echo-sustainability-data-2026"
    },
    {
      "Sid": "EcoEchoS3ObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload"
      ],
      "Resource": "arn:aws:s3:::eco-echo-sustainability-data-2026/*"
    },
    {
      "Sid": "EcoEchoCloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-south-1:*:log-group:/aws/apprunner/eco-echo-backend*"
    }
  ]
}
```

*(Optional: If Bedrock generative narrative is enabled in the future, add `bedrock:InvokeModel` for `arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`.)*

### B. Frontend S3 Bucket Policy (CloudFront OAC)
For the new frontend bucket (e.g. `eco-echo-web-frontend`), keep **Block All Public Access ON** and attach:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<FRONTEND_BUCKET_NAME>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
        }
      }
    }
  ]
}
```

---

## 4. Step-by-Step Deployment Checklist

### Phase 1: Backend Deployment (AWS App Runner)
1. **Create Amazon ECR Repository**:
   ```bash
   aws ecr create-repository --repository-name eco-echo-backend --region ap-south-1
   ```
2. **Build and Push the Backend Docker Image**:
   ```bash
   # Authenticate Docker to ECR
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

   # Build using the dedicated backend Dockerfile
   docker build -t eco-echo-backend -f server/Dockerfile .

   # Tag and push
   docker tag eco-echo-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/eco-echo-backend:latest
   docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/eco-echo-backend:latest
   ```
3. **Launch AWS App Runner Service**:
   - Source: ECR (`<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/eco-echo-backend:latest`).
   - Port: `8000`.
   - Health check path: `/api/health`.
   - Environment Variables:
     - `ENVIRONMENT=production`
     - `DEBUG=false`
     - `PORT=8000`
     - `AWS_REGION=ap-south-1`
     - `AWS_S3_BUCKET=eco-echo-sustainability-data-2026`
     - `USE_AWS_S3=true`
     - `USE_AWS_BEDROCK=false`
     - `CORS_ORIGINS=https://<your-cloudfront-domain>.cloudfront.net`
   - Instance Role: Attach `eco-echo-backend-role`.
   - Note down the generated App Runner Service URL (e.g., `https://xxxxxx.ap-south-1.awsapprunner.com`).

---

### Phase 2: Frontend Deployment (S3 + CloudFront)
1. **Create Private S3 Bucket for Frontend**:
   ```bash
   aws s3api create-bucket \
       --bucket eco-echo-web-frontend \
       --region ap-south-1 \
       --create-bucket-configuration LocationConstraint=ap-south-1

   # Ensure public access is completely blocked
   aws s3api put-public-access-block \
       --bucket eco-echo-web-frontend \
       --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
   ```
2. **Build the Production Frontend SPA**:
   ```bash
   cd client
   # Set API URL pointing to your backend (or /api if unified under CloudFront)
   export VITE_API_URL=https://xxxxxx.ap-south-1.awsapprunner.com
   npm run build
   ```
3. **Upload Static Files to S3**:
   ```bash
   # Upload hashed assets with 1-year cache headers
   aws s3 sync client/dist s3://eco-echo-web-frontend/ \
       --delete \
       --cache-control "public, max-age=31536000, immutable" \
       --exclude "index.html"

   # Upload index.html with no-cache header so updates are instantaneous
   aws s3 cp client/dist/index.html s3://eco-echo-web-frontend/index.html \
       --cache-control "no-cache, no-store, must-revalidate"
   ```
4. **Create CloudFront Distribution with Origin Access Control (OAC)**:
   - Origin: `eco-echo-web-frontend.s3.ap-south-1.amazonaws.com`
   - Origin Access: Origin Access Control (OAC).
   - Default Root Object: `index.html`.
   - Custom Error Response:
     - HTTP Error Code: `403` -> Response Page: `/index.html`, HTTP Response Code: `200`.
     - HTTP Error Code: `404` -> Response Page: `/index.html`, HTTP Response Code: `200`.

---

## 5. Health Check & Verification Commands

Verify both services after deployment:

```bash
# 1. Verify Backend Health
curl -f https://<YOUR_APPRUNNER_DOMAIN>/api/health
# Expected Output: {"status":"healthy","service":"ECO-ECHO","version":"1.0.0"}

# 2. Verify S3 Integration Diagnostic
curl -f https://<YOUR_APPRUNNER_DOMAIN>/api/s3/health
# Expected Output: {"configured":true,"connected":true,"bucket":"eco-echo-sustainability-data-2026","region":"ap-south-1",...}

# 3. Verify Frontend Static Assets
curl -I https://<YOUR_CLOUDFRONT_DOMAIN>/
# Expected Output: HTTP/2 200, Content-Type: text/html
```
