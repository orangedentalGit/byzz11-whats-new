/**
 * Gesamtabnahme in einem Lauf:
 *   1. index.html aus den Teildateien zusammensetzen
 *   2. alle Folien fotografieren und auf Layoutfehler pruefen
 *   3. Rahmenfunktionen pruefen (Skalierung, Uebersicht, Navigation)
 *   4. Referentenansicht pruefen
 *   5. Kaltstart aus einem fremden Pfad (findet hartkodierte Pfade)
 *
 * Bricht beim ersten Fehlschlag nicht ab, sondern faehrt alles durch und meldet
 * am Ende gesammelt — man will nach einem Lauf wissen, was ALLES offen ist.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { BUILD } from './paths.mjs';

const STEPS = [
  ['Montage',            'assemble.mjs',       []],
  ['Folien und Layout',  'shot.mjs',           ['--frag']],
  ['Rahmenfunktionen',   'test-shell.mjs',     []],
  ['Referentenansicht',  'test-presenter.mjs', []],
  ['Kaltstart',          'test-coldstart.mjs', []],
];

const results = [];
for (const [label, script, args] of STEPS) {
  process.stdout.write(`\n${'='.repeat(64)}\n  ${label}\n${'='.repeat(64)}\n`);
  const r = spawnSync(process.execPath, [join(BUILD, script), ...args], { stdio: 'inherit' });
  results.push([label, r.status === 0]);
}

console.log(`\n${'='.repeat(64)}\n  Ergebnis\n${'='.repeat(64)}`);
results.forEach(([l, ok]) => console.log(`  ${ok ? 'ok  ' : 'FEHL'}  ${l}`));
const failed = results.filter(([, ok]) => !ok).length;
console.log(failed ? `\n${failed} Schritt(e) mit Befund.` : '\nAlles bestanden.');
process.exit(failed ? 1 : 0);
