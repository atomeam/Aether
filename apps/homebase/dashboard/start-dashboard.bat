@echo off
echo ========================================
echo Automation Orchestrator Dashboard
echo ========================================
echo.
echo Starting dashboard on http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
python -m http.server 8080

pause