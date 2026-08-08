# Werkzeuge

Alles in `dev/build/` — bis auf zwei Ausnahmen, die oben liegen. **Zum Vorführen wird
nichts davon gebraucht**, nur zum Ändern.

## Die beiden Skripte auf oberster Ebene

`publish.bat` und `pdf.bat` sind zum Doppelklicken da und liegen deshalb als einzige
Werkzeuge in der Projektwurzel. Das bricht bewusst mit der Regel „alles
Nicht-Auslieferbare unter `dev/`": Was man alle paar Monate einmal braucht, findet man
nicht, wenn es drei Ebenen tief liegt.

| | |
|---|---|
| `publish.bat` | Füllt `publish/` mit allem, was online geht. Kopiert mit `robocopy` — **kein Node, kein `npm install`**, läuft also auch auf einem frisch aufgesetzten Rechner. Details: [VEROEFFENTLICHEN.md](VEROEFFENTLICHEN.md) |
| `pdf.bat` | Ruft `dev/build/pdf.mjs` auf. Prüft vorher, ob Node und die Pakete da sind, und sagt sonst im Klartext, was fehlt — sonst blitzt beim Doppelklick nur kurz ein Fenster auf. Argumente werden durchgereicht: `pdf.bat --klein` |

Beide benutzen `%~dp0`, also das Verzeichnis der Batchdatei — nicht das
Arbeitsverzeichnis. Dasselbe Prinzip wie `paths.mjs` bei den Node-Werkzeugen, aus
demselben Grund (siehe [FALLSTRICKE.md](FALLSTRICKE.md) §11).

> Batchdateien brauchen **CRLF**-Zeilenenden. Wer sie mit einem Editor bearbeitet, der
> LF schreibt, bekommt schwer deutbare Fehler bei `goto` und mehrzeiligen Blöcken.
> Ebenso: keine Umlaute in den Bildschirmausgaben — die Windows-Konsole zeigt sie je
> nach Codepage als Kauderwelsch. Deshalb steht dort durchgehend `ue`, `oe`, `ae`.

## Einmal einrichten

```bash
cd dev/build
npm install
```

Zieht `sharp` (Bilder), `ffmpeg-static` (Video), `qrcode`, `adm-zip` und `puppeteer-core`.
Puppeteer lädt **keinen** eigenen Browser — die Skripte suchen Chrome bzw. Edge an den
üblichen Windows-Pfaden.

Nur `npm install` ist an das Verzeichnis gebunden. Die Skripte selbst leiten ihre Pfade
über `paths.mjs` aus dem eigenen Ort ab, nicht aus dem Arbeitsverzeichnis — sie laufen
also genauso als `node dev/build/shot.mjs` von der Projektwurzel aus. Die Aufrufe unten
sind der Kürze halber so notiert, als stünde man in `dev/build/`.

### `paths.mjs`

Eine Datei, in der jeder Projektpfad genau einmal steht: `ROOT`, `INDEX`, `ASSETS`,
`DEV`, `DOCS`, `SCREENSHOTS`, `PPTX`, `BUILD`, `SLIDES`, `SHOTS`. Kein Skript baut
Pfade selbst zusammen. Zieht der Werkzeugordner wieder um, ändert sich dort eine Zeile.

`PPTX` zeigt auf eine Datei, die es nicht mehr gibt — der Eintrag bleibt als
Erinnerung, wohin die `.pptx` gehört, falls sie für `prepare-video.mjs` noch einmal
gebraucht wird.

### `deck-session.mjs`

Dasselbe für die Fernsteuerung des fertigen Decks: Chrome starten, `index.html` unter
`file://` laden, den Bootvorgang abwarten, Folien anfahren. `shot.mjs` und `pdf.mjs`
teilen sich diese vier Funktionen — `launch()`, `openDeck()`, `gotoSlide()`,
`fragmentCount()`/`nextFragment()`.

