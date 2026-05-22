param(
  [string]$TaskName = "SimphonyBugRcaAgent",
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
    ('"{0}"' -f $TaskName)
  )
  if ($StartNow) {
    $argumentList += "-StartNow"
  }

  Start-Process -Verb RunAs powershell.exe -ArgumentList ($argumentList -join " ")
  exit 0
}

function ConvertTo-XmlText {
  param(
    [string]$Value
  )

  return [System.Security.SecurityElement]::Escape([string]$Value)
}

function Test-TaskExists {
  param(
    [string]$TargetTaskName
  )

  $queryOutput = & schtasks.exe /Query /TN $TargetTaskName 2>&1
  return $LASTEXITCODE -eq 0
}

$runnerPath = Join-Path $PSScriptRoot "run-agent-task.ps1"
if (-not (Test-Path -LiteralPath $runnerPath)) {
  throw "Missing runner script: $runnerPath"
}

$null = Get-Command node -ErrorAction Stop
$userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$xmlPath = Join-Path $env:TEMP ("{0}.xml" -f $TaskName)
$runnerPathXml = ConvertTo-XmlText -Value $runnerPath
$userIdXml = ConvertTo-XmlText -Value $userId
$argumentsXml = ConvertTo-XmlText -Value ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $runnerPath)
$taskXml = @(
  '<?xml version="1.0" encoding="UTF-16"?>',
  '<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">',
  '  <RegistrationInfo>',
  '    <Description>Starts the Simphony Bug RCA local agent on user logon with highest privileges.</Description>',
  '  </RegistrationInfo>',
  '  <Triggers>',
  '    <LogonTrigger>',
  '      <Enabled>true</Enabled>',
  ('      <UserId>{0}</UserId>' -f $userIdXml),
  '    </LogonTrigger>',
  '  </Triggers>',
  '  <Principals>',
  '    <Principal id="Author">',
  ('      <UserId>{0}</UserId>' -f $userIdXml),
  '      <LogonType>InteractiveToken</LogonType>',
  '      <RunLevel>HighestAvailable</RunLevel>',
  '    </Principal>',
  '  </Principals>',
  '  <Settings>',
  '    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>',
  '    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>',
  '    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>',
  '    <AllowHardTerminate>true</AllowHardTerminate>',
  '    <StartWhenAvailable>true</StartWhenAvailable>',
  '    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>',
  '    <IdleSettings>',
  '      <StopOnIdleEnd>false</StopOnIdleEnd>',
  '      <RestartOnIdle>false</RestartOnIdle>',
  '    </IdleSettings>',
  '    <AllowStartOnDemand>true</AllowStartOnDemand>',
  '    <Enabled>true</Enabled>',
  '    <Hidden>false</Hidden>',
  '    <RunOnlyIfIdle>false</RunOnlyIfIdle>',
  '    <WakeToRun>false</WakeToRun>',
  '    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>',
  '    <Priority>7</Priority>',
  '  </Settings>',
  '  <Actions Context="Author">',
  '    <Exec>',
  '      <Command>powershell.exe</Command>',
  ('      <Arguments>{0}</Arguments>' -f $argumentsXml),
  '    </Exec>',
  '  </Actions>',
  '</Task>'
) -join [Environment]::NewLine

Set-Content -LiteralPath $xmlPath -Value $taskXml -Encoding Unicode

try {
  & schtasks.exe /Create /TN $TaskName /XML $xmlPath /F | Out-Null
} finally {
  if (Test-Path -LiteralPath $xmlPath) {
    Remove-Item -LiteralPath $xmlPath -Force -ErrorAction SilentlyContinue
  }
}

if (-not (Test-TaskExists -TargetTaskName $TaskName)) {
  throw "Scheduled task '$TaskName' was not found after registration."
}

if ($StartNow) {
  & schtasks.exe /Run /TN $TaskName | Out-Null
}

Write-Host ""
Write-Host "Installed the local agent startup task:" -ForegroundColor Green
Write-Host "  $TaskName"
Write-Host ""
Write-Host "Users can now open the VM-hosted UI, and the browser will reconnect to http://127.0.0.1:3210 once the task is running."
