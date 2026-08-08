/**
 * Das fertige Deck fernsteuern.
 *
 * Chrome starten, index.html unter echtem file:// laden, den Bootvorgang
 * abwarten, Folien anfahren. Das brauchen shot.mjs und pdf.mjs gleichermassen —
 * und es sind genau die Stellen, an denen sich Wartezeiten und Zustandsabfragen
 * ueber Monate eingependelt haben. Sie stehen deshalb hier einmal und nicht
 * zweimal.
 *
 * Zwei Punkte, die nicht angetastet werden duerfen:
 *
 *   - Warten auf BYZZ.slideCount() > 0 UND #boot.is-done. Vorher ist die
 *     Folienliste leer und jedes go() landet daneben.
 *   - Nach go() gegen BYZZ.current() pruefen statt blind zu warten. Ein stilles
 *     Danebenlanden faellt sonst erst am falschen Bild auf.
 *
 * Zustand kommt immer aus BYZZ, nie aus dem DOM: waehrend eines Uebergangs
 * tragen kurzzeitig zwei Folien .is-active.
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { INDEX } from './paths.mjs';

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Chrome starten und die erste Seite zurueckgeben.
 *
 * deviceScaleFactor vergroebert oder verfeinert nur die Rasterung: die Seite
 * bleibt 1920 x 1080 CSS-Pixel, --scale bleibt 1, ein Screenshot faellt aber
 * entsprechend groesser aus. Der Browser-Schalter bleibt bewusst bei 1 — die
 * Emulation der Seite gewinnt, und beides gleichzeitig zu verstellen hat schon
 * einmal doppelt skalierte Aufnahmen erzeugt.
 */
export async function launch({ deviceScaleFactor = 1 } = {}) {
  if (!CHROME) { console.error('Kein Chrome gefunden.'); process.exit(1); }
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor },
    args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
  });
  const page = (await browser.pages())[0];
  return { browser, page };
}

/** index.html laden und warten, bis das Deck wirklich steht. Liefert die Folienzahl. */
export async function openDeck(page) {
  await page.goto(pathToFileURL(INDEX).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => window.BYZZ && window.BYZZ.slideCount() > 0 &&
          document.querySelector('#boot')?.classList.contains('is-done'),
    { timeout: 15000 }
  );
  await sleep(900);
  return page.evaluate(() => window.BYZZ.slideCount());
}

/** Folie n (1-basiert) anfahren und alle laufenden Tweens auf den Endzustand ziehen. */
export async function gotoSlide(page, n) {
  await page.evaluate((i) => window.BYZZ.go(i - 1), n);
  try {
    await page.waitForFunction((i) => window.BYZZ.current() === i - 1, { timeout: 6000 }, n);
  } catch (e) {
    const at = await page.evaluate(() => window.BYZZ.current());
    console.log(`  !! go(${n - 1}) landete auf ${at} — erneuter Versuch`);
    await page.evaluate((i) => window.BYZZ.go(i - 1), n);
    await page.waitForFunction((i) => window.BYZZ.current() === i - 1, { timeout: 6000 }, n);
  }
  await sleep(620);
  await page.evaluate(() => window.BYZZ.settle());
  await sleep(120);
}

/** Anzahl der Aufbaustufen der aktiven Folie (data-fragments, mindestens 1). */
export function fragmentCount(page) {
  return page.evaluate(() => {
    const sl = window.BYZZ.slideAt(window.BYZZ.current());
    return parseInt(sl.getAttribute('data-fragments') || '1', 10) || 1;
  });
}

/** Einen Aufbauschritt weiter und wieder festsetzen. */
export async function nextFragment(page) {
  await page.evaluate(() => window.BYZZ.next());
  await sleep(600);
  await page.evaluate(() => window.BYZZ.settle());
}
