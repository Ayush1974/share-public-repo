param(
  [string]$TaskName = "SimphonyBugRcaUiHost",
  [string]$BindHost = "0.0.0.0",
  [string]$Port = "3210",
  [switch]$StartNow = $true
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
    "-BindHost",
    ('"{0}"' -f $BindHost),
    "-Port",
    ('"{0}"' -f $Port)
  )
  if ($StartNow) {
    $argumentList += "-StartNow"
  }

  Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ")
  exit 0
}

$runnerPath = Join-Path $PSScriptRoot "run-server-task.ps1"
if (-not (Test-Path -LiteralPath $runnerPath)) {
  throw "Missing runner script: $runnerPath"
}

$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
if (-not $currentUser) {
  throw "Could not determine the current Windows user. Sign in with the VM account that already completed codex login, then rerun this installer."
}

$nodePath = (Get-Command node -ErrorAction Stop).Source
$actionArguments = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}" -NodePath "{1}" -BindHost "{2}" -Port "{3}"' -f $runnerPath, $nodePath, $BindHost, $Port

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $actionArguments
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "Starts the Simphony Bug RCA combined server runtime at VM user sign-in for shared browser access and shared://simphony RCA execution." `
  -Force | Out-Null

if ($StartNow) {
  Start-ScheduledTask -TaskName $TaskName
}

Write-Host ""
Write-Host "Installed the VM combined server startup task:" -ForegroundColor Green
Write-Host "  $TaskName"
Write-Host ""
Write-Host "Task user:"
Write-Host "  $currentUser"
Write-Host ""
Write-Host "The hosted UI and shared runtime will run on http://$BindHost`:$Port/home and restart when this VM user signs in."
Write-Host "At startup, configured shared workspace roots also regenerate AGENTS.md and docs\memory-bank\index.md unless GENERATE_SHARED_MEMORY_BANKS_ON_STARTUP=false."
Write-Host "Install this task under the same VM account that already completed codex login."
Write-Host "Use start-server-service.cmd and stop-server-service.cmd to control it later."

