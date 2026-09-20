import { Resvg } from '@resvg/resvg-js';

const svg = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="128" height="128" fill="#101032"/>
<rect x="14" y="14" width="100" height="100" fill="#FFFFFF" rx="10"/>
</svg>`;
const r = new Resvg(svg, { font: { loadSystemFonts: true } });
const png = r.render();
const px = png.pixels;
console.log('buffer len', px.length, 'expect', 128*128*4);
const stats = {};
for (let i = 0; i < px.length; i += 4) {
  const key = `${px[i]},${px[i+1]},${px[i+2]}`;
  stats[key] = (stats[key] || 0) + 1;
}
const top = Object.entries(stats).sort((a,b)=>b[1]-a[1]).slice(0,6);
console.log(top.map(([k,v])=>`${k}: ${v}`).join('\n'));