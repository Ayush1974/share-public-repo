@echo off
setlocal

if "%~1"=="" (
  echo Usage:
  echo   SET-VM-HOST.cmd http://your-vm-host:3210
  exit /b 1
)

powershell -ExecutionPolicy Bypass -File ".\set-hosted-ui-url.ps1" -HostedUiBaseUrl "%~1"
