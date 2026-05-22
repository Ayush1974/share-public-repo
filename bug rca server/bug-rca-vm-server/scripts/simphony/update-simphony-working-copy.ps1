param(
  [string]$WorkspacePath = "",
  [string]$SvnPath = "",
  [string]$LogRoot = "",
  [switch]$ForceRevertLocalChanges
)

$ErrorActionPreference = "Stop"

$appDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $LogRoot) {
  $LogRoot = Join-Path $appDir "data\shared-workspace-maintenance"
}

if (-not (Test-Path -LiteralPath $LogRoot)) {
  New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
}

$logFile = Join-Path $LogRoot ("simphony-nightly-update-{0}.log" -f (Get-Date -Format "yyyyMMdd"))

function Write-Log {
  param([string]$Message)

  $timestamped = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -LiteralPath $logFile -Value $timestamped -Encoding UTF8
  Write-Host $timestamped
}

function Resolve-SvnExecutable {
  param([string]$PreferredPath)

  if ($PreferredPath) {
    if (-not (Test-Path -LiteralPath $PreferredPath)) {
      throw "Configured svn executable was not found: $PreferredPath"
    }
    return $PreferredPath
  }

  $command = Get-Command svn.exe -ErrorAction SilentlyContinue
  if (-not $command) {
    $command = Get-Command svn -ErrorAction SilentlyContinue
  }
  if (-not $command) {
    throw "svn was not found on PATH."
  }
  return $command.Source
}

function Invoke-LoggedCommand {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  Write-Log ("Running: {0} {1}" -f $FilePath, ($Arguments -join " "))
  $output = & $FilePath @Arguments 2>&1
  foreach ($line in @($output)) {
    if ($null -ne $line -and [string]::IsNullOrWhiteSpace([string]$line) -eq $false) {
      Write-Log ([string]$line)
    }
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE."
  }

  return @($output)
}

if (-not $WorkspacePath) {
  throw "WorkspacePath is required."
}

if (-not (Test-Path -LiteralPath $WorkspacePath)) {
  throw "Workspace path was not found: $WorkspacePath"
}

if (-not (Test-Path -LiteralPath (Join-Path $WorkspacePath ".svn"))) {
  throw "Workspace is not an SVN working copy: $WorkspacePath"
}

$svnExecutable = Resolve-SvnExecutable -PreferredPath $SvnPath
Write-Log "Starting shared Simphony workspace update."
Write-Log "Workspace: $WorkspacePath"
Write-Log "svn: $svnExecutable"

Invoke-LoggedCommand -FilePath $svnExecutable -Arguments @("cleanup", $WorkspacePath) | Out-Null

$statusLines = Invoke-LoggedCommand -FilePath $svnExecutable -Arguments @("status", $WorkspacePath)
$blockingChanges = @($statusLines | Where-Object {
  $line = [string]$_
  $line -and $line.Length -gt 0 -and $line[0] -match "[ACDIMR!~]"
})

if ($blockingChanges.Count -gt 0) {
  Write-Log "Detected local working-copy changes that can block a clean nightly update."
  foreach ($line in $blockingChanges) {
    Write-Log ("Local change: {0}" -f ([string]$line))
  }

  if (-not $ForceRevertLocalChanges) {
    throw "Nightly update aborted because the working copy is dirty. Re-run with -ForceRevertLocalChanges only if this checkout is treated as disposable."
  }

  Write-Log "Force revert is enabled. Reverting local SVN changes before update."
  Invoke-LoggedCommand -FilePath $svnExecutable -Arguments @("revert", "-R", $WorkspacePath) | Out-Null
  Invoke-LoggedCommand -FilePath $svnExecutable -Arguments @("cleanup", $WorkspacePath) | Out-Null
}

$beforeInfo = Invoke-LoggedCommand -FilePath $svnExecutable -Arguments @("info", $WorkspacePath)
$beforeRevision = ($beforeInfo | Where-Object { ([string]$_) -like "Revision:*" } | Select-Object -First 1)
if ($beforeRevision) {
  Write-Log ("Revision before update: {0}" -f $beforeRevision.ToString().Substring("Revision:".Length).Trim())
}

Invoke-LoggedCommand -FilePath $svnExecutable -Arguments @("update", $WorkspacePath) | Out-Null

$afterInfo = Invoke-LoggedCommand -FilePath $svnExecutable -Arguments @("info", $WorkspacePath)
$afterRevision = ($afterInfo | Where-Object { ([string]$_) -like "Revision:*" } | Select-Object -First 1)
if ($afterRevision) {
  Write-Log ("Revision after update: {0}" -f $afterRevision.ToString().Substring("Revision:".Length).Trim())
}

Write-Log "Shared Simphony workspace update completed successfully."
