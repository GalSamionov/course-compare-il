import type { CoursePageData, OutcomeView } from '@/lib/data/course-page';
import {
  PAID_RANGE_LEAD,
  formatHebrewDate,
  formatIls,
  formatPaidRange,
  invoiceCountText,
  outcomeHeadline,
  reviewsToScoreText,
  verifiedGraduatesText,
  verifiedReviewsText,
} from '@/lib/format';
import { FORMAT_LABEL } from '@/lib/search/types';

/** מה שעמוד ההשוואה צריך מכל קורס: חלק מעמוד הקורס, בלי ביקורות, סילבוס וסרטון. כך העמוד הסטטי קטן. */
export type CompareCourse = Pick<
  CoursePageData,
  | 'id'
  | 'slug'
  | 'title'
  | 'institutionName'
  | 'institutionSlug'
  | 'score'
  | 'sitePrice'
  | 'paid'
  | 'costPerHandsOnHour'
  | 'totalHours'
  | 'handsOnHours'
  | 'durationMonths'
  | 'schedule'
  | 'formats'
  | 'region'
  | 'nextCohortDate'
  | 'admission'
  | 'classSizeNote'
  | 'certificate'
  | 'institutionPromises'
  | 'summaryGood'
  | 'summaryWeak'
  | 'metrics'
  | 'outcome'
  | 'lecturersNote'
  | 'lecturersSummary'
> & {
  /** הפרק הראשון שסומן כחלש בסילבוס. מוצג כשאין סיכום חולשה של הבוגרים, כמו ב"בקצרה". */
  weakChapter: string | null;
  lecturers: { slug: string; name: string; role: string | null }[];
};

export function toCompareCourse(page: CoursePageData): CompareCourse {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    institutionName: page.institutionName,
    institutionSlug: page.institutionSlug,
    score: page.score,
    sitePrice: page.sitePrice,
    paid: page.paid,
    costPerHandsOnHour: page.costPerHandsOnHour,
    totalHours: page.totalHours,
    handsOnHours: page.handsOnHours,
    durationMonths: page.durationMonths,
    schedule: page.schedule,
    formats: page.formats,
    region: page.region,
    nextCohortDate: page.nextCohortDate,
    admission: page.admission,
    classSizeNote: page.classSizeNote,
    certificate: page.certificate,
    institutionPromises: page.institutionPromises,
    summaryGood: page.summaryGood,
    summaryWeak: page.summaryWeak,
    metrics: page.metrics,
    outcome: page.outcome,
    lecturersNote: page.lecturersNote,
    lecturersSummary: page.lecturersSummary,
    weakChapter: page.syllabus.find((item) => item.weak)?.title ?? null,
    lecturers: page.lecturers.map(({ slug, name, role }) => ({ slug, name, role })),
  };
}

/** מאיפה המידע בתא: אותו סימון כמו בעמוד הקורס. בלי: דיו רגילה. */
export type CellSource = 'verified' | 'grads' | 'weak' | 'claim';

export interface CompareCell {
  /** הערך. null: אין לנו את זה לקורס הזה, ומוצג `missing`. */
  text: string | null;
  source?: CellSource;
  /** מילים מודגשות לפני הערך, בלי סימון: "פרק חלש:". */
  lead?: string;
  /** שורה קטנה מתחת, בלי סימון: "לפי 5 חשבוניות ומעלה". */
  sub?: string;
  /** מה כתוב כשאין ערך. */
  missing?: string;
  /** הציון: מספר גדול. */
  big?: boolean;
  /** ממוצע מתוך 5: פס במרקר הצהוב, כמו בטבלה של עמוד הקורס. */
  bar?: number;
  /** מרצים: קישור לעמוד של כל אחד, והתפקיד. */
  links?: { href: string; label: string; sub: string | null }[];
}

export interface CompareRow {
  key: string;
  label: string;
  /** figure: מספר קצר, ובנייד התאים נשארים בעמודות. text: משפט, ובנייד כל תא בשורה משלו. */
  kind: 'figure' | 'text';
  /** תא לכל קורס, לפי הסדר. */
  cells: CompareCell[];
}

