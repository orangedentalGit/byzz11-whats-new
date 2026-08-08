# Veröffentlichen über GitHub Pages

Das Deck braucht keinen Server — Doppelklick auf `index.html` genügt. Eine
Pages-Veröffentlichung ist nur die Bequemlichkeit, statt eines Ordners einen
Link weitergeben zu können. Fällt Pages aus, ist nichts verloren.

Repository: `orangedentalGit/byzz11-whats-new`
→ https://orangedentalgit.github.io/byzz11-whats-new/

## Der Ablauf

**Committen und pushen — mehr ist es nicht.**

```bash
git status                      # erst ansehen, was sich geändert hat
git add -A
git commit -m "Deck aktualisiert"
git push
```

Der Workflow in `.github/workflows/pages.yml` läuft bei jedem Push nach `main`,
packt mit `path: .` das **gesamte Repository** und stellt es online. Es gibt
keinen Zwischenschritt und kein zweites Repository.

> **Das ganze Projektverzeichnis geht mit online — und das ist so gewollt.**
> Unter der Adresse oben sind also auch `dev/docs/`, `dev/screenshots/`,
> `dev/prompts/`, `CLAUDE.md` und `README.md` öffentlich abrufbar, nicht nur das
> Deck. Wer künftig etwas in `dev/` ablegt, das nicht nach außen soll, muss es in
> die `.gitignore` aufnehmen — sonst steht es beim nächsten Push im Netz.

### Wie es dazu kam (08.08.2026)

Vorher lief es zweistufig: `publish.bat` füllte `publish/` nach Positivliste,
und `publish/` war ein **eigenes** Repository (`orangedentalGit/view`), das nur
das Deck enthielt. Seit das ganze Projektverzeichnis unter Versionskontrolle
steht, ist das entfallen — das damalige Release-Repository wurde in
`byzz11-whats-new` umbenannt und nimmt jetzt die Quelle selbst auf. Alte Links
auf `…github.io/view/` laufen ins Leere (HTTP 404); die Repo-Umbenennung leitet
zwar Git-Zugriffe weiter, die Pages-Adresse aber nicht.

### Was aus `publish.bat` geworden ist

Das Skript kopiert weiterhin nach Positivliste und braucht dafür weder Node noch
eine Einrichtung — es benutzt `robocopy`, das zu Windows gehört:

| kommt mit | bleibt zurück |
|---|---|
| `index.html`, `readme.txt` | `dev/`, `.claude/` |
| `assets/` | `CLAUDE.md`, `README.md` |
| `.github/` | `byzz-11-was-ist-neu.pdf`, `publish.bat`, `pdf.bat` |

Sein Zweck ist aber nur noch, **eine Deck-Fassung ohne `dev/` zum Weitergeben**
zu erzeugen — als Ordner, auf einem Stick, als Mailanhang. Zum Veröffentlichen
wird es nicht mehr gebraucht.

> **Aus `publish/` heraus nicht pushen.** Das Verzeichnis steht in der
> `.gitignore` und hat kein `.git`. Legte man dort eines an und pushte nach
> `byzz11-whats-new`, würde die Deck-Fassung die Quelle ersetzen und `dev/` im
> Repository löschen. Die frühere Anleitung dazu stand bis zum 08.08.2026 im
> Skript selbst und ist genau deshalb entfernt worden — der alte Name
> `orangedentalGit/view` zeigt nach der Umbenennung stillschweigend auf dasselbe
> Repository.

Das PDF geht bewusst nicht mit — aber es hängt seit Nachtrag 6 daran:

**Folie 2 verlinkt das PDF, und zwar auf einen fremden Server.** Der Chip unter der
Agenda zeigt auf
`https://data.orangedental.de/f/1b3950c2c83846a78f99/?dl=1`. Diese Datei wird
**nicht** vom Build erzeugt und **nicht** von `publish.bat` mitgenommen. Wer Folien
geändert hat, muss deshalb zusätzlich:

1. `node dev/build/pdf.mjs` (oder Doppelklick auf `pdf.bat`) laufen lassen,
2. das erzeugte `byzz-11-was-ist-neu.pdf` unter derselben Adresse hochladen.

