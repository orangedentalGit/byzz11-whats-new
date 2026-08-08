@echo off
rem ===========================================================================
rem  Erzeugt byzz-11-was-ist-neu.pdf aus index.html.
rem
rem  Zum Doppelklicken gedacht. Anders als publish.bat braucht das hier eine
rem  eingerichtete Werkzeugkette: Node.js, die Pakete unter dev\build und einen
rem  installierten Chrome oder Edge. Fehlt etwas davon, wuerde bei einem
rem  Doppelklick nur kurz ein Fenster aufblitzen - deshalb wird vorher geprueft
rem  und im Klartext gesagt, was fehlt.
rem
rem  Die eigentliche Arbeit macht dev\build\pdf.mjs. Argumente werden
rem  durchgereicht, aus einer Konsole geht also auch:  pdf.bat --klein
rem
rem  Doku: dev\docs\WERKZEUGE.md
rem ===========================================================================

setlocal

echo.
echo   byzz 11 - Was ist neu   ^|   PDF erzeugen
echo   ========================================
echo.

rem --- Voraussetzungen pruefen ----------------------------------------------
if not exist "%~dp0index.html" goto :fehlt_index

where node >nul 2>&1
if errorlevel 1 goto :kein_node

if not exist "%~dp0dev\build\node_modules" goto :keine_pakete

rem --- Lauf -----------------------------------------------------------------
echo   Das Deck wird Seite fuer Seite fotografiert und dann gedruckt - nicht
echo   direkt gedruckt. Chrome laesst im Druckpfad sonst Blur und Video weg.
echo.
echo   Das dauert einige Minuten. Ein Chrome-Fenster oeffnet und schliesst
echo   sich dabei mehrfach - das gehoert dazu, bitte nicht eingreifen.
echo.

node "%~dp0dev\build\pdf.mjs" %*
if errorlevel 1 goto :fehler_lauf

echo.
rem  Ohne Argumente schreibt pdf.mjs nach byzz-11-was-ist-neu.pdf, mit --out
rem  woandershin - dann keinen falschen Dateinamen behaupten. Den echten Pfad
rem  hat pdf.mjs eine Zeile darueber selbst ausgegeben ("PDF -> ...").
if not "%~1"=="" goto :fertig_mit_argument

echo   Fertig: byzz-11-was-ist-neu.pdf
echo.
echo   Das PDF ist die statische Fassung des Decks. Es wird NICHT mit
echo   veroeffentlicht - publish.bat laesst es bewusst weg, weil index.html
echo   nicht darauf verweist. Weitergegeben wird es separat.
goto :ende

:fertig_mit_argument
echo   Fertig. Der Zielpfad steht oben in der Zeile "PDF ->".
goto :ende

rem --- Fehlerfaelle ---------------------------------------------------------
:fehlt_index
echo   ABBRUCH: index.html nicht gefunden.
echo   Liegt diese Batchdatei wirklich im Projektverzeichnis?
goto :ende

:kein_node
echo   ABBRUCH: node wurde nicht gefunden.
echo.
echo   Fuer das PDF wird Node.js gebraucht (fuer das Vorfuehren des Decks
echo   nicht - dafuer genuegt weiterhin ein Doppelklick auf index.html).
echo.
echo   Node.js gibt es unter https://nodejs.org - danach dieses Fenster
echo   schliessen und pdf.bat erneut starten.
goto :ende

:keine_pakete
echo   ABBRUCH: die Werkzeuge sind noch nicht eingerichtet.
echo   Es fehlt: dev\build\node_modules
echo.
echo   Einmalig nachholen:
echo.
echo     cd /d "%~dp0dev\build"
echo     npm install
echo.
echo   Danach pdf.bat erneut starten.
goto :ende

:fehler_lauf
echo.
echo   ABBRUCH: die PDF-Erzeugung ist fehlgeschlagen.
echo.
echo   Haeufigste Ursache: weder Chrome noch Edge an den ueblichen Pfaden
echo   gefunden, oder das PDF ist gerade in einem Betrachter geoeffnet und
echo   laesst sich nicht ueberschreiben.
echo   Die Meldung darueber sagt genaueres.
goto :ende

:ende
echo.
pause
endlocal
