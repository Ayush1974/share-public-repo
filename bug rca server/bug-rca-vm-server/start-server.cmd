@echo off
setlocal

rem Hosted VM/server launcher for this package.
rem Runs the Node server in combined mode so shared://simphony executes on the VM.
rem Docker-backed Jira MCP on this VM requires an elevated server process.

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
set "HOST=0.0.0.0"
set "RCA_SERVER_MODE=combined"
set "CODEX_FULL_ACCESS=true"
set "REQUIRE_ELEVATED_EXECUTION=false"

if exist "%APPDATA%\npm\codex.cmd" set "PATH=%APPDATA%\npm;%PATH%"
if exist "%USERPROFILE%\AppData\Roaming\npm\codex.cmd" set "PATH=%USERPROFILE%\AppData\Roaming\npm;%PATH%"

for /f "delims=" %%I in ('powershell.exe -NoProfile -Command "(Get-Command codex.cmd -ErrorAction SilentlyContinue).Source"') do set "CODEX_BIN=%%I"
if not defined CODEX_BIN for /f "delims=" %%I in ('powershell.exe -NoProfile -Command "(Get-Command codex -ErrorAction SilentlyContinue).Source"') do set "CODEX_BIN=%%I"
if not defined CODEX_BIN if exist "%APPDATA%\npm\codex.cmd" set "CODEX_BIN=%APPDATA%\npm\codex.cmd"
if not defined CODEX_BIN if exist "%USERPROFILE%\AppData\Roaming\npm\codex.cmd" set "CODEX_BIN=%USERPROFILE%\AppData\Roaming\npm\codex.cmd"
if not defined CODEX_BIN (
  echo Codex CLI was not found on PATH for this VM user.
  echo Checked default npm global install locations under %%APPDATA%%\npm as well.
  echo Install Codex or add it to PATH, then run this script again.
  exit /b 1
)

node .\scripts\run-bug-rca-ui.js --foreground --port "%PORT%" --host "%HOST%" --server-mode "%RCA_SERVER_MODE%" --codex-full-access "%CODEX_FULL_ACCESS%" --require-elevated-execution "%REQUIRE_ELEVATED_EXECUTION%"
