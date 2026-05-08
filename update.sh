#!/bin/bash
# Aleinia V3 Update Script (Quick Update)

echo "🚀 Starting Update Process..."

# 0. Fix Nginx Upload Limit (Critical for 3D)
echo "🔧 Tuning Nginx for large files..."
cat > /etc/nginx/sites-available/aleinia <<EOF
server {
    listen 80;
    server_name aleinia.com www.aleinia.com;
    root /var/www/aleinia;

    # Allow large uploads for 3D models/Videos
    client_max_body_size 100M;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /frontend {
        alias /var/www/aleinia/frontend;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF
nginx -t && systemctl reload nginx

# 1. Check if update file exists
if [ ! -f "/root/aleinia.zip" ]; then
    echo "❌ Error: aleinia.zip not found in /root/. Please upload it first."
    exit 1
fi

# 2. Backup old version (Safety First)
echo "📦 Backing up current version..."
timestamp=$(date +%s)
mv /var/www/aleinia /var/www/aleinia_backup_$timestamp
mkdir -p /var/www/aleinia

# 3. Extract New Version
echo "📂 Extracting new files..."
mv /root/aleinia.zip /var/www/aleinia/
cd /var/www/aleinia
unzip -q aleinia.zip
rm aleinia.zip

# 4. Handle Subfolder Issue (if zip contained a folder)
if [ -d "aleinia" ]; then
    echo "🔄 Adjusting folder structure..."
    mv aleinia/* .
    rmdir aleinia
fi

# 5. Restore Secrets (.env)
echo "🔑 Restoring secrets..."
# Copy .env from backup to new version
if [ -f "/var/www/aleinia_backup_$timestamp/.env" ]; then
    cp /var/www/aleinia_backup_$timestamp/.env .env
else
    echo "⚠️ Warning: Old .env not found!"
fi

# 6. Install Dependencies (just in case new libs were added)
echo "📦 Installing/Updating Dependencies..."
npm install --production

# 7. Restart Application
echo "🔄 Restarting Server..."
pm2 restart all

echo "✅ Update Complete! Previous version saved in /var/www/aleinia_backup_$timestamp"
