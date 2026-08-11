# Fallstricke

Was beim Bauen tatsächlich schiefging, mit Messwerten. Wer hier vorher reinschaut, spart
sich die Stunden noch einmal.

---

## 1 · `file://` — was gemessen blockiert ist

Alles unten wurde in einer Wegwerf-Probe unter echtem `file://` in Chrome verifiziert,
**ohne** `--allow-file-access-from-files` (also so, wie ein Doppelklick es erzeugt).

| Test | Ergebnis |
|---|---|
| `location.origin` | `file://` — jede Datei eine eigene opaque origin |
| `fetch('probe.html')` | **blockiert** — CORS |
| `@font-face` aus `assets/fonts/` | **blockiert** — „A network error occurred" |
| `getImageData()` nach lokalem Bild | **blockiert** — Canvas ist tainted |
| `BroadcastChannel` | konstruierbar, aber **isoliert** — zwei Dateien erreichen sich nie |
| `localStorage` | schreibbar, aber pro Datei ein eigener Bereich — als Kanal unbrauchbar |
| `window.open('', name)` + `w.document` | **funktioniert** — `about:blank` erbt die Origin des Openers |
| `compatMode` nach Doctype-`write` | `CSS1Compat` — Standards Mode |
| Bild im Popup über absolute URL | lädt (1608 px bestätigt) |
| Tastendruck im Popup an den Opener | funktioniert, wenn der Opener den Handler registriert |
| `<video>` von `file://`, stumm | spielt, auch als Autoplay |
| Fullscreen API | funktioniert (nicht an Secure Context gebunden) |
| `<a href="https://…" target="_blank">` | **funktioniert** — eine Navigation ist kein `fetch` |

**Daraus folgt für jede Änderung:**

- Keine ES-Module, kein `import()`, keine Import Maps.
- Kein `fetch()` — Inhalte gehören statisch ins HTML.
- Keine Iframes zwischen lokalen Dateien.
- Schriften nur als Base64.
- IndexedDB, Service Worker, Worker aus separater Datei, `getScreenDetails()`: alle raus.

**Erlaubt ist der externe Link.** Folie 02 trägt den PDF-Download als `<a class="chip
chip--link" href="https://…" target="_blank" rel="noopener">`. Das ist eine Navigation,
kein Ressourcenzugriff — die CORS-Regel greift hier nicht. Zwei Bedingungen:

- **Immer `target="_blank"`.** Ohne das ersetzt das Ziel das Deck im selben Tab, und der
  Vortragende steht mitten im Vortrag auf einer Downloadseite. Zurück käme er nur mit der
  Zurück-Taste — und das Deck startet dann wieder bei Folie 1.
- `onClick` in `assets/js/deck.js` schließt `a, button, video` vom Blättern aus. Wer diese
  Zeile ändert, macht aus jedem Linkklick zusätzlich einen Folienwechsel.

> **Nie über einen Dev-Server abnehmen.** Über `http://localhost` funktioniert all das
> Obige — und der Fehler fällt erst im Meeting auf. `dev/build/test-coldstart.mjs` kopiert den
> Ordner deshalb an einen fremden Pfad und startet ihn dort per `file://`.

---

## 2 · Der teuerste Fehler: doppelter Start

`preload()` in `deck.js` rief seinen Callback zweimal auf — einmal, wenn alle Bilder
dekodiert waren, und noch einmal durch das Sicherheitsnetz `setTimeout(done, 6000)`.

**Wirkung:** Sechs Sekunden nach dem Öffnen sprang das Deck mitten im Vortrag zurück auf
Folie 1. Beim Testen sah es aus wie ein Fehler in der Navigation — `go(3)` landete
scheinbar auf Folie 1 — und kostete rund zwei Stunden Fehlersuche in der falschen Ecke.

```js
let fired = false;
function done() { if (fired) return; fired = true; cb(); }
```

**Die Sperre nicht entfernen.** Und die Lehre: Wenn ein Zustand ohne erkennbaren Auslöser
zurückspringt, such nach einem Timer, der einen Startpfad ein zweites Mal betritt.

---

