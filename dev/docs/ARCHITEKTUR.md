# Architektur

Wie das Deck funktioniert. Lies das einmal, bevor du an `assets/js/` etwas änderst.

---

## Die eine Randbedingung, aus der alles folgt

Das Deck muss per **Doppelklick auf `index.html`** laufen — offline, ohne Node, ohne
Webserver. Damit ist jedes Dokument in Chrome eine **opaque origin**, und daraus folgt
der komplette Bauplan:

| Es geht nicht | Also stattdessen |
|---|---|
| `<script type="module">`, `import()` | klassische `<script src>`, alles schreibt auf `window.BYZZ` |
| `fetch()` auf lokale Dateien | Folieninhalte stehen **statisch** in `index.html` |
| `@font-face` mit Datei-URL | Schriften als **Base64** in `assets/css/fonts.css` |
| Zweite lokale HTML-Datei ansprechen | Referentenansicht als **`about:blank`-Popup** |
| `BroadcastChannel`, `localStorage` als Kanal | direkte Objektreferenz aufs Popup |
| Canvas-Pixel lesen nach lokalem Bild | keine Bildanalyse zur Laufzeit |

Alles davon ist gemessen, nicht vermutet — siehe [FALLSTRICKE.md](FALLSTRICKE.md).

**Konsequenz für dich:** Kein Bundler, kein Build-Schritt zum Vorführen. Was in
`index.html` steht, ist das Deck. `dev/build/` enthält nur Werkzeuge, die man zum *Ändern*
braucht, nie zum *Zeigen*.

---

## Dateien

```
index.html            Bühne, Inhaltsrahmen, Symbolbibliothek, alle <section class="slide">
readme.txt            Bedienung für den Vortragenden
README.md             Einstieg und Wegweiser

assets/
  css/fonts.css       @font-face, Base64-WOFF2, erzeugt         [generiert]
  css/deck.css        Design-System und Folien-Vorlagen
  js/vendor/gsap.min.js   GSAP 3.13 UMD
  js/transitions.js   Bewegungslogik                  → BYZZ.transitions
  js/overview.js      Folienübersicht (Taste O)       → BYZZ.overview
  js/presenter.js     Referentenansicht (Notizen nur dort) → BYZZ.presenter
  js/deck.js          Zustand, Navigation, Skalierung → BYZZ.go/next/prev/…
  img/                Screenshots + QR-Codes                     [generiert]
  video/              zwei stumme Endlosschleifen                [generiert]
  brand/              Logos

dev/                  alles, was nur beim Bauen gebraucht wird
  build/              Werkzeuge, siehe WERKZEUGE.md
    paths.mjs         alle Projektpfade an einer Stelle
    slides/           Folien-Teildateien für die Montage
  docs/               diese Dokumentation
  screenshots/        Ausgangsbilder (Quelle, unverändert)
  design-system/      Logos im Original (Quelle)
  prompts/            Auftragstexte, chronologisch
```

**Ladereihenfolge in `index.html` — nicht vertauschen:**

```
fonts.css → deck.css → gsap.min.js → transitions.js → overview.js → presenter.js → deck.js
```

`deck.js` kommt zuletzt, weil es beim Start `BYZZ.transitions` und `BYZZ.onSlide` braucht,
die von den anderen Dateien gesetzt werden.

---

## Die Bühne und der Inhaltsrahmen

Es sind **zwei** Ebenen, und der Unterschied ist der Kern des Ganzen:

| | `#frame` — komponierter Bereich | `#stage` — sichtbarer Bereich |
|---|---|---|
| Größe | immer exakt 1920 × 1080 | `--stage-w` × `--stage-h`, mindestens 1920 × 1080 |
| Inhalt | Folien, Logo, Wortmarke, Fortschrittslinie | Aurora, Korn, Lichtzeichen — und `#frame` |
| Zweck | die Komposition, auf die sich alle Koordinaten beziehen | deckt das Fenster restlos aus |

Beide tragen denselben Skalierungsfaktor; `#stage` skaliert, `#frame` liegt mittig darin:

