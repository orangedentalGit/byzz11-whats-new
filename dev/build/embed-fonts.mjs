/**
 * Laedt die drei Deck-Schriften von Google Fonts, schneidet auf latin + latin-ext zu
 * und schreibt sie als Base64-WOFF2 nach assets/css/fonts.css.
 *
 * Warum Base64: @font-face mit Datei-URL ist unter file:// CORS-blockiert.
 * In build/probe.html verifiziert -> "A network error occurred".
 *
 * Braucht einmalig Internet. Danach laeuft das Deck vollstaendig offline.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ASSETS } from './paths.mjs';

const CSS_DIR = join(ASSETS, 'css');
const OUT = join(CSS_DIR, 'fonts.css');

// Chrome-UA erzwingt woff2 statt ttf.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const FAMILIES = [
  { css: 'Familjen+Grotesk:wght@500;600', label: 'Familjen Grotesk' },
  { css: 'Inter:wght@400;500;600',        label: 'Inter' },
  { css: 'IBM+Plex+Mono:wght@500',        label: 'IBM Plex Mono' },
];

// Nur diese Subsets einbetten. "latin" traegt Deutsch, "latin-ext" die restlichen
// Akzente der acht Sprachen auf Folie 23 (Portugiesisch, Daenisch, Franzoesisch ...).
const KEEP_SUBSETS = ['latin', 'latin-ext'];

async function getCss(familyCss) {
  const url = `https://fonts.googleapis.com/css2?family=${familyCss}&display=block`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Google Fonts ${res.status} fuer ${familyCss}`);
  return res.text();
}

/** Zerlegt Google-CSS in Bloecke: /* subset *\/ @font-face { ... } */
function parseBlocks(css) {
  const out = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/gi;
  let m;
  while ((m = re.exec(css))) out.push({ subset: m[1], block: m[2] });
  return out;
}

const pick = (block, prop) => (block.match(new RegExp(prop + ':\\s*([^;]+);')) || [, ''])[1].trim();

let css = `/* byzz 11 — Deck-Schriften.
 * Automatisch erzeugt von dev/build/embed-fonts.mjs — nicht von Hand bearbeiten.
 * WOFF2 ist als data:-URL eingebettet, weil @font-face mit Datei-URL unter file://
 * CORS-blockiert wird (in build/probe.html nachgewiesen).
 */\n\n`;

let total = 0;
const report = [];

for (const fam of FAMILIES) {
  const blocks = parseBlocks(await getCss(fam.css)).filter((b) => KEEP_SUBSETS.includes(b.subset));
  if (!blocks.length) throw new Error(`Keine passenden Subsets fuer ${fam.label}`);

  /* Bei variablen Familien liefert Google fuer JEDES angeforderte Gewicht dieselbe
   * Datei-URL. Einmal einbetten und als Gewichtsbereich deklarieren — sonst haette
   * Inter allein 3 x 130 KB belegt. */
  const byUrl = new Map();
  for (const { subset, block } of blocks) {
    const srcUrl = (block.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
    if (!srcUrl) continue;
    const weight = pick(block, 'font-weight') || '400';
    const entry = byUrl.get(srcUrl) || {
      subset,
      style: pick(block, 'font-style') || 'normal',
      range: pick(block, 'unicode-range'),
      weights: [],
    };
    entry.weights.push(...weight.split(/\s+/).map(Number));
    byUrl.set(srcUrl, entry);
  }

  for (const [srcUrl, e] of byUrl) {
    const buf = Buffer.from(await (await fetch(srcUrl, { headers: { 'User-Agent': UA } })).arrayBuffer());
    total += buf.length;

    const lo = Math.min(...e.weights);
    const hi = Math.max(...e.weights);
    const weightDecl = lo === hi ? String(lo) : `${lo} ${hi}`;

    css +=
      `/* ${fam.label} · ${weightDecl} · ${e.subset} · ${(buf.length / 1024).toFixed(1)} KB */\n` +
      `@font-face{font-family:'${fam.label}';font-style:${e.style};font-weight:${weightDecl};font-display:block;\n` +
      `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');\n` +
      (e.range ? `unicode-range:${e.range};` : '') +
      `}\n\n`;

    report.push(`  ${fam.label.padEnd(18)} ${weightDecl.padEnd(9)} ${e.subset.padEnd(11)} ${(buf.length / 1024).toFixed(1)} KB`);
  }
}

await mkdir(CSS_DIR, { recursive: true });
await writeFile(OUT, css, 'utf8');

console.log(report.join('\n'));
console.log(`\n  WOFF2 gesamt : ${(total / 1024).toFixed(0)} KB`);
console.log(`  fonts.css    : ${(Buffer.byteLength(css) / 1024).toFixed(0)} KB (Base64 +33 %)`);
console.log(`  -> ${OUT}`);
