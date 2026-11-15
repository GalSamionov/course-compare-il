import { expect, test } from '@playwright/test';

/**
 * מדריכי "לפני שמשלמים": מהרשימה אל מדריך, עובדה ירוקה עם תווית לקורא מסך, והכרטיס של המקור שלה.
 * הכרטיס הוא popover של הדפדפן: נפתח בהקשה על המספר, ונסגר ב-Esc.
 */
test('מהרשימה אל מדריך, ומעובדה ירוקה אל המקור שלה', async ({ page }) => {
  await page.goto('/guides');
  const guides = page.locator('main ol > li');
  await expect(guides).toHaveCount(4);

  await page.getByRole('link', { name: 'מה לשאול את המוסד לפני שנרשמים' }).click();
  await expect(page).toHaveURL(/\/guides\/questions-before-signing-up$/);
  await expect(page.getByRole('heading', { level: 1, name: 'מה לשאול את המוסד לפני שנרשמים' })).toBeVisible();

  await expect(page.locator('mark.hl-verified').first()).toContainText('נבדק מול מסמך:');
  await expect(page.locator('[data-source="claim"]').first()).toContainText('המוסד אומר, לא נבדק:');

  await page.getByRole('button', { name: 'מקור 1: חוק הגנת הצרכן, סעיף 17ד' }).first().click();
  const card = page.locator('#source-ref-1');
  await expect(card).toBeVisible();
  await expect(card).toContainText('סעיף 17ד');
  await expect(card.getByRole('link', { name: /לפתוח את המקור/ })).toHaveAttribute('href', /^https:\/\/he\.wikisource\.org\//);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();

  await expect(page.locator('#sources ol > li')).toHaveCount(7);

  // תמונת השיתוף: תמונה אמיתית, מהכתובת שבתגית og:image.
  const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogUrl).toMatch(/\/guides\/questions-before-signing-up\/opengraph-image/);
  const og = await page.request.get(new URL(ogUrl!).pathname);
  expect(og.status()).toBe(200);
  expect(og.headers()['content-type']).toBe('image/png');
});
