/**
 * Prueft die Rahmenfunktionen, die nicht am Folieninhalt haengen:
 * Buehnenskalierung auf fremden Bildschirmgroessen, Folienuebersicht,
 * Sprung per Zahleneingabe, schnelles Durchklicken und Vollbild.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { INDEX } from './paths.mjs';

const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(existsSync);
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  defaultViewport: { width: 1920, height: 1080 },
});
const page = (await browser.pages())[0];
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(pathToFileURL(INDEX).href, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.BYZZ && window.BYZZ.slideCount() > 0);
await new Promise((r) => setTimeout(r, 1200));

const ok = [], bad = [];
const t = (n, c, d) => (c ? ok : bad).push(n + (d ? '  ' + d : ''));

/* --- Skalierung: Inhaltsrahmen muss vollstaendig passen, die Buehne muss das
       Fenster restlos decken. Deckt sie es nicht, stehen Balken — genau das
       war der Befund, der zur Trennung #stage / #frame gefuehrt hat. --- */
for (const [w, h] of [[1920, 1080], [1280, 800], [2560, 1440], [1366, 768], [1600, 1200], [1100, 1400]]) {
  await page.setViewport({ width: w, height: h });
  await new Promise((r) => setTimeout(r, 400));
  const m = await page.evaluate(() => {
    const st = document.getElementById('stage').getBoundingClientRect();
    const fr = document.getElementById('frame').getBoundingClientRect();
    const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale'));
    return { w: st.width, h: st.height, fw: fr.width, fh: fr.height, s, vw: innerWidth, vh: innerHeight,
             bodyScrollW: document.body.scrollWidth, bodyScrollH: document.body.scrollHeight };
  });
  const fits = m.fw <= m.vw + 1 && m.fh <= m.vh + 1;
  const covers = m.w >= m.vw - 1 && m.h >= m.vh - 1;
  const exact = Math.abs(m.s - Math.min(w / 1920, h / 1080)) < 0.001;
  const noScroll = m.bodyScrollW <= m.vw + 1 && m.bodyScrollH <= m.vh + 1;
  t(`Skalierung ${w}x${h}`, fits && covers && exact && noScroll,
    `scale=${m.s.toFixed(3)} Rahmen ${Math.round(m.fw)}x${Math.round(m.fh)} Buehne ${Math.round(m.w)}x${Math.round(m.h)}`
    + `${covers ? '' : ' BALKEN'}${noScroll ? '' : ' SCROLLT'}`);
}
await page.setViewport({ width: 1920, height: 1080 });
await new Promise((r) => setTimeout(r, 400));

/* --- Uebersicht --- */
await page.keyboard.press('o');
await new Promise((r) => setTimeout(r, 500));
const ov = await page.evaluate(() => {
  const el = document.getElementById('overview');
  return { on: el.classList.contains('is-on'), items: el.querySelectorAll('.ov-i').length,
           cur: el.querySelectorAll('.ov-i.is-cur').length,
           empty: [...el.querySelectorAll('.ov-i')].filter((b) => b.textContent.trim().length < 4).length };
});
const total = await page.evaluate(() => window.BYZZ.slideCount());
t('Uebersicht oeffnet', ov.on);
t('Uebersicht vollstaendig', ov.items === total, `${ov.items} von ${total}`);
t('Aktuelle Folie markiert', ov.cur === 1);
t('Alle Eintraege beschriftet', ov.empty === 0, ov.empty ? `${ov.empty} leer` : '');

/* Klick in der Uebersicht springt */
if (total > 3) {
  await page.evaluate(() => document.querySelectorAll('#overview .ov-i')[3].click());
  await new Promise((r) => setTimeout(r, 900));
  const at = await page.evaluate(() => ({ i: window.BYZZ.current(), ovOn: document.getElementById('overview').classList.contains('is-on') }));
  t('Klick springt und schliesst', at.i === 3 && !at.ovOn, `i=${at.i}`);
}

/* --- Sprung per Zahleneingabe --- */
await page.keyboard.press('Escape');
await page.keyboard.press('Digit2');
await page.keyboard.press('Enter');
await new Promise((r) => setTimeout(r, 900));
t('Sprung per Zahl', await page.evaluate(() => window.BYZZ.current() === 1));

/* --- Schnelles Durchklicken: darf nicht haengenbleiben --- */
await page.evaluate(() => window.BYZZ.go(0));
await new Promise((r) => setTimeout(r, 800));
for (let i = 0; i < 24; i++) { await page.keyboard.press('ArrowRight'); await new Promise((r) => setTimeout(r, 45)); }
await new Promise((r) => setTimeout(r, 1600));
const after = await page.evaluate(() => {
  const cur = window.BYZZ.slideAt(window.BYZZ.current());
  const inner = cur.querySelector('.slide-inner');
  const cs = getComputedStyle(inner);
  return {
    i: window.BYZZ.current(),
    opacity: parseFloat(cs.opacity),
    filter: cs.filter,
    visible: [...document.querySelectorAll('#stage .slide')].filter((s) => getComputedStyle(s).display !== 'none').length,
  };
});
t('Schnelles Durchklicken kommt an', after.i > 0, `Folie ${after.i + 1}`);
t('Kein haengender Zwischenzustand', after.opacity > 0.98 && (after.filter === 'none' || after.filter === ''),
  `opacity=${after.opacity} filter=${after.filter}`);
t('Genau eine Folie sichtbar', after.visible === 1, `${after.visible} sichtbar`);

/* --- Rueckwaerts durch das ganze Deck --- */
await page.evaluate(() => window.BYZZ.go(window.BYZZ.slideCount() - 1));
await new Promise((r) => setTimeout(r, 900));
for (let i = 0; i < total + 6; i++) { await page.keyboard.press('ArrowLeft'); await new Promise((r) => setTimeout(r, 60)); }
await new Promise((r) => setTimeout(r, 1500));
t('Rueckwaerts bis Anfang', await page.evaluate(() => window.BYZZ.current() === 0));

/* --- Vollbild --- */
await page.keyboard.press('f');
await new Promise((r) => setTimeout(r, 600));
t('Vollbild-Anforderung ohne Fehler', !errors.some((e) => /fullscreen/i.test(e)));

console.log('\nBestanden:');
ok.forEach((l) => console.log('  + ' + l));
if (bad.length) { console.log('\nFehlgeschlagen:'); bad.forEach((l) => console.log('  - ' + l)); }
if (errors.length) { console.log('\nKonsole:'); [...new Set(errors)].forEach((e) => console.log('  ! ' + e)); }
console.log(`\n${ok.length} ok, ${bad.length} fehlgeschlagen, ${new Set(errors).size} Konsolenmeldungen`);

await browser.close();
process.exit(bad.length ? 1 : 0);
