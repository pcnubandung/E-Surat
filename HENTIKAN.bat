@echo off
title SAFIRA - Menghentikan Server
color 0C

echo.
echo  ============================================
echo    SAFIRA - Menghentikan Server
echo  ============================================
echo.

echo [1/2] Menghentikan Backend (port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo       Backend dihentikan.

echo [2/2] Menghentikan Frontend (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo       Frontend dihentikan.

echo.
echo  Semua server telah dihentikan.
echo.
echo  Tekan tombol apa saja untuk menutup...
pause >nul
