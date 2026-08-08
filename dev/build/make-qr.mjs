/**
 * Erzeugt die beiden Store-QR-Codes als SVG.
 *
 * URLs stammen vom Nutzer, so wie sie in byzz hinterlegt sind:
 *   const string AppstoreUrl  = "https://apps.apple.com/app/id6743697899";
 *   const string PlaystoreUrl = "https://play.google.com/store/apps/details?id=de.orangedental.byzz";
 *
 * SVG statt PNG, weil der QR-Code auf der 1920er Buehne skaliert wird und
 * Modulkanten gestochen bleiben muessen — ein weichgezeichneter QR-Code
 * wird von Handykameras schlechter erkannt.
 */
import QRCode from 'qrcode';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ASSETS } from './paths.mjs';

const OUT = join(ASSETS, 'img');
await mkdir(OUT, { recursive: true });

const CODES = [
  { name: 'qr-appstore',  url: 'https://apps.apple.com/app/id6743697899' },
  { name: 'qr-playstore', url: 'https://play.google.com/store/apps/details?id=de.orangedental.byzz' },
];

for (const { name, url } of CODES) {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,                                  // Ruhezone kommt aus dem Deck-Layout
    color: { dark: '#1C1A18', light: '#0000' }, // Tinte auf transparent
  });
  await writeFile(join(OUT, `${name}.svg`), svg, 'utf8');
  console.log(`  ${name.padEnd(14)} ${url}`);
}
console.log(`\n  -> ${OUT}`);
