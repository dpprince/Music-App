// Generates all brand artwork: album covers, artist monograms, app icon, splash, favicon.
// Usage: node generators/artwork.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'assets', 'generated');
mkdirSync(OUT, { recursive: true });

const catalog = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'catalog.json'), 'utf8'));
const albumById = Object.fromEntries(catalog.albums.map(a => [a.id, a]));
const artistById = Object.fromEntries(catalog.artists.map(a => [a.id, a]));

// ---------- helpers ----------
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hexToRgb = hex => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb = c => c.map(v => Math.round(Math.max(0, Math.min(255, v))));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const mixHex = (h1, h2, t) => {
  const m = mix(hexToRgb(h1), hexToRgb(h2), t);
  return '#' + m.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
};
const toHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const shade = (hex, t) => toHex(rgb(mixHex(hex, t >= 0 ? '#FFFFFF' : '#000000', Math.abs(t)).slice(1) ? mix(hexToRgb(hex), t >= 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(t)) : [0, 0, 0]));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LINEAR = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const RADIAL = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;

// ---------- composition library ----------
// Each kind renders a full 1200x1200 svg. Accent: [c0, c1, c2]

const kindHorizon = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const moon = RADIAL('m', [[0, mixHex(A[2], '#fff', 0.75)], [1, A[2]]], 0.5, 0.5, 0.5);
  const layers = [];
  let y = S * (0.45 + r() * 0.18);
  for (let i = 0; i < 7; i++) {
    const h = 30 + r() * 90;
    const op = 0.18 + r() * 0.4;
    const col = i % 2 ? shade(A[2], -0.3) : shade(A[1], 0.35);
    layers.push(`<rect x="0" y="${y}" width="${S}" height="${h}" fill="${col}" opacity="${op}"/>`);
    y += h * 0.92;
  }
  layers.push(`<rect x="0" y="${y}" width="${S}" height="${S - y}" fill="#000" opacity="0.32"/>`);
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, A[0]], [0.6, A[1]], [1, A[2]]], 0, 0, 0, 1)}${moon}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  ${layers.join('')}
  <circle cx="${S * 0.76}" cy="${S * 0.2}" r="${S * 0.1}" fill="url(#m)" opacity="0.95"/>
  <text x="72" y="${S - 84}" font-family="Georgia, serif" font-style="italic" font-size="76" fill="#fff" opacity="0.96">${esc(album.name)}</text>
  <text x="76" y="${S - 40}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="17" letter-spacing="7" fill="#fff" opacity="0.62">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const kindOrbit = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const cx = S * (0.5 + (r() - 0.5) * 0.1);
  const cy = S * 0.42;
  const sunR = S * 0.24;
  const grid = [];
  const horizon = cy + sunR * 0.86;
  for (let i = 1; i <= 26; i++) {
    const t = i / 26;
    const x = (cx + (i - 13) * 130 * t * 2.4) * t;
    if (i === 13) continue;
    grid.push(`<line x1="${cx + (i - 13) * 34}" y1="${horizon}" x2="${cx + (i - 13) * 34 * 9}" y2="${S}" stroke="#FFCFEF" stroke-opacity="0.16" stroke-width="3"/>`);
  }
  for (let i = 0; i < 6; i++) {
    const yy = horizon + Math.pow(i / 6, 1.6) * (S - horizon);
    grid.push(`<path d="M 0 ${yy} Q ${cx} ${yy - 60 * (i + 1) * 0.5} ${S} ${yy}" stroke="#FFCFEF" stroke-opacity="0.22" stroke-width="3.5" fill="none"/>`);
  }
  const stripes = [];
  for (let i = 0; i < 3; i++) {
    const sy = cy + sunR * 0.15 + i * sunR * 0.34;
    stripes.push(`<line x1="${cx - sunR}" y1="${sy}" x2="${cx + sunR}" y2="${sy}" stroke="${A[0]}" stroke-width="${12 + i * 6}" opacity="0.85"/>`);
  }
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('bg', [[0, '#0B0820'], [0.6, A[0]], [1, shade(A[0], 0.12)]])}${RADIAL('sun', [[0, '#FFFFFF'], [0.34, A[2]], [0.7, A[1]], [1, A[0]]], 0.5, 0.5, 0.5)}</defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${sunR}" fill="url(#sun)"/>
  <g clip-path="url(#sunclip)">${stripes.join('')}</g>
  <clipPath id="sunclip"><circle cx="${cx}" cy="${cy}" r="${sunR}"/></clipPath>
  ${grid.filter(l => !l.includes('stroke-width="3.5"')).slice(0, 40).join('')}
  ${grid.filter(l => l.includes('stroke-width="3.5"')).join('')}
  <text x="84" y="150" font-family="Segoe UI, sans-serif" font-weight="200" font-size="92" letter-spacing="2" fill="#fff">${esc(album.name)}</text>
  <text x="88" y="196" font-family="Segoe UI, sans-serif" font-weight="600" font-size="17" letter-spacing="7" fill="#fff" opacity="0.55">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const kindRings = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const cx = S / 2, cy = S / 2 + 40;
  const rings = [];
  const ringN = 4 + Math.floor(r() * 2);
  for (let i = 0; i < ringN; i++) {
    const rad = 90 + i * (120 + r() * 60);
    const op = 0.55 - i * 0.1;
    const col = i % 2 ? shade(A[1], 0.25) : shade(A[2], -0.15);
    rings.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${col}" stroke-width="${3 + r() * 3}" opacity="${op}"/>`);
    if (i % 2) rings.push(`<circle cx="${cx}" cy="${cy}" r="${rad + 6}" fill="none" stroke="${shade(A[0], 0.3)}" stroke-width="1.4" opacity="${op * 0.7}"/>`);
  }
  rings.push(`<circle cx="${cx}" cy="${cy}" r="${48 + r() * 26}" fill="${mixHex(A[2], '#fff', 0.35)}" opacity="0.9"/>`);
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, A[0]], [1, shade(A[0], 0.16)]])}${LINEAR('tx', [[0, '#fff'], [1, mixHex(A[2], '#fff', 0.6)]])}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  ${rings.join('')}
  <circle cx="${cx}" cy="${cy}" r="560" fill="none" stroke="${shade(A[2], 0.2)}" stroke-width="1" opacity="0.25" stroke-dasharray="2 14"/>
  <text x="${cx}" y="${S - 96}" text-anchor="middle" font-family="Georgia, serif" font-size="70" fill="#fff">${esc(album.name)}</text>
  <text x="${cx}" y="${S - 50}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="600" font-size="16" letter-spacing="8" fill="#fff" opacity="0.55">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const kindGrid = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const cells = [];
  const colors = [shade(A[1], 0.3), A[1], shade(A[2], -0.25), mixHex(A[1], A[2], 0.5), shade(A[0], 0.25), A[0]];
  for (let i = 0; i < 6; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 120 + col * 360, y = 120 + row * 360;
    const rot = (r() - 0.5) * 6;
    cells.push(`<g transform="rotate(${rot} ${x + 150} ${y + 150})"><rect x="${x}" y="${y}" width="300" height="300" fill="${colors[i % colors.length]}" opacity="${0.9 - i * 0.05}"/></g>`);
  }
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, shade(A[0], -0.25)], [1, A[0]]])}${LINEAR('band', [[0, 'rgba(255,255,255,0)'], [0.5, shade(A[2], 0.55)], [1, 'rgba(255,255,255,0)']], 0, 0, 1, 0)}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  ${cells.join('')}
  <rect x="-200" y="640" width="1600" height="170" fill="url(#band)" opacity="0.5" transform="rotate(-14 600 720)"/>
  <text x="80" y="${S - 78}" font-family="Bahnschrift, sans-serif" font-weight="300" font-size="74" letter-spacing="1" fill="#fff">${esc(album.name)}</text>
  <text x="84" y="${S - 38}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="16" letter-spacing="7" fill="#fff" opacity="0.6">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const kindArch = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const cxp = S / 2, archW = 560 + r() * 120, archH = 640 + r() * 60;
  const top = 300;
  const rad = archW / 2;
  const path = `M ${cxp - rad} ${top + archH} L ${cxp - rad} ${top + rad} A ${rad} ${rad} 0 0 1 ${cxp + rad} ${top + rad} L ${cxp + rad} ${top + archH} Z`;
  const innerPath = `M ${cxp - rad + 44} ${top + archH} L ${cxp - rad + 44} ${top + rad} A ${rad - 44} ${rad - 44} 0 0 1 ${cxp + rad - 44} ${top + rad} L ${cxp + rad - 44} ${top + archH} Z`;
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, shade(A[0], 0.28)], [1, shade(A[0], -0.06)]])}${RADIAL('s', [[0, '#FFE9C7'], [0.7, mixHex(A[1], '#E8B86D', 0.5)], [1, shade(A[1], -0.25)]], 0.5, 0.75, 0.75)}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  <path d="${path}" fill="none" stroke="${shade(A[1], 0.4)}" stroke-width="3" opacity="0.8"/>
  <path d="${innerPath}" fill="url(#s)" opacity="0.96"/>
  <circle cx="${cxp}" cy="${top - 30}" r="30" fill="${mixHex(A[1], '#fff', 0.55)}"/>
  <ellipse cx="${cxp}" cy="${top + archH + 26}" rx="${rad * 0.62}" ry="4" fill="${mixHex(A[1], '#000', 0.35)}" opacity="0.4"/>
  <text x="${cxp}" y="${top - 120}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="64" fill="#fff">${esc(album.name)}</text>
  <text x="${cxp}" y="${top - 74}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="600" font-size="15" letter-spacing="8" fill="#fff" opacity="0.55">${esc(artist.name.toUpperCase())}</text>
  <text x="${cxp}" y="${top + archH + 120}" text-anchor="middle" font-family="Cambria, serif" font-size="26" fill="#fff" opacity="0.4">${album.year}</text>
