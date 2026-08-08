/**
 * Setzt index.html aus den Folien-Teildateien in dev/build/slides/ zusammen.
 *
 * Die Folien entstehen parallel in fuenf Teildateien; die endgueltige Reihenfolge
 * im Deck ist eine andere als die Reihenfolge innerhalb der Teildateien. Diese
 * Zuordnung steht unten in ORDER und ist die einzige Wahrheit darueber, welche
 * Folie an welcher Stelle steht.
 *
 * index.html enthaelt dazu zwei Marker; alles dazwischen wird ersetzt.
 *
 * Aufruf:  node assemble.mjs [--check]
 *   --check  nur pruefen und berichten, nichts schreiben
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SLIDES, INDEX } from './paths.mjs';

const START = '<!-- SLIDES:START -->';
const END = '<!-- SLIDES:END -->';

/* [Teildatei, Position darin (0-basiert)] in der Reihenfolge des Decks.
   Die drei Demo-Break-Folien sind auf Wunsch des Auftraggebers entfallen;
   Model-Viewer steht jetzt vor dem DVT-Viewer (C[1] vor C[0] der Videos). */
const ORDER = [
  ['base', 0],                                        //  1 Titel
  ['A', 0],                                           //  2 Agenda
  ['base', 1],                                        //  3 Divider 01
  ['base', 2],                                        //  4 HTTP
  ['B', 0], ['B', 1], ['B', 2],                       //  5 64 Bit · 6 Paro/GreenX · 7 Externe Programme
  ['B', 3], ['B', 4], ['B', 5],                       //  8 Divider 02 · 9 Hilfe-Menue · 10 Erstellungsdatum
  ['C', 0],                                           // 11 Divider 03
  ['base', 3],                                        // 12 Bildansichten (3 Fragmente)
  ['C', 1], ['C', 2], ['C', 4], ['C', 3],             // 13 Ansichten/GUI · 14 KI · 15 Model-Viewer · 16 DVT-Viewer
  ['D', 0], ['D', 1], ['D', 2],                       // 17 Ez3D-i/Slida · 18 DVT-Export · 19 dentaleyepad
  ['D', 3], ['D', 4],                                 // 20 Referenzsuche · 21 Merging und Migration
  ['base', 4],                                        // 22 Konfigurator
  ['D', 5],                                           // 23 Sprachen
  ['E', 0], ['E', 1], ['E', 2], ['E', 3], ['E', 4],   // 24 Divider 04 · 25 loest ibyzz ab · 26 Einstieg · 27 Login · 28 Patienten
  ['E', 5], ['E', 6], ['E', 7], ['E', 8],             // 29 Medien · 30 Einstellungen · 31 DVT-Viewer App · 32 Alles in einer App
  ['A', 1], ['A', 2],                                 // 33 Zusammenfassung · 34 Vielen Dank
];

/** Zerlegt eine Teildatei in ihre <section class="slide">-Bloecke. */
function split(html) {
  const out = [];
  const re = /<section\b[^>]*\bclass="[^"]*\bslide\b[^"]*"[\s\S]*?<\/section>/g;
  let m;
  while ((m = re.exec(html))) out.push(m[0]);
  return out;
}

const parts = {};
const missing = [];
for (const key of ['base', 'A', 'B', 'C', 'D', 'E']) {
  const f = join(SLIDES, `part${key}.html`);
  if (!existsSync(f)) { missing.push(`part${key}.html`); parts[key] = []; continue; }
  parts[key] = split(await readFile(f, 'utf8'));
}

console.log('Teildateien:');
for (const key of Object.keys(parts)) {
  const need = ORDER.filter(([k]) => k === key).length;
  const have = parts[key].length;
  const flag = have === need ? 'ok' : `!! erwartet ${need}`;
  console.log(`  part${key}.html  ${String(have).padStart(2)} Folien   ${flag}`);
}
if (missing.length) {
  console.log('\n!! fehlt: ' + missing.join(', '));
  if (!process.argv.includes('--check')) process.exit(1);
}

const chunks = [];
const gaps = [];
ORDER.forEach(([key, i], pos) => {
  const s = parts[key][i];
  if (!s) { gaps.push(`Position ${pos + 1}: part${key}[${i}] fehlt`); return; }
  chunks.push(`\n  <!-- ${String(pos + 1).padStart(2, '0')} · aus part${key}.html [${i}] -->\n  ` + s.trim() + '\n');
});

if (gaps.length) {
  console.log('\n!! Luecken:');
  gaps.forEach((g) => console.log('   ' + g));
}
console.log(`\nFolien gesamt: ${chunks.length} von ${ORDER.length}`);

if (process.argv.includes('--check')) process.exit(gaps.length ? 1 : 0);

const index = await readFile(INDEX, 'utf8');
const a = index.indexOf(START);
const b = index.indexOf(END);
if (a < 0 || b < 0) { console.error('Marker SLIDES:START / SLIDES:END fehlen in index.html'); process.exit(1); }

const next = index.slice(0, a + START.length) + '\n' + chunks.join('') + '\n  ' + index.slice(b);
await writeFile(INDEX, next, 'utf8');
console.log(`-> ${INDEX} aktualisiert`);
