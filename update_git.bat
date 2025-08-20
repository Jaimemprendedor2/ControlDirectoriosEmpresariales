@echo off
echo Agregando cambios a Git...
git add .
echo.
echo Haciendo commit...
git commit -m "v1.1.0: Rebrand to Configuracion de Directorios Empresariales Gemini + Meeting Timer"
echo.
echo Subiendo al repositorio...
git push origin master
echo.
echo Actualizacion completada!
pause