Dort stecken die Wartezeiten und Zustandsabfragen, die sich über Monate eingependelt
haben: warten auf `BYZZ.slideCount() > 0` **und** `#boot.is-done`, und nach jedem `go()`
gegen `BYZZ.current()` prüfen statt blind zu warten. Wer daran etwas ändert, ändert es
für beide Werkzeuge — das ist der Zweck.

---

## Abnahme

```bash
node verify.mjs
```

Fährt fünf Schritte durch und meldet am Ende gesammelt (bricht nicht beim ersten Fehler ab —
man will nach einem Lauf wissen, was *alles* offen ist):

| Schritt | Skript | Was geprüft wird |
|---|---|---|
| Montage | `assemble.mjs` | `index.html` aus `dev/build/slides/` zusammensetzen |
| Folien und Layout | `shot.mjs --frag` | alle Folien fotografieren, Layout prüfen |
| Rahmenfunktionen | `test-shell.mjs` | Skalierung (Rahmen passt, Bühne deckt), Übersicht, Navigation, Vollbild |
| Referentenansicht | `test-presenter.mjs` | Popup, Notizen (nur dort, dauerhaft), Timer, Tastenbrücke, `B` |
| Kaltstart | `test-coldstart.mjs` | Ordner an fremden Pfad kopieren und dort starten |

> Wer nur Text geändert hat, sollte `verify.mjs` **nicht** blind laufen lassen — der erste
> Schritt ist die Montage, und die überschreibt Handarbeit in `index.html`. Dann lieber
> einzeln: `node shot.mjs`.

---

## `shot.mjs` — der visuelle Prüfstand

```bash
node shot.mjs                # alle Folien
node shot.mjs 15             # nur Folie 15
node shot.mjs 12 19          # nur diese beiden
node shot.mjs --frag         # mehrstufige Folien mit jedem Schritt einzeln
node shot.mjs --frag 18      # Folie 18, alle drei Schritte
node shot.mjs --trace        # zusätzlich jeden go/next/prev-Aufruf mitschreiben
```

Lädt `index.html` unter echtem `file://` in 1920 × 1080, legt JPEGs in `dev/build/shots/`
ab und prüft je Folie:

- **Überlauf** über den Bühnenrand
- **Logo-Schutzzone** (x 100–372, y 948–1034)
- **Bildskalierung** über 1,15× der nativen Breite
- **Konsolenfehler** und fehlgeschlagene Dateiladungen

Die vier Befunde entstehen im DOM, nicht am Bild — die Aufnahmen dienen allein der
Sichtkontrolle. Deshalb JPEG q88 statt PNG: gleiche Beurteilbarkeit, ein Fünftel des
Platzes (~13 MB statt 62 MB je Lauf). `shots/` wird bei **jedem** Lauf gelöscht und neu
geschrieben; nichts darin ist dauerhaft. `npm run clean` räumt es zwischendurch weg,
zusammen mit `frames/` und `tmp-video/`.

Die Ausgabe zeigt je Folie den Zustand `[i=… t=… f=…]` — Index, Ziel, Fragmentschritt.
Weicht `i` von der erwarteten Folie ab, stimmt etwas mit der Navigation nicht.

`--trace` ist das Werkzeug für „das Deck springt woandershin, als es soll": es protokolliert
jeden Navigationsaufruf mit Aufrufer und Zustand. Genau damit wurde der doppelte
Vorlade-Start gefunden.

---

## `pdf.mjs` — das Deck als PDF

```bash
node pdf.mjs                  # byzz-11-was-ist-neu.pdf auf oberster Ebene
node pdf.mjs --klein          # einfach statt doppelt aufgelöst, kleinere Datei
node pdf.mjs --out <pfad>     # anderer Zielort
```

Eine Seite je Folienzustand, ohne Übergänge: **38 Seiten aus 34 Folien**, weil die beiden
Fragmentfolien (12 und 18) jede Aufbaustufe einzeln bekommen. Seitenformat 1920 × 1080 px
(= 1440 × 810 pt), randlos 16:9 — im Acrobat als Vollbild durchblätterbar, damit auch ein
brauchbarer Ersatz, wenn im Meeting kein Browser zur Verfügung steht.

