'use server';

import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/gate';
import type { DecisionState } from './actions';

/** מזהה של שורה (bigint), כמחרוזת ספרות בלבד. */
function rowId(value: FormDataEntryValue | null): number | null {
  return typeof value === 'string' && /^[1-9]\d{0,14}$/.test(value) ? Number(value) : null;
}

/**
 * פנייה של חברה (/companies): "חזרנו אליהם", או סגירה. רק המזהה והמצב מגיעים מהטופס, והמסד בודק שהמעבר
 * מותר (set_company_request_status) וכותב שורה ב-audit_log באותה טרנזקציה. שום דבר ציבורי לא משתנה.
 */
export async function setCompanyRequestStatus(_previous: DecisionState, form: FormData): Promise<DecisionState> {
  const gate = await requireAdmin();
  if (typeof gate === 'string') return { status: 'error', message: gate };

  const requestId = rowId(form.get('requestId'));
  const status = form.get('status');
  if (requestId === null || (status !== 'contacted' && status !== 'closed')) {
    return { status: 'error', message: 'הבקשה לא תקינה.' };
  }

  const { error } = await gate.db.rpc('set_company_request_status', {
    p_request_id: requestId,
    p_admin_id: gate.userId,
    p_status: status,
  });
  if (error) {
    if (error.code === 'P0002') {
      return { status: 'error', message: 'הפנייה כבר במצב הזה, או שכבר נסגרה. אולי בלשונית אחרת: לרענן את הדף.' };
    }
    console.error('company request status failed', error.code);
    return { status: 'error', message: 'השינוי לא נשמר. נסו שוב.' };
  }
  // הרשימה לא במטמון: refresh מרנדר אותה מחדש. פנייה שנסגרה יורדת ממנה.
  refresh();
  return {
    status: 'done',
    message: status === 'contacted' ? 'סומן שחזרנו אליהם.' : 'נסגרה. היא תימחק 12 חודשים מעכשיו.',
  };
}
