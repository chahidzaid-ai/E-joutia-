/@echo off
REM Starts the Django API so your phone (Expo Go) can reach it over Wi-Fi.
cd /d "%~dp0backend"
echo Starting Django backend on http://192.168.11.103:8000 ...
python manage.py runserver 0.0.0.0:8000
