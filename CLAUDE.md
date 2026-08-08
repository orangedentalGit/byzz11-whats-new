# Arbeitsregeln

## Datei-Zugriff

- **Lesen:** im gesamten Dateisystem erlaubt (`C:`, `D:`, `E:`), ohne Rückfrage.
  Verzeichniswechsel und Inspektion überall zulässig — egal mit welchem Tool
  (Read/Glob/Grep, Bash, PowerShell).
- **Schreiben:** ausschließlich unterhalb von `D:\SourceAI\byzz-whats-new`.
  Einzige Ausnahme: das Session-Scratchpad-Verzeichnis für temporäre Dateien.
- Änderungen an fremden Projekten (z.B. `D:\SourceFlutter\*`) oder an
  System-/Config-Pfaden nur nach ausdrücklicher Aufforderung.

Die Beschränkung ist bewusst als Verhaltensregel umgesetzt, nicht als
`deny`-Regel — harte Deny-Regeln würden auch das Scratchpad blockieren.

**Geltungsbereich:** Diese Regel gilt nur für dieses Projekt. Sie ist keine
globale Einschränkung. Läuft Claude in einem anderen Verzeichnis, ist dort
das jeweilige Projektverzeichnis der normale Arbeits- und Schreibbereich.
In `~/.claude/settings.json` steht bewusst keine `deny`-Regel, die das
projektübergreifend verbieten würde.

## Werkzeug-Schritte

Build- und Werkzeugschritte innerhalb des Projekts nicht erfragen, sondern
ausführen: npm-Installationen unterhalb von `dev/build/`, Downloads von Schriften
und Bibliotheken, Bild- und Videokonvertierung, Extraktion aus vorhandenen
Dateien, Anlegen von Hilfsskripten. Inhaltliche und gestalterische
Weichenstellungen weiterhin vorab klären — gebündelt und früh.

---

# Projekt: byzz 11 — „Was ist neu"

Fullscreen-HTML-Präsentation für den Termin beim Kunden, 34 Folien, läuft per
Doppelklick auf `index.html`
offline ohne Server. Vollständige Dokumentation in `dev/docs/`.

**Für ein neues Deck nicht hier abschauen, sondern den Skill `create-slides`
nehmen** (`~/.claude/skills/create-slides/`). Dort steht der Weg als Vorschrift —
Auftragsklärung, Materialauswertung, Bühne, Prüfstand, Auslieferung — samt
lauffähiger Werkzeuge und einem Startgerüst. `dev/docs/` hier ist die *angewandte*
Fassung für genau dieses Deck: konkreter, aber mit byzz-Entscheidungen vermischt.
Ändert sich etwas an der allgemeinen Vorschrift, gehört es in den Skill; ändert sich
etwas an diesem Deck, hierher.

Alles Nicht-Auslieferbare liegt unter `dev/`: `dev/build/` (Werkzeuge),
`dev/docs/` (Dokumentation), `dev/screenshots/` (Bildquellen),
`dev/design-system/` (Logos im Original) und `dev/prompts/` (Auftragstexte).

Der alte PowerPoint-Entwurf (`dev/byzz v11 - Was ist neu.pptx`) ist entfernt.
Er war nur noch Quelle für die beiden Videos; die liegen fertig geschnitten in
`assets/video/`. `dev/build/prepare-video.mjs` kann deshalb nicht mehr laufen —
und mit ihm nicht mehr `npm run assets` als Kette (`dev/docs/werkzeuge.md`).
Braucht es die Videos noch einmal neu, muss die `.pptx` vorher zurück nach `dev/`.

Auf oberster Ebene steht damit nur noch, was auch weitergegeben wird:
`index.html`, `assets/`, `readme.txt`, `.github/`, `byzz-11-was-ist-neu.pdf` —
plus `README.md`, diese Datei, `.gitignore` und die beiden Doppelklick-Skripte.

Das **gesamte** Projektverzeichnis steht unter Versionskontrolle:
`orangedentalGit/byzz11-whats-new`. Nicht verfolgt werden `node_modules/`, `publish/`,
`dev/build/shots/` und das erzeugte PDF (`.gitignore`) — alles vier ist reproduzierbar.
`dev/screenshots/` ist bewusst **mit** im Repository, sonst hätte `prepare-images.mjs`
auf einer frischen Maschine keine Eingabe mehr.

`.github/workflows/pages.yml` liegt bewusst in genau der Struktur, die auch das
Repository braucht. Vorher lag die Datei unter `dev/deploy/` und musste beim
Release übersetzt werden — das ist zweimal schiefgegangen, jedes Mal ohne
Fehlermeldung (`dev/docs/veroeffentlichen.md`).

