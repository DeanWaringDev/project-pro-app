@echo off
echo Getting Android Debug Certificate SHA-1 Fingerprint...
echo.

keytool -list -v -alias androiddebugkey -keystore "%USERPROFILE%\.android\debug.keystore" -storepass android -keypass android

echo.
echo Copy the SHA1 fingerprint from above and paste it into Google Cloud Console
echo when creating the Android OAuth client ID.
echo.
pause