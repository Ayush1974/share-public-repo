param(
  [string]$TaskName = "SimphonyBugRcaAgent",
  [int]$Port = 3210,
  [int]$WaitSeconds = 20,
  [switch]$StartNow = $true
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
  if ($StartNow) {
    $argumentList += "-StartNow"
  }

  $child = Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ") -Wait -PassThru
  exit $child.ExitCode
}

function Test-LocalAgentHealth {
  param(
    [string[]]$Urls
  )

  foreach ($url in $Urls) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -eq 200) {
        return $url
      }
    } catch {
      # Try the next URL.
    }
  }

  return ""
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

function Stop-ExistingAgent {
  param(
    [string]$ExistingTaskName,
    [int]$TargetPort
  )

  $scheduledTask = Get-ScheduledTask -TaskName $ExistingTaskName -ErrorAction SilentlyContinue
  if ($scheduledTask) {
    try {
      Stop-ScheduledTask -TaskName $ExistingTaskName -ErrorAction SilentlyContinue | Out-Null
    } catch {
      # Best effort only.
    }
  }

  Stop-PortListeners -TargetPort $TargetPort
}

if (-not (Test-IsAdministrator)) {
  Invoke-ElevatedSelf
}

$appDir = Split-Path -Parent $PSCommandPath
$installerPath = Join-Path $appDir "scripts\install-agent-startup.ps1"

if (-not (Test-Path -LiteralPath $installerPath)) {
  throw "Missing installer script: $installerPath"
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw "Node.js was not found on PATH. Install Node.js first, then rerun this script."
}

$codexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
if (-not $codexCommand) {
  $codexCommand = Get-Command codex -ErrorAction SilentlyContinue
}
if (-not $codexCommand) {
  throw "Codex CLI was not found on PATH. Install codex and complete codex login first, then rerun this script."
}

Write-Host ""
Write-Host "Installing the local agent startup task..." -ForegroundColor Cyan
Write-Host ("Stopping anything already running on port {0} first..." -f $Port) -ForegroundColor Cyan
Stop-ExistingAgent -ExistingTaskName $TaskName -TargetPort $Port
& $installerPath -TaskName $TaskName -StartNow:$StartNow

$installedTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $installedTask) {
  throw "Scheduled task '$TaskName' was not found after installation."
}

if (-not $StartNow) {
  Write-Host ""
  Write-Host "The local agent startup task is installed. Start it now or sign out/sign in before opening the hosted UI." -ForegroundColor Yellow
  exit 0
}

$healthUrls = @(
  ("http://127.0.0.1:{0}/api/health" -f $Port)
)

$deadline = [DateTime]::UtcNow.AddSeconds([Math]::Max(5, $WaitSeconds))
$connectedUrl = ""

while ([DateTime]::UtcNow -lt $deadline) {
  $connectedUrl = Test-LocalAgentHealth -Urls $healthUrls
  if ($connectedUrl) {
    break
  }
  Start-Sleep -Seconds 1
}

Write-Host ""
if ($connectedUrl) {
  Write-Host "Local agent is running and reachable at $connectedUrl" -ForegroundColor Green
  Write-Host "Users can now open the hosted URL, and the page will communicate with localhost automatically." -ForegroundColor Green
  exit 0
}

Write-Host "The startup task was installed, but localhost health did not answer within $WaitSeconds seconds." -ForegroundColor Yellow
Write-Host "Try this next:" -ForegroundColor Yellow
Write-Host "  schtasks /Run /TN `"$TaskName`""
Write-Host ("  netstat -ano | findstr :{0}" -f $Port)
Write-Host "  type `"$appDir\data\agent-startup.log`""
exit 1
