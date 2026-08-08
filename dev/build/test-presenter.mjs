/**
 * Prueft die Referentenansicht unter echtem file://.
 *
 * Getestet wird die Kette, die im Meeting halten muss:
 *   P oeffnet das Fenster · Notizen und Titel stimmen · die Laufzeit laeuft ·
 *   die Vorschau zeigt die naechste Folie · Blaettern aus dem Popup wirkt aufs
 *   Hauptfenster · die Notizen bleiben im Popup und erscheinen nie im Hauptfenster.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { INDEX } from './paths.mjs';

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width: 1600, height: 900 },
});
const page = (await browser.pages())[0];
await page.goto(pathToFileURL(INDEX).href, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.BYZZ && window.BYZZ.slideCount() > 0);
await new Promise((r) => setTimeout(r, 1200));

const ok = [];
const bad = [];
const t = (name, cond, detail) => (cond ? ok : bad).push(name + (detail ? '  ' + detail : ''));

// Auf eine Folie mit Notizen und nachfolgendem Screenshot gehen
await page.evaluate(() => window.BYZZ.go(2));
await new Promise((r) => setTimeout(r, 900));

// P druecken — window.open braucht eine echte Benutzergeste
await page.bringToFront();
await page.keyboard.press('p');
await new Promise((r) => setTimeout(r, 1200));

const targets = browser.targets().filter((x) => x.type() === 'page');
const popupTarget = targets.find((x) => x.url() === 'about:blank');
t('Popup geoeffnet', !!popupTarget, popupTarget ? '' : `(offene Seiten: ${targets.map((x) => x.url()).join(', ')})`);

if (popupTarget) {
  const pp = await popupTarget.page();
  const info = await pp.evaluate(() => ({
    compat: document.compatMode,
    title: document.title,
    pos: document.querySelector('.pos')?.textContent,
    slideTitle: document.querySelector('.ttl')?.textContent,
    notesLen: (document.querySelector('.notes')?.textContent || '').trim().length,
    clock: document.querySelector('.clk')?.textContent.slice(0, 5),
    nextTitle: document.querySelector('.next .nt')?.textContent,
    nextImg: document.querySelector('.next img')?.getAttribute('src') || null,
    nextImgLoaded: document.querySelector('.next img')?.naturalWidth || 0,
  }));

  t('Standards Mode (kein Quirks)', info.compat === 'CSS1Compat', info.compat);
  t('Fenstertitel gesetzt', /byzz/i.test(info.title), info.title);
  t('Folienposition', /^0?3 \/ /.test(info.pos || ''), info.pos);
  t('Folientitel uebernommen', (info.slideTitle || '').length > 3, info.slideTitle);
  t('Notizen vorhanden', info.notesLen > 40, info.notesLen + ' Zeichen');
  t('Vorschau naechste Folie', (info.nextTitle || '').length > 3, info.nextTitle);

  // Laufzeit muss weiterlaufen
  const c1 = await pp.evaluate(() => document.querySelector('.clk').textContent.slice(0, 5));
  await new Promise((r) => setTimeout(r, 2200));
  const c2 = await pp.evaluate(() => document.querySelector('.clk').textContent.slice(0, 5));
  t('Laufzeit laeuft', c1 !== c2, `${c1} -> ${c2}`);

  // Blaettern aus dem Popup heraus
  const before = await page.evaluate(() => window.BYZZ.current());
  await pp.bringToFront();
  await pp.keyboard.press('ArrowRight');
  await new Promise((r) => setTimeout(r, 900));
  const after = await page.evaluate(() => window.BYZZ.current());
  t('Blaettern aus dem Popup', after === before + 1, `${before} -> ${after}`);

  // Die Referentenansicht muss dem Folienwechsel folgen
  const synced = await pp.evaluate(() => document.querySelector('.pos').textContent);
  t('Referentenansicht folgt', synced.startsWith(String(after + 1).padStart(2, '0')), synced);

  // Bild in der Vorschau darf nicht ins Leere zeigen
  const img = await pp.evaluate(() => {
    const el = document.querySelector('.next img');
    return { src: el?.getAttribute('src') || null, w: el?.naturalWidth || 0, shown: el?.style.display };
  });
  if (img.src) t('Vorschaubild geladen', img.w > 0, `${img.w}px · ${img.src.split('/').pop()}`);

  // Die Notizen sind dauerhaft sichtbar — es gibt nichts zum Umschalten
  const visible = await pp.evaluate(() => {
    const el = document.querySelector('.notes');
    return !!el && getComputedStyle(el).display !== 'none';
  });
  t('Notizen dauerhaft sichtbar', visible);
}

// Im Hauptfenster darf es kein Notizfeld geben — dort haengt der Beamer
const noOverlay = await page.evaluate(() => !document.getElementById('notes-overlay'));
t('Keine Notizen im Hauptfenster', noOverlay);

// Notausgang B
await page.bringToFront();
await page.keyboard.press('b');
await new Promise((r) => setTimeout(r, 300));
const noBlur = await page.evaluate(() => document.body.classList.contains('no-blur'));
t('Weichzeichnung abschaltbar (B)', noBlur);

console.log('\nBestanden:');
ok.forEach((l) => console.log('  + ' + l));
if (bad.length) {
  console.log('\nFehlgeschlagen:');
  bad.forEach((l) => console.log('  - ' + l));
}
console.log(`\n${ok.length} ok, ${bad.length} fehlgeschlagen`);

await browser.close();
process.exit(bad.length ? 1 : 0);
