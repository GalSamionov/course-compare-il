import Link from 'next/link';
import { causeSummary, queueHref, type NewCourseGroup } from '@/lib/admin/new-course-groups';
import { formatIls } from '@/lib/format';
import { BulkDecideForm } from './bulk-decide-form';
import { textLink } from './controls';
import { counted } from './format';
import { PageLink } from './page-link';

const fmt = (n: number) => new Intl.NumberFormat('he-IL').format(n);

/** "לאשר את 12 הקורסים הבטוחים של X", ובקורס אחד: "לאשר את הקורס הבטוח של X". */
function approveCopy(g: NewCourseGroup) {
  const one = g.safe === 1;
  return {
    label: one ? `לאשר את הקורס הבטוח של ${g.institutionName}` : `לאשר את ${fmt(g.safe)} הקורסים הבטוחים של ${g.institutionName}`,
    confirmText: one
      ? 'לפרסם קורס אחד? הוא עולה לקטלוג מיד, עם השדות שנכנסו לטיוטה.'
      : `לפרסם ${fmt(g.safe)} קורסים? הם עולים לקטלוג מיד, עם השדות שנכנסו לטיוטה.`,
    confirmLabel: one ? 'כן, לפרסם קורס אחד' : `כן, לפרסם ${fmt(g.safe)} קורסים`,
  };
}

function rejectCopy(g: NewCourseGroup) {
  const one = g.total === 1;
  return {
    label: one ? `לדחות את הקורס של ${g.institutionName}` : `לדחות את כל ${fmt(g.total)} הקורסים של ${g.institutionName}`,
    confirmText: one
      ? 'לדחות קורס אחד? הוא נשאר טיוטה, והדף שלו לא ייקרא יותר. אין כאן ביטול.'
      : `לדחות ${fmt(g.total)} קורסים, גם את הבטוחים? הם נשארים טיוטה, והדפים שלהם לא ייקראו יותר. אין כאן ביטול.`,
    confirmLabel: one ? 'כן, לדחות קורס אחד' : `כן, לדחות ${fmt(g.total)} קורסים`,
  };
}

/** קורס לדוגמה: השם, ומתחתיו המחיר והדף, מאותו צד (DESIGN.md, The Not A Menu Rule). מה שיעלה לאתר. */
function Sample({ sample }: { sample: NewCourseGroup['samples'][number] }) {
  return (
    <li className="min-w-0">
      <p className="text-[15px] leading-snug font-semibold [overflow-wrap:anywhere]">
        {sample.title}
        {!sample.safe && <span className="font-normal text-ink-soft"> (לא בטוח)</span>}
      </p>
      <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-soft">
        <span className="tabular-nums">{sample.price === null ? 'בלי מחיר' : formatIls(sample.price)}</span>
        {sample.url && (
          <>
            <span aria-hidden>·</span>
            <PageLink url={sample.url} />
          </>
        )}
      </p>
    </li>
  );
}

function InstitutionGroup({ group: g }: { group: NewCourseGroup }) {
  const headingId = `cg-${g.institutionId}`;
  const reasons = causeSummary(g.causes);
  const approve = approveCopy(g);
  const reject = rejectCopy(g);
  return (
    <article aria-labelledby={headingId} className="border-t border-rule py-6 lg:py-8">
      <header>
        <h3 id={headingId} className="text-[21px] leading-snug font-bold text-balance">
          {g.institutionName}
        </h3>
        <p className="mt-1 font-sans text-[15px] leading-normal tabular-nums">
          {counted(g.total, 'קורס חדש אחד', 'קורסים חדשים')}
          {' · '}
          <span className="font-bold">{g.safe === 1 ? 'אחד בטוח' : `${fmt(g.safe)} בטוחים`}</span>
          {g.unsafe > 0 && ` · ${g.unsafe === 1 ? 'אחד לא בטוח' : `${fmt(g.unsafe)} לא בטוחים`}`}
          {g.duplicates > 0 && ` · ${g.duplicates === 1 ? 'אחד בחשד לכפילות' : `${fmt(g.duplicates)} בחשד לכפילות`}`}
        </p>
        {reasons.length > 0 && (
          <p className="mt-0.5 font-sans text-[13px] leading-normal text-ink-soft">למה לא בטוחים: {reasons.join(', ')}.</p>
        )}
      </header>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
        <section aria-label={`לדוגמה, מ${g.institutionName}`} className="min-w-0 font-sans">
          <p className="text-[13px] text-ink-soft">{g.safe > 0 ? 'לדוגמה, הבטוחים קודם:' : 'לדוגמה:'}</p>
          <ul className="mt-1.5 space-y-2.5">
            {g.samples.map((s) => (
              <Sample key={s.id} sample={s} />
            ))}
          </ul>
        </section>
        <section aria-label={`ההחלטה על ${g.institutionName}`} className="min-w-0 space-y-4 font-sans text-[15px] leading-normal">
          {g.safe > 0 ? (
            <BulkDecideForm
              institutionId={g.institutionId}
              institutionName={g.institutionName}
              decision="approve"
              ids={g.safeIds}
              {...approve}
            />
          ) : (
            <p className="text-ink-soft">אין כאן קורס בטוח לאישור בבת אחת. כל קורס עובר בדיקה לבד.</p>
          )}
          {g.unsafe > 0 && (
            <p>
              <Link href={queueHref({ filter: 'unsafe', institutionId: g.institutionId })} className={`${textLink} font-semibold`}>
                {g.unsafe === 1 ? 'לעבור על הקורס הלא בטוח, לבד' : `לעבור על ${fmt(g.unsafe)} הלא בטוחים, אחד אחד`}
              </Link>
            </p>
          )}
          <div className="border-t border-rule pt-4">
            <BulkDecideForm
              institutionId={g.institutionId}
              institutionName={g.institutionName}
              decision="reject"
              ids={g.allIds}
              {...reject}
            />
            <p className="mt-1 text-[13px] text-ink-soft">למוסד שנאסף בטעות, או שאף קורס שלו לא שייך לאתר.</p>
          </div>
        </section>
      </div>
    </article>
  );
}

/** הקורסים החדשים בתור, מוסד אחרי מוסד, הגדול ראשון. */
export function NewCourseGroups({ groups }: { groups: NewCourseGroup[] }) {
  return (
    <div>
      {groups.map((g) => (
        <InstitutionGroup key={g.institutionId} group={g} />
      ))}
    </div>
  );
}
