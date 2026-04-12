@echo off
echo ========================================
echo Phishing Detector - Test Runner
echo ========================================
echo.
cd /d "%~dp0"
py continuous_phishing_test.py
pause
