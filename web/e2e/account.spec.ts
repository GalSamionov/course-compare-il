import { expect, test } from '@playwright/test';

/** Mailpit של Supabase המקומי: כל מייל שנשלח נתפס שם (pnpm db:status, MAILPIT_URL). */
const MAILPIT = 'http://127.0.0.1:54324';

/** הקישור מהמייל האחרון שנשלח לכתובת, או '' אם עוד לא הגיע. */
async function magicLink(email: string): Promise<string> {
  const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
  const { messages } = (await search.json()) as { messages: { ID: string }[] };
  if (messages.length === 0) return '';
  const message = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
  return message.Text.match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^\s)]+/)?.[0] ?? '';
}

test('the personal area sends a signed-out visitor to log in', async ({ page }) => {
  await page.goto('/me');
  await expect(page).toHaveURL(/\/login\?next=%2Fme$/);
  await expect(page.getByRole('heading', { level: 1, name: 'להתחבר בלי סיסמה' })).toBeVisible();
});

test('a visitor logs in with the email link, and the course they saved is in the personal area', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  // לא מחובר: "לשמור" שולח להתחברות, וזוכר את הקורס.
  await page.goto('/courses/baking-sample');
  await page.getByRole('checkbox', { name: /^לשמור/ }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcourses%2Fbaking-sample$/);

  await page.getByLabel('לאן לשלוח?').fill(email);
  await page.getByRole('button', { name: 'לשלוח לי קישור' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'עכשיו לתיבת המייל' })).toBeVisible();

  let link = '';
  await expect.poll(async () => (link = await magicLink(email)), { timeout: 15_000 }).not.toBe('');
  await page.goto(link);

  // חזרה לאותו עמוד, מחובר, והקורס כבר שמור.
  await expect(page).toHaveURL(/\/courses\/baking-sample$/);
  await expect(page.getByRole('checkbox', { name: /^לשמור/ })).toBeChecked();

  await page.getByRole('link', { name: 'האזור שלי' }).click();
  await expect(page.locator('#saved h3')).toHaveText(['אפייה ביתית: לחמים ועוגות']);
  await expect(page.getByText(email)).toBeVisible();

  // ניקוי: מחיקת החשבון, דרך שלב האישור.
  await page.getByRole('button', { name: 'למחוק את החשבון' }).click();
  await page.getByRole('button', { name: 'כן, למחוק הכול' }).click();
  await expect(page.getByText('החשבון נמחק.')).toBeVisible();
});
