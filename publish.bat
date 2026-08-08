@echo off
rem ===========================================================================
rem  Legt alles, was veroeffentlicht wird, in das Unterverzeichnis publish\.
rem
rem  Zum Doppelklicken gedacht. Braucht weder Node noch npm install noch sonst
rem  eine Einrichtung - kopiert wird mit robocopy, das zu Windows gehoert.
rem
rem  %~dp0 ist das Verzeichnis DIESER Datei, nicht das Arbeitsverzeichnis.
rem  Beim Doppelklick ist das dasselbe, beim Aufruf aus einer anderen Konsole
rem  nicht. Gleiches Prinzip wie paths.mjs bei den Node-Werkzeugen.
rem
rem  Kopiert wird nach Positivliste - was hier nicht steht, kommt nicht mit.
rem  Deshalb bleibt ein .git in publish\ unangetastet, und dev\, CLAUDE.md,
rem  README.md, das PDF sowie diese Batchdateien bleiben zurueck.
rem
rem  Doku: dev\docs\VEROEFFENTLICHEN.md
rem ===========================================================================

setlocal

set "QUELLE=%~dp0"
set "ZIEL=%~dp0publish"

echo.
echo   byzz 11 - Was ist neu   ^|   Veroeffentlichung vorbereiten
echo   ==========================================================
echo.
echo   Quelle:  %QUELLE%
echo   Ziel:    %ZIEL%
echo.

rem --- Vollstaendigkeit der Quelle pruefen -----------------------------------
if not exist "%QUELLE%index.html"        goto :fehlt_index
if not exist "%QUELLE%readme.txt"        goto :fehlt_readme
if not exist "%QUELLE%assets"            goto :fehlt_assets
if not exist "%QUELLE%.github\workflows" goto :fehlt_github

if not exist "%ZIEL%" mkdir "%ZIEL%"

rem --- assets\ und .github\ spiegeln ----------------------------------------
rem  /MIR entfernt im Ziel, was in der Quelle fehlt. Geloeschte Bilder bleiben
rem  also nicht als Leichen zurueck. Gespiegelt werden NUR diese beiden
rem  Unterverzeichnisse - publish\ selbst wird nie gespiegelt, sonst wuerde
rem  ein dort angelegtes .git mitgeloescht.
echo   [1/4] assets\  wird gespiegelt ...
robocopy "%QUELLE%assets" "%ZIEL%\assets" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto :fehler_kopie

echo   [2/4] .github\ wird gespiegelt ...
robocopy "%QUELLE%.github" "%ZIEL%\.github" /MIR /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto :fehler_kopie

echo   [3/4] index.html ...
copy /Y "%QUELLE%index.html" "%ZIEL%\" >nul
if errorlevel 1 goto :fehler_kopie

echo   [4/4] readme.txt ...
copy /Y "%QUELLE%readme.txt" "%ZIEL%\" >nul
if errorlevel 1 goto :fehler_kopie

rem --- Bericht --------------------------------------------------------------
for /f %%N in ('dir /s /b /a-d "%ZIEL%" 2^>nul ^| find /c /v ""') do set "ANZAHL=%%N"

echo.
echo   Fertig. %ANZAHL% Dateien liegen in publish\.
echo.
echo   Nicht mitgekommen (gehoert nicht ins Repository):
echo     dev\  .claude\  CLAUDE.md  README.md  byzz-11-was-ist-neu.pdf
echo     publish.bat  pdf.bat
echo.

if exist "%ZIEL%\.git" goto :ist_repo

echo   publish\ ist noch kein Repository. Einmalig einrichten:
echo.
echo     cd /d "%ZIEL%"
echo     git init -b main
echo     git remote add origin https://github.com/orangedentalGit/view.git
echo     git add -A
echo     git commit -m "Deck aktualisiert"
echo     git push -u origin main --force
echo.
echo   Danach im Repo einmal pruefen: Settings - Pages - Source auf
echo   "GitHub Actions" stellen.
goto :ende

:ist_repo
echo   Naechster Schritt:
echo.
echo     cd /d "%ZIEL%"
echo     git status                     (erst ansehen, was sich geaendert hat)
echo     git add -A
echo     git commit -m "Deck aktualisiert"
echo     git push
echo.
echo   Haengt das Deployment danach in "deployment_queued", hilft ein
echo   Re-run unter Actions. Siehe dev\docs\VEROEFFENTLICHEN.md.
goto :ende

rem --- Fehlerfaelle ---------------------------------------------------------
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
echo   Ohne den Workflow veroeffentlicht GitHub Pages nichts Neues.
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
