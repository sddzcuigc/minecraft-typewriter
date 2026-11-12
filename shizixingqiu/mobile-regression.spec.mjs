import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SZX_BASE_URL || "http://127.0.0.1:4173/";

async function boot(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".dashboard")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".planet-teacher-tab")).toHaveCount(1);
}

async function shot(page, name) {
  const dir = path.join(process.cwd(), "artifacts", "mobile");
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name + ".png"), fullPage: true, animations: "disabled" });
}

async function noDocumentOverflow(page, context) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(geometry.document, context + JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewport + 2);
  expect(geometry.body, context + JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewport + 2);
}

async function locateAnswers(page, char) {
  const isWord = await page.locator(".quiz-word").count() > 0;
  const correct = isWord ? char : await page.evaluate(c => {
    const row = window.HANZI_3500.find(r => r[0] === c);
    return Array.isArray(row?.[1]) ? row[1][0] : "";
  }, char);
  const buttons = page.locator(".quiz-options [data-answer]");
  const values = (await buttons.allTextContents()).map(x => x.trim());
  const right = values.indexOf(correct);
  expect(right, "correct answer must be available for " + char + " (" + correct + ") " + JSON.stringify(values)).toBeGreaterThanOrEqual(0);
  return { buttons, values, right };
}

async function takeCorrect(page, char) {
  const { buttons, right } = await locateAnswers(page, char);
  await buttons.nth(right).click();
  await expect(page.locator("#next")).toBeVisible();
}

test.use({ serviceWorkers: "block" });

for (const viewport of [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 }
]) {
  test("首页及导航布局 " + viewport.width + "px", async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await boot(page);
    await noDocumentOverflow(page, "home");
    await shot(page, "home-" + viewport.width);
    const nav = page.locator(".tabs.planet-tools-nav");
    await expect(nav).toBeVisible();
    const navBox = await nav.boundingBox();
    const contentBox = await page.locator("#content").boundingBox();
    if (viewport.width <= 760) {
      expect(navBox.y + navBox.height, "navigation should be above main content").toBeLessThanOrEqual(contentBox.y + 3);
      expect(await nav.evaluate(el => getComputedStyle(el).overflowX)).toBe("auto");
    } else {
      expect(navBox.x + navBox.width, "desktop/tablet navigation should be alongside main content").toBeLessThanOrEqual(contentBox.x + 3);
    }

    await page.locator('.tab[data-view="bank"]').click();
    await expect(page.locator("#content")).not.toContainText("正在加载本地汉字库");
    await noDocumentOverflow(page, "bank");
    await shot(page, "bank-" + viewport.width);
    await page.locator(".planet-teacher-tab").click();
    await expect(page.locator(".dashboard")).toBeVisible();
    await noDocumentOverflow(page, "return home");
    expect(errors, "uncaught page exceptions").toEqual([]);
  });
}

test("375px: 第一次错题提示、二次讲解、迁移题、完成页和刷新保留记录", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await boot(page);
  await page.locator("#startQuest").click();
  await expect(page.locator(".lesson-character strong")).toBeVisible();
  const firstChar = (await page.locator(".lesson-character strong").innerText()).trim();
  await shot(page, "lesson-375");
  await page.locator("#ready").click();
  let a = await locateAnswers(page, firstChar);
  const wrongs = a.values.map((_, i) => i).filter(i => i !== a.right);
  expect(wrongs.length).toBeGreaterThanOrEqual(2);

  await a.buttons.nth(wrongs[0]).click();
  await expect(page.locator(".quiz-feedback.hint")).toContainText("先别着急");
  await expect(page.locator("#next")).toBeHidden();
  await shot(page, "first-error-375");

  await a.buttons.nth(wrongs[1]).click();
  await expect(page.locator(".quiz-feedback.repair")).toBeVisible();
  await expect(page.locator(".repair-explain")).toBeVisible();
  await expect(page.locator("#guided")).toBeVisible();
  await shot(page, "second-explanation-375");
  await noDocumentOverflow(page, "second explanation");

  await page.locator("#guided").click();
  await expect(page.locator(".quiz-options [data-answer]")).toHaveCount(4);
  await takeCorrect(page, firstChar);
  const saved = await page.evaluate(c => {
    const store = JSON.parse(localStorage.getItem("szx_world_v4") || "null");
    return store?.progress?.[c];
  }, firstChar);
  expect(saved?.seen).toBeGreaterThanOrEqual(1);
  expect(saved?.repairs).toBeGreaterThanOrEqual(1);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".dashboard")).toBeVisible();
  const retained = await page.evaluate(c => {
    const store = JSON.parse(localStorage.getItem("szx_world_v4") || "null");
    return store?.progress?.[c];
  }, firstChar);
  expect(retained?.seen).toEqual(saved.seen);
  expect(retained?.repairs).toEqual(saved.repairs);

  await page.locator("#startQuest").click();
  for (let i = 0; i < 5; i++) {
    const current = page.locator(".lesson-character strong");
    await expect(current, "study card " + i).toBeVisible();
    const char = (await current.innerText()).trim();
    await page.locator("#ready").click();
    await takeCorrect(page, char);
    await page.locator("#next").click();
  }
  await expect(page.locator(".finish-card h2")).toContainText("完成");
  await shot(page, "finish-375");
  await noDocumentOverflow(page, "finish");
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem("szx_world_v4") || "{}").lessons || 0);
  expect(count).toBeGreaterThanOrEqual(1);
  await page.reload({ waitUntil: "domcontentloaded" });
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("szx_world_v4") || "{}").lessons || 0);
  expect(after).toEqual(count);
  await noDocumentOverflow(page, "refreshed home");
  expect(errors, "uncaught page exceptions").toEqual([]);
});

test("320px: 小屏工具导航、拼音闯关、错字本入口不导致整页横向滚动", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await boot(page);
  for (const selector of ['[data-tool="game"]', '[data-tool="review"]', '[data-tool="write"]']) {
    await page.locator(selector).first().click();
    await expect(page.locator("#content")).not.toContainText("正在加载本地汉字库");
    await noDocumentOverflow(page, selector);
    await shot(page, selector.replace(/[^a-z]/g, "") + "-320");
    await page.locator(".planet-teacher-tab").click();
    await expect(page.locator(".dashboard")).toBeVisible();
  }
});
