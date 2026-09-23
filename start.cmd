@echo off
rem Запуск веб-калькулятора из Git CMD / cmd.exe:  start.cmd
rem Затем откройте в браузере http://localhost:3000
cd /d "%~dp0"
node src\server.js