</svg>`;
};

const kindWaves = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const bands = [];
  const colors = [shade(A[1], 0.28), shade(A[1], -0.05), shade(A[2], 0.15), mixHex(A[1], A[2], 0.4)];
  let y = 620;
  for (let i = 0; i < 4; i++) {
    const amp = 46 + r() * 60, yy = y;
    const path = `M 0 ${yy} C ${S * 0.28} ${yy - amp} ${S * 0.62} ${yy + amp - 40} ${S} ${yy + (amp - 30)} L ${S} ${yy + 220} L 0 ${yy + 220} Z`;
    bands.push(`<path d="${path}" fill="${colors[i % colors.length]}" opacity="${0.92 - i * 0.1}"/>`);
    y += 56 + r() * 26;
  }
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, A[0]], [1, shade(A[1], 0.1)]])}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  <circle cx="${120 + r() * 240}" cy="${200 + r() * 120}" r="16" fill="${mixHex(A[2], '#fff', 0.6)}"/>
  ${bands.join('')}
  <text x="${S - 80}" y="${S - 66}" text-anchor="end" font-family="Georgia, serif" font-style="italic" font-size="72" fill="#fff">${esc(album.name)}</text>
  <text x="${S - 82}" y="${S - 28}" text-anchor="end" font-family="Segoe UI, sans-serif" font-weight="600" font-size="16" letter-spacing="7" fill="#fff" opacity="0.6">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const kindFolds = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const W = 320 + r() * 40;
  const panels = [];
  const shades = [shade(A[1], 0.5), shade(A[1], 0.05), shade(A[1], -0.35)];
  for (let i = 0; i < 3; i++) {
    const x = 150 + i * (W + 26) + (i === 1 ? 10 : i === 2 ? -6 : 0);
    panels.push(`<rect x="${x}" y="150" width="${W}" height="${S - 300}" fill="${shades[i]}" transform="rotate(${(r() - 0.5) * 5} ${x} ${S / 2})"/>`);
  }
  const line = `<line x1="150" y1="${S - 228}" x2="${S - 150}" y2="${S - 228}" stroke="${shade(A[1], 0.7)}" stroke-width="2" opacity="0.5"/>`;
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, shade(A[0], -0.3)], [1, A[0]]])}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  ${panels.join('')}
  ${line}
  <text x="${S / 2}" y="${S - 80}" text-anchor="middle" font-family="Georgia, serif" font-size="56" fill="#fff" opacity="0.92">${esc(album.name)}</text>
  <text x="${S / 2}" y="${S - 36}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="600" font-size="14" letter-spacing="9" fill="#fff" opacity="0.5">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const kindRays = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const rays = [];
  const colors = [A[2], shade(A[2], -0.18), mixHex(A[1], A[2], 0.4), shade(A[1], 0.25), mixHex(A[1], '#fff', 0.3)];
  for (let i = 0; i < 14; i++) {
    const a0 = -140 + i * 22 + (r() - 0.5) * 6, a1 = a0 + 14 + r() * 6;
    const p = `M 600 120 L ${600 + Math.cos((a0 * Math.PI) / 180) * 700} ${120 + Math.sin((a0 * Math.PI) / 180) * 700} L ${600 + Math.cos((a1 * Math.PI) / 180) * 700} ${120 + Math.sin((a1 * Math.PI) / 180) * 700} Z`;
    rays.push(`<path d="${p}" fill="${colors[i % colors.length]}" opacity="${0.5 + (i % 3) * 0.14}"/>`);
  }
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, shade(A[0], -0.35)], [1, A[0]]])}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  ${rays.join('')}
  <circle cx="600" cy="130" r="96" fill="${mixHex(A[2], '#fff', 0.55)}"/>
  <text x="${S / 2}" y="${S - 92}" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="58" letter-spacing="4" fill="#fff">${esc(album.name.toUpperCase())}</text>
  <text x="${S / 2}" y="${S - 50}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="600" font-size="14" letter-spacing="9" fill="#fff" opacity="0.5">${esc(artist.name.toUpperCase())}</text>
  <text x="${S / 2}" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#fff" opacity="0.5">*</text>
</svg>`;
};

