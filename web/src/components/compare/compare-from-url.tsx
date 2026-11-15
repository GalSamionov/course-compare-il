'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PenNote } from '@/components/course/marks';
import { ShareLinks } from '@/components/course/share-links';
import { SourceLegend } from '@/components/course/source-legend';
import { MAX_COMPARE } from '@/lib/account/lists';
import { toggleCompare, useAccount } from '@/lib/account/store';
import { COMPARE_PARAM, compareHref, parseCompareParam, pickCompared, slotsLeftText } from '@/lib/compare/param';
import { buildCompareRows, type CompareCourse } from '@/lib/compare/rows';
import { compareShareMessage } from '@/lib/og/share-text';
import { CompareShelf } from './compare-shelf';
import { CompareTable } from './compare-table';

type Props = { courses: readonly CompareCourse[]; siteUrl: string };
type Note = 'full' | 'error' | null;

const textLink = 'underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover';
/** קישור בתוך שורה, עם יעד מגע של 44 פיקסלים בלי להגדיל את השורה. */
const inlineLink = `${textLink} -my-3 inline-flex min-h-11 items-center`;

/**
 * ההשוואה, מהכתובת או מהמגש. חייבת להיות בתוך <Suspense>: בדף שנבנה מראש,
 * useSearchParams ידוע רק בדפדפן (use-search-params.md, "Prerendering"), כמו במחברת.
 * - ?c=slug1,slug2: קישור ששיתפו. הוא גובר על המגש.
 * - בלי c: המגש. בדפדפן למי שלא התחבר, ובחשבון למי שהתחבר.
 * key לפי המצב: כשעוברים מקישור למגש, הרשימה של מה שהוצא מתחילה מחדש.
 */
export function CompareFromUrl({ courses, siteUrl }: Props) {
  const params = useSearchParams();
  const account = useAccount();
  const fromLink = params.has(COMPARE_PARAM);

  if (!fromLink && account.status === 'loading') {
    return (
      <p role="status" className="mt-6 font-sans text-[15px] text-ink-soft">
        טוענים את ההשוואה שלכם
      </p>
    );
  }
  if (!fromLink && account.status === 'error') {
    return (
      <p role="alert" className="mt-6 font-sans text-[15px] font-bold">
        לא הצלחנו לטעון את ההשוואה. נסו לרענן את הדף.
      </p>
    );
  }

  const trayIds =
    account.status === 'signed-in'
      ? account.compare.map((slot) => slot.courseId)
      : account.status === 'signed-out'
        ? account.compare
        : [];
  const { chosen, missing } = fromLink
    ? pickCompared(courses, { slugs: parseCompareParam(params.get(COMPARE_PARAM)) })
    : pickCompared(courses, { ids: trayIds });
  const savedIds = account.status === 'signed-in' ? account.saved : [];

  return (
    <CompareView
      key={fromLink ? 'link' : 'tray'}
      courses={courses}
      siteUrl={siteUrl}
      fromLink={fromLink}
      chosen={chosen}
      missing={missing}
      savedIds={savedIds}
      hasTray={trayIds.length > 0}
    />
  );
}

