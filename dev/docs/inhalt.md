# Inhalt

Was auf den Folien steht, woher es stammt und welche Entscheidungen dahinterstehen.
Damit niemand versehentlich etwas rückgängig macht, das bewusst so ist.

---

## Auftrag

Präsentation beim Kunden, Thema **byzz 11**. Publikum ist die Praxis, der orangedental die
neue Version vorstellt. Ziel ist nicht Werbung, sondern Verständnis: die Zuhörer sollen
danach wissen, was neu ist und was es ihnen im Alltag bringt.

Gebaut wurde das Deck ursprünglich für ein **internes Vertriebsmeeting** (10–15 Teilnehmer
aus dem eigenen Außendienst). Mit Nachtrag 6 wurde es zur Kundenpräsentation umgewidmet:
der sichtbare Folientext blieb bis auf die dort genannten Punkte gleich, sämtliche
Sprechnotizen wurden umgeschrieben. Wer das nicht weiß, hält die Umformulierungen für
Zufall und dreht sie zurück.

**Produktname ist „byzz 11"** — nicht „v11", nicht „byzz nxt v11". Der alte Entwurf mischte
beides; der Auftraggeber hat sich festgelegt.

---

## Foliengliederung

<!-- INVENTAR:START -->

| #  | Folie                                             | Abschnitt   | Typ         | Material                                             | Notiz  |
|----|---------------------------------------------------|-------------|-------------|------------------------------------------------------|--------|
| 01 | byzz 11 — Was ist neu                             | —           | Titel       | —                                                    | 198 Z. |
| 02 | Agenda                                            | —           | Text        | —                                                    | 439 Z. |
| 03 | Neues unter der Haube                             | 01 Haube    | Trenner     | —                                                    | 236 Z. |
| 04 | Server und Client sprechen HTTP                   | 01 Haube    | Diagramm    | —                                                    | 484 Z. |
| 05 | Von 32 auf 64 Bit                                 | 01 Haube    | Diagramm    | —                                                    | 456 Z. |
| 06 | byzz Paro und Green X evo 21                      | 01 Haube    | Karten      | —                                                    | 453 Z. |
| 07 | Externe Programme finden sich selbst              | 01 Haube    | Screenshot  | externeprogramme.webp                                | 715 Z. |
| 08 | Neue Menüpunkte                                   | 02 Menüs    | Trenner     | —                                                    | 216 Z. |
| 09 | Das Hilfe-Menü                                    | 02 Menüs    | Karten      | qr-appstore.svg, qr-playstore.svg                    | 554 Z. |
| 10 | Aufnahmedatum am Vorschaubild                     | 02 Menüs    | Screenshot  | erstellungsdatum.webp                                | 426 Z. |
| 11 | Neue Features                                     | 03 Features | Trenner     | —                                                    | 309 Z. |
| 12 | Bildansichten in drei Modi                        | 03 Features | Sequenz (3) | xray1.webp, xray2.webp, xray3.webp                   | 370 Z. |
| 13 | Ansichten anpassen und Look & Feel                | 03 Features | Karten      | —                                                    | 519 Z. |
| 14 | KI-gestützte Läsionserkennung                     | 03 Features | Screenshot  | opg.webp                                             | 550 Z. |
| 15 | 3D-Modelldaten im Model-Viewer                    | 03 Features | Video       | model-viewer.mp4                                     | 388 Z. |
| 16 | DVT-Viewer als neuer Standard                     | 03 Features | Video       | dvt-viewer.mp4                                       | 392 Z. |
| 17 | DVT-Einstellungen: Ez3D-i und 3D-Slida            | 03 Features | Karten      | —                                                    | 378 Z. |
| 18 | DVT-Export mit eigenem Betrachter                 | 03 Features | Sequenz (3) | dvt-export1.webp, dvt-export2.webp, dvt-export3.webp | 608 Z. |
| 19 | dentaleyepad ohne Zusatzsoftware                  | 03 Features | Diagramm    | —                                                    | 460 Z. |
| 20 | Referenzsuche                                     | 03 Features | Diagramm    | —                                                    | 507 Z. |
| 21 | Merging und Migration                             | 03 Features | Screenshot  | merge-migrator.webp                                  | 496 Z. |
| 22 | Konfigurator: Lizenzierung, Aktivierung, Patching | 03 Features | Karten      | —                                                    | 284 Z. |
| 23 | byzz spricht acht Sprachen                        | 03 Features | Raster      | —                                                    | 400 Z. |
| 24 | byzz app                                          | 04 app      | Trenner     | —                                                    | 375 Z. |
| 25 | Die byzz app löst ibyzz ab                        | 04 app      | Diagramm    | —                                                    | 451 Z. |
| 26 | Einstieg über den Browser                         | 04 app      | Screenshot  | app-home.webp                                        | 343 Z. |
| 27 | Login                                             | 04 app      | Screenshot  | app-login.webp                                       | 245 Z. |
| 28 | Patientenliste                                    | 04 app      | Screenshot  | app-patienten.webp                                   | 269 Z. |
| 29 | Medien nach Typ                                   | 04 app      | Screenshot  | app-dvts.webp                                        | 338 Z. |
| 30 | Einstellungen der App                             | 04 app      | Screenshot  | app-options.webp                                     | 484 Z. |
| 31 | DVT-Viewer in der App                             | 04 app      | Screenshot  | app-3d.webp                                          | 353 Z. |
| 32 | Alles in einer App                                | 04 app      | Karten      | —                                                    | 524 Z. |
| 33 | byzz in neuer Generation                          | —           | Karten      | —                                                    | 668 Z. |
| 34 | Vielen Dank                                       | —           | Screenshot  | bcc.webp                                             | 487 Z. |

