/**
 * Das Deck als PDF — eine Seite je Folienzustand, ohne Uebergaenge.
 *
 * Weg: erst fotografieren, dann drucken. Nicht index.html direkt drucken.
 * Chrome laesst im Druckpfad backdrop-filter weg, rechnet Blur anders und stellt
 * <video> ueberhaupt nicht dar — Aurora, Lichtschein und die beiden Videofolien
 * kaemen kaputt heraus. Ueber die Aufnahme ist jede Seite pixelgleich mit dem,
 * was auf dem Beamer steht. Preis: der Folientext ist Bild, nicht durchsuchbarer
 * Text. Bei einem Deck aus ganzseitigen Screenshots ist das der richtige Tausch.
 *
 * Fragmentfolien liefern je Aufbaustufe eine Seite — die Dramaturgie bleibt so
 * erhalten, wenn das PDF im Vortrag einspringen muss.
 *
 * Die beiden Videos werden vor der Aufnahme angehalten und auf einen festen
 * Zeitpunkt gesetzt — sonst entschiede der Zufall, welcher Moment der
 * Endlosschleife gerade laeuft. Welchen, steht in STILLS weiter unten.
 *
 * Aufruf:
 *   node pdf.mjs                  1920 x 1080, doppelt aufgeloest fotografiert
 *   node pdf.mjs --klein          einfach aufgeloest, deutlich kleinere Datei
 *   node pdf.mjs --out <pfad>     anderer Zielort
 */
import { mkdir, rm, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BUILD, ROOT } from './paths.mjs';
import { launch, openDeck, gotoSlide, fragmentCount, nextFragment, sleep } from './deck-session.mjs';

const args = process.argv.slice(2);
const klein = args.includes('--klein');
const outArg = args.indexOf('--out');
const OUT = outArg >= 0 && args[outArg + 1]
  ? args[outArg + 1]
  : join(ROOT, 'byzz-11-was-ist-neu.pdf');

/* Die Seite bleibt 1920 x 1080 CSS-Pixel. Der Faktor bestimmt nur, wie fein
   fotografiert wird: bei 2 sitzt in derselben Seite ein 3840 x 2160 grosses
   Bild, das beim Hineinzoomen und im Ausdruck scharf bleibt. */
const SCALE = klein ? 1 : 2;
const TMP = join(BUILD, 'tmp-pdf');

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

const { browser, page } = await launch({ deviceScaleFactor: SCALE });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errors.push('request failed: ' + r.url().split('/').pop()));

const total = await openDeck(page);
console.log(`Folien im Deck: ${total}   Aufnahme: ${1920 * SCALE} x ${1080 * SCALE}\n`);

/**
 * Welcher Moment eines Videos als Standbild ins PDF geht — Sekunden ab
 * Clipbeginn, Voreinstellung Frame 1. Die Zeiten sind abgetastet, nicht geraten:
 *
 *   dvt-viewer.mp4     0    Frame 1 zeigt bereits die Vier-Panel-Ansicht mit
 *                           koloriertem 3D-Schaedel — genau die Aussage der Folie.
 *   model-viewer.mp4   8    Frame 1 ist ein leeres Fenster mit "Lade ..."-Feld;
 *                           ein Rest des Ladezustands ist beim Zuschnitt in
 *                           prepare-video.mjs stehen geblieben. Ab 0,5 s steht der
 *                           Oberkiefer, bei 8 s liegen beide Kiefer in Okklusion —
 *                           das, was Bildunterschrift und Folientext behaupten.
 */
const STILLS = { 'model-viewer.mp4': 8 };

/**
 * Videos der aktiven Folie anhalten und auf ihren Zeitpunkt setzen.
 *
 * Der Sprung muss abgewartet werden: das Bild wechselt erst mit dem
 * seeked-Ereignis, ein sofortiger Screenshot zeigte noch den laufenden Frame.
 * Steht die Zeit bereits genau richtig, faellt kein Ereignis an — deshalb der
 * Vorabtest und die Zeitgrenze als Rueckfallebene.
 */
const freezeVideos = () => page.evaluate((stills) => {
  const slide = window.BYZZ.slideAt(window.BYZZ.current());
  const vids = Array.from(slide.querySelectorAll('video'));
  return Promise.all(vids.map((v) => new Promise((done) => {
    try { v.pause(); } catch (e) {}
    const at = stills[(v.getAttribute('src') || '').split('/').pop()] || 0;
    if (Math.abs(v.currentTime - at) < 0.01 && v.readyState >= 2) return done();
    const fin = () => { v.removeEventListener('seeked', fin); done(); };
    v.addEventListener('seeked', fin);
    setTimeout(fin, 2000);
    try { v.currentTime = at; } catch (e) { fin(); }
  })));
}, STILLS);

/* ------------------------------------------------------------- Fotografieren */

const pages = [];
for (let n = 1; n <= total; n++) {
  await gotoSlide(page, n);
  const steps = await fragmentCount(page);

  for (let s = 0; s < steps; s++) {
    if (s > 0) await nextFragment(page);
    await freezeVideos();
    await sleep(120);

    const file = `p${String(pages.length + 1).padStart(3, '0')}.jpg`;
    await page.screenshot({ path: join(TMP, file), type: 'jpeg', quality: 88 });
    pages.push(file);
  }

  const title = await page.evaluate(() => window.BYZZ.slideAt(window.BYZZ.current()).getAttribute('data-title'));
  console.log(`  ${String(n).padStart(2, '0')}  ${title}${steps > 1 ? `   (${steps} Stufen)` : ''}`);
}

/* ------------------------------------------------------------------- Drucken */

/* Eine Seite je Bild, randlos. break-after auf der letzten Seite zuruecknehmen,
   sonst haengt Chrome eine leere Seite an. */
const html = `<!doctype html>
<meta charset="utf-8">
<title>byzz 11 — Was ist neu</title>
<style>
  @page { size: 1920px 1080px; margin: 0 }
  html, body { margin: 0; padding: 0; background: #000 }
  .page { width: 1920px; height: 1080px; overflow: hidden; break-after: page; page-break-after: always }
  .page:last-child { break-after: auto; page-break-after: auto }
  img { display: block; width: 1920px; height: 1080px }
</style>
${pages.map((f) => `<div class="page"><img src="${f}"></div>`).join('\n')}
`;
await writeFile(join(TMP, 'print.html'), html, 'utf8');

const sheet = await browser.newPage();
await sheet.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await sheet.goto(pathToFileURL(join(TMP, 'print.html')).href, { waitUntil: 'networkidle0' });
await sheet.evaluate(() => Promise.all(
  Array.from(document.images).filter((i) => !i.complete)
    .map((i) => new Promise((r) => { i.onload = i.onerror = r; }))
));

await sheet.pdf({
  path: OUT,
  width: '1920px',
  height: '1080px',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  pageRanges: `1-${pages.length}`,
});

await browser.close();
await rm(TMP, { recursive: true, force: true });

const mb = ((await stat(OUT)).size / 1048576).toFixed(1);

if (errors.length) {
  console.log('\n!! Konsole:');
  [...new Set(errors)].forEach((e) => console.log('   ' + e));
}
console.log(`\n${pages.length} Seiten aus ${total} Folien · ${mb} MB`);
console.log(`PDF -> ${OUT}`);
