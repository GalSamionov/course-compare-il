import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import type { Database, Json } from '../src/lib/database.types';
import { localEnv } from './support/env';

/**
 * בדיקת קישור עם AI (docs/superpowers/specs/2026-11-15-ad-check-design.md), בלי קריאה אמיתית למודל:
 * התוצאה נשמרת קודם במטמון (save_ad_check), והשרת מחזיר אותה בלי לקרוא את הדף. כך נבדקים פעולת השרת,
 * הבקשה שנשמרת לצד הבדיקה, והתצוגה. קישור לרשת חברתית לא נקרא בכלל.
 * העמוד מציג את הבדיקה רק כשהבנייה הייתה עם ANTHROPIC_API_KEY (גם מפתח דמה מספיק כאן). בלעדיו הבדיקה מדלגת.
 */
type Db = SupabaseClient<Database>;
const database = (): Db =>
  createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });

test('a pasted ad link shows what the page promises, the flags with quotes, and that the link was added', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/request-course');
  const form = page.getByRole('form', { name: 'בקשה לבדוק קורס' });
  test.skip(
    (await form.getByRole('button', { name: 'בדקו את הדף' }).count()) === 0,
    'הדף נבנה בלי ANTHROPIC_API_KEY, ולכן אין בו בדיקת קישור.',
  );

  const db = database();
  const stamp = Date.now();
  const url = `https://ad-check-e2e-${stamp}.example/course`;
  const social = `https://www.facebook.com/e2e${stamp}/posts/1`;
  // דף מומצא: ציטוטים לדוגמה בלבד.
  const result = {
    claims: { price: 'היום רק 990 ₪ במקום 2,990 ₪', duration: '', certificate: '', format: '6 מפגשים בזום' },
    flags: [
      { flag: 'anchor_discount', quotes: ['היום רק 990 ₪ במקום 2,990 ₪'] },
      { flag: 'urgency', quotes: ['נשארו 3 מקומות אחרונים'] },
    ],
  };
  const { error } = await db.rpc('save_ad_check', { p_url: url, p_result: result as unknown as Json });
  expect(error).toBeNull();

  try {
    // פרמטרי המעקב יורדים, ולכן זה אותו קישור כמו במטמון.
    await form.getByLabel('הקישור').fill(`${url}?utm_source=fb&fbclid=abc`);
    await form.getByRole('button', { name: 'בדקו את הדף' }).click();
    const heading = page.getByRole('heading', { level: 1, name: 'מה כתוב בדף' });
    await expect(heading).toBeVisible({ timeout: 30_000 });
    await expect(heading).toBeFocused();

    await expect(page.getByRole('heading', { level: 2, name: 'מה הדף מבטיח' })).toBeVisible();
    await expect(page.getByText('6 מפגשים בזום')).toBeVisible();
    await expect(page.getByText('לא כתוב בדף')).toHaveCount(2);

    await expect(page.getByText('הנחה גדולה ממחיר "רגיל"')).toBeVisible();
    await expect(page.getByText('״נשארו 3 מקומות אחרונים״')).toBeVisible();
    const guideLinks = page.getByRole('link', { name: 'מה לשאול, בפרק במדריך' });
    await expect(guideLinks).toHaveCount(2);
    await expect(guideLinks.nth(0)).toHaveAttribute('href', '/guides/red-flags-in-course-ads#part-3');
    await expect(guideLinks.nth(1)).toHaveAttribute('href', '/guides/red-flags-in-course-ads#part-6');

    await expect(page.getByText('הקורס עוד לא באתר. הוספנו אותו לרשימה שלנו.')).toBeVisible();
    await expect(page.getByText(/בדיקה אוטומטית של מה שכתוב בדף, ב-\d{1,2}\.\d{1,2}\.\d{4}\. היא לא פסק דין על הקורס\./)).toBeVisible();

    // הבדיקה שלחה גם בקשה רגילה, בלי פרמטרי המעקב.
    const { data: rows } = await db.from('course_submissions').select('source, status').eq('url', url);
    expect(rows).toEqual([{ source: 'request', status: 'pending' }]);

    // קישור לפוסט: לא נקרא, ומקבלים הסבר איך מגיעים לדף הנחיתה.
    await page.getByRole('button', { name: 'לבדוק קישור נוסף' }).click();
    await form.getByLabel('הקישור').fill(social);
    await form.getByRole('button', { name: 'בדקו את הדף' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'את הקישור הזה אנחנו לא קוראים' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/^זה קישור לפוסט או לדף ברשת חברתית\. פתחו את המודעה/)).toBeVisible();
  } finally {
    await db.from('course_submissions').delete().in('url', [url, social]);
  }
});
