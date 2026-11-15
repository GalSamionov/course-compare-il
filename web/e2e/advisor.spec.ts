import { expect, test, type Page } from '@playwright/test';

/** ההערה בעט מתחת לשורה הראשונה. היא בדף רק כשהיה ANTHROPIC_API_KEY בזמן הבנייה. */
const NOTE = 'אפשר לכתוב כאן גם שאלה. היועץ יענה מתוך מה שיש באתר.';
const QUESTION = 'איזה קורס בישול כדאי לי בערבים?';
/** "בישול" ו"בערבים": התאמת המילים מוצאת 3 קורסים, בלי AI. */
const COOKING_EVENING = ['italian-sample', 'home-cooking-sample', 'baking-sample'];

/** /api/advise מוחלף בתשובה לדוגמה, באותו מבנה שהשרת מחזיר. כך הבדיקה לא עולה כסף ולא תלויה במודל. */
async function mockAdvise(page: Page, limit = false) {
  const calls: { question: string; courseSlugs: string[] }[] = [];
  await page.route('**/api/advise', async (route) => {
    const body = route.request().postDataJSON() as { question: string; courseSlugs: string[] };
    calls.push(body);
    if (limit) {
      await route.fulfill({ status: 429, json: { error: 'limit', remaining: 0 } });
      return;
    }
    const [first, second = first] = body.courseSlugs;
    await route.fulfill({
      json: {
        advice: {
          sentences: [
            { text: 'נמשך שמונה מפגשים, בשני ערבים בשבוע.', source: 'verified', courseSlug: first },
            { text: 'בוגרים כתבו שהמפגשים מעשיים.', source: 'graduates', courseSlug: first },
            { text: 'המוסד אומר שאין צורך בניסיון קודם.', source: 'institution', courseSlug: second },
          ],
          notEnoughInfo: false,
          missing: null,
        },
        remaining: 9,
      },
    });
  });
  return calls;
}

/** הדף נבנה עם היועץ? בלי מפתח בזמן הבנייה, הבדיקות של היועץ לא רלוונטיות. */
async function skipWithoutAdvisor(page: Page) {
  test.skip((await page.getByText(NOTE).count()) === 0, 'הדף נבנה בלי ANTHROPIC_API_KEY, ולכן אין בו יועץ.');
}

/** הדף סטטי, והמחברת מתחלפת אחרי שהדפדפן קורא את הכתובת. מחכים לזה לפני שכותבים. */
async function openHome(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test('without an Anthropic key the advisor row is hidden, and the route answers 503', async ({ page, request }) => {
  // הנתיב בודק את המפתח לפני כל דבר אחר. גם כשיש מפתח, רשימה ריקה נעצרת ב-400 ולא מגיעה למודל.
  const probe = await request.post('/api/advise', { data: { question: 'בדיקה', courseSlugs: [] } });
  test.skip(probe.status() !== 503, 'יש ANTHROPIC_API_KEY בסביבה של השרת, ולכן השורה אמורה להופיע.');
  expect(await probe.json()).toEqual({ error: 'not_configured' });

  await page.goto('/?cat=cooking&when=evening');
  await expect(page.locator('#results h3')).toHaveCount(3);
  // בנייה עם מפתח ושרת בלי מפתח (בדיקה מקומית עם מפתח מזויף): הדף כבר נבנה עם היועץ.
  test.skip((await page.getByText(NOTE).count()) > 0, 'הדף נבנה עם ANTHROPIC_API_KEY, והשרת רץ בלעדיו.');
  await expect(page.getByRole('heading', { name: 'לשאול על הקורסים האלה' })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'מה לשאול?' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'לשאול את היועץ על הקורסים האלה' })).toHaveCount(0);
});

test('a question in the first line is answered once, above the results', async ({ page }) => {
  const calls = await mockAdvise(page);
  await openHome(page);
  await skipWithoutAdvisor(page);
  await expect(page.getByText(NOTE)).toBeVisible();

  const what = page.getByRole('textbox', { name: 'מה ללמוד' });
  await what.fill(QUESTION);
  await what.press('Enter');

  const first = page.locator('#first-answer');
  await expect(first.getByRole('heading', { level: 2 })).toHaveText(`שאלתם: ${QUESTION}`);
  await expect(first.locator('mark[data-source="verified"]')).toContainText('נמשך שמונה מפגשים');
  await expect(first.getByRole('status')).toHaveText('התשובה על 3 הקורסים ברשימה למטה.');
  expect(calls).toEqual([{ question: QUESTION, courseSlugs: COOKING_EVENING }]);

  // התשובה מעל הרשימה, והטופס לשאלת המשך נשאר אחריה. יש רק טופס אחד.
  const firstTop = (await first.boundingBox())!.y;
  const resultsTop = (await page.locator('#results').boundingBox())!.y;
  expect(firstTop).toBeLessThan(resultsTop);
  await expect(page.locator('#ask')).toHaveCount(1);
  await expect(page.getByRole('textbox', { name: 'מה לשאול?' })).toHaveCount(1);
  await expect(page.locator('#ask').getByRole('status')).toHaveText('נשארו 9 שאלות היום');

  // אותה שאלה שוב: לא נשלחת פעם שנייה.
  await what.focus();
  await what.press('Enter');
  await page.waitForTimeout(500);
  expect(calls).toHaveLength(1);
});

test('a topic gets a link at the top of the results that moves focus to the advisor', async ({ page }) => {
  const calls = await mockAdvise(page);
  await openHome(page);
  await skipWithoutAdvisor(page);

  const what = page.getByRole('textbox', { name: 'מה ללמוד' });
  await what.fill('עוגות');
  await what.press('Enter');
  await expect(page.locator('#results h3').first()).toBeVisible();
  await expect(page.locator('#first-answer')).toHaveCount(0);

  await page.getByRole('link', { name: 'לשאול את היועץ על הקורסים האלה' }).click();
  await expect(page.getByRole('textbox', { name: 'מה לשאול?' })).toBeFocused();
  expect(calls).toHaveLength(0);
});

test('a question that arrives in a shared link is not asked by itself', async ({ page }) => {
  const calls = await mockAdvise(page);
  await page.goto(`/?q=${encodeURIComponent(QUESTION)}&cat=cooking&when=evening`);
  await skipWithoutAdvisor(page);
  await expect(page.locator('#results h3')).toHaveCount(3);
  await expect(page.getByRole('textbox', { name: 'מה ללמוד' })).toHaveValue(QUESTION);

  // גם יציאה מהשורה בלי לשנות אותה לא שולחת את השאלה: היא לא נכתבה כאן.
  const what = page.getByRole('textbox', { name: 'מה ללמוד' });
  await what.focus();
  await what.blur();
  await page.waitForTimeout(1_000);
  await expect(page.locator('#first-answer')).toHaveCount(0);
  expect(calls).toHaveLength(0);
  await expect(page.getByRole('link', { name: 'לשאול את היועץ על הקורסים האלה' })).toBeVisible();
});

test('when the questions for today are used up, the answer above the results says so', async ({ page }) => {
  await mockAdvise(page, true);
  await openHome(page);
  await skipWithoutAdvisor(page);

  const what = page.getByRole('textbox', { name: 'מה ללמוד' });
  await what.fill(QUESTION);
  await what.press('Enter');
  await expect(page.locator('#first-answer').getByRole('status')).toHaveText('נגמרו השאלות להיום. אפשר לשאול שוב מחר.');
  await expect(page.locator('#ask').getByRole('status')).toHaveText('נגמרו השאלות להיום');
  await expect(page.locator('#ask').getByRole('button', { name: 'לשאול' })).toBeDisabled();
});
