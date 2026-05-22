param(
  [string]$TaskName = "GbujiraPatRotation",
  [string]$Target = "gbujira",
  [string]$EnvFile = ".env",
  [string]$StartTime = "01:30",
  [int]$OnlyWhenExpiringWithinDays = 1,
  [int]$ExpirationDays = 5,
  [string]$CurrentTokenExpiresAt = "",
  [string]$AuthTokenEnv = "",
  [string]$BasicUser = "",
  [string]$BasicPasswordEnv = "",
  [string]$NodePath = "",
  [switch]$StartNow
)

$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
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

$resolvedNodePath = Resolve-NodeExecutable -PreferredPath $NodePath

if (-not (Test-IsAdministrator)) {
  $argumentList = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    ('"{0}"' -f $PSCommandPath),
    "-TaskName",
    ('"{0}"' -f $TaskName),
    "-Target",
    ('"{0}"' -f $Target),
    "-EnvFile",
    ('"{0}"' -f $EnvFile),
    "-StartTime",
    ('"{0}"' -f $StartTime),
    "-OnlyWhenExpiringWithinDays",
    ('"{0}"' -f $OnlyWhenExpiringWithinDays),
    "-ExpirationDays",
    ('"{0}"' -f $ExpirationDays),
    "-NodePath",
    ('"{0}"' -f $resolvedNodePath)
  )
  if ($CurrentTokenExpiresAt) {
    $argumentList += "-CurrentTokenExpiresAt"
    $argumentList += ('"{0}"' -f $CurrentTokenExpiresAt)
  }
  if ($AuthTokenEnv) {
    $argumentList += "-AuthTokenEnv"
    $argumentList += ('"{0}"' -f $AuthTokenEnv)
  }
  if ($BasicUser) {
    $argumentList += "-BasicUser"
    $argumentList += ('"{0}"' -f $BasicUser)
  }
  if ($BasicPasswordEnv) {
    $argumentList += "-BasicPasswordEnv"
    $argumentList += ('"{0}"' -f $BasicPasswordEnv)
  }
  if ($StartNow) {
    $argumentList += "-StartNow"
  }

  Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ")
  exit 0
}

$runnerPath = Join-Path $PSScriptRoot "update-jira-pat.ps1"
if (-not (Test-Path -LiteralPath $runnerPath)) {
  throw "Missing updater script: $runnerPath"
}

$parsedStartTime = [TimeSpan]::Parse($StartTime)
$triggerAt = [datetime]::Today.Add($parsedStartTime)
$actionArguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -Target "{1}" -EnvFile "{2}" -OnlyWhenExpiringWithinDays {3} -ExpirationDays {4} -NodePath "{5}"' -f $runnerPath, $Target, $EnvFile, $OnlyWhenExpiringWithinDays, $ExpirationDays, $resolvedNodePath
if ($CurrentTokenExpiresAt) {
  $actionArguments += ' -CurrentTokenExpiresAt "{0}"' -f $CurrentTokenExpiresAt
}
if ($AuthTokenEnv) {
  $actionArguments += ' -AuthTokenEnv "{0}"' -f $AuthTokenEnv
}
if ($BasicUser) {
  $actionArguments += ' -BasicUser "{0}"' -f $BasicUser
}
if ($BasicPasswordEnv) {
  $actionArguments += ' -BasicPasswordEnv "{0}"' -f $BasicPasswordEnv
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArguments
$trigger = New-ScheduledTaskTrigger -Daily -At $triggerAt
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "Checks Jira PAT expiry daily and rotates the configured PAT when it enters the renewal window." `
  -Force | Out-Null

if ($StartNow) {
  Start-ScheduledTask -TaskName $TaskName
}

Write-Host ""
Write-Host "Installed the Jira PAT rotation task:" -ForegroundColor Green
Write-Host "  $TaskName"
Write-Host ""
Write-Host "Target:" -ForegroundColor Green
Write-Host "  $Target"
Write-Host ""
Write-Host "Env file:" -ForegroundColor Green
Write-Host "  $EnvFile"
Write-Host ""
Write-Host "Daily start time:" -ForegroundColor Green
Write-Host "  $StartTime"
Write-Host ""
Write-Host "Rotation window:" -ForegroundColor Green
Write-Host "  $OnlyWhenExpiringWithinDays day(s)"
Write-Host ""
Write-Host "PAT lifetime:" -ForegroundColor Green
Write-Host "  $ExpirationDays day(s)"
if ($CurrentTokenExpiresAt) {
  Write-Host ""
  Write-Host "Bootstrapped current expiry:" -ForegroundColor Green
  Write-Host "  $CurrentTokenExpiresAt"
}
