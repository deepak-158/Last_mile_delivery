#!/bin/bash
# ==============================================================================
# Delivero Backend — Automated AWS EC2 Setup & Deployment Script
# Target OS: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -e

echo "🚀 [1/5] Updating Ubuntu system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

echo "📦 [2/5] Installing Node.js 20 LTS & PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

echo "⚙️ [3/5] Installing Backend Dependencies & Building TypeScript..."
cd "$(dirname "$0")"
npm ci
npx prisma db push
npx tsx prisma/seed.ts
npm run build

echo "🛡️ [4/5] Configuring Firewall for Port 4000 & 80..."
sudo ufw allow 22/tcp || true
sudo ufw allow 4000/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw --force enable || true

echo "🔄 [5/5] Starting PM2 Process Manager & Enabling System Boot Hook..."
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true

echo ""
echo "=============================================================================="
echo "✅ Delivero Backend API is successfully running on port 4000!"
echo "🩺 Health Check: curl http://localhost:4000/health"
echo "📊 PM2 Monitoring: pm2 status"
echo "=============================================================================="