### Warum fotografiert und nicht gedruckt wird

`index.html` direkt zu drucken wäre naheliegend und geht schief: Chrome lässt im Druckpfad
`backdrop-filter` weg, rechnet Blur anders und stellt `<video>` überhaupt nicht dar. Aurora,
Lichtschein und die beiden Videofolien kämen kaputt heraus. Deshalb nimmt `pdf.mjs` jede
Folie wie `shot.mjs` auf, schreibt eine Zwischendatei mit einer Seite je Bild und lässt
Chrome **die** drucken. Jede Seite ist damit pixelgleich mit dem Beamerbild.

Preis: der Folientext ist Bild, nicht durchsuchbarer Text. Bei einem Deck aus ganzseitigen
Screenshots und Farbverläufen ist das der richtige Tausch.

Es kommt **keine** neue Abhängigkeit dazu — Chrome druckt selbst (`page.pdf()`), und
`puppeteer-core` liegt ohnehin hier.

### Auflösung

Aufgenommen wird mit doppeltem Gerätefaktor: in der 1920 × 1080-Seite sitzt ein
3840 × 2160 großes JPEG. Chrome reicht es unverändert durch (`/DCTDecode`), rechnet also
nichts herunter — beim Hineinzoomen und im Ausdruck bleibt es scharf. Das kostet Platz:

| Aufruf | Bild je Seite | Datei |
|---|---|---|
| `node pdf.mjs` | 3840 × 2160 | 20,1 MB |
| `node pdf.mjs --klein` | 1920 × 1080 | 5,4 MB |

Zum Verschicken per Mail ist `--klein` die vernünftigere Wahl.

### Standbilder der beiden Videos

Die Videos laufen in Endlosschleife; ohne Zutun entschiede der Zufall, welcher Moment im
PDF landet. `pdf.mjs` hält sie deshalb an und setzt sie auf eine feste Zeit. Die Tabelle
`STILLS` oben im Skript hält fest, auf welche und warum — abgetastet, nicht geraten:

- **`dvt-viewer.mp4` → Frame 1.** Zeigt bereits die Vier-Panel-Ansicht mit koloriertem
  3D-Schädel, also genau die Aussage der Folie.
- **`model-viewer.mp4` → 8 s.** Frame 1 ist ein leeres Fenster mit „Lade …"-Feld — beim
  Zuschnitt in `prepare-video.mjs` ist ein Rest des Ladezustands stehen geblieben. Ab 0,5 s
  steht der Oberkiefer, bei 8 s liegen beide Kiefer in Okklusion. Das ist das Bild, das
  Bildunterschrift und Folientext behaupten.

Kommen weitere Videos dazu, gehören sie in `STILLS`. Der Voreinstellungswert ist Frame 1.

### Nachsehen, was wirklich in der Datei steht

Die Seiten liegen als JPEG im PDF und lassen sich ohne Zusatzwerkzeug herausholen — nützlich,
wenn man eine einzelne Seite beurteilen will, ohne einen Reader zu öffnen:

```bash
node -e "
const fs=require('fs'),b=fs.readFileSync('byzz-11-was-ist-neu.pdf'),s=b.toString('latin1');
const o=[];const re=/\/Subtype\s*\/Image[\s\S]{0,400}?stream\r?\n/g;let m;
while((m=re.exec(s))){const a=m.index+m[0].length,e=s.indexOf('endstream',a);
  if(s.slice(m.index,a).includes('DCTDecode'))o.push([a,e]);}
const n=17;                                    // gewünschte Seite
fs.writeFileSync('seite-'+n+'.jpg',b.subarray(...o[n-1]));console.log(o.length+' Seiten')"
```

---

## Assets neu erzeugen

Nur nötig, wenn sich Quellmaterial ändert.

```bash
node prepare-images.mjs   # dev/screenshots/*.jpg  → assets/img/*.webp + *.soft.jpg
node prepare-video.mjs    # .pptx        → assets/video/*.mp4      [Quelle entfernt]
node embed-fonts.mjs      # Google Fonts → assets/css/fonts.css    [braucht Internet]
node make-qr.mjs          # Store-URLs   → assets/img/qr-*.svg
```

