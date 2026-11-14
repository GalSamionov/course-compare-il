// מצלם את היועץ מהשאלה הראשונה, לסצנה בסרטון: שאלה בשורה 1, Enter, והתשובה מעל הרשימה.
// רץ מול בנייה מקומית שנבנתה עם מפתח מזויף בפקודה עצמה בלבד (ANTHROPIC_API_KEY=fake), כדי שהיועץ יופיע בדף.
// /api/advise מוחלף בתשובה מ-advisor-mock.json, כמו ב-web/e2e/advisor.spec.ts: בלי מודל, בלי עלות, ואותה תשובה בכל צילום.
// הרצה: node scripts/capture-advisor.mjs (השרת המקומי בפורט 3100, או LAMADTI_LOCAL=...).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.LAMADTI_LOCAL ?? 'http://localhost:3100';
const ROOT = join(here, '..', 'public', 'shots');
const QUESTION = 'איזה קורס תכנות הכי מעשי?';
const mock = JSON.parse(readFileSync(join(here, 'advisor-mock.json'), 'utf8'));
delete mock._;

const DEVICES = {
  desk: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

async function capture(name) {
  const dir = join(ROOT, name);
  const metaPath = join(dir, 'meta.json');
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...DEVICES[name], locale: 'he-IL', reducedMotion: 'reduce' });
  // מבקר שכבר ראה את ההיכרות: בלי הכרטיס על המסך.
  await ctx.addInitScript(() => window.localStorage.setItem('lamadti:intro-seen', '1'));
  const page = await ctx.newPage();
  const calls = [];
  await page.route('**/api/advise', async (route) => {
    calls.push(route.request().postDataJSON());
    await new Promise((r) => setTimeout(r, 700));
    await route.fulfill({ json: mock });
  });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const heading = page.getByRole('heading', { name: 'מה אתם רוצים ללמוד, ולמה?' });
  const top = Math.max(0, Math.round((await heading.boundingBox()).y + (await page.evaluate(() => window.scrollY)) - 40));
  const clip = { x: 0, y: top, width: DEVICES[name].viewport.width, height: name === 'desk' ? 1300 : 1800 };
  const rel = async (locator) => {
    const b = await locator.first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
    });
    return { x: b.x, y: b.y - top, w: b.w, h: b.h };
  };
  const frames = [];
  const frame = async (file, phase) => {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(dir, file), fullPage: true, clip });
    frames.push({ file, phase });
    console.log(name, file);
  };

  const what = page.getByRole('textbox', { name: 'מה ללמוד' });
  await frame('adv-00.png', 'idle');
  const boxes = { note: await rel(page.getByText('אפשר לכתוב כאן גם שאלה')) };
  await what.click();
  await page.waitForTimeout(300);
  // מילה אחרי מילה: שאלה שלמה, בקצב שאפשר לקרוא.
  const words = QUESTION.split(' ');
  for (let i = 0; i < words.length; i++) {
    await page.keyboard.type((i ? ' ' : '') + words[i]);
    await frame(`adv-q-${i + 1}.png`, 'question');
  }
  boxes.line1 = await rel(what);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  await frame('adv-asking.png', 'asking');
  await page.locator('#first-answer mark, #first-answer [data-source]').first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(600);
  await frame('adv-answer.png', 'answer');
  boxes.answer = await rel(page.locator('#first-answer'));
  boxes.results = await rel(page.locator('#results'));
  meta.advisor = { question: QUESTION, top, clip: { w: clip.width, h: clip.height }, frames, boxes, calls };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(name, 'advise calls:', JSON.stringify(calls));
  await browser.close();
}

const only = process.argv[2];
for (const name of Object.keys(DEVICES)) {
  if (!only || only === name) await capture(name);
}
