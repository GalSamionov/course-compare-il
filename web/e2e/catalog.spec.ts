import { expect, test } from '@playwright/test';

test('a category page lists its courses, with the facts for a course that has no review', async ({ page }) => {
  await page.goto('/categories/cooking');
  await expect(page.getByRole('heading', { level: 1, name: 'בישול' })).toBeVisible();
  // לשלושתם 5 עובדות ידועות, ולכן הציון קובע: האפייה, האיטלקי, ובסוף הקורס בלי ציון.
  await expect(page.locator('#results h3')).toHaveText([
    'אפייה ביתית: לחמים ועוגות',
    'בישול איטלקי',
    'בישול ביתי למתחילים',
  ]);
  await expect(page.locator('#results')).toContainText('קודם קורסים שהמוסד מפרסם בהם יותר פרטים');
  // בלי ביקורות: שורת עובדות במקום "עוד אין ציון בוגרים".
  const homeCooking = page.locator('#results article').filter({ hasText: 'בישול ביתי למתחילים' });
  await expect(homeCooking).toContainText('1,800 ₪');
  await expect(homeCooking).toContainText('חיפה');
  await expect(homeCooking).not.toContainText('עוד אין ציון');
  // סבב 4: המובילים לפי בוגרים, רק קורסים עם ציון, מהגבוה לנמוך. בישול ביתי למתחילים (בלי ציון) לא שם.
  await expect(page.locator('section[aria-labelledby="top-title"] li a')).toHaveText(['אפייה ביתית: לחמים ועוגות', 'בישול איטלקי']);
});

test('an unknown category returns 404', async ({ page }) => {
  const response = await page.goto('/categories/no-such-category');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'התחום לא נמצא' })).toBeVisible();
});
