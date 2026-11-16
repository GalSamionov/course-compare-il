'use server';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { parseCompanyRequest, type CompanyField } from '@/lib/companies/request';
import { createAdminClient } from '@/lib/supabase/admin-client';

export type CompanyRequestState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: Partial<Record<CompanyField, string>>; message?: string }
  | { status: 'sent' };

/**
 * הפנייה של חברה (/companies). כמו הטופס של מוסדות (institutions/join/actions.ts): לאורח אין שום הרשאה, והכתיבה
 * עוברת כאן, עם המפתח הסודי, דרך submit_company_request, שבודקת את מגבלת הקצב במסד (3 ביממה לכל כתובת, 100
 * בסך הכול) ואת כל הערכים שוב. Next בודק ש-Origin תואם ל-Host (server-actions.md, Security). שדה המלכודת
 * עוצר בוטים פשוטים. התשובה לא מחזירה שום דבר מהמסד, וגם לא את המייל: רק "נשלח".
 */
export async function submitCompanyRequest(_previous: CompanyRequestState, form: FormData): Promise<CompanyRequestState> {
  // שדה שבן אדם לא רואה ולא ממלא. בוט שממלא אותו מקבל את אותה תשובה, ושום דבר לא נשמר.
  if (String(form.get('website') ?? '') !== '') return { status: 'sent' };

  const parsed = parseCompanyRequest(form);
  if (!parsed.ok) return { status: 'invalid', errors: parsed.errors };

  const secret = process.env.SUPABASE_SECRET_KEY;
  let db: ReturnType<typeof createAdminClient>;
  try {
    if (!secret) throw new Error('missing key');
    db = createAdminClient();
  } catch {
    return { status: 'invalid', errors: {}, message: 'אי אפשר לשלוח עכשיו. נסו שוב מאוחר יותר.' };
  }

  // ב-Vercel הכתובת הראשונה ב-x-forwarded-for היא של המבקר. נשמרת רק טביעה: HMAC עם המפתח הסודי, ועם
  // תחילית משלה, כדי שהטביעה כאן לא תהיה זהה לזו של הטופס למוסדות.
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const clientHash = createHmac('sha256', secret).update(`company-request:${ip}`).digest('hex');

  const v = parsed.values;
  const { error } = await db.rpc('submit_company_request', {
    p_company_name: v.companyName,
    p_contact_name: v.contactName,
    p_email: v.email,
    p_needs: v.needs,
    p_client_hash: clientHash,
    ...(v.phone ? { p_phone: v.phone } : {}),
    ...(v.teamSize ? { p_team_size: v.teamSize } : {}),
    ...(v.format ? { p_format: v.format } : {}),
    ...(v.timing ? { p_timing: v.timing } : {}),
  });
  if (error) {
    if (error.code === 'LM040') {
      return { status: 'invalid', errors: {}, message: 'כבר קיבלנו מכם שלוש פניות היום. אפשר לשלוח עוד מחר.' };
    }
    if (error.code === 'LM041') {
      return { status: 'invalid', errors: {}, message: 'הגיעו היום הרבה פניות, והטופס נסגר עד מחר. נסו שוב מחר.' };
    }
    // רק הקוד: בהודעה המלאה של המסד יכולים להיות הערכים שנשלחו.
    console.error('company request failed', error.code);
    return { status: 'invalid', errors: {}, message: 'הפנייה לא נשלחה. נסו שוב בעוד כמה דקות.' };
  }
  // 'duplicate': אותו מייל כבר שלח את אותו טקסט. אותה תשובה, כי זו אותה פנייה.
  return { status: 'sent' };
}