```css
#stage { width: var(--stage-w); height: var(--stage-h);
         transform: translate(-50%,-50%) scale(var(--scale)) }
#frame { width: 1920px; height: 1080px; margin: -540px 0 0 -960px }   /* links/oben 50% */
```

```js
--scale   = Math.min(innerWidth / 1920, innerHeight / 1080)
--stage-w = Math.max(1920, Math.ceil(innerWidth  / scale))
--stage-h = Math.max(1080, Math.ceil(innerHeight / scale))
```

Gesetzt nur bei `resize`, **nie animiert** — eine animierte Ebene mit skaliertem Text
erzeugt Sub-Pixel-Flimmern.

**Warum fixer Inhaltsrahmen statt `clamp()`/`vw`:** Auf einem 1920er Beamer ist
`scale === 1`, also exakt wie entworfen. Auf jedem anderen Bildschirm dasselbe Bild, nur
skaliert. Mit einem responsiven Layout bekäme man auf 1280 × 800 andere Zeilenumbrüche und
kippende Layouts — und müsste 34 Folien in mehreren Auflösungen abnehmen. Nebeneffekt:
Blur-Radien, Schattenweiten und Versatzdistanzen skalieren automatisch mit.

**Warum die Bühne trotzdem mitwächst:** War die Bühne selbst starr 1920 × 1080, endeten
Aurora und Korn mit einer sichtbaren Kante, und daneben stand ein Streifen `--paper`. Bei
16:10 waren das oben und unten je 40 px, bei einem beliebig gezogenen Fenster deutlich
mehr — der Auftraggeber hat das zu Recht als „weiße Balken" beanstandet. Die wachsende
Bühne trägt den Hintergrund bis an die Fensterkante. Der Folieninhalt bleibt unangetastet
zentriert; er wird weder verzerrt noch beschnitten.

Bei genau 16:9 sind Bühne und Rahmen deckungsgleich — dort rendert alles wie zuvor.

---

## Ebenen

Im `#stage` (formatabhängig, füllt das Fenster):

| z-index | Element | Was |
|---|---|---|
| 0 | `#aurora` | drei weiche Farbwolken, reine `radial-gradient` |
| 1 | `#blobmark` | das orangedental-Symbol als Lichtzeichen |
| 1 | `#grain` | feines Korn gegen Banding, Base64-SVG, `multiply` |
| 2 | `#frame` | der Inhaltsrahmen |

`#aurora` und `#blobmark` sind mit `left/top: 50%` und negativen Rändern am **Rahmen**
ausgerichtet, nicht an der Bühne: die Wolkenpositionen aus `transitions.js` sind Offsets von
der linken oberen Ecke dieser Ebene, und dieselbe Folie soll in jedem Fensterformat gleich
aussehen. `#grain` deckt dagegen bewusst die ganze Bühne — sonst wäre der Rand kornfrei.

Im `#frame` (immer 1920 × 1080, `overflow: hidden`):

| z-index | Element | Was |
|---|---|---|
| 2 | `.slide` | die Folien |
| 3 | `#brand` | Logo unten links |
| 3 | `#wordmark` | Wortmarke „byzz 11" unten rechts |
| 4 | `#progress` | Fortschrittslinie am unteren Rand |

Außerhalb des `#stage` (also `position: fixed`, nicht mitskaliert):
`#boot` (Ladeschirm), `#overview`, `#hint`.

---

## Zustand und Navigation

Der gesamte Zustand liegt in einem Objekt in `deck.js`:

```js
S = { slides, i, target, frag, tl, lastNav, busy, queued, jumpBuf }
```

- `i` — welche Folie **gerade sichtbar** ist
- `target` — welche Folie **gewünscht** ist
- `frag` — Schritt innerhalb einer mehrstufigen Folie
- `tl` — die laufende Übergangs-Timeline

**Ablauf eines Tastendrucks:**

```
Taste → next()/prev() → go(n) setzt S.target → pump()
                                                 │
                     requestAnimationFrame ──────┘
                                                 │
                     höchstens EIN Schritt pro Frame
                                                 │
                     show(next, dir, fast) ──────┘
```

