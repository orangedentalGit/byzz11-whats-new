# Folien bearbeiten

Kochbuch für die häufigsten Änderungen. Bausteinkatalog steht in
[design-system.md](design-system.md), Stolperfallen in [fallstricke.md](fallstricke.md).

---

## Wo die Folien stehen

Alle 34 Folien stehen in `index.html`, jede in einer eigenen `<section class="slide">`.
**Das ist die einzige Quelle.** Kein Werkzeug erzeugt diese Datei, keines überschreibt
sie — Ändern heißt: aufmachen, `<section>` suchen, schreiben.

Früher setzte `assemble.mjs` den Folienbereich aus Teildateien unter `dev/build/slides/`
zusammen, weil fünf Agenten parallel daran gebaut haben. Beides ist entfernt; übrig war
davon nur die Falle, dass jede Korrektur an zwei Stellen stehen musste und der
Abnahmelauf die eine davon wegräumte ([fallstricke.md §9](fallstricke.md)).

---

## Text einer Folie ändern

1. `index.html` öffnen, nach dem Folientitel suchen (`data-title="…"`).
2. Ändern.
3. `node dev/build/shot.mjs 15` — schießt Folie 15 neu und prüft das Layout.
4. `dev/build/shots/15.jpg` ansehen.

Über jeder Folie steht ein Kommentar mit Nummer und Titel (`<!-- 15 · 3D-Modelldaten im
Model-Viewer -->`), die Nummer entspricht der Anzeige im Deck.

**Beim Kürzen und Verlängern auf die Zeilenzahl achten:** `.lead` darf maximal drei Zeilen
haben, `.card__d` zwei. Läuft ein Text über, rutscht darunter alles nach unten und stößt
irgendwann in die Logo-Zone. Der Prüflauf meldet das, aber erst wenn es zu spät ist —
lieber gleich kürzen.

---

## Sprechnotizen ändern

Stehen in der jeweiligen `<section>` in `<template class="notes">`:

```html
<template class="notes">
  <p>Zwei bis vier Sätze. <b>Fett</b> für die Kernaussage, <code>Mono</code> für Pfade.</p>
</template>
```

Erlaubt: `<p>`, `<b>`, `<code>`, `<ul>/<li>`. Sichtbar **nur** in der Referentenansicht
(`P`), dort dauerhaft — im Hauptfenster erscheinen die Notizen nie, das hängt am Beamer.
Ein `<template>` wird nie gerendert, du kannst dort nichts kaputt machen.

**Die Notizen sind Zusammenfassungen, keine Regieanweisungen.** Das Deck wird auch
weitergegeben und allein durchgesehen; wer es dann öffnet, ist nicht der Vortragende.
Also: was zeigt die Folie, was heißt das in der Praxis, was gehört zur Einordnung dazu.

Nicht hineinschreiben: „kurz durchgehen", „nicht vorlesen", „beim Vorführen …",
„ansagen, dass …", „nichts zusagen", „Fragen sammeln" — alles, was den Vortragenden
anspricht statt die Folie zu erklären. Fachliche Einschränkungen bleiben, aber als
Aussage: „Zu weiteren Formaten liegt nichts vor." statt „Nichts weiter zusagen."

---

## Screenshot austauschen

1. Neues Bild nach `dev/screenshots/` legen.
2. In `dev/build/prepare-images.mjs` in die `PLAN`-Tabelle eintragen:
   ```js
   ['MeinBild.jpg', 1360],   // Zielbreite = Panelbreite auf der 1920er Bühne
   ```
3. `node dev/build/prepare-images.mjs` — erzeugt `meinbild.webp` und `meinbild.soft.jpg`.
   Die Ausgabe zeigt die tatsächlichen Maße; **die brauchst du gleich.**
4. In der Folie `src`, `width`, `height` und die Panelmaße anpassen.

**Panelhöhe rechnen, nicht schätzen:**
```
Panelhöhe = Panelbreite × (natives Höhe / natives Breite)
```
Beispiel 1600 × 892 bei Panelbreite 988: `988 × 892/1600 = 550,8` → `height:551px`.
Stimmt das nicht, wird der Screenshot verzerrt — auffällig bei UI-Aufnahmen.

**Die 1,15-Regel:** Kein Bild über das 1,15-fache seiner nativen Breite ziehen. Das Skript
deckelt beim Erzeugen, der Prüflauf meldet beim Anzeigen. Darüber matscht die byzz-Oberfläche
auf dem Beamer sichtbar.

---

## Fehlende App-Screenshots nachliefern

