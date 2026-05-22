param(
  [string]$Target = "gbujira",
  [string]$EnvFile = ".env",
  [int]$OnlyWhenExpiringWithinDays = 1,
  [int]$ExpirationDays = 5,
  [string]$CurrentTokenExpiresAt = "",
  [string]$AuthTokenEnv = "",
  [string]$BasicUser = "",
  [string]$BasicPasswordEnv = "",
  [string]$NodePath = "",
  [string]$LogRoot = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $LogRoot) {
  $LogRoot = Join-Path $appDir "data\jira-pat-rotation"
}

if (-not (Test-Path -LiteralPath $LogRoot)) {
  New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
}

$logFile = Join-Path $LogRoot ("jira-pat-rotation-{0}-{1}.log" -f $Target, (Get-Date -Format "yyyyMMdd"))

function Write-Log {
  param([string]$Message)

  $timestamped = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -LiteralPath $logFile -Value $timestamped -Encoding UTF8
  Write-Host $timestamped
}

function Resolve-NodeExecutable {
  param([string]$PreferredPath)

  if ($PreferredPath) {
    if (-not (Test-Path -LiteralPath $PreferredPath)) {
      throw "Configured node executable was not found: $PreferredPath"
    }
    return $PreferredPath
  }

  $command = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $command) {
    $command = Get-Command node -ErrorAction SilentlyContinue
  }
  if (-not $command) {
    throw "node was not found on PATH."
  }
  return $command.Source
}

$nodeExecutable = Resolve-NodeExecutable -PreferredPath $NodePath
$scriptPath = Join-Path $PSScriptRoot "rotate-jira-pat.js"
if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Missing Jira PAT rotation script: $scriptPath"
}

$arguments = @(
  $scriptPath,
  "--target", $Target,
  "--env-file", $EnvFile,
  "--only-when-expiring-within-days", $OnlyWhenExpiringWithinDays.ToString(),
  "--expiration-days", $ExpirationDays.ToString()
)

if ($CurrentTokenExpiresAt) {
  $arguments += "--current-token-expires-at"
  $arguments += $CurrentTokenExpiresAt
}
if ($AuthTokenEnv) {
  $arguments += "--auth-token-env"
  $arguments += $AuthTokenEnv
}
if ($BasicUser) {
  $arguments += "--basic-user"
  $arguments += $BasicUser
}
if ($BasicPasswordEnv) {
  $arguments += "--basic-password-env"
  $arguments += $BasicPasswordEnv
}
if ($DryRun) {
  $arguments += "--dry-run"
}

Write-Log "Starting Jira PAT rotation check."
Write-Log ("Target: {0}" -f $Target)
Write-Log ("Env file: {0}" -f $EnvFile)
Write-Log ("Rotation window: {0} day(s)" -f $OnlyWhenExpiringWithinDays)
Write-Log ("Requested PAT lifetime: {0} day(s)" -f $ExpirationDays)
Write-Log ("Node: {0}" -f $nodeExecutable)
Write-Log ("Dry run: {0}" -f $DryRun.IsPresent)
Write-Log ("Command: {0} {1}" -f $nodeExecutable, ($arguments -join " "))

$output = & $nodeExecutable @arguments 2>&1
foreach ($line in @($output)) {
  if ($null -ne $line -and [string]::IsNullOrWhiteSpace([string]$line) -eq $false) {
    Write-Log ([string]$line)
  }
}

if ($LASTEXITCODE -ne 0) {
  throw "Jira PAT rotation script failed with exit code $LASTEXITCODE."
}

Write-Log "Jira PAT rotation check completed successfully."
