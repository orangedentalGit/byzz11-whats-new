/**
 * Liest index.html und schreibt die Folienuebersicht nach dev/docs/inhalt.md.
 *
 * Zweck: Die Tabelle im Inhaltsdokument soll nie von der Wirklichkeit abweichen.
 * Nach jeder Folienaenderung einmal `node dev/build/inventory.mjs` laufen lassen.
 *
 * Aufruf:  node inventory.mjs [--print]
 *   --print  nur ausgeben, dev/docs/inhalt.md nicht anfassen
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { INDEX, DOCS } from './paths.mjs';

const DOC = join(DOCS, 'inhalt.md');
const START = '<!-- INVENTAR:START -->';
const END = '<!-- INVENTAR:END -->';

const SEC = { '1': '01 Haube', '2': '02 Menüs', '3': '03 Features', '4': '04 app' };

const html = await readFile(INDEX, 'utf8');
const secs = html.match(/<section\b[^>]*class="[^"]*\bslide\b[^"]*"[\s\S]*?<\/section>/g) || [];

const decode = (t) => (t || '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const attr = (s, n) => decode((s.match(new RegExp(n + '="([^"]*)"')) || [])[1]);
const has = (s, n) => new RegExp('\\b' + n + '\\b').test(s.slice(0, s.indexOf('>')));

const rows = secs.map((s, i) => {
  const title = attr(s, 'data-title') || '—';
  const sec = attr(s, 'data-section');
  const frags = attr(s, 'data-fragments');

  /* Nur Bilder IM Panelrahmen zaehlen als Screenshot. QR-Codes und Kartenbilder
     liegen ausserhalb und duerfen den Folientyp nicht verfaelschen. */
  const framed = [...s.matchAll(/<div class="shot__frame">[\s\S]*?<img[^>]+src="assets\/img\/([^"]+)"/g)]
    .map((m) => m[1]);
  const other = [...s.matchAll(/<img[^>]+src="assets\/img\/([^"]+)"/g)]
    .map((m) => m[1]).filter((f) => !f.endsWith('.soft.jpg') && !framed.includes(f));
  const imgs = framed;
  const vids = [...s.matchAll(/<video[^>]+src="assets\/video\/([^"]+)"/g)].map((m) => m[1]);

  let type;
  if (has(s, 'data-divider') && i === 0) type = 'Titel';
  else if (has(s, 'data-divider')) type = 'Trenner';
  else if (/class="demo"/.test(s)) type = 'Demo-Break';
  else if (vids.length) type = 'Video';
  else if (frags) type = 'Sequenz';
  else if (imgs.length) type = 'Screenshot';
  else if (/class="cards/.test(s)) type = 'Karten';
  else if (/class="langs"/.test(s)) type = 'Raster';
  else if (/<svg viewBox/.test(s)) type = 'Diagramm';
  else type = 'Text';

  const assets = [...imgs, ...vids, ...other].join(', ') || '—';
  const notesLen = ((s.match(/<template class="notes">([\s\S]*?)<\/template>/) || [, ''])[1])
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length;

  return { n: i + 1, title, sec: sec ? SEC[sec] : '—', type, frags: frags || '', assets, notesLen };
});

const w = (a, k) => Math.max(k.length, ...a.map((r) => String(r).length));
const cols = [
  ['#',        (r) => String(r.n).padStart(2, '0')],
  ['Folie',    (r) => r.title],
  ['Abschnitt',(r) => r.sec],
  ['Typ',      (r) => r.type + (r.frags ? ` (${r.frags})` : '')],
  ['Material', (r) => r.assets],
  ['Notiz',    (r) => r.notesLen + ' Z.'],
];
const widths = cols.map(([h, f]) => w(rows.map(f), h));
const line = (cells) => '| ' + cells.map((c, i) => String(c).padEnd(widths[i])).join(' | ') + ' |';

const table = [
  line(cols.map(([h]) => h)),
  '|' + widths.map((n) => '-'.repeat(n + 2)).join('|') + '|',
  ...rows.map((r) => line(cols.map(([, f]) => f(r)))),
].join('\n');

const stats = [
  '',
  `Folien gesamt: **${rows.length}** · `
  + `Screenshots: **${rows.filter((r) => r.type === 'Screenshot').length}** · `
  + `Sequenzen: **${rows.filter((r) => r.type === 'Sequenz').length}** · `
  + `Videos: **${rows.filter((r) => r.type === 'Video').length}** · `
  + `Demo-Breaks: **${rows.filter((r) => r.type === 'Demo-Break').length}** · `
  + `Diagramme: **${rows.filter((r) => r.type === 'Diagramm').length}**`,
  '',
  `Automatisch erzeugt aus \`index.html\` von \`dev/build/inventory.mjs\`. Nicht von Hand ändern.`,
].join('\n');

const block = table + '\n' + stats;

if (process.argv.includes('--print')) { console.log(block); process.exit(0); }

let doc;
try { doc = await readFile(DOC, 'utf8'); }
catch { console.error(`${DOC} fehlt — erst anlegen, mit den Markern ${START} / ${END}.`); process.exit(1); }

const a = doc.indexOf(START), b = doc.indexOf(END);
if (a < 0 || b < 0) { console.error(`Marker ${START} / ${END} fehlen in dev/docs/inhalt.md`); process.exit(1); }

await writeFile(DOC, doc.slice(0, a + START.length) + '\n\n' + block + '\n\n' + doc.slice(b), 'utf8');
console.log(`${rows.length} Folien -> ${DOC}`);