Folien gesamt: **34** · Screenshots: **11** · Sequenzen: **2** · Videos: **2** · Demo-Breaks: **0** · Diagramme: **5**

Automatisch erzeugt aus `index.html` von `dev/build/inventory.mjs`. Nicht von Hand ändern.

<!-- INVENTAR:END -->

---

## Quellen

| Quelle | Verwendung |
|---|---|
| `dev/screenshots/*.jpg` (18 Dateien) | **die einzige zugelassene Bildquelle**, 17 davon im Deck |
| `byzz v11 - Was ist neu.pptx` | nur die beiden Videos (`media1`, `media2`) — Datei inzwischen aus `dev/` entfernt, die Loops liegen fertig in `assets/video/` |
| `dev/design-system/logo_od_premium_big.png` | Logo unten links, Primärfarbe `#F68B1A` |
| `dev/design-system/logo_od_symbol.svg` | Pfad des Markenzeichens, inline in `index.html` |
| Store-URLs vom Auftraggeber | die beiden QR-Codes |

### Bewusst nicht verwendet

- **Höher aufgelöste Screenshots aus der `.pptx`.** Sie existierten (bis 3840 × 2400 gegenüber
  1249 × 733 in `dev/screenshots/`) und wären technisch besser gewesen. Der Auftraggeber hat sich
  ausdrücklich für die Fassungen aus `dev/screenshots/` entschieden — unter anderem, weil dort ein
  anderer Demo-Patient zu sehen ist. Die Entscheidung ist damit erledigt: Die `.pptx` ist aus `dev/`
  entfernt, ein Austausch steht gar nicht mehr zur Wahl. **Käme sie zurück, gilt weiter: nicht
  eigenmächtig austauschen.**
- **`Konfigurator.jpg`.** Vorhanden, aber vom Auftraggeber ausgeschlossen. Folie 22 arbeitet
  deshalb rein typografisch.
- **Topologie / Multistandort.** Stand im alten `.pptx`-Entwurf, wurde aber ausdrücklich aus
  dem Umfang genommen.
- **Die Sprechnotizen des alten Entwurfs.** 32 von 37 enthielten nur
  „Kamera ausschalten !!!!!!!!". Alle Notizen im Deck sind neu geschrieben.

---

## Inhaltliche Festlegungen

**Keine Demo-Breaks mehr.** Ursprünglich lagen drei Demo-Folien im Deck — nach den
Bildansichts-Modi, nach dem Feature-Block und nach dem App-Block. Der Auftraggeber hat sie
gestrichen; live vorgeführt wird trotzdem, nur ohne eigene Folie dafür. Die Bausteine dafür
(`.demo`) stehen weiter im Stylesheet. Der Chip auf der Agenda sagte dazu „Auch live in
byzz" — er trägt seit Nachtrag 6 den PDF-Download (siehe unten).

**Der byzz-app-Abschnitt ist bewusst granular** (9 Folien für einen Gliederungspunkt).
Der Auftraggeber hat ihn als wichtigsten Punkt des Releases eingestuft. Die übrigen Features
sind gemischt aufgelöst: Punkte mit Screenshot bekommen eine eigene Folie, der Rest ist zu
thematischen Sammelfolien gebündelt.

