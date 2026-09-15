import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const base = process.env.SHELL_TEST_URL || 'http://localhost:3112';
try {
  for (const width of [390, 320, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'standalone', { value: true });
      Object.defineProperty(navigator, 'platform', { value: 'iPhone' });
      Object.defineProperty(navigator, 'userAgent', { value: 'iPhone' });
      localStorage.setItem('asofab:installation', JSON.stringify({ id: '00000000-0000-4000-8000-000000000001', version: 1 }));
    });
    let version = 1;
    await context.route('**/api/app-shell', route => route.fulfill({ json: route.request().method() === 'GET' ? { version: 2, reinstallRequired: true, reason: 'A new raven mark awaits.', fingerprint: 'fixture' } : { signedIn: true, version: JSON.parse(route.request().postData()).action === 'acknowledge' ? (version = 2) : version, mascot: 'aldren' } }));
    const page = await context.newPage();
    await page.goto(`${base}/app-update`);
    await page.getByRole('heading', { name: 'A fresh seal is required.' }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `guide fits ${width}`);
    await page.goto(`${base}/offline`);
    const modal = page.getByRole('dialog');
    await modal.waitFor();
    await page.getByRole('button', { name: 'Later', exact: true }).click();
    assert.equal(await modal.isVisible(), false);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForTimeout(400);
    assert.equal(await modal.isVisible(), false, 'Later survives same-session checks');
    await page.evaluate(() => sessionStorage.removeItem('asofab:shell-later:2'));
    await page.reload();
    await modal.waitFor();
    await page.getByRole('button', { name: 'Prepare Update' }).click();
    await page.getByText('I have the The Rookery 🐦‍⬛ Updater Shortcut').click();
    assert.equal(await page.getByRole('link', { name: 'Run The Rookery 🐦‍⬛ Updater' }).getAttribute('href'), 'shortcuts://run-shortcut?name=ASOFAB%20Updater');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `modal fits ${width}`);
    fs.mkdirSync('.tmp', { recursive: true });
    await page.screenshot({ path: `.tmp/shell-update-${width}.png` });
    await page.getByRole('button', { name: 'I’ve added it again' }).click();
    await page.getByRole('heading', { name: 'The fresh seal is yours.' }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('asofab:installation')).version), 2);
    await page.getByRole('button', { name: 'Return to the realm' }).click();
    await context.close();
  }
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
    Object.defineProperty(navigator, 'userAgent', { value: 'iPhone' });
  });
  await context.route('**/api/app-shell', route => route.fulfill({ json: { version: 1, reinstallRequired: false, reason: '', fingerprint: 'fixture' } }));
  const page = await context.newPage();
  await page.goto(`${base}/offline`);
  await page.waitForTimeout(500);
  assert.equal(await page.getByRole('dialog').isVisible(), false, 'ordinary browsing never prompts');
  await context.close();
  console.log('Reinstall modal, Later cadence, manual/Shortcut guide, acknowledgment and responsive checks passed.');
} finally { await browser.close(); }