export interface CompareSection {
  key: string;
  title: string;
  rows: CompareRow[];
}

const NO_DATA = 'אין נתון';

/** תא של טקסט מהקורס: הערך עם הסימון שלו, או מה כתוב כשאין. */
function said(value: string | null, source?: CellSource, missing = NO_DATA): CompareCell {
  return value ? { text: value, source } : { text: null, missing };
}

/** כמו תיבת הציון בעמוד הקורס. */
function scoreCell(score: CompareCourse['score']): CompareCell {
  if (score.status === 'scored') {
    return { text: score.value.toFixed(1), big: true, sub: verifiedGraduatesText(score.reviewCount) };
  }
  if (score.status === 'not_enough_reviews' && score.reviewCount > 0) {
    const reviews = verifiedReviewsText(score.reviewCount);
    return {
      text: 'עוד אין ציון',
      sub: score.reviewsNeeded > 0 ? `${reviews}, ${reviewsToScoreText(score.reviewsNeeded)}` : reviews,
    };
  }
  return { text: 'עוד אין ציון', sub: 'עוד אין ביקורות מאומתות' };
}

function outcomeCell(outcome: OutcomeView | null): CompareCell {
  if (!outcome) return { text: null, missing: 'עוד אין מספיק תשובות' };
  return {
    text: outcomeHeadline(outcome),
    source: 'grads',
    sub: outcome.kind === 'after_3m' ? `בממוצע ${outcome.mean.toFixed(1)} מתוך 5` : undefined,
  };
}

/** כמו "משך" ב"על הקורס": חודשים ושעות במרקר ירוק, ושעות העשייה בלי סימון. */
function durationCell(c: CompareCourse): CompareCell {
  const duration = [
    c.durationMonths !== null ? `${c.durationMonths} חודשים` : null,
    c.totalHours !== null ? `${c.totalHours} שעות` : null,
  ]
    .filter(Boolean)
    .join(', ');
  const handsOn =
    c.handsOnHours === null ? undefined : `${c.totalHours !== null ? 'מהן ' : ''}${c.handsOnHours} שעות עשייה`;
  if (!duration) return handsOn ? { text: handsOn } : { text: null, missing: NO_DATA };
  return { text: duration, source: 'verified', sub: handsOn };
}

/** כמו "איך" ב"על הקורס": "אונליין או בכיתה, תל אביב". */
function howText(c: CompareCourse): string | null {
  const formats = c.formats.map((f) => (FORMAT_LABEL as Record<string, string>)[f] ?? f).join(' או ');
  if (!formats) return null;
  return c.region ? `${formats}, ${c.region}` : formats;
}

function lecturersCell(c: CompareCourse): CompareCell {
  if (c.lecturers.length === 0) return said(c.lecturersNote, 'claim');
  return {
    text: c.lecturers.map((l) => l.name).join(', '),
    links: c.lecturers.map((l) => ({ href: `/lecturers/${l.slug}`, label: l.name, sub: l.role })),
  };
}

/**
 * השורות של ההשוואה, בחלקים לפי הסדר של עמוד הקורס. בכל תא אותו סימון מקור כמו ברכיב המקביל בעמוד הקורס.
 * שורה שאין בה ערך לאף קורס יורדת, וחלק בלי שורות יורד. אין "מנצח": שום ערך לא מסומן כטוב יותר.
 */
