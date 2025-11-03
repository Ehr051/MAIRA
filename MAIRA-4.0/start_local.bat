@echo off
REM Script de inicio para servidor local MAIRA 4.0 en Windows
REM Usa serverhttps.py con certificado autofirmado para HTTPS

cd /d "%~dp0"

echo.
echo ========================================
echo    MAIRA 4.0 - Servidor Local
echo ========================================
echo.
echo Directorio: %CD%
echo.

REM Verificar que Server/ existe
if not exist "Server" (
    echo ERROR: Directorio Server/ no encontrado
    pause
    exit /b 1
)

cd Server

REM Verificar que serverhttps.py existe
if not exist "serverhttps.py" (
    echo ERROR: serverhttps.py no encontrado
    pause
    exit /b 1
)

echo Archivos encontrados
echo.
echo Verificando dependencias Python...

REM Verificar Flask
python -c "import flask" 2>nul
if errorlevel 1 (
    echo Flask no encontrado, instalando dependencias...
    pip install flask flask-socketio flask-cors pymysql python-dotenv bcrypt requests
)

echo Dependencias Python OK
echo.
echo ========================================
echo Iniciando servidor HTTPS...
echo URL: https://localhost:5001
echo URL alternativa: https://127.0.0.1:5001
echo.
echo NOTA: El navegador mostrara advertencia de
echo       certificado autofirmado. Esto es normal
echo       para desarrollo local. Acepta la advertencia.
echo.
echo Para detener el servidor: Ctrl+C
echo ========================================
echo.

REM Iniciar servidor
python serverhttps.py

if errorlevel 1 (
    echo.
    echo ERROR iniciando el servidor
    echo.
    echo Posibles soluciones:
    echo   1. Verifica que MySQL este corriendo
    echo   2. Verifica archivo .env con credenciales DB
    echo   3. Instala dependencias: pip install -r requirements.txt
    echo.
    pause
)
