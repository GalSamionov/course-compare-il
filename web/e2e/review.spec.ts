import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';
import { ensureLocalAdmin } from '../src/lib/admin/local-admin';
import type { Database } from '../src/lib/database.types';
import { recomputeAllScores } from '../src/lib/score/recompute';
import { localEnv } from './support/env';
import { signIn } from './support/mail';

/**
 * קורס בלי ביקורות, שאף בדיקה אחרת לא קוראת: הבדיקות רצות במקביל, ובישול (שבתוכנית) נבדק בקטלוג ובדף הבית,
 * עם "חסרות עוד 5 ביקורות". אחרי האישור, החלק "ביקורות" מופיע בעמוד של הקורס הזה.
 */
const SLUG = 'bookkeeping-2-sample';
const COURSE_TITLE = 'הנהלת חשבונות סוג 2';
const ADMIN_EMAIL = 'admin-e2e@example.test';
/** PDF קטן: מספיק כדי שהשרת יזהה PDF לפי הבתים הראשונים. */
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

/**
 * SHOTS=mobile או SHOTS=desktop: צילום של כל מסך, לסקירת הסיום של Impeccable (משימה 13).
 * הצילומים ב-.impeccable/review/round3/, שלא נשמר ב-git. בלי המשתנה, ובכל CI, אין צילומים.
 */
const SHOTS = process.env.SHOTS;
if (SHOTS === 'desktop') {
  test.use({ viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
}
async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow, `${name}: גלילה לרוחב`).toBe(false);
  await page.screenshot({ path: `../.impeccable/review/round3/${SHOTS}/${name}.png`, fullPage: true });
}

type Db = SupabaseClient<Database>;

