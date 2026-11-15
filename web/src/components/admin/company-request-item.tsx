'use client';

import { useActionState } from 'react';
import type { DecisionState } from '@/app/admin/actions';
import { setCompanyRequestStatus } from '@/app/admin/company-actions';
import type { CompanyRequest } from '@/lib/admin/company-requests';
import { FORMATS, TEAM_SIZES, TIMINGS, choiceLabel } from '@/lib/companies/request';
import { outlineButton, primaryButton, textLink } from './controls';
import { useLogDecision } from './decision-log';
import { dateTimeLabel } from './format';

const IDLE: DecisionState = { status: 'idle' };

const term = 'text-[13px] text-ink-soft';

/**
 * פנייה של חברה (/companies): מה הם מחפשים, איך לחזור אליהם, ושני מצבים: "חזרנו אליהם" ונסגרה.
 * המייל והטלפון פרטיים: מוצגים רק כאן, למנהל. מה שהחברה כתבה מודפס בדיו, כמו שנכתב (רק מעברי השורה נשמרים).
 */
export function CompanyRequestItem({ request }: { request: CompanyRequest }) {
  const logDecision = useLogDecision();
  const [state, dispatch, pending] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await setCompanyRequestStatus(previous, form);
    if (result.status === 'done') {
      logDecision({ id: `company:${request.id}:${form.get('status')}`, title: request.companyName, message: result.message });
    }
    return result;
  }, IDLE);
  const headingId = `cr-${request.id}`;
  const details = [
    { term: 'כמה עובדים ישתתפו', value: choiceLabel(TEAM_SIZES, request.teamSize) },
    { term: 'סוג ההכשרה', value: choiceLabel(FORMATS, request.format) },
    { term: 'מתי בערך', value: choiceLabel(TIMINGS, request.timing) },
  ];

  return (
    <article aria-labelledby={headingId} data-anim="ink" className="border-t border-rule py-6 lg:py-8">
      <header>
        <h3 id={headingId} className="text-[21px] leading-snug font-bold text-balance">
          {request.companyName}
        </h3>
        <p className="mt-1 font-sans text-[13px] leading-normal text-ink-soft">
          נשלחה {dateTimeLabel(request.createdAt)}
          {request.status === 'contacted' && request.contactedAt
            ? ` · חזרנו אליהם ${dateTimeLabel(request.contactedAt)}`
            : ' · עוד לא חזרנו אליהם'}
        </p>
      </header>
      <div className="mt-5 grid gap-8 font-sans lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <div className="min-w-0 text-[15px] leading-normal">
          <p className={term}>מה הם מחפשים</p>
          <p className="max-w-[68ch] break-words whitespace-pre-line">{request.needs}</p>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className={term}>איש קשר</dt>
              <dd className="font-semibold break-words">{request.contactName}</dd>
            </div>
            <div className="min-w-0">
              <dt className={term}>מייל (רק כאן, לא באתר)</dt>
              <dd>
                <a
                  // מקודד, גם אם משהו עקף את הבדיקה: ? או & היו מוסיפים לקישור נושא וגוף שהשולח בחר.
                  href={`mailto:${encodeURIComponent(request.email)}`}
                  className={`${textLink} max-w-full`}
                >
                  <bdi dir="ltr" className="truncate">
                    {request.email}
                  </bdi>
                </a>
              </dd>
            </div>
            <div>
              <dt className={term}>טלפון</dt>
              <dd>
                {request.phone ? (
                  <a href={`tel:${encodeURIComponent(request.phone)}`} className={textLink}>
                    <bdi dir="ltr">{request.phone}</bdi>
                  </a>
                ) : (
                  <span className="text-ink-soft">לא השאירו</span>
                )}
              </dd>
            </div>
            {details.map((d) => (
              <div key={d.term}>
                <dt className={term}>{d.term}</dt>
                <dd className={d.value ? undefined : 'text-ink-soft'}>{d.value ?? 'לא בחרו'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <form action={dispatch} aria-label={`מצב הפנייה: ${request.companyName}`} className="min-w-0 space-y-3 text-[15px] leading-normal">
          <input type="hidden" name="requestId" value={request.id} />
          <div className="flex flex-wrap gap-3">
            {request.status === 'new' && (
              <button type="submit" name="status" value="contacted" disabled={pending} className={primaryButton}>
                {pending ? 'שומרים…' : 'חזרנו אליהם'}
              </button>
            )}
            <button
              type="submit"
              name="status"
              value="closed"
              disabled={pending}
              className={request.status === 'new' ? outlineButton : primaryButton}
            >
              {pending && request.status === 'contacted' ? 'שומרים…' : 'לסגור את הפנייה'}
            </button>
          </div>
          <p className="text-[13px] text-ink-soft">
            פנייה שנסגרה יורדת מהרשימה, ונמחקת כולה 12 חודשים אחרי הסגירה. כל שינוי נרשם ביומן.
          </p>
          {state.status === 'error' && (
            <p role="alert" className="font-bold">
              {state.message}
            </p>
          )}
        </form>
      </div>
    </article>
  );
}