## 3 · Zustand nie aus dem DOM lesen

Während eines Übergangs tragen **zwei** Folien die Klasse `is-active` — die abgehende
behält sie, bis ihre Exit-Timeline durch ist.

```js
document.querySelector('.slide.is-active')      // ← liefert die falsche
window.BYZZ.slideAt(window.BYZZ.current())      // ← richtig
```

Das hat im Prüfstand zu Screenshots der falschen Folie geführt, ohne dass irgendetwas
Fehler gemeldet hätte. Wenn du Werkzeuge baust, die den Zustand lesen: immer über `BYZZ`.

---

## 4 · GSAP `getChildren` — der dritte Parameter

```js
gsap.globalTimeline.getChildren(true, true, false)   // FALSCH — ohne Timelines
gsap.globalTimeline.getChildren(true, true, true)    // richtig
```

Signatur ist `(nested, tweens, timelines, ignoreBeforeTime)`. Mit `timelines: false` werden
nur einzelne Tweens erfasst, keine Timelines — und genau deren `onComplete` blendet die
abgehende Folie aus. Betrifft `BYZZ.settle()`, das der Prüfstand nutzt, um für den
Screenshot alle Bewegungen auf den Endzustand zu ziehen.

---

## 5 · Weichzeichnung ist teuer — aber messbar beherrschbar

Gemessen auf diesem Rechner, Fläche 712 × 380, Radius 0–12 px:

| Verfahren | fps |
|---|---|
| `filter: blur()` getweent, **kalt** (erster Lauf) | **39,9** |
| `filter: blur()` getweent, warm | 60,2 |
| Zweischicht-Crossfade (statischer Blur + `opacity`) | 60,2 |
| Screenshot-Crossfade 760 × 446 (vorgeblurtes Bild + `opacity`) | 59,8 |

Der erste Wert war ein Kaltstart-Ausreißer, kein Dauerzustand. Trotzdem arbeitet das Deck
mit **vorgeblurten Bildvarianten** statt getweentem Filter: gleiche Bildrate, bessere
Blur-Qualität (echter Gauß statt Skia-Näherung), und auf schwächerer Vorführhardware
schlicht risikoärmer.

Die Miniaturen sind 44 px breit (`.soft.jpg`, ~1 KB) und werden per CSS auf Panelgröße
gezogen. Animiert wird ausschließlich `opacity`.

**Was man nicht tun darf:**

- Aurora mit `filter: blur(200px)` auf Kreisen bauen. Sie ist `radial-gradient` — optisch
  praktisch identisch, Kosten praktisch null.
- Blur auf ein Element legen, das **innerhalb** eines bereits geblurrten Containers liegt.
  Der Teilbaum wird dann zweimal gerastert. Deshalb hat `.shot__spill` bewusst **keinen**
  CSS-Filter.
- `will-change` dauerhaft im Stylesheet setzen.
- `filter: blur(0px)` stehen lassen statt `filter: none` — die Pipeline bleibt sonst aktiv.

---

## 6 · Positionierte `<img>` brauchen Größenangaben

```css
.shot__spill { position:absolute; inset:-15% -10% }              /* falsch */
.shot__spill { position:absolute; left:-9%; top:-12%;
               width:118%; height:126%; object-fit:cover }        /* richtig */
```

Ein ersetztes Element behält bei `inset` allein seine Eigengröße. Die 44-px-Miniatur
erschien deshalb als winziger Fleck über der linken oberen Panelecke statt als Lichtschein
dahinter.

Zusätzlich braucht der Schein eine **Maske**, die ihn zum Rand hin auf null bringt:

```css
mask-image: radial-gradient(closest-side, #000 22%, rgba(0,0,0,.55) 52%, transparent 82%);
```

Ohne sie wird aus einem hellen Screenshot (etwa der Rasteransicht) eine graue Scheibe mit
sichtbarer Kante, die unter die Bildunterschrift läuft.

---

## 7 · Konturicons werden sonst gefüllt

Ein `<symbol>` mit Pfaden und ohne `fill`-Angabe rendert der Browser **gefüllt**. Aus jedem
Icon wird ein schwarzer Klecks. Die globale Regel in `deck.css` fängt das ab:

