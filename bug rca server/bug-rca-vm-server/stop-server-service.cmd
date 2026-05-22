@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "TARGET_PORT=3210"
set "LISTEN_PIDS_SCRIPT=.\scripts\get-listening-pids.ps1"
pushd "%SCRIPT_DIR%" >nul 2>nul

if not "%~1"=="" (
  schtasks /End /TN "%~1" >nul 2>nul
  if errorlevel 1 (
    echo Scheduled task %~1 was not stopped by name.
  ) else (
    echo Ended scheduled task %~1.
  )
  goto post_stop
)

schtasks /End /TN "SimphonyBugRcaUiHost" >nul 2>nul
if errorlevel 1 (
  echo Scheduled task SimphonyBugRcaUiHost was not stopped by name.
) else (
  echo Ended scheduled task SimphonyBugRcaUiHost.
)

set /a UIHOST_WAIT_COUNT=0
:wait_for_uihost
set "HAS_LISTENER="
for /f %%P in ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%LISTEN_PIDS_SCRIPT%" -Port %TARGET_PORT%') do (
  set "HAS_LISTENER=1"
)
if not defined HAS_LISTENER goto post_stop
set /a UIHOST_WAIT_COUNT+=1
if %UIHOST_WAIT_COUNT% geq 5 goto stop_agent
timeout /t 1 /nobreak >nul
goto wait_for_uihost

:stop_agent
schtasks /End /TN "SimphonyBugRcaAgent" >nul 2>nul
if errorlevel 1 (
  echo Scheduled task SimphonyBugRcaAgent was not stopped by name.
) else (
  echo Ended scheduled task SimphonyBugRcaAgent.
)

set /a AGENT_WAIT_COUNT=0
:wait_for_agent
set "HAS_LISTENER="
for /f %%P in ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%LISTEN_PIDS_SCRIPT%" -Port %TARGET_PORT%') do (
  set "HAS_LISTENER=1"
)
if not defined HAS_LISTENER goto post_stop
set /a AGENT_WAIT_COUNT+=1
if %AGENT_WAIT_COUNT% geq 5 goto post_stop
timeout /t 1 /nobreak >nul
goto wait_for_agent

:post_stop
set "EXIT_CODE=0"
rem FPS-135835| guid| prefer direct listener termination only as a last resort and suppress raw access-denied noise from stale detached hosts
for /f %%P in ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%LISTEN_PIDS_SCRIPT%" -Port %TARGET_PORT%') do (
  if not "%%P"=="0" (
    echo Stopping remaining listener on port %TARGET_PORT% with PID %%P
    taskkill /PID %%P /F >nul 2>nul
    if errorlevel 1 (
      echo Requesting elevation to stop protected listener PID %%P on port %TARGET_PORT%...
      powershell.exe -NoProfile -Command "try { $elevated = Start-Process -Verb RunAs powershell.exe -ArgumentList '-NoProfile -Command ""taskkill /PID %%P /T /F""' -Wait -PassThru -ErrorAction Stop; exit $elevated.ExitCode } catch { exit 1 }" >nul 2>nul
      if errorlevel 1 (
        echo Remaining listener PID %%P could not be stopped.
        echo Approve the UAC prompt or run this script from an Administrator shell.
        set "EXIT_CODE=1"
      ) else (
        echo Stopped protected listener PID %%P with elevation.
      )
    )
  )
)

popd >nul 2>nul
exit /b %EXIT_CODE%
