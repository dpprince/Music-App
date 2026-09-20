import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';

const file = process.argv[2] || 'assets/generated/art/ferry-light.png';
const buf = readFileSync(file);
const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
let off = 8, idats = [];
while (off < buf.length) { const l = buf.readUInt32BE(off); const t = buf.toString('ascii', off + 4, off + 8); if (t === 'IDAT') idats.push(buf.subarray(off + 8, off + 8 + l)); off += 12 + l; }
const raw = zlib.inflateSync(Buffer.concat(idats));
const bpp = 4, rb = 1 + w * bpp;
const out = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) {
  const f = raw[y * rb];
  const row = raw.subarray(y * rb + 1, (y + 1) * rb);
  const rowBase = y * w * 4;
  const prev = y > 0 ? out.subarray((y - 1) * w * 4, y * w * 4) : null;
  for (let x = 0; x < w * 4; x++) {
    const a = x >= bpp ? out[rowBase + x - bpp] : 0;
    const b = prev ? prev[x] : 0;
    const c = x >= bpp && prev ? prev[x - bpp] : 0;
    let v = row[x];
    if (f === 1) v = (v + a) & 0xff;
    else if (f === 2) v = (v + b) & 0xff;
    else if (f === 3) v = (v + ((a + b) >> 1)) & 0xff;
    else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff; }
    out[rowBase + x] = v & 0xff;
  }
}
const stats = {};
for (let i = 0; i < out.length; i += 4) {
  const key = `${out[i]},${out[i+1]},${out[i+2]}`;
  stats[key] = (stats[key] || 0) + 1;
}
console.log(file, w + 'x' + h, 'bytes', buf.length);
console.log(Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} x${v}`).join('\n'));
// sample row
for (let y = 200; y < 1200; y += 200) {
  const rowPix = [];
  for (let x = 0; x < 1200; x += 120) { const i = (y * w + x) * 4; rowPix.push(`${out[i]},${out[i+1]},${out[i+2]}`); }
  console.log('y' + y, rowPix.join(' | '));
}