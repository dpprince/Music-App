import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const cases = {
  basic: `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="64" height="64" fill="#FF0000"/></svg>`,
  viewbox: `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="64" height="64" fill="#00FF00"/></svg>`,
  withoutAttrs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="0" y="0" width="64" height="64" fill="#0000FF"/></svg>`,
};
for (const [k, svg] of Object.entries(cases)) {
  const png = new Resvg(svg, { font: { loadSystemFonts: true }, fitTo: { mode: 'width', value: 64 } }).render().asPng();
  const f = `assets/generated/brand/_${k}.png`;
  writeFileSync(f, png);
  console.log(k, png.length);
}