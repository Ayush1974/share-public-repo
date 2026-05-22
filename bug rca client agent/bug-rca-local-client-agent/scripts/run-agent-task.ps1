$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $appDir "data"
$serverPath = Join-Path $appDir "server.js"
$logPath = Join-Path $dataDir "agent-startup.log"

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

$nodeCommand = Get-Command node -ErrorAction Stop
$codexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
if (-not $codexCommand) {
  $codexCommand = Get-Command codex -ErrorAction SilentlyContinue
}

$env:PORT = if ($env:PORT) { $env:PORT } else { "3210" }
$env:HOST = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$env:RCA_SERVER_MODE = if ($env:RCA_SERVER_MODE) { $env:RCA_SERVER_MODE } else { "agent" }
$env:CODEX_FULL_ACCESS = if ($env:CODEX_FULL_ACCESS) { $env:CODEX_FULL_ACCESS } else { "true" }
$env:REQUIRE_ELEVATED_EXECUTION = if ($env:REQUIRE_ELEVATED_EXECUTION) { $env:REQUIRE_ELEVATED_EXECUTION } else { "true" }

if ($codexCommand) {
  $env:CODEX_BIN = $codexCommand.Source
}

Push-Location $appDir
try {
  & $nodeCommand.Source $serverPath *>> $logPath
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
