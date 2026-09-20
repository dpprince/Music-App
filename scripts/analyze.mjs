// Decode a PNG (RGBA8) with full unfilter pass and report pixel statistics.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const file = process.argv[2];
const buf = readFileSync(file);
if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not png');
let pos = 8;
let w = 0, h = 0, bpp = 0, colorType = 0, idat = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  const data = buf.subarray(pos + 8, pos + 8 + len);
  if (type === 'IHDR') {
    w = data.readUInt32BE(0);
    h = data.readUInt32BE(4);
    const bitDepth = data[8];
    colorType = data[9];
    bpp = bitDepth === 16 ? 8 : bitDepth === 8 ? (colorType === 6 ? 4 : colorType === 2 ? 3 : 1) : 0;
  } else if (type === 'IDAT') idat.push(data);
  pos += 12 + len;
}
const raw = inflateSync(Buffer.concat(idat));
const stride = w * bpp + 1;
const channels = bpp;
const out = Buffer.alloc(w * h * 4);
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
for (let y = 0; y < h; y++) {
  const filter = raw[y * stride];
  const row = raw.subarray(y * stride + 1, (y + 1) * stride);
  for (let x = 0; x < w * bpp; x++) {
    let v = row[x];
    const left = x >= bpp ? out4(x - bpp, y) : 0;
    const up = y > 0 ? out4(x, y - 1) : 0;
    const ul = x >= bpp && y > 0 ? out4(x - bpp, y - 1) : 0;
    if (filter === 1) v = (v + left) & 255;
    else if (filter === 2) v = (v + up) & 255;
    else if (filter === 3) v = (v + ((left + up) >> 1)) & 255;
    else if (filter === 4) v = (v + paeth(left, up, ul)) & 255;
    set4(x, y, v);
  }
}
function out4(x, y) {
  return out[y * w * 4 + x];
}
function set4(x, y, v) {
  out[y * w * 4 + x] = v;
}

let sumL = 0, sumL2 = 0, accent = 0, white = 0, dark = 0;
const N = w * h;
for (let i = 0; i < N; i++) {
  const r = out[i * 4], g = out[i * 4 + 1], b = out[i * 4 + 2];
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  sumL += L;
  sumL2 += L * L;
  if (r > 160 && g < 110 && b < 130) accent++;
  if (r > 220 && g > 220 && b > 220) white++;
  if (L < 12) dark++;
}
const mean = sumL / N;
const std = Math.sqrt(sumL2 / N - mean * mean);

// band profiles: division into 10 horizontal strips
const strips = [];
const band = Math.floor(N / 10);
for (let s = 0; s < 10; s++) {
  const off = s * band;
  let acc = 0;
  for (let k = 0; k < band; k++) acc += out[(off + k) * 4] * 0.2126 + out[(off + k) * 4 + 1] * 0.7152 + out[(off + k) * 4 + 2] * 0.0722;
  strips.push(Math.round(acc / band));
}

// bottom strips (chrome region): average of strips 8,9 luminance
const chromeL = Math.round((strips[8] + strips[9]) / 2);

console.log(JSON.stringify({
  w, h, mean: Math.round(mean), std: Math.round(std),
  accentPct: +(100 * accent / N).toFixed(1),
  whitePct: +(100 * white / N).toFixed(1),
  darkPct: +(100 * dark / N).toFixed(1),
  strips,
  chromeL,
}, null, 1));