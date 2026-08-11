# Design-System

Alles, was `assets/css/deck.css` anbietet. **Das ist die maßgebliche Liste** — greif zuerst
hier zu, bevor du neues CSS schreibst. Neue Klassen gehören ins Stylesheet und in dieses
Dokument, nicht als Einzelfall in eine Folie.

---

## Raster

```
Bühne  1920 × 1080
x      112 ──────────────────────────────────────────── 1808     Außenrand 112
y      112   Kopfzeile (Abschnitt links, Zähler rechts) — automatisch
y      200   frühester Inhalt
y      940   spätester Inhalt
y      948   ┌── LOGO-SCHUTZZONE  x 100–372, y 948–1034 ── hier nichts hinein
y      986   └── WORTMARKE „byzz 11" rechts, x ~1690–1808 ── ebenfalls freihalten
```

Positioniert wird absolut per `style="left:…px;top:…px;width:…px"`.
Die Schutzzone wird beim Prüflauf hart geprüft, ebenso jeder Überlauf über den Bühnenrand.
Die Wortmarke rechts unten wird **nicht** geprüft (sie liegt außerhalb der `.slide-inner`) —
dort unten also von Hand nichts hineinlegen.

---

## Farben

| Token | Wert | Wofür |
|---|---|---|
| `--paper` | `#FBF8F4` | Bühne. Warmes Off-White, kein Reinweiß — die byzz-Screenshots sind durchweg dunkel, kaltes Weiß daneben wirkt klinisch |
| `--paper-2` | `#FFFFFF` | Karten, Panels |
| `--paper-sunk` | `#F3EDE4` | zurückgesetzte Flächen |
| `--ink` | `#191714` | Überschriften |
| `--ink-2` | `#57514A` | Fließtext |
| `--ink-3` | `#948C82` | Labels, Meta, Bildunterschriften |
| `--rule` | `rgba(25,23,20,.10)` | Ränder, Trennlinien |
| `--orange` | `#F68B1A` | **Primärfarbe**, exakt aus `logo_od_premium_big.png` |
| `--orange-deep` | `#C2620A` | Orange **als Text** auf hellem Grund (Kontrast 4,6:1) |
| `--orange-soft` | `rgba(246,139,26,.12)` | Flächen hinter Orange-Text |
| `--slate` | `#363E4B` | kühler Gegenpol |

> **`--orange` nie als Textfarbe verwenden.** Auf `--paper` liegt der Kontrast bei 2,3:1 und
> ist auf einem Beamer nicht lesbar. Für Text `--orange-deep`. `--orange` ist für Flächen,
> Striche und Akzentpunkte.

Der kühle Ton ist nicht beliebig gewählt: Er ist der Grundton der byzz-App-Oberfläche und
verbindet Deck und Produkt, statt nur Orange zu wiederholen.

---

## Schrift

| Rolle | Schrift | Warum |
|---|---|---|
| Display | **Familjen Grotesk** 500/600 | Angeschnittene Terminals und leichte Quadratur greifen die Formsprache des orangedental-Schriftzugs auf |
| Fließtext | **Inter** 400/500/600 | Neutrale Arbeitsschrift, exzellent bei 24–30 px |
| Auszeichnung | **IBM Plex Mono** 500 | Menüpfade, Versionen, Ports, Dateinamen |

Alle drei SIL OFL, als Base64-WOFF2 in `assets/css/fonts.css` eingebettet (258 KB).
Ersatzkette bei fehlender Datei: `Archivo` → `system-ui`.

**Mono ist kein Schmuck.** Sie markiert echtes Softwarevokabular: `Hilfe → Webinare`,
`Port 8100`, `DVT-Betrachter.exe`, `11.0.93`. Wenn es nicht wörtlich in byzz so heißt,
gehört es nicht in Mono.

| Klasse | Größe | Einsatz |
|---|---|---|
| `.h-xl` | 168 px | nur Titelfolie |
| `.h-l` | 96 px | nur Abschnittstrenner und Schlussfolie |
| `.h-1` | 68 px | Folien-Headline, 1–2 Zeilen |
| `.h-2` | 38 px | Zwischenüberschrift |
| `.h-3` | 26 px | kleine Überschrift |
| `.lead` | 30 px | Einleitungstext, **maximal 3 Zeilen** |
| `.body` | 24 px | Fließtext |
| `.tiny` | 19 px | Hinweise, Nebenbemerkungen |

