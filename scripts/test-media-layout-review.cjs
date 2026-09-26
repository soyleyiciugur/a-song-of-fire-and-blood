const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const gallery = require('../data/gallery.json');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.LOCALAPPDATA + '/ms-playwright/chromium-1194/chrome-win/chrome.exe' });
  fs.mkdirSync('test-results', { recursive: true });
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 768 });
      page.setDefaultTimeout(20000);
      await page.goto('http://localhost:3000/characters', { waitUntil: 'domcontentloaded' });
      const rows = page.locator('[class*="metaLine"]');
      await rows.first().waitFor();
      const invalid = await rows.evaluateAll(rows => rows.filter(row => {
        const [house, title] = row.children;
        if (!title) return false;
        const h = house.getBoundingClientRect(), t = title.getBoundingClientRect();
        return h.right > t.left || t.width < 8 || getComputedStyle(house).whiteSpace !== 'nowrap' || getComputedStyle(title).borderLeftWidth !== '1px';
      }).length);
      assert.equal(invalid, 0, `House separators at ${width}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await rows.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/characters-separator-${width}.png` });
      const reel = gallery.find(x => /mp4$/.test(x.src) && x.caption.length > 165);
      await page.goto(`http://localhost:3000/ravens-eye/reels?item=${reel.id}`, { waitUntil: 'domcontentloaded' });
      const more = page.getByRole('button', { name: 'Show more', exact: true }).first();
      await more.click();
      const less = page.getByRole('button', { name: 'Show less', exact: true });
      await less.waitFor();
      const shell = page.locator('[class*="expandedCaptionShell"]');
      assert.ok(await shell.evaluate(el => {
        const r = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect();
        return r.left >= parent.left && r.right <= parent.right && el.scrollWidth <= el.clientWidth;
      }), `Caption contained at ${width}`);
      assert.ok((await less.boundingBox()).height >= 44);
      await page.screenshot({ path: `test-results/reels-caption-${width}.png` });
      await less.click();
      await more.waitFor();
      const image = gallery.find(x => !/\.(mp4|webm|mov)$/.test(x.src) && x.category !== 'fleabottom');
      await page.goto(`http://localhost:3000/ravens-eye?item=${image.id}`, { waitUntil: 'domcontentloaded' });
      const share = page.getByRole('button', { name: 'Send this image by raven' });
      await share.waitFor();
      assert.equal(await share.count(), 1);
      assert.equal(await page.getByRole('button', { name: 'Send this page by raven' }).count(), 0);
      await share.click();
      await page.getByText('Share this image', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Close share panel' }).last().click();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Send this page by raven' }).waitFor();
      await page.close();
      console.log(`${width}px: character separators, caption expand/collapse, single image share and page-share restoration passed.`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
