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
  '/categories/cooking',
  '/courses/full-stack-sample',
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

async function scan(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), `${path} should load`).toBeLessThan(400);
  await page.waitForLoadState('networkidle');
  return new AxeBuilder({ page }).withTags(TAGS).analyze();
}

for (const size of SIZES) {
  test.describe(`axe, ${size.name}`, () => {
    test.use({ viewport: size.viewport, isMobile: size.isMobile, hasTouch: size.hasTouch });

    for (const path of PAGES) {
      test(`${path} has no critical or serious violations`, async ({ page }, testInfo) => {
        const results = await scan(page, path);
        const lines = results.violations.map(
          (v) => `${v.impact ?? 'unknown'} ${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(' ')}`,
        );
        // שורה אחת לעמוד בפלט: כך רואים גם את מה שלא חוסם.
        console.log(`[axe ${size.name}] ${path}: ${lines.length === 0 ? 'clean' : `\n  ${lines.join('\n  ')}`}`);
        await testInfo.attach('axe-violations', {
          body: JSON.stringify(results.violations, null, 2),
          contentType: 'application/json',
        });

        const blocking = results.violations
          .filter((v) => BLOCKING.has(v.impact ?? ''))
          .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
        expect(blocking, `${path} at ${size.name}`).toEqual([]);
      });
    }
  });
}
