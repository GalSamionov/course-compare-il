import { expect, test } from '@playwright/test';

test('the institution page lists its courses, each with its own score, and no score for the institution', async ({ page }) => {
  // מהחותמת בעמוד הקורס.
  await page.goto('/courses/full-stack-sample');
  await page.getByRole('link', { name: 'מכללה לדוגמה' }).click();
  await expect(page).toHaveURL(/\/institutions\/sample-college$/);

  await expect(page.getByRole('heading', { level: 1, name: 'מכללה לדוגמה' })).toBeVisible();
  await expect(page.getByRole('link', { name: /לאתר המוסד/ })).toHaveAttribute('href', 'https://example.com');
  await expect(page.getByText('אין כאן ציון למוסד. לכל קורס יש ציון משלו, רק מהבוגרים שלו.')).toBeVisible();

  // קודם הקורס עם ציון, אחריו מי שקרוב יותר לציון (3 ביקורות), ואז קורס בלי ביקורות.
  await expect(page.locator('#courses h3')).toHaveText(['פיתוח Full Stack', 'כלי AI לעבודה יומיומית', 'סדנת AI לעסקים קטנים']);
  const fullStack = page.locator('#courses article').first();
  await expect(fullStack.getByText('23 בוגרים מאומתים')).toBeVisible();
  await expect(fullStack.locator('mark[data-source="verified"]')).toContainText('בין 12,000 ל-16,000 ₪');
  await expect(fullStack.locator('[data-source="claim"]')).toContainText('ליווי השמה במשך 6 חודשים');
});

test('an unknown institution returns 404', async ({ page }) => {
  const response = await page.goto('/institutions/no-such-institution');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'המוסד לא נמצא' })).toBeVisible();
});