---

## Bausteine

### Trennstrich

```html
<div class="rule"></div>
```
Bringt seine Abstände selbst mit (32 px oben, 28 px unten). Einziges wiederkehrendes
Trennelement im Deck. Steht immer zwischen Headline und Fließtext.

### Textspalte

```html
<div class="col-l" style="top:224px">   <!-- left:112, width:660 kommen aus der Klasse -->
```
Der Standard für Folien mit Panel rechts. Nur `top` setzen.

### Screenshot-Panel

```html
<div class="shot" data-anim style="left:872px;top:250px;width:936px;height:549px">
  <img class="shot__spill" src="assets/img/NAME.soft.jpg" alt="">
  <div class="shot__frame">
    <img src="assets/img/NAME.webp" width="1360" height="798" alt="Was zu sehen ist">
  </div>
  <img class="shot__soft" src="assets/img/NAME.soft.jpg" alt="">
  <div class="shot__cap">BILDUNTERSCHRIFT</div>
</div>
```

Drei Ebenen, alle drei nötig:

- **`shot__spill`** — die 44-px-Miniatur, stark vergrößert hinter dem Panel. Sie wirft die
  Farben des Screenshots in den Raum dahinter, wie ein Monitor in einem hellen Zimmer. Löst
  das Kontrastproblem dunkler Screenshots auf hellem Grund gestalterisch statt technisch.
- **`shot__frame`** — der eigentliche Screenshot, gerahmt und beschattet.
- **`shot__soft`** — dieselbe Miniatur über dem Panel. Sie trägt den Tiefenübergang:
  beim Erscheinen blendet sie aus, das Panel „wird scharf".

`width`/`height` am inneren `<img>` sind die **nativen** Maße (siehe Bildtabelle) — sie
verhindern Layout-Sprünge und sind die Grundlage der Skalierungsprüfung.

### Video-Panel

```html
<div class="shot" style="left:848px;top:220px;width:960px;height:540px">
  <div class="shot__frame">
    <video src="assets/video/dvt-viewer.mp4" muted loop playsinline preload="auto"
           width="1440" height="810"></video>
  </div>
  <div class="shot__cap">BILDSCHIRMAUFNAHME</div>
</div>
```

Kein `spill`, kein `soft`, **kein `autoplay`, kein `controls`**. Die Engine startet das Video
beim Betreten der Folie und pausiert es beim Verlassen.

### Karten

```html
<div class="cards cards--3" data-anim style="left:112px;top:560px;width:1696px">
  <div class="card glass">
    <span class="card__n">01</span>
    <div class="card__ico"><svg><use href="#i-key"/></svg></div>
    <h3 class="card__t">Titel</h3>
    <p class="card__d">Ein bis zwei Sätze.</p>
  </div>
</div>
```

`cards--2` · `cards--3` · `cards--5` · `cards--app`. Kartenbreiten bei 1696 px Raster:

| Raster | Abstand | Kartenbreite |
|---|---|---|
| `cards--2` | 28 px | 834 px |
| `cards--3` | 28 px | 546,67 px |
| `cards--5` | 20 px | 323,2 px |
| `cards--app` | 26 px | 512 px · daneben 620 px |

### Vier plus eins (`cards--app`)

Vier gleichrangige Karten als 2×2-Block, daneben eine breitere Karte über beide Reihen —
für den Fall „vier Dinge einer Art, eines daneben, das dazugehört, aber keines davon ist".
Folie 32 nutzt das für die vier Betrachter und die Kamera-Aufnahme.

```html
<div class="cards cards--app" data-anim style="left:112px;top:518px;width:1696px">
  <div class="card glass"> … </div>   <!-- oben links  -->
  <div class="card"> … </div>         <!-- oben rechts -->
  <div class="card"> … </div>         <!-- unten links -->
  <div class="card"> … </div>         <!-- unten rechts -->
  <div class="card card--wide">       <!-- rechts, über beide Reihen -->
    <div class="card__ico"><svg><use href="#i-camera"/></svg></div>
    <h3 class="card__t">Titel</h3>
    <p class="card__d">Ein Satz.</p>
    <span class="path"><svg><use href="#i-layout"/></svg>Reiter Kamera</span>
  </div>
</div>
```

