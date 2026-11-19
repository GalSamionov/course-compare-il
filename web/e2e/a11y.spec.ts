import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * נגישות לפי ת"י 5568, שמאמץ את WCAG 2.0 ברמה AA (ו-2.1 AA במה שבודקים אוטומטית).
 * כל עמוד ראשי, בנייד (375) ובמחשב (1280). הבדיקה נכשלת על הפרה קריטית או חמורה,
 * ומדפיסה גם את הבינוניות והקלות, כדי שיהיה אפשר לראות אותן בלי לעצור את ה-CI.
 * בדיקה אוטומטית מוצאת רק חלק מהבעיות. המעבר במקלדת מתועד בהצהרת הנגישות (/accessibility).
 */
const PAGES = [
  '/',
  // דף הבית עם תשובות: הרשימה מתחת למחברת.
  '/?cat=cooking&when=evening',
  '/categories/cooking',
  // כל הקורסים: בלי ספירה ובלי "עוד אין ציון" (שלב 1 של "לא יודעים למי לפנות?").
  '/courses',
  '/courses/full-stack-sample',
  // קורס בלי ביקורות: "העובדות" ו"מה לשאול לפני שמשלמים" במקום תיבת הציון.
  '/courses/home-cooking-sample',
  '/compare?c=full-stack-sample,baking-sample',
  '/institutions/sample-college',
  '/lecturers/yael-cohen-sample',
  '/guides',
  '/guides/how-to-read-a-syllabus',
  '/method',
  '/who-pays-us',
  '/privacy',
  '/terms',
  '/accessibility',
  '/request-course',
  '/review',
  '/login',
  '/companies',
  '/career-change',
  // לא מחובר: מגיעים להתחברות. בודקים את מה שהמבקר רואה בפועל.
  '/me',
] as const;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BLOCKING = new Set(['critical', 'serious']);

const SIZES = [
  { name: 'mobile', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
] as const;

// בלי תנועה: מרקר באמצע המריחה או דוגמה באמצע העמעום נמדדים אחרת בכל ריצה. המצב הסופי של כל תנועה
// זהה למצב בלי תנועה (layout.tsx), ולכן זה מה שנבדק.
test.use({ reducedMotion: 'reduce' });

async function axe(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const lines = results.violations.map(
    (v) => `${v.impact ?? 'unknown'} ${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(' ')}`,
  );
  // שורה אחת לעמוד בפלט: כך רואים גם את מה שלא חוסם.
  console.log(`[axe] ${label}: ${lines.length === 0 ? 'clean' : `\n  ${lines.join('\n  ')}`}`);
  const blocking = results.violations
    .filter((v) => BLOCKING.has(v.impact ?? ''))
    .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  expect(blocking, label).toEqual([]);
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} should load`).toBeLessThan(400);
  await page.waitForLoadState('networkidle');
}

for (const size of SIZES) {
  test.describe(`axe, ${size.name}`, () => {
    test.use({ viewport: size.viewport, isMobile: size.isMobile, hasTouch: size.hasTouch });

    for (const path of PAGES) {
      test(`${path} has no critical or serious violations`, async ({ page }) => {
        await open(page, path);
        await axe(page, `${size.name} ${path}`);
      });
    }

    // ההיכרות למבקר ראשון: רק בדפדפן נקי. שאר הבדיקות רצות כמי שכבר ראה אותה.
    test('the first-visit card has no critical or serious violations', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: size.viewport,
        isMobile: size.isMobile,
        hasTouch: size.hasTouch,
        reducedMotion: 'reduce',
        storageState: { cookies: [], origins: [] },
      });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.getByRole('dialog', { name: 'פעם ראשונה בלמדתי?' })).toBeVisible();
      await axe(page, `${size.name} first-visit card`);
      await context.close();
    });
  });
}

test.describe('keyboard', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });

  test('the first Tab reaches "דלגו לתוכן", and it moves past the header to the content', async ({ page }) => {
    await open(page, '/courses/full-stack-sample');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'דלגו לתוכן' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    // הטאב הבא כבר בתוך התוכן, ולא בתפריט.
    await page.keyboard.press('Tab');
    const inMain = await page.evaluate(() => !!document.activeElement?.closest('main'));
    expect(inMain).toBe(true);
  });

  test('taking a course out of the comparison and back keeps the focus on the same course', async ({ page }) => {
    await open(page, '/compare?c=full-stack-sample,baking-sample');
    await page.getByRole('button', { name: 'להוציא את אפייה ביתית: לחמים ועוגות מההשוואה' }).focus();
    await page.keyboard.press('Enter');
    // הכפתור נעלם עם הקורס. הפוקוס לא נופל לראש העמוד, אלא עובר ל"להחזיר" של אותו קורס.
    const back = page.getByRole('button', { name: 'להחזיר את אפייה ביתית: לחמים ועוגות להשוואה' });
    await expect(back).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'להוציא את אפייה ביתית: לחמים ועוגות מההשוואה' })).toBeFocused();
  });

  test('an error from the server moves the focus to the field, with the message attached', async ({ page }) => {
    await open(page, '/request-course');
    const link = page.getByLabel('הקישור');
    // הדפדפן מקבל ftp כקישור, והשרת לא: כך מגיעים לשגיאה של השרת. שום דבר לא נשמר.
    await link.fill('ftp://example.com/course');
    await link.press('Enter');
    await expect(link).toHaveAttribute('aria-invalid', 'true');
    await expect(link).toBeFocused();
    await expect(link).toHaveAccessibleDescription(/זה לא נראה כמו קישור לדף/);
  });
});
