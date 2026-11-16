import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';
import type { Database } from '../src/lib/database.types';
import { recomputeAllScores } from '../src/lib/score/recompute';
import { localEnv } from './support/env';
import { signIn } from './support/mail';

/**
 * "בוגר מאומת" ב-LinkedIn: לביקורת שפורסמה יש ב"הביקורות שלי" קישור לשיתוף. הכרטיס נטען בלי שם, בלי הטקסט של
 * הביקורת ובלי המייל, ומסומן noindex. אחרי שהכותב מוחק את הביקורת, הכרטיס והתמונה שלו מחזירים 404 אמיתי.
 *
 * הביקורת נכנסת ישר למסד כביקורת שפורסמה: את הדרך מטיוטה לפרסום כבר בודקת review.spec.ts.
 * הקורס: React, שאף בדיקה אחרת לא סופרת את הביקורות שלו, והוא גם לא בעמוד ההסבה (96 שעות).
 *
 * SHOTS=375 או SHOTS=1280: צילומים ל-.impeccable/review/growth/ (לא ב-git).
 */
const SLUG = 'react-frontend-sample';
const COURSE_TITLE = 'פיתוח צד לקוח עם React';
const NAME = 'בודקת תג';

const SHOTS = process.env.SHOTS;
// בצילום התנועה כבויה: מה שעוד לא נכנס למסך היה מצולם באמצע הכניסה שלו.
if (SHOTS) test.use({ reducedMotion: 'reduce' });
if (SHOTS === '375') test.use({ viewport: { width: 375, height: 812 } });
if (SHOTS === '1280') {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
}
async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  await page.screenshot({ path: `../.impeccable/review/growth/${SHOTS}/${name}.png`, fullPage: true });
}

test('a published review gets a share link, the badge shows no personal data, and deleting the review makes it 404', async ({ page }) => {
  test.setTimeout(180_000);
  const db = createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });
  const email = `badge-${Date.now()}@example.test`;
  const body = `בדיקת קצה ${Date.now()}: בנינו שלושה פרויקטים ב-React, עם TypeScript ובדיקות. המרצה עבר על כל פרויקט ונתן הערות.`;
  let userId: string | null = null;

  try {
    await page.goto('/login?next=%2Fme');
    await signIn(page, email);
    await expect(page).toHaveURL(/\/me$/);
    const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = users.users.find((u) => u.email === email)?.id ?? null;
    expect(userId).not.toBeNull();

    const { data: course } = await db.from('courses').select('id').eq('slug', SLUG).single();
    const now = new Date().toISOString();
    const { error: insertError } = await db.from('reviews').insert({
      course_id: course!.id,
      author_id: userId,
      cohort_month: '2026-01-01',
      body,
      display_name: NAME,
      display_mode: 'full',
      author_title: 'graduate_f',
      status: 'published',
      proof_kind: 'invoice',
      verified_at: now,
      published_at: now,
      submitted_at: now,
    });
    expect(insertError).toBeNull();

    // "הביקורות שלי": השורה של הביקורת, ו"לשתף ב-LinkedIn".
    await page.goto('/me');
    const row = page.locator('#reviews li').filter({ hasText: COURSE_TITLE });
    await expect(row).toContainText('פורסמה');
    await row.getByRole('button', { name: /^לשתף ב-LinkedIn/ }).click();
    const panel = row.getByRole('group', { name: 'לשתף ב-LinkedIn שאתם בוגרים מאומתים' });
    // לפני שנוצר קישור: מה הכרטיס יראה. ברירת המחדל בלי שם.
    await expect(panel).toContainText(`בוגר/ת מאומת/ת של ${COURSE_TITLE}`);
    await expect(panel.getByRole('checkbox', { name: /להראות בכרטיס את השם שלי/ })).toHaveAttribute('aria-checked', 'false');
    await panel.getByRole('button', { name: 'ליצור קישור לשיתוף' }).click();

    const linkedin = panel.getByRole('link', { name: /^לשתף ב-LinkedIn/ });
    await expect(linkedin).toBeVisible({ timeout: 15_000 });
    const shared = new URL((await linkedin.getAttribute('href'))!);
    expect(shared.origin + shared.pathname).toBe('https://www.linkedin.com/sharing/share-offsite/');
    const badgeUrl = new URL(shared.searchParams.get('url')!);
    expect(badgeUrl.pathname).toMatch(/^\/verified\/[A-Za-z0-9_-]{32}$/);
    await expect(panel.getByRole('link', { name: /^לראות את הכרטיס/ })).toHaveAttribute('href', badgeUrl.pathname);
    if (SHOTS) await row.screenshot({ path: `../.impeccable/review/growth/${SHOTS}/me-share.png` });

    // הכרטיס: נטען, בלי שם, בלי הטקסט ובלי המייל, ומסומן noindex.
    const response = await page.goto(badgeUrl.pathname);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(`בוגר/ת מאומת/ת`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(COURSE_TITLE);
    const html = await page.content();
    for (const secret of [NAME, body, email, userId!]) expect(html).not.toContain(secret);
    await expect(page.getByRole('link', { name: 'לקרוא את הביקורות על הקורס' })).toHaveAttribute('href', `/courses/${SLUG}#reviews`);
    await expect(page.getByRole('link', { name: 'סיימתם קורס? לכתוב ביקורת' })).toHaveAttribute('href', '/review');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
    const ogPath = new URL(ogUrl!).pathname;
    expect(ogPath.startsWith(`${badgeUrl.pathname}/opengraph-image`)).toBe(true);
    const og = await page.request.get(ogPath);
    expect(og.status()).toBe(200);
    expect(og.headers()['content-type']).toBe('image/png');
    if (SHOTS) writeFileSync(`../.impeccable/review/growth/${SHOTS}/badge-og.png`, await og.body());
    await shot(page, 'badge');

    // קישור שלא קיים: 404 אמיתי, בלי לחשוף אם היה פעם.
    expect((await page.request.get(`/verified/${'A'.repeat(32)}`)).status()).toBe(404);
    expect((await page.request.get('/verified/not-a-token')).status()).toBe(404);

    // הכותב מוחק את הביקורת ב"הביקורות שלי": הכרטיס והתמונה שלו מחזירים 404.
    await page.goto('/me');
    await row.getByRole('button', { name: new RegExp(`^למחוק את הביקורת על ${COURSE_TITLE}`) }).click();
    await row.getByRole('button', { name: 'כן, למחוק' }).click();
    await expect(page.getByRole('status').filter({ hasText: `הביקורת על ${COURSE_TITLE} נמחקה.` })).toBeVisible({
      timeout: 30_000,
    });
    expect((await page.request.get(badgeUrl.pathname)).status()).toBe(404);
    expect((await page.request.get(ogPath)).status()).toBe(404);
    const gone = await page.goto(badgeUrl.pathname);
    expect(gone?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'הקישור הזה כבר לא פעיל' })).toBeVisible();
    await shot(page, 'badge-gone');
  } finally {
    // ניקוי, גם אחרי כישלון: מה שנשאר מהביקורת, והמשתמש.
    if (userId) {
      const { data: left } = await db.from('reviews').select('id').eq('author_id', userId);
      for (const { id } of left ?? []) {
        await db.rpc('delete_review', { p_review_id: id, p_action: 'author_delete', p_actor_id: userId });
      }
      if ((left ?? []).length > 0) await recomputeAllScores(db, new Date());
      await db.auth.admin.deleteUser(userId);
    }
  }
});
