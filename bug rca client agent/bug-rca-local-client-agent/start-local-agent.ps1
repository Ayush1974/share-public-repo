param(
  [string]$TaskName = "SimphonyBugRcaAgent",
  [int]$Port = 3210,
  [int]$WaitSeconds = 20,
  [switch]$ForceRestart = $true
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
  if ($ForceRestart) {
    $argumentList += "-ForceRestart"
  }

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

function Test-TaskExists {
  param(
    [string]$TargetTaskName
  )

  & schtasks.exe /Query /TN $TargetTaskName | Out-Null
  return $LASTEXITCODE -eq 0
}

if (-not (Test-IsAdministrator)) {
  Invoke-ElevatedSelf
}

if (-not (Test-TaskExists -TargetTaskName $TaskName)) {
  throw "Scheduled task '$TaskName' is not installed. Run .\install-local-agent.ps1 first."
}

if ($ForceRestart) {
  try {
    & schtasks.exe /End /TN $TaskName | Out-Null
  } catch {
    # Best effort only.
  }
  Stop-PortListeners -TargetPort $Port
}

& schtasks.exe /Run /TN $TaskName | Out-Null

$healthUrl = "http://127.0.0.1:$Port/api/health"
$deadline = [DateTime]::UtcNow.AddSeconds([Math]::Max(5, $WaitSeconds))

while ([DateTime]::UtcNow -lt $deadline) {
  if (Test-LocalAgentHealth -Url $healthUrl) {
    Write-Host ""
    Write-Host ("Local agent is running persistently at {0}" -f $healthUrl) -ForegroundColor Green
    Write-Host ("Stop command: powershell -ExecutionPolicy Bypass -File .\stop-local-agent.ps1") -ForegroundColor Green
    exit 0
  }
  Start-Sleep -Seconds 1
}

throw "The scheduled task was started, but localhost health did not answer within $WaitSeconds seconds."