const kindWedge = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const p = `M 0 ${S} L ${S} ${S} L 0 ${280 + r() * 60} Z`;
  const line = `<line x1="140" y1="${S - 150}" x2="${S - 140}" y2="${S - 150}" stroke="${shade(A[1], 0.55)}" stroke-width="2" opacity="0.5"/>`;
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, shade(A[0], 0.12)], [1, shade(A[0], -0.22)]])}${LINEAR('w', [[0, shade(A[1], 0.35)], [1, shade(A[1], -0.28)]], 0, 1, 1, 0)}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  <path d="${p}" fill="url(#w)"/>
  <line x1="0" y1="${S - 150}" x2="${S}" y2="${S - 150}" stroke="${shade(A[0], 0.4)}" stroke-width="2.5" opacity="0.4"/>
  ${line}
  <text x="${S / 2}" y="${S - 66}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="60" fill="#fff">${esc(album.name)}</text>
  <text x="${S / 2}" y="${S - 28}" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="600" font-size="14" letter-spacing="9" fill="#fff" opacity="0.55">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const kindHalo = (album, artist, seed, A) => {
  const r = mulberry32(seed);
  const S = 1200;
  const cx = S / 2, cy = 430;
  const g1 = RADIAL('hal', [[0, 'rgba(255,255,255,0.9)'], [0.35, mixHex(A[2], '#fff', 0.5)], [1, 'rgba(255,255,255,0)']], 0.5, 0.5, 0.5);
  return `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, shade(A[0], 0.2)], [1, shade(A[0], -0.14)]])}${g1}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  <circle cx="${cx}" cy="${cy}" r="220" fill="url(#hal)" opacity="0.85"/>
  <circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${mixHex(A[2], '#fff', 0.55)}" stroke-width="2.4" opacity="0.85"/>
  <circle cx="${cx}" cy="${cy}" r="182" fill="none" stroke="${shade(A[2], 0.3)}" stroke-width="1.2" opacity="0.4"/>
  <circle cx="${cx}" cy="${cy}" r="118" fill="none" stroke="${mixHex(A[2], '#fff', 0.4)}" stroke-width="1" opacity="0.35"/>
  <line x1="${cx}" y1="700" x2="${cx}" y2="800" stroke="${mixHex(A[2], '#fff', 0.4)}" stroke-width="2" opacity="0.5"/>
  <text x="72" y="${S - 82}" font-family="Georgia, serif" font-style="italic" font-size="72" fill="#fff" opacity="0.95">${esc(album.name)}</text>
  <text x="76" y="${S - 38}" font-family="Segoe UI, sans-serif" font-weight="600" font-size="16" letter-spacing="7" fill="#fff" opacity="0.55">${esc(artist.name.toUpperCase())}</text>
</svg>`;
};

