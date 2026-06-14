@echo off
REM ============================================================
REM  e-Joutia full launcher (one-click)
REM  1) Installs backend (pip) and frontend (npm) dependencies.
REM  2) Applies Django migrations.
REM  3) Opens the Django backend and the Expo dev server in two
REM     separate windows that STAY OPEN (so the QR code is visible).
REM  Your phone and this PC must be on the SAME Wi-Fi network.
REM ============================================================

echo ============================================================
echo  e-Joutia setup + launch
echo ============================================================

REM ---------------------------------------------------------
REM  Backend dependencies (Django + DRF)
REM ---------------------------------------------------------
echo.
echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ERROR: pip install failed. Is Python installed and on your PATH?
    pause
    exit /b 1
)

echo.
echo [2/4] Applying database migrations...
python manage.py migrate
if errorlevel 1 (
    echo.
    echo ERROR: Django migrations failed.
    pause
    exit /b 1
)

REM ---------------------------------------------------------
REM  Frontend dependencies (Expo + react-native-maps, etc.)
REM ---------------------------------------------------------
echo.
echo [3/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed. Is Node.js installed and on your PATH?
    pause
    exit /b 1
)

REM Ensure native map module matches the installed Expo SDK.
echo.
echo Ensuring react-native-maps matches the Expo SDK...
call npx expo install react-native-maps

REM ---------------------------------------------------------
REM  Launch both servers in their own windows
REM ---------------------------------------------------------
echo.
echo [4/4] Launching backend + frontend...

REM --- Backend window (Django on all interfaces, port 8000) ---
start "eJoutia Backend" cmd /k "cd /d "%~dp0backend" && python manage.py runserver 0.0.0.0:8000"

REM Give the backend a moment to boot.
timeout /t 3 /nobreak >nul

REM --- Frontend window (Expo / Metro) ---
REM --clear resets the cache; the QR code will appear in this window.
start "eJoutia Expo" cmd /k "cd /d "%~dp0frontend" && npx expo start --clear"

echo.
echo Two windows opened:
echo   1) eJoutia Backend  - Django API (leave it running)
echo   2) eJoutia Expo     - scan the QR code with the Expo Go app
echo.
echo If the QR does not appear, wait ~30s for Metro to start.
echo You can also open Expo Go and enter this URL manually:
echo     exp://192.168.11.103:8081
echo.
echo NOTE: your phone and this PC must be on the SAME Wi-Fi network.
echo If the app cannot reach the API, update the IP in
echo   frontend\src\services\api.js  (API_BASE_URL)
echo to match this PC's Wi-Fi address.
echo.
pause
