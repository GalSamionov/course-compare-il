'use client';

import { useActionState, useId, useState } from 'react';
import type { DecisionState } from '@/app/admin/actions';
import { decideJoinRequest } from '@/app/admin/course-actions';
import type { InstitutionOption, JoinRequest } from '@/lib/admin/course-queue';
import { control, fieldLabel, outlineButton, primaryButton } from './controls';
import { PageLink } from './page-link';
import { useLogDecision } from './decision-log';
import { dateTimeLabel } from './format';

const IDLE: DecisionState = { status: 'idle' };

/**
 * בקשה של מוסד (/institutions/join): מה המוסד כתב, ולאיזה מוסד במסד לשייך את הקישור.
 * ההצעה היא המוסד שהאתר שלו באותו מארח. גל בוחר, והמסד בודק שוב שהקישור באתר של מי שנבחר.
 * המייל פרטי: מוצג רק כאן, למנהל, כדי לחזור למוסד.
 */
export function JoinRequestItem({ request, institutions }: { request: JoinRequest; institutions: InstitutionOption[] }) {
  const logDecision = useLogDecision();
  const [institutionId, setInstitutionId] = useState(request.suggestedInstitutionId ?? '');
  const [state, dispatch, pending] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await decideJoinRequest(previous, form);
    if (result.status === 'done') logDecision({ id: `request:${request.id}`, title: request.institutionName, message: result.message });
    return result;
  }, IDLE);
  const headingId = `jr-${request.id}`;
  const selectId = useId();
  const hintId = useId();
  const chosen = institutions.find((i) => i.id === institutionId) ?? null;
  const hostMismatch = chosen !== null && chosen.host !== request.host;

  return (
    <article aria-labelledby={headingId} className="border-t border-rule py-6 lg:py-8">
      <header>
        <h3 id={headingId} className="text-[21px] leading-snug font-bold text-balance">
          {request.institutionName}
        </h3>
        <p className="mt-1 font-sans text-[13px] leading-normal text-ink-soft">
          בקשה מהטופס למוסדות · נשלחה {dateTimeLabel(request.createdAt)}
        </p>
      </header>
      <div className="mt-5 grid gap-8 font-sans lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <dl className="min-w-0 space-y-3 text-[15px] leading-normal">
          <div>
            <dt className="text-[13px] text-ink-soft">דף הקורס</dt>
            <dd>
              <PageLink url={request.courseUrl} />
              {request.knownPage && <span className="block font-bold">הקישור כבר מוכר לאוסף או לקורס באתר.</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-soft">מייל לחזרה (רק כאן, לא באתר)</dt>
            <dd>
              {request.contactEmail ? (
                <a
                  // מקודד, גם אם משהו עקף את הבדיקה: ? או & היו מוסיפים לקישור נושא וגוף שהשולח בחר.
                  href={`mailto:${encodeURIComponent(request.contactEmail)}`}
                  className="inline-flex min-h-11 max-w-full items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover"
                >
                  <bdi dir="ltr" className="truncate">
                    {request.contactEmail}
                  </bdi>
                </a>
              ) : (
                <span className="text-ink-soft">נמחק</span>
              )}
            </dd>
          </div>
        </dl>

        <form action={dispatch} aria-label={`החלטה: ${request.institutionName}`} className="min-w-0 space-y-3 text-[15px] leading-normal">
          <input type="hidden" name="requestId" value={request.id} />
          <div>
            <label htmlFor={selectId} className={fieldLabel}>
              המוסד במסד
            </label>
            <select
              id={selectId}
              name="institutionId"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              aria-describedby={hintId}
              className={control}
            >
              <option value="">לבחור מוסד</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.host ? ` · ${i.host}` : ''}
                </option>
              ))}
            </select>
            <span id={hintId} className="mt-1 block text-[13px]">
              {request.suggestedInstitutionId === null ? (
                <strong className="font-bold">
                  אף מוסד במסד לא על <bdi dir="ltr">{request.host}</bdi>. כדי לאשר, קודם מוסיפים אותו לטבלת institutions, עם
                  האתר שלו.
                </strong>
              ) : hostMismatch ? (
                <strong className="font-bold">
                  האתר של המוסד שנבחר הוא <bdi dir="ltr">{chosen.host}</bdi>, והקישור ב-<bdi dir="ltr">{request.host}</bdi>. המסד לא
                  יקבל את זה.
                </strong>
              ) : (
                <span className="text-ink-soft">ההצעה: המוסד שהאתר שלו באותו מארח כמו הקישור.</span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="decision"
              value="approve"
              disabled={pending || institutionId === ''}
              className={primaryButton}
            >
              {pending ? 'שומרים…' : 'לאשר ולהכניס לאוסף'}
            </button>
            <button type="submit" name="decision" value="reject" disabled={pending} className={outlineButton}>
              לדחות
            </button>
          </div>
          <p className="text-[13px] text-ink-soft">
            אחרי אישור הקישור נקרא בכל ריצה של האוסף, אם המוסד ב-<bdi dir="ltr">scraper/institutions.yaml</bdi>. קורס חדש מגיע
            לתור הזה, לאישור.
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
