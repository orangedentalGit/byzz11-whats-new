# byzz 11 — „Was ist neu"

Fullscreen-Präsentation für den Termin beim Kunden. 34 Folien, HTML, läuft offline.

**Vorführen:** `index.html` doppelklicken. Bedienung steht in [`readme.txt`](readme.txt).

---

## Was das ist

Ein eigenständiges Präsentations-Deck, das per Doppelklick startet — ohne Server, ohne Node,
ohne Internet. Der Ordner lässt sich als Ganzes weitergeben oder auf einen USB-Stick kopieren.

| | |
|---|---|
| Folien | 34, in vier Abschnitten |
| Größe | 3,0 MB (`index.html` + `assets/`) |
| Ziel | Chrome und Edge unter Windows |
| Bühne | Inhalt fix 1920 × 1080, Hintergrund füllt jedes Fensterformat |
| Besonderheiten | Referentenansicht, Folienübersicht, mehrstufige Folien, zwei stumme Videos |

---

## Dokumentation

| Datei | Wofür |
|---|---|
| [`readme.txt`](readme.txt) | **Bedienung** — für den, der vorträgt. Sonst nichts. |
| [`dev/docs/folien-bearbeiten.md`](dev/docs/folien-bearbeiten.md) | **Hier anfangen**, wenn du etwas ändern willst. Kochbuch für Text, Bilder, neue Folien. |
| [`dev/docs/design-system.md`](dev/docs/design-system.md) | Was das Stylesheet anbietet: Raster, Farben, Schrift, Bausteine, Bildtabelle, Piktogramme. |
| [`dev/docs/fallstricke.md`](dev/docs/fallstricke.md) | Was beim Bauen schiefging, mit Messwerten. Vor größeren Eingriffen lesen. |
| [`dev/docs/architektur.md`](dev/docs/architektur.md) | Wie es funktioniert: Bühne, Zustandsmaschine, Bewegung, Referentenansicht. |
| [`dev/docs/werkzeuge.md`](dev/docs/werkzeuge.md) | Alles unter `dev/build/`: Prüfstand, PDF-Ausgabe, Bildaufbereitung, Montage. |
| [`dev/docs/inhalt.md`](dev/docs/inhalt.md) | Foliengliederung, Quellen, inhaltliche Festlegungen, offene Punkte. |
| [`dev/docs/veroeffentlichen.md`](dev/docs/veroeffentlichen.md) | Das Deck online stellen (GitHub Pages) — Einrichtung, Prüfschritte, was tun, wenn das Deployment hängt. |
| [`dev/docs/agenten-briefing.md`](dev/docs/agenten-briefing.md) | Vorlage, um Folien parallel von mehreren Agenten bauen zu lassen. |

---

## Aufbau

```
index.html            das Deck — Bühne, Symbole, alle 34 Folien
readme.txt            Bedienung
byzz-11-was-ist-neu.pdf   dieselben Folien statisch, 38 Seiten     [erzeugt]
README.md             diese Datei
CLAUDE.md             Arbeitsregeln für Claude Code

publish.bat           Doppelklick: Deck-Fassung ohne dev\ zum Weitergeben
pdf.bat               Doppelklick: erzeugt das PDF neu
.gitignore            was nicht ins Repository gehört

.claude/
  settings.json       Projektrechte

.github/
  workflows/pages.yml der GitHub-Actions-Workflow, der die Seite baut

publish/              von publish.bat erzeugt, nicht im Repository  [erzeugt]

assets/
  css/fonts.css       Schriften, Base64 eingebettet           [erzeugt]
  css/deck.css        Design-System und Folien-Vorlagen
  js/deck.js          Zustand, Navigation, Skalierung
  js/transitions.js   Bewegungslogik
  js/presenter.js     Referentenansicht — die Sprechnotizen stehen nur dort
  js/overview.js      Folienübersicht
  js/vendor/          GSAP 3.13
  img/                Screenshots und QR-Codes                [erzeugt]
  video/              zwei stumme Endlosschleifen             [erzeugt]
  brand/              Logos

dev/                  alles, was nur beim Bauen gebraucht wird
  build/              Werkzeuge — nur zum Ändern, nicht zum Vorführen
  docs/               Dokumentation
  screenshots/        Ausgangsbilder (Quelle, unverändert)
  design-system/      Logos im Original (Quelle)
  prompts/            Auftragstexte, chronologisch
```

