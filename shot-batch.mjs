// Batch capture: one full-page shot per page plus a desktop and phone hero shot.
// fullPage misplaces the position:fixed header, so hero checks use viewport shots.
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2];
const prefix = process.argv[3] || 'site';
const pages = (process.argv[4] || 'index,services,about,contact').split(',');
const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const settle = async (page) => {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let t = 0;
      const id = setInterval(() => {
        window.scrollBy(0, 500);
        t += 500;
        if (t >= document.body.scrollHeight) { clearInterval(id); window.scrollTo(0, 0); setTimeout(res, 350); }
      }, 70);
    });
  });
  await page.evaluate(() => {
    document.querySelectorAll('[class*="reveal"]').forEach((el) => {
      el.classList.add('is-visible');
      el.style.transition = 'none';
    });
  });
  await new Promise((r) => setTimeout(r, 400));
};

const browser = await puppeteer.launch({ headless: 'new' });
for (const name of pages) {
  const url = `${base}/${name}.html`;

  const p1 = await browser.newPage();
  await p1.setViewport({ width: 1440, height: 900 });
  await p1.goto(url, { waitUntil: 'networkidle0' });
  await settle(p1);
  await p1.screenshot({ path: path.join(dir, `${prefix}-${name}-full.png`), fullPage: true });
  await p1.close();

  for (const [w, h, tag] of [[1440, 900, 'desk'], [420, 900, 'phone']]) {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h });
    await p.goto(url, { waitUntil: 'networkidle0' });
    await p.evaluate(() => {
      document.querySelectorAll('[class*="reveal"]').forEach((el) => {
        el.classList.add('is-visible');
        el.style.transition = 'none';
      });
    });
    await new Promise((r) => setTimeout(r, 500));
    await p.screenshot({ path: path.join(dir, `${prefix}-${name}-${tag}.png`) });
    await p.close();
  }
  console.log(`captured ${name}`);
}
await browser.close();
