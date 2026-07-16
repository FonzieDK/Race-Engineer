@echo off
setlocal EnableExtensions

cd /d "%~dp0"
title Race-Engineer - Commit to GitHub

set "GIT_EXE=git"
where git >nul 2>&1
if not errorlevel 1 goto git_found

if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
    goto git_found
)

echo ERROR: Git was not found.
echo Install Git for Windows and try again.
goto failed

:git_found
"%GIT_EXE%" rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: This folder is not a Git repository.
    goto failed
)

echo.
echo Race-Engineer - Commit to GitHub
echo Repository: https://github.com/FonzieDK/Race-Engineer
echo.
"%GIT_EXE%" status --short
echo.

set "COMMIT_MESSAGE="
set /p "COMMIT_MESSAGE=Commit message [Update Race-Engineer]: "
if not defined COMMIT_MESSAGE set "COMMIT_MESSAGE=Update Race-Engineer"

echo.
echo Adding changed files...
"%GIT_EXE%" add -A
if errorlevel 1 goto failed

"%GIT_EXE%" diff --cached --quiet
if not errorlevel 1 (
    echo No local changes to commit. Checking GitHub for updates...
    goto sync
)

echo Creating commit...
"%GIT_EXE%" commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 goto failed

:sync
echo Synchronizing with GitHub...
"%GIT_EXE%" pull --rebase origin main
if errorlevel 1 (
    echo.
    echo Git could not apply the GitHub changes automatically.
    echo No push was attempted. Resolve the messages above and run this file again.
    goto failed
)

"%GIT_EXE%" push origin main
if errorlevel 1 goto failed

echo.
echo SUCCESS: Race-Engineer is synchronized with GitHub.
echo https://github.com/FonzieDK/Race-Engineer
echo.
pause
exit /b 0

:failed
echo.
echo FAILED: Review the error message above. Nothing else will be changed.
echo.
pause
exit /b 1