`publish.bat` und `pdf.bat` sind die **einzige Ausnahme** von der Regel, dass
Werkzeuge unter `dev/` liegen. Sie sollen ohne Suchen ins Auge fallen — das ist
ihr ganzer Zweck. Weitere Werkzeuge gehören weiterhin nach `dev/build/`.
`publish/` ist das erzeugte Verzeichnis und wird nie von Hand bearbeitet.

`publish.bat` ist **nicht der Weg ins Netz**, sondern erzeugt eine Deck-Fassung
ohne `dev/` zum Weitergeben als Ordner. Aus `publish/` heraus zu pushen würde
`dev/` im Repository löschen (`dev/docs/veroeffentlichen.md`).

Das PDF ist die statische Fassung des Decks (38 Seiten, Doppelklick auf `pdf.bat`
oder `node dev/build/pdf.mjs`). Es wird aus `index.html` erzeugt und nie von Hand
bearbeitet — nach Folienänderungen neu laufen lassen.

**Folie 2 verlinkt dieses PDF von `data.orangedental.de`.** Die dort liegende Datei
gehört nicht zum Build und wird von keinem Prüflauf erfasst. Nach Folienänderungen
also nicht nur `pdf.mjs` laufen lassen, sondern das Ergebnis auch dort hochladen —
sonst verteilt der Link im Deck eine veraltete Fassung
(`dev/docs/veroeffentlichen.md`).

## Vor dem Bearbeiten lesen

| Vorhaben | Pflichtlektüre |
|---|---|
| Folientext, Screenshot, neue Folie | `dev/docs/folien-bearbeiten.md` |
| Neue Bausteine, Farben, Typografie | `dev/docs/design-system.md` |
| Eingriff in `assets/js/` oder `deck.css` | `dev/docs/architektur.md` **und** `dev/docs/fallstricke.md` |
| Assets neu erzeugen, Prüfläufe | `dev/docs/werkzeuge.md` |
| Inhaltliche Fragen, „warum ist das so?" | `dev/docs/inhalt.md` |
| Folien parallel von Agenten bauen | `dev/docs/agenten-briefing.md` |
| Deck über GitHub Pages veröffentlichen | `dev/docs/veroeffentlichen.md` |

Nicht aus dem Gedächtnis arbeiten — die Dokumente enthalten gemessene Werte und
konkrete Fehler, die schon einmal Stunden gekostet haben.

## Harte Regeln

Diese Punkte sind nicht Stilfragen. Wer sie verletzt, macht das Deck kaputt —
teils so, dass es erst im Meeting auffällt.

1. **`file://` ist die Randbedingung.** Keine ES-Module, kein `import()`, kein
   `fetch()` auf lokale Dateien, kein `@font-face` mit Datei-URL, keine Iframes
   zwischen lokalen Dateien, kein `BroadcastChannel`/`localStorage` als Kanal.
   Alles davon ist gemessen blockiert (`dev/docs/fallstricke.md` §1).
2. **`dev/build/assemble.mjs` überschreibt `index.html`** zwischen den Markern
   `<!-- SLIDES:START -->` und `<!-- SLIDES:END -->` aus `dev/build/slides/`.
   Für Textkorrekturen direkt in `index.html` arbeiten und `assemble.mjs` dann
   **nicht** mehr aufrufen. `--check` zeigt gefahrlos, was passieren würde.
3. **Zustand nie aus dem DOM lesen.** Während eines Übergangs tragen zwei Folien
   `is-active`. Immer `BYZZ.current()` / `BYZZ.slideAt(n)`.
4. **Die Sperre `if (fired) return;` in `preload()` bleibt.** Ohne sie springt das
   Deck sechs Sekunden nach dem Start zurück auf Folie 1.
5. **Bilder nie über 1,15× ihrer nativen Breite** anzeigen. Panelhöhe aus dem
   nativen Seitenverhältnis rechnen, nicht schätzen.
6. **Logo-Schutzzone** x 100–372 / y 948–1034 bleibt frei. Inhalt zwischen
   y = 200 und y = 940.
7. **Blur-Budget einhalten:** Aurora nur als `radial-gradient`, maximal zwei
   geblurrte Ebenen, Radius ≤ 12 px, danach `filter: none`, `backdrop-filter`
   höchstens einmal pro Folie, kein Leerlauf-Wackeln.
