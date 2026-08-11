# Agenten-Briefing

Rückschau auf den Parallelbau: So sind die 30 Folien nach den fünf Referenzfolien
entstanden — fünf Agenten gleichzeitig, jeder in einer eigenen Teildatei, danach eine
Montage zu `index.html`.

**Der Mechanismus ist entfernt** ([fallstricke.md §9](fallstricke.md)). Teildateien und
Montage gibt es nicht mehr; `index.html` ist die einzige Quelle. Wer ein *neues* Deck
parallel bauen lassen will, nimmt den Skill `create-slides`. Wer an *diesem* Deck etwas
ändert, geht nach [folien-bearbeiten.md](folien-bearbeiten.md).

Was bleibt, ist das Teure daran: wie man solche Aufträge schneidet und was in ein
Briefing gehört, damit brauchbare Folien herauskommen. Genau dafür steht dieses Dokument
noch hier.

Die Aufteilung damals — je 3 bis 9 Folien pro Agent hat gut funktioniert: 1, 3, 4, 12, 22
waren die von Hand gebauten Referenzfolien, die übrigen verteilten sich in Blöcken
(2/33/34 · 5–10 · 11/13–16 · 17–21/23 · 24–32) auf fünf Agenten.

---

## Was in jedes Briefing gehört

**1 · Pflichtlektüre, in dieser Reihenfolge**

- `dev/docs/design-system.md` — Raster, Farben, Schrift, Bausteine, Bildtabelle, Piktogramme
- `index.html` — die fertigen Referenzfolien als Muster für Stil und Tonfall

**2 · Genau eine Ausgabedatei je Agent**, kein Zugriff auf `assets/` oder fremde
Ausgabedateien. Zwei Agenten in derselben Datei geht nicht gut.

**3 · Fachlicher Kontext.** byzz ist eine Bildverwaltungs- und Diagnosesoftware für
Zahnarztpraxen (Röntgen, OPG, Fernröntgen, DVT, Intraoralkamera, Modelldaten). Publikum ist
der Kunde — die Praxis, der orangedental byzz 11 vorstellt. Produktname **byzz 11**.

**4 · Je Folie:** Nummer, `data-title`, `data-section`, gewünschter Baustein, der Inhalt in
Stichpunkten, und welches Bild oder Video verwendet wird — mit nativen Maßen.

**5 · Die harten Grenzen**, weil sie sonst niemand einhält:

- Inhalt zwischen y = 200 und y = 940
- nichts in x 100–372 / y 948–1034 (Logo)
- kein Bild über 1,15× seiner nativen Breite
- Panelhöhe aus dem nativen Seitenverhältnis **rechnen**, nicht schätzen
- `.lead` maximal 3 Zeilen, `.card__d` maximal 2
- 3–6 `data-anim` pro Folie, auf Gruppen, in Lesereihenfolge
- je Folie ein `<template class="notes">` mit 2–4 Sätzen
- keine Piktogramm-IDs erfinden
- nichts erfinden, was nicht im Briefing steht — lieber knapper schreiben

**6 · Abschlussmeldung anfordern:** was gebaut wurde, welche y-Bereiche belegt sind, und wo
es eng wurde. Das ist die wertvollste Rückmeldung — dort stecken die Stellen, die später
kippen.

---

## Was sich bewährt hat

**Zahlen vorgeben, nicht Adjektive.** „Panel z. B. `left:872;top:250;width:936;height:549`"
liefert bessere Ergebnisse als „das Panel rechts groß". Die Agenten rechnen die
Abweichung selbst korrekt aus, brauchen aber einen Anker.

**Bekannte Klippen vorwegnehmen.** Bei der DVT-Export-Sequenz haben die drei Bilder sehr
unterschiedliche Seitenverhältnisse (1,60 / 1,25 / 4,66). Der Hinweis „die können nicht in
einen gemeinsamen festen Rahmen, rechne jedes einzeln mittig in die Fläche" hat eine
verzerrte Folie verhindert.

**Ehrlichkeit ausdrücklich verlangen.** „Erfinde keine Angaben zu Dateiformaten" und
„schreib nichts über Funktionsumfang, was du nicht sicher weißt" wirken — ohne diese Sätze
wird plausibel klingender Unsinn ergänzt.

**Eigene `<marker>`-IDs bei SVG-Diagrammen.** Mehrere Agenten haben unabhängig Pfeilspitzen
gebraucht. Ohne den Hinweis heißen sie alle `#ah` und überschreiben sich gegenseitig, sobald
die Folien in einer Datei stehen. Die Agenten haben von sich aus `ah-e-grey`, `ah-dep-o` usw.
vergeben, nachdem das Problem benannt war.

**Variation einfordern**, wenn ein Agent viele ähnliche Folien baut. Ohne den Hinweis „nicht
neunmal dieselbe Folie" entsteht ein monotoner Block.

---

## Nach dem Lauf

Von der Projektwurzel aus, kein `cd` nötig:

```bash
node dev/build/shot.mjs --frag        # alle Folien fotografieren und prüfen
node dev/build/inventory.mjs          # Gliederung in dev/docs/inhalt.md fortschreiben
```

> **Agenten bessern nach.** Zwei der fünf haben ihre Teildatei noch korrigiert, *nachdem*
> die Folien schon zusammengeführt waren — die Korrektur ging beim nächsten Lauf beinahe
> verloren. Erst zusammenführen, wenn alle fertig gemeldet haben, und danach nur noch an
> einer Stelle arbeiten.

Anschließend den Kontaktbogen aller Folien ansehen (Rezept in
[werkzeuge.md](werkzeuge.md#kontaktbogen-bauen)). Der Prüflauf findet Überlappungen und
Überläufe zuverlässig — aber ob eine Folie *gut* ist, sieht man nur.
