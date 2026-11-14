import { expect, test } from '@playwright/test';

// דפדפן נקי: מבקר שנכנס בפעם הראשונה.
test.use({ storageState: { cookies: [], origins: [] } });

test('היכרות למבקר ראשון: מופיעה פעם אחת, עוברת בין הצעדים, נסגרת ונפתחת שוב מהכותרת התחתונה', async ({ page }) => {
  await page.goto('/courses/full-stack-sample');
  const card = page.getByRole('dialog', { name: 'פעם ראשונה בלמדתי?' });
  await expect(card).toBeVisible();
  await expect(card.getByText('ביקורות רק ממי שלמד')).toBeVisible();

  await card.getByRole('button', { name: 'הבא' }).click();
  await expect(card.getByText('הצבע אומר מאיפה המידע')).toBeVisible();
  await expect(card.getByRole('button', { name: 'צעד 2 מתוך 3' })).toHaveAttribute('aria-current', 'step');

  await card.getByRole('button', { name: 'הבא' }).click();
  await expect(card.getByRole('button', { name: 'לשאול עכשיו' })).toBeVisible();

  await card.getByRole('button', { name: 'לסגור את ההיכרות' }).click();
  await expect(card).toBeHidden();

  // בטעינה הבאה היא לא חוזרת לבד.
  await page.reload();
  await page.waitForTimeout(1500);
  await expect(card).toBeHidden();

  // "איך משתמשים בלמדתי" פותח אותה שוב, ו-Esc סוגר.
  await page.getByRole('button', { name: 'איך משתמשים בלמדתי' }).click();
  await expect(card).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
});

test('היכרות למבקר ראשון: לא נפתחת לבד בעמוד ההתחברות', async ({ page }) => {
  await page.goto('/login');
  await page.waitForTimeout(1500);
  await expect(page.getByRole('dialog', { name: 'פעם ראשונה בלמדתי?' })).toBeHidden();
});
