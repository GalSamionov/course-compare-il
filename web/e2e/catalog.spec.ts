import { expect, test } from '@playwright/test';

test('a category page lists its courses, scored first', async ({ page }) => {
  await page.goto('/categories/cooking');
  await expect(page.getByRole('heading', { level: 1, name: 'בישול' })).toBeVisible();
  await expect(page.locator('#results h3')).toHaveText([
    'אפייה ביתית: לחמים ועוגות',
    'בישול איטלקי',
    'בישול ביתי למתחילים',
  ]);
  await expect(page.getByText('חסרות עוד 5 ביקורות.')).toBeVisible();
});

test('an unknown category returns 404', async ({ page }) => {
  const response = await page.goto('/categories/no-such-category');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'התחום לא נמצא' })).toBeVisible();
});