Bleibt Schritt 2 aus, liefert der Link im veröffentlichten Deck eine veraltete
Fassung aus — ohne dass irgendein Prüflauf das meldet. Kontrolle von Hand:

```bash
curl -sI "https://data.orangedental.de/f/1b3950c2c83846a78f99/?dl=1" | grep -i content-length
```

Der Wert muss zur Größe der lokalen `byzz-11-was-ist-neu.pdf` passen.

## Einrichtung

Steht und muss nicht wiederholt werden: Das Repository ist verbunden, und
`Settings → Pages → Source` steht auf **„GitHub Actions"**.

Auf einer frischen Maschine genügt deshalb:

```bash
git clone https://github.com/orangedentalGit/byzz11-whats-new.git
cd byzz11-whats-new/dev/build
npm ci                          # nur nötig, wenn die Werkzeuge laufen sollen
```

Das Deck selbst braucht keinen dieser Schritte — `index.html` doppelklicken
genügt, `assets/` liegt vollständig im Repository.

Für ein neues Repository wäre die Reihenfolge nicht beliebig: Steht die Quelle
auf „GitHub Actions", ohne dass ein Workflow im Repo liegt, passiert schlicht
nichts.

> **Warum `.github/` schon im Projekt liegt.** Früher lag der Workflow unter
> `dev/deploy/pages.yml` und musste beim Kopieren nach `.github/workflows/`
> übersetzt werden. Das ging zweimal schief — erst landete die Datei in der
> Repo-Wurzel, dann in einem `workflows/` ohne `.github`. Beide Male **ohne
> Fehlermeldung**: GitHub erkennt Workflows ausschließlich unter
> `.github/workflows/`, ignoriert alles andere stillschweigend und führt weiter
> den eingebauten Workflow aus. Es sieht dann aus, als hätte man nichts getan.
>
> Ob es geklappt hat, zeigt `Actions`: Dort muss der Lauf
> **„Deck auf GitHub Pages veröffentlichen"** heißen, nicht
> „pages build and deployment". Bleibt die Liste ganz leer, liegt die Datei falsch.

### Warum nicht „Deploy from a branch"

Das ist die Voreinstellung und funktioniert grundsätzlich auch, hat hier aber
zwei Nachteile. GitHub schiebt den Inhalt durch Jekyll — für ein fertiges Deck
ein überflüssiger Schritt, der Dateien mit Unterstrich-Präfix stillschweigend
verschluckt. Und der eingebaute Workflow erzeugt die Node-20-Meldung (siehe
unten), ohne dass sich daran etwas ändern ließe.

Gegen ein hängendes Deployment hilft die Umstellung **nicht**: Der
Deploy-Timeout lässt sich nicht verlängern. `actions/deploy-pages` nimmt zwar
einen `timeout`-Parameter, aber 600000 ms sind zugleich Voreinstellung *und*
erlaubtes Maximum — höhere Werte quittiert die Action mit „timeout value is
greater than the allowed maximum" und rechnet mit 600000 weiter.

## Prüfen

```bash
# Seite und Assets — alles muss 200 liefern
BASIS=https://orangedentalgit.github.io/byzz11-whats-new
curl -s -o /dev/null -w "%{http_code}\n" "$BASIS/"
curl -s -o /dev/null -w "%{http_code}\n" "$BASIS/assets/css/deck.css"
curl -s -o /dev/null -w "%{http_code}\n" "$BASIS/assets/video/dvt-viewer.mp4"

# Lief der Workflow durch?
curl -s "https://api.github.com/repos/orangedentalGit/byzz11-whats-new/actions/runs?per_page=3"
```

> Die Website darf man beliebig oft abfragen. Die **API** dagegen erlaubt ohne
> Anmeldung nur 60 Anfragen pro Stunde — eine Warteschleife, die im Sekundentakt
> pollt, ist danach für eine Stunde blind. Für „ist es schon da?" deshalb die
> Seite selbst abfragen, nicht die API.

Danach einmal im Browser durchklicken: Übergänge, beide Videos, Referentenansicht.

> Die Abnahme bleibt der Doppelklick auf `index.html`. Pages ist die
> *zusätzliche* Prüfung, nicht die maßgebliche — unter `http://` funktioniert
> vieles, was unter `file://` scheitert, und `file://` ist die Randbedingung
> (`fallstricke.md` §1).

