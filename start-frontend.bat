@echo off
REM Starts the Expo dev server. Scan the QR code with Expo Go on your phone.
REM Your phone and this PC must be on the SAME Wi-Fi network.
cd /d "%~dp0frontend"
echo Starting Expo... scan the QR code with the Expo Go app.
npx expo start
