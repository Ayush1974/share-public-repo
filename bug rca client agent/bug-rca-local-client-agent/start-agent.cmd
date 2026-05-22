@echo off
setlocal

if /I "%~1"=="--elevated" goto elevated
powershell -NoProfile -Command "Start-Process -Verb RunAs '%ComSpec%' -ArgumentList '/c ""\"%~f0\" --elevated""'"
exit /b

:elevated
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

set "PORT=3210"
set "HOST=127.0.0.1"
set "RCA_SERVER_MODE=agent"
set "CODEX_FULL_ACCESS=true"
set "REQUIRE_ELEVATED_EXECUTION=true"

node .\scripts\run-bug-rca-ui.js --foreground --port "%PORT%" --host "%HOST%" --server-mode "%RCA_SERVER_MODE%" --codex-full-access "%CODEX_FULL_ACCESS%" --require-elevated-execution "%REQUIRE_ELEVATED_EXECUTION%"
