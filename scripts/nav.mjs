import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = 402, H = 874;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = '.shots';
const ZONE = 240; // bottom chrome zone in px

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-background-timer-throttling'],
  userDataDir: join(process.env.TEMP || 'C:\\Windows\\Temp', 'opencode', 'pptr-nav-' + Date.now()),
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('aria.onboarded', '1'); } catch {} });

const log = [];
page.on('console', m => { if (m.type() === 'error') log.push(m.text().slice(0, 150)); });
page.on('pageerror', e => log.push(String(e).slice(0, 150)));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// tap a leaf element whose innerText === text; prefer ones in the bottom chrome zone.
async function tap(text) {
  return page.evaluate((t, zone) => {
    const leaves = Array.from(document.querySelectorAll('span,div')).filter(n => n.innerText === t && n.children.length === 0);
    const vis = leaves.filter(n => {
      const r = n.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const inZone = vis.find(n => n.getBoundingClientRect().top > window.innerHeight - zone);
    const hit = inZone || (vis.length ? vis[0] : null) || vis[vis.length - 1] || null;
    if (hit) { hit.click(); return true; }
    return false;
  }, text, ZONE);
}

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, type: 'png' });
  const facts = await page.evaluate(() => {
    // visible-only text sampling
    const leaves = Array.from(document.querySelectorAll('body *')).filter(n => {
      const r = n.getBoundingClientRect();
      const s = getComputedStyle(n);
      if (!n.innerText || n.children.length > 0) return false;
      if (r.width <= 1 || r.height <= 1) return false;
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      // skip inactive tab scenes (RNW marks them aria-hidden)
      let anc = n.parentElement;
      while (anc && anc !== document.body) {
        if (anc.getAttribute && anc.getAttribute('aria-hidden') === 'true') return false;
        anc = anc.parentElement;
      }
      return true;
    });
    const inView = leaves
      .filter(n => n.getBoundingClientRect().top < window.innerHeight && n.getBoundingClientRect().bottom > 0)
      .map(n => n.innerText.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    return { url: location.pathname + location.search, npTop: (() => {
      const e = Array.from(document.querySelectorAll('span,div')).find(n => n.children.length === 0 && n.innerText === 'Playing from ');
      return e ? Math.round(e.getBoundingClientRect().top) : null;
    })(), sample: [...new Set(inView)].slice(0, 26).join(' | ') };
  });
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify({ facts, log: log.splice(0) }, null, 2));
  console.log(`${name} :: (${facts.url}) ${facts.sample.slice(0, 220)}`);
}

// tap the search capsule: the white circle sitting inside the bottom chrome
async function tapSearch() {
  return page.evaluate(() => {
    const circles = Array.from(document.querySelectorAll('div')).filter(d => {
      const r = d.getBoundingClientRect();
      const s = getComputedStyle(d);
      return r.bottom > window.innerHeight - 140 && r.width > 0 && r.width === r.height && parseFloat(s.borderRadius) / r.width > 0.4 && /255, 255, 255|250, 41, 73/.test(s.backgroundColor);
    });
    if (circles.length) { circles.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0].click(); return true; }
    return false;
  });
}

// tap an element (leaf) by exact text, preferring the bottom chrome zone
async function tapIn(text, zone = 9999) {
  return page.evaluate((t, z) => {
    const leaves = Array.from(document.querySelectorAll('span,div')).filter(n => n.innerText === t && n.children.length === 0);
    const vis = leaves.filter(n => n.getBoundingClientRect().width > 0);
    const hit = vis.find(n => n.getBoundingClientRect().top > window.innerHeight - z) || vis[0];
    if (hit) { hit.click(); return true; }
    return false;
  }, text, zone);
}

// tap a leaf: exact text, must be on-screen and pointer-event enabled; pick the lowest one
async function tapLeafZoned(text, zone) {
  return page.evaluate((t, z) => {
    const H = window.innerHeight;
    const leaves = Array.from(document.querySelectorAll('span,div')).filter(n => {
      if (n.innerText !== t || n.children.length > 0) return false;
      const r = n.getBoundingClientRect();
      if (r.width <= 0 || r.top < 0 || r.bottom > H) return false;
      return getComputedStyle(n).pointerEvents !== 'none';
    });
    let best = null, bestTop = -1;
    for (const n of leaves) {
      const top = n.getBoundingClientRect().top;
      if (top > bestTop) { bestTop = top; best = n; }
    }
    if (best) { best.click(); return true; }
    return false;
  }, text, zone);
}

// tap the mini-player card (absolute bottom chrome card, above the tab bar)
async function tapMini() {
  return page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(d => {
      const r = d.getBoundingClientRect();
      return r.width > 0 && r.bottom > window.innerHeight - 250 && d.innerText.includes(' · ') && d.innerText.length < 130 && getComputedStyle(d).position === 'absolute';
    });
    if (cards.length) { cards[0].click(); return true; }
    return false;
  });
}

await page.goto('http://localhost:8080/home', { waitUntil: 'networkidle0', timeout: 60000 });
await sleep(2400);
await shot('nav-home');

await tapIn('Browse'); await sleep(1600); await shot('nav-browse');
await tapSearch(); await sleep(1600); await shot('nav-search');
await tapIn('Library'); await sleep(1600); await shot('nav-library');
await tapIn('Home', 240); await sleep(1400); await shot('nav-home2');

await tapIn('Tidal Motions'); await sleep(2200); await shot('nav-album');
await tapIn('Lumen Fields'); await sleep(1700); await shot('nav-artist');
await page.goBack(); await sleep(1400);

await tapIn('Warm Front Arriving'); await sleep(2600); await shot('nav-mini');
const opened = await tapLeafZoned('Lumen Fields · Tidal Motions', 260);
console.log('mini opened:', opened);
await sleep(2400);
await shot('nav-nowplaying');

await tapIn('Pause');
await sleep(1200);
await shot('nav-np-paused');

await browser.close();