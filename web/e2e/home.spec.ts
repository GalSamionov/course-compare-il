import { expect, test } from '@playwright/test';

test('the home page filters by the answers in the URL, full matches first', async ({ page }) => {
  await page.goto('/?cat=cooking&when=evening');
  const titles = page.locator('#results h3');
  await expect(page.getByRole('button', { name: 'לראות 3 קורסים' })).toBeVisible();
  // האפייה מקבלת את הציון הגבוה, אבל היא רק בסופ״ש, ולכן היא אחרונה ומוסברת בשוליים.
  await expect(titles).toHaveText(['בישול איטלקי', 'בישול ביתי למתחילים', 'אפייה ביתית: לחמים ועוגות']);
  await expect(page.locator('#results article').last()).toContainText('רק בסופ״ש');

  // הורדת הווי משורה 3: השורה לא מסננת, והאפייה עולה לראש.
  await page.getByRole('checkbox', { name: 'שורה 3 מסננת את התוצאות' }).click();
  await expect(titles).toHaveText(['אפייה ביתית: לחמים ועוגות', 'בישול איטלקי', 'בישול ביתי למתחילים']);
  await expect(page).toHaveURL(/off=whenhow/);
});