Drei Eigenschaften, die im Vortrag zählen:

1. **`show()` beendet zuerst die laufende Timeline** mit `progress(1).kill()`. Beim schnellen
   Durchklicken stapelt sich dadurch nichts, und es bleiben keine halbtransparenten
   Zwischenzustände stehen.
2. **Schneller Modus:** Liegt der letzte Wechsel weniger als **220 ms** zurück, läuft eine
   reduzierte Variante — nur Deckkraft, 110–120 ms, kein Blur, keine Staffelung. Beim
   Loslassen der Taste kommt die volle Choreografie zurück.
3. **Übersprungene Folien werden nie animiert.** Bei `go(20)` aus Folie 3 heraus wird direkt
   auf 20 gesprungen, die 16 dazwischen tauchen gar nicht auf.

`BYZZ.current()`, `BYZZ.slideAt(n)`, `BYZZ.slideCount()` sind die öffentlichen Leseroutinen.
**Der Zustand ist immer aus `BYZZ` zu lesen, nie aus dem DOM** — während eines Übergangs
tragen kurzzeitig zwei Folien die Klasse `is-active`, und `querySelector` liefert dann die
falsche. Diese Falle hat beim Bauen zwei Stunden gekostet.

### Mehrstufige Folien

`data-fragments="3"` auf der `<section>` sagt: diese Folie hat drei Schritte.
`next()` erhöht erst `S.frag`, und erst wenn der letzte Schritt erreicht ist, geht es zur
nächsten Folie. `prev()` spiegelbildlich. Springt man rückwärts auf eine mehrstufige Folie,
zeigt sie ihren **letzten** Schritt — sonst müsste man sie noch einmal ganz durchklicken.

Zwei Bauarten, beide in `T.showFragment()`:

- **Sequenz** — `.seq__item`-Blöcke blenden an derselben Stelle übereinander (Folien 12, 18)
- **Aufbau** — Elemente mit `data-frag="1"`, `data-frag="2"` erscheinen nacheinander

Zusätzlich wandert ein `[data-pointer]`-Element bei jedem Schritt an eine neue x-Position
(`T.movePointer`). Folie 12 nutzt das, um auf die jeweils aktive Umschalt-Schaltfläche im
Screenshot zu zeigen. Bewegt wird ausschließlich `translateX`, und nur beim Schrittwechsel —
Details in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md#zeiger).

### Sichtbarkeit

```css
.slide                      { display: none }
.slide.is-active            { display: block }   /* die aktuelle */
.slide.is-leaving           { display: block }   /* die abgehende, während des Übergangs */
```

Alle 34 Folien liegen dauerhaft im DOM, aber nur ein bis zwei werden gerendert. `display:none`
kostet kein Layout, kein Paint, keine GPU-Ebene. 34 Folien Markup sind für Chrome nichts —
teuer ist nur, was gerendert wird.

---

## Bewegung

Details und Regeln stehen in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md#bewegung).
Hier nur das Modell:

Das Deck ist **eine Kamerafahrt**, kein Stapel Folien. Vorwärts kommt der neue Inhalt aus
der Tiefe nach vorn, der alte fällt nach hinten weg. Rückwärts exakt gespiegelt — das
Vorzeichen der Skalierung trägt die Richtung.

Der Hintergrund bewegt sich **nie von allein**. `T.moveAurora()` berechnet die Position der
drei Farbwolken deterministisch aus dem Folienindex; über das ganze Deck ergibt das eine
einzige langsame Fahrt. Deterministisch heißt: vor- und rückwärts trifft man exakt dieselben
Zustände.

`T.moveBlob(isDivider, fast)` steuert das Markenzeichen. Es **wandert nicht**: Position,
Größe und Drehung stehen fest in `deck.css` (`#blobmark`: rechts, vertikal mittig,
ungedreht). Bewegt wird ausschließlich die Deckkraft — auf Abschnittstrennern `0.11`, auf
Inhaltsfolien `0.035`. Ausblenden bis auf null wäre falsch: das Zeichen soll durchgehend
leicht im Hintergrund stehen.