export function buildCompareRows(courses: readonly CompareCourse[]): CompareSection[] {
  const row = (key: string, label: string, kind: CompareRow['kind'], cell: (c: CompareCourse) => CompareCell): CompareRow => ({
    key,
    label,
    kind,
    cells: courses.map(cell),
  });

  // השאלות לפי הסדר שבו הן מופיעות בקורסים. לכל קורס הן כבר ממוינות לפי sort_order.
  const questions = new Map<string, string>();
  for (const c of courses) for (const m of c.metrics) if (!questions.has(m.key)) questions.set(m.key, m.label);

  const sections: CompareSection[] = [
    {
      key: 'score',
      title: 'ציון הבוגרים',
      rows: [
        row('score', 'ציון מתוך 10', 'figure', (c) => scoreCell(c.score)),
        row('recommend', 'ממליצים', 'figure', (c) =>
          c.score.status === 'scored' && c.score.recommendPct !== null
            ? { text: `${Math.round(c.score.recommendPct)}%` }
            : { text: null, missing: 'עוד אין ציון' },
        ),
        row('outcome', 'מה קרה לבוגרים', 'text', (c) => outcomeCell(c.outcome)),
      ],
    },
    {
      key: 'price',
      title: 'מחיר',
      rows: [
        row('sitePrice', 'באתר המוסד', 'figure', (c) =>
          c.sitePrice !== null ? { text: formatIls(c.sitePrice) } : { text: null, missing: 'המוסד לא מפרסם מחיר' },
        ),
        row('paid', PAID_RANGE_LEAD, 'figure', (c) =>
          c.paid
            ? { text: formatPaidRange(c.paid), source: 'verified', sub: invoiceCountText(c.paid) }
            : { text: null, missing: 'עוד אין מספיק חשבוניות' },
        ),
        row('costPerHour', 'לשעת עשייה', 'figure', (c) =>
          c.costPerHandsOnHour !== null
            ? { text: formatIls(c.costPerHandsOnHour), sub: 'לפי המחיר באתר' }
            : { text: null, missing: NO_DATA },
        ),
      ],
    },
    {
      key: 'grads',
      title: 'מה הבוגרים אומרים',
      rows: [
        row('good', 'טוב', 'text', (c) => said(c.summaryGood, 'grads')),
        row('weak', 'חלש', 'text', (c) =>
          c.summaryWeak
            ? { text: c.summaryWeak, source: 'weak' }
            : c.weakChapter
              ? { lead: 'פרק חלש:', text: c.weakChapter, source: 'weak' }
              : { text: null, missing: NO_DATA },
        ),
      ],
    },
    {
      key: 'metrics',
      title: 'ציונים לפי שאלה, מתוך 5',
      rows: [...questions].map(([key, label]) =>
        row(`metric:${key}`, label, 'figure', (c) => {
          const metric = c.metrics.find((m) => m.key === key);
          return metric
            ? { text: metric.mean.toFixed(1), source: 'grads', bar: metric.mean }
            : { text: null, missing: 'אין עדיין' };
        }),
      ),
    },
    {
      key: 'about',
      title: 'על הקורס',
      rows: [
        row('duration', 'משך', 'figure', durationCell),
        row('schedule', 'מתי', 'text', (c) => said(c.schedule)),
        row('how', 'איך', 'text', (c) => said(howText(c))),
        row('nextCohort', 'המחזור הבא', 'figure', (c) => said(c.nextCohortDate ? formatHebrewDate(c.nextCohortDate) : null)),
        row('admission', 'תנאי קבלה', 'text', (c) => said(c.admission)),
        row('classSize', 'בכיתה', 'text', (c) => said(c.classSizeNote, 'claim')),
        row('certificate', 'תעודה', 'text', (c) => said(c.certificate)),
        row('promises', 'המוסד מבטיח', 'text', (c) => said(c.institutionPromises, 'claim')),
      ],
    },
    {
      key: 'lecturers',
      title: 'מרצים',
      rows: [
        row('lecturers', 'מרצים', 'text', lecturersCell),
        row('lecturersSummary', 'מה הבוגרים אומרים על המרצים', 'text', (c) => said(c.lecturersSummary, 'grads')),
      ],
    },
  ];

  return sections
    .map((section) => ({ ...section, rows: section.rows.filter((r) => r.cells.some((cell) => cell.text !== null)) }))
    .filter((section) => section.rows.length > 0);
}
