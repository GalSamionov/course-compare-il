import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';
import { ensureLocalAdmin } from '../src/lib/admin/local-admin';
import type { Database } from '../src/lib/database.types';
import { localEnv } from './support/env';
import { signIn } from './support/mail';

/**
 * קורס מקישור (20261116010001_course_links.sql), בשני המסלולים:
 * 1. בוגר ב-/review לא מוצא את הקורס, מתחבר, מדביק קישור, ומתחיל לכתוב על קורס הטיוטה. גל מאשר אותו עם תחום,
 *    והקורס באתר, והקישור אצל האוסף.
 * 2. מבקר בלי חשבון שולח קישור לאינסטגרם ב-/request-course. גל דוחה אותו עם סיבה.
 * SHOTS=1: צילומים ב-375 וב-1280 ל-.impeccable/review/add-course-link/ (לא ב-git). בלי המשתנה אין צילומים.
 */
const ADMIN_EMAIL = 'admin-course-link-e2e@example.test';
const SHOTS = process.env.SHOTS === '1';

type Db = SupabaseClient<Database>;
const database = (): Db =>
  createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });

/** צילום של המסך בשני הרוחבים, ובדיקה שאין גלילה לרוחב. */
async function shots(page: Page, name: string) {
  if (!SHOTS) return;
  const original = page.viewportSize();
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `${name} ב-${width}: גלילה לרוחב`).toBe(false);
    await page.screenshot({ path: `../.impeccable/review/add-course-link/${name}-${width}.png`, fullPage: true });
  }
  if (original) await page.setViewportSize(original);
}

async function signInAsAdmin(page: Page) {
  await page.context().clearCookies();
  await page.goto('/login?next=%2Fadmin');
  await signIn(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin$/);
}

