# Aleinia V3 - One-Click Deployment (Fixed)
$ServerIP = "72.62.185.104"
$Domain = "aleinia.com"
$RemotePath = "/var/www/aleinia"

Write-Host "Starting Deployment to $ServerIP..." -ForegroundColor Cyan

# 1. Clean previous builds
if (Test-Path "aleinia.tar.gz") { Remove-Item "aleinia.tar.gz" }

# 2. Compress
Write-Host "Compressing files (Skipping node_modules)..." -ForegroundColor Yellow
# Using force to avoid issues, simplified flags
tar --exclude "node_modules" --exclude ".git" --exclude "aleinia.tar.gz" -czf aleinia.tar.gz .

if (-not (Test-Path "aleinia.tar.gz")) {
    Write-Error "Failed to create archive! Make sure 'tar' is installed (Windows 10+ includes it)."
    exit 1
}

# 3. Upload
Write-Host "Uploading archive..." -ForegroundColor Yellow
# Using quotes for safety
scp aleinia.tar.gz "root@${ServerIP}:${RemotePath}/"

# 4. Extract & Install
Write-Host "Installing on Server..." -ForegroundColor Yellow
# Commands joined with semicolon to avoid CRLF issues in Linux
$RemoteCommands = "cd $RemotePath; tar -xzf aleinia.tar.gz; rm aleinia.tar.gz; chmod +x deploy.sh; ./deploy.sh $Domain"

ssh root@$ServerIP $RemoteCommands

Write-Host "Deployment Complete! Visit https://$Domain" -ForegroundColor Green
