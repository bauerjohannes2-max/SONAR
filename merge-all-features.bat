@echo off
setlocal enabledelayedexpansion

echo =========================================================
echo   🚀 STARTING AUTOMATED MULTI-BRANCH MERGE PIPELINE
echo =========================================================

echo [1/8] Checking out main branch...
git checkout main
if errorlevel 1 goto error

echo [2/8] Merging feature/ui-layout-cleanup...
git merge feature/ui-layout-cleanup -m "Merge: UI & Layout Overhaul"
if errorlevel 1 goto error

echo [3/8] Merging feature/audio-dual-engine...
git merge feature/audio-dual-engine -m "Merge: Dual-Audio & Chime Scale"
if errorlevel 1 goto error

echo [4/8] Merging feature/gameplay-juice...
git merge feature/gameplay-juice -m "Merge: Game-Juice & Safe-Area Controls"
if errorlevel 1 goto error

echo [5/8] Merging feature/progression-storage...
git merge feature/progression-storage -m "Merge: Progression & Storage Sync"
if errorlevel 1 goto error

echo [6/8] Running Playwright validation suite...
call node ./node_modules/@playwright/test/cli.js test
if errorlevel 1 goto error

echo [7/8] Pruning git worktrees...
git worktree prune

echo [8/8] Pushing merged main branch to origin...
git push origin main
if errorlevel 1 goto error

echo =========================================================
echo   ✅ ALL FEATURES MERGED AND VALIDATED SUCCESSFULLY!
echo =========================================================
goto end

:error
echo.
echo ❌ ERROR: Merge or test failure detected! Please inspect logs.
exit /b 1

:end
endlocal
