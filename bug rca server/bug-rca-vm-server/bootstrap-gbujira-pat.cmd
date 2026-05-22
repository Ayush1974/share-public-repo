@echo off
setlocal

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\jira\bootstrap-current-jira-pat.ps1" -Target "gbujira"
