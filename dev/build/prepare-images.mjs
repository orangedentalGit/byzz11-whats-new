/**
 * Bereitet die Screenshots aus dev/screenshots/ fuer das Deck auf.
 *
 * Zwei Regeln bestimmen alles:
 *
 * 1. KEIN Upscaling ueber 1,15x der nativen Breite. Die byzz-Oberflaeche traegt lesbaren
 *    Text; wird ein 1249-px-Screenshot auf 1600 px gezogen, matscht er auf dem Beamer.
 *    Die Zielbreiten unten sind daraus abgeleitet, nicht frei gewaehlt.
 *
 * 2. WebP q92 statt JPEG oder PNG. Die Vorlagen mischen feinen UI-Text (JPEG-Artefakte an
 *    Buchstabenkanten waeren auf dem Beamer sichtbar) mit verrauschten Roentgenflaechen
 *    (die PNG auf 7,4 MB aufblaehen). WebP bedient beides; Chrome und Edge sind das
 *    einzige Ziel und unterstuetzen es unter file:// problemlos.
 *
 * Zusaetzlich entsteht pro Bild eine winzige, stark heruntergerechnete .blur.jpg.
 * Sie wird im Deck auf Panelgroesse gestreckt und liefert damit einen weichen Gaussian
 * ohne jede Filterkosten — animiert wird nur noch opacity. Grund: ein getweenter
 * filter:blur() schafft auf dieser Hardware nur ~40 fps (in build/probe.html gemessen).
 */
import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { SCREENSHOTS, ASSETS } from './paths.mjs';

const SRC = SCREENSHOTS;
const OUT = join(ASSETS, 'img');

/** Zielbreite = Panelbreite auf der 1920er Buehne, gedeckelt auf 1,15x nativ. */
const PLAN = [
  // Datei                    Zielbreite   nativ
  ['Xray1.jpg',               1360],    // 1249 x 733
  ['Xray2.jpg',               1360],
  ['Xray3.jpg',               1360],
  ['Erstellungsdatum.jpg',    1360],
  ['ExterneProgramme.jpg',    1360],
  ['opg.jpg',                 1520],    // 1380 x 651
  ['DVT-Export1.jpg',         1150],    // 1005 x 627
  ['DVT-Export2.jpg',          610],    //  534 x 428
  ['DVT-Export3.jpg',          950],    //  827 x 178
  ['app_home.jpg',            1600],    // 1591 x 894
  ['app_login.jpg',           1600],    // 1608 x 896
  ['app_patienten.jpg',       1600],    // 1608 x 830
  ['app_dvts.jpg',            1600],    // 1609 x 897
  ['app_3d.jpg',              1600],    // 1606 x 899
  ['app_options.jpg',         1424],    // 1424 x 900  — nativ, Anzeige 988 px
  ['merge_migrator.jpg',       716],    //  756 x 643
  ['bcc.jpg',                 1251],    // 1251 x 733  — nativ, Anzeige 832 px
];

const MAX_UPSCALE = 1.15;
const slug = (f) => f.replace(/\.jpe?g$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

await mkdir(OUT, { recursive: true });

let inBytes = 0, outBytes = 0;
const rows = [];

for (const [file, wanted] of PLAN) {
  const src = join(SRC, file);
  const meta = await sharp(src).metadata();
  const cap = Math.round(meta.width * MAX_UPSCALE);
  const width = Math.min(wanted, cap);
  const capped = width < wanted;

  const name = slug(file);
  inBytes += (await stat(src)).size;

  // Scharfe Fassung — WebP q92, haelt UI-Text kantenrein ohne PNG-Gewicht.
  const sharpBuf = await sharp(src)
    .resize({ width, kernel: 'lanczos3', withoutEnlargement: false })
    .webp({ quality: 92, effort: 6, smartSubsample: false })
    .toBuffer();
  await sharp(sharpBuf).toFile(join(OUT, `${name}.webp`));

  // Weiche Fassung — 48 px breit. Im Deck auf Panelbreite gestreckt ergibt das einen
  // sehr weichen Verlauf, wiegt ~1 KB und kostet den Compositor nichts.
  const softBuf = await sharp(src)
    .resize({ width: 44 })
    .blur(2.2)
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toBuffer();
  await sharp(softBuf).toFile(join(OUT, `${name}.soft.jpg`));

  outBytes += sharpBuf.length + softBuf.length;
  const h = Math.round((meta.height / meta.width) * width);
  rows.push(
    `  ${name.padEnd(20)} ${String(meta.width).padStart(4)}x${String(meta.height).padEnd(4)} -> ` +
    `${String(width).padStart(4)}x${String(h).padEnd(4)} ` +
    `${(sharpBuf.length / 1024).toFixed(0).padStart(4)} KB${capped ? '  [auf 1,15x gedeckelt]' : ''}`
  );
}

console.log(rows.join('\n'));
console.log(`\n  Quelle : ${(inBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Ziel   : ${(outBytes / 1024 / 1024).toFixed(2)} MB  (${PLAN.length} x .webp + ${PLAN.length} x .soft.jpg)`);
console.log(`  -> ${OUT}`);
console.log('\n  Nicht uebernommen: Konfigurator.jpg (vom Nutzer ausgeschlossen)');
console.log('  Vorhandene Dateien in dev/screenshots/:', (await readdir(SRC)).filter((f) => /\.jpe?g$/i.test(f)).length);
