#!/bin/bash

# Aleinia V3 Deployment Script for Ubuntu (Hostinger)
DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Please provide a domain name."
    echo "Usage: ./deploy.sh yourdomain.com"
    exit 1
fi

echo "🚀 Starting Deployment for $DOMAIN..."

# 1. Update System
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v22 LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git certbot python3-certbot-nginx zip unzip
sudo npm install -g pm2

# 3. Setup App Directory
# If we are running this script FROM inside the aleinia folder, we are good.
# If files are scattered, we organize them.

echo "📂 Current Directory: $(pwd)"

# 4. Install Dependencies & Build Frontend
echo "📦 Installing Dependencies..."
if [ -f "package.json" ]; then
    npm ci --only=production
else
    echo "❌ Error: package.json not found in $(pwd)!"
    exit 1
fi

echo "🏗️ Building Frontend..."
if [ -d "frontend" ]; then
    cd frontend
    npm ci
    npm run build
    cd ..
else
    echo "⚠️ Frontend directory not found, skipping build"
fi

# 5. Setup Environment
if [ ! -f ".env" ]; then
    echo "⚠️ .env not found, creating placeholder..."
    if [ -f ".env.production" ]; then
        cp .env.production .env
    else
        echo "PORT=3000" > .env
    fi
    echo "📝 PLEASE EDIT .env FILE LATER"
fi

# 6. Configure PM2
echo "🚀 Starting App..."
pm2 delete all 2>/dev/null
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -n 1 | sudo bash

# 7. Configure Nginx
echo "⚙️ Configuring Nginx..."
# Create Nginx Config Content Dynamically to ensure paths are correct
cat > /etc/nginx/sites-available/aleinia <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $(pwd);
    client_max_body_size 200M;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /frontend {
        alias $(pwd)/frontend;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF

# Link Config
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/aleinia
ln -s /etc/nginx/sites-available/aleinia /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 8. SSL
echo "🔒 SSL Setup..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo "✅ SUCCESS! Website should be live."
