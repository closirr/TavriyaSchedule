# Deploy to SSH server (build:main -> /schedule/)
# Usage: .\deploy.ps1

# Load .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Check configuration
if (-not $env:SSH_HOST -or -not $env:SSH_USER -or -not $env:REMOTE_PATH) {
    Write-Host "ERROR: Missing SSH configuration in .env file" -ForegroundColor Red
    Write-Host "Required: SSH_HOST, SSH_USER, REMOTE_PATH" -ForegroundColor Yellow
    exit 1
}

$SSH_PORT = if ($env:SSH_PORT) { $env:SSH_PORT } else { "22" }
$SSH_KEY = if ($env:SSH_KEY_PATH) { "-i `"$env:SSH_KEY_PATH`"" } else { "" }

Write-Host "=== Building for /schedule/ ===" -ForegroundColor Cyan
npm run build:main

if (-not (Test-Path dist)) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "=== Deploying to $env:SSH_HOST ===" -ForegroundColor Cyan

# Create remote directory
ssh -p $SSH_PORT $SSH_KEY $env:SSH_USER@$env:SSH_HOST "mkdir -p $env:REMOTE_PATH"

# Upload files
scp -P $SSH_PORT $SSH_KEY -r dist/* $env:SSH_USER@$env:SSH_HOST`:$env:REMOTE_PATH/

Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "http://$env:SSH_HOST/schedule/" -ForegroundColor Cyan
