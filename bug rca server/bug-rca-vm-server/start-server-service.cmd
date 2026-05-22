@echo off
setlocal

set "TASK_NAME=SimphonyBugRcaUiHost"
if not "%~1"=="" set "TASK_NAME=%~1"

if not "%~1"=="" goto run_task

powershell.exe -NoProfile -Command "if (Get-ScheduledTask -TaskName '%TASK_NAME%' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>nul
if %errorlevel%==0 goto run_task

powershell.exe -NoProfile -Command "if (Get-ScheduledTask -TaskName 'SimphonyBugRcaAgent' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>nul
if %errorlevel%==0 (
  echo Hosted server task %TASK_NAME% is not installed on this VM.
  echo Found local client-agent task SimphonyBugRcaAgent instead.
  echo Run install-server-startup.cmd to install the hosted server task, or pass an explicit task name if you intentionally want a different task.
  exit /b 1
)

echo Hosted server task %TASK_NAME% is not installed on this VM.
echo Run install-server-startup.cmd first.
echo If this VM only has SimphonyBugRcaAgent, that is the local client-agent task, not the hosted server task for this package.
exit /b 1

:run_task
schtasks /Run /TN "%TASK_NAME%"
