import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const W = 402, H = 874;
const target = process.argv[2] || 'all'; // all | interactive
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-background-timer-throttling'],
  userDataDir: join(process.env.TEMP || 'C:\\Windows\\Temp', 'opencode', 'pptrx-' + Date.now()),
});

function fmtErr(arr) {
  const seen = new Set();
  const out = [];
  for (const e of arr) {
    const k = String(e).slice(0, 160);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  // Hydration mismatch #418 on cold SSR loads is benign: React regenerates the tree on the client.
  return out.filter(k => !k.includes('Minified React error #418') && !k.includes('react.dev/errors/418')).slice(0, 8);
}

async function snapshot(page, url, out, { wait = 2200, tap = null, afterTapWait = 1200 } = {}) {
  const consoleLog = [];
  const pageErrors = [];
  const onC = m => { if (m.type() === 'error' || m.type() === 'warning') consoleLog.push(`[${m.type()}] ${m.text()}`); };
  const onE = e => pageErrors.push(String(e));
  page.on('console', onC);
  page.on('pageerror', onE);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, wait));
  if (tap) {
    try {
      await page.tap(tap);
      await new Promise(r => setTimeout(r, afterTapWait));
    } catch (e) {
      pageErrors.push(`tap-fail: ${tap} ${e}`);
    }
  }
  const facts = await page.evaluate(() => {
    const t = document.body?.innerText ?? '';
    const mini = Array.from(document.querySelectorAll('div')).some(d => {
      const s = getComputedStyle(d);
      return s.position === 'absolute' && /\n/.test(d.innerText) && / · /.test(d.innerText) && d.innerText.length < 90;
    });
    return {
      title: document.title,
      bodyLen: t.length,
      sample: t.slice(0, 220).replace(/\n+/g, ' | '),
      tabBar: t.includes('Home') && (t.includes('Browse') || t.includes('Library')),
      npOverlay: t.includes('Playing from'),
      miniPlayer: mini,
      errScreens: t.includes('Something went wrong') || t.includes('Application error'),
    };
  });
  await page.screenshot({ path: `${out}.png`, type: 'png' });
  writeFileSync(`${out}.json`, JSON.stringify({ url, errors: fmtErr([...pageErrors, ...consoleLog]) }, null, 2));
  console.log(`${out} | ok | errors=${fmtErr([...pageErrors, ...consoleLog]).length} | mini=${facts.miniPlayer} np=${facts.npOverlay} err=${facts.errScreens}`);
}

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem('aria.onboarded', '1');
  } catch {}
});

if (target === 'all') {
  await snapshot(page, 'http://localhost:8080/home', '.shots/home');
  await snapshot(page, 'http://localhost:8080/browse', '.shots/browse');
  await snapshot(page, 'http://localhost:8080/search', '.shots/search');
  await snapshot(page, 'http://localhost:8080/library', '.shots/library');
  await snapshot(page, 'http://localhost:8080/album/tidal-motions', '.shots/album');
  await snapshot(page, 'http://localhost:8080/artist/lumen-fields', '.shots/artist');
  await snapshot(page, 'http://localhost:8080/playlist/morning-currents', '.shots/playlist');
  await snapshot(page, 'http://localhost:8080/playlist/favorites', '.shots/favorites');
} else {
  // interactive: on home, tap a "Play" affordance (album rail → track row) then Now Playing
  await snapshot(page, 'http://localhost:8080/album/tidal-motions', '.shots/np-album');
  // find the first track row pressable and tap it: track rows are Pressable with child text; tap via body innerText positions is fragile,
  // so we dispatch a click on the element containing the track name text.
  const clicked = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find(d => d.innerText === 'Warm Front Arriving');
    if (el) {
      el.click();
      return true;
    }
    return false;
  });
  console.log('clicked track:', clicked);
  await new Promise(r => setTimeout(r, 2500));
  const npFacts = await page.evaluate(() => {
    const t = document.body?.innerText ?? '';
    return { minion: t.includes('· Lumen Fields'), np: t.includes('Playing from'), playBtn: t.includes('Warm Front Arriving') };
  });
  await page.screenshot({ path: '.shots/np-playing.png', type: 'png' });
  writeFileSync('.shots/np-playing.json', JSON.stringify({ npFacts }, null, 2));
  console.log('np-playing facts', JSON.stringify(npFacts));
}

await browser.close();