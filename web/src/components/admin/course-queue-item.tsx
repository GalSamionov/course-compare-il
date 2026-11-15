import Link from 'next/link';
import { Claim } from '@/components/course/marks';
import {
  COURSE_FIELDS,
  displayValue,
  editText,
  fieldLabel,
  priceChange,
  reasonText,
  syllabusTitles,
} from '@/lib/admin/course-fields';
import type { CourseQueueItem } from '@/lib/admin/course-queue';
import type { Json } from '@/lib/database.types';
import { CourseDecideForm, type EditSpec } from './course-decide-form';
import { textLink } from './controls';
import { dateTimeLabel } from './format';
import { PageLink, shortUrl } from './page-link';

const KIND_LABEL: Record<CourseQueueItem['kind'], string> = {
  field: 'שינוי בשדה',
  new_course: 'קורס חדש',
  maybe_inactive: 'ייתכן שאינו פעיל',
  fetch_failed: 'הדף לא נטען',
};

const CONFIDENCE_LABEL: Record<string, string> = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' };

const same = (a: Json | null | undefined, b: Json | null | undefined) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** ערך אחד בהשוואה: התווית מעליו, באותו צד (DESIGN.md, The Not A Menu Rule). */
function Value({ label, text, strong, extra }: { label: string; text: string | null; strong?: boolean; extra?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] text-ink-soft">{label}</p>
      <p className={`mt-0.5 text-[17px] leading-snug [overflow-wrap:anywhere] ${strong ? 'font-bold' : 'font-semibold'}`}>
        {text ?? <span className="font-normal text-ink-soft">ריק</span>}
        {/* הרווח מחוץ ל-bdi: בתוכו ms היא שמאל, והרווח צריך להיות בין המחיר לאחוז. */}
        {extra && (
          <span className="ms-2 text-[15px] font-semibold tabular-nums">
            <bdi dir="ltr">{extra}</bdi>
          </span>
        )}
      </p>
    </div>
  );
}