Auf Folie 32 („Alles in einer App") haben PDF-Viewer, Video-Player und Kamera-Aufnahme nur
Piktogramme, weil es keine Screenshots gibt. So werden daraus Bilder:

1. Screenshot nach `dev/screenshots/` legen, in `prepare-images.mjs` eintragen, Skript laufen lassen.
2. In der Karte das Piktogramm ersetzen:
   ```html
   <!-- vorher -->
   <div class="card__ico"><svg><use href="#i-doc"/></svg></div>
   <!-- nachher -->
   <img class="card__shot" src="assets/img/pdf-viewer.webp" alt="PDF-Viewer in der byzz app">
   ```
`.card__shot` ist dafür schon im Stylesheet: 132 px hoch, `object-fit: cover`, gerundet.
Die anderen Karten bleiben unverändert — das Raster gleicht die Höhen aus.

**Achtung bei Folie 32:** Das Raster ist `cards--app` (vier Karten 2×2, Kamera-Aufnahme als
`.card--wide` rechts über beide Reihen, siehe
[design-system.md](design-system.md#vier-plus-eins-cards--app)). Ein `.card__shot` in einer
der **vier** Karten macht deren Reihe 132 px höher — und damit beide Reihen, weil sie gleich
hoch bleiben. Der Block läuft dann unten aus dem Raster. In dem Fall den Startwert `top:518`
verkleinern und die Kartentexte kürzen, oder das Bild nur in `.card--wide` einsetzen: die
hohe Karte hat Platz dafür, ohne dass sich am Rest etwas ändert.

---

## Folie hinzufügen

1. Eine ähnliche `<section>` kopieren und einfügen.
2. `data-title` setzen (Pflicht — steht in Übersicht und Referentenansicht).
3. `data-section` setzen: `1` Haube, `2` Menüs, `3` Features, `4` app. Weglassen bei
   Titel, Trennern, Demo-Breaks und Schlussfolien.
4. Kommentar mit Nummer und Titel drüber setzen, die folgenden Nummern nachziehen.
5. `node dev/build/shot.mjs` — der Zähler „05 / 34" zählt automatisch neu.
6. `node dev/build/inventory.mjs` — schreibt die Tabelle in `dev/docs/inhalt.md` fort.

---

## Folien umsortieren

Zwei `<section>`-Blöcke in `index.html` tauschen und die Nummern in den Kommentaren
darüber anpassen. Sonst nichts — Zähler, Übersicht und Fortschrittsbalken lesen die
DOM-Reihenfolge, nicht die Kommentare.

---

## Mehrstufige Folie bauen

**Zwei Bilder oder mehr an derselben Stelle** (wie Folie 12, 18):

```html
<section class="slide" data-title="…" data-section="3" data-fragments="3">
  <div class="slide-inner">
    <div class="col-l" style="top:224px">
      …
      <div class="steps" style="position:relative;margin-top:38px">
        <span class="step is-on"><span class="step__n">01</span>Erstens</span>
        <span class="step"><span class="step__n">02</span>Zweitens</span>
        <span class="step"><span class="step__n">03</span>Drittens</span>
      </div>
    </div>

    <div class="seq" style="left:872px;top:250px;width:936px;height:549px">
      <div class="seq__stack">
        <div class="seq__item is-on"><div class="shot" style="inset:0"> … </div></div>
        <div class="seq__item">      <div class="shot" style="inset:0"> … </div></div>
        <div class="seq__item">      <div class="shot" style="inset:0"> … </div></div>
      </div>
    </div>
  </div>
</section>
```

`data-fragments` muss zur Zahl der `.seq__item` passen. Erstes Element und erster Step
bekommen `is-on`.

**Elemente nacheinander einblenden** statt Bilder tauschen:

```html
<section … data-fragments="3">
  …
  <p class="body" data-frag="1">Erscheint bei Schritt 1</p>
  <p class="body" data-frag="2">Erscheint bei Schritt 2</p>
```
Alles ohne `data-frag` ist ab Schritt 0 sichtbar.

Prüfen mit `node dev/build/shot.mjs --frag 18` — schießt jeden Schritt einzeln als
`18-1.jpg`, `18-2.jpg`, `18-3.jpg`.

---

## Wenn der Prüflauf meckert

`node dev/build/shot.mjs` meldet vier Sorten Befund:

| Meldung | Bedeutung | Behebung |
|---|---|---|
| `[overflow] … ragt aus der Bühne` | Element außerhalb 0–1920 / 0–1080 | `left`/`top`/`width` korrigieren |
| `[logo] … liegt in der Logo-Schutzzone` | etwas unter y = 948 links | Block nach oben, oder Text kürzen |
| `[scale] … auf 1,3× hochskaliert` | Panel breiter als das Bild verträgt | Panel verkleinern oder Bild neu erzeugen |
| `[img] … nicht geladen` | Datei fehlt oder Pfad falsch | Dateiname prüfen, `prepare-images.mjs` laufen lassen |

Zusätzlich wird jede Konsolenmeldung des Browsers gemeldet. **Jede CORS-Meldung ist ein
`file://`-Verstoß und ein Blocker** — siehe [fallstricke.md](fallstricke.md).

---

## Farben, Schrift oder Abstände ändern

In `assets/css/deck.css` ganz oben stehen die Tokens. Ein Wert dort ändert das ganze Deck.

**Bevor du eine neue Klasse schreibst:** prüf die Liste in
[design-system.md](design-system.md#bausteine). Es gibt fast immer schon etwas. Neue Klassen
gehören ins Stylesheet und in die Doku — nicht als `style="…"`-Einzelfall in eine Folie.

Ausnahme: **Position und Größe** gehören als Inline-Style an die Folie. Das ist Absicht — so
sieht man beim Lesen einer Folie sofort, wo etwas liegt, ohne im CSS zu suchen.

---

## Nach jeder Änderung

```bash
node dev/build/shot.mjs        # alle Folien neu, mit Layoutprüfung
node dev/build/inventory.mjs   # Foliengliederung in dev/docs/inhalt.md fortschreiben
```

Vor der Abgabe einmal komplett:

```bash
node dev/build/verify.mjs      # Folien · Rahmen · Referentenansicht · Kaltstart
```

Und dann **einmal wirklich `index.html` doppelklicken**. Kein Prüfskript ersetzt das.