### Groß- und Kleinschreibung

Windows unterscheidet sie in Dateinamen nicht, GitHub Pages schon. Ein
`assets/img/App-Home.webp` im HTML, das auf dem Rechner tadellos lädt, ist auf
der Seite ein 404. Nach neuen Bildern lohnt der Abgleich:

Im Projektverzeichnis, ohne dass ein Repository nötig wäre:

```bash
find assets -type f | sort > /tmp/dateien.txt
grep -ohE 'assets/[A-Za-z0-9_./-]+\.(webp|jpg|png|svg|mp4|css|js)' \
  index.html assets/css/*.css assets/js/*.js | sort -u > /tmp/refs.txt
comm -23 /tmp/refs.txt /tmp/dateien.txt   # Ausgabe leer = in Ordnung
```

Ausgegeben wird, was das HTML referenziert, aber so nicht existiert — also
Tippfehler und falsche Groß-/Kleinschreibung. Zuletzt geprüft: alle 42
Referenzen stimmen.

## Zwei Meldungen, die keine Fehler sind

### „Node.js 20 is deprecated"

> Node.js 20 is deprecated. The following actions target Node.js 20 but are
> being forced to run on Node.js 24: actions/checkout@v4, …

Sie betrifft weder das lokal installierte Node noch das Deck, sondern die
Laufzeit, mit der GitHub die Action-Skripte auf seinen Servern ausführt. Der
Satz sagt es selbst: *forced to run on Node.js 24* — die Umstellung ist bereits
passiert. Gemeldet wird nur, dass die Action intern noch Node 20 deklariert.
Ein Deployment hat das nie verhindert.

Sie stammt aus GitHubs eingebautem Workflow und ist dort nicht abstellbar. Der
eigene Workflow in `.github/workflows/pages.yml` verwendet `checkout@v6`,
`upload-pages-artifact@v5` und `deploy-pages@v5` — alle auf Node 24, damit
bleibt es still.

### „DeprecationWarning: The `punycode` module is deprecated"

Aus dem Innenleben von `deploy-pages`. Nicht unser Code, nichts zu tun.

## Wenn das Deployment hängt

Kennzeichen im Log des `deploy`-Jobs: Der Build lief durch, das Deployment wurde
angenommen, und dann steht dort minutenlang dasselbe:

```
Created deployment for 6e56a7e…
Getting Pages deployment status...
Current status: deployment_queued
…
Error: Timeout reached, aborting!
```

Das ist ein Problem der Pages-Infrastruktur, kein Konfigurationsfehler — seit
Anfang Juli 2026 gehäuft gemeldet ([#200809][d1], [#200817][d2], [#200823][d3]).

Wichtig: **Es hilft, es einfach nochmal zu versuchen.** Am 06.08.2026 scheiterten
drei Deployments nacheinander auf genau diese Weise, der vierte Anlauf lief nach
gut sieben Minuten durch — ohne dass an der Konfiguration etwas geändert wurde.

In dieser Reihenfolge:

| # | Maßnahme |
|---|---|
| 1 | `Actions → Re-run jobs` bzw. `Run workflow` — neuer Anlauf ohne Commit (dafür ist `workflow_dispatch` da). Kostet nichts und war beim ersten Mal die Lösung |
| 2 | `Settings → Pages → Source` einmal umschalten und zurück — hat in den gemeldeten Fällen am häufigsten geholfen |
| 3 | ein paar Stunden warten — das Problem tritt schubweise auf |

Eine verbreitete Vermutung ist, ein abgebrochenes Deployment halte im
`github-pages`-Environment einen Lock und blockiere alle weiteren. Das war hier
**nicht** der Fall: Alle drei Fehlversuche standen sauber auf `failure`, keiner
blieb aktiv. Ein Blick in `Settings → Environments → github-pages →
Deployment history` schadet nicht, sollte aber nicht der erste Schritt sein.

Vorher lohnt der Blick auf https://www.githubstatus.com — liegt dort ein
Vorfall zu „Pages" vor, erübrigt sich alles Weitere.

[d1]: https://github.com/orgs/community/discussions/200809
[d2]: https://github.com/orgs/community/discussions/200817
[d3]: https://github.com/orgs/community/discussions/200823
