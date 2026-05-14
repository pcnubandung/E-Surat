@echo off
title SAFIRA - Menjalankan Server
color 0A

echo.
echo  ============================================
echo    SAFIRA - Sistem Administrasi Persuratan
echo  ============================================
echo.

:: Cek apakah PostgreSQL berjalan
echo [1/3] Memeriksa PostgreSQL...
sc query postgresql-x64-16 | find "RUNNING" >nul 2>&1
if errorlevel 1 (
    echo       PostgreSQL tidak berjalan. Mencoba menjalankan...
    net start postgresql-x64-16 >nul 2>&1
    timeout /t 3 /nobreak >nul
    sc query postgresql-x64-16 | find "RUNNING" >nul 2>&1
    if errorlevel 1 (
        echo       [GAGAL] PostgreSQL tidak bisa dijalankan.
        echo       Jalankan manual: net start postgresql-x64-16
        pause
        exit /b 1
    )
)
echo       PostgreSQL OK

:: Jalankan Backend
echo [2/3] Menjalankan Backend (port 5000)...
start "SAFIRA Backend" cmd /k "cd /d %~dp0backend && node src/server.js"
timeout /t 3 /nobreak >nul
echo       Backend OK

:: Jalankan Frontend
echo [3/3] Menjalankan Frontend (port 5173)...
start "SAFIRA Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 5 /nobreak >nul
echo       Frontend OK

echo.
echo  ============================================
echo    Aplikasi siap diakses!
echo    Buka browser: http://localhost:5173
echo  ============================================
echo.
echo  Login default:
echo    Admin      : admin@safira.com / admin123
echo    Sekretaris : sekretaris@safira.com / password123
echo    Ketua      : ketua@safira.com / password123
echo.

:: Buka browser otomatis
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo  Tekan tombol apa saja untuk menutup jendela ini...
pause >nul
