const { chromium } = require("@playwright/test");

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const executablePath = process.env.PLAYWRIGHT_BROWSER_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
  { name: "narrow", width: 320, height: 568 },
];

async function box(page, selector) {
  const value = await page.locator(selector).first().boundingBox();
  if (!value) throw new Error(`Missing tab bar: ${selector}`);
  return value;
}

async function tabBoxes(page) {
  return page.getByRole("tab").evaluateAll((tabs) => tabs.map((tab) => {
    const rect = tab.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
}

function stableTabs(before, after, label) {
  if (before.length !== after.length) throw new Error(`${label} changed tab count`);
  before.forEach((value, index) => stable(value, after[index], `${label} tab ${index + 1}`));
}

function stable(before, after, label) {
  for (const key of ["x", "y", "width", "height"]) {
    if (Math.abs(before[key] - after[key]) > 1) {
      throw new Error(`${label} moved on ${key}: ${before[key]} -> ${after[key]}`);
    }
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      for (const path of ["/houses", "/timeline", "/map", "/cards", "/update-notes"]) {
        await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 1) throw new Error(`${viewport.name} ${path} has ${overflow}px document overflow`);
      }

      await page.goto(`${BASE}/update-notes`, { waitUntil: "networkidle" });
      const notesBefore = await box(page, '[role="tablist"]');
      const noteTabsBefore = await tabBoxes(page);
      await page.getByRole("tab", { name: "Fixes" }).click();
      stable(notesBefore, await box(page, '[role="tablist"]'), `${viewport.name} update notes`);
      stableTabs(noteTabsBefore, await tabBoxes(page), `${viewport.name} update notes`);

      await page.goto(`${BASE}/cards`, { waitUntil: "networkidle" });
      const cardsBefore = await box(page, '[role="tablist"]');
      const cardTabsBefore = await tabBoxes(page);
      const tabs = page.getByRole("tab");
      if (await tabs.count() > 1) await tabs.nth(1).click();
      stable(cardsBefore, await box(page, '[role="tablist"]'), `${viewport.name} cards`);
      stableTabs(cardTabsBefore, await tabBoxes(page), `${viewport.name} cards`);
      await page.close();
    }
    console.log("Tab layout checks passed at 1440px, 390px, and 320px.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