- `.card--wide` steht **fest in der dritten Spalte** (`grid-column: 3; grid-row: 1 / span 2`).
  Nur deshalb darf sie im Markup zuletzt stehen und die vier übrigen rasten trotzdem in
  Lesereihenfolge 2×2 ein.
- Die vier Karten sind flacher gepolstert als im Standardraster (28/30/26 statt 36/34/34).
  Zwei Reihen unter einer zweizeiligen Headline passen sonst nicht zwischen y = 200 und
  y = 940. Gerechnete Reihenhöhe: **192 px**, Gesamthöhe mit Abstand **410 px**.
- `.card--wide` zentriert ihren Inhalt senkrecht und vergrößert Piktogramm (64 px), Titel
  (34 px) und Fließtext (22 px) — sonst steht die hohe Karte halb leer.
- Die Beschreibungen der vier müssen **einzeilig** bleiben (max. ~450 px bei 20 px).
  Wird eine zweizeilig, wachsen beide Reihen und der Block läuft unten aus dem Raster.

Karten sind gleich hoch (Grid-Stretch) — halte deshalb die Texte ähnlich lang.
`card__n` nur, wenn die Reihenfolge etwas bedeutet.

> **`glass` höchstens einmal pro Folie.** `backdrop-filter` muss den Hintergrund pro Frame
> neu erfassen. Auf einem Verlaufsgrund ist die Attrappe (`rgba(255,255,255,.66)`) optisch
> nicht davon zu unterscheiden und kostet nichts. Die Engine schaltet echtes Glas ohnehin
> erst ein, wenn die Folie steht (`glass-live`).

### Aufzählung

```html
<div class="marks" style="left:112px;top:420px;width:820px">
  <div class="mark"><span class="mark__b"></span><p class="mark__t"><b>Stichwort</b> — Text.</p></div>
</div>
```

### Kleinteile

```html
<span class="path"><svg><use href="#i-server"/></svg>Hilfe → Webinare</span>
<span class="chip">Diagnocat</span>
<span class="chip chip--muted">…</span>
<span class="badge">Testing steht aus</span>
<span class="badge badge--muted">Zweitmeinung, keine Diagnose</span>

<a class="chip chip--link" href="https://…" target="_blank" rel="noopener">
  <svg><use href="#i-download"/></svg>Diese Präsentation als PDF herunterladen
</a>
```

`.chip--link` macht aus dem Chip einen Link: der orangefarbene Punkt weicht einem Piktogramm,
die Schrift wird `--orange-deep`, beim Überfahren hellt der Grund auf. Genutzt auf Folie 02
für den PDF-Download. Zwei Dinge dazu:

- Externe `https://`-Ziele funktionieren unter `file://` — das ist eine **Navigation**, kein
  `fetch()`, und fällt damit nicht unter die Regel in [fallstricke.md](fallstricke.md) §1.
  Immer mit `target="_blank"`, sonst verlässt der Vortragende sein Deck.
- `deck.js` nimmt Klicks auf `a`, `button` und `video` vom Blättern aus. Ein Link auf einer
  Folie schaltet also nicht nebenbei weiter.

`.path` ist breiter als er aussieht. „Ansicht → Zeige Thumbnail Erstellungsdatum und -zeit"
misst 715 px und passt **nicht** in die 660 px breite `.col-l` — dann einen eigenen Block
darunter setzen.

### Sequenz

```html
<section … data-fragments="3">
  <div class="steps"> <span class="step is-on"><span class="step__n">01</span>Standard</span> … </div>
  <div class="seq" style="left:872px;top:250px;width:936px;height:560px">
    <div class="seq__stack">
      <div class="seq__item is-on"> <div class="shot" style="…"> … </div> </div>
      <div class="seq__item">       <div class="shot" style="…"> … </div> </div>
    </div>
  </div>
</section>
```

Erstes `.seq__item` und erster `.step` bekommen `is-on`.

