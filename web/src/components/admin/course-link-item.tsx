'use client';

import { useActionState, useId, useState } from 'react';
import type { DecisionState } from '@/app/admin/actions';
import { decideCourseLink } from '@/app/admin/link-actions';
import type { CourseLinkItem, LinkChoices } from '@/lib/admin/course-links';
import { COURSE_KINDS } from '@/lib/course-links/form';
import { control, fieldLabel, outlineButton, primaryButton, textArea, textLink } from './controls';
import { useLogDecision } from './decision-log';
import { counted, dateTimeLabel } from './format';
import { PageLink } from './page-link';

const IDLE: DecisionState = { status: 'idle' };

const KIND_LABEL: Record<string, string> = {
  independent: 'מרצה או עסק עצמאי',
  school: 'בית ספר',
  college: 'מכללה',
  university: 'אוניברסיטה',
  other: 'מוסד לימודים אחר',
};
const WHY_LABEL = { url: 'אותו קישור', title: 'אותו שם', institution: 'אותו מוסד' } as const;
const typeLabel = (type: string | null) => COURSE_KINDS.find((k) => k.value === type)?.label ?? 'לא ידוע';

/** מה קורה עם הביקורת של הבוגר על הטיוטה. */
function reviewsLine(reviews: CourseLinkItem['reviews']): string {
  const parts: string[] = [];
  if (reviews.pending) parts.push(`${counted(reviews.pending, 'ביקורת אחת ממתינה', 'ביקורות ממתינות')} לאימות, בתור הביקורות`);
  if (reviews.published) parts.push(`${counted(reviews.published, 'ביקורת אחת כבר אומתה', 'ביקורות כבר אומתו')}, ותעלה עם הקורס`);
  if (reviews.draft) parts.push(reviews.draft === 1 ? 'טיוטה אחת שעוד לא נשלחה' : `${counted(reviews.draft, '', 'טיוטות')} שעוד לא נשלחו`);
  return parts.length > 0 ? `${parts.join('. ')}.` : 'עוד אין ביקורת.';
}

/**
 * קורס מקישור: קורס חדש מבוגר (טיוטה, עם הביקורת שלו), או בקשה מ-/request-course. מה שאנשים כתבו משמאל,
 * וההחלטה מימין, כמו בבקשה של מוסד (join-request-item.tsx).
 * אישור: הקורס עולה עם התחום, השם והמוסד שבטופס, והקישור נכנס לאוסף (לא רשת חברתית). מיזוג: לקורס שכבר באתר.
 * דחייה: עם סיבה, שהבוגר רואה. כל אחת בשורה ב-audit_log.
 */
