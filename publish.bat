@echo off
rem  Kopiert das Deck nach publish\ - index.html, readme.txt, assets\, .github\.
rem  Zum Doppelklicken; braucht nur robocopy, das zu Windows gehoert.
rem
rem  %~dp0 ist das Verzeichnis dieser Datei, nicht das Arbeitsverzeichnis.
rem  Doku: dev\docs\veroeffentlichen.md

setlocal

set "QUELLE=%~dp0"
set "ZIEL=%~dp0publish"

if not exist "%QUELLE%index.html"        goto :fehlt_index
if not exist "%QUELLE%readme.txt"        goto :fehlt_readme
if not exist "%QUELLE%assets"            goto :fehlt_assets
if not exist "%QUELLE%.github\workflows" goto :fehlt_github

if not exist "%ZIEL%" mkdir "%ZIEL%"

rem  /MIR entfernt im Ziel, was in der Quelle fehlt. Gespiegelt werden nur diese
rem  beiden Unterverzeichnisse - publish\ selbst nie, sonst wuerde ein dort
rem  angelegtes .git mitgeloescht.
robocopy "%QUELLE%assets" "%ZIEL%\assets" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto :fehler_kopie

robocopy "%QUELLE%.github" "%ZIEL%\.github" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto :fehler_kopie

copy /Y "%QUELLE%index.html" "%ZIEL%\" >nul
if errorlevel 1 goto :fehler_kopie

copy /Y "%QUELLE%readme.txt" "%ZIEL%\" >nul
if errorlevel 1 goto :fehler_kopie

for /f %%N in ('dir /s /b /a-d "%ZIEL%" 2^>nul ^| find /c /v ""') do set "ANZAHL=%%N"

echo.
echo   %ANZAHL% Dateien in publish\.
goto :ende

:fehlt_index
echo   ABBRUCH: index.html nicht gefunden.
echo   Liegt diese Batchdatei wirklich im Projektverzeichnis?
goto :ende

:fehlt_readme
echo   ABBRUCH: readme.txt nicht gefunden.
goto :ende

:fehlt_assets
echo   ABBRUCH: Verzeichnis assets\ nicht gefunden.
goto :ende

:fehlt_github
echo   ABBRUCH: .github\workflows\ nicht gefunden.
echo   Erwartet wird: %QUELLE%.github\workflows\pages.yml
goto :ende

:fehler_kopie
echo.
echo   ABBRUCH: Kopieren fehlgeschlagen.
echo   Ist publish\ vielleicht in einem anderen Programm geoeffnet?
goto :ende

:ende
echo.
pause
endlocal
