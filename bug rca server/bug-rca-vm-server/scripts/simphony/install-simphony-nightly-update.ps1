param(
  [string]$TaskName = "SimphonySharedWorkspaceNightlyUpdate",
  [string]$WorkspacePath = "",
  [string]$StartTime = "02:00",
  [string]$SvnPath = "",
  [switch]$ForceRevertLocalChanges,
  [switch]$StartNow
)

$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsAdministrator)) {
  $argumentList = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    ('"{0}"' -f $PSCommandPath),
    "-TaskName",
    ('"{0}"' -f $TaskName),
    "-WorkspacePath",
    ('"{0}"' -f $WorkspacePath),
    "-StartTime",
    ('"{0}"' -f $StartTime)
  )
  if ($SvnPath) {
    $argumentList += "-SvnPath"
    $argumentList += ('"{0}"' -f $SvnPath)
  }
  if ($ForceRevertLocalChanges) {
    $argumentList += "-ForceRevertLocalChanges"
  }
  if ($StartNow) {
    $argumentList += "-StartNow"
  }

  Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ")
  exit 0
}

if (-not $WorkspacePath) {
  throw "WorkspacePath is required. Pass the exact shared workspace path for the nightly update task."
}

$runnerPath = Join-Path $PSScriptRoot "update-simphony-working-copy.ps1"
if (-not (Test-Path -LiteralPath $runnerPath)) {
  throw "Missing updater script: $runnerPath"
}

$parsedStartTime = [TimeSpan]::Parse($StartTime)
$triggerAt = [datetime]::Today.Add($parsedStartTime)
$actionArguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -WorkspacePath "{1}"' -f $runnerPath, $WorkspacePath
if ($SvnPath) {
  $actionArguments += ' -SvnPath "{0}"' -f $SvnPath
}
if ($ForceRevertLocalChanges) {
  $actionArguments += " -ForceRevertLocalChanges"
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
  -Description "Runs nightly svn update for the shared Simphony VM working copy." `
  -Force | Out-Null

if ($StartNow) {
  Start-ScheduledTask -TaskName $TaskName
}

Write-Host ""
Write-Host "Installed the nightly Simphony workspace update task:" -ForegroundColor Green
Write-Host "  $TaskName"
Write-Host ""
Write-Host "Workspace:" -ForegroundColor Green
Write-Host "  $WorkspacePath"
Write-Host ""
Write-Host "Nightly start time:" -ForegroundColor Green
Write-Host "  $StartTime"
Write-Host ""
if ($ForceRevertLocalChanges) {
  Write-Host "Mode:" -ForegroundColor Yellow
  Write-Host "  Force revert local SVN changes before update."
} else {
  Write-Host "Mode:" -ForegroundColor Yellow
  Write-Host "  Safe mode. Dirty working copies will be logged and skipped."
}
