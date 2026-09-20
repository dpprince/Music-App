import { readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const catalog = JSON.parse(readFileSync('src/data/catalog.json', 'utf8'));
const album = catalog.albums.find(a => a.id === 'ferry-light');
const artist = catalog.artists.find(a => a.id === album.artistId);
const A = album.accent;
const hexToRgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (hex, t) => toHex(mix(hexToRgb(hex), t >= 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(t)));
const mixHex = (h1, h2, t) => toHex(mix(hexToRgb(h1), hexToRgb(h2), t));
const LINEAR = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

console.log('accents', A, 'shaded', A.map(c => shade(c, 0.1)));
const S = 1200;
const svg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>${LINEAR('b', [[0, A[0]], [1, shade(A[1], 0.1)]])}</defs>
  <rect width="${S}" height="${S}" fill="url(#b)"/>
  <rect x="0" y="0" width="${S}" height="400" fill="${shade(A[1], 0.3)}"/>
</svg>`;
const resvg = new Resvg(svg, { font: { loadSystemFonts: true } });
const px = resvg.render().pixels;
const stats = {};
for (let i = 0; i < px.length; i += 16) { // sample every 4th
  const key = `${px[i]},${px[i+1]},${px[i+2]}`;
  stats[key] = (stats[key] || 0) + 1;
}
console.log('top colors:', Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} x${v}`).join(' | '));
console.log('avg:', (() => { let s = 0, n = 0; for (let i = 0; i < px.length; i += 4) { s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; n++; } return (s / n).toFixed(1); })());