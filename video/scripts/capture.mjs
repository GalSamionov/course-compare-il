// מצלם את האתר החי לסרטון: כל מצב בזרימה, במחשב ובטלפון, ושומר ב-meta.json איפה כל רכיב חשוב נמצא.
// הסצנות ב-Remotion קוראות את המיקומים האלה כדי לזום ולהקיף בעט בדיוק את מה שמוסבר.
// הרצה: pnpm shots (או node scripts/capture.mjs [desk|phone]).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.LAMADTI_URL ?? 'https://course-compare-il.vercel.app';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'shots');
const QUESTION = 'לבנות אתרים';
const WHY = 'להחליף מקצוע';

const DEVICES = {
  // 16:9, כדי שצילום של המסך ימלא פריים של 1920x1080 בלי חיתוך.
  desk: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

/** מיקום של רכיב בעמוד כולו, בפיקסלים של CSS. */
async function pageBox(locator) {
  return locator.first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
  });
}
/** מיקום של רכיב בתוך מה שרואים עכשיו. */
async function viewBox(locator) {
  const b = await locator.first().boundingBox();
  return b && { x: b.x, y: b.y, w: b.width, h: b.height };
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}

async function capture(name) {
  const dir = join(ROOT, name);
  mkdirSync(dir, { recursive: true });
  const meta = { device: name, viewport: DEVICES[name].viewport, base: BASE, capturedAt: new Date().toISOString() };
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...DEVICES[name], locale: 'he-IL', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const shot = async (file, opts = {}) => {
    await settle(page);
    await page.screenshot({ path: join(dir, file), ...opts });
    console.log(name, file);
  };

  // ---- דף הבית, כולו ----
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await shot('home-full.png', { fullPage: true });
  const form = page.locator('form[aria-label="אני מחפש קורס"]');
  const formHeading = page.getByRole('heading', { name: 'מה אתם רוצים ללמוד, ולמה?' });
  meta.home = {
    height: await page.evaluate(() => document.documentElement.scrollHeight),
    boxes: {
      h1: await pageBox(page.locator('h1')),
      example: await pageBox(page.locator('text=לסיכום המלא של הקורס לדוגמה').locator('xpath=..')),
      steps: await pageBox(page.getByRole('heading', { name: 'איך האימות עובד' })),
      formHeading: await pageBox(formHeading),
      form: await pageBox(form),
    },
  };

  // ---- כותבים את השאלה, אות אחר אות ----
  await formHeading.evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -24);
  });
  const textarea = page.locator('textarea[name="what"]');
  await shot('type-00.png');
  await textarea.click();
  await shot('type-01.png');
  const typed = [];
  for (let i = 0; i < QUESTION.length; i++) {
    await page.keyboard.type(QUESTION[i]);
    await shot(`type-${String(i + 2).padStart(2, '0')}.png`);
  }
  typed.push(...Array.from({ length: QUESTION.length + 2 }, (_, i) => `type-${String(i).padStart(2, '0')}.png`));
  meta.typing = {
    frames: typed,
    scrollY: await page.evaluate(() => window.scrollY),
    boxes: {
      line1: await viewBox(textarea),
      submit: await viewBox(form.locator('button[type=submit]')),
    },
  };

  // ---- שורה 2: למה ----
  const whyLine = page.getByRole('button', { name: /למה/ }).first();
  await whyLine.click();
  await page.waitForTimeout(400);
  await shot('why-open.png');
  const openBoxes = {
    options: await viewBox(page.locator('#why-options')),
    choice: await viewBox(page.locator('#why-options button', { hasText: WHY })),
  };
  await page.locator('#why-options button', { hasText: WHY }).click();
  await page.waitForTimeout(600);
  await shot('why-picked.png');
  meta.why = {
    boxes: {
      ...openBoxes,
      line2: await viewBox(whyLine),
      submit: await viewBox(form.locator('button[type=submit]')),
    },
    button: await form.locator('button[type=submit]').innerText(),
  };

  // ---- התוצאות ----
  await form.locator('button[type=submit]').click();
  await page.waitForTimeout(1500);
  await page.locator('#results').evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -16);
  });
  await shot('results.png');
  const resultLinks = page.locator('#results h3 a');
  meta.results = {
    url: page.url(),
    titles: await page.locator('#results h3').allInnerTexts(),
    hrefs: await resultLinks.evaluateAll((as) => as.map((a) => a.getAttribute('href'))),
    boxes: {
      section: await viewBox(page.locator('#results')),
      first: await viewBox(page.locator('#results h3').first()),
      firstRow: await viewBox(page.locator('#results h3').first().locator('xpath=ancestor::div[contains(@class,"@container")][1]')),
      firstScore: await viewBox(
        page.locator('#results h3').first().locator('xpath=ancestor::div[contains(@class,"@container")][1]').locator('span.font-serif'),
      ),
      firstGrads: await viewBox(page.locator('#results .hl-grads')),
    },
  };
  await shot('results-full.png', { fullPage: true });

  // ---- עמוד קורס ----
  const courses = [];
  for (const href of meta.results.hrefs.slice(0, 3)) {
    await page.goto(BASE + href, { waitUntil: 'networkidle' });
    const text = await page.locator('body').innerText();
    courses.push({
      href,
      title: (await page.locator('h1').innerText()).trim(),
      score: (await page.locator('[data-testid="score-value"]').first().innerText().catch(() => '')).trim() || null,
      price: text.match(/([\d,]{4,})\s*₪\s*באתר המוסד/)?.[1] ?? text.match(/באתר המוסד:?\s*([\d,]{4,})/)?.[1] ?? null,
    });
  }
  meta.compareCourses = courses;

  const main = meta.results.hrefs[0];
  await page.goto(BASE + main, { waitUntil: 'networkidle' });
  await shot('course-top.png');
  await shot('course-full.png', { fullPage: true });
  const compareBtn = page.getByRole('checkbox', { name: /להשוואה/ });
  meta.course = {
    href: main,
    height: await page.evaluate(() => document.documentElement.scrollHeight),
    boxes: {
      h1: await pageBox(page.locator('h1')),
      score: await pageBox(page.locator('section[aria-label="ציון בוגרים"]')),
      scoreFrame: await pageBox(page.locator('section[aria-label="ציון בוגרים"] > div').first()),
      notChecked: await pageBox(page.getByText('את הקורס עצמו עוד לא בדקנו')),
      glance: await pageBox(page.locator('section[aria-labelledby="glance-title"]')),
      legend: await pageBox(page.locator('section[aria-label="מקרא הסימונים"]')),
      verified: await pageBox(page.locator('.hl-verified')),
      grads: await pageBox(page.locator('.hl-grads')),
      weak: await pageBox(page.locator('.hl-weak')),
      claim: await pageBox(page.locator('[data-source="claim"]')),
      about: await pageBox(page.getByRole('heading', { name: 'על הקורס' })),
      reviews: await pageBox(page.getByRole('heading', { name: 'ביקורות', exact: true })),
      actions: await pageBox(compareBtn),
    },
  };

  // ---- להשוואה: לפני ואחרי ----
  await compareBtn.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot('compare-before.png');
  const beforeScroll = await page.evaluate(() => window.scrollY);
  await compareBtn.click();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(900);
  await page.evaluate((y) => window.scrollTo(0, y), beforeScroll);
  await shot('compare-after.png');
  meta.compare = {
    boxes: {
      button: await viewBox(compareBtn),
      note: await viewBox(page.locator('[role=status] p').first()),
      save: await viewBox(page.locator('button', { hasText: 'לשמור' })),
    },
  };

  // ---- ההשוואה שלי: הרכיב מהאזור האישי, עם שלושת הקורסים מהתוצאות ----
  // האזור האישי פתוח רק למחוברים, ולכן מציירים את אותו רכיב (CompareTray), באותן מחלקות, בתוך עמוד חי.
  await page.evaluate((list) => {
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const slot = (c, i) => `
      <li class="flex flex-col pt-2.5 ps-2.5 pe-2 pb-1 ${i < 2 ? 'border-e border-ink' : ''}">
        <span class="font-sans text-base leading-tight font-bold">${i + 1}</span>
        <a class="mt-1 flex min-h-11 items-center text-[15px] leading-snug font-bold">${esc(c.title)}</a>
        ${
          c.score
            ? `<p class="mt-1 flex flex-wrap items-baseline gap-x-1 font-sans text-[13px] leading-tight text-ink-soft"><span class="font-serif text-xl leading-none font-bold text-ink">${esc(c.score)}</span>ציון בוגרים</p>`
            : `<p class="mt-1 font-sans text-[13px] leading-tight text-ink-soft">עוד אין ציון</p>`
        }
        <p class="mt-1 font-sans text-[15px] leading-snug font-bold tabular-nums">${c.price ? `<bdi dir="rtl">${esc(c.price)} ₪</bdi>` : '<span class="text-[13px] font-normal text-ink-soft">בלי מחיר באתר</span>'}</p>
        <button type="button" class="mt-1.5 inline-flex h-11 min-w-11 items-center self-start px-1 font-sans text-sm font-semibold underline underline-offset-[3px]">להוציא</button>
      </li>`;
    const host = document.querySelector('main') ?? document.querySelector('.sheet');
    const header = null; // בלי הכותרת של עמוד הקורס: רק הרכיב, כמו באזור האישי.
    const keep = header ? header.outerHTML : '';
    host.innerHTML = `${keep}
      <section id="compare-demo" class="scroll-mt-4 mt-9 lg:mt-12 pb-16">
        <div class="ms-(--margin) ps-3">
          <h2 class="pen-rule text-[21px] leading-snug font-bold lg:text-[26px]">ההשוואה שלי</h2>
          <p class="mt-2 font-sans text-[13px] leading-normal text-ink-soft lg:text-sm">יש בה מקום ל-3 קורסים בדיוק, זה לצד זה. בחרתם 3.</p>
        </div>
        <ol class="relative z-[1] mt-3.5 grid grid-cols-3 border-[1.5px] border-ink bg-white">${list.map(slot).join('')}</ol>
      </section>`;
  }, courses);
  await page.locator('#compare-demo').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await shot('tray.png');
  await page.locator('#compare-demo').screenshot({ path: join(dir, 'tray-only.png') });
  meta.tray = { boxes: { section: await viewBox(page.locator('#compare-demo')) } };

  // ---- כתיבת ביקורת: היום עמוד "נפתח בקרוב" ----
  await page.goto(BASE + main + '/review', { waitUntil: 'networkidle' });
  await shot('review-soon.png');
  meta.review = { title: (await page.locator('h1').innerText().catch(() => '')).trim() };

  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  await browser.close();
}

const only = process.argv[2];
for (const name of Object.keys(DEVICES)) {
  if (!only || only === name) await capture(name);
}
