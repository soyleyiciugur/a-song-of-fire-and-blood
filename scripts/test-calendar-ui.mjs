import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd(), base = 'http://localhost:3111';
const today = JSON.parse(await readFile(path.join(root, 'data/worldDate.json'), 'utf8'));
let logs = '', browser;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', '3111'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
server.stdout.on('data', data => logs += data); server.stderr.on('data', data => logs += data);
try {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(`${base}/calendar`)).ok) break; } catch {}
    if (i === 89) throw Error(logs.slice(-3000));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || path.join(process.env.LOCALAPPDATA, 'ms-playwright', 'chromium-1194', 'chrome-win', 'chrome.exe') });
  await mkdir(path.join(root, 'test-results'), { recursive: true });
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/calendar`);
    await page.addStyleTag({ content: 'nextjs-portal{pointer-events:none}' });
    const calendar = page.getByRole('region', { name: 'Calendar', exact: true });
    await calendar.locator(`[data-day="${today.day}"]`).waitFor();
    assert.equal(await calendar.locator('[data-day]').count(), 30);
    assert.equal(await calendar.locator('[aria-current="date"]').getAttribute('data-day'), String(today.day));
    await calendar.locator('[data-day="15"]').click();
    assert.equal(await calendar.locator('[data-day="15"]').getAttribute('aria-pressed'), 'true');
    await calendar.getByRole('button', { name: 'Choose year', exact: true }).click();
    assert.equal(await calendar.getByRole('option').first().innerText(), `${today.year} AC`);
    await calendar.getByRole('option', { name: '0 AC', exact: true }).click();
    await calendar.getByRole('button', { name: 'Choose moon', exact: true }).click();
    await calendar.getByRole('option', { name: '1st Moon', exact: true }).click();
    await calendar.locator('[data-day="1"]').click();
    await calendar.getByRole('heading', { name: "Aegon's Conquest", exact: true }).waitFor();
    assert.equal(await calendar.getByRole('button', { name: 'Previous moon', exact: true }).isDisabled(), true);
    assert.equal(await calendar.getByRole('button', { name: 'Previous year', exact: true }).isDisabled(), true);
    await calendar.getByRole('button', { name: 'Next year', exact: true }).click();
    assert.equal(await calendar.getByRole('heading', { name: "Aegon's Conquest", exact: true }).count(), 0);
    await calendar.getByRole('button', { name: 'Previous moon', exact: true }).click();
    assert.equal(await calendar.getByRole('button', { name: 'Choose moon', exact: true }).innerText(), '12th Moon');
    assert.equal(await calendar.getByRole('button', { name: 'Choose year', exact: true }).innerText(), '0 AC');
    await calendar.getByRole('button', { name: 'Today', exact: true }).click();
    assert.equal(await calendar.locator(`[data-day="${today.day}"]`).getAttribute('aria-pressed'), 'true');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}`);
    await page.screenshot({ path: path.join(root, 'test-results', `calendar-${width}.png`), fullPage: true });
    const upcoming = page.getByRole('complementary', { name: 'Upcoming namedays and events' });
    assert.ok(!(await upcoming.innerText()).includes('Saera Returns'));
    await upcoming.getByRole('link').first().click();
    await page.waitForURL(/day=/);
    const selectedDay = new URL(page.url()).searchParams.get('day');
    assert.equal(await calendar.locator(`[data-day="${selectedDay}"]`).getAttribute('aria-pressed'), 'true');
    await page.goto(base);
    const home = page.getByRole('region', { name: 'The Realm Today calendar', exact: true });
    await home.waitFor();
    assert.equal(await home.locator('[data-day]').count(), 30);
    assert.ok(!(await home.innerText()).includes('Saera Returns'));
    assert.equal(await home.getByText('Upcoming', { exact: true }).count(), 0);
    await home.screenshot({ path: path.join(root, 'test-results', `calendar-home-${width}.png`) });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Homepage overflow at ${width}`);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Calendar ${width}: current day, 30 days, details, selectors, conquest, year rollover, Upcoming links, homepage and overflow passed.`);
  }
} finally {
  await browser?.close();
  server.kill();
}
