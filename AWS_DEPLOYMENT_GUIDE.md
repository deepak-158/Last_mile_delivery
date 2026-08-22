# Delivero Last-Mile Logistics — AWS Cloud Deployment Guide

This guide covers step-by-step instructions for deploying the full-stack **Delivero Logistics Platform** on Amazon Web Services (AWS).

---

## 🏗️ Deployment Architectures on AWS

Choose the architecture that best matches your budget and operational preference:

```mermaid
graph LR
    subgraph Architecture Option 1 [AWS App Runner + RDS - Recommended]
        DNS1[Route 53] --> CF1[CloudFront CDN]
        CF1 --> Frontend1[S3 / App Runner]
        Frontend1 --> Backend1[AWS App Runner (Containerized API)]
        Backend1 --> RDS1[(AWS RDS PostgreSQL)]
    end

    subgraph Architecture Option 2 [AWS EC2 Single-VM - Cost-Effective]
        DNS2[Route 53] --> EC2[EC2 Instance (Docker Compose + Nginx)]
        EC2 --> ContainerFE[Frontend Container]
        EC2 --> ContainerBE[Backend Container]
        EC2 --> ContainerDB[(PostgreSQL Container / RDS)]
    end
```

---

## 🌟 Option 1: AWS App Runner + AWS RDS PostgreSQL (Recommended)
*Best for production reliability, zero server management, and automatic HTTPS / SSL.*

### Step 1: Provision AWS RDS PostgreSQL Database
1. Go to **AWS Management Console** $\rightarrow$ **Amazon RDS** $\rightarrow$ **Create database**.
2. Select **PostgreSQL 16**.
3. Choose **Free Tier** (or **Standard db.t4g.micro / db.t4g.small**).
4. Settings:
   - **DB instance identifier**: `delivero-production-db`
   - **Master username**: `delivero_admin`
   - **Master password**: `<your_secure_password>`
5. Under **Connectivity**:
   - Enable **Public access: Yes** (or configure VPC Security Group to allow inbound port `5432` from your App Runner / EC2 security group).
6. Click **Create database**. Copy the **Endpoint** (e.g. `delivero-production-db.c123456.us-east-1.rds.amazonaws.com`).

---

### Step 2: Build & Push Docker Images to Amazon ECR
Create two repositories in **Amazon Elastic Container Registry (ECR)**: `delivero-backend` and `delivero-frontend`.

```bash
# 1. Authenticate Docker with AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 2. Build and Tag Backend Container
docker build -t delivero-backend ./backend
docker tag delivero-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/delivero-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/delivero-backend:latest

# 3. Build and Tag Frontend Container
docker build -t delivero-frontend ./frontend
docker tag delivero-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/delivero-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/delivero-frontend:latest
```

---

### Step 3: Deploy Backend on AWS App Runner
1. Open **AWS App Runner** $\rightarrow$ **Create service**.
2. **Source**: Container registry $\rightarrow$ Amazon ECR $\rightarrow$ Select `delivero-backend:latest`.
3. **Deployment settings**: Automatic or Manual.
4. **Configure service**:
   - **Port**: `4000`
   - **Environment Variables**:
     ```env
     NODE_ENV=production
     PORT=4000
     DATABASE_URL=postgresql://delivero_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/delivero_db?schema=public
     JWT_SECRET=your_production_jwt_secret_key_64_characters_min
     JWT_EXPIRES_IN=7d
     CORS_ORIGIN=*
     ```
5. Click **Create & Deploy**. App Runner will provide a secure HTTPS endpoint (e.g. `https://xyz123.us-east-1.awsapprunner.com`).

---

### Step 4: Run Initial Database Migrations & Seeds on RDS
From your local terminal, run Prisma against the RDS PostgreSQL endpoint:

```bash
cd backend
# Temporarily set your DATABASE_URL in .env to the RDS connection string
npx prisma db push --schema=prisma/schema.postgresql.prisma
npx tsx prisma/seed.ts
```

---

### Step 5: Deploy Frontend on AWS Amplify / S3 + CloudFront
1. Open **AWS Amplify Console** $\rightarrow$ **Host web app**.
2. Connect your GitHub repository: `https://github.com/deepak-158/Last_mile_delivery.git`.
3. Select `frontend` as app root directory.
4. Set Environment Variables:
   ```env
   VITE_API_URL=https://xyz123.us-east-1.awsapprunner.com/api/v1
   ```
5. Click **Save and Deploy**. Amplify will automatically build, deploy, and assign a free global SSL CloudFront domain.

---

## 💻 Option 2: Single-Instance Deployment (AWS EC2 + Docker Compose)
*Most cost-effective ($5–$15/month for entire stack).*

### 1. Launch an AWS EC2 Instance
- **AMI**: Ubuntu 24.04 LTS (x86_64 or ARM64)
- **Instance Type**: `t3.small` or `t4g.small` (2 vCPU, 2 GB RAM)
- **Security Group Inbound Rules**:
  - `SSH` (Port 22) $\rightarrow$ Your IP
  - `HTTP` (Port 80) $\rightarrow$ `0.0.0.0/0`
  - `HTTPS` (Port 443) $\rightarrow$ `0.0.0.0/0`

### 2. Connect to EC2 & Run Setup Script
SSH into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Run the automated one-command installation:
```bash
# Update and install Docker + Docker Compose
sudo apt update && sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu

# Clone Repository
git clone https://github.com/deepak-158/Last_mile_delivery.git
cd Last_mile_delivery

# Start full production stack (Postgres + Backend API + Frontend Nginx)
docker compose up -d --build
```

### 3. Initialize Database & Demo Seed Data
```bash
# Execute Prisma migration inside the running backend container
docker compose exec backend npx prisma db push --schema=prisma/schema.postgresql.prisma
docker compose exec backend npx tsx prisma/seed.ts
```

### 4. Enable Free SSL via Certbot (Optional Domain Setup)
If pointing a custom domain (e.g. `delivero.yourdomain.com`):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d delivero.yourdomain.com
```

---

## 🔐 Production Environment Variables Checklist

| Variable | Recommended Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production caching and disables stack traces |
| `PORT` | `4000` | API port |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | AWS RDS PostgreSQL connection string |
| `JWT_SECRET` | High-entropy 64-char random string | Cryptographic signature secret for auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Token session validity |
| `CORS_ORIGIN` | `https://your-frontend-domain.com` | Allowed CORS origins |

---

## 🩺 Verifying Health & Operational Readiness
Once deployed on AWS, verify:
* **API Health Check**: `GET https://<API_ENDPOINT>/health` $\rightarrow$ `{"status":"ok","service":"lastmile-delivery-backend"}`
* **Web App Access**: `https://<FRONTEND_ENDPOINT>` $\rightarrow$ Delivero Login & Dashboard
* **DB Connection**: Login with `admin@delivero.com` / `admin123` to test real database queries.
