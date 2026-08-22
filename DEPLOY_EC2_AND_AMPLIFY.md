# Step-by-Step Guide: Deploy Backend on AWS EC2 & Frontend on AWS Amplify

This guide details the complete process to deploy the **Backend API on an AWS EC2 instance** and host the **Frontend SPA on AWS Amplify**.

```mermaid
graph LR
    User[Client Browser] --> Amplify[AWS Amplify (Frontend CDN)]
    Amplify -->|API Calls (VITE_API_URL)| EC2[AWS EC2 Instance (Port 4000)]
    EC2 --> Backend[Express API + PM2 Cluster]
    Backend --> DB[(Database - Prisma SQLite/PostgreSQL)]
```

---

## Part 1: Deploy Backend API on AWS EC2

### Step 1.1: Launch an AWS EC2 Instance
1. Log in to the **AWS Management Console** $\rightarrow$ Navigate to **EC2** $\rightarrow$ Click **Launch Instance**.
2. **Name**: `delivero-backend-api`
3. **Application and OS Images**: **Ubuntu Server 24.04 LTS** (64-bit x86 or ARM).
4. **Instance Type**: `t3.micro` (Free Tier eligible) or `t3.small` / `t4g.small`.
5. **Key pair (login)**: Select an existing key pair or create a new one (e.g. `delivero-key.pem`).
6. **Network Settings (Security Group Inbound Rules)**:
   - ✅ **SSH** (Port 22) $\rightarrow$ `My IP`
   - ✅ **Custom TCP** (Port 4000) $\rightarrow$ `0.0.0.0/0` *(Backend API port)*
   - ✅ **HTTP** (Port 80) $\rightarrow$ `0.0.0.0/0` *(Optional, for reverse proxy)*
7. Click **Launch Instance**. Note the **Public IPv4 address** (e.g. `54.210.120.45`).

---

### Step 1.2: Connect to EC2 & Run the Automated Setup Script
Open PowerShell or your terminal on your computer:

```bash
# 1. Connect via SSH
ssh -i "path/to/delivero-key.pem" ubuntu@<EC2_PUBLIC_IP>

# 2. Clone your GitHub repository
git clone https://github.com/deepak-158/Last_mile_delivery.git
cd Last_mile_delivery/backend

# 3. Create production .env file
cat << 'EOF' > .env
PORT=4000
NODE_ENV=production
DATABASE_URL="file:./dev.db"
JWT_SECRET="delivero_production_jwt_secret_key_889211029384756"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
EOF

# 4. Make setup script executable and run it
chmod +x ec2-setup.sh
./ec2-setup.sh
```

---

### Step 1.3: Verify Backend is Live on EC2
From your terminal or browser, run:
```bash
curl http://<EC2_PUBLIC_IP>:4000/health
```
**Expected Output**:
```json
{"status":"ok","timestamp":"2026-08-22T17:15:00.000Z","service":"lastmile-delivery-backend","version":"1.0.0"}
```

> 💡 **Useful PM2 Management Commands on EC2**:
> - `pm2 status` $\rightarrow$ View process health and CPU/memory usage
> - `pm2 logs delivero-backend-api` $\rightarrow$ View real-time API logs
> - `pm2 restart delivero-backend-api` $\rightarrow$ Restart the API

---

## Part 2: Deploy Frontend on AWS Amplify

### Step 2.1: Connect GitHub Repository to AWS Amplify
1. In the **AWS Management Console**, search for **AWS Amplify** $\rightarrow$ Click **Get Started / Host web app**.
2. Select **GitHub** as the source repository and authorize AWS Amplify.
3. Select:
   - **Repository**: `Last_mile_delivery`
   - **Branch**: `main`
4. Check **Connecting a monorepo?** $\rightarrow$ Set the root folder to: `frontend` (or leave default, our root `amplify.yml` will automatically build the `frontend` folder).

---

### Step 2.2: Configure Build Settings & Environment Variables
1. Under **Environment variables**, click **Add variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: `http://<YOUR_EC2_PUBLIC_IP>:4000/api/v1` *(replace with your actual EC2 public IP)*
2. Under **Build settings**, Amplify will automatically detect our `amplify.yml`:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/dist
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```
3. Click **Save and Deploy**.

---

### Step 2.3: Configure SPA Rewrites in Amplify (Important for React Router)
To ensure routes like `/customer/orders` or `/admin/dashboard` reload properly:
1. In the Amplify App Sidebar, go to **Hosting** $\rightarrow$ **Rewrites and redirects**.
2. Click **Add rule** (or edit existing):
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
3. Click **Save**.

---

## Part 3: End-to-End Verification

1. Open your **AWS Amplify URL** (e.g. `https://main.d12345678.amplifyapp.com`).
2. Log in using any demo account:
   - **Admin**: `admin@delivero.com` / `admin123`
   - **Courier**: `raj@delivero.com` / `agent123`
   - **Customer**: `rohan@gmail.com` / `customer123`
3. Verify:
   - Live parcel booking & 3D visualizer preview.
   - Dynamic Leaflet vector routing.
   - A4 GST Tax Invoice printing.
