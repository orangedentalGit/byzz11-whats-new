/**
 * Holt die beiden Bildschirmaufnahmen aus dem alten .pptx-Entwurf und bereitet sie
 * als stumme Endlosschleifen fuers Deck auf.
 *
 *   ppt/media/media1.mp4 -> assets/video/model-viewer.mp4   3D-Model-Viewer (Folie 17)
 *   ppt/media/media2.mp4 -> assets/video/dvt-viewer.mp4     DVT-3D-Viewer   (Folie 16)
 *
 * Aufgaben: Tonspur entfernen (die Clips laufen stumm), auf Panelbreite herunterrechnen,
 * neu kodieren mit faststart, und bei dvt-viewer den Ladebalken-Vorlauf abschneiden —
 * ein Loop, der bei "1 / 450 - 0 %" beginnt, sieht nach Fehler aus, nicht nach Funktion.
 *
 * Aufruf:  node prepare-video.mjs [--probe]
 *   --probe  extrahiert nur Einzelbilder nach dev/build/frames/, um Schnittpunkte zu finden
 *
 * ACHTUNG: Die .pptx ist aus dev/ entfernt — das Skript laeuft derzeit nicht und bricht
 * gleich zu Beginn mit einem Hinweis ab. Die beiden fertigen Loops liegen in
 * assets/video/ und werden ausgeliefert; hier steht nur noch, wie sie entstanden sind.
 * Soll noch einmal geschnitten werden, muss die .pptx zurueck an den Ort, den PPTX in
 * paths.mjs nennt.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import AdmZip from 'adm-zip';
import { PPTX, ASSETS, BUILD } from './paths.mjs';

const ffmpeg = createRequire(import.meta.url)('ffmpeg-static');
const TMP = join(BUILD, 'tmp-video');
const OUT = join(ASSETS, 'video');
const FRAMES = join(BUILD, 'frames');

/* Schnittpunkte aus Einzelbildern im Sekundenraster bestimmt (build/fine-m*.jpg):
 *
 *   media1  0.0–8.9 s  Oberkiefer rotiert
 *           9.0–10.9   "Lade ..."-Badge auf leerer Flaeche   <- raus
 *          11.2–28.2   Unterkiefer, dann beide Kiefer in Okklusion
 *
 *   media2  0.0–4.9 s  schwarzer Ladebildschirm, "1 / 450 - 0 %"   <- raus
 *           5.0–17.0   4-Panel mit koloriertem 3D-Schaedel, dazwischen Vollbild-3D
 *          17.0+       Menue oeffnet, danach Graustufen-Rendering  <- weniger stark
 */
const CLIPS = [
  { entry: 'ppt/media/media1.mp4', out: 'model-viewer.mp4', label: '3D-Model-Viewer', start: 11.2, duration: 17.0, width: 1440 },
  { entry: 'ppt/media/media2.mp4', out: 'dvt-viewer.mp4',   label: 'DVT-3D-Viewer',   start: 5.0,  duration: 12.0, width: 1440 },
];

const run = (args) => execFileSync(ffmpeg, args, { stdio: ['ignore', 'pipe', 'pipe'] });

/** ffmpeg-static bringt kein ffprobe mit — Dauer/Groesse aus dem stderr von `-i` lesen. */
function probe(file) {
  let err = '';
  try { execFileSync(ffmpeg, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { err = String(e.stderr || ''); }
  const d = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  const v = err.match(/Video:.*?,\s*(\d+)x(\d+)/);
  const a = /Audio:/.test(err);
  return {
    seconds: d ? +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]) : null,
    width: v ? +v[1] : null,
    height: v ? +v[2] : null,
    hasAudio: a,
  };
}

/* Ohne diese Pruefung scheitert erst `new AdmZip(...)` — mit einer Meldung, die nach
 * kaputtem Archiv klingt statt nach fehlender Datei. */
if (!existsSync(PPTX)) {
  console.error(
    `\n  Die Quelldatei fehlt:\n    ${PPTX}\n\n` +
    `  Der alte PowerPoint-Entwurf ist aus dev/ entfernt worden. Die beiden fertigen\n` +
    `  Loops liegen bereits im Deck:\n` +
    `    assets/video/model-viewer.mp4\n` +
    `    assets/video/dvt-viewer.mp4\n\n` +
    `  Soll wirklich neu geschnitten werden, die .pptx an den Pfad oben zuruecklegen.\n`
  );
  process.exit(1);
}

await mkdir(TMP, { recursive: true });
await mkdir(OUT, { recursive: true });

const zip = new AdmZip(PPTX);
for (const c of CLIPS) {
  const e = zip.getEntry(c.entry);
  if (!e) throw new Error(`${c.entry} nicht in der .pptx gefunden`);
  await writeFile(join(TMP, c.out), e.getData());
  c.src = join(TMP, c.out);
  c.meta = probe(c.src);
  console.log(
    `  ${c.label.padEnd(18)} ${c.meta.width}x${c.meta.height}  ${c.meta.seconds?.toFixed(1)} s  ` +
    `${((await stat(c.src)).size / 1024 / 1024).toFixed(1)} MB  ${c.meta.hasAudio ? 'mit Ton' : 'ohne Ton'}`
  );
}

if (process.argv.includes('--probe')) {
  await rm(FRAMES, { recursive: true, force: true });
  await mkdir(FRAMES, { recursive: true });
  for (const c of CLIPS) {
    // Ein Bild alle 2 s, auf 480 px — reicht, um Schnittpunkte zu bestimmen.
    run(['-y', '-hide_banner', '-loglevel', 'error', '-i', c.src,
         '-vf', 'fps=1/2,scale=480:-2', '-q:v', '4',
         join(FRAMES, `${c.out.replace('.mp4', '')}-%02d.jpg`)]);
  }
  console.log(`\n  Einzelbilder -> ${FRAMES}`);
  process.exit(0);
}

console.log('');
for (const c of CLIPS) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  if (c.start != null) args.push('-ss', String(c.start));
  args.push('-i', c.src);
  if (c.duration != null) args.push('-t', String(c.duration));
  args.push(
    '-an',                                   // stumm — der Loop laeuft ohne Ton
    '-vf', `scale=${c.width}:-2:flags=lanczos`,
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-crf', '25', '-preset', 'slow',
    '-movflags', '+faststart',
    join(OUT, c.out)
  );
  run(args);
  const m = probe(join(OUT, c.out));
  const size = (await stat(join(OUT, c.out))).size / 1024 / 1024;
  console.log(`  ${c.out.padEnd(20)} ${m.width}x${m.height}  ${m.seconds?.toFixed(1)} s  ${size.toFixed(2)} MB  ${m.hasAudio ? 'MIT TON (Fehler!)' : 'stumm'}`);
}

await rm(TMP, { recursive: true, force: true });
console.log(`\n  -> ${OUT}`);
