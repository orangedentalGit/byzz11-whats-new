/**
 * Alle Pfade des Projekts an einer Stelle.
 *
 * Abgeleitet wird vom Ort DIESER Datei (import.meta.url), nicht vom
 * Arbeitsverzeichnis. Das ist der Unterschied, auf den es ankommt: mit
 * resolve('slides') haette jedes Skript nur funktioniert, wenn man vorher
 * `cd dev/build` gemacht hat — die in agenten-briefing.md dokumentierten
 * Aufrufe von der Projektwurzel aus liefen deshalb ins Leere.
 *
 * Zieht der Werkzeugordner noch einmal um, aendert sich hier eine Zeile
 * (BUILD -> DEV) und sonst nichts.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

/** dev/build — hier liegen die Werkzeuge. */
export const BUILD = dirname(fileURLToPath(import.meta.url));
/** dev — Arbeitsmaterial: Quellbilder, Doku, Auftragstexte. */
export const DEV = resolve(BUILD, '..');
/** Projektwurzel — was ausgeliefert wird, liegt direkt darin. */
export const ROOT = resolve(DEV, '..');

export const INDEX = join(ROOT, 'index.html');
export const ASSETS = join(ROOT, 'assets');

export const DOCS = join(DEV, 'docs');
export const SCREENSHOTS = join(DEV, 'screenshots');
/**
 * Der alte PowerPoint-Entwurf. Die Datei ist entfernt — sie war nur Quelle der beiden
 * Videos, und die liegen fertig geschnitten in assets/video/. Der Pfad bleibt stehen,
 * damit prepare-video.mjs sagen kann, wohin die .pptx gehoert, falls sie doch noch
 * einmal gebraucht wird.
 */
export const PPTX = join(DEV, 'byzz v11 - Was ist neu.pptx');

export const SLIDES = join(BUILD, 'slides');
export const SHOTS = join(BUILD, 'shots');
