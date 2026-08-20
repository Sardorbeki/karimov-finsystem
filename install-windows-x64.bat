@echo off
title Karimov FinSystem 2.0 - Windows x64 O'rnatish
color 0A

echo ======================================================================
echo           KARIMOV FINSYSTEM 2.0 - WINDOWS x64 O'RNATISH
echo ======================================================================
echo.
echo 1. Tizim talablari tekshirilmoqda...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [XATOLIK] Node.js topilmadi! Iltimos, https://nodejs.org saytidan Node.js ni o'rnating.
    pause
    exit /b
)

echo [OK] Node.js aniqlandi: 
node -v
echo.
echo 2. Kerakli modullar o'rnatilmoqda (npm install)...
call npm install

echo.
echo 3. Dastur ishlab chiqarish (production) rejimiga yig'ilmoqda...
call npm run build

echo.
echo ======================================================================
echo   O'RNATISH MUVAFFAQIYATLI YAKUNLANDI!
echo   Ishga tushirish uchun "run-windows-x64.bat" faylini oching.
echo ======================================================================
echo.
pause