> **Haben die Bilder unterschiedliche Seitenverhältnisse**, darf `.shot` **nicht** `inset:0`
> bekommen — sonst wird verzerrt oder beschnitten. Dann jedes `.shot` mit eigenen
> `left/top/width/height` mittig in die `.seq`-Fläche rechnen. Folie 18 macht genau das:
> 1150×717, 610×489 und 950×204 landen alle auf derselben Mitte.

### Zeiger

Deutet auf eine Stelle **im** Screenshot und wandert mit den Fragmentschritten weiter.
Auf Folie 12 zeigt er von unten auf die jeweils aktive Umschalt-Schaltfläche in der
Fußleiste der Aufnahme.

```html
<div class="pointer" data-anim data-pointer="1460,1494,1526.5" style="left:0;top:806px">
  <svg viewBox="0 0 26 44" aria-hidden="true">
    <path d="M13 0 L23.5 16 H16.4 V37 a3.4 3.4 0 0 1-6.8 0V16H2.5Z"/>
  </svg>
</div>
```

- `data-pointer` hält **eine x-Position je Fragmentschritt**, in Bühnenkoordinaten.
  Das Element selbst steht bei `left:0`; `transitions.js → movePointer` schiebt es per
  `transform: translateX` an sein Ziel. Sind es weniger Werte als Schritte, bleibt der
  Zeiger auf dem letzten stehen.
- `top` ist die Stelle, auf die gezeigt wird — die **Spitze liegt oben**, die Grafik
  hängt darunter. Sie misst **58 × 98 px** (auf Wunsch des Auftraggebers vergrößert; vorher
  26 × 44 px und aus der letzten Reihe nicht mehr erkennbar). Bei `top:806` endet sie damit
  auf y = 904 — der Platz bis y = 940 ist die Obergrenze für weiteres Wachsen.
- Die x-Werte **an der Aufnahme messen**, nicht schätzen. Für Folie 12 sind es die
  Mitten der weißen Rahmen in `dev/build/shots/12-*`.
