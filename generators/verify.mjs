import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '..', 'assets', 'generated');
const files = [];
const walk = d => readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(join(d, e.name)) : files.push(join(d, e.name)));
walk(dir);

function decode(buf) {
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  let off = 8, idats = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IDAT') idats.push(buf.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
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
  return { w, h, out };
}

let flagged = 0;
for (const f of files.filter(x => x.endsWith('.png') && !x.includes('_test') && !x.includes('_basic') && !x.includes('_viewbox') && !x.includes('_withoutAttrs'))) {
  const buf = readFileSync(f);
  const { w, h, out } = decode(buf);
  let sum = 0, sumR = 0, sumG = 0, sumB = 0, n = 0;
  const samples = [];
  for (let sy = 10; sy < h - 10; sy += Math.max(1, Math.floor(h / 22))) {
    for (let sx = 10; sx < w - 10; sx += Math.max(1, Math.floor(w / 22))) {
      const i = (sy * w + sx) * 4;
      const r = out[i], g = out[i + 1], b = out[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      samples.push(lum);
      sum += lum; sumR += r; sumG += g; sumB += b; n++;
    }
  }
  const mean = sum / n;
  const variance = samples.reduce((acc, s) => acc + (s - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const key = f.replace(/\\/g, '/').split('/generated/')[1];
  const warn = [];
  if (sd < 9 && mean < 25) warn.push('LOW CONTRAST');
  if (mean > 252) warn.push('OVEREXPOSED');
  console.log(`${key.padEnd(42)} ${w}x${h} lum=${mean.toFixed(0).padStart(3)} sd=${sd.toFixed(0).padStart(3)} rgb=[${Math.round(sumR / n)},${Math.round(sumG / n)},${Math.round(sumB / n)}] ${warn.join(' ')}`);
  if (warn.length) flagged++;
}
console.log(flagged ? `\n${flagged} flagged` : '\nAll good');