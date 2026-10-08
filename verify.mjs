// Checks the two things that silently break in builds copied from this template:
// the card hover lift (killed if reveals animate `transform`), and horizontal
// overflow on a phone.
import puppeteer from 'puppeteer';

const base = process.argv[2];
const pages = (process.argv[3] || 'index,services,about,contact').split(',');

const browser = await puppeteer.launch({ headless: 'new' });
const out = [];

for (const name of pages) {
  const url = `${base}/${name}.html`;

  // ---- horizontal overflow, phone + desktop
  for (const w of [390, 420, 768, 1440]) {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: 900 });
    await p.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 300));
    const o = await p.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    if (o.scroll > o.client + 1) out.push(`OVERFLOW ${name} @${w}: ${o.scroll} > ${o.client}`);
    await p.close();
  }

  // ---- hover lift on the first spec-card outside any pinned run
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(url, { waitUntil: 'networkidle0' });
  const found = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.spec-card')].find(
      (c) => !c.closest('.hscroll')
    );
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    return true;
  });
  if (found) {
    // let the reveal settle, then sample away from the card before hovering
    await new Promise((r) => setTimeout(r, 1400));
    await p.mouse.move(5, 5);
    await new Promise((r) => setTimeout(r, 300));
    const before = await p.evaluate(() => {
      const el = [...document.querySelectorAll('.spec-card')].find((c) => !c.closest('.hscroll'));
      return getComputedStyle(el).transform;
    });
    const box = await p.evaluate(() => {
      const el = [...document.querySelectorAll('.spec-card')].find((c) => !c.closest('.hscroll'));
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    });
    await p.mouse.move(box.x, box.y);
    await new Promise((r) => setTimeout(r, 700));
    const after = await p.evaluate(() => {
      const el = [...document.querySelectorAll('.spec-card')].find((c) => !c.closest('.hscroll'));
      return getComputedStyle(el).transform;
    });
    if (before === after) out.push(`NO HOVER LIFT ${name}: ${before}`);
  }
  await p.close();
}

console.log(out.length ? out.join('\n') : 'clean: no overflow, hover lifts fire');
await browser.close();
