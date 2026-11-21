@echo off
cd /d "%~dp0"
echo BEY ANIME ishga tushmoqda...
if not exist "backend\.env" (
 echo XATO: backend\.env yo'q! backend\.env.example ni nusxalab sozlang.
 pause
 exit /b 1
)
call npm install
if errorlevel 1 (pause & exit /b 1)
call npm run dev
pause
