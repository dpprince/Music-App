import { Resvg } from '@resvg/resvg-js';

function dist(svg, opts) {
  const px = new Resvg(svg, opts).render().pixels;
  let nz = 0, tot = px.length / 4;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) { if (px[i] || px[i+1] || px[i+2]) nz++; sum += 0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2]; }
  return { nzPct: (100*nz/tot).toFixed(1), avg: (sum/tot).toFixed(1) };
}

const svgNoVB = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="64" height="64" fill="#FF0000"/></svg>`;
const svgVB = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="64" height="64" fill="#FF0000"/></svg>`;
const svgVB1200 = `<svg width="1200" height="1200" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1200" height="1200" fill="#FF0000"/></svg>`;

const cases = [
  ['noVB, noFit', svgNoVB, undefined],
  ['noVB, fitW64', svgNoVB, { mode: 'width', value: 64 }],
  ['VB, noFit', svgVB, undefined],
  ['VB, fitW64', svgVB, { mode: 'width', value: 64 }],
  ['VB1200, noFit', svgVB1200, undefined],
  ['VB1200, fitW1200', svgVB1200, { mode: 'width', value: 1200 }],
  ['VB1200, fitOriginal', svgVB1200, { mode: 'original' }],
  ['VB1200, fitZoom1', svgVB1200, { mode: 'zoom', value: 1 }],
];
for (const [name, svg, fitTo] of cases) {
  const opts = { font: { loadSystemFonts: true } }; if (fitTo) opts.fitTo = fitTo;
  try { console.log(name.padEnd(22), JSON.stringify(dist(svg, opts))); }
  catch (e) { console.log(name.padEnd(22), 'ERR', e.message); }
}