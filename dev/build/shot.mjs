/**
 * Visueller Pruefstand.
 *
 * Laedt index.html unter echtem file:// in 1920x1080 und fotografiert Folien.
 * Zusaetzlich wird jede Folie auf harte Layoutfehler geprueft, die man auf einem
 * Screenshot leicht uebersieht:
 *
 *   - Ueberlauf ueber den Buehnenrand
 *   - Verletzung der Logo-Schutzzone unten links
 *   - Screenshots, die ueber 1,15x ihrer nativen Breite gezogen werden
 *   - Konsolenfehler (jede CORS-Meldung ist ein file://-Verstoss)
 *
 * Aufruf:
 *   node shot.mjs                 alle Folien
 *   node shot.mjs 1 3 12          nur diese (1-basiert)
 *   node shot.mjs --frag 12       Folie 12 mit allen Fragmentschritten
 */
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { SHOTS } from './paths.mjs';
import { launch, openDeck, gotoSlide, fragmentCount, nextFragment } from './deck-session.mjs';

const args = process.argv.slice(2);
const fragMode = args.includes('--frag');
const only = args.filter((a) => /^\d+$/.test(a)).map(Number);

const OUT = SHOTS;
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const { browser, page } = await launch();

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => errors.push('request failed: ' + r.url().split('/').pop()));

const total = await openDeck(page);

if (args.includes('--trace')) {
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('TRACE')) console.log('   ' + t); });
  await page.evaluate(() => {
    ['go', 'prev', 'next'].forEach((k) => {
      const orig = window.BYZZ[k];
      window.BYZZ[k] = function () {
        console.log('TRACE ' + k + '(' + [].join.call(arguments, ',') + ') i=' + window.BYZZ.state.i +
          ' t=' + window.BYZZ.state.target + ' f=' + window.BYZZ.state.frag +
          ' <- ' + String(new Error().stack).replace(/\s+/g, ' ').slice(0, 160));
        return orig.apply(this, arguments);
      };
    });
    ['click','contextmenu','keydown'].forEach((ev) =>
      document.addEventListener(ev, (e) => console.log('TRACE EVENT ' + ev + ' ' + (e.key || e.clientX || '')), true));
  });
}

const list = only.length ? only : Array.from({ length: total }, (_, i) => i + 1);
console.log(`Folien im Deck: ${total}\n`);

/** Layoutpruefung auf der aktiven Folie. */
const AUDIT = () => {
  const out = [];
  const slide = window.BYZZ.slideAt(window.BYZZ.current());
  if (!slide) return [{ kind: 'fatal', msg: 'keine aktive Folie' }];

  const STAGE = { w: 1920, h: 1080 };
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
  /* Bezug ist der Inhaltsrahmen, nicht die Buehne: die Buehne waechst bei
     abweichendem Fensterformat ueber 1920x1080 hinaus, der Rahmen nie. */
  const frameBox = document.getElementById('frame').getBoundingClientRect();
  const toStage = (r) => ({
    x: (r.left - frameBox.left) / scale,
    y: (r.top - frameBox.top) / scale,
    w: r.width / scale,
    h: r.height / scale,
  });

  // Logo-Schutzzone: x 112–360, y 950–1030
  const GUARD = { x1: 100, y1: 948, x2: 372, y2: 1034 };

  slide.querySelectorAll('.slide-inner *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (el.closest('template')) return;
    const r = toStage(el.getBoundingClientRect());
    if (r.w < 2 || r.h < 2) return;

    const tag = el.className && typeof el.className === 'string'
      ? el.tagName.toLowerCase() + '.' + el.className.split(/\s+/).slice(0, 2).join('.')
      : el.tagName.toLowerCase();

    if (r.x < -4 || r.y < -4 || r.x + r.w > STAGE.w + 4 || r.y + r.h > STAGE.h + 4) {
      out.push({ kind: 'overflow', msg: `${tag} ragt aus der Bühne: ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.w)}x${Math.round(r.h)}` });
    }

    // Nur echte Inhaltsknoten gegen die Logo-Zone pruefen, keine Container.
    const leaf = !el.children.length || el.matches('.shot, .card, .path, .chip, .step, .lang');
    if (leaf) {
      const hit = r.x < GUARD.x2 && r.x + r.w > GUARD.x1 && r.y < GUARD.y2 && r.y + r.h > GUARD.y1;
      if (hit) out.push({ kind: 'logo', msg: `${tag} liegt in der Logo-Schutzzone (y ${Math.round(r.y)}–${Math.round(r.y + r.h)})` });
    }
  });

  // Screenshot-Skalierung
  slide.querySelectorAll('.shot__frame img').forEach((im) => {
    const r = toStage(im.getBoundingClientRect());
    const nat = im.naturalWidth;
    if (!nat) { out.push({ kind: 'img', msg: `${im.getAttribute('src')} nicht geladen` }); return; }
    const f = r.w / nat;
    if (f > 1.16) out.push({ kind: 'scale', msg: `${im.getAttribute('src').split('/').pop()} auf ${f.toFixed(2)}x hochskaliert (${Math.round(r.w)} px von ${nat} px)` });
  });

  return out;
};

let problems = 0;
for (const n of list) {
  /* Nicht blind warten: gotoSlide() prueft gegen BYZZ.current(). Ein stilles
     Danebenlanden waere sonst nur an einem falschen Screenshot zu erkennen —
     und genau den soll dieser Prueflauf ja beurteilen. */
  await gotoSlide(page, n);

  const steps = fragMode ? await fragmentCount(page) : 1;

  for (let s = 0; s < steps; s++) {
    if (s > 0) await nextFragment(page);
    const name = steps > 1 ? `${String(n).padStart(2, '0')}-${s + 1}` : String(n).padStart(2, '0');
    /* JPEG statt PNG: die Bilder dienen nur der Sichtkontrolle — die harten
       Befunde unten kommen aus dem DOM, nicht aus Pixeln. PNG kostete 62 MB
       je Lauf, q88 kostet ein Fuenftel davon bei gleicher Beurteilbarkeit. */
    await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 88 });
  }

  const found = await page.evaluate(AUDIT);
  const where = await page.evaluate(() => ({ i: window.BYZZ.current(), t: window.BYZZ.state.target, f: window.BYZZ.state.frag }));
  const title = `[i=${where.i} t=${where.t} f=${where.f}] ` + await page.evaluate(() => window.BYZZ.slideAt(window.BYZZ.current()).getAttribute('data-title'));
  if (found.length) {
    problems += found.length;
    console.log(`  ${String(n).padStart(2, '0')}  ${title}`);
    found.forEach((f) => console.log(`      [${f.kind}] ${f.msg}`));
  } else {
    console.log(`  ${String(n).padStart(2, '0')}  ${title}   ok`);
  }
}

if (errors.length) {
  console.log('\n!! Konsole:');
  [...new Set(errors)].forEach((e) => console.log('   ' + e));
}
console.log(`\n${problems ? '!! ' + problems + ' Layoutbefund(e)' : 'Layout: keine Befunde'}`);
console.log(`Screenshots -> ${OUT}`);

await browser.close();
