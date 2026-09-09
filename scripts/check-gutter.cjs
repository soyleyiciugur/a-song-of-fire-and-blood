const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const community = require('../data/flea-bottom.json');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const base = process.env.GUTTER_TEST_URL || 'http://localhost:3100';
  const memeId = 'gallery-a-feast-for-butchers';
  const reelId = 'gallery-derrin-will-return';
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`${base}/ravens-eye/memes?item=${memeId}`);
      const thread = page.getByRole('region', { name: 'Flea Bottom comments' });
      await thread.waitFor();
      assert.equal(await thread.locator('article').count(), community.comments.filter((c) => c.entryId === memeId).length);
      assert(await thread.getByRole('list', { name: 'Replies to @gaelord_apologist' }).count());
      const profile = thread.locator('summary').first();
      await profile.click();
      await thread.locator('details[open]').getByText('Fictional regular', { exact: true }).waitFor();
      assert(await profile.evaluate((el) => el.parentElement.open));
      const author = community.users.find((user) => user.id === 'regular-g');
      const authorComments = community.comments.filter((comment) => comment.authorId === author.id);
      const authorPosts = new Set(authorComments.map((comment) => comment.entryId)).size;
      const profilePanel = thread.locator('details[open]');
      await profilePanel.getByText(author.displayName, { exact: true }).waitFor();
      await profilePanel.getByText(author.current.value, { exact: true }).waitFor();
      await profilePanel.getByText(`${authorComments.length} comments across ${authorPosts} posts`, { exact: true }).waitFor();
      assert(await profilePanel.evaluate((el) => el.scrollWidth <= el.clientWidth), 'Profile details fit the viewport');
      const footer = thread.getByText(/Member accounts & comments/);
      await footer.scrollIntoViewIfNeeded();
      const footerBounds = await footer.boundingBox();
      assert(footerBounds.y >= 0 && footerBounds.y + footerBounds.height <= viewport.height, 'Thread footer is reachable');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      await page.screenshot({ path: `${process.env.TEMP}/gutter-meme-${viewport.width}.png` });
      const original = await thread.locator('article > p').allTextContents();
      await page.reload();
      await thread.waitFor();
      assert.deepEqual(await thread.locator('article > p').allTextContents(), original, 'Comments persist across reloads');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.waitForURL((url) => url.searchParams.get('item') !== memeId);
      assert.equal(await page.locator('[class*="gutterLightbox"]').evaluate((el) => el.scrollTop), 0, 'Next meme starts at its image');
      assert(!(await page.locator('details[open]').count()), 'Profile expansion resets for next meme');
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await thread.waitFor({ state: 'detached' });

      await page.goto(`${base}/ravens-eye/reels?item=${reelId}`);
      const slide = page.locator('[class*="reelSlide"]').filter({ has: page.locator(`video[src="/videos/reels/derrin-will-return.mp4"]`) }).first();
      const talk = slide.getByRole('region', { name: 'Flea Bottom comments' });
      const toggle = talk.getByRole('button', { name: /Gutter talk/ });
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await talk.locator('article').count(), community.comments.filter((c) => c.entryId === reelId).length);
      await talk.locator('summary').first().click();
      await talk.locator('details[open]').getByText('Fictional regular', { exact: true }).waitFor();
      await talk.getByText(/Member accounts & comments/).scrollIntoViewIfNeeded();
      assert(new URL(page.url()).searchParams.get('item') === reelId, 'Comment scrolling does not change reels');
      await page.screenshot({ path: `${process.env.TEMP}/gutter-reel-${viewport.width}.png` });
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await talk.waitFor({ state: 'detached' });
      await page.goto(`${base}/ravens-eye/memes?item=gallery-mslvvyhv`);
      const fandomProfile = page.locator('details').filter({ has: page.locator('summary', { hasText: '@plumbob.sena' }) });
      await fandomProfile.locator('summary').click();
      await fandomProfile.getByText('sena', { exact: true }).waitFor();
      await fandomProfile.getByText('she/her', { exact: true }).waitFor();
      await fandomProfile.getByText('The Sims', { exact: true }).waitFor();
      await fandomProfile.getByText('1 comment across 1 post', { exact: true }).waitFor();
      assert(await fandomProfile.evaluate((el) => el.scrollWidth <= el.clientWidth), 'New fandom profile fits the viewport');
      await fandomProfile.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${process.env.TEMP}/gutter-profile-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      console.log(`PASS ${viewport.width}px: meme threads, profiles, replies, scroll, persistence, navigation, reel panel`);
    }
    await page.goto(`${base}/ravens-eye?item=gallery-alester-jace-fleabottom`);
    await page.getByRole('button', { name: 'Close', exact: true }).waitFor();
    assert.equal(await page.getByRole('region', { name: 'Flea Bottom comments' }).count(), 0, 'Raven images have no gutter comments');
    assert.deepEqual(errors, [], 'No browser errors');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