/** סילבוס: נושא בכל שורה. מה שנוסף מודגש, ומה שירד מחוק, כדי שגל יראה מה השתנה ולא רק שני גושים של טקסט. */
function SyllabusDiff({ label, list, other, mode }: { label: string; list: string[]; other: string[]; mode: 'old' | 'new' }) {
  const otherSet = new Set(other);
  return (
    <div className="min-w-0">
      <p className="text-[13px] text-ink-soft">{label}</p>
      {list.length === 0 ? (
        <p className="mt-0.5 text-ink-soft">ריק</p>
      ) : (
        <ol className="mt-1 list-decimal space-y-0.5 ps-5 text-[15px] leading-snug">
          {list.map((t, i) => {
            const changed = !otherSet.has(t);
            return (
              <li key={`${i}-${t}`} className={changed ? (mode === 'new' ? 'font-bold' : 'line-through decoration-1') : undefined}>
                {changed && <span className="sr-only">{mode === 'new' ? 'נוסף: ' : 'ירד: '}</span>}
                {t}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** הסיבות, ורמת הביטחון בתוך "המודל לא היה בטוח" (ולא בשורה נוספת שחוזרת על אותו דבר). */
function Reasons({ reasons, confidence }: { reasons: string[]; confidence: string | null }) {
  const level = confidence && confidence !== 'high' ? (CONFIDENCE_LABEL[confidence] ?? confidence) : null;
  const lines = reasons.map((r) => (r === 'low_confidence' && level ? `${reasonText(r)} (ביטחון ${level})` : reasonText(r)));
  if (level && !reasons.includes('low_confidence')) lines.push(`ביטחון המודל: ${level}`);
  if (lines.length === 0) return null;
  return (
    <div className="mt-4 text-[15px] leading-normal font-bold">
      <p>למה בתור:</p>
      <ul className="mt-1 list-disc space-y-0.5 ps-5">
        {[...new Set(lines)].map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

function Quote({ quote, pageUrl }: { quote: string | null; pageUrl: string | null }) {
  if (!quote && !pageUrl) return null;
  return (
    <figure className="mt-4 max-w-[68ch]">
      <figcaption className="text-[13px] text-ink-soft">{quote ? 'המשפט מהדף של המוסד' : 'הדף של המוסד'}</figcaption>
      {quote && (
        <blockquote className="mt-1 text-[15px] leading-relaxed lg:text-base">
          <Claim>{quote}</Claim>
        </blockquote>
      )}
      {pageUrl && <PageLink url={pageUrl} />}
    </figure>
  );
}

/** שינוי בשדה: מה באתר עכשיו מול מה בדף. "עכשיו" נקרא מהקורס ברגע הטעינה, כי גל אולי תיקן בינתיים. */
function FieldChange({ item }: { item: CourseQueueItem }) {
  const field = item.field!;
  const label = fieldLabel(field);
  const changedSince = !same(item.currentValue, item.oldValue);
  const isSyllabus = COURSE_FIELDS[field]?.kind === 'syllabus';
  return (
    <>
      <p className="text-[15px] font-bold">{label}</p>
      {isSyllabus ? (
        <div className="mt-2 grid max-w-[720px] gap-x-8 gap-y-4 sm:grid-cols-2">
          <SyllabusDiff label="באתר עכשיו" list={syllabusTitles(item.currentValue)} other={syllabusTitles(item.newValue)} mode="old" />
          <SyllabusDiff label="בדף המוסד" list={syllabusTitles(item.newValue)} other={syllabusTitles(item.currentValue)} mode="new" />
        </div>
      ) : (
        <div className="mt-2 grid max-w-[620px] gap-x-8 gap-y-3 sm:grid-cols-2">
          <Value label="באתר עכשיו" text={displayValue(field, item.currentValue)} />
          <Value
            label="בדף המוסד"
            text={displayValue(field, item.newValue)}
            strong
            extra={field === 'site_price_ils' ? priceChange(item.currentValue, item.newValue) : null}
          />
        </div>
      )}
      {changedSince && (
        <p className="mt-2 text-[15px] font-bold">
          הערך באתר השתנה מאז שהאוסף קרא אותו. האוסף ראה: {displayValue(field, item.oldValue) ?? 'ריק'}.
        </p>
      )}
      <Quote quote={item.quote} pageUrl={item.pageUrl} />
    </>
  );
}

/** קורס חדש: כל שדה שהאוסף קרא, עם המשפט מהדף. שדה עם סימון לא נכנס לטיוטה (decide.py, _reasons). */
function NewCourse({ item }: { item: CourseQueueItem }) {
  const fields = item.newFields.filter((f) => f.field !== 'title');
  return (
    <>
      <p className="text-[15px] leading-normal">
        האוסף מצא דף חדש באתר של {item.course?.institutionName || 'המוסד'}
        {item.course?.categoryName && `, בתחום ${item.course.categoryName}`}. הקורס שמור כטיוטה, שהציבור לא רואה.
      </p>
      {item.pageUrl && (
        <p className="mt-1">
          <PageLink url={item.pageUrl} />
        </p>
      )}
      {fields.length > 0 && (
        <dl className="mt-4 grid max-w-[760px] gap-x-8 gap-y-3 border-t border-rule pt-3 sm:grid-cols-2">
          {fields.map((f) => {
            const marked = f.issues.length > 0 || (f.confidence !== null && f.confidence !== 'high');
            return (
              <div key={f.field} className={COURSE_FIELDS[f.field]?.kind === 'syllabus' ? 'sm:col-span-2' : undefined}>
                <dt className="text-[13px] text-ink-soft">{fieldLabel(f.field)}</dt>
                <dd className="mt-0.5">
                  <p className="text-[15px] font-semibold [overflow-wrap:anywhere]">
                    {displayValue(f.field, f.value) ?? <span className="font-normal text-ink-soft">ריק</span>}
                  </p>
                  {f.quote && (
                    <p className="mt-0.5 text-[13px] leading-normal">
                      <Claim>{f.quote}</Claim>
                    </p>
                  )}
                  {marked && (
                    <p className="mt-0.5 text-[13px] font-bold">
                      לא נכנס לקורס:{' '}
                      {[
                        ...f.issues.map(reasonText),
                        ...(f.confidence && f.confidence !== 'high' ? [`ביטחון ${CONFIDENCE_LABEL[f.confidence] ?? f.confidence}`] : []),
                      ].join(', ')}
                    </p>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </>
  );
}

function decisionCopy(item: CourseQueueItem): { approve: string; reject: string | null; hint: string } {
  switch (item.kind) {
    case 'new_course':
      return {
        approve: 'לפרסם',
        reject: 'לדחות',
        hint: 'פרסום מעלה את הקורס לקטלוג, עם השדות שנכנסו. דחייה משאירה אותו טיוטה, והדף לא ייקרא יותר.',
      };
    case 'maybe_inactive':
      return {
        approve: 'להסיר מהקטלוג',
        reject: 'עדיין פעיל',
        hint: 'הסרה משאירה את העמוד בכתובת שלו, עם "הקורס כבר לא מוצע". "עדיין פעיל" מחזיר אותו לקטלוג.',
      };
    case 'fetch_failed':
      return { approve: 'ראיתי', reject: null, hint: 'הדף ממשיך להיבדק כל שבוע. אם הוא עבר לכתובת אחרת, מעדכנים אותה במוסד.' };
    default:
      return { approve: 'לאשר', reject: 'לדחות', hint: 'אישור מעלה את הערך מהדף לאתר. דחייה משאירה את מה שבאתר.' };
  }
}

function editSpec(item: CourseQueueItem): EditSpec | null {
  if (item.kind !== 'field' || !item.field) return null;
  const spec = COURSE_FIELDS[item.field];
  if (!spec) return null;
  const picked = Array.isArray(item.newValue) ? item.newValue.map(String) : [];
  return {
    label: spec.label,
    kind: spec.kind,
    text: editText(item.field, item.newValue),
    maxChars: spec.maxChars,
    choices: spec.choices?.map((value) => ({ value, label: spec.choiceLabel?.[value] ?? value, checked: picked.includes(value) })),
  };
}

export function CourseQueueItemView({ item }: { item: CourseQueueItem }) {
  const headingId = `cq-${item.id}`;
  const course = item.course;
  const title = course?.title || (item.pageUrl ? shortUrl(item.pageUrl) : 'דף בלי קורס');
  // עמוד הקורס קיים לציבור רק כשהקורס לא טיוטה.
  const courseHref = course && course.status !== 'draft' ? `/courses/${course.slug}` : null;
  const copy = decisionCopy(item);
  return (
    <article aria-labelledby={headingId} data-anim="ink" className="border-t border-rule py-6 lg:py-8">
      <header>
        <h3 id={headingId} className="text-[21px] leading-snug font-bold text-balance">
          {courseHref ? (
            <Link href={courseHref} className={`${textLink} decoration-1`}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <p className="mt-1 font-sans text-[13px] leading-normal text-ink-soft">
          {[course?.institutionName, course?.categoryName, KIND_LABEL[item.kind], `נכנס לתור ${dateTimeLabel(item.createdAt)}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </header>
      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <section aria-label="מה השתנה" className="min-w-0 font-sans">
          {item.kind === 'field' && <FieldChange item={item} />}
          {item.kind === 'new_course' && <NewCourse item={item} />}
          {item.kind === 'maybe_inactive' && (
            <>
              <p className="text-[15px] leading-normal">
                הקורס מסומן באתר &quot;ייתכן שאינו פעיל&quot; עד שמחליטים.
              </p>
              {item.pageUrl && (
                <p className="mt-1">
                  <PageLink url={item.pageUrl} />
                </p>
              )}
            </>
          )}
          {item.kind === 'fetch_failed' && (
            <>
              {item.pageUrl && <PageLink url={item.pageUrl} />}
              {item.pageError && (
                <p className="mt-1 text-[13px] text-ink-soft">
                  השגיאה האחרונה: <bdi dir="ltr">{item.pageError}</bdi>
                </p>
              )}
            </>
          )}
          <Reasons reasons={item.kind === 'fetch_failed' ? item.reasons.slice(0, 1) : item.reasons} confidence={item.confidence} />
        </section>
        <section aria-label="ההחלטה" className="min-w-0">
          <CourseDecideForm
            queueId={item.id}
            title={title}
            courseHref={courseHref ?? (item.kind === 'new_course' && course ? `/courses/${course.slug}` : null)}
            approveLabel={copy.approve}
            rejectLabel={copy.reject}
            hint={copy.hint}
            edit={editSpec(item)}
          />
        </section>
      </div>
    </article>
  );
}
