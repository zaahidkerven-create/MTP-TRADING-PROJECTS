// Viewport-only screenshot — fullPage capture misplaces position:fixed headers,
// so hero and nav checks need this instead.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'viewport';
const width = Number(process.argv[4]) || 1440;
const height = Number(process.argv[5]) || 900;
const scrollY = Number(process.argv[6]) || 0;

const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const existing = fs.readdirSync(dir).filter((f) => /^screenshot-\d+/.test(f));
const n = existing.reduce((max, f) => Math.max(max, parseInt(f.match(/^screenshot-(\d+)/)[1], 10)), 0) + 1;
const outPath = path.join(dir, `screenshot-${n}-${label}.png`);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width, height });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.evaluate((y) => window.scrollTo(0, y), scrollY);
await page.evaluate(() => {
  document.querySelectorAll('[class*="reveal"]').forEach((el) => {
    el.classList.add('is-visible');
    el.style.transition = 'none';
  });
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: outPath });
await browser.close();
console.log(`Saved ${outPath}`);
