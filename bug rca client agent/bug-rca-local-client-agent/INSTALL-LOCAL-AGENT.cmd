@echo off
setlocal

powershell -ExecutionPolicy Bypass -File ".\setup-user-local-agent.ps1" -OpenUi