```css
svg use, .ico svg, .path svg, .card__ico svg, .demo__k svg {
  fill: none; stroke: currentColor; stroke-width: 1.7;
  stroke-linecap: round; stroke-linejoin: round;
}
#blobmark svg, #blobmark use { fill: currentColor; stroke: none; }
```

Wer eine neue Stelle mit Icons baut, muss den Selektor erweitern.

Und: **Icons bei 44 px prüfen.** Das ursprüngliche `i-film` (Rechteck plus je zwei Quer-
und Längslinien) las sich bei dieser Größe als Tabelle, nicht als Film.

---

## 8 · Abstände gehören an das Element, nicht an den Kontext

`.rule` hatte seine Abstände zunächst nur über `.col-l .rule { margin: … }`. Auf der ersten
Folie, die statt `.col-l` einen eigenen Block nutzte, lag der Strich dadurch **auf** der
Headline und der Fließtext darunter überlappte sie.

Wiederkehrende Bausteine bringen ihre Abstände selbst mit. Kontextabhängige Abstände sind
in einem System, in dem mehrere Leute (oder Agenten) parallel Folien bauen, eine Zeitbombe.

---

## 9 · Eine Montage, die Handarbeit überschrieb

Der Folienbereich von `index.html` wurde einmal erzeugt: `dev/build/assemble.mjs` ersetzte
alles zwischen `<!-- SLIDES:START -->` und `<!-- SLIDES:END -->` durch die `<section>`-Blöcke
aus fünf Teildateien unter `dev/build/slides/`. Sinnvoll war das genau einmal — als fünf
Agenten gleichzeitig Folien bauten und nicht in dieselbe Datei schreiben durften.

Danach war es nur noch eine Falle. Wer in `index.html` arbeitete und anschließend montierte,
verlor seine Änderung. Beim Bauen ist das zweimal passiert. Die scharfe Kante:
**`verify.mjs` rief `assemble.mjs` ohne `--check` auf** — der Abnahmelauf war selbst der
Überschreiber, und er meldete nichts, weil er formal durchlief. `--check` half nicht: es
zählte nur die Folien je Teildatei und sah in `index.html` überhaupt nicht hinein.

Beides ist entfernt. `index.html` ist die einzige Quelle der Folien, jede Korrektur steht
an genau einer Stelle. Wer parallel bauen will, tut das für ein *neues* Deck über den Skill
`create-slides` — nicht, indem er hier eine zweite Wahrheit einführt.

> Die eigentliche Lehre ist allgemeiner: **Ein Erzeugnis und seine Quelle dürfen nicht
> beide von Hand bearbeitbar aussehen.** Solange `index.html` wie eine normale Datei
> dalag, hat sie auch jeder wie eine normale Datei behandelt — zu Recht.

---

## 10 · Eine starre Bühne erzeugt helle Balken

Ursprünglich war `#stage` selbst starr 1920 × 1080 und trug sowohl den Hintergrund als auch
den Folieninhalt. Bei jedem Fensterformat außer 16:9 blieb daneben ein Streifen stehen — in
`--paper`, also nicht schwarz, aber deutlich sichtbar, **weil die Aurora mit einer harten
Kante endete**. Auf 16:10 waren das oben und unten je 40 px, bei einem frei gezogenen
Fenster erheblich mehr. Der Auftraggeber hat das als „weiße Balken" beanstandet, und zwar
zu Recht.

Der Fehler war nicht die Farbe des Randes, sondern **die Kante des Verlaufs**.

Die Lösung trennt beides:

- `#frame` — der komponierte Bereich, weiterhin exakt 1920 × 1080. Alle Folienkoordinaten
  beziehen sich ausschließlich darauf. Nichts wird verzerrt oder beschnitten.
- `#stage` — der sichtbare Bereich. `deck.js → fit()` setzt `--stage-w` / `--stage-h` so,
  dass die Bühne nach derselben Skalierung genau das Fenster deckt.

Zwei Punkte, an denen man sich dabei vertun kann:

