@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%" >nul 2>nul
call ".\stop-server-service.cmd" %*
set "EXIT_CODE=%errorlevel%"
popd >nul 2>nul
exit /b %EXIT_CODE%