Oder alles: `npm run assets`

> **`npm run assets` läuft nicht mehr durch.** Die Kette ruft an zweiter Stelle
> `prepare-video.mjs` auf, und dessen Quelle — die `.pptx` — ist aus `dev/` entfernt.
> Das Skript bricht mit einem Hinweis ab, `npm` stoppt daraufhin die Kette, und
> `fonts` und `qr` laufen gar nicht erst an. Die drei anderen deshalb einzeln
> aufrufen (`npm run images`, `npm run fonts`, `npm run qr`).

### `prepare-images.mjs`

Die `PLAN`-Tabelle oben im Skript ist die Steuerung: Datei plus gewünschte Anzeigebreite.
Das Skript deckelt auf 1,15× der nativen Breite und meldet, wo es gedeckelt hat.

Erzeugt je Bild zwei Dateien:
- `name.webp` — WebP q92, die scharfe Fassung
- `name.soft.jpg` — 44 px breit, leicht weichgezeichnet. Trägt Tiefenübergang **und**
  Lichtschein hinter dem Panel.

WebP statt PNG oder JPEG: Die Vorlagen mischen feinen UI-Text (JPEG-Artefakte an
Buchstabenkanten wären auf dem Beamer sichtbar) mit verrauschten Röntgenflächen (die PNG
auf 7,4 MB aufblähen). WebP bedient beides; Chrome und Edge sind das einzige Ziel.

### `prepare-video.mjs` — läuft derzeit nicht

Holt `media1.mp4` und `media2.mp4` aus `dev/byzz v11 - Was ist neu.pptx`, schneidet zu,
entfernt die Tonspur und kodiert neu.

```bash
node prepare-video.mjs --probe   # nur Einzelbilder nach dev/build/frames/ für die Schnittsuche
```

