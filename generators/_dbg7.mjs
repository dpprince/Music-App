import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const catalog = JSON.parse(readFileSync('src/data/catalog.json', 'utf8'));
const album = catalog.albums.find(a => a.id === 'ferry-light');
const artist = catalog.artists.find(a => a.id === album.artistId);
const A = album.accent;
const hexToRgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const toHex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mixHex = (h1, h2, t) => toHex(mix(hexToRgb(h1), hexToRgb(h2), t));
const shade = (hex, t) => toHex(mix(hexToRgb(hex), t >= 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(t)));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const LINEAR = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

// replicate kindWaves with TEXT like real generator
function make(seedRnd = 0.5) {
  const r = () => { seedRnd = (seedRnd * 48271) % 2147483647; return seedRnd / 2147483647; };
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
}

const svg = make();
writeFileSync('assets/generated/brand/_ferry.svg', svg);
const opts = { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } };
const res = new Resvg(svg, opts);
const px = res.render().pixels;
let nz = 0, sum = 0, n = 0;
for (let i = 0; i < px.length; i += 4) { if (px[i] || px[i+1] || px[i+2]) nz++; sum += 0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2]; n++; }
console.log('nz%', (100*nz/n).toFixed(2), 'avg', (sum/n).toFixed(1));