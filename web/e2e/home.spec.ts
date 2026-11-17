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

test('the home page opens with one box, and "for the team" adds a list request under the results', async ({ page }) => {
  await page.goto('/?cat=cooking');
  await expect(page.getByRole('heading', { level: 1, name: 'לא יודעים למי לפנות? כתבו מה אתם צריכים.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'מה ללמוד' })).toBeVisible();
  await expect(page.getByText('או בחרו בעצמכם')).toBeVisible();

  const forMe = page.getByRole('button', { name: 'בשבילי', exact: true });
  await expect(forMe).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: 'רוצים שנכין לכם רשימה?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'בשביל העובדים', exact: true }).click();
  await expect(page.getByRole('link', { name: 'רוצים שנכין לכם רשימה?' })).toHaveAttribute('href', '/companies#request');

  // "מה רואים כאן" במקום "איך האימות עובד", עם הדלת לבדיקת מודעה.
  await expect(page.getByRole('heading', { level: 2, name: 'מה רואים כאן' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'קיבלתם הצעה או ראיתם מודעה? הדביקו את הקישור' })).toHaveAttribute(
    'href',
    '/request-course',
  );
  await expect(page.getByRole('heading', { name: 'איך האימות עובד' })).toHaveCount(0);
});
