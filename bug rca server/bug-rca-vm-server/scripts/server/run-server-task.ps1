param(
  [string]$NodePath = "",
  [string]$BindHost = "0.0.0.0",
  [string]$Port = "3210"
)

$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dataDir = Join-Path $appDir "data"
$serverPath = Join-Path $appDir "server.js"
$stdoutLog = Join-Path $dataDir "server-runtime.out.log"
$stderrLog = Join-Path $dataDir "server-runtime.err.log"

if (-not (Test-Path -LiteralPath $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

if (-not $NodePath) {
  $NodePath = (Get-Command node -ErrorAction Stop).Source
}

$defaultCodexPaths = @(
  (Join-Path $env:APPDATA "npm\codex.cmd"),
  (Join-Path $env:USERPROFILE "AppData\Roaming\npm\codex.cmd")
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

foreach ($codexPath in [System.Linq.Enumerable]::Distinct([string[]]$defaultCodexPaths)) {
  $codexDir = Split-Path -Parent $codexPath
  if ($codexDir -and ($env:PATH -notlike "*$codexDir*")) {
    $env:PATH = "$codexDir;$env:PATH"
  }
}

$codexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
if (-not $codexCommand) {
  $codexCommand = Get-Command codex -ErrorAction SilentlyContinue
}
if (-not $codexCommand) {
  $fallbackCodexPath = $defaultCodexPaths | Select-Object -First 1
  if ($fallbackCodexPath) {
    $codexCommand = Get-Item -LiteralPath $fallbackCodexPath
  }
}
if (-not $codexCommand) {
  throw "Codex CLI was not found for this VM user. Install Codex or place codex.cmd under %APPDATA%\npm, then rerun this server task."
}

$env:PORT = $Port
$env:HOST = $BindHost
$env:RCA_SERVER_MODE = "combined"
$env:CODEX_FULL_ACCESS = "true"
$env:REQUIRE_ELEVATED_EXECUTION = "false"
$env:CODEX_BIN = $codexCommand.Source
$memoryBankHelperPath = Join-Path $PSScriptRoot "generate-shared-workspace-memory-bank.js"
if (Test-Path -LiteralPath $memoryBankHelperPath) {
  # STARTUP-FLOW| guid| run shared memory-bank generation out of band so the hosted listener is not blocked on Codex indexing
  Add-Content -LiteralPath $stdoutLog -Value ("[{0}] [memory-bank-startup] Launching shared workspace memory-bank generation in background." -f (Get-Date -Format o))
  $memoryBankCommandLine = '"{0}" "{1}" --codex-bin "{2}" 1>>"{3}" 2>>"{4}"' -f $NodePath, $memoryBankHelperPath, $env:CODEX_BIN, $stdoutLog, $stderrLog
  Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/s", "/c", $memoryBankCommandLine -WorkingDirectory $appDir -WindowStyle Hidden | Out-Null
}

Set-Location $appDir
# FPS-135835| guid| keep node attached to the scheduled task so task stop ends the real listener without fallback taskkill
$nativeCommandLine = '"{0}" "{1}" 1>>"{2}" 2>>"{3}"' -f $NodePath, $serverPath, $stdoutLog, $stderrLog
& cmd.exe /d /s /c $nativeCommandLine
exit $LASTEXITCODE