1. **`#aurora` und `#blobmark` müssen am Rahmen hängen, nicht an der Bühne.** Die
   Wolkenpositionen aus `auroraState()` sind Offsets von der linken oberen Ecke der
   Aurora-Ebene. Wächst diese Ebene mit der Bühne, verschiebt sich die Komposition je nach
   Fensterformat — dieselbe Folie sähe auf zwei Rechnern verschieden aus. Beide sind
   deshalb mit `left/top: 50%` und negativen Rändern am Rahmen zentriert. Die krummen Maße
   `2380.8 × 1339.2` sind genau das frühere `inset: -12%` eines 1920 × 1080-Kastens.
2. **`#grain` muss umgekehrt die ganze Bühne decken.** Sonst ist der Rand kornfrei, und
   genau an der Rahmenkante entsteht wieder eine sichtbare Linie.

`dev/build/test-shell.mjs` prüft seitdem beides: der Rahmen muss vollständig ins Fenster
passen (`fits`), und die Bühne muss das Fenster restlos decken (`covers`).
`dev/build/shot.mjs` misst Layoutbefunde gegen `#frame`, nicht mehr gegen `#stage` — sonst
wären bei abweichendem Fenster alle Koordinaten verschoben.

---

## 11 · Kleinigkeiten, die Zeit gekostet haben

**Google Fonts liefert bei variablen Familien dieselbe Datei für jedes Gewicht.**
Ohne Entdopplung wog `fonts.css` 652 KB statt 258 KB — Inter allein war dreimal drin.
`embed-fonts.mjs` gruppiert jetzt nach URL und deklariert einen Gewichtsbereich.

**PNG ist für Röntgenaufnahmen die falsche Wahl.** Erster Durchlauf: 7,42 MB. Dieselben
Bilder als WebP q92: 0,99 MB — bei besserer Qualität als die Quelle. WebP bedient sowohl
feinen UI-Text als auch verrauschte Flächen; Chrome und Edge sind das einzige Ziel.

**Die gedrehte Raute steht 2,3 px über.** `.mark__b` ist 11 px groß und um 45° gedreht,
die Diagonale misst 15,56 px. Ohne `margin-left: 2px` beginnt sie links der Rasterlinie.

**Der Prüfstand braucht `--frag`.** Ohne den Schalter fotografiert `shot.mjs` von
mehrstufigen Folien nur den ersten Schritt — und die anderen sieht nie jemand an.

**Chrome Headless drosselt `requestAnimationFrame`.** Im alten `headless: 'shell'` liefen
GSAP-Timelines langsamer als die Wanduhr, und Screenshots zeigten halbfertige Übergänge.
Der Prüfstand nutzt deshalb `headless: true` und ruft vor jedem Bild `BYZZ.settle()` auf.

**Die Chrome-Erweiterung kann keine `file://`-URLs öffnen.** Für die Abnahme deshalb
Puppeteer mit dem installierten Chrome — siehe [werkzeuge.md](werkzeuge.md).

**Pfade aus dem Arbeitsverzeichnis abzuleiten macht Skripte ortsabhängig.** Die
Werkzeuge lösten ihre Pfade mit `resolve('slides')` und `resolve('..', 'index.html')`
auf — also gegen das *Arbeitsverzeichnis*, nicht gegen den eigenen Ort. Wer nicht vorher
`cd` gemacht hatte, bekam einen Fehler über eine fehlende Datei, nicht über das falsche
Verzeichnis. Genau deshalb liefen die damals dokumentierten Aufrufe
`node build/assemble.mjs` von der Projektwurzel aus ins Leere, ohne dass es jemandem
auffiel. Seit dem Umzug nach `dev/build/` steht jeder Pfad einmal
in `paths.mjs`, abgeleitet aus `import.meta.url`. Neue Skripte importieren von dort und
bauen keine Pfade selbst zusammen.

---

## 12 · Veröffentlichen — was ohne Fehlermeldung fehlschlägt

Ein Nachmittag am 06.08.2026. Das Tückische daran: Fast nichts davon meldet sich
als Fehler.