Die Schnittpunkte stehen als Kommentar im Skript, samt Begründung — `media2` beginnt mit
einem Ladebalken („1 / 450 · 0 %"), der in einer Endlosschleife nach Fehler aussieht.

**Die `.pptx` ist aus `dev/` entfernt.** Das Skript prüft das beim Start und bricht mit
einem Hinweis ab, statt tief in `adm-zip` zu scheitern. Das ist kein Problem: Die beiden
fertigen Loops liegen als `assets/video/model-viewer.mp4` und `assets/video/dvt-viewer.mp4`
im Deck und werden ausgeliefert. Skript samt Schnittpunkten und `adm-zip`-Abhängigkeit
bleibt liegen — soll an den Videos noch einmal etwas geändert werden, legt man die `.pptx`
an den Ort zurück, den `PPTX` in `paths.mjs` nennt, und alles läuft wie zuvor.

### `embed-fonts.mjs`

Lädt Familjen Grotesk, Inter und IBM Plex Mono von Google Fonts, beschränkt auf die Subsets
`latin` und `latin-ext`, und schreibt sie Base64-kodiert nach `assets/css/fonts.css`.
Entdoppelt dabei nach URL — sonst wäre dieselbe variable Datei mehrfach eingebettet.

### `make-qr.mjs`

Die beiden Store-Adressen stehen oben im Skript. Ausgabe als SVG (nicht PNG), damit die
Modulkanten beim Skalieren scharf bleiben — ein weichgezeichneter QR-Code wird von
Handykameras schlechter erkannt.

---

## Montage

```bash
node assemble.mjs           # index.html neu zusammensetzen
node assemble.mjs --check   # nur berichten, nichts schreiben
```

Setzt `index.html` aus den Teildateien in `dev/build/slides/` zusammen. Die Reihenfolge steht in
`ORDER` oben im Skript und ist die einzige Wahrheit darüber, welche Folie an welcher Stelle
liegt. Ersetzt wird alles zwischen `<!-- SLIDES:START -->` und `<!-- SLIDES:END -->`.

⚠ **Überschreibt Handarbeit in `index.html`.** Siehe
[FOLIEN-BEARBEITEN.md](FOLIEN-BEARBEITEN.md#erst-die-wichtigste-entscheidung-wo-bearbeiten).

### Sind Teildateien und `index.html` deckungsgleich?

`--check` beantwortet diese Frage **nicht** — es zählt nur Folien je Teildatei und
schaut `index.html` überhaupt nicht an ([FALLSTRICKE.md §9](FALLSTRICKE.md)). Wer
wissen will, ob jemand direkt in `index.html` gearbeitet hat, montiert gegen eine
Sicherungskopie und vergleicht:

```bash
cd dev/build
cp ../../index.html /tmp/index.before.html
node assemble.mjs > /dev/null
diff /tmp/index.before.html ../../index.html && echo "deckungsgleich"
```

Kommt eine Abweichung, steckt sie in `index.html` und **nicht** in `slides/` — dann die
Zeilen aus dem Diff in die passende Teildatei zurückspielen, sonst räumt der nächste
Abnahmelauf sie weg. Die Sicherungskopie ist der Rückweg, falls etwas schiefgeht.

Vor jedem größeren Eingriff einmal laufen lassen. Es kostet zwei Sekunden und ist die
einzige Prüfung, die den in §9 beschriebenen stillen Verlust vorher findet.

---

## Inventar

```bash
node inventory.mjs           # schreibt die Folientabelle nach dev/docs/INHALT.md
node inventory.mjs --print   # nur ausgeben
```

Liest `index.html` und schreibt Nummer, Titel, Abschnitt, Typ, Fragmentzahl, verwendetes
Material und Notizlänge in die Tabelle in `dev/docs/INHALT.md`. **Nach jeder Folienänderung
laufen lassen** — dann kann die Doku nicht von der Wirklichkeit abweichen.

---

## Kontaktbogen bauen

Kein eigenes Skript, aber nützlich, um alle Folien auf einen Blick zu beurteilen:

```bash
node -e "
const sharp=require('sharp'),fs=require('fs');
(async()=>{const f=fs.readdirSync('shots').filter(x=>x.endsWith('.jpg')).sort();
const c=5,w=384,h=216;const comp=[];
for(let i=0;i<f.length;i++)comp.push({input:await sharp('shots/'+f[i]).resize(w-8,h-8,{fit:'fill'})
  .extend({top:4,bottom:4,left:4,right:4,background:'#d8d2c8'}).toBuffer(),
  left:(i%c)*w,top:Math.floor(i/c)*h});
await sharp({create:{width:c*w,height:Math.ceil(f.length/c)*h,channels:3,background:'#d8d2c8'}})
  .composite(comp).jpeg({quality:88}).toFile('kontaktbogen.jpg');console.log('kontaktbogen.jpg')})()"
```

---

## Warum Puppeteer und nicht die Browser-Erweiterung

Die Chrome-Erweiterung verweigert `file://`-URLs. Da genau dieser Pfad das Abnahmekriterium
ist, laufen alle Prüfungen über `puppeteer-core` mit dem lokal installierten Chrome —
ohne `--allow-file-access-from-files`, also exakt unter den Bedingungen eines Doppelklicks.

Nichts unter `dev/` gehört zur Auslieferung — deshalb liegen die Werkzeuge seit dem
Umzug dort und nicht mehr auf oberster Ebene. Weitergegeben werden `index.html`,
`assets/` und `readme.txt`.

Den Löwenanteil des Arbeitsordners belegt `dev/build/node_modules/` (~131 MB, davon
80 MB `ffmpeg-static` und 20 MB `sharp`-Binärdateien). Das bleibt bewusst liegen:
`ffmpeg-static` und `sharp` hängen nur an den Einmal-Skripten, werden aber gebraucht,
sobald doch noch Screenshots nachkommen. Wer den Ordner nur archivieren will, kann
`node_modules/` gefahrlos löschen — `npm install` stellt es aus der `package-lock.json`
wieder her.

Die zweite große Datei war lange die `.pptx` (45 MB). Sie ist entfernt; was aus ihr
gebraucht wurde, liegt fertig in `assets/video/`.
