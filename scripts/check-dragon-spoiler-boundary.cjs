/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const storageKey = "asofiab-reading-progress";
const legacyKey = "asofiab-bookmark";

async function contextWithBoundary(browser, chapterSlug) {
  const context = await browser.newContext();
  await context.addInitScript(({ storageKey, legacyKey, chapterSlug }) => {
    if (!chapterSlug) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(legacyKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify({ chapterSlug, page: 3, updatedAt: "2099-01-01T00:00:00.000Z" }));
    localStorage.setItem(legacyKey, JSON.stringify({ slug: chapterSlug, page: 3 }));
  }, { storageKey, legacyKey, chapterSlug });
  return context;
}

async function openAppearances(context) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/dragons/cloudgazer`, { waitUntil: "networkidle" });
  const section = page.getByRole("region", { name: "Dragon Appearances" });
  await section.waitFor();
  return { page, section };
}

(async () => {
  const response = await fetch(`${baseUrl}/dragons/cloudgazer`);
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const futureDetail of [
    "Flight from King's Landing",
    "The high valley and the northern flight",
    "Departure from Winterfell",
    "Return to King's Landing",
  ]) assert.equal(html.includes(futureDetail), false, `initial HTML leaked: ${futureDetail}`);
  assert.match(html, /Later appearances are sealed/);

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const noProgress = await contextWithBoundary(browser, null);
    const empty = await openAppearances(noProgress);
    await empty.section.getByText(/appearances are sealed/i).waitFor();
    assert.equal(await empty.section.locator("article").count(), 0);
    assert.equal(await empty.section.getByRole("link", { name: "Continue Reading" }).getAttribute("href"), "/chapters");
    await noProgress.close();

    const earlyProgress = await contextWithBoundary(browser, "the-weight-of-loyalty");
    const early = await openAppearances(earlyProgress);
    await early.section.getByText(/appearances are sealed/i).waitFor();
    assert.equal(await early.section.locator("article").count(), 1);
    await early.section.getByText("Flight from King's Landing", { exact: true }).waitFor();
    for (const hiddenDetail of [
      "The high valley and the northern flight",
      "Departure from Winterfell",
      "Return to King's Landing",
    ]) assert.equal(await early.section.getByText(hiddenDetail, { exact: true }).count(), 0, `future appearance leaked: ${hiddenDetail}`);
    assert.equal(await early.section.getByRole("link", { name: "Continue Reading" }).getAttribute("href"), "/chapters/the-weight-of-loyalty?page=3");

    await early.page.goto(`${baseUrl}/chapters/until-the-last-breath`, { waitUntil: "networkidle" });
    const companion = early.page.getByRole("complementary", { name: "Chapter Companion" });
    await companion.getByText("Companion records are sealed").waitFor();
    assert.equal(await companion.getByText("Dragons in this chapter", { exact: true }).count(), 0);
    assert.equal(await companion.getByText("Cloudgazer", { exact: true }).count(), 0);
    const stored = await early.page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
    assert.equal(stored.chapterSlug, "the-weight-of-loyalty", "deep link advanced the spoiler boundary");
    await earlyProgress.close();

    const latestProgress = await contextWithBoundary(browser, "until-the-last-breath");
    const latest = await openAppearances(latestProgress);
    assert.equal(await latest.section.locator("article").count(), 4);
    assert.equal(await latest.section.getByText(/appearances are sealed/i).count(), 0);
    await latestProgress.close();
  } finally {
    await browser.close();
  }

  console.log("Dragon spoiler boundary checks passed: SSR, no-progress, partial boundary, unread deep link, and latest boundary.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
