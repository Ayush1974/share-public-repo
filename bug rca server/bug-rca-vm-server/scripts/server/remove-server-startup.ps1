param(
  [string]$TaskName = "SimphonyBugRcaUiHost"
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
    ('"{0}"' -f $TaskName)
  )

  Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ")
  exit 0
}

try {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue | Out-Null
} catch {
}

Write-Host ""
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop

Write-Host ""
Write-Host "Removed the VM UI host startup task:" -ForegroundColor Green
Write-Host "  $TaskName"
