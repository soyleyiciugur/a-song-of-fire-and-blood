import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, unlink, rmdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd(), base = 'http://localhost:3112', fixtureName = `nav-review-${process.pid}`, fixture = path.join(root, 'app', fixtureName);
await mkdir(fixture);
await writeFile(path.join(fixture, 'page.tsx'), `import Inbox from '@/components/direct-raven/DirectRavenInbox';export default function Page(){return <main style={{maxWidth:400}}><Inbox conversations={[]}/></main>}`);
let browser, logs = '';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', '3112'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
server.stdout.on('data', data => logs += data); server.stderr.on('data', data => logs += data);
try {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(`${base}/search`)).ok) break; } catch {}
    if (i === 89) throw Error(logs.slice(-3000));
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || path.join(process.env.LOCALAPPDATA, 'ms-playwright', 'chromium-1194', 'chrome-win', 'chrome.exe') });
  await mkdir(path.join(root, 'test-results'), { recursive: true });
  for (const width of [1440, 1151, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${base}/search`);
    await page.addStyleTag({ content: 'nextjs-portal{pointer-events:none}' });
    const header = page.locator('header').first();
    if (width > 1150) {
      const group = header.getByRole('button', { name: 'Toggle The Chronicle menu', exact: true }).locator('..');
      await group.hover();
      const link = group.getByRole('link', { name: 'Calendar', exact: true });
      await link.waitFor();
      assert.ok(await link.evaluate(el => { const box = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); }), 'Dropdown is visible and receives pointer events outside the navbar');
      await group.getByRole('button').click();
      await link.waitFor();
      await group.getByRole('button').click();
      assert.equal(await link.count(), 0, 'Second click closes the menu');
      await group.getByRole('button').focus();
      await page.keyboard.press('Enter');
      await link.waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await link.count(), 0);
      await page.mouse.move(0, 300); await group.hover(); await link.click(); await page.waitForURL('**/calendar');
      const separators = await header.locator('[class*="navLinks"]').evaluate(nav => [...nav.children].slice(0, -1).map(el => { const s = getComputedStyle(el, '::after'); return [s.borderLeftWidth, s.height, s.backgroundImage]; }));
      assert.ok(separators.every(([border, height, image]) => border === '1px' && height === '24px' && image === 'none'));
      await header.screenshot({ path: path.join(root, 'test-results', `navbar-expanded-${width}.png`) });
      await page.getByRole('button', { name: 'Collapse site navigation', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click();
    const drawer = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
    await drawer.waitFor();
    const backdrop = page.getByRole('button', { name: 'Close navigation', exact: true });
    const rect = await backdrop.boundingBox();
    assert.equal(rect.y, 0); assert.equal(rect.height, 900);
    assert.equal(await page.getByRole('button', { name: 'Toggle navigation', exact: true }).evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), true, 'Controls stay above the scrim');
    await drawer.getByRole('button', { name: 'Toggle The Chronicle menu', exact: true }).click();
    await drawer.getByRole('link', { name: 'Calendar', exact: true }).waitFor();
    await page.screenshot({ path: path.join(root, 'test-results', `navbar-drawer-${width}.png`) });
    await page.keyboard.press('Escape'); await drawer.waitFor({ state: 'hidden' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
    await page.close(); console.log(`Navbar ${width}: dropdowns, separator widths, drawer, full-height backdrop and overflow passed.`);
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const [route, title] of [['/search', 'Search'], ['/ravens-eye', "The Raven's Eye"], ['/cards', 'The Great Game'], ['/forum', 'Taverns'], ['/notifications', 'Notifications'], [`/${fixtureName}`, 'Direct Raven']]) {
    await page.goto(base + route);
    const heading = page.getByRole('heading', { level: 1, name: title, exact: true });
    await heading.waitFor();
    const icon = heading.locator('span[aria-hidden="true"] svg');
    assert.equal(await icon.count(), 1, `${title} has one decorative title icon`);
    assert.ok(await heading.evaluate(el => { const icon = el.querySelector('svg').getBoundingClientRect(); const range = document.createRange(); const text = [...el.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()); range.selectNode(text); return icon.x >= range.getBoundingClientRect().right; }), `${title} icon follows the title`);
  }
  await page.goto(base);
  const mini = page.getByRole('region', { name: 'The Realm Today calendar', exact: true });
  assert.equal(await mini.getByText('30 days', { exact: true }).count(), 0);
  await page.goto(base + '/calendar');
  assert.equal(await page.getByRole('region', { name: 'Calendar', exact: true }).getByText('30 days', { exact: true }).count(), 1);
  console.log('All six page title icons and miniature/full calendar labels passed.');
} finally {
  await browser?.close(); server.kill();
  await unlink(path.join(fixture, 'page.tsx')); await rmdir(fixture);
}
