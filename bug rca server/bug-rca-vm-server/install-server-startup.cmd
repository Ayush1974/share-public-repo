@echo off
setlocal

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\install-server-startup.ps1"
