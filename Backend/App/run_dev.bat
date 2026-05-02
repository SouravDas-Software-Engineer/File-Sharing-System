@echo off
REM ─────────────────────────────────────────────────────────────────────────
REM  Dev server — only reloads on Python (.py) file changes.
REM
REM  IMPORTANT: Do NOT use plain `uvicorn main:app --reload` without this flag!
REM  Without --reload-include "*.py", WatchFiles (uvicorn's file watcher)
REM  will restart the server whenever chunk files are saved to uploads/,
REM  killing active HTTP connections mid-transfer.
REM
REM  Usage:  run_dev.bat        (from Backend\App directory)
REM ─────────────────────────────────────────────────────────────────────────
echo Starting FileShare dev backend...
echo   - Auto-reload: Python source files only
echo   - Listening on http://127.0.0.1:8000
echo.
uvicorn main:app --reload "--reload-include=*.py" --host 127.0.0.1 --port 8000
