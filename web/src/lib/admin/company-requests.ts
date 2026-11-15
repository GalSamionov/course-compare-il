import 'server-only';
import type { AdminDb } from './gate';

/** פנייה של חברה מ-/companies, כמו שגל רואה אותה ב-/admin. המייל והטלפון רק כאן, לא באתר. */
export interface CompanyRequest {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  needs: string;
  teamSize: string | null;
  format: string | null;
  timing: string | null;
  status: 'new' | 'contacted';
  createdAt: string;
  contactedAt: string | null;
}

/** כמה פניות בעמוד, החדשה ראשונה. מעבר לזה, השורה מעל הרשימה אומרת כמה עוד יש. */
export const COMPANY_REQUESTS_PAGE = 50;

/** הפניות הפתוחות (חדשות, ואלה שחזרנו אליהן), החדשה ראשונה. סגורות לא מוצגות, ונמחקות אחרי 12 חודשים. */
export async function loadCompanyRequests(
  db: AdminDb,
): Promise<{ requests: CompanyRequest[]; open: number; waiting: number }> {
  const [rows, open, waiting] = await Promise.all([
    db
      .from('company_requests')
      .select('id, company_name, contact_name, email, phone, needs, team_size, format, timing, status, created_at, contacted_at')
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(COMPANY_REQUESTS_PAGE),
    db.from('company_requests').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
    db.from('company_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);
  if (rows.error) throw new Error(`company requests: ${rows.error.message}`);
  if (open.error || waiting.error) throw new Error(`company requests count: ${(open.error ?? waiting.error)?.message}`);
  return {
    open: open.count ?? rows.data.length,
    waiting: waiting.count ?? 0,
    requests: rows.data.map((r) => ({
      id: r.id,
      companyName: r.company_name,
      contactName: r.contact_name,
      email: r.email,
      phone: r.phone,
      needs: r.needs,
      teamSize: r.team_size,
      format: r.format,
      timing: r.timing,
      status: r.status === 'contacted' ? 'contacted' : 'new',
      createdAt: r.created_at,
      contactedAt: r.contacted_at,
    })),
  };
}
