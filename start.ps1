$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendRoot = Join-Path $ProjectRoot "frontend"

if (-not (Test-Path (Join-Path $ProjectRoot ".env.local"))) {
    Write-Error "Missing .env.local in $ProjectRoot"
}

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Error "uv is not installed or is not on PATH"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or is not on PATH"
}

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$ProjectRoot'; uv run python src/agent.py dev"
)

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$FrontendRoot'; npm run server"
)

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$FrontendRoot'; npm run dev -- --host 127.0.0.1"
)

Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173/"

Write-Host "Harry's Buddy is starting. Browser: http://127.0.0.1:5173/" -ForegroundColor Green
