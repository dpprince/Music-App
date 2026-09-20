import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('assets/generated/brand/_ferry_real.svg', 'utf8');
writeFileSync('assets/generated/brand/_ferry_snapshot.svg', svg);
const opts = { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true } };
const res = new Resvg(svg, opts);
console.log('doc size', res.width, 'x', res.height);
const px = res.render().pixels;
let nz = 0, sum = 0, n = 0;
for (let i = 0; i < px.length; i += 4) { if (px[i] || px[i+1] || px[i+2]) nz++; sum += 0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2]; n++; }
console.log('nz%', (100*nz/n).toFixed(2), 'avg', (sum/n).toFixed(1), 'len', px.length);