const KINDS = { horizon: kindHorizon, orbit: kindOrbit, rings: kindRings, grid: kindGrid, arch: kindArch, waves: kindWaves, folds: kindFolds, rays: kindRays, wedge: kindWedge, halo: kindHalo };
const KIND_BY_ALBUM = {
  'tidal-motions': 'horizon', 'glass-hour': 'halo', 'vestige': 'arch', 'pale-blue-night': 'orbit',
  'sunday-paper': 'folds', 'slow-canyons': 'wedge', 'ferry-light': 'waves', 'borderlands': 'wedge',
  'kite-season': 'rings', 'pale-fire': 'rays', 'kaleidoscope': 'grid', 'circuitry': 'grid'
};

function render(svg, size, path) {
  if (process.env.ARIA_DUMP_SVG) writeFileSync(path.replace(/\.png$/, '.svg'), svg);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: true } });
  const png = resvg.render().asPng();
  writeFileSync(path, png);
  console.log(`  -> ${path} (${(png.length / 1024).toFixed(0)} KB)`);
}

// ---------- album covers ----------
for (const album of catalog.albums) {
  const artist = artistById[album.artistId];
  const seed = hash(album.id);
  const kind = KIND_BY_ALBUM[album.id] || 'horizon';
  const svg = KINDS[kind](album, artist, seed, album.accent);
  render(svg, 1200, join(OUT, 'art', `${album.id}.png`));
}

