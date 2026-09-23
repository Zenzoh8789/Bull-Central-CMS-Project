# Run after the one-time setup in README.md. Uses the root .env.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
  if (-not (Test-Path -LiteralPath '.env')) { throw 'Copy .env.example to .env and configure DATABASE_URL. See README.md.' }
  foreach ($appPort in @(3000, 5173, 5174)) {
    $client = New-Object System.Net.Sockets.TcpClient
    $busy = $false
    try { $client.Connect('127.0.0.1', $appPort); $busy = $true } catch {} finally { $client.Dispose() }
    if ($busy) { throw "Port $appPort is already in use. Stop the previous development server before restarting." }
  }
  npm.cmd run dev
  if ($LASTEXITCODE -ne 0) { throw 'Startup failed. Read the API/database error above.' }
} finally { Pop-Location }
