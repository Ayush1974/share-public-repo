@echo off
setlocal

echo Stopping any local agent already running on port 3210...
powershell -ExecutionPolicy Bypass -File ".\stop-local-agent.ps1" >nul 2>nul

echo Starting the local agent...
call ".\run-local-agent-now.cmd"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(20); while((Get-Date) -lt $deadline){ try { $response=Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://127.0.0.1:3210/api/health; if($response.StatusCode -eq 200){ exit 0 } } catch {}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo Local agent did not start on port 3210.
  exit /b 1
)

echo Local agent is running on http://127.0.0.1:3210/api/health
