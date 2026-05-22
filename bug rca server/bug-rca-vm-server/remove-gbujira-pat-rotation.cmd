@echo off
setlocal

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\remove-scheduled-task.ps1" -TaskName "GbujiraPatRotation" -TaskLabel "GBU Jira PAT rotation task"
