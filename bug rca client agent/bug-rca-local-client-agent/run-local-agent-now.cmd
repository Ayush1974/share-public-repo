@echo off
setlocal

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

powershell -ExecutionPolicy Bypass -File ".\run-local-agent-now.ps1"