Zum Weitergeben genügen `index.html`, `readme.txt`, `assets/` und `.github/` — genau das
kopiert `publish.bat` nach `publish/`. `dev/` ist Arbeitsmaterial und bleibt zurück.

Das PDF liegt daneben, gehört aber nicht dazu: Es ist die statische Fassung für alle, die
das Deck nur ansehen oder ausdrucken wollen. Neu erzeugt wird es per Doppelklick auf
`pdf.bat` — oder mit `node dev/build/pdf.mjs`
([werkzeuge.md](dev/docs/werkzeuge.md#pdfmjs--das-deck-als-pdf)).

**Folie 2 verlinkt das PDF von `data.orangedental.de`.** Die Datei dort gehört nicht zum
Build und wird von keinem Prüflauf erfasst. Nach Folienänderungen also nicht nur das PDF
neu erzeugen, sondern es auch dort hochladen — sonst verteilt der Link im Deck eine
veraltete Fassung ([veroeffentlichen.md](dev/docs/veroeffentlichen.md)).

---

## Veröffentlichen

Committen und pushen:

```bash
git status                      # erst ansehen, was sich geändert hat
git add -A
git commit -m "Deck aktualisiert"
git push
```

`.github/workflows/pages.yml` läuft bei jedem Push nach `main` und stellt das
Repository online: https://orangedentalgit.github.io/byzz11-whats-new/

Der Workflow packt mit `path: .` **alles** — auch `dev/` und die Markdown-Dateien.
Das ist so gewollt; wer etwas ablegt, das nicht nach außen soll, nimmt es in die
`.gitignore` auf. Einzelheiten in [veroeffentlichen.md](dev/docs/veroeffentlichen.md).

`publish.bat` erzeugt eine Deck-Fassung ohne `dev/` zum Weitergeben als Ordner —
kopiert werden `index.html`, `readme.txt`, `assets\` und `.github\`. Es ist nicht der
Weg ins Netz: Aus `publish/` heraus zu pushen würde `dev/` im Repository löschen.

`.github/workflows/pages.yml` liegt in genau der Struktur, die GitHub verlangt.
Workflows werden **nur** unter `.github/workflows/` erkannt; liegt die Datei woanders,
wird sie kommentarlos ignoriert und es passiert scheinbar gar nichts.

Was zu tun ist, wenn das Deployment in `deployment_queued` hängen bleibt, steht in
[veroeffentlichen.md](dev/docs/veroeffentlichen.md) — kurz: erneut anstoßen, das hilft
meistens.

---

## Schnellstart zum Ändern

```bash
cd dev/build
npm install                 # einmalig
node shot.mjs               # alle Folien fotografieren und Layout prüfen
node verify.mjs             # komplette Abnahme
```

Nur `npm install` braucht das Verzeichnis. Die Skripte selbst leiten ihre Pfade aus dem
eigenen Ort ab und laufen genauso als `node dev/build/shot.mjs` von der Wurzel aus.

Der wichtigste Satz für den Einstieg: **Folientexte stehen direkt in `index.html`**, jede
Folie in einer eigenen `<section class="slide">`, die Sprechnotizen darin in
`<template class="notes">`. Für eine Textkorrektur brauchst du kein Werkzeug.

Aber: `dev/build/assemble.mjs` überschreibt genau diesen Bereich wieder aus den Teildateien
in `dev/build/slides/` — und **`verify.mjs` ruft `assemble.mjs` mit auf.** Wer direkt in
`index.html` gearbeitet hat, spielt die Änderung vorher in die passende Datei unter
`dev/build/slides/` zurück, sonst räumt die Abnahme sie weg. Wann welcher Weg richtig ist, steht
in [folien-bearbeiten.md](dev/docs/folien-bearbeiten.md#erst-die-wichtigste-entscheidung-wo-bearbeiten).
