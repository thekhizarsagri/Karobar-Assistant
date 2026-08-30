$repo = "C:\Users\sharj\OneDrive\Desktop\Karobar\karobar-Assistant"
$venvPath = "C:\Users\sharj\OneDrive\Desktop\Karobar\.venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$frontendDir = Join-Path $repo "frontend"

Write-Host "==> Going to project root"
Set-Location $repo

Write-Host "==> Pulling latest code from Git"
git pull origin main

if (-not (Test-Path $venvPython)) {
    Write-Host "==> Creating virtual environment"
    python -m venv $venvPath
}

Write-Host "==> Installing backend dependencies"
& $venvPython -m pip install -r (Join-Path $repo "backend\requirements.txt")

Write-Host "==> Installing frontend dependencies"
Set-Location $frontendDir
npm install
npm run build

Write-Host "==> Starting backend server"
Set-Location $repo
& $venvPython -m uvicorn backend.main:app --reload