function CompareView({
  courses,
  siteUrl,
  fromLink,
  chosen,
  missing,
  savedIds,
  hasTray,
}: Props & {
  fromLink: boolean;
  chosen: CompareCourse[];
  /** slug מהקישור, או מזהה מהמגש, של קורס שכבר לא בקטלוג. */
  missing: string[];
  savedIds: readonly string[];
  /** למבקר יש השוואה משלו (במגש). רק אז יש טעם לכתוב שהיא לא השתנתה ולקשר אליה. */
  hasTray: boolean;
}) {
  /** ה-slug של כל קורס שהוצא בביקור הזה, האחרון ראשון. */
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);

  const chosenIds = new Set(chosen.map((c) => c.id));
  const removedCourses = removed.flatMap((slug) => courses.find((c) => c.slug === slug && !chosenIds.has(c.id)) ?? []);
  const removedIds = new Set(removedCourses.map((c) => c.id));
  const saved = savedIds.flatMap((id) =>
    chosenIds.has(id) || removedIds.has(id) ? [] : (courses.find((c) => c.id === id) ?? []),
  );
  const full = chosen.length >= MAX_COMPARE;
  /** קישור שאף קורס ממנו לא בהשוואה: שורה מודגשת אחת אומרת למה, בלי הערות נוספות מעליה. */
  const emptyLink = fromLink && chosen.length === 0;

  /** במצב קישור: הכתובת היא מקור האמת. replaceState מעדכן את useSearchParams בלי בקשה לשרת. */
  function writeLink(slugs: string[]) {
    window.history.replaceState(null, '', compareHref(slugs));
  }

  async function remove(course: CompareCourse) {
    setNote(null);
    if (fromLink) {
      writeLink(chosen.filter((c) => c.id !== course.id).map((c) => c.slug));
    } else {
      setBusy(course.id);
      const result = await toggleCompare(course.id);
      setBusy(null);
      if (result !== 'ok') {
        setNote('error');
        return;
      }
    }
    setRemoved((list) => [course.slug, ...list.filter((slug) => slug !== course.slug)]);
  }

  async function add(course: CompareCourse) {
    setNote(null);
    if (full) {
      setNote('full');
      return;
    }
    if (fromLink) {
      writeLink([...chosen.map((c) => c.slug), course.slug]);
    } else {
      setBusy(course.id);
      const result = await toggleCompare(course.id);
      setBusy(null);
      if (result !== 'ok') {
        setNote(result === 'full' ? 'full' : 'error');
        return;
      }
    }
    setRemoved((list) => list.filter((slug) => slug !== course.slug));
  }

  /** קורס שהוסר מהאתר ועדיין תופס מקום במגש (notes-for-plan-2.md, "קורס שהוסר מהאתר"). */
  async function dropMissing(id: string) {
    setBusy(id);
    const result = await toggleCompare(id);
    setBusy(null);
    setNote(result === 'ok' ? null : 'error');
  }

  return (
    <>
      {/* המקרא מסביר את הסימון בתאים, ולכן הוא מופיע רק כשיש טבלה. */}
      {chosen.length > 0 && <SourceLegend variant="inline" />}
      <div className="mt-5 space-y-2 font-sans text-[15px] lg:mt-6">
        {fromLink && !emptyLink && (
          <PenNote arrow className="text-base">
            {hasTray ? (
              <>
                זו השוואה מקישור. ההשוואה שלכם לא השתנתה.{' '}
                <Link href="/compare" className={inlineLink}>
                  להשוואה שלכם
                </Link>
              </>
            ) : (
              'השוואה שמישהו שלח לכם'
            )}
          </PenNote>
        )}
        {fromLink && !emptyLink && missing.length > 0 && (
          <p className="text-ink-soft">
            {missing.length === 1 ? 'קורס אחד מהקישור כבר לא באתר.' : `${missing.length} קורסים מהקישור כבר לא באתר.`}
          </p>
        )}
        {!fromLink &&
          missing.map((id) => (
            <p key={id} className="flex flex-wrap items-center gap-x-3">
              <span>קורס בהשוואה כבר לא מוצע באתר.</span>
              <button
                type="button"
                disabled={busy === id}
                onClick={() => void dropMissing(id)}
                className="inline-flex h-11 cursor-pointer items-center font-semibold underline decoration-1 underline-offset-[3px] transition-colors duration-150 hover:text-link-hover disabled:cursor-wait"
              >
                לפנות את המקום
              </button>
            </p>
          ))}
        {chosen.length > 0 && (
          <PenNote className="text-base">
            {chosen.length} מתוך {MAX_COMPARE}. {slotsLeftText(chosen.length)}.
          </PenNote>
        )}
        {note && (
          <p role="status" className="font-semibold">
            {note === 'full' ? 'בהשוואה כבר יש 3 קורסים. מוציאים אחד, ואז מחזירים.' : 'לא הצלחנו לעדכן את ההשוואה. נסו שוב.'}
          </p>
        )}
      </div>

      {emptyLink ? (
        <div className="mt-6 font-sans">
          <p className="text-[17px] font-bold">
            {removedCourses.length > 0
              ? 'הוצאתם את כל הקורסים מההשוואה.'
              : missing.length === 1
                ? 'הקורס מהקישור כבר לא באתר.'
                : missing.length > 1
                  ? 'הקורסים מהקישור כבר לא באתר.'
                  : 'בקישור אין קורסים שאנחנו מכירים.'}
          </p>
          <p className="mt-1 flex flex-wrap gap-x-6 text-[15px]">
            <Link href="/courses" className={`${textLink} inline-flex min-h-11 items-center`}>
              לכל הקורסים
            </Link>
            {hasTray && (
              <Link href="/compare" className={`${textLink} inline-flex min-h-11 items-center`}>
                להשוואה שלכם
              </Link>
            )}
          </p>
        </div>
      ) : chosen.length === 0 ? (
        <div className="mt-6 font-sans">
          <p className="text-[17px] font-bold">עוד לא בחרתם קורסים להשוואה.</p>
          <p className="mt-1 max-w-[60ch] text-[15px] leading-normal text-ink-soft">
            מוסיפים מעמוד של קורס, בכפתור &quot;להשוואה (עד 3)&quot;.{' '}
            <Link href="/courses" className={`${inlineLink} text-ink`}>
              לכל הקורסים
            </Link>
          </p>
        </div>
      ) : (
        <>
          <CompareTable courses={chosen} sections={buildCompareRows(chosen)} busy={busy} onRemove={(c) => void remove(c)} />
          <div className="mt-8 lg:mt-10">
            <ShareLinks
              text={compareShareMessage(chosen.map((c) => c.title))}
              url={`${siteUrl}${compareHref(chosen.map((c) => c.slug))}`}
            />
          </div>
        </>
      )}

      <CompareShelf removed={removedCourses} saved={saved} full={full} busy={busy} onAdd={(c) => void add(c)} />
    </>
  );
}
