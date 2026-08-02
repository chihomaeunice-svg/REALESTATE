#!/bin/bash
set -e

VPS="139.84.239.163"
VPS_USER="root"
APP_DIR="/opt/nyumbayangu"

echo "=== Syncing code to VPS ==="

# Sync backend
echo "[1/3] Syncing backend..."
rsync -avz --delete \
  --exclude 'tmp/' --exclude '*.exe' --exclude 'nyumbayangu-api' \
  -e "ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no" \
  ./backend/ ${VPS_USER}@${VPS}:${APP_DIR}/backend/

# Sync frontend source (not node_modules or dist)
echo "[2/3] Syncing frontend..."
rsync -avz --delete \
  --exclude 'node_modules/' --exclude 'dist/' \
  -e "ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no" \
  ./frontend/ ${VPS_USER}@${VPS}:${APP_DIR}/frontend/

# Run deploy on server
echo "[3/3] Running deploy on server..."
ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  ${VPS_USER}@${VPS} "bash ${APP_DIR}/deploy.sh"

echo ""
echo "Done. Site live at https://nyumbayangu.online"
