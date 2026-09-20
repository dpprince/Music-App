// Synthesizes one evolving ambient mix per album, then encodes to MP3 via ffmpeg-static.
// Each track in the catalog maps to a time-window of its album's mix.
// Usage: node generators/audio.mjs
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CAT = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'catalog.json'), 'utf8'));
const OUT = join(ROOT, 'assets', 'generated', 'audio');
mkdirSync(OUT, { recursive: true });

const SR = 22050;

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// note helpers: midi -> freq
const midiFreq = m => 440 * Math.pow(2, (m - 69) / 12);

// pentatonic-ish scale for bells
const SCALES = {
  maj: [0, 2, 4, 7, 9],
  min: [0, 3, 5, 7, 10],
  dor: [0, 2, 3, 7, 9],
  who: [0, 2, 4, 6, 8],
};

function synthesize(album, artist, progress) {
  const seed = hash(album.id);
  const rnd = mulberry32(seed);
  const totalSamples = Math.round(album.duration * SR);
  const mix = new Float32Array(totalSamples);

  const kind = album.genre.toLowerCase().includes('synth') || album.id === 'kaleidoscope' ? 'bright' :
    album.genre.toLowerCase().includes('lo-fi') || album.id === 'slow-canyons' || album.id === 'sunday-paper' ? 'mellow' :
    album.genre.toLowerCase().includes('dream') || album.id === 'pale-fire' ? 'dream' : 'ambient';

  const options = {
    bright: { scale: 'maj', octaveLow: 3, octaveHigh: 5, sparkle: 0.9, lfo: 0.11, brightness: 1.0, tamp: 0.5 },
    mellow: { scale: 'maj', octaveLow: 3, octaveHigh: 4, sparkle: 0.4, lfo: 0.06, brightness: 0.55, tamp: 0.32 },
    dream: { scale: 'who', octaveLow: 3, octaveHigh: 5, sparkle: 0.6, lfo: 0.08, brightness: 0.8, tamp: 0.42 },
    ambient: { scale: 'min', octaveLow: 2, octaveHigh: 4, sparkle: 0.3, lfo: 0.09, brightness: 0.6, tamp: 0.45 },
  }[kind];

  const roots = [45, 48, 41, 52, 43, 47, 50, 38, 55, 44, 49, 42];
  const rootSeq = [];
  const nChords = Math.max(4, Math.min(8, Math.round(album.duration / 90)));
  for (let i = 0; i < nChords; i++) rootSeq.push(roots[Math.floor(rnd() * roots.length)]);
  const chordLen = totalSamples / nChords;

  // pad bus (accumulated waveform), sparkle events, noise bed
  function buildPad() {
    const pad = new Float32Array(totalSamples);
    const N = 880; // super-sampled control envelope resolution
    const envCtrl = new Float32Array(N);
    for (let c = 0; c < nChords; c++) {
      const s = Math.round((c * totalSamples) / nChords);
      const e = Math.round(((c + 1) * totalSamples) / nChords);
      const root = rootSeq[c];
      const majors = SCALES[options.scale];
      const chord = [
        root, root + 4 + majors[0], root + 7 + majors[Math.floor(rnd() * majors.length)],
        root + 12 + (rnd() < 0.6 ? 0 : 2), root + 16 + majors[Math.floor(rnd() * 2)],
      ];
      for (let k = 0; k < chord.length; k++) {
        const f = midiFreq(chord[k]);
        const detune = (rnd() - 0.5) * 0.018;
        for (let u = 0; u < 2; u++) {
          const f0 = f * (1 + (u === 0 ? detune : -detune) * (0.35 + rnd() * 0.6));
          const amp = options.tamp * (0.55 + rnd() * 0.45) / chord.length;
          const phase = rnd() * Math.PI * 2;
          const target = c === nChords - 1 ? 1 : 0.001;
          const rise = s, fall = Math.round(e - (e - c * chordLen) * 0.82);
          for (let i = s; i < e; i++) {
            // amplitude control via simplified gain: attack to fall, release after
            const t = i - s;
            const env = t < rise ? t / rise : (i >= fall ? Math.max(0.002, 1 - (i - fall) / Math.max(1, (e - fall) * 0.9)) : 1);
            const lfoAmp = 1 + options.lfo * Math.sin(2 * Math.PI * 0.043 * (i / SR) + phase);
            pad[i] += Math.sin(2 * Math.PI * f0 * (i / SR) + phase) * amp * env * lfoAmp;
            const over = f0 * 1.005;
            pad[i] += Math.sin(2 * Math.PI * over * (i / SR) + phase * 1.7) * amp * 0.4 * env * lfoAmp;
            const sub = f0 / 2;
            pad[i] += Math.sin(2 * Math.PI * sub * (i / SR) + phase * 0.5) * amp * 0.6 * env;
          }
          void target;
        }
      }
    }
    // gentle one-pole lowpass
    const f = kind === 'bright' ? 0.22 : kind === 'mellow' ? 0.1 : kind === 'dream' ? 0.16 : 0.12;
    let lp = 0;
    for (let i = 0; i < totalSamples; i++) { lp += f * (pad[i] - lp); pad[i] = lp; }
    void envCtrl;
    return pad;
  }

  const pad = buildPad();

  // sparkle bells
  const sparkle = new Float32Array(totalSamples);
  let t = Math.random() * 2 + 1;
  const scale = SCALES[options.scale];
  while (t < album.duration - 2) {
    const base = rootSeq[Math.min(nChords - 1, Math.floor((t / album.duration) * nChords))];
    const n = scale[Math.floor(rnd() * scale.length)];
    const m = base + 12 + n + (Math.floor(rnd() * 2) * 7);
    const f = midiFreq(m + 12);
    const dur = 2.2 + rnd() * 3.2;
    const amp = (0.05 + rnd() * 0.09) * options.sparkle * 0.5;
    const s = Math.floor(t * SR);
    const len = Math.min(Math.floor(dur * SR), totalSamples - s);
    for (let i = 0; i < len; i++) {
      const r = Math.exp(-i / (SR * (0.6 + rnd() * 0.5)));
      sparkle[s + i] += (Math.sin(2 * Math.PI * f * (i / SR)) + 0.35 * Math.sin(2 * Math.PI * f * 2.003 * (i / SR)) + 0.18 * Math.sin(2 * Math.PI * f * 3.007 * (i / SR))) * amp * r;
    }
    t += 1.8 + rnd() * (kind === 'bright' ? 2.2 : 5.5) * (options.sparkle > 0.7 ? 0.6 : 1);
  }

  // air bed (filtered noise)
  const air = new Float32Array(totalSamples);
  {
    let last = 0;
    const g = 0.09;
    for (let i = 0; i < totalSamples; i++) {
      const nz = (Math.random() * 2 - 1) * g;
      const hp = nz - last; last = nz;
      let hpf = air[i - 1] || 0;
      hpf += 0.012 * (hp * options.brightness * 0.55 - hpf);
      air[i] = hpf * 0.6;
    }
  }

  // feedback delay on pad+sparkle wet
  const wet = new Float32Array(totalSamples);
  const delaySamples = Math.round(0.42 * SR);
  const fb = 0.34;
  const wetTmp = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const d = i >= delaySamples ? wetTmp[i - delaySamples] : 0;
    const inp = pad[i] * 0.32 + sparkle[i];
    wetTmp[i] = inp + d * fb;
    wet[i] = wetTmp[i] * 0.75;
  }

  // master: pad + wet + air + tremolos + fades
  const master = new Float32Array(totalSamples);
  const fadeIn = Math.floor(SR * 3), fadeOut = Math.floor(SR * 6);
  for (let i = 0; i < totalSamples; i++) {
    const t = i / SR;
    const swell = 0.72 + 0.28 * Math.sin(2 * Math.PI * (0.012 + options.lfo * 0.06) * t + seed % 7);
    let v = (pad[i] * 1.0 + wet[i] + air[i] + sparkle[i] * 0.7) * swell * 0.55;
    if (i < fadeIn) v *= Math.pow(i / fadeIn, 1.4);
    if (i > totalSamples - fadeOut) v *= Math.pow((totalSamples - i) / fadeOut, 1.4);
    master[i] = Math.max(-0.96, Math.min(0.96, v));
  }
  void progress;
  return master;
}

