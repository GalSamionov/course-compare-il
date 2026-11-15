'use server';

import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { parseJoinForm, type JoinField } from '@/lib/institutions/join';
import { createAdminClient } from '@/lib/supabase/admin-client';

export type JoinState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: Partial<Record<JoinField, string>>; message?: string }
  | { status: 'sent' };

/**
 * הטופס הציבורי היחיד שכותב למסד. לאורח אין שום הרשאה: הכתיבה עוברת כאן, עם המפתח הסודי, דרך
 * submit_institution_request, שבודקת את מגבלת הקצב במסד (3 ביממה לכל כתובת, 50 בסך הכול).
 * Next בודק ש-Origin תואם ל-Host (server-actions.md, Security). שדה המלכודת עוצר בוטים פשוטים.
 */
export async function submitJoinRequest(_previous: JoinState, form: FormData): Promise<JoinState> {
  // שדה שבן אדם לא רואה ולא ממלא. בוט שממלא אותו מקבל את אותה תשובה, ושום דבר לא נשמר.
  if (String(form.get('website') ?? '') !== '') return { status: 'sent' };

  const parsed = parseJoinForm(form);
  if (!parsed.ok) return { status: 'invalid', errors: parsed.errors };

  const secret = process.env.SUPABASE_SECRET_KEY;
  let db: ReturnType<typeof createAdminClient>;
  try {
    if (!secret) throw new Error('missing key');
    db = createAdminClient();
  } catch {
    return { status: 'invalid', errors: {}, message: 'אי אפשר לשלוח עכשיו. נסו שוב מאוחר יותר.' };
  }

  // ב-Vercel הכתובת הראשונה ב-x-forwarded-for היא של המבקר (כמו ב-api/understand). נשמרת רק טביעה:
  // HMAC עם המפתח הסודי, כדי שאי אפשר יהיה לשחזר את הכתובת מהטביעה גם עם כל כתובות ה-IPv4.
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const clientHash = createHmac('sha256', secret).update(`institution-join:${ip}`).digest('hex');

  const { error } = await db.rpc('submit_institution_request', {
    p_institution_name: parsed.values.institutionName,
    p_course_url: parsed.values.courseUrl,
    p_contact_email: parsed.values.contactEmail,
    p_client_hash: clientHash,
  });
  if (error) {
    if (error.code === 'LM001') {
      return { status: 'invalid', errors: {}, message: 'כבר קיבלנו מכם שלוש בקשות היום. אפשר לשלוח עוד מחר.' };
    }
    if (error.code === 'LM002') {
      return { status: 'invalid', errors: {}, message: 'הגיעו היום הרבה בקשות, והטופס נסגר עד מחר. נסו שוב מחר.' };
    }
    console.error('institution join request failed', error.code);
    return { status: 'invalid', errors: {}, message: 'הבקשה לא נשלחה. נסו שוב בעוד כמה דקות.' };
  }
  // 'duplicate': אותו קישור כבר ממתין. אותה תשובה, כדי לא לגלות מה אחרים שלחו.
  return { status: 'sent' };
}