// ---------- artist monograms ----------
for (const artist of catalog.artists) {
  const seed = hash(artist.id);
  const r = mulberry32(seed);
  const S = 800;
  const first = artist.name.replace('The ', '').replace('Shōgun Mono', 'S').charAt(0).toUpperCase();
  const accent = catalog.albums.find(a => a.artistId === artist.id)?.accent ?? ['#333', '#555', '#999'];
  const A = accent;
  const initial = artist.id === 'shogun-mono' ? 'Sō' : first;
  const svg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${RADIAL('bg', [[0, shade(A[0], 0.32)], [1, shade(A[0], -0.22)]], 0.35, 0.3, 0.8)}${RADIAL('gl', [[0, 'rgba(255,255,255,0.5)'], [0.55, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']], 0.42, 0.3, 0.6)}</defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <circle cx="${S * 0.42}" cy="${S * 0.3}" r="${S * 0.34}" fill="url(#gl)" opacity="0.5"/>
  <circle cx="${S / 2}" cy="${S / 2}" r="238" fill="none" stroke="${shade(A[1], 0.45)}" stroke-width="2" opacity="0.75"/>
  <circle cx="${S / 2}" cy="${S / 2}" r="210" fill="none" stroke="${shade(A[2], 0.4)}" stroke-width="1.2" opacity="0.45"/>
  <text x="${S / 2}" y="${S / 2 + 64}" text-anchor="middle" font-family="Georgia, serif" font-weight="600" font-size="180" fill="${mixHex(A[2], '#fff', 0.7)}">${esc(initial)}</text>
</svg>`;
  render(svg, 800, join(OUT, 'art', `artist-${artist.id}.png`));
}

// ---------- app icon / splash / favicon / android ----------
const iconSeed = hash('aria-icon');
const r = mulberry32(iconSeed);
const S = 1024;
const iconSvg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${RADIAL('bg', [[0, '#4D1222'], [0.45, '#2A0A16'], [1, '#12040A']], 0.5, 0.42, 0.9)}${LINEAR('arc', [[0, '#FF5C7A'], [0.5, '#FA2949'], [1, '#C21E3E']], 0, 1, 1, 0)}</defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <circle cx="${S / 2}" cy="${S / 2}" r="356" fill="none" stroke="url(#arc)" stroke-width="34" opacity="0.96"/>
  <path d="M ${S / 2 - 150} ${S / 2 + 120} L ${S / 2 - 150} ${S / 2 - 70} Q ${S / 2 - 150} ${S / 2 - 190} ${S / 2 - 60} ${S / 2 - 190} A 86 86 0 0 1 ${S / 2 + 6} ${S / 2 - 130}" fill="none" stroke="#FFD7E0" stroke-width="54" stroke-linecap="round"/>
  <path d="M ${S / 2 - 150} ${S / 2 + 60} L ${S / 2 - 150} ${S / 2 - 150}" fill="none" stroke="#FF9BB0" stroke-width="24" stroke-linecap="round" opacity="0.5"/>
  <circle cx="${S / 2 + 210}" cy="${S / 2 - 190}" r="26" fill="#FFD7E0"/>
</svg>`;
render(iconSvg, 1024, join(OUT, 'brand', 'icon.png'));

const splashSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
<defs>${LINEAR('grad', [[0, '#C21E3E'], [1, '#8A1230']], 0, 1, 1, 0)}</defs>
  <circle cx="512" cy="512" r="330" fill="url(#grad)" opacity="0.96"/>
  <circle cx="512" cy="512" r="330" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="6"/>
  <path d="M 452 608 L 452 380 Q 452 300 540 300 A 120 120 0 0 1 600 348" fill="none" stroke="#fff" stroke-width="60" stroke-linecap="round"/>
</svg>`;
render(splashSvg, 1024, join(OUT, 'brand', 'splash-icon.png'));
render(splashSvg, 360, join(OUT, 'brand', 'android-icon-foreground.png'));

const monoSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <circle cx="512" cy="512" r="330" fill="#fff"/>
  <path d="M 452 608 L 452 380 Q 452 300 540 300 A 120 120 0 0 1 600 348" fill="none" stroke="#000" stroke-width="60" stroke-linecap="round"/>
</svg>`;
render(monoSvg, 1024, join(OUT, 'brand', 'android-icon-monochrome.png'));
render(monoSvg, 64, join(OUT, 'brand', 'favicon.png'));

console.log('Artwork pipeline complete.');