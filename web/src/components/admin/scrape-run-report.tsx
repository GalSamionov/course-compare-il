import type { ScrapeRunReport } from '@/lib/admin/course-queue';
import { counted, dateTimeLabel } from './format';

const STATUS_LABEL: Record<ScrapeRunReport['status'], string> = {
  running: 'רצה עכשיו',
  completed: 'הסתיימה',
  aborted: 'נעצרה בלי לשנות כלום',
  failed: 'נכשלה באמצע הכתיבה',
};

const TRIGGER_LABEL: Record<string, string> = { schedule: 'השבועית', manual: 'הידנית', local: 'המקומית' };

/** "ואחד נכשל", "ו-3 נכשלו": ו' החיבור צמודה למילה, ועם מקף לפני ספרה. */
const andCounted = (n: number, one: string, many: string) => (n === 1 ? `ו${one}` : `ו-${counted(n, one, many)}`);

/**
 * דוח הריצה האחרונה של האוסף (מסמך העיצוב, סעיף 5, "סיכום הריצה"): כמה דפים נבדקו, כמה השתנו, כמה נכשלו.
 * משפט של מספרים בדיו, ולא כרטיסי מונה (חוזה התור, OWN-WORLD). הפירוט לפי מוסד מקופל.
 */
export function ScrapeRunReportView({ run }: { run: ScrapeRunReport | null }) {
  if (!run) {
    return (
      <div className="mt-4 max-w-[68ch] font-sans text-[15px] leading-normal">
        <p className="font-semibold">האוסף עוד לא רץ על המסד הזה.</p>
        <p className="text-ink-soft">
          הוא רץ פעם בשבוע, רק על מוסדות שב-<bdi dir="ltr">scraper/institutions.yaml</bdi>.
        </p>
      </div>
    );
  }
  const changed = run.pagesChanged + run.pagesNew;
  const problems = run.institutions.filter((i) => i.errors.length > 0);
  return (
    <div className="mt-4 max-w-[68ch] font-sans text-[15px] leading-normal tabular-nums">
      <p>
        <span className="font-semibold">
          {['הריצה', TRIGGER_LABEL[run.trigger], 'האחרונה'].filter(Boolean).join(' ')}, {dateTimeLabel(run.startedAt)},{' '}
          {STATUS_LABEL[run.status]}:
        </span>{' '}
        {counted(run.pagesChecked, 'דף אחד נבדק', 'דפים נבדקו')}, {counted(changed, 'אחד השתנה', 'השתנו')}
        {run.pagesNew > 0 && ` (${counted(run.pagesNew, 'אחד מהם חדש', 'מהם חדשים')})`},{' '}
        {andCounted(run.pagesFailed, 'אחד נכשל', 'נכשלו')}.
      </p>
      <p className="text-ink-soft">
        {counted(run.changesAuto, 'שינוי אחד עלה לבד', 'שינויים עלו לבד')}, {counted(run.changesQueued, 'אחד נכנס לתור', 'נכנסו לתור')}
        {run.coursesMissing > 0 && `, ${andCounted(run.coursesMissing, 'קורס אחד סומן', 'קורסים סומנו')} "ייתכן שאינו פעיל"`}.
        {run.pagesSkipped > 0 && (
          <>
            {' '}
            {counted(run.pagesSkipped, 'דף אחד דולג', 'דפים דולגו')}: <bdi dir="ltr">robots.txt</bdi> אוסר, או שהקורס נדחה בתור.
          </>
        )}
      </p>
      {run.abortReason && (
        <p className="mt-1 font-bold">
          למה: <bdi dir="ltr">{run.abortReason}</bdi>
        </p>
      )}
      {(run.institutions.length > 0 || run.skipped.length > 0) && (
        <details className="mt-2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold underline decoration-1 underline-offset-[3px] hover:text-link-hover">
            לפי מוסד{problems.length > 0 && `, ${counted(problems.length, 'אחד עם תקלות', 'עם תקלות')}`}
          </summary>
          <ul className="mt-1 space-y-2 text-[13px] leading-normal">
            {run.institutions.map((i) => (
              <li key={i.slug}>
                <bdi dir="ltr" className="font-semibold">
                  {i.slug}
                </bdi>
                <span className="block text-ink-soft">
                  {[
                    i.discovered !== null && counted(i.discovered, 'דף אחד נמצא', 'דפים נמצאו'),
                    i.checked !== null && counted(i.checked, 'אחד נבדק', 'נבדקו'),
                    i.failed !== null && counted(i.failed, 'אחד נכשל', 'נכשלו'),
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
                {i.errors.length > 0 && (
                  <ul className="mt-0.5 list-disc ps-5 font-bold">
                    {i.errors.slice(0, 5).map((e) => (
                      <li key={e}>
                        <bdi dir="ltr">{e}</bdi>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {run.skipped.map((s) => (
              <li key={s.slug}>
                <bdi dir="ltr" className="font-semibold">
                  {s.slug}
                </bdi>
                <span className="block font-bold">
                  דולג: <bdi dir="ltr">{s.reason}</bdi>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