// write WAV file
function writeWav(path, samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(samples[i] * 32767), 44 + i * 2);
  writeFileSync(path, buf);
}

let totalBytes = 0;
const onlyIds = (process.env.AUDIO_ONLY || '').split(',').filter(Boolean);
for (const album of CAT.albums) {
  if (onlyIds.length && !onlyIds.includes(album.id)) continue;
  const artist = CAT.artists.find(a => a.id === album.artistId);
  console.log(`\n${album.name} (${album.duration}s)...`);
  const samples = synthesize(album, artist, () => {});
  const wavPath = join(OUT, `${album.id}.wav`);
  const mp3Path = join(OUT, `${album.id}.mp3`);
  writeWav(wavPath, samples);
  console.log(`  wav ${(samples.length * 2 / 1048576).toFixed(1)}MB`);
  execFileSync(ffmpeg, ['-y', '-i', wavPath, '-codec:a', 'libmp3lame', '-b:a', '64k', '-ar', String(SR), '-ac', '1', mp3Path], { stdio: 'pipe' });
  unlinkSync(wavPath);
  const size = require('node:fs').statSync(mp3Path).size;
  totalBytes += size;
  console.log(`  mp3 ${(size / 1048576).toFixed(1)}MB`);
}
console.log(`\nTotal audio: ${(totalBytes / 1048576).toFixed(0)}MB`);