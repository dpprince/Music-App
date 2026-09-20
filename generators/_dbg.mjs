import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
<rect width="64" height="64" fill="#FF0000"/>
<circle cx="32" cy="32" r="20" fill="#FFFFFF"/>
</svg>`;
const r = new Resvg(svg, { font: { loadSystemFonts: true } });
const png = r.render().asPng();
writeFileSync('assets/generated/brand/_test.png', png);
console.log('wrote', png.length);

// allow resvg to load svg text
const svg2 = `<svg width="128" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="128" height="64" fill="#111642"/><text x="10" y="40" font-family="Arial" font-size="32" fill="#FFFFFF">Hi</text></svg>`;
const t = new Resvg(svg2, { font: { loadSystemFonts: true } }).render().asPng();
writeFileSync('assets/generated/brand/_test2.png', t);
console.log('wrote text test', t.length);