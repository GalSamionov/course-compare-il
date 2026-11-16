import { createClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import { ensureLocalAdmin } from '../src/lib/admin/local-admin';
import type { Database } from '../src/lib/database.types';
import { localEnv } from './support/env';
import { signIn } from './support/mail';

/**
 * הפנייה של חברה מ-/companies: שליחה ריקה מראה הודעה ליד כל שדה, שליחה מלאה מראה "קיבלנו", והפנייה במסד
 * כמו שנכתבה. אחר כך גל רואה אותה ב-/admin, מסמן "חזרנו אליהם" וסוגר, ושני השינויים ביומן.
 * מייל ושם חברה חדשים בכל ריצה. בסוף הפנייה נמחקת, כדי שמגבלת הקצב (3 ביממה לכתובת) לא תיספר בריצה הבאה.
 */
const ADMIN_EMAIL = 'admin-companies-e2e@example.test';
const TITLE = 'לבחור קורס, הרצאה או סדנה לעובדים, לפי מי שכבר היה שם';
const NEEDS = 'סדנה על אקסל לצוות הכספים, בערך 12 עובדים, בתל אביב';

test('a company sends a request, sees the confirmation, and the admin marks it contacted and then closes it', async ({ page }) => {
  test.setTimeout(180_000);
  const db = createClient<Database>(localEnv('NEXT_PUBLIC_SUPABASE_URL'), localEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  });
  const run = Date.now();
  const email = `buyer-${run}@example.test`;
  const company = `חברה לבדיקה ${run % 100000}`;
  const adminId = await ensureLocalAdmin(db, ADMIN_EMAIL);

  try {
    await page.goto('/companies');
    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    const form = page.getByRole('form', { name: 'פנייה של חברה' });
    const send = form.getByRole('button', { name: 'לשלוח את הפנייה' });

    // ריק: הודעה ליד כל שדה חובה, והפוקוס בשדה הראשון שיש בו בעיה.
    await send.click();
    const needs = form.getByLabel('מה אתם מחפשים');
    await expect(needs).toHaveAttribute('aria-invalid', 'true');
    await expect(needs).toBeFocused();
    await expect(form.getByText('כתבו בכמה מילים מה אתם מחפשים: מה העובדים צריכים ללמוד, ולמי.')).toBeVisible();
    await expect(form.getByText('כתבו את שם החברה.')).toBeVisible();
    await expect(form.getByText('כתבו את השם שלכם, שנדע למי לחזור.')).toBeVisible();
    await expect(form.getByText('כתבו מייל שנוכל לחזור אליו.')).toBeVisible();

    await needs.fill(NEEDS);
    await form.getByLabel('שם החברה').fill(company);
    await form.getByLabel('השם שלכם').fill('דנה לבדיקה');
    await form.getByLabel('מייל', { exact: true }).fill(email);
    await form.getByLabel('טלפון').fill('050-123 4567');
    await form.getByLabel('כמה עובדים ישתתפו').selectOption('11-50');
    await form.locator('label').filter({ hasText: /^סדנה$/ }).click();
    await expect(form.getByRole('radio', { name: 'סדנה' })).toBeChecked();
    await form.getByLabel('מתי בערך').selectOption('quarter');
    await send.click();

    const done = page.getByRole('heading', { level: 2, name: 'קיבלנו. נחזור אליכם תוך 2 ימי עבודה.' });
    await expect(done).toBeVisible({ timeout: 30_000 });
    await expect(done).toBeFocused();
    await expect(page.getByRole('form', { name: 'פנייה של חברה' })).toHaveCount(0);

    const { data: row, error } = await db
      .from('company_requests')
      .select('id, company_name, contact_name, phone, needs, team_size, format, timing, status')
      .eq('email', email)
      .single();
    expect(error).toBeNull();
    expect(row).toMatchObject({
      company_name: company,
      contact_name: 'דנה לבדיקה',
      phone: '0501234567',
      needs: NEEDS,
      team_size: '11-50',
      format: 'workshop',
      timing: 'quarter',
      status: 'new',
    });

    // גל, ב-/admin: הפנייה ברשימה, עם המייל כקישור mailto.
    await page.goto('/login?next=%2Fadmin');
    await signIn(page, ADMIN_EMAIL);
    await expect(page).toHaveURL(/\/admin$/);
    const item = page.getByRole('article').filter({ has: page.getByRole('heading', { level: 3, name: company }) });
    await expect(item).toHaveCount(1);
    await expect(item).toContainText(NEEDS);
    await expect(item).toContainText('סדנה');
    await expect(item.getByRole('link', { name: email })).toHaveAttribute('href', `mailto:${encodeURIComponent(email)}`);

    await item.getByRole('button', { name: 'חזרנו אליהם' }).click();
    const log = page.getByRole('list', { name: 'מה הוחלט עכשיו' });
    await expect(log).toContainText('סומן שחזרנו אליהם.', { timeout: 30_000 });
    await expect(item.getByRole('button', { name: 'חזרנו אליהם' })).toHaveCount(0);
    await expect(item).toContainText('· חזרנו אליהם');

    await item.getByRole('button', { name: 'לסגור את הפנייה' }).click();
    await expect(log).toContainText('נסגרה. היא תימחק 12 חודשים מעכשיו.', { timeout: 30_000 });
    await expect(item).toHaveCount(0);

    const { data: audit } = await db.from('audit_log').select('action, actor_id').eq('company_request_id', row!.id).order('id');
    expect(audit).toEqual([
      { action: 'company_request_contacted', actor_id: adminId },
      { action: 'company_request_closed', actor_id: adminId },
    ]);
  } finally {
    await db.from('company_requests').delete().eq('email', email);
    await db.auth.admin.deleteUser(adminId);
  }
});
