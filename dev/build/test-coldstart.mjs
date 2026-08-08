/**
 * Kaltstart: Kopiert den Auslieferungsordner an einen fremden Pfad und startet ihn
 * dort per file://. Faengt genau den Fehler, den man sonst erst im Meeting merkt —
 * einen hartkodierten Pfad oder eine vergessene Datei.
 *
 * Prueft dabei zusaetzlich, ob die beiden Videos wirklich abspielen.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { cp, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { ROOT } from './paths.mjs';

const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync);
const SRC = ROOT;

const dir = await mkdtemp(join(tmpdir(), 'byzz-cold-'));
for (const item of ['index.html', 'assets', 'README.md']) {
  await cp(join(SRC, item), join(dir, item), { recursive: true });
}
console.log('Kopiert nach:', dir);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  defaultViewport: { width: 1920, height: 1080 },
});
const page = (await browser.pages())[0];
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('requestfailed', (r) => errors.push('nicht geladen: ' + r.url().replace(pathToFileURL(dir).href, '')));

await page.goto(pathToFileURL(join(dir, 'index.html')).href, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.BYZZ && window.BYZZ.slideCount() > 0, { timeout: 20000 });
await new Promise((r) => setTimeout(r, 1500));

const ok = [], bad = [];
const t = (n, c, d) => (c ? ok : bad).push(n + (d ? '  ' + d : ''));

t('Deck startet aus fremdem Pfad', true, `${await page.evaluate(() => window.BYZZ.slideCount())} Folien`);

/* Alle Bilder und Schriften geladen? */
const media = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('#stage img')];
  return {
    total: imgs.length,
    broken: imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')),
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  };
});
t('Alle Bilder geladen', media.broken.length === 0, `${media.total} Bilder${media.broken.length ? ' — fehlt: ' + media.broken.join(', ') : ''}`);
t('Schriften eingebettet geladen', new Set(media.fonts).size >= 3, [...new Set(media.fonts)].join(', '));

/* Videos: auf die Folien gehen und pruefen, ob die Wiedergabe laeuft.
   Die Foliennummern werden gesucht, nicht festgeschrieben — sonst schlaegt
   der Test jedes Mal fehl, wenn sich die Reihenfolge aendert. */
const VIDEOS = await page.evaluate(() => {
  const out = [];
  for (let i = 0; i < window.BYZZ.slideCount(); i++) {
    const v = window.BYZZ.slideAt(i).querySelector('video');
    if (v) out.push([i + 1, (v.getAttribute('src') || '').split('/').pop().replace(/\.\w+$/, '')]);
  }
  return out;
});
t('Videofolien gefunden', VIDEOS.length === 2, VIDEOS.map(([n, s]) => `${n}: ${s}`).join(' · '));

for (const [nr, name] of VIDEOS) {
  await page.evaluate((n) => window.BYZZ.go(n - 1), nr);
  await new Promise((r) => setTimeout(r, 2000));
  const v = await page.evaluate(() => {
    const el = document.querySelector('.slide.is-active video');
    if (!el) return null;
    return { src: el.getAttribute('src'), paused: el.paused, t: el.currentTime,
             muted: el.muted, loop: el.loop, w: el.videoWidth, dur: el.duration };
  });
  t(`Video Folie ${nr} spielt`, !!v && !v.paused && v.t > 0.2, v ? `t=${v.t.toFixed(1)}s ${v.w}px ${v.dur?.toFixed(1)}s` : 'kein <video>');
  t(`Video Folie ${nr} stumm und in Schleife`, !!v && v.muted && v.loop);
  t(`Video Folie ${nr} ist ${name}`, !!v && v.src.includes(name), v?.src);
}

/* Video muss beim Verlassen der Folie anhalten. */
await page.evaluate(() => window.BYZZ.go(0));
await new Promise((r) => setTimeout(r, 1200));
const stopped = await page.evaluate(() =>
  [...document.querySelectorAll('video')].every((v) => v.paused));
t('Videos pausieren beim Folienwechsel', stopped);

console.log('\nBestanden:');
ok.forEach((l) => console.log('  + ' + l));
if (bad.length) { console.log('\nFehlgeschlagen:'); bad.forEach((l) => console.log('  - ' + l)); }
if (errors.length) { console.log('\nKonsole:'); [...new Set(errors)].forEach((e) => console.log('  ! ' + e)); }
console.log(`\n${ok.length} ok, ${bad.length} fehlgeschlagen, ${new Set(errors).size} Konsolenmeldungen`);

await browser.close();
await rm(dir, { recursive: true, force: true });
process.exit(bad.length || errors.length ? 1 : 0);
