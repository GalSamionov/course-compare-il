import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * "הסבה להייטק" (/career-change): העמוד ששולחים בקבוצה. תוכן העניינים, הקורסים שנבחרו מהנתונים (ולא הקצרים,
 * הסדנה או קורס ההמשך), מה ששולם בפועל במרקר הירוק, מה קרה לבוגרים, השאלות עם הקישורים למדריכים,
 * הקריאה לבוגרים, השיתוף בוואטסאפ ותמונת השיתוף. רק קורא: לא משנה כלום במסד.
 *
 * SHOTS=375 או SHOTS=1280: צילום של העמוד לסקירת הסיום של Impeccable, ב-.impeccable/review/growth/ (לא ב-git).
 */
const SHOTS = process.env.SHOTS;
// בצילום התנועה כבויה: מה שעוד לא נכנס למסך היה מצולם באמצע הכניסה שלו.
if (SHOTS) test.use({ reducedMotion: 'reduce' });
if (SHOTS === '375') test.use({ viewport: { width: 375, height: 812 } });
if (SHOTS === '1280') {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
}
async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.screenshot({ path: `../.impeccable/review/growth/${SHOTS}/${name}.png`, fullPage: true });
  await page.screenshot({ path: `../.impeccable/review/growth/${SHOTS}/${name}-first-viewport.png` });
}

test('the career change page lists the long tech courses, the questions to ask, and how to share it', async ({ page }) => {
  await page.goto('/career-change');
  await expect(page.getByRole('heading', { level: 1, name: 'קורסי הסבה להייטק, לפי מי שכבר סיים אותם' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), 'גלילה לרוחב').toBe(false);

  // תוכן העניינים: ארבעה פרקים, וכל אחד מוביל לפרק בעמוד.
  const toc = page.getByRole('navigation', { name: 'בחוברת' });
  await expect(toc.getByRole('link')).toHaveCount(4);
  await expect(toc).toContainText('3 קורסים');
  await expect(toc).toContainText('בוגרים מאומתים');

  // הקורסים: מהנתונים. Full Stack, בניית אתרים ו-Python, ולא כלי AI (24 שעות), React (96 שעות) או הסדנה.
  const courses = page.locator('#courses article');
  await expect(courses).toHaveCount(3);
  await expect(courses.first()).toContainText('פיתוח Full Stack');
  const titles = await courses.locator('h3').allTextContents();
  expect(titles.map((t) => t.trim()).sort()).toEqual(['בניית אתרים מאפס', 'ניתוח נתונים עם Python', 'פיתוח Full Stack'].sort());
  await expect(page.locator('#courses')).not.toContainText('כלי AI לעבודה יומיומית');
  await expect(page.locator('#courses')).not.toContainText('פיתוח צד לקוח עם React');
  await expect(page.locator('#courses')).not.toContainText('סדנת AI לעסקים קטנים');
  // מה ששולם בפועל: במרקר הירוק, עם התווית לקורא מסך.
  await expect(courses.first().locator('mark.hl-verified')).toContainText('נבדק מול מסמך:');
  await expect(courses.first().locator('mark.hl-verified')).toContainText('חצי מהבוגרים שילמו');

  // מה קרה לבוגרים: במרקר הצהוב, רק איפה שיש.
  const outcomes = page.locator('#outcomes');
  await expect(outcomes.locator('mark.hl-grads').first()).toContainText('בוגרים אמרו:');
  await expect(outcomes).toContainText('אחרי 3 חודשים');

  // השאלות: כל אחת עם קישור לפרק במדריך שמסביר אותה.
  const questions = page.locator('#questions ol > li');
  await expect(questions).toHaveCount(7);
  await expect(questions.first().getByRole('link')).toHaveAttribute('href', '/guides/questions-before-signing-up#part-1');
  await expect(page.locator('#questions').getByRole('link', { name: /איך עובדים מימון ושוברי הכשרה/ }).first()).toHaveAttribute(
    'href',
    /^\/guides\/funding-and-vouchers/,
  );

  // הקריאה לבוגרים.
  const graduates = page.locator('#graduates');
  await expect(graduates).toContainText('3 דקות של ביקורת, עם חשבונית או תעודה, יעזרו למי ששוקל עכשיו.');
  await expect(graduates.getByRole('link', { name: 'לכתוב ביקורת על קורס שסיימתי' })).toHaveAttribute('href', '/review');

  // השיתוף בוואטסאפ: ההודעה והכתובת של העמוד.
  const whatsapp = page.getByRole('link', { name: /^לשלוח בוואטסאפ/ }).last();
  const text = new URL((await whatsapp.getAttribute('href'))!).searchParams.get('text') ?? '';
  expect(text).toContain('קורסי הסבה להייטק, לפי מי שכבר סיים אותם');
  expect(text).toContain('אף מוסד לא משלם לנו');
  expect(text.trim().endsWith('/career-change')).toBe(true);

  // תמונת השיתוף: תמונה אמיתית, מהכתובת שבתגית og:image.
  const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogUrl).toMatch(/\/career-change\/opengraph-image/);
  const og = await page.request.get(new URL(ogUrl!).pathname);
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toBe('image/png');
  if (SHOTS) writeFileSync(`../.impeccable/review/growth/${SHOTS}/career-change-og.png`, await og.body());

  // קפיצה מתוכן העניינים לפרק.
  await toc.getByRole('link', { name: 'מה לשאול לפני שמשלמים' }).click();
  await expect(page).toHaveURL(/#questions$/);

  await page.goto('/career-change');
  await shot(page, 'career-change');

  // הקישורים אל העמוד: מדף הבית, ומתחום בהייטק. לא מתחום הבישול.
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'רוצה לעבור להייטק, ולבחור קורס הסבה' })).toHaveAttribute('href', '/career-change');
  await page.goto('/categories/programming');
  await expect(page.getByRole('link', { name: /שוקלים הסבה להייטק\?/ })).toHaveAttribute('href', '/career-change');
  await page.goto('/categories/cooking');
  await expect(page.getByRole('link', { name: /שוקלים הסבה להייטק\?/ })).toHaveCount(0);
});