- Bewegt wird ausschließlich `translateX`, und nur beim Schrittwechsel. **Kein
  dauerndes Wippen** — Leerlaufbewegung bindet den Blick auch dann, wenn nichts
  passiert (siehe [Kostenregeln](#kostenregeln--nicht-verhandelbar)).

### Demo-Break

**Derzeit von keiner Folie benutzt** — die drei Demo-Break-Folien sind auf Wunsch des
Auftraggebers entfallen. Die Klassen bleiben im Stylesheet, damit sie sich ohne neues CSS
wieder einsetzen lassen.

```html
<section class="slide" data-title="Live in byzz" data-bare>
  <div class="slide-inner"><div class="demo"><div class="demo__in">
    <div class="demo__k"><svg><use href="#i-monitor"/></svg>Jetzt live</div>
    <h2 class="demo__t">Aussage in einem Satz.</h2>
    <p class="demo__s">Was konkret gezeigt wird.</p>
  </div></div></div>
</section>
```

### Dauerhafte Rahmenelemente

Beide liegen in `index.html` **außerhalb** der `<section>`-Blöcke, aber **innerhalb von
`#frame`**, und stehen auf jeder Folie — auch auf Titel, Trennern und Schlussfolie. In eine
`<section>` gehören sie nicht. Dass sie im Rahmen liegen und nicht in der Bühne, ist
Absicht: sie sollen an der komponierten Kante sitzen, nicht an der Fensterkante.

```html
<div id="brand"><img src="assets/brand/logo_od_premium_big.png" alt="…"></div>
<div id="wordmark" aria-hidden="true">byzz&nbsp;<b>11</b></div>
```

`#wordmark` sitzt rechts unten, spiegelbildlich zum Logo: `right:112px; bottom:64px`,
Display-Schrift 30 px/600. „byzz" steht in `--ink-3` — demselben Grau wie die Kopfzeile
links oben —, die `11` in `--orange-deep`. **Nicht `--orange`:** bei dieser Größe liegt der
Kontrast auf `--paper` bei 2,3:1 und ist auf dem Beamer nicht lesbar.

### Sprachraster

```html
<div class="langs" style="left:112px;top:400px;width:1696px">
  <div class="lang"><div class="lang__n">Deutsch</div><div class="lang__c">DE</div></div>
</div>
```
Vier Spalten. `lang--new` setzt ein NEU-Fähnchen (derzeit ungenutzt — es ist nicht belegt,
welche der acht Sprachen wirklich neu hinzugekommen sind).

---

## Piktogramme

`<svg><use href="#ID"/></svg>`. Die Symbole liegen inline in `index.html`, weil `<use href>`
auf eine externe SVG-Datei unter `file://` nicht auflöst.

```
i-server   i-chip     i-gauge    i-scan      i-plug     i-play
i-mobile   i-clock    i-layout   i-sparkle   i-cube     i-brain
i-export   i-download i-camera   i-search    i-database i-key
i-globe    i-doc      i-film     i-link      i-eye      i-monitor
i-arrow
```

`i-export` und `i-download` sind dieselbe Schale mit gespiegeltem Pfeil — oben heraus für
den Export, unten hinein für den Download. Nicht vertauschen, das liest sich sofort falsch.

**Keine anderen IDs erfinden** — sie rendern als Leerfläche.

Alle sind Konturzeichnungen. Die globale Regel in `deck.css` setzt `fill:none; stroke:
currentColor`. Ohne sie würde der Browser die Pfade füllen und aus jedem Icon einen
schwarzen Klecks machen — das war einer der ersten Fehler beim Bauen.

Ein neues Symbol anlegen: `<symbol id="i-name" viewBox="0 0 24 24">` in den `<defs>`-Block
von `index.html`, Strichstärke nicht setzen (kommt aus dem CSS), und **bei 44 px prüfen** —
ein Icon mit zu vielen Linien wird bei dieser Größe unlesbar. Das ursprüngliche `i-film`
war ein Raster aus Quer- und Längslinien und las sich als Tabelle; jetzt ist es ein
Filmstreifen mit Perforation.

---

## Bilder

**Nur was in `assets/img/` liegt, existiert.** Jede Datei hat eine `.soft.jpg`-Miniatur.
`max` ist die größte erlaubte Anzeigebreite — darüber wird die byzz-Oberfläche auf dem
Beamer sichtbar unscharf, und der Prüflauf meldet es.

| Datei | nativ (`width`/`height`) | max | Inhalt |
|---|---|---|---|
| `xray1.webp` | 1360 × 798 | 1360 | Bildansicht Standard |
| `xray2.webp` | 1360 × 798 | 1360 | Bildansicht Raster |
| `xray3.webp` | 1360 × 798 | 1360 | Bildansicht Liste |
| `erstellungsdatum.webp` | 1360 × 798 | 1360 | Thumbnails mit Datum |
| `externeprogramme.webp` | 1360 × 798 | 1360 | Einstellungen Externe Programme |
| `opg.webp` | 1520 × 717 | 1520 | OPG mit KI-Analyse |
| `dvt-export1.webp` | 1150 × 717 | 1150 | Kontextmenü Export |
| `dvt-export2.webp` | 610 × 489 | 610 | Dialog DVT-Export |
| `dvt-export3.webp` | 950 × 204 | 950 | Ergebnisordner |
| `app-home.webp` | 1600 × 899 | 1600 | Startseite Browser/Desktop |
| `app-login.webp` | 1600 × 892 | 1600 | App-Login |
| `app-patienten.webp` | 1600 × 826 | 1600 | Patientenliste |
| `app-dvts.webp` | 1600 × 892 | 1600 | Reiter DVT |
| `app-options.webp` | 1424 × 900 | 1424 | Einstellungen der App |
| `app-3d.webp` | 1600 × 896 | 1600 | DVT-Viewer in der App |
| `bcc.webp` | 1251 × 733 | 1251 | byzz Control Center (Schlussfolie) |
| `qr-appstore.svg` · `qr-playstore.svg` | — | — | Store-QR-Codes |

Videos: `dvt-viewer.mp4` und `model-viewer.mp4`, beide 1440 × 810, stumm.

**Bewährte Panelmaße** (Seitenverhältnis exakt einhalten):

| nativ | Panel neben `.col-l` | Panel mittig |
|---|---|---|
| 1360 × 798 | 936 × 549 | 1200 × 704 |
| 1600 × ~890 | 988 × 551 | 1180 × 658 |
| 1520 × 717 | 948 × 447 | 1180 × 557 |
| 1440 × 810 (Video) | 960 × 540 | 1100 × 619 |

---

## Bewegung

Das Deck ist **eine Kamerafahrt**, kein Stapel Folien.

| | Vorwärts | Rückwärts |
|---|---|---|
| eingehend | `opacity 0→1, scale .968→1, blur 11→0px` | `scale 1.035→1` |
| abgehend | `opacity 1→0, scale 1→1.03, blur 0→8px` | `scale 1→.972` |
| Kinder `[data-anim]` | `y 26→0`, gestaffelt 45 ms | `y −22→0` |

Blur liegt **nur** auf `.slide-inner`, nie auf Einzelelementen. Screenshots weichen über
ihre vorgeblurte Zwillingsebene auf — dort läuft ausschließlich Deckkraft.

`data-anim` setzt du auf **Gruppen** (Headline, Strich, Fließtext, Kartenraster als Ganzes),
nicht auf jede einzelne Karte. Faustregel: **3–6 pro Folie**, in Lesereihenfolge.

### Kostenregeln — nicht verhandelbar

1. Aurora ausschließlich als `radial-gradient`, **nie** `filter: blur()`. Ein `blur(200px)`
   auf Kreisen dieser Größe ist der klassische Performance-Selbstmord in diesem Stil.
2. Maximal **zwei gleichzeitig geblurrte Ebenen** (abgehende + eingehende Folie).
3. Animierter Blur-Radius **≤ 12 px**, danach `filter: none` — nicht `blur(0px)` stehen
   lassen, sonst bleibt die Filter-Pipeline aktiv.
4. `will-change` chirurgisch: direkt vor dem Tween setzen, im `onComplete` zurücknehmen.
   Nie dauerhaft im Stylesheet — 32 permanent beförderte Ebenen fressen Grafikspeicher.
5. `backdrop-filter` höchstens einmal pro Folie, Radius nie animiert.
6. **Kein Leerlauf-Wackeln.** Der Hintergrund bewegt sich nur als Folge eines Folienwechsels
   und steht danach still. Dauerbewegung ohne Anlass liest sich als Zappeln.
7. **Das Markensymbol wandert nicht.** `#blobmark` steht fest rechts und vertikal mittig
   (`left:860px; top:218px; width:1240px`, ungedreht). Beim Folienwechsel läuft
   ausschließlich die Deckkraft: `0.11` auf Trennern, `0.035` auf Inhaltsfolien — nie auf
   null, das Zeichen bleibt durchgehend leicht sichtbar.

Taste `B` schaltet alles davon global ab — der Notausgang für fremde Vorführhardware.

---

## Schreibregeln

- **Headline ist eine Aussage, kein Etikett.** „Server und Client sprechen jetzt HTTP."
  statt „HTTP-Umstellung". Sie muss allein stehen können, auch ohne das Bild daneben.
- **Ein Gedanke pro Folie.** Zwei Stichpunktgruppen oder zwei Bilder heißen: teilen.
- **Publikum ist der Kunde.** Das Deck lief zuerst als internes Vertriebsmeeting; seit
  Nachtrag 6 wird es beim Kunden gezeigt. Also nicht über den Kunden sprechen, sondern zu
  ihm: was ist es, was bringt es in der Praxis, worauf muss man achten. Trotzdem nicht
  bewerben — keine Superlative, keine Versprechen. Das gilt auch für die Sprechnotizen.
- **Sprechnotizen sind Zusammenfassungen, keine Regieanweisungen.** Das Deck wird auch
  weitergegeben und allein durchgesehen — Anweisungen an den Vortragenden („kurz durchgehen",
  „beim Vorführen …", „nichts zusagen") gehören nicht hinein. Einschränkungen als Aussage
  formulieren. Ausführlich in [folien-bearbeiten.md](folien-bearbeiten.md#sprechnotizen-ändern).
- `.lead` maximal 3 Zeilen, `.card__d` maximal 2.
- Nichts erfinden, was nicht belegt ist. Lieber knapper schreiben als spekulieren.
