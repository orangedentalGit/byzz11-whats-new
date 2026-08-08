# Agenten-Briefing

Vorlage, um Folien **parallel von mehreren Agenten** bauen zu lassen. So sind die 30 Folien
nach den fünf Referenzfolien entstanden: fünf Agenten gleichzeitig, danach eine Montage.

Wer nur ein, zwei Folien ändert, braucht das hier nicht — dann direkt
[FOLIEN-BEARBEITEN.md](FOLIEN-BEARBEITEN.md).

---

## Warum Teildateien statt gemeinsamer Datei

Mehrere Agenten dürfen nicht gleichzeitig in `index.html` schreiben. Jeder bekommt deshalb
eine eigene Datei unter `dev/build/slides/partX.html` und schreibt dort **nur** die
`<section class="slide">`-Blöcke, ohne umgebendes Gerüst. `dev/build/assemble.mjs` setzt daraus
`index.html` zusammen; die Reihenfolge steht in `ORDER` und mischt die Teildateien beliebig.

Aufteilung beim ersten Bau — je 3 bis 9 Folien pro Agent hat gut funktioniert:

| Datei | Folien |
|---|---|
| `partBase.html` | 1, 3, 4, 12, 22 — die von Hand gebauten Referenzfolien |
| `partA.html` | 2, 33, 34 |
| `partB.html` | 5–10 |
| `partC.html` | 11, 13–16 |
| `partD.html` | 17–21, 23 |
| `partE.html` | 24–32 |

Maßgeblich ist immer `ORDER` in `dev/build/assemble.mjs`, nicht diese Tabelle.

---

## Was in jedes Briefing gehört

**1 · Pflichtlektüre, in dieser Reihenfolge**

- `dev/docs/DESIGN-SYSTEM.md` — Raster, Farben, Schrift, Bausteine, Bildtabelle, Piktogramme
- `index.html` — die fertigen Referenzfolien als Muster für Stil und Tonfall

**2 · Genau eine Ausgabedatei**, kein Zugriff auf `index.html`, `assets/` oder fremde Teildateien.

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
gebraucht. Ohne den Hinweis heißen sie alle `#ah` und überschreiben sich nach der Montage
gegenseitig. Die Agenten haben von sich aus `ah-e-grey`, `ah-dep-o` usw. vergeben, nachdem
das Problem benannt war.

**Variation einfordern**, wenn ein Agent viele ähnliche Folien baut. Ohne den Hinweis „nicht
neunmal dieselbe Folie" entsteht ein monotoner Block.

---

## Nach dem Lauf

Von der Projektwurzel aus, kein `cd` nötig:

```bash
node dev/build/assemble.mjs --check   # sind alle Teildateien vollständig?
node dev/build/assemble.mjs           # zusammensetzen
node dev/build/shot.mjs --frag        # alle Folien fotografieren und prüfen
node dev/build/inventory.mjs          # Gliederung in dev/docs/INHALT.md fortschreiben
```

> **Agenten bessern nach.** Zwei der fünf haben ihre Teildatei noch korrigiert, *nachdem*
> ich zusammengesetzt hatte — die Korrektur landete deshalb erst im zweiten Montagelauf.
> Erst montieren, wenn alle Agenten fertig gemeldet haben, und danach nicht mehr direkt in
> `index.html` arbeiten.

Anschließend den Kontaktbogen aller Folien ansehen (Rezept in
[WERKZEUGE.md](WERKZEUGE.md#kontaktbogen-bauen)). Der Prüflauf findet Überlappungen und
Überläufe zuverlässig — aber ob eine Folie *gut* ist, sieht man nur.
