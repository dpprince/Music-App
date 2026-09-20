import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';

const buf = readFileSync('assets/generated/brand/_test.png');
console.log('sig', buf.subarray(0, 8).toString('hex'));
let off = 8, idats = [], ihdr = null;
while (off < buf.length) {
  const len = buf.readUInt32BE(off);
  const type = buf.toString('ascii', off + 4, off + 8);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 'IHDR') ihdr = data;
  if (type === 'IDAT') idats.push(data);
  off += 12 + len;
}
console.log('IHDR hex', ihdr.toString('hex'));
const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4), depth = ihdr[8], ctype = ihdr[9];
console.log('w', w, 'h', h, 'depth', depth, 'colorType', ctype);
const raw = zlib.inflateSync(Buffer.concat(idats));
console.log('raw length', raw.length, 'expected', (1 + w * 4) * h);
// unfilter (support common filters simply) - dump with filter byte handling
const bpp = 4, rb = 1 + w * 4;
const out = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) {
  const filter = raw[y * rb];
  const row = raw.subarray(y * rb + 1, (y + 1) * rb);
  const prev = y > 0 ? out.subarray((y - 1) * w * 4, y * w * 4) : null;
  for (let x = 0; x < w * 4; x++) {
    const a = x >= bpp ? row[x - bpp] : 0;
    const b = prev ? prev[x] : 0;
    const c = x >= bpp && prev ? prev[x - bpp] : 0;
    let v = row[x];
    if (filter === 1) v = (v + a) & 0xff;
    else if (filter === 2) v = (v + b) & 0xff;
    else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
    else if (filter === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; v = (v + pr) & 0xff; }
    out[y * w * 4 + x] = v & 0xff;
  }
}
for (let y = 0; y < Math.min(6, h); y++) {
  const row = [];
  for (let x = 0; x < Math.min(12, w); x++) row.push(`[${out[(y*w+x)*4]},${out[(y*w+x)*4+1]},${out[(y*w+x)*4+2]},${out[(y*w+x)*4+3]}]`);
  console.log(y, row.join(' '));
}