**Ein Workflow außerhalb von `.github/workflows/` wird stillschweigend ignoriert.**
Erst lag `pages.yml` in der Repo-Wurzel, dann in einem `workflows/` ohne `.github`.
Beide Male passierte scheinbar gar nichts: kein Fehler, keine Warnung — GitHub führt
einfach weiter seinen eingebauten Workflow aus, als hätte man die Datei nie angelegt.
Nur zwei Dinge verraten es: Unter `Actions` heißt der Lauf „pages build and deployment"
statt „Deck auf GitHub Pages veröffentlichen", oder die Liste bleibt ganz leer.
Deshalb liegt `.github/` jetzt im Projekt in genau der Zielstruktur — es gibt nichts
mehr zu übersetzen.

**Ein Deployment kann in `deployment_queued` hängen, ohne dass etwas falsch ist.**
Der Build läuft durch, das Artefakt wird hochgeladen, das Deployment wird angenommen —
und dann bricht die Action nach zehn Minuten mit „Timeout reached, aborting!" ab. Das
ist GitHubs Backend, seit Juli 2026 gehäuft gemeldet. Drei Anläufe scheiterten so, der
vierte lief nach sieben Minuten durch, ohne dass irgendetwas geändert wurde. **Erst
einmal erneut anstoßen**, bevor man die Konfiguration verdächtigt.

**Der `timeout`-Parameter von `deploy-pages` lässt sich nicht erhöhen.** 600000 ms sind
Voreinstellung *und* Maximum; höhere Werte setzt die Action kommentarlos zurück und
schreibt nur eine Warnung ins Log. Ein Puffer gegen die hängende Warteschlange ist
darüber nicht zu bekommen.

**Die Meldung „Node.js 20 is deprecated" ist kein Fehler.** Sie sagt selbst
*„forced to run on Node.js 24"* — die Umstellung ist bereits passiert. Sie richtet sich
an die Maintainer der Actions, nicht an uns, und hat nie ein Deployment verhindert. Wer
sie für die Ursache hält, sucht stundenlang an der falschen Stelle.

**Ein einmal ausgelieferter Pages-Stand bleibt stehen.** Schlägt der Deploy fehl, zeigt
die Seite weiter den vorigen Inhalt — sie sieht also funktionsfähig aus, während neue
Commits gar nicht ankommen. Ob wirklich der aktuelle Stand liegt, prüft man an einer
Datei, die es nur in einem der beiden Stände gibt, nicht am Augenschein.

**Die GitHub-API erlaubt ohne Anmeldung 60 Anfragen pro Stunde.** Eine Warteschleife,
die im Sekundentakt den Run-Status pollt, verbrennt das Kontingent in Minuten und ist
danach eine Stunde blind. Für „ist es schon da?" die Website abfragen — die ist
unbegrenzt.

**Batchdateien brauchen CRLF und vertragen keine Umlaute in Ausgaben.** Bei LF-Zeilenenden
gehen `goto` und mehrzeilige Blöcke kaputt, bei Umlauten zeigt die Windows-Konsole je
nach Codepage Kauderwelsch. In `publish.bat` und `pdf.bat` steht deshalb durchgehend
`ue`, `oe`, `ae` — und nach jeder Bearbeitung sind die Zeilenenden zu prüfen.

---

## 13 · Was noch nicht geprüft ist

Ehrlich benannt, damit niemand es für erledigt hält:

- **Verhalten auf dem echten Vorführnotebook am echten Beamer.** Insbesondere: bleibt der
  Vollbildmodus stehen, wenn das Referentenfenster den Fokus bekommt? Auf dieser Maschine
  ja, aber das hängt an Fenstermanager und Grafiktreiber. Vor dem Meeting einmal
  durchspielen.
- **Bildrate auf schwacher Hardware.** Alle Messwerte stammen von diesem Rechner. Der
  Notausgang `B` ist genau dafür da.
- **Sehr große Bildschirme.** Geprüft bis 2560 × 1440. Bei 4K wird `--scale` = 2, was
  Blur-Radien und Schatten mitskaliert — sollte passen, ist aber ungetestet.
