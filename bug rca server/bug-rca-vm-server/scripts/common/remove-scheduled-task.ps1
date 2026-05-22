param(
  [string]$TaskName,
  [string]$TaskLabel = "scheduled task"
)

$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not $TaskName) {
  throw "TaskName is required."
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
    "-TaskLabel",
    ('"{0}"' -f $TaskLabel)
  )

  Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ")
  exit 0
}

try {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue | Out-Null
} catch {
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop

Write-Host ""
Write-Host ("Removed the {0}:" -f $TaskLabel) -ForegroundColor Green
Write-Host ("  {0}" -f $TaskName)