**Folie 15 „3D-Modelldaten im Model-Viewer" erweitert die ursprüngliche Gliederung um einen
Punkt.** Grund: `media1.mp4` zeigt den Desktop-Model-Viewer, nicht den der App — auf eine
App-Folie gelegt wäre es irreführend gewesen. Nach Rückfrage so entschieden.

**Der KI-Hinweis steht auf der Folie, nicht nur in den Notizen.** Folie 14 trägt ein
`badge--muted` „Zweitmeinung, keine Diagnose" plus die Zeile „Die Befundung bleibt beim
Behandler." Das ist bei einem Medizinprodukt keine Formalie — nicht entfernen.

**3D-Slida trägt „Testing steht noch aus" als sichtbares Badge** (Folie 17). Der
Auftraggeber hat das ausdrücklich so formuliert; es steht nicht ohne Grund auf der Folie.
Der frühere Zusatzsatz „Das Testing steht noch aus — bis dahin nichts dazu zusagen" ist auf
seinen Wunsch aus der Karte entfernt; die Aussage trägt jetzt allein das Badge.

**3D-Dateiformate: STL, OBJ, PLY** (Folie 15). Vom Auftraggeber nachgereicht. Eine frühere
Fassung nannte bewusst keine Formate, weil sie nicht belegt waren — das ist erledigt.
Darüber hinaus weiterhin nichts zusagen.

**Acht Sprachen ohne „NEU"-Markierung.** Dänisch, Deutsch, Englisch, Französisch,
Italienisch, Portugiesisch, Russisch, Spanisch. Welche davon neu hinzugekommen sind, ist
nicht belegt — deshalb steht nur die Gesamtzahl auf der Folie.

**Vordefinierte Fremdprogramme** (Diagnocat, exocad, Fussen, Shining 3D) sind auf Folie 7
untergebracht, wo auch der Screenshot dazu liegt — nicht doppelt im Feature-Teil.

**Die Netzwerkfreigabe ist nicht weg.** Ein früherer Entwurf behauptete auf der
Zusammenfassung „Kein Netzlaufwerk mehr". Das stimmt nicht: die Freigabe auf das
Bildverzeichnis besteht weiter, sie wird nur vom Konfigurator automatisch eingerichtet. Die
Aussage steht deshalb nur noch in den Notizen zu Folie 4, und die Karte ist gestrichen.
Folie 4 sagt jetzt „Standardprotokoll statt Microsoft-spezifischer Implementierung".