export function CourseLinkItemView({ item, choices }: { item: CourseLinkItem; choices: LinkChoices }) {
  const logDecision = useLogDecision();
  const fromGraduate = item.source === 'review';
  const title = item.courseTitle || (fromGraduate ? 'קורס בלי שם' : 'קישור בלי שם');
  const [state, dispatch, pending] = useActionState(async (previous: DecisionState, form: FormData) => {
    const result = await decideCourseLink(previous, form);
    if (result.status === 'done') {
      logDecision({ id: `link:${item.id}`, title, message: result.message, warning: result.warning });
    }
    return result;
  }, IDLE);
  const [reason, setReason] = useState('');
  const [institutionId, setInstitutionId] = useState(fromGraduate ? '' : (item.suggestedInstitutionId ?? ''));
  const [target, setTarget] = useState(item.candidates[0]?.why === 'url' ? item.candidates[0].courseId : '');
  const [targetSlug, setTargetSlug] = useState('');
  const ids = {
    title: useId(),
    category: useId(),
    institution: useId(),
    institutionName: useId(),
    kind: useId(),
    target: useId(),
    targetSlug: useId(),
    reason: useId(),
    reasonHint: useId(),
  };
  const headingId = `cl-${item.id}`;
  const hasReviews = Object.values(item.reviews).some((n) => (n ?? 0) > 0);
  // הבוגר כבר ענה על השאלון של הסוג שבחר: רק תחומים מאותו סוג (המסד בודק את זה שוב).
  const categories = hasReviews && item.courseType ? choices.categories.filter((c) => c.courseType === item.courseType) : choices.categories;
  const needsCategory = fromGraduate && !item.categoryId;
  const [category, setCategory] = useState(item.categoryId ?? '');
  // בקשה לרשת חברתית לא נכנסת לאוסף, ולכן אין צורך במוסד.
  const asksInstitution = fromGraduate ? item.institutionIsNew : !item.isSocial;
  const newInstitution = asksInstitution && institutionId === '';

  return (
    <article aria-labelledby={headingId} className="border-t border-rule py-6 lg:py-8">
      <header>
        <h3 id={headingId} className="text-[21px] leading-snug font-bold text-balance">
          {title}
        </h3>
        <p className="mt-1 font-sans text-[13px] leading-normal text-ink-soft">
          {fromGraduate ? 'קורס חדש מבוגר' : 'בקשה לבדוק קורס'} · {fromGraduate ? 'נשלח' : 'נשלחה'} {dateTimeLabel(item.createdAt)}
          {fromGraduate && item.submitters > 1 && ` · ${item.submitters} בוגרים הוסיפו אותו`}
        </p>
      </header>

      <div className="mt-5 grid gap-8 font-sans lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
        <dl className="min-w-0 space-y-3 text-[15px] leading-normal">
          <div>
            <dt className="text-[13px] text-ink-soft">הקישור</dt>
            <dd>
              <PageLink url={item.url} />
              {item.isSocial && (
                <span className="block font-bold">רשת חברתית: האוסף לא יקרא את הדף. את הפרטים ממלאים ידנית.</span>
              )}
              {item.knownPage && <span className="block font-bold">הקישור כבר בדפים של האוסף.</span>}
            </dd>
          </div>
          {fromGraduate && (
            <>
              <div>
                <dt className="text-[13px] text-ink-soft">מי מלמד</dt>
                <dd>
                  {item.institutionName}
                  <span className="text-ink-soft">
                    {item.institutionIsNew
                      ? ` · חדש, ${KIND_LABEL[item.institutionKind ?? 'independent'] ?? ''}, עוד לא באתר`
                      : ' · כבר במסד'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-soft">תחום</dt>
                <dd>
                  {item.categoryName ?? (
                    <>
                      <strong className="font-bold">אין.</strong> הבוגר בחר: {typeLabel(item.courseType)}
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-ink-soft">הביקורת</dt>
                <dd>
                  {reviewsLine(item.reviews)}{' '}
                  {item.reviews.pending ? (
                    <a href="#reviews" className={textLink}>
                      לביקורות לאימות
                    </a>
                  ) : null}
                </dd>
              </div>
            </>
          )}
          {item.note && (
            <div>
              <dt className="text-[13px] text-ink-soft">הערה (רק כאן, לא באתר)</dt>
              <dd className="max-w-[60ch] whitespace-pre-line">{item.note}</dd>
            </div>
          )}
          <div>
            <dt className="text-[13px] text-ink-soft">אולי כבר באתר</dt>
            <dd>
              {item.candidates.length === 0 ? (
                <span className="text-ink-soft">לא מצאנו קורס דומה.</span>
              ) : (
                <ul className="space-y-1">
                  {item.candidates.map((c) => (
                    <li key={c.courseId}>
                      <a href={`/courses/${c.slug}`} target="_blank" rel="noopener" className={textLink}>
                        {c.title}
                      </a>
                      <span className="text-ink-soft">
                        {' '}
                        · {c.institution} · {WHY_LABEL[c.why]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>

        <form action={dispatch} aria-label={`החלטה: ${title}`} className="min-w-0 space-y-4 text-[15px] leading-normal">
          <input type="hidden" name="submissionId" value={item.id} />

          <fieldset className="space-y-3">
            <legend className="font-bold">לאשר</legend>
            {fromGraduate && (
              <>
                <div>
                  <label htmlFor={ids.title} className={fieldLabel}>
                    שם הקורס באתר
                  </label>
                  <input id={ids.title} name="title" defaultValue={item.courseTitle} maxLength={160} className={control} />
                </div>
                <div>
                  <label htmlFor={ids.category} className={fieldLabel}>
                    תחום{needsCategory ? ' (חובה)' : ''}
                  </label>
                  <select
                    id={ids.category}
                    name="categoryId"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={control}
                  >
                    <option value="">{needsCategory ? 'לבחור תחום' : 'בלי שינוי'}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            {asksInstitution && (
              <div>
                <label htmlFor={ids.institution} className={fieldLabel}>
                  {fromGraduate ? 'מוסד שכבר במסד (לא חובה)' : 'המוסד במסד'}
                </label>
                <select
                  id={ids.institution}
                  name="institutionId"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  className={control}
                >
                  <option value="">{fromGraduate ? 'לא, זה מרצה חדש' : 'מרצה חדש'}</option>
                  {choices.institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {newInstitution && (
              <>
                <div>
                  <label htmlFor={ids.institutionName} className={fieldLabel}>
                    שם המרצה או המוסד באתר
                  </label>
                  <input
                    id={ids.institutionName}
                    name="institutionName"
                    defaultValue={fromGraduate ? (item.institutionName ?? '') : item.courseTitle}
                    maxLength={120}
                    className={control}
                  />
                </div>
                <div>
                  <label htmlFor={ids.kind} className={fieldLabel}>
                    סוג
                  </label>
                  <select id={ids.kind} name="institutionKind" defaultValue={item.institutionKind ?? 'independent'} className={control}>
                    {Object.entries(KIND_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <button
              type="submit"
              name="decision"
              value="approve"
              disabled={pending || (needsCategory && category === '')}
              className={primaryButton}
            >
              {pending ? 'שומרים…' : fromGraduate ? 'לאשר ולפרסם' : item.isSocial ? 'לאשר (בלי אוסף)' : 'לאשר ולהכניס לאוסף'}
            </button>
            <p className="text-[13px] text-ink-soft">
              {item.isSocial
                ? 'קישור לרשת חברתית לא נכנס לאוסף אף פעם.'
                : (
                  <>
                    הקישור נכנס לאוסף כמו בקשה של מוסד, ונקרא אם המוסד ב-<bdi dir="ltr">scraper/institutions.yaml</bdi> והקישור
                    באתר שלו.
                  </>
                )}
            </p>
          </fieldset>

          <fieldset className="space-y-3 border-t border-rule pt-4">
            <legend className="sr-only">כבר באתר: למזג</legend>
            <p aria-hidden="true" className="font-bold">
              כבר באתר: למזג
            </p>
            <div>
              <label htmlFor={ids.target} className={fieldLabel}>
                הקורס שכבר באתר
              </label>
              <select id={ids.target} name="targetCourseId" value={target} onChange={(e) => setTarget(e.target.value)} className={control}>
                <option value="">לבחור</option>
                {item.candidates.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.title} · {c.institution}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.targetSlug} className={fieldLabel}>
                או slug של קורס אחר
              </label>
              <input
                id={ids.targetSlug}
                name="targetSlug"
                dir="ltr"
                value={targetSlug}
                onChange={(e) => setTargetSlug(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className={control}
              />
            </div>
            <button
              type="submit"
              name="decision"
              value="merge"
              disabled={pending || (target === '' && targetSlug.trim() === '')}
              className={outlineButton}
            >
              למזג
            </button>
            {fromGraduate && <p className="text-[13px] text-ink-soft">הביקורות של הבוגרים עוברות לקורס שנבחר, והטיוטה נמחקת.</p>}
          </fieldset>

          <fieldset className="space-y-3 border-t border-rule pt-4">
            <legend className="sr-only">לדחות</legend>
            <p aria-hidden="true" className="font-bold">
              לדחות
            </p>
            <div>
              <label htmlFor={ids.reason} className={fieldLabel}>
                הסיבה
              </label>
              <textarea
                id={ids.reason}
                name="reason"
                rows={2}
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-describedby={ids.reasonHint}
                className={textArea}
              />
              <span id={ids.reasonHint} className="mt-1 block text-[13px] text-ink-soft">
                {fromGraduate ? 'הבוגר רואה אותה בעמוד הכתיבה. בלי פרטים של אנשים.' : 'רק כאן. אף אחד אחר לא רואה אותה.'}
              </span>
            </div>
            <button type="submit" name="decision" value="reject" disabled={pending || reason.trim() === ''} className={outlineButton}>
              לדחות
            </button>
          </fieldset>

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