> Frühere Fassung: das Zeichen sprang je Abschnitt an eine andere Stelle und schrumpfte auf
> Inhaltsfolien in die untere linke Ecke. Das zog den Blick vom Inhalt weg und wurde auf
> Wunsch des Auftraggebers durch die feste Position ersetzt. `moveBlob()` hat deshalb keinen
> `section`-Parameter mehr.

---

## Referentenansicht

Der interessante Teil. Unter `file://` scheiden `BroadcastChannel`, `localStorage` und der
Zugriff auf eine zweite lokale Datei als Kanal aus. Was funktioniert:

```js
const w = window.open('', 'byzz-presenter', '…');   // nur aus einer Benutzergeste
```

Ein per `window.open` geöffnetes **`about:blank` erbt die Origin-Instanz des Openers**.
Opener und Popup sind damit same-origin: das Hauptfenster baut `w.document` direkt auf und
aktualisiert es über gespeicherte Knoten-Referenzen. Kein Messaging, keine Serialisierung,
keine Latenz.

Wichtig beim Anfassen von `presenter.js`:

- **Doctype einmalig** per `document.write`, danach ausschließlich DOM-API. Ohne Doctype
  läuft das Popup im Quirks Mode.
- **Keine externen Ressourcen im Popup.** CSS als Textknoten, Systemschrift, Bilder nur über
  `new URL(pfad, location.href).href`.
- **Kein Klonen der echten Folie für die Vorschau.** `styleSheet.cssRules` wirft bei
  `file://`-Stylesheets `SecurityError`; ein Klon käme ungestylt an. Die Vorschau wird
  deshalb schematisch aufgebaut.
- **Timer nie hochzählen**, immer `Date.now() - start` rechnen. Chrome drosselt `setInterval`
  in verdeckten Fenstern.
- **Jeder Popup-Zugriff in `try/catch`** plus `w.closed`-Prüfung. Der Referent kann das
  Fenster jederzeit schließen.

**Die Notizen stehen ausschließlich hier, und zwar dauerhaft.** Eine Einblendung im
Hauptfenster gibt es bewusst nicht mehr — das Hauptfenster hängt am Beamer, dort hat der
Sprechtext nichts zu suchen. Eine Taste zum Zu- und Abschalten gibt es ebenfalls nicht:
das Fenster hat genau einen Zweck, und wer es nicht braucht, öffnet es nicht.

Der Preis dieser Entscheidung: Blockt der Browser das Popup, gibt es keine Notizen mehr —
nur noch den Hinweis, Popups zu erlauben. Popups aus einer Tastengeste heraus werden in
Chrome und Edge normalerweise durchgelassen; vor dem Meeting trotzdem einmal `P` drücken.

---

## Vorladen

Beim Start werden alle Bilder dekodiert, währenddessen läuft der Ladeschirm `#boot`.
Danach dekodiert das Deck nach jedem Wechsel die Nachbarfolien vor (`n-1`, `n+1`, `n+2`).

**Kein `loading="lazy"`.** Alle Folien außer der aktiven sind `display:none` — Lazy Loading
würde das Laden bis zum Sichtbarwerden verzögern und genau das Aufblitzen erzeugen, das man
vermeiden will. Bei lokalen Dateien gibt es dafür null Grund.

> **Achtung, hier lag ein echter Fehler:** Das Sicherheitsnetz `setTimeout(done, 6000)` rief
> den Callback ein zweites Mal auf, wenn die Bilder vorher fertig waren. Sechs Sekunden nach
> dem Start sprang das Deck mitten im Vortrag zurück auf Folie 1. Die Sperre `if (fired)
> return;` in `preload()` verhindert das. **Nicht entfernen.**

---

## Wenn GSAP fehlt

`deck.js` prüft beim Start `if (!window.gsap)`. Fehlt die Datei, zeigt das Deck die erste
Folie ohne Animation statt gar nichts. Ein Deck, das im Meeting nur schlicht aussieht, ist
brauchbar; eines mit weißer Seite nicht.
