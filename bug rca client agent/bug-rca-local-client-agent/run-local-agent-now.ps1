param(
  [int]$Port = 3210
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
    "-Port",
    ('"{0}"' -f $Port)
  )

  $child = Start-Process -Verb RunAs powershell.exe -WorkingDirectory (Split-Path -Parent $PSCommandPath) -ArgumentList ($argumentList -join " ") -Wait -PassThru
  exit $child.ExitCode
}

if (-not (Test-IsAdministrator)) {
  Invoke-ElevatedSelf
}

$appDir = Split-Path -Parent $PSCommandPath
$nodeCommand = Get-Command node -ErrorAction Stop

Push-Location $appDir
try {
  $env:PORT = [string]$Port
  $env:HOST = "127.0.0.1"
  $env:RCA_SERVER_MODE = "agent"
  $env:CODEX_FULL_ACCESS = "true"
  $env:REQUIRE_ELEVATED_EXECUTION = "true"

  & $nodeCommand.Source ".\scripts\run-bug-rca-ui.js" --background --port $Port --host 127.0.0.1 --server-mode agent --codex-full-access true --require-elevated-execution true | Out-Null
} finally {
  Pop-Location
}