**Der ibyzz-Ablauf auf Folie 25 hat drei Stationen**, nicht vier: Gerät →
FTP-Installation → byzz 10 Server-Service. Einen Server-Service gab es auch in byzz 10
schon; der Unterschied ist allein die wegfallende FTP-Installation. Genau deshalb tragen
beide Zweige die Versionsnummer im Kasten („byzz 10 Server-Service" oben, „byzz 11
Server-Service" unten) — sonst liest sich das Schaubild, als sei der Server-Service neu.
Eine ältere Fassung zeigte zusätzlich einen Kasten „ibyzz" vor dem Server — das war falsch.

**Referenzsuche und Merging stehen auf getrennten Folien** (20 und 21). Beide lagen
zunächst als zwei Karten auf einer Folie. Der Auftraggeber hat sie getrennt: die
Referenzsuche ist eine Aussage über das Suchverhalten (eine gespeicherte Suche läuft bei
jedem Aufruf neu und findet auch bei geändertem Datenbestand die richtigen Bilder), Merging
und Migration sind ein eigenes Thema mit eigenem Screenshot (`merge_migrator.jpg`).

**Migrationsquellen: DICOMDIR, PACS und BVS** (Folie 21). BVS steht für
Bild-Verwaltungs-Software, also Bildverwaltungen anderer Hersteller mit eigener Datenbank.
Die vier Quellen sind im Screenshot des Merge Migrators als Auswahl zu sehen — mehr als das
nicht behaupten.

**MacOS gehört in die Plattformliste.** Android, iOS, MacOS, Browser — so auf Agenda,
Folie 25 und in der Zusammenfassung.

**Die Kamera-Aufnahme ist kein Betrachter** (Folie 32). Eine frühere Fassung zählte fünf
Betrachter auf und stellte die Kamera gleichrangig daneben. Der Auftraggeber hat das
korrigiert: es sind **vier** Betrachter (DVT, Modelldaten, PDF, Video), die Kamera-Aufnahme
begleitet sie — sie ist der Weg, wie Material in die Akte kommt, nicht der Weg, es
anzusehen. Das Layout bildet das ab: die vier stehen als 2×2-Block zusammen, die Kamera
daneben als eigene, größere Karte mit dem Hinweis **Reiter Kamera** (derselbe Reiter, der
auf Folie 29 in der Kategorienliste steht). Nicht wieder zu fünf gleichen Kacheln
zusammenziehen.

**Das Markensymbol steht still.** Es sitzt fest rechts und vertikal mittig und wechselt beim
Folienwechsel nur die Deckkraft (Details in [design-system.md](design-system.md#bewegung)).
Vorher wanderte es je Abschnitt an eine andere Stelle. Ausdrücklich so gewünscht — nicht
zurückbauen.

**Unten rechts steht auf jeder Folie „byzz 11"** als Wortmarke, Gegenstück zum Logo unten
links. Ebenfalls ausdrücklich so gewünscht.

---

## Aus Nachtrag 6 (Umwidmung zur Kundenpräsentation)

**Der PDF-Download steht auf der Agenda, nicht am Schluss** (Folie 2). Der Chip „Auch live
in byzz" ist einem klickbaren Link gewichen: „Diese Präsentation als PDF herunterladen",
Ziel `https://data.orangedental.de/f/1b3950c2c83846a78f99/?dl=1`. Zuerst war der Link für
die Schlussfolie vorgesehen; der Auftraggeber hat ihn nach vorn gezogen, damit er nicht erst
am Ende auffällt. Die Schlussfolie trägt ihn deshalb **nicht** noch einmal.

> Die Datei hinter dem Link wird **nicht** vom Build erzeugt. Nach jeder Folienänderung muss
> das frisch erzeugte `byzz-11-was-ist-neu.pdf` dort hochgeladen werden, sonst liefert der
> Link eine veraltete Fassung aus.

**Das Hilfe-Menü hat drei neue Einträge, nicht zwei** (Folie 9). Reihenfolge: „Häufig
gestellte Fragen", „Webinare", „App für Mobilgeräte". Der FAQ-Eintrag führt auf die
FAQ-Seite der orangedental-Webseite, „Webinare" wie bisher auf die Webinar-Seite — beide
Ziele sind bestätigt und **nicht** dieselbe Seite.

Die Folie zeigt trotzdem nur **zwei Karten**: die beiden Web-Einträge teilen sich eine,
weil sie dasselbe Ziel haben — die orangedental-Webseite. Beide Menüpfade stehen dort
untereinander, die Zahl drei bleibt also am Bildschirm nachweisbar und wird von der
Unterzeile „Alle drei führen aus byzz heraus" gehalten. Drei gleich breite Karten hatten
das Problem, dass die QR-Codes die Zeilenhöhe auf 496 px trieben und unter den beiden
Textkarten je rund 200 px Leerraum stehen blieben; in `cards--2` stehen die QR-Codes
neben dem Text statt darunter, und beide Karten sind gemessene 332 px hoch.

**byzz sucht keine Fremdprogramme** (Folie 7). byzz 11 **kennt die Standardpfade** der
unterstützten Programme; sie stehen von vornherein in den Feldern. Stimmt der Pfad — der
Regelfall bei installiertem Programm — ist das Programm sofort nutzbar, andernfalls lässt
sich der Eintrag anpassen. **Leer bleibt ein Feld nie.** Eine frühere Notiz behauptete,
byzz suche beim Start und trage die Pfade ein, und nicht installierte Programme hätten ein
leeres Feld. Beides war falsch.

**Nicht alle Ansichten sind ausblendbar** (Folie 13). **Control Center, Historie und Suche**
bleiben immer sichtbar. Die Zeile unten auf der Folie zählt nur die zehn ausblendbaren
Module auf und nennt die drei Ausnahmen ausdrücklich. Eine frühere Fassung listete alle
dreizehn als ausblendbar.

**Der Konfigurator beginnt mit der Lizenzierung** (Folie 22). Reihenfolge Lizenzierung →
Aktivierung → Patching. Die **Aktivierung** ist eine Art vorgefertigte Lizenzierung: die
Module sind vordefiniert, der Kunde bekommt einen Aktivierungscode, und aus dem
Aktivierungsvorgang über den Lizenzserver entsteht automatisch die Lizenz. So genau soll das
auf der Folie ausdrücklich **nicht** stehen — dort steht nur der eine Satz „Vorgefertigte
Lizenzen können auch über die Aktivierung freigeschaltet werden."

**Folie 30 „Einstellungen der App" ist neu.** Screenshot `app_options.jpg`. Zeigt die
Schalter für die Funktionalität, das Erscheinungsbild mit den Farbschemata und die
Sprachauswahl. Die Einstellungen gelten je Gerät.

**Die Schlussfolie dankt, sie fragt nicht mehr** (Folie 34). Vorher „Fragen?" mit
Textblock links, jetzt das byzz Control Center (`bcc.jpg`) mittig über „Vielen Dank." und
dem Satz „Wir freuen uns, wenn byzz 11 Ihren Praxisalltag leichter macht."

**Die Zusammenfassung hat sechs Kacheln, nicht vier** (Folie 33). Neu hinzugekommen sind
„Zukunftssicheres Fundament" (HTTP und 64 Bit) und „Mehr Praxisintegration" (Geräte und
Fremdprogramme direkt angebunden). Reihenfolge vom Auftraggeber vorgegeben: Fundament,
Praxisintegration, App, dann DVT-Viewer, DVT-Export, KI. Das Raster wechselte dafür von
`cards--2` auf `cards--3`; weil die Karten dadurch von 834 auf 546 px schmaler wurden,
mussten zwei Texte gekürzt werden — sonst hätten sie die Zwei-Zeilen-Grenze von `.card__d`
gerissen.

**Die Sprechnotizen sind Zusammenfassungen.** Sie sprachen bis Nachtrag 6 durchgehend den
Außendienst an („kurz durchgehen", „beim Vorführen …", „nichts zusagen"). Das Deck wird
weitergegeben und allein durchgesehen; wer es dann öffnet, ist nicht der Vortragende. Alle
34 Notizen sind deshalb neu geschrieben — was zeigt die Folie, was heißt das in der Praxis,
was gehört zur Einordnung dazu. Fachliche Einschränkungen sind erhalten, aber als Aussage
formuliert. Regel dazu in
[folien-bearbeiten.md](folien-bearbeiten.md#sprechnotizen-ändern).

---

## Offene Punkte

**Screenshots fehlen** für PDF-Viewer, Video-Player und Kamera-Aufnahme der byzz app.
Folie 32 zeigt dort Piktogramme. Die Karten sind auf einen Austausch vorbereitet —
Anleitung in [folien-bearbeiten.md](folien-bearbeiten.md#fehlende-app-screenshots-nachliefern).

**QR-Codes** zeigen auf:
```
https://apps.apple.com/app/id6743697899
https://play.google.com/store/apps/details?id=de.orangedental.byzz
```
Ändern sich die Adressen, in `dev/build/make-qr.mjs` anpassen und das Skript neu laufen lassen.

**Eine PowerPoint-Fassung** ist angedacht, aber nicht gebaut. Machbar wäre: die Folien über
`dev/build/shot.mjs` als Bild exportieren und einsetzen. Die Übergänge, die Tiefenwirkung und die
mehrstufigen Folien gingen dabei verloren — das sind genau die Gründe, aus denen das Deck
als HTML gebaut ist.

---

## Gestalterische Grundentscheidung

**Aurora / Milchglas**, hell und kontrastarm, Orange als einzige Akzentfarbe. Vom
Auftraggeber aus drei vorgelegten Richtungen gewählt.

Das **Signature-Element** ist das orangedental-Doppelsymbol als wiederkehrendes Lichtzeichen:
auf Abschnittstrennern groß und präsent, danach geschrumpft in die untere linke Ecke, wo das
Logo steht. Es wird zum Logo — das ist die Klammer zwischen den Abschnitten.

Die dunklen byzz-Screenshots stehen nicht mit harter Kante auf hellem Grund, sondern werfen
ihre eigenen Farben in den Raum dahinter (`.shot__spill`). Das löst das Kontrastproblem
gestalterisch statt technisch.

Der kühle Grauton in der Aurora (`--slate #363E4B`) ist der Grundton der
byzz-App-Oberfläche — er verbindet Deck und Produkt, statt nur Orange zu wiederholen.
