@echo off
setlocal

set "BUG_RCA_VM_APP_DIR=%cd%"
if not exist "%BUG_RCA_VM_APP_DIR%\start-server-service.cmd" (
  set "BUG_RCA_VM_APP_DIR=C:\bug-rca-ui\bug-rca-ui-2"
)

if not exist "%BUG_RCA_VM_APP_DIR%\start-server-service.cmd" (
  echo Missing VM app folder with start-server-service.cmd:
  echo   %BUG_RCA_VM_APP_DIR%
  echo Run this script from the full app folder, or edit START-VM-UI-SERVICE.cmd if your app is elsewhere.
  exit /b 1
)

cd /d "%BUG_RCA_VM_APP_DIR%"
call ".\start-server-service.cmd"
