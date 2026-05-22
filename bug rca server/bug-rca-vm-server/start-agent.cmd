@echo off
setlocal

rem Optional local-agent compatibility wrapper.
rem This is not needed for hosted shared://simphony runs on the VM.
rem Use it only when this folder is intentionally run in local agent mode.

set "ELEVATION_MARKER=--already-elevated"
if /i "%~1"=="%ELEVATION_MARKER%" shift

powershell.exe -NoProfile -Command "$identity = [Security.Principal.WindowsIdentity]::GetCurrent(); $principal = New-Object Security.Principal.WindowsPrincipal($identity); if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 5 }"
if "%errorlevel%"=="5" (
  powershell.exe -NoProfile -Command "Start-Process -Verb RunAs -FilePath '%~f0' -ArgumentList '%ELEVATION_MARKER%'"
  exit /b %errorlevel%
)

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

set "PORT=3210"
set "HOST=127.0.0.1"
set "RCA_SERVER_MODE=agent"
set "CODEX_FULL_ACCESS=true"
set "REQUIRE_ELEVATED_EXECUTION=true"

if exist "%APPDATA%\npm\codex.cmd" set "PATH=%APPDATA%\npm;%PATH%"
if exist "%USERPROFILE%\AppData\Roaming\npm\codex.cmd" set "PATH=%USERPROFILE%\AppData\Roaming\npm;%PATH%"

for /f "delims=" %%I in ('powershell.exe -NoProfile -Command "(Get-Command codex.cmd -ErrorAction SilentlyContinue).Source"') do set "CODEX_BIN=%%I"
if not defined CODEX_BIN for /f "delims=" %%I in ('powershell.exe -NoProfile -Command "(Get-Command codex -ErrorAction SilentlyContinue).Source"') do set "CODEX_BIN=%%I"
if not defined CODEX_BIN if exist "%APPDATA%\npm\codex.cmd" set "CODEX_BIN=%APPDATA%\npm\codex.cmd"
if not defined CODEX_BIN if exist "%USERPROFILE%\AppData\Roaming\npm\codex.cmd" set "CODEX_BIN=%USERPROFILE%\AppData\Roaming\npm\codex.cmd"
if not defined CODEX_BIN (
  echo Codex CLI was not found on PATH for this user.
  echo Install Codex or add it to PATH, then run this script again.
  exit /b 1
)

node .\scripts\run-bug-rca-ui.js --foreground --port "%PORT%" --host "%HOST%" --server-mode "%RCA_SERVER_MODE%" --codex-full-access "%CODEX_FULL_ACCESS%" --require-elevated-execution "%REQUIRE_ELEVATED_EXECUTION%"
