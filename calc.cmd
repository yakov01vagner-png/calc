@echo off
rem Консольный калькулятор из Git CMD / cmd.exe:
rem   calc.cmd "2+2*3"   - разовое вычисление
rem   calc.cmd           - интерактивный режим
node "%~dp0src\cli.js" %*
