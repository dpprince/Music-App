import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const url = process.argv[2];
const out = process.argv[3]; // base path without extension
const skipOnboard = process.argv[4] === '1';
const W = 402;
const H = 874;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-background-timer-throttling'],
  userDataDir: join(process.env.TEMP || 'C:\\Windows\\Temp', 'opencode', 'pptr-' + Date.now()),
});

const consoleLog = [];
const pageErrors = [];
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
if (skipOnboard) {
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('aria.onboarded', '1');
    } catch {}
  });
}
page.on('console', m => {
  const t = m.type();
  if (t === 'error' || t === 'warning') consoleLog.push(`[${t}] ${m.text()}`);
});
page.on('pageerror', e => pageErrors.push(String(e)));

const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 2500));

const facts = await page.evaluate(() => {
  const text = document.body?.innerText ?? '';
  const imgs = Array.from(document.querySelectorAll('img')).length;
  const tabText = text.includes('Home') && (text.includes('Library') || text.includes('Search'));
  return {
    title: document.title,
    imgs,
    hasOnboarding: text.includes('Start Listening'),
    tabText,
    bodyLen: text.length,
    sample: text.slice(0, 260).replace(/\n+/g, ' | '),
  };
});

await page.screenshot({ path: `${out}.png`, type: 'png' });
writeFileSync(`${out}.json`, JSON.stringify({ status: response?.status(), consoleLog, pageErrors, facts }, null, 2));
await browser.close();
console.log(`OK ${out} status=${response?.status()} imgs=${facts.imgs} errs=${pageErrors.length} cons=${consoleLog.length}`);