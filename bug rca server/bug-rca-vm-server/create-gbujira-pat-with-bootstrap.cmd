@echo off
setlocal

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

if "%~1"=="" goto usage

if /I "%~1"=="pat" goto pat
if /I "%~1"=="basic" goto basic
goto usage

:pat
set /p GBUJIRA_BOOTSTRAP_PAT=Enter bootstrap Jira PAT: 
if "%GBUJIRA_BOOTSTRAP_PAT%"=="" (
  echo Bootstrap PAT is required.
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\jira\update-jira-pat.ps1" -Target "gbujira" -EnvFile ".env" -AuthTokenEnv "GBUJIRA_BOOTSTRAP_PAT"
set "GBUJIRA_BOOTSTRAP_PAT="
exit /b %ERRORLEVEL%

:basic
set /p GBUJIRA_BASIC_USER=Enter Jira username: 
if "%GBUJIRA_BASIC_USER%"=="" (
  echo Jira username is required.
  exit /b 1
)

set /p GBUJIRA_PASSWORD=Enter Jira password: 
if "%GBUJIRA_PASSWORD%"=="" (
  echo Jira password is required.
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\jira\update-jira-pat.ps1" -Target "gbujira" -EnvFile ".env" -BasicUser "%GBUJIRA_BASIC_USER%" -BasicPasswordEnv "GBUJIRA_PASSWORD"
set "GBUJIRA_PASSWORD="
set "GBUJIRA_BASIC_USER="
exit /b %ERRORLEVEL%

:usage
echo Usage:
echo   create-gbujira-pat-with-bootstrap.cmd pat
echo   create-gbujira-pat-with-bootstrap.cmd basic
exit /b 1
