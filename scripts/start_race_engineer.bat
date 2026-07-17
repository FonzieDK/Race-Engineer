@echo off
setlocal

cd /d "%~dp0.."

echo Starting Race-Engineer Electron app...

echo Checking runtime dependencies...

set "SCRIPT_DIR=%~dp0"
set "APP_ROOT=%SCRIPT_DIR%..\"
set "PYTHON_EXE=%APP_ROOT%venv\Scripts\python.exe"
set "ELECTRON_CLI=%APP_ROOT%node_modules\electron\cli.js"
set "NODE_EXE="
set "NPM_CMD="

for /f "delims=" %%I in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
for /f "delims=" %%I in ('where npm.cmd 2^>nul') do if not defined NPM_CMD set "NPM_CMD=%%I"

if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NPM_CMD if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"

if not exist "%PYTHON_EXE%" (
    echo.
    echo ERROR: Python virtual environment was not found.
    echo Create it by running: python scripts/setup_iracing_env.py
    echo.
    pause
    exit /b 1
)

"%PYTHON_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python virtual environment is unavailable or invalid.
    echo Delete the venv folder and run: python scripts/setup_iracing_env.py
    echo.
    pause
    exit /b 1
)

if not exist "%ELECTRON_CLI%" (
    echo.
    echo ERROR: Electron is not installed in the project.
    if defined NPM_CMD (
        echo Run this command in the project folder:
        echo   "%NPM_CMD%" install
    ) else (
        echo Node.js and npm were not found.
        echo Install Node.js, then run npm install in this project.
    )
    echo.
    pause
    exit /b 1
)

if not defined NODE_EXE (
    echo.
    echo ERROR: Node.js was not found.
    echo Electron 42 and newer use Node.js to locate and, when needed,
    echo download the matching Electron runtime.
    echo.
    pause
    exit /b 1
)

echo Closing old Race-Engineer processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root = (Resolve-Path '.').Path; Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'electron.exe' -and $_.CommandLine -like ('*' + $root + '*')) -or ($_.Name -eq 'python.exe' -and $_.CommandLine -like '*race_engineer.server*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

set "ELECTRON_RUN_AS_NODE="
set "ELECTRON_APP=%APP_ROOT%."
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath $env:NODE_EXE -ArgumentList ('\"{0}\" \"{1}\"' -f $env:ELECTRON_CLI, $env:ELECTRON_APP) -WindowStyle Hidden"
