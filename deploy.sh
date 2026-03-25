#!/bin/bash
set -e

SERVER="161.97.128.102"
SERVER_USER="root"
APP_DIR="/opt/reservation"

echo "==> Sunucuya kod gönderiliyor..."
ssh $SERVER_USER@$SERVER "mkdir -p $APP_DIR"

rsync -avz --exclude='.git' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/.env.local' \
  --exclude='backend/src/*/bin' \
  --exclude='backend/src/*/obj' \
  ./ $SERVER_USER@$SERVER:$APP_DIR/

echo "==> .env dosyası kopyalanıyor..."
scp .env.prod $SERVER_USER@$SERVER:$APP_DIR/.env

echo "==> Sunucuda build ve başlatma..."
ssh $SERVER_USER@$SERVER "
  cd $APP_DIR
  docker compose -f docker-compose.prod.yml pull postgres redis
  docker compose -f docker-compose.prod.yml build --no-cache
  docker compose -f docker-compose.prod.yml up -d
  echo '==> Konteynerler:'
  docker compose -f docker-compose.prod.yml ps
"

echo ""
echo "✓ Deploy tamamlandı: http://$SERVER"