async function userIdByEmail(db: Db, email: string): Promise<string | null> {
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

/** כל הקבצים של המשתמש באחסון: תיקייה לכל ביקורת, וקבצים בתוכה. */
async function removeUserFiles(db: Db, userId: string): Promise<void> {
  const proofs = db.storage.from('proofs');
  const { data: folders } = await proofs.list(userId);
  for (const folder of folders ?? []) {
    const { data: files } = await proofs.list(`${userId}/${folder.name}`);
    const paths = (files ?? []).map((f) => `${userId}/${folder.name}/${f.name}`);
    if (paths.length > 0) await proofs.remove(paths);
  }
}

test('a graduate writes a review with a proof, the admin approves it, it is on the course page, and the file is gone', async ({ page }) => {
  test.setTimeout(240_000);
  const db = createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });
  const adminId = await ensureLocalAdmin(db, ADMIN_EMAIL);
  const writerEmail = `writer-${Date.now()}@example.test`;
  const body = `בדיקת קצה ${Date.now()}: תרגלנו פקודות יומן, מאזן בוחן ודוחות. כל שיעור נגמר בתרגיל, והמרצה עבר על הפתרונות.`;

  try {
    // לא מחובר: ההקדמה, והתחברות שחוזרת לכאן.
    await page.goto(`/courses/${SLUG}/review`);
    await shot(page, '01-intro');
    await page.getByRole('link', { name: 'להתחבר ולהתחיל' }).click();
    await expect(page).toHaveURL(new RegExp(`/login\\?next=%2Fcourses%2F${SLUG}%2Freview$`));
    await signIn(page, writerEmail);
    await expect(page).toHaveURL(new RegExp(`/courses/${SLUG}/review$`));

    // משתמש רגיל לא מגיע לתור: 404 אמיתי, מה-proxy.
    expect((await page.request.get('/admin')).status()).toBe(404);

    await page.getByRole('button', { name: 'להתחיל' }).click();
    // בלי חודש: ההודעה מתחת לשדה של חודש ההתחלה, והפוקוס עובר אליו.
    await page.getByRole('button', { name: 'הבא' }).click();
    const start = page.getByLabel('חודש ההתחלה');
    await expect(start).toBeFocused();
    await expect(start).toHaveAttribute('aria-invalid', 'true');
    await expect(start).toHaveAccessibleDescription('בחרו את חודש ההתחלה.');
    await start.selectOption('2026-03-01');
    await shot(page, '02-when');
    await page.getByRole('button', { name: 'הבא' }).click();

    // השאלון מופיע רק אחרי שהצעד נשמר. התשובה הכי גבוהה בכל שאלה, וגם "כן" נשמר כ-5.
    const questions = page.locator('[data-question]');
    await expect(questions.first()).toBeVisible();
    // כל שאלה היא קבוצת רדיו: מימין לשמאל, חץ שמאלה בוחר את התשובה הבאה.
    const first = questions.first().getByRole('radiogroup');
    await first.getByRole('radio').first().focus();
    await page.keyboard.press('ArrowLeft');
    await expect(first.getByRole('radio').nth(1)).toBeFocused();
    await expect(first.getByRole('radio').nth(1)).toHaveAttribute('aria-checked', 'true');
    for (const question of await questions.all()) {
      await question.locator('[data-value="5"]').click();
    }
    await shot(page, '03-questions');
    await page.getByRole('button', { name: 'הבא' }).click();

    await page.getByRole('textbox', { name: 'במילים שלך' }).fill(body);
    await shot(page, '04-words');
    await page.getByRole('button', { name: 'הבא' }).click();

    await page.getByLabel('השם שלכם').fill('בודקת קצה');
    await page.getByRole('radio', { name: 'בוגרת', exact: true }).click();
    await expect(page.getByRole('radio', { name: 'בוגרת', exact: true })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('בודקת ק., בוגרת מאומתת')).toBeVisible();
    await shot(page, '05-name');
    await page.getByRole('button', { name: 'הבא' }).click();

    // בלי קובץ: ההודעה מתחת לבחירת הקובץ, ו"חזרה" ליד הכפתור.
    await page.getByRole('button', { name: 'לשלוח לבדיקה' }).click();
    await expect(page.getByText('צריך לצרף קובץ אחד לפחות.')).toBeVisible();
    await expect(page.locator('input[type=file]')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('button', { name: 'חזרה' })).toBeVisible();
    await page.getByLabel('סוג ההוכחה', { exact: true }).selectOption('invoice');
    await page.locator('input[type=file]').setInputFiles({ name: 'invoice.pdf', mimeType: 'application/pdf', buffer: PDF });
    await expect(page.getByRole('list', { name: 'הקבצים שהוצמדו' })).toContainText('invoice.pdf');
    await shot(page, '06-proof');
    await page.getByRole('button', { name: 'לשלוח לבדיקה' }).click();
    await expect(page.getByRole('heading', { name: 'קיבלנו' })).toBeVisible({ timeout: 30_000 });
    await shot(page, '07-sent');

    // במסד: ממתינה, והקובץ באחסון, בתיקייה של הכותב ושל הביקורת.
    const { data: review } = await db.from('reviews').select('id, author_id, status').eq('body', body).single();
    expect(review?.status).toBe('pending');
    const reviewId = review!.id;
    const folder = `${review!.author_id}/${reviewId}`;
    expect((await db.storage.from('proofs').list(folder)).data).toHaveLength(1);
    const { data: pendingProof } = await db.from('proofs').select('storage_path').eq('review_id', reviewId).single();
    const storagePath = pendingProof!.storage_path!;
    expect(storagePath.startsWith(`${folder}/`)).toBe(true);

    await page.goto('/me');
    await expect(page.locator('#reviews li').filter({ hasText: COURSE_TITLE })).toContainText('ממתינה לבדיקה');
    await shot(page, '08-me');

    // גל: הכותב מתנתק (העוגיות נשמרות למחיקה בסוף), ונכנסים כמנהל.
    const writerCookies = await page.context().cookies();
    await page.context().clearCookies();
    await page.goto('/login?next=%2Fadmin');
    await signIn(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);
    const item = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { level: 3, name: COURSE_TITLE }) })
      .filter({ hasText: body });
    await expect(item).toBeVisible();
    await expect(item.getByRole('link', { name: /^לפתוח את ההוכחה/ })).toBeVisible();
    await expect(item.getByLabel('סוג ההוכחה שאושר')).toHaveValue('invoice');
    await shot(page, '09-admin');
    // השדה ריק תמיד: גל מקליד את הסכום מהמסמך.
    await expect(item.getByLabel('סכום ששולם, בשקלים')).toHaveValue('');
    await item.getByLabel('סכום ששולם, בשקלים').fill('1800');
    await expect(item.getByText('יישמר כ: \u200E1,500–2,000 ₪')).toBeVisible();
    await item.getByRole('button', { name: 'לאשר ולפרסם' }).click();
    await expect(page.getByRole('list', { name: 'מה הוחלט עכשיו' })).toContainText('פורסם.', { timeout: 30_000 });
    await expect(item).toHaveCount(0);

    // הקובץ נמחק, ונשארו רק הטביעה, הסוג וההחלטה. הסכום במדרגה של 500, למטה.
    expect((await db.storage.from('proofs').list(folder)).data).toHaveLength(0);
    expect((await db.storage.from('proofs').download(storagePath)).error).not.toBeNull();
    const { data: proofs } = await db.from('proofs').select('storage_path, status, check_result').eq('review_id', reviewId);
    expect(proofs).toEqual([{ storage_path: null, status: 'approved', check_result: null }]);
    const { data: published } = await db
      .from('reviews')
      .select('status, proof_kind, paid_bucket_ils, author_title')
      .eq('id', reviewId)
      .single();
    expect(published).toEqual({ status: 'published', proof_kind: 'invoice', paid_bucket_ils: 1500, author_title: 'graduate_f' });

    // בעמוד הקורס, מיד.
    await page.goto(`/courses/${SLUG}`);
    const reviews = page.locator('#reviews');
    await expect(reviews.getByText(body)).toBeVisible();
    await expect(reviews.getByText('בוגרת מאומתת')).toBeVisible();
    await expect(reviews.getByText('בודקת ק.')).toBeVisible();
    await expect(reviews.getByRole('button', { name: /^עזר לי/ })).toHaveAttribute('aria-pressed', 'false');
    await shot(page, '10-course');

    // הכותב מוחק את הביקורת, בנתיב של "הביקורות שלי": היא יורדת מעמוד הקורס, והציונים חוזרים למה שהיו.
    await page.context().clearCookies();
    await page.context().addCookies(writerCookies);
    const deleted = await page.request.post('/api/reviews/delete', {
      data: { reviewId },
      headers: { Origin: new URL(page.url()).origin },
    });
    expect(deleted.status()).toBe(200);
    await page.goto(`/courses/${SLUG}`);
    await expect(page.getByText(body)).toHaveCount(0);
  } finally {
    // ניקוי, גם אחרי כישלון: מה שנשאר מהכותב (ביקורת, קבצים, טביעות), ושני המשתמשים.
    const writerId = await userIdByEmail(db, writerEmail);
    if (writerId) {
      const { data: left } = await db.from('reviews').select('id').eq('author_id', writerId);
      for (const { id } of left ?? []) {
        await db.rpc('delete_review', { p_review_id: id, p_action: 'author_delete', p_actor_id: writerId });
      }
      if ((left ?? []).length > 0) await recomputeAllScores(db, new Date());
      await removeUserFiles(db, writerId);
      await db.from('proofs').delete().eq('author_id', writerId);
      await db.from('proof_check_usage').delete().eq('author_id', writerId);
      await db.auth.admin.deleteUser(writerId);
    }
    await db.auth.admin.deleteUser(adminId);
  }
});
