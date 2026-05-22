param(
  [string]$TaskName = "SimphonyBugRcaAgent",
  [int]$Port = 3210,
  [int]$WaitSeconds = 15
)

$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Invoke-ElevatedSelf {
  $argumentList = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    ('"{0}"' -f $PSCommandPath),
    "-TaskName",
    ('"{0}"' -f $TaskName),
    "-Port",
    ('"{0}"' -f $Port),
    "-WaitSeconds",
    ('"{0}"' -f $WaitSeconds)
  )

  $child = Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ") -Wait -PassThru
  exit $child.ExitCode
}

function Get-ListeningPids {
  param(
    [int]$TargetPort
  )

  $rows = netstat -ano -p tcp | Select-String -Pattern (":{0}\s+.*LISTENING\s+(\d+)$" -f $TargetPort)
  $pids = @()

  foreach ($row in $rows) {
    if ($row.Matches.Count -gt 0) {
      $pidValue = [int]$row.Matches[0].Groups[1].Value
      if ($pidValue -gt 0 -and $pidValue -ne $PID) {
        $pids += $pidValue
      }
    }
  }

  return $pids | Sort-Object -Unique
}

function Stop-PortListeners {
  param(
    [int]$TargetPort
  )

  $pids = Get-ListeningPids -TargetPort $TargetPort
  foreach ($pidValue in $pids) {
    try {
      Stop-Process -Id $pidValue -Force -ErrorAction Stop
      Write-Host ("Stopped process {0} on port {1}" -f $pidValue, $TargetPort) -ForegroundColor Yellow
    } catch {
      Write-Warning ("Failed to stop process {0} on port {1}: {2}" -f $pidValue, $TargetPort, $_.Exception.Message)
    }
  }
}

if (-not (Test-IsAdministrator)) {
  Invoke-ElevatedSelf
}

try {
  & schtasks.exe /End /TN $TaskName | Out-Null
} catch {
  # Best effort only.
}

Stop-PortListeners -TargetPort $Port

$deadline = [DateTime]::UtcNow.AddSeconds([Math]::Max(3, $WaitSeconds))
while ([DateTime]::UtcNow -lt $deadline) {
  if ((Get-ListeningPids -TargetPort $Port).Count -eq 0) {
    Write-Host ""
    Write-Host ("Local agent has been stopped on port {0}." -f $Port) -ForegroundColor Green
    Write-Host ("Start command: powershell -ExecutionPolicy Bypass -File .\start-local-agent.ps1") -ForegroundColor Green
    exit 0
  }
  Start-Sleep -Seconds 1
}

throw "The scheduled task stop request was sent, but something is still listening on port $Port."