8. **Bildquelle ist ausschließlich `dev/screenshots/`.** Die höher aufgelösten
   Screenshots aus der `.pptx` waren vom Auftraggeber ausdrücklich ausgeschlossen —
   die Frage stellt sich nicht mehr, seit die Datei entfernt ist. Sollte sie je
   zurückkommen: nicht eigenmächtig austauschen. Ausgenommen waren die beiden
   Videos, die längst in `assets/video/` liegen.
9. **Bestehende CSS-Klassen und Piktogramm-IDs verwenden.** Erfundene `#i-*`-IDs
   rendern als Leerfläche. Neue Klassen gehören ins Stylesheet **und** in
   `dev/docs/design-system.md`.
10. **Nichts erfinden.** Keine Zahlen, Dateiformate oder Funktionsumfänge, die
    nicht belegt sind. Lieber knapper formulieren.
11. **`#stage` und `#frame` nicht wieder zusammenlegen.** `#frame` ist der
    komponierte Bereich und immer exakt 1920 × 1080 — alle Folienkoordinaten
    beziehen sich darauf. `#stage` ist der sichtbare Bereich und wächst über
    `--stage-w` / `--stage-h` so weit, dass er nach der Skalierung jedes
    Fensterformat deckt. Hintergrundebenen (Aurora, Korn, Lichtzeichen) gehören
    in `#stage`, alles Komponierte in `#frame`. Fällt das zusammen, stehen bei
    jedem Format außer 16:9 wieder helle Balken am Rand.

## Nach jeder Änderung

```bash
node dev/build/shot.mjs        # alle Folien fotografieren + Layout prüfen
node dev/build/inventory.mjs   # Foliengliederung in dev/docs/inhalt.md fortschreiben
node dev/build/pdf.mjs         # statische Fassung nachziehen (nur wenn Folien sich änderten)
```

Soll die Änderung auch online: committen und nach `main` pushen — der Workflow
stellt das Repository selbst online (`dev/docs/veroeffentlichen.md`). `pdf.bat` macht
dasselbe wie `pdf.mjs` und prüft vorher die Voraussetzungen — beide Skripte sind
für den Doppelklick da, in der Konsole bleiben die `.mjs` der direktere Weg.

Die Skripte leiten ihre Pfade aus dem eigenen Ort ab (`dev/build/paths.mjs`), nicht
aus dem Arbeitsverzeichnis — sie laufen also aus jedem Verzeichnis. `cd dev/build`
ist bequem, aber nicht nötig. **Neue Werkzeuge importieren ihre Pfade aus `paths.mjs`
und bauen sie nicht selbst zusammen.** Wer das Deck fernsteuert, nimmt dafür
`dev/build/deck-session.mjs` und baut die Bootsequenz nicht noch einmal nach. Ein `resolve('..', …)` ist gegen das
Arbeitsverzeichnis aufgelöst und funktioniert nur zufällig — siehe
`dev/docs/fallstricke.md` §11.

Vor der Abgabe zusätzlich `node dev/build/verify.mjs` (Montage, Folien,
Rahmenfunktionen, Referentenansicht, Kaltstart) — und einmal wirklich
`index.html` doppelklicken.
Niemals über einen Dev-Server abnehmen: über `http://` funktionieren genau die
Dinge, die unter `file://` scheitern.

## Doku mitführen

Änderungen am Design-System, an der Engine oder an den Werkzeugen gehören in das
passende Dokument unter `dev/docs/`. Neue Stolperfallen nach `dev/docs/fallstricke.md`.
Die Tabelle in `dev/docs/inhalt.md` wird von `dev/build/inventory.mjs` erzeugt und
nicht von Hand gepflegt.

**Markdown-Dateinamen werden kleingeschrieben** — `architektur.md`, nicht
`ARCHITEKTUR.md`. Ausgenommen sind nur `CLAUDE.md` (wird nur unter diesem Namen
geladen) und `README.md` (GitHub-Konvention). Beim Umbenennen `git mv -f`
verwenden: Windows unterscheidet die Schreibweise nicht, Git und GitHub Pages schon.

**Keine Änderungsgeschichte im Quelltext.** Kommentare in `.bat`, `.mjs`, `.js`
und `.css` sagen, was der Code tut und warum er so aussieht — kein „seit dem
…geändert", keine Datumsangaben. Dafür ist Git da. Hintergrund und Historie
gehören in `dev/docs/`. Ebenso sparsam mit Konsolenausgaben: Ergebnis und Fehler,
sonst nichts.

`readme.txt` auf oberster Ebene enthält **ausschließlich die Bedienung** für den
Vortragenden. Dort keine Entwicklerhinweise ergänzen.
