import { expect, type Page } from '@playwright/test';

/** Mailpit של Supabase המקומי: כל מייל שנשלח נתפס שם (pnpm db:status, MAILPIT_URL). */
export const MAILPIT = 'http://127.0.0.1:54324';

const query = (email: string) => encodeURIComponent(`to:"${email}"`);

/** הקישור מהמייל האחרון שנשלח לכתובת, או '' אם עוד לא הגיע. */
export async function magicLink(email: string): Promise<string> {
  const search = await fetch(`${MAILPIT}/api/v1/search?query=${query(email)}`);
  const { messages } = (await search.json()) as { messages: { ID: string }[] };
  if (messages.length === 0) return '';
  const message = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
  return message.Text.match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^\s)]+/)?.[0] ?? '';
}

/** מיילים ישנים לכתובת נמחקים, כדי שקישור מריצה קודמת לא ייקלט במקום החדש. */
export async function clearMail(email: string): Promise<void> {
  await fetch(`${MAILPIT}/api/v1/search?query=${query(email)}`, { method: 'DELETE' });
}

/** בעמוד ההתחברות: שולח קישור, מחכה לו ב-Mailpit, ופותח אותו. */
export async function signIn(page: Page, email: string): Promise<void> {
  await clearMail(email);
  await page.getByLabel('לאן לשלוח?').fill(email);
  // ב-CI, עם שני workers, השליחה נכשלה פעמיים בלי סיבה שנראתה בלוג (PR 2). עד שלושה ניסיונות, ובכישלון
  // האחרון ההודעה מהטופס נכנסת לשגיאה, כדי שיהיה ברור מה Supabase החזיר.
  const sent = page.getByRole('heading', { level: 1, name: 'עכשיו לתיבת המייל' });
  for (let attempt = 1; ; attempt++) {
    await page.getByRole('button', { name: 'לשלוח לי קישור' }).click();
    try {
      await expect(sent).toBeVisible({ timeout: 5_000 });
      break;
    } catch (error) {
      const alert = (await page.getByRole('alert').allInnerTexts()).join(' | ');
      if (attempt >= 3) throw new Error(`sign-in link not sent after ${attempt} attempts: ${alert || 'no alert on the page'}`, { cause: error });
      await page.waitForTimeout(3_000 * attempt);
    }
  }
  let link = '';
  await expect.poll(async () => (link = await magicLink(email)), { timeout: 15_000 }).not.toBe('');
  await page.goto(link);
}
