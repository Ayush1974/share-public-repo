param(
  [string]$TaskName = "SimphonyBugRcaAgent",
  [int]$Port = 3210,
  [string]$HostedUiBaseUrl = "",
  [switch]$OpenUi
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param(
    [string]$Message
  )

  Write-Host ""
  Write-Host $Message -ForegroundColor Cyan
}

function Test-LocalAgentHealth {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Normalize-BaseUrl {
  param(
    [string]$Value
  )

  $text = ""
  if (-not [string]::IsNullOrWhiteSpace($Value)) {
    $text = $Value.Trim()
  }
  if (-not $text) {
    return ""
  }

  if ($text -notmatch '^[a-z][a-z0-9+.-]*://') {
    $text = "http://$text"
  }

  $uri = [Uri]$text
  $builder = [System.UriBuilder]::new($uri)
  $builder.Path = ""
  $builder.Query = ""
  $builder.Fragment = ""
  return $builder.Uri.AbsoluteUri.TrimEnd("/")
}

$appDir = Split-Path -Parent $PSCommandPath
$installScript = Join-Path $appDir "install-local-agent.ps1"
$startScript = Join-Path $appDir "start-local-agent.ps1"
$stopScript = Join-Path $appDir "stop-local-agent.ps1"
$setHostedUiScript = Join-Path $appDir "set-hosted-ui-url.ps1"
$uiConfigPath = Join-Path $appDir "ui-host-config.json"

foreach ($requiredFile in @($installScript, $startScript, $stopScript, $setHostedUiScript)) {
  if (-not (Test-Path -LiteralPath $requiredFile)) {
    throw "Missing required file: $requiredFile"
  }
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw "Node.js was not found on PATH. Install Node.js 18+ first, then run this script again."
}

$codexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
if (-not $codexCommand) {
  $codexCommand = Get-Command codex -ErrorAction SilentlyContinue
}
if (-not $codexCommand) {
  throw "Codex CLI was not found on PATH. Install Codex CLI and complete 'codex login' first, then run this script again."
}

$configuredBaseUrl = ""
if (Test-Path -LiteralPath $uiConfigPath) {
  try {
    $configuredBaseUrl = Normalize-BaseUrl -Value ((Get-Content -LiteralPath $uiConfigPath -Raw | ConvertFrom-Json).uiBaseUrl)
  } catch {
    $configuredBaseUrl = ""
  }
}

$resolvedHostedUiBaseUrl = Normalize-BaseUrl -Value $HostedUiBaseUrl
if (-not $resolvedHostedUiBaseUrl) {
  $resolvedHostedUiBaseUrl = $configuredBaseUrl
}

if (-not $resolvedHostedUiBaseUrl) {
  throw "No hosted UI base URL is configured. Run .\set-hosted-ui-url.ps1 -HostedUiBaseUrl http://your-vm-host:3210 first, or pass -HostedUiBaseUrl to this setup script."
}

& $setHostedUiScript -HostedUiBaseUrl $resolvedHostedUiBaseUrl | Out-Null
Write-Step "Using hosted UI base URL: $resolvedHostedUiBaseUrl"

Write-Step "Installing the persistent local Bug RCA agent on port $Port..."
& $installScript -TaskName $TaskName -Port $Port -StartNow

$healthUrl = "http://127.0.0.1:$Port/api/health"
$deadline = [DateTime]::UtcNow.AddSeconds(20)
while ([DateTime]::UtcNow -lt $deadline) {
  if (Test-LocalAgentHealth -Url $healthUrl) {
    break
  }
  Start-Sleep -Seconds 1
}

if (-not (Test-LocalAgentHealth -Url $healthUrl)) {
  throw "The setup script finished, but the local agent is still not reachable at $healthUrl. Check the scheduled task installation and local machine policy."
}

Write-Step "Setup completed."
Write-Host ("Hosted UI: {0}/home" -f $resolvedHostedUiBaseUrl) -ForegroundColor Green
Write-Host ("Local agent health: {0}" -f $healthUrl) -ForegroundColor Green

Write-Host ""
Write-Host "Later commands:" -ForegroundColor Yellow
Write-Host ("  Change VM: powershell -ExecutionPolicy Bypass -File .\set-hosted-ui-url.ps1 -HostedUiBaseUrl http://your-vm-host:3210") -ForegroundColor Yellow
Write-Host ("  Start: powershell -ExecutionPolicy Bypass -File .\start-local-agent.ps1") -ForegroundColor Yellow
Write-Host ("  Stop : powershell -ExecutionPolicy Bypass -File .\stop-local-agent.ps1") -ForegroundColor Yellow

if ($OpenUi) {
  Write-Step "Opening the hosted UI..."
  Start-Process "$resolvedHostedUiBaseUrl/home"
}
