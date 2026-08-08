@echo off
rem  Erzeugt byzz-11-was-ist-neu.pdf aus index.html.
rem  Zum Doppelklicken; braucht Node.js, die Pakete unter dev\build und Chrome
rem  oder Edge. Die Voraussetzungen werden geprueft, damit bei einem Doppelklick
rem  nicht nur kurz ein Fenster aufblitzt.
rem
rem  Die Arbeit macht dev\build\pdf.mjs; Argumente werden durchgereicht.
rem  Doku: dev\docs\werkzeuge.md

setlocal

if not exist "%~dp0index.html" goto :fehlt_index

where node >nul 2>&1
if errorlevel 1 goto :kein_node

if not exist "%~dp0dev\build\node_modules" goto :keine_pakete

echo.
echo   Dauert einige Minuten. Chrome oeffnet und schliesst sich mehrfach.
echo.

node "%~dp0dev\build\pdf.mjs" %*
if errorlevel 1 goto :fehler_lauf

rem  Mit --out schreibt pdf.mjs woandershin - dann keinen festen Namen behaupten.
if not "%~1"=="" goto :fertig_mit_argument

echo.
echo   Fertig: byzz-11-was-ist-neu.pdf
goto :ende

:fertig_mit_argument
echo.
echo   Fertig. Der Zielpfad steht oben in der Zeile "PDF ->".
goto :ende

:fehlt_index
echo   ABBRUCH: index.html nicht gefunden.
echo   Liegt diese Batchdatei wirklich im Projektverzeichnis?
goto :ende

:kein_node
echo   ABBRUCH: node wurde nicht gefunden.
echo   Node.js gibt es unter https://nodejs.org
goto :ende

:keine_pakete
echo   ABBRUCH: dev\build\node_modules fehlt.
echo   Einmalig nachholen:  cd /d "%~dp0dev\build"  und  npm install
goto :ende

:fehler_lauf
echo.
echo   ABBRUCH: die PDF-Erzeugung ist fehlgeschlagen.
echo   Meist fehlt Chrome/Edge, oder das PDF ist gerade geoeffnet.
echo   Die Meldung darueber sagt genaueres.
goto :ende

:ende
echo.
pause
endlocal
