import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { ensureLocalAdmin } from '../src/lib/admin/local-admin';
import type { Database, Json } from '../src/lib/database.types';
import { localEnv } from './support/env';
import { signIn } from './support/mail';

/**
 * אישור בבת אחת (20261116000001_course_queue_bulk.sql): מוסד לדוגמה עם שלושה קורסים חדשים בתור, שניים בטוחים
 * ואחד בביטחון בינוני. גל מאשר את שני הבטוחים, אחרי שלב האישור עם המספר. הם עולים לאתר, עם שורה ביומן לכל אחד,
 * והשלישי נשאר בתור. הקורסים נוצרים מחדש בכל ריצה, כדי שהבדיקה לא תלויה במה שכבר במסד המקומי.
 */
const INST_SLUG = 'bulk-e2e-sample';
const INST_NAME = 'מכללה לדוגמה לאישור בבת אחת';
const ADMIN_EMAIL = 'admin-bulk-approve-e2e@example.test';

const field = (value: Json, confidence = 'high') => ({ value, quote: null, confidence, issues: [] });

test('the admin approves the safe new courses of one institution at once, and the unsafe one stays in the queue', async ({ page }) => {
  test.setTimeout(180_000);
  const db = createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });
  const adminId = await ensureLocalAdmin(db, ADMIN_EMAIL);
  const tag = Date.now().toString(36);
  const { data: category } = await db.from('categories').select('id').limit(1).single();
  const { data: inst, error: instError } = await db
    .from('institutions')
    .upsert({ slug: INST_SLUG, name: INST_NAME, kind: 'school', website: 'https://bulk-e2e.example/' }, { onConflict: 'slug' })
    .select('id')
    .single();
  expect(instError).toBeNull();
  const drafts = (['a', 'b', 'c'] as const).map((key) => ({
    key,
    slug: `bulk-e2e-${tag}-${key}`,
    title: `קורס לדוגמה ${key} ${tag}`,
    url: `https://bulk-e2e.example/${tag}/${key}`,
  }));
  // מה שנשאר מריצה קודמת שנכשלה באמצע: יורד מהתור, כדי שהמספרים של המוסד יהיו רק של הריצה הזאת.
  const { data: old } = await db.from('courses').select('id').eq('institution_id', inst!.id);
  await db.from('course_change_queue').delete().eq('status', 'pending').in('course_id', (old ?? []).map((c) => c.id));

  const { data: courses, error: courseError } = await db
    .from('courses')
    .insert(
      drafts.map((d) => ({
        slug: d.slug,
        title: d.title,
        institution_id: inst!.id,
        category_id: category!.id,
        status: 'draft' as const,
        page_url: d.url,
        site_price_ils: d.key === 'c' ? null : 4900,
      })),
    )
    .select('id, slug');
  expect(courseError).toBeNull();
  const courseId = new Map(courses!.map((c) => [c.slug, c.id]));
  const { data: pages } = await db
    .from('scrape_pages')
    .insert(drafts.map((d) => ({ institution_id: inst!.id, url: d.url, course_id: courseId.get(d.slug)! })))
    .select('id, course_id');
  const pageOf = new Map(pages!.map((p) => [p.course_id, p.id]));
  const { data: queued, error: queueError } = await db
    .from('course_change_queue')
    .insert(
      drafts.map((d) => ({
        course_id: courseId.get(d.slug)!,
        page_id: pageOf.get(courseId.get(d.slug)!)!,
        kind: 'new_course',
        new_value:
          d.key === 'c'
            ? { title: field(d.title), site_price_ils: field(900, 'medium') }
            : { title: field(d.title), site_price_ils: field(4900) },
        reasons: d.key === 'c' ? ['new_course', 'site_price_ils:low_confidence'] : ['new_course'],
      })),
    )
    .select('id, course_id');
  expect(queueError).toBeNull();
  const queueOf = new Map(queued!.map((q) => [q.course_id, q.id]));
  const [a, b, c] = drafts.map((d) => ({ ...d, courseId: courseId.get(d.slug)!, queueId: queueOf.get(courseId.get(d.slug)!)! }));

  try {
    await page.goto('/login?next=%2Fadmin');
    await signIn(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);

    const group = page.getByRole('article').filter({ has: page.getByRole('heading', { level: 3, name: INST_NAME, exact: true }) });
    await expect(group).toHaveCount(1);
    await expect(group).toContainText('3 קורסים חדשים');
    await expect(group).toContainText('2 בטוחים');
    await expect(group).toContainText('1 בגלל שדה בביטחון לא גבוה');
    await expect(group.getByText(a.title)).toBeVisible();

    await group.getByRole('button', { name: `לאשר את 2 הקורסים הבטוחים של ${INST_NAME}` }).click();
    await expect(group.getByText('לפרסם 2 קורסים?', { exact: false })).toBeVisible();
    await group.getByRole('button', { name: 'כן, לפרסם 2 קורסים' }).click();
    await expect(page.getByRole('list', { name: 'מה הוחלט עכשיו' })).toContainText('2 קורסים פורסמו בקטלוג.', { timeout: 30_000 });
    await expect(group).toContainText('קורס חדש אחד');
    await expect(group).toContainText('אין כאן קורס בטוח');

    // במסד: שני הבטוחים פעילים ומאושרים, עם שורה ביומן לכל אחד. השלישי עדיין טיוטה בתור.
    const { data: after } = await db.from('courses').select('id, status').in('id', [a.courseId, b.courseId, c.courseId]);
    expect(Object.fromEntries(after!.map((r) => [r.id, r.status]))).toEqual({
      [a.courseId]: 'active',
      [b.courseId]: 'active',
      [c.courseId]: 'draft',
    });
    const { data: items } = await db.from('course_change_queue').select('id, status, decided_by').in('id', [a.queueId, b.queueId, c.queueId]);
    expect(Object.fromEntries(items!.map((r) => [r.id, [r.status, r.decided_by]]))).toEqual({
      [a.queueId]: ['approved', adminId],
      [b.queueId]: ['approved', adminId],
      [c.queueId]: ['pending', null],
    });
    const { data: audit } = await db
      .from('audit_log')
      .select('action, actor_id, course_queue_id')
      .in('course_queue_id', [a.queueId, b.queueId, c.queueId])
      .order('course_queue_id');
    expect(audit).toEqual(
      [a.queueId, b.queueId].sort((x, y) => x - y).map((id) => ({ action: 'course_approve', actor_id: adminId, course_queue_id: id })),
    );

    // הקורס באתר, מיד.
    await page.goto(`/courses/${a.slug}`);
    await expect(page.getByRole('heading', { level: 1, name: a.title })).toBeVisible();
  } finally {
    // הקורסים חוזרים לטיוטה (ביטול נרשם כשורה חדשה ביומן, שלא נמחק), והפריט שנשאר יורד מהתור.
    const { data: changes } = await db.from('course_changes').select('id').in('queue_id', [a.queueId, b.queueId]);
    for (const change of changes ?? []) await db.rpc('undo_course_change', { p_change_id: change.id, p_admin_id: adminId });
    await db.from('course_change_queue').delete().eq('status', 'pending').in('id', [a.queueId, b.queueId, c.queueId]);
    await db.auth.admin.deleteUser(adminId);
  }
});
