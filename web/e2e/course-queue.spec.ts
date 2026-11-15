import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { ensureLocalAdmin } from '../src/lib/admin/local-admin';
import type { Database } from '../src/lib/database.types';
import { localEnv } from './support/env';
import { signIn } from './support/mail';

/**
 * תוכנית 5ב: גל מאשר שינוי מחיר שהאוסף הכניס לתור, והמחיר החדש בעמוד הקורס מיד (updateTag), עם שורה ביומן.
 * קורס שאף בדיקה אחרת לא קוראת את המחיר שלו. הפריט נכנס לתור עם תאריך ישן, כדי שיהיה בראש הערימה
 * (התור מציג רק את הישנים), גם כשבמסד המקומי יש פריטים מהדגמת האוסף.
 */
const SLUG = 'phone-photo-sample';
const COURSE_TITLE = 'צילום בטלפון';
const ADMIN_EMAIL = 'admin-course-queue-e2e@example.test';

test('the admin approves a price change from the scraper queue, and the course page shows the new price at once', async ({ page }) => {
  test.setTimeout(180_000);
  const db = createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });
  const adminId = await ensureLocalAdmin(db, ADMIN_EMAIL);
  const { data: course } = await db.from('courses').select('id, site_price_ils').eq('slug', SLUG).single();
  const oldPrice = course!.site_price_ils!;
  // מחיר חדש שונה בכל ריצה: אם השרת נשאר מריצה קודמת, עמוד שבמטמון לא יכול להציג אותו במקרה.
  const newPrice = oldPrice + 100 + (Date.now() % 800);
  const shown = (n: number) => new RegExp(`${new Intl.NumberFormat('he-IL').format(n)} ₪`);
  const { data: queued, error } = await db
    .from('course_change_queue')
    .insert({
      course_id: course!.id,
      kind: 'field',
      field: 'site_price_ils',
      old_value: oldPrice,
      new_value: newPrice,
      quote: `מחיר הסדנה: ${newPrice} ש"ח`,
      confidence: 'high',
      reasons: ['price_jump'],
      created_at: '2000-01-01T00:00:00Z',
    })
    .select('id')
    .single();
  expect(error).toBeNull();
  const queueId = queued!.id;

  try {
    // עמוד הקורס נכנס למטמון בלי המחיר החדש, כדי שהבדיקה תראה שהאישור מרענן אותו.
    await page.goto(`/courses/${SLUG}`);
    await expect(page.getByRole('heading', { level: 1, name: COURSE_TITLE })).toBeVisible();
    await expect(page.getByText(shown(newPrice))).toHaveCount(0);

    await page.goto('/login?next=%2Fadmin');
    await signIn(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);
    // שם מדויק ורק "שינוי בשדה": בהדגמה של האוסף יש קורס חדש בשם "הרצאה: צילום בטלפון", עם מחיר.
    const item = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { level: 3, name: COURSE_TITLE, exact: true }) })
      .filter({ hasText: 'שינוי בשדה' })
      .filter({ hasText: 'מחיר באתר' });
    await expect(item).toHaveCount(1);
    await expect(item.getByText('באתר עכשיו')).toBeVisible();
    await expect(item.getByText(shown(oldPrice))).toBeVisible();
    await expect(item.getByText(shown(newPrice))).toBeVisible();
    await expect(item.getByText(`מחיר הסדנה: ${newPrice} ש"ח`)).toBeVisible();
    await expect(item.getByText('המחיר זז ביותר מ-20%')).toBeVisible();

    await item.getByRole('button', { name: 'לאשר' }).click();
    await expect(page.getByRole('list', { name: 'מה הוחלט עכשיו' })).toContainText('אושר ועלה לאתר.', { timeout: 30_000 });
    await expect(item).toHaveCount(0);

    // במסד: המחיר, שורה ביומן השינויים, ושורה ב-audit_log.
    expect((await db.from('courses').select('site_price_ils').eq('id', course!.id).single()).data?.site_price_ils).toBe(newPrice);
    const { data: change } = await db
      .from('course_changes')
      .select('source, approved_by, old_value, new_value')
      .eq('queue_id', queueId)
      .single();
    expect(change).toEqual({ source: 'approved', approved_by: adminId, old_value: oldPrice, new_value: newPrice });
    const { data: audit } = await db.from('audit_log').select('action, actor_id').eq('course_queue_id', queueId);
    expect(audit).toEqual([{ action: 'course_approve', actor_id: adminId }]);

    // בעמוד הקורס, מיד.
    await page.goto(`/courses/${SLUG}`);
    await expect(page.getByText(shown(newPrice)).first()).toBeVisible();
  } finally {
    // המחיר חוזר (ביטול נרשם כשורה חדשה ביומן, שלא נמחק), והפריט יורד אם הבדיקה נכשלה לפניו.
    const { data: change } = await db.from('course_changes').select('id').eq('queue_id', queueId).maybeSingle();
    if (change) await db.rpc('undo_course_change', { p_change_id: change.id, p_admin_id: adminId });
    await db.from('course_change_queue').delete().eq('id', queueId).eq('status', 'pending');
    await db.auth.admin.deleteUser(adminId);
  }
});
