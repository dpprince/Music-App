import { Resvg } from '@resvg/resvg-js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
console.log('version', require('@resvg/resvg-js/package.json').version);

const cases = [
  `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="64" height="64" fill="#FF0000"/></svg>`,
  `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#FF0000"/></svg>`,
  `<svg width="100%" height="100%" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#00FF00"/></svg>`,
  `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#FF0000" rx="8"/></svg>`,
];
for (const svg of cases) {
  for (const fitTo of [
    undefined,
    { mode: 'width', value: 64 },
  ]) {
    const opts = { font: { loadSystemFonts: true } };
    if (fitTo) opts.fitTo = fitTo;
    const r = new Resvg(svg, opts);
    console.log(JSON.stringify(fitTo), '=> w', r.width, 'h', r.height, 'px', r.render().pixels.length);
  }
}