test('a graduate adds a missing course from a link and starts a review; the admin approves it with a category', async ({ page }) => {
  test.setTimeout(240_000);
  const db = database();
  const adminId = await ensureLocalAdmin(db, ADMIN_EMAIL);
  const stamp = Date.now();
  const writerEmail = `link-writer-${stamp}@example.test`;
  const title = `לק ג׳ל לבדיקה ${stamp}`;
  const teacher = `סטודיו בדיקה ${stamp}`;
  const url = `https://e2e-${stamp}.example/gel-course`;
  let writerId: string | null = null;
  let courseId: string | null = null;

  try {
    // לא מחובר: החיפוש לא מוצא, "הקורס לא ברשימה?" מבקש להתחבר, וההתחברות חוזרת לטופס פתוח.
    await page.goto('/review');
    await page.getByLabel('איזה קורס סיימתם?').fill(title);
    await expect(page.getByText('לא מצאנו קורס כזה.')).toBeVisible();
    await page.getByRole('button', { name: 'הדביקו קישור לדף הקורס' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'הקורס לא ברשימה?' })).toBeVisible();
    await page.getByRole('link', { name: 'להתחבר' }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Freview%23add-course$/);
    await signIn(page, writerEmail);
    await expect(page).toHaveURL(/\/review#add-course$/);

    const form = page.getByRole('form', { name: 'הקורס לא ברשימה?' });
    await expect(form).toBeVisible();
    // בלי כלום: הודעה בעברית ליד כל שדה.
    await form.getByRole('button', { name: 'להמשיך לכתוב עליו' }).click();
    await expect(form.getByText('הדביקו את הקישור לדף הקורס או למודעה.')).toBeVisible();
    await expect(form.getByText('בחרו תחום, או מה סוג הקורס.')).toBeVisible();

    await form.getByLabel('הקישור').fill(`${url}?utm_source=facebook&fbclid=abc`);
    await form.getByLabel('שם הקורס').fill(title);
    await form.getByLabel('מי מלמד').fill(teacher);
    await expect(form.getByLabel('תחום')).toHaveValue('');
    await form.getByRole('radio', { name: 'לתחביב או למיומנות' }).click();
    await shots(page, '01-review-add-form');
    await form.getByRole('button', { name: 'להמשיך לכתוב עליו' }).click();

    // קורס הטיוטה: רק הבוגר רואה אותו, ומשם מסלול הכתיבה הרגיל, עם השאלון של קורס לתחביב.
    await expect(page).toHaveURL(/\/review\/new\?course=[0-9a-f-]{36}$/, { timeout: 30_000 });
    courseId = new URL(page.url()).searchParams.get('course');
    await expect(page.getByRole('heading', { level: 1, name: `ביקורת על ${title}` })).toBeVisible();
    await expect(page.getByText('עוד לא באתר', { exact: true })).toBeVisible();
    await shots(page, '02-review-new-intro');
    await page.getByRole('button', { name: 'להתחיל' }).click();
    await page.getByLabel('חודש ההתחלה').selectOption({ index: 2 });
    await page.getByRole('button', { name: 'הבא' }).click();
    await expect(page.getByText('רכשתי את המיומנות')).toBeVisible();

    // במסד: טיוטה לא ציבורית, בלי תחום, עם הקישור בלי פרמטרי מעקב, ומרצה חדש בטיוטה.
    const { data: course } = await db
      .from('courses')
      .select('status, category_id, page_url, slug, institutions(name, kind, status)')
      .eq('id', courseId!)
      .single();
    expect(course).toMatchObject({
      status: 'draft',
      category_id: null,
      page_url: url,
      institutions: { name: teacher, kind: 'independent', status: 'draft' },
    });
    const { data: submission } = await db.from('course_submissions').select('submitted_by, url, status').eq('course_id', courseId!).single();
    writerId = submission!.submitted_by;
    expect(submission).toMatchObject({ url, status: 'pending' });
    expect((await db.from('reviews').select('status').eq('course_id', courseId!).single()).data?.status).toBe('draft');
    // ובלי התחברות, העמוד של הקורס לא קיים.
    expect((await page.request.get(`/courses/${course!.slug}`)).status()).toBe(404);

    // גל: הפריט בתור, עם הקישור, המרצה החדש והטיוטה של הבוגר. מאשר עם תחום.
    await signInAsAdmin(page);
    const item = page.getByRole('article').filter({ has: page.getByRole('heading', { level: 3, name: title }) });
    await expect(item).toHaveCount(1);
    await expect(item).toContainText('קורס חדש מבוגר');
    await expect(item).toContainText(`${teacher} · חדש`);
    await expect(item).toContainText('טיוטה אחת שעוד לא נשלחה');
    await expect(item.getByRole('button', { name: 'לאשר ולפרסם' })).toBeDisabled();
    await item.getByLabel('תחום (חובה)').selectOption({ label: 'בישול' });
    await item.scrollIntoViewIfNeeded();
    await shots(page, '03-admin-link-item');
    await item.getByRole('button', { name: 'לאשר ולפרסם' }).click();
    await expect(page.getByRole('list', { name: 'מה הוחלט עכשיו' })).toContainText('הקורס פורסם', { timeout: 30_000 });
    await expect(item).toHaveCount(0);

    // במסד: הקורס והמרצה באתר, הקישור אצל האוסף כמו בקשה של מוסד, ושורה ב-audit_log.
    const { data: live } = await db
      .from('courses')
      .select('status, slug, categories(slug), institutions(status)')
      .eq('id', courseId!)
      .single();
    expect(live).toMatchObject({ status: 'active', categories: { slug: 'cooking' }, institutions: { status: 'active' } });
    const { data: pageRow } = await db.from('scrape_pages').select('source, state, course_id').eq('url', url).single();
    expect(pageRow).toEqual({ source: 'request', state: 'active', course_id: courseId });
    const { data: approved } = await db.from('course_submissions').select('id, status').eq('course_id', courseId!).single();
    expect(approved?.status).toBe('approved');
    const { data: audit } = await db.from('audit_log').select('action, actor_id').eq('course_submission_id', approved!.id);
    expect(audit).toEqual([{ action: 'course_link_approve', actor_id: adminId }]);
    // עמוד הקורס קיים עכשיו.
    await page.goto(`/courses/${live!.slug}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  } finally {
    // המסד בפיי משותף: הקורס חוזר לטיוטה (יומן השינויים לא נמחק, ולכן גם הקורס לא), והשאר נמחק.
    if (courseId) {
      await db.from('courses').update({ status: 'draft' }).eq('id', courseId);
      const { data: c } = await db.from('courses').select('institution_id').eq('id', courseId).single();
      if (c) await db.from('institutions').update({ status: 'draft' }).eq('id', c.institution_id);
      await db.from('reviews').delete().eq('course_id', courseId);
      await db.from('course_submissions').delete().eq('course_id', courseId);
      await db.from('scrape_pages').delete().eq('url', url);
    }
    if (writerId) await db.auth.admin.deleteUser(writerId);
    await db.auth.admin.deleteUser(adminId);
  }
});

test('a visitor asks us to check a course from an Instagram ad; the admin rejects it with a reason', async ({ page }) => {
  test.setTimeout(180_000);
  const db = database();
  const adminId = await ensureLocalAdmin(db, ADMIN_EMAIL);
  const stamp = Date.now();
  const name = `סדנת בדיקה ${stamp}`;
  // בלי www, כמו שהודבק. בלי פרמטרי המעקב.
  const url = `https://instagram.com/p/e2e${stamp}/`;
  // מגבלת הקצב: 3 ביממה לכל כתובת. מקומית כל הבקשות מאותה כתובת, ולכן הבדיקה מוחקת את השורה שלה בסוף.

  try {
    await page.goto('/request-course');
    await expect(page.getByRole('heading', { level: 1, name: 'בקשו שנבדוק קורס' })).toBeVisible();
    const form = page.getByRole('form', { name: 'בקשה לבדוק קורס' });
    await form.getByLabel('הקישור').fill('javascript:alert(1)');
    await form.getByRole('button', { name: 'לשלוח לבדיקה' }).click();
    await expect(form.getByText(/זה לא נראה כמו קישור לדף/)).toBeVisible();

    await form.getByLabel('הקישור').fill(`instagram.com/p/e2e${stamp}/?igsh=abc&utm_source=ig`);
    await form.getByLabel('שם (לא חובה)').fill(name);
    await form.getByLabel('הערה (לא חובה)').fill('ראיתי מודעה. מחיר לא כתוב.');
    await shots(page, '04-request-form');
    await form.getByRole('button', { name: 'לשלוח לבדיקה' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'קיבלנו את הקישור' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'קיבלנו את הקישור' })).toBeFocused();
    await shots(page, '05-request-sent');

    // במסד: בלי פרמטרי מעקב, עם השם וההערה, ועם טביעה של הכתובת בלבד.
    const { data: row } = await db
      .from('course_submissions')
      .select('id, source, course_title, note, client_hash, status, submitted_by')
      .eq('url', url)
      .single();
    expect(row).toMatchObject({
      source: 'request',
      course_title: name,
      note: 'ראיתי מודעה. מחיר לא כתוב.',
      client_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      status: 'pending',
      submitted_by: null,
    });

    await signInAsAdmin(page);
    const item = page.getByRole('article').filter({ has: page.getByRole('heading', { level: 3, name }) });
    await expect(item).toHaveCount(1);
    await expect(item).toContainText('בקשה לבדוק קורס');
    await expect(item).toContainText('רשת חברתית: האוסף לא יקרא את הדף.');
    await expect(item).toContainText('ראיתי מודעה. מחיר לא כתוב.');
    await expect(item.getByRole('button', { name: 'לדחות' })).toBeDisabled();
    await item.getByLabel('הסיבה').fill('בדף אין פרטים על הקורס.');
    await item.getByRole('button', { name: 'לדחות' }).click();
    await expect(page.getByRole('list', { name: 'מה הוחלט עכשיו' })).toContainText('נדחה', { timeout: 30_000 });
    await expect(item).toHaveCount(0);

    const { data: rejected } = await db.from('course_submissions').select('status, decision_reason').eq('id', row!.id).single();
    expect(rejected).toEqual({ status: 'rejected', decision_reason: 'בדף אין פרטים על הקורס.' });
    const { data: audit } = await db.from('audit_log').select('action, actor_id').eq('course_submission_id', row!.id);
    expect(audit).toEqual([{ action: 'course_link_reject', actor_id: adminId }]);
  } finally {
    await db.from('course_submissions').delete().eq('url', url);
    await db.auth.admin.deleteUser(adminId);
  }
});
