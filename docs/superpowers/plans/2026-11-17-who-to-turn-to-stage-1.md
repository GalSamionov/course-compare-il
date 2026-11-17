# "לא יודעים למי לפנות?", שלב 1: תוכנית בנייה

> **למי שמבצע:** עובדים משימה אחר משימה, לפי הסדר (superpowers:executing-plans או superpowers:subagent-driven-development). כל צעד מסומן ב-checkbox. הכול בענף `plan-1-foundation`, בלי להחליף ענף.

**Goal:** לבנות את שלב 1 של מסמך העיצוב `docs/superpowers/specs/2026-11-17-who-to-turn-to-design.md`: דף בית שנפתח ב"לא יודעים למי לפנות?" עם תיבה אחת, "העובדות" ו"מה לשאול לפני שמשלמים" בכל קורס, בלי תיבת ציון ריקה, שורת עובדות ברשימות וסדר לפי כמה פרטים המוסד מפרסם, השיטה והחברות בלשון החדשה, תמונת שיתוף חדשה, ומדידת כניסות עם פרק בפרטיות.

**Architecture:** שלוש פונקציות טהורות חדשות ב-`web/src/lib/course/` הן מקור האמת: `facts.ts` (אילו מששת השדות ידועים, הטקסט שלהם ושורה קצרה), `ask-before-paying.ts` (עד שלוש שאלות לפי כללים קבועים), ו-`score-shown.ts` (הכלל "ציון רק מביקורת מפורסמת אחת"). עמוד הקורס, שורות הרשימה, הסדר (`compareCourses`), ההשוואה ותמונת השיתוף קוראים רק להן, ולכן הם לא יכולים לסתור זה את זה. הקטלוג מקבל חמישה שדות שכבר יש במסד, וכל השאר הוא שינוי בממשק ובטקסטים בתוך העולם הקיים של הסיכום.

**Tech Stack:** Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript, Tailwind 4, shadcn/ui על Base UI, Supabase (קריאה בלבד), Vitest, Playwright עם axe (רץ ב-CI), ו-`@vercel/analytics` (חדש).

---

## איך עובדים בכל המשימות

- **מאיפה מריצים:** כל פקודה רצה משורש המאגר, `C:/Users/galsa/Desktop/קורסים השוואות`, ב-Git Bash.
- **הבדיקות קלות, לפי ההעדפה של גל:**
  - בדיקות יחידה (Vitest, ליד הקובץ, `*.test.ts`) רק לפונקציות הטהורות ולסדר.
  - e2e רץ ב-CI ולא מקומית. הטקסטים בבדיקות ה-e2e מתעדכנים במשימה 17.
  - **שימו לב:** בין משימה 7 למשימה 17, בדיקת ה-e2e של עמוד התחום תיכשל ב-CI (הטקסט "חסרות עוד 5 ביקורות" יורד). זה צפוי. ה-hook של סוף הסשן דוחף קומיט גיבוי, ולכן אם הסשן נגמר באמצע, כותבים את זה ביומן.
- **הפקודות:**
  - טיפוסים: `pnpm --dir web exec tsc --noEmit`. מצופה: בלי פלט, קוד יציאה 0.
  - lint: `pnpm --dir web exec eslint <קבצים>`, עם נתיבים יחסית ל-`web/`. מצופה: בלי פלט.
  - בדיקות יחידה: `pnpm --dir web exec vitest run <קובץ>`, עם נתיב יחסית ל-`web/`.
- **בדיקה בעיניים, בכל משימת ממשק, לפני הקומיט:**
  - מפעילים את שרת הפיתוח מההגדרה `web-dev-3100` ב-`.claude/launch.json`. בדפדפן של Claude: `preview_start` עם `name: "web-dev-3100"`, והכתובת `http://localhost:3100`.
  - בודקים ברוחב 375 (`resize_window`, preset `mobile`) ובמחשב (preset `desktop`), עם צילום מסך לכל רוחב. בסוף מחזירים ל-preset `desktop`.
  - השרת קורא את המסד שב-`web/.env.local`. עם נתוני ה-seed, הקורסים שבבדיקות קיימים (`home-cooking-sample` בלי ביקורות, `full-stack-sample` עם 23). אם השרת קורא את הענן, בוחרים קורס מ-`/courses`: כולם שם בלי ביקורות.
- **העיצוב:**
  - נשארים בעולם של הסיכום עם המרקרים, עם הרכיבים הקיימים:
    - מ-`web/src/components/course/marks.tsx`: `Mark`, `Claim`, `MarkSample`, `PenNote`;
    - `Stamp`, `PenNumber` ו-`PenArrow`;
    - הקווים של המחברת: `ruled-row`, `ruled-top`, `margin-rule`.
  - בלי כרטיסים חדשים, בלי מסגרות חדשות ובלי צבעים שאין במקרא.
  - לפי `CLAUDE.md`, ממשק עובר דרך Impeccable. במשימות 4, 7, 10 ו-11 מריצים `/impeccable` על הקבצים שהשתנו, מול החוזה ב-`.impeccable/surfaces/` (עמוד הקורס, דף הבית). מתקנים רק הערות שמחזירות לעולם הקיים.
- **טקסטים:** בעברית פשוטה, בלי שפה שיווקית. כל משפט שמופיע במסמך העיצוב נכתב בדיוק כמו שם.
- **יומן הסשן:** כל משימה מוסיפה שורה אחת ל-`docs/sessions/2026-11-15-round-5.md`, עם המספר הבא ברשימה "מה נעשה". הפריט האחרון שם הוא 48, ולכן משימה 1 כותבת 49, משימה 2 כותבת 50, וכן הלאה עד 65.
  - **איפה:** עם Edit, ממש לפני השורה `## החלטות`. מחליפים את `\n\n## החלטות\n` ב-`\n<השורה>\n\n## החלטות\n`.
  - **סטטוס בכנות:** "**נבדק:**" עם מה שרץ ומה יצא. בדיקה שלא רצה או נכשלה נכתבת "**נכתב, לא נבדק:**" עם הסיבה.
- **קומיט:** אחד לכל משימה. הודעה קצרה בעברית, ובסופה השורה `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. בקומיט נכנסים גם הקבצים של המשימה וגם קובץ היומן.
- **מה לא עושים:** לא נוגעים במסד, בענן או ב-Vercel. הפעלת Web Analytics בהגדרות הפרויקט ב-Vercel היא צעד נפרד, באישור של גל, ומי שמבצע את התוכנית לא עושה אותו. לא פורסים לאתר החי בלי אישור מפורש של גל.

---

## File Structure

### קבצים חדשים

| קובץ | מה הוא עושה |
|---|---|
| `web/src/lib/course/facts.ts` | שש העובדות של קורס: מחיר, משך, מתכונת, מיקום, תעודה ומחזור הבא. לכל אחת: ידועה או לא, הטקסט, המקור (קו כחול או ירוק) ומה כתוב כשחסר. גם כמה ידועות (לסדר), ושורה קצרה לרשימות. |
| `web/src/lib/course/facts.test.ts` | בדיקות יחידה ל-`facts.ts`. |
| `web/src/lib/course/ask-before-paying.ts` | "מה לשאול לפני שמשלמים": עד 3 שאלות, לפי כללים קבועים, בלי מודל. |
| `web/src/lib/course/ask-before-paying.test.ts` | בדיקות יחידה לשאלות. |
| `web/src/lib/course/score-shown.ts` | הכלל היחיד "ציון רק מביקורת מפורסמת אחת ומעלה". |
| `web/src/lib/course/score-shown.test.ts` | בדיקת יחידה לכלל. |
| `web/src/components/course/facts-box.tsx` | התיבה "העובדות" בעמוד קורס בלי ביקורות. אותה מסגרת דיו כמו תיבת הציון. |
| `web/src/components/course/ask-before-paying.tsx` | `AskList`, השאלות ממוספרות בעט, ו-`AskBeforePaying`, החלק עם הכותרת בעמוד הקורס. |
| `web/src/components/home/what-you-see.tsx` | "מה רואים כאן" בדף הבית, עם הדלת לבדיקת הצעה או מודעה. |

### קבצים שמשתנים

| קובץ | מה משתנה |
|---|---|
| `web/src/app/courses/[slug]/page.tsx` | בלי ביקורת: "העובדות" במקום תיבת הציון. "מה לשאול" מתחת. |
| `web/src/components/course/at-a-glance.tsx` | "בקצרה" רק עם שורות שיש להן ערך. |
| `web/src/lib/search/types.ts`, `web/src/lib/data/catalog.ts` | חמישה שדות חדשים ב-`CourseSummary`, מהשאילתה של הקטלוג. |
| `web/src/lib/search/match.ts` (+ `match.test.ts`) | הסדר מתחיל במספר העובדות הידועות. |
| `web/src/lib/search/top.test.ts`, `web/src/lib/search/keywords.test.ts` | הנתונים לדוגמה מקבלים את השדות החדשים. |
| `web/src/components/notebook/results.tsx` | שורת עובדות במקום "עוד אין ציון", "מה לשאול" מקופל בכל שורה, השורה מעל הרשימה, ו"רוצים שנכין לכם רשימה?". |
| `web/src/components/course/course-row.tsx` | בעמודי מוסד, מרצה והסבה: שורת עובדות לקורס בלי ביקורות. |
| `web/src/app/categories/[slug]/page.tsx`, `web/src/components/category/top-by-graduates.tsx` | הפתיחה של תחום, ו"המובילים" רק כשיש ציון. |
| `web/src/app/courses/page.tsx` | בלי ספירת קורסים ובלי "עוד אין ציון". |
| `web/src/app/institutions/[slug]/page.tsx` | בלי "עוד אין בוגרים מאומתים" בכותרת. |
| `web/src/lib/compare/rows.ts` (+ `rows.test.ts`), `web/src/components/account/compare-tray.tsx` | בלי "עוד אין ציון" לקורס בלי ביקורות. |
| `web/src/components/notebook/notebook.tsx`, `notebook-page.tsx`, `pen-example.tsx` | התיבה הגדולה, "בשבילי" או "בשביל העובדים", והשורות תחת "או בחרו בעצמכם". |
| `web/src/app/page.tsx`, `web/src/components/home/home-hero.tsx` | הכותרת החדשה, "מה רואים כאן". |
| `web/src/components/site/graduates-call.tsx` | "כתיבת ביקורות נפתחת בקרוב" באתר החי. |
| `web/src/components/site/site-header.tsx`, `site-footer.tsx`, `web/src/app/who-pays-us/page.tsx` | "איך אנחנו משווים". |
| `web/src/app/method/page.tsx`, `web/src/app/globals.css` | פתיחה חדשה, ו"כשיהיו ביקורות". |
| `web/src/app/companies/page.tsx` | המחיר והביקורות עוברים ל"בקרוב". |
| `web/src/app/_og/card.tsx`, `web/src/app/opengraph-image.tsx`, `web/src/app/courses/[slug]/opengraph-image.tsx`, `web/src/app/layout.tsx` | תמונות השיתוף והתיאור של דף הבית. |
| `web/src/lib/og/share-text.ts` (+ `share-text.test.ts`) | התיאור של קישור לקורס בלי ביקורות: העובדות. |
| `web/package.json`, `web/pnpm-lock.yaml`, `web/src/app/layout.tsx`, `web/src/app/privacy/page.tsx` | `@vercel/analytics`, ופרק "מדידת כניסות". |
| `web/e2e/home.spec.ts`, `course-page.spec.ts`, `catalog.spec.ts` | הטקסטים החדשים. |
| `docs/sessions/2026-11-15-round-5.md`, `docs/STATUS.md` | היומן והמצב. |

### קובץ שנמחק

| קובץ | למה |
|---|---|
| `web/src/components/site/verification-steps.tsx` | "איך האימות עובד" מתחלף ב"מה רואים כאן". אין לו שימוש אחר. |

---

## Task 1: העובדות של קורס (פונקציה טהורה)

**Files:**
- Create: `web/src/lib/course/facts.ts`
- Test: `web/src/lib/course/facts.test.ts`

- [ ] **Step 1: לכתוב את הבדיקה.** יוצרים את `web/src/lib/course/facts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { courseFacts, factsLine, knownFactsCount, type FactSource } from './facts';

const course = (over: Partial<FactSource> = {}): FactSource => ({
  sitePrice: 2600,
  totalHours: 30,
  durationMonths: 2,
  formats: ['in_person', 'online'],
  region: 'חיפה',
  certificate: 'תעודת השתתפות',
  nextCohortDate: '2027-01-11',
  ...over,
});

const nothing: Partial<FactSource> = {
  sitePrice: null,
  totalHours: null,
  durationMonths: null,
  formats: [],
  region: null,
  certificate: null,
  nextCohortDate: null,
};

describe('courseFacts', () => {
  it('lists the six facts in order, each with its source', () => {
    expect(courseFacts(course())).toEqual([
      { key: 'price', label: 'מחיר', known: true, text: '2,600 ₪', source: 'claim' },
      { key: 'duration', label: 'משך', known: true, text: '2 חודשים, 30 שעות', source: 'verified' },
      { key: 'format', label: 'מתכונת', known: true, text: 'בכיתה או אונליין', source: 'claim' },
      { key: 'location', label: 'מיקום', known: true, text: 'חיפה', source: 'claim' },
      { key: 'certificate', label: 'תעודה', known: true, text: 'תעודת השתתפות', source: 'claim' },
      { key: 'nextCohort', label: 'מחזור הבא', known: true, text: '11.1.2027', source: 'claim' },
    ]);
  });

  it('writes what the page does not say, and a missing price as the institution not publishing one', () => {
    expect(courseFacts(course(nothing)).map((f) => (f.known ? f.text : f.missing))).toEqual([
      'המוסד לא מפרסם מחיר',
      'לא כתוב בדף',
      'לא כתוב בדף',
      'לא כתוב בדף',
      'לא כתוב בדף',
      'לא כתוב בדף',
    ]);
  });

  it('counts a course that is only online as having a place, and says one month in words', () => {
    const facts = courseFacts(course({ formats: ['online'], region: null, durationMonths: 1, totalHours: null }));
    expect(facts.find((f) => f.key === 'location')).toMatchObject({ known: true, text: 'אונליין' });
    expect(facts.find((f) => f.key === 'duration')).toMatchObject({ known: true, text: 'חודש אחד' });
  });

  it('treats a blank certificate or region as unknown', () => {
    const facts = courseFacts(course({ certificate: '  ', region: '', formats: ['in_person'] }));
    expect(facts.filter((f) => !f.known).map((f) => f.key)).toEqual(['location', 'certificate']);
  });
});

describe('knownFactsCount', () => {
  it('agrees with courseFacts', () => {
    const cases = [
      course(),
      course(nothing),
      course({ formats: ['online'], region: null }),
      course({ sitePrice: null, certificate: '' }),
      course({ formats: ['toString'] }),
    ];
    for (const c of cases) expect(knownFactsCount(c)).toBe(courseFacts(c).filter((f) => f.known).length);
    expect(knownFactsCount(course())).toBe(6);
    expect(knownFactsCount(course(nothing))).toBe(0);
  });
});

describe('factsLine', () => {
  it('shows the price, the length, the format and the place, only what is known', () => {
    expect(factsLine(course()).map((p) => p.text)).toEqual(['2,600 ₪', '2 חודשים, 30 שעות', 'בכיתה או אונליין', 'חיפה']);
    expect(factsLine(course(nothing)).map((p) => p.text)).toEqual(['מחיר לא מפורסם']);
  });

  it('does not write "אונליין" twice', () => {
    expect(factsLine(course({ formats: ['online'], region: null })).map((p) => p.text)).toEqual([
      '2,600 ₪',
      '2 חודשים, 30 שעות',
      'אונליין',
    ]);
  });
});
```

- [ ] **Step 2: להריץ ולראות שנכשלת.**
  - הפקודה: `pnpm --dir web exec vitest run src/lib/course/facts.test.ts`
  - מצופה: FAIL, עם `Failed to resolve import "./facts"`.

- [ ] **Step 3: לכתוב את הקוד.** יוצרים את `web/src/lib/course/facts.ts`:

```ts
import { formatHebrewDate, formatIls } from '@/lib/format';

/**
 * "העובדות" של קורס (מסמך העיצוב 2026-11-17, שלב 1): שישה שדות שהמוסד מפרסם, או לא מפרסם.
 * אותה פונקציה בונה את התיבה בעמוד הקורס, את השורה הקצרה ברשימות, את השאלות ואת הסדר ברשימות,
 * כדי שאף אחד מהם לא יסתור את האחרים.
 * טהורה: בלי מסד ובלי התאריך של היום. מחזור שהתאריך שלו עבר נספר כידוע, כמו בשאר האתר: האוסף קורא כל דף פעם בשבוע.
 */

/** הסדר בתיבה. */
export const FACT_KEYS = ['price', 'duration', 'format', 'location', 'certificate', 'nextCohort'] as const;
export type FactKey = (typeof FACT_KEYS)[number];

/** מה שצריך מקורס. גם CourseSummary (הרשימות) וגם CoursePageData (עמוד הקורס) מתאימים. */
export interface FactSource {
  sitePrice: number | null;
  totalHours: number | null;
  durationMonths: number | null;
  formats: readonly string[];
  region: string | null;
  certificate: string | null;
  nextCohortDate: string | null;
}

/**
 * עובדה ידועה: הטקסט והמקור שלו. claim: המוסד אומר (קו כחול). verified: נבדק (ירוק).
 * עובדה חסרה: מה כותבים במקום (עיקרון 3, "מה שלא ידוע, כתוב").
 */
export type Fact =
  | { key: FactKey; label: string; known: true; text: string; source: 'claim' | 'verified' }
  | { key: FactKey; label: string; known: false; missing: string };

export const FACT_LABEL: Record<FactKey, string> = {
  price: 'מחיר',
  duration: 'משך',
  format: 'מתכונת',
  location: 'מיקום',
  certificate: 'תעודה',
  nextCohort: 'מחזור הבא',
};

export const NOT_WRITTEN = 'לא כתוב בדף';
export const NO_PRICE = 'המוסד לא מפרסם מחיר';
/** בשורה הקצרה ברשימה (מסמך העיצוב, "הרשימות ועמודי התחומים"). */
export const NO_PRICE_SHORT = 'מחיר לא מפורסם';

/** המילים של כל מתכונת, כמו ב"על הקורס". ערך שהקוד לא מכיר לא מוצג. */
const FORMAT_WORDS = new Map<string, string>([
  ['online', 'אונליין'],
  ['in_person', 'בכיתה'],
  ['hybrid', 'משולב'],
  ['recorded', 'מוקלט'],
]);
/** מתכונות בלי מקום. קורס שכולו כאלה נלמד אונליין, וזה המיקום שלו. */
const REMOTE = new Set(['online', 'recorded']);

/** טקסט מהמסד בלי רווחים בקצוות. טקסט ריק נחשב חסר. */
function present(text: string | null): string | null {
  const trimmed = text?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

function durationText(c: FactSource): string | null {
  const parts: string[] = [];
  if (c.durationMonths !== null) parts.push(c.durationMonths === 1 ? 'חודש אחד' : `${c.durationMonths} חודשים`);
  if (c.totalHours !== null) parts.push(`${c.totalHours} שעות`);
  return parts.length > 0 ? parts.join(', ') : null;
}

function formatText(c: FactSource): string | null {
  const words = c.formats.flatMap((f) => FORMAT_WORDS.get(f) ?? []);
  return words.length > 0 ? words.join(' או ') : null;
}

function locationText(c: FactSource): string | null {
  const region = present(c.region);
  if (region) return region;
  const known = c.formats.filter((f) => FORMAT_WORDS.has(f));
  return known.length > 0 && known.every((f) => REMOTE.has(f)) ? 'אונליין' : null;
}

function fact(key: FactKey, text: string | null, source: 'claim' | 'verified' = 'claim'): Fact {
  const label = FACT_LABEL[key];
  return text === null
    ? { key, label, known: false, missing: key === 'price' ? NO_PRICE : NOT_WRITTEN }
    : { key, label, known: true, text, source };
}

/**
 * שש העובדות, בסדר של FACT_KEYS.
 * המשך (חודשים ושעות) בירוק, כמו ב"על הקורס", בהשוואה ובהנחיות של היועץ. כל השאר טענה של המוסד, בקו כחול.
 */
export function courseFacts(c: FactSource): Fact[] {
  return [
    fact('price', c.sitePrice === null ? null : formatIls(c.sitePrice)),
    fact('duration', durationText(c), 'verified'),
    fact('format', formatText(c)),
    fact('location', locationText(c)),
    fact('certificate', present(c.certificate)),
    fact('nextCohort', c.nextCohortDate === null ? null : formatHebrewDate(c.nextCohortDate)),
  ];
}

/**
 * כמה מששת השדות ידועים. ממנו מתחיל הסדר ברשימות (search/match.ts, compareCourses).
 * בלי לעצב מחירים ותאריכים: המיון קורא לזה אלפי פעמים. הבדיקה מוודאת שזה מסכים עם courseFacts.
 */
export function knownFactsCount(c: FactSource): number {
  return [
    c.sitePrice !== null,
    durationText(c) !== null,
    formatText(c) !== null,
    locationText(c) !== null,
    present(c.certificate) !== null,
    c.nextCohortDate !== null,
  ].filter(Boolean).length;
}

export interface LinePart {
  key: 'price' | 'duration' | 'format' | 'location';
  text: string;
}

/**
 * השורה הקצרה ברשימה, לקורס בלי ביקורות (מסמך העיצוב, "הרשימות ועמודי התחומים"):
 * מחיר או "מחיר לא מפורסם", משך, מתכונת ומיקום, ורק מה שידוע.
 * מיקום "אונליין" שבא מהמתכונת לא נכתב פעמיים: המתכונת כבר אומרת אותו.
 */
export function factsLine(c: FactSource): LinePart[] {
  const parts: LinePart[] = [{ key: 'price', text: c.sitePrice === null ? NO_PRICE_SHORT : formatIls(c.sitePrice) }];
  const duration = durationText(c);
  if (duration) parts.push({ key: 'duration', text: duration });
  const format = formatText(c);
  if (format) parts.push({ key: 'format', text: format });
  const region = present(c.region);
  if (region) parts.push({ key: 'location', text: region });
  return parts;
}
```

- [ ] **Step 4: להריץ ולראות שעוברת.**
  - הפקודה: `pnpm --dir web exec vitest run src/lib/course/facts.test.ts`
  - מצופה: `Test Files  1 passed (1)`, `Tests  7 passed (7)`.

- [ ] **Step 5: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`. מצופה: בלי פלט.
  - `pnpm --dir web exec eslint src/lib/course/facts.ts src/lib/course/facts.test.ts`. מצופה: בלי פלט.

- [ ] **Step 6: שורה ביומן.** מוסיפים לפני `## החלטות`:

```md
49. **העובדות של קורס (`web/src/lib/course/facts.ts`):** שש העובדות, כמה מהן ידועות, ושורה קצרה לרשימות. קורס שכולו אונליין נחשב עם מיקום ("אונליין"). **נבדק:** vitest, 7 בדיקות עוברות, ו-tsc נקי.
```

- [ ] **Step 7: קומיט.**

```bash
git add web/src/lib/course/facts.ts web/src/lib/course/facts.test.ts docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
העובדות של קורס: שש עובדות, כמה ידועות ושורה קצרה

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

מצופה: `[plan-1-foundation <sha>] העובדות של קורס...`, 3 files changed.

---

## Task 2: "מה לשאול לפני שמשלמים" (פונקציה טהורה)

**Files:**
- Create: `web/src/lib/course/ask-before-paying.ts`
- Test: `web/src/lib/course/ask-before-paying.test.ts`

- [ ] **Step 1: לכתוב את הבדיקה.** יוצרים את `web/src/lib/course/ask-before-paying.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { QUESTIONS, askBeforePaying } from './ask-before-paying';
import type { FactSource } from './facts';

const course = (over: Partial<FactSource> = {}): FactSource => ({
  sitePrice: 2600,
  totalHours: 30,
  durationMonths: 2,
  formats: ['in_person'],
  region: 'חיפה',
  certificate: null,
  nextCohortDate: '2027-01-11',
  ...over,
});

describe('askBeforePaying', () => {
  it('asks only about graduates when the institution publishes price, length, place and next cohort', () => {
    expect(askBeforePaying(course())).toEqual(['אפשר לדבר עם שני בוגרים מהמחזור הקודם?']);
  });

  it('asks in the order of the list, in the words of the design document', () => {
    expect(askBeforePaying(course({ sitePrice: null, totalHours: null, durationMonths: null }))).toEqual([
      'כמה עולה הקורס, כולל כל התשלומים? אפשר לקבל את זה בכתב?',
      'כמה שעות לימוד יש בפועל, וכמה מהן תרגול?',
      'אפשר לדבר עם שני בוגרים מהמחזור הקודם?',
    ]);
  });

  it('shows at most three, so the graduates question waits for room', () => {
    const nothing = course({ sitePrice: null, totalHours: null, durationMonths: null, formats: [], region: null, nextCohortDate: null });
    expect(askBeforePaying(nothing)).toEqual([QUESTIONS.price, QUESTIONS.duration, QUESTIONS.place]);
  });

  it('asks where when the place or the format is missing, but not for a course that is only online', () => {
    expect(askBeforePaying(course({ region: null }))).toEqual([QUESTIONS.place, QUESTIONS.graduates]);
    expect(askBeforePaying(course({ formats: [] }))).toEqual([QUESTIONS.place, QUESTIONS.graduates]);
    expect(askBeforePaying(course({ region: null, formats: ['online'] }))).toEqual([QUESTIONS.graduates]);
  });

  it('asks about the next cohort when there is none', () => {
    expect(askBeforePaying(course({ nextCohortDate: null }))).toEqual([
      'מתי המחזור הבא, ומה התנאים לביטול?',
      QUESTIONS.graduates,
    ]);
  });
});
```

- [ ] **Step 2: להריץ ולראות שנכשלת.**
  - הפקודה: `pnpm --dir web exec vitest run src/lib/course/ask-before-paying.test.ts`
  - מצופה: FAIL, עם `Failed to resolve import "./ask-before-paying"`.

- [ ] **Step 3: לכתוב את הקוד.** יוצרים את `web/src/lib/course/ask-before-paying.ts`:

```ts
import { courseFacts, type FactKey, type FactSource } from './facts';

/** כמה שאלות לכל קורס, לכל היותר. */
export const MAX_QUESTIONS = 3;

/** השאלות, במילים של מסמך העיצוב (2026-11-17). הסדר כאן הוא הסדר שבו הן מוצגות. */
export const QUESTIONS = {
  price: 'כמה עולה הקורס, כולל כל התשלומים? אפשר לקבל את זה בכתב?',
  duration: 'כמה שעות לימוד יש בפועל, וכמה מהן תרגול?',
  place: 'איפה הלימודים, ומה קורה אם מפספסים מפגש?',
  cohort: 'מתי המחזור הבא, ומה התנאים לביטול?',
  /** מהמדריך לדגלים אדומים. שאלה קבועה, כשיש מקום. */
  graduates: 'אפשר לדבר עם שני בוגרים מהמחזור הקודם?',
} as const;

/**
 * "מה לשאול לפני שמשלמים": עד שלוש שאלות, לפי כללים קבועים בקוד ובלי מודל, כדי שלא יומצא כלום.
 * מחיר לא מפורסם, משך לא ידוע, מיקום או מתכונת לא ידועים, ואין מחזור הבא. אחריהן, כשנשאר מקום, השאלה על בוגרים.
 * "ידוע" כאן הוא בדיוק מה ש"העובדות" מראות (facts.ts), ולכן שאלה אף פעם לא שואלת על משהו שכתוב בתיבה.
 */
export function askBeforePaying(c: FactSource): string[] {
  const known = new Set<FactKey>(courseFacts(c).flatMap((f) => (f.known ? [f.key] : [])));
  const questions: string[] = [];
  if (!known.has('price')) questions.push(QUESTIONS.price);
  if (!known.has('duration')) questions.push(QUESTIONS.duration);
  if (!known.has('location') || !known.has('format')) questions.push(QUESTIONS.place);
  if (!known.has('nextCohort')) questions.push(QUESTIONS.cohort);
  questions.push(QUESTIONS.graduates);
  return questions.slice(0, MAX_QUESTIONS);
}
```

- [ ] **Step 4: להריץ ולראות שעוברת.**
  - הפקודה: `pnpm --dir web exec vitest run src/lib/course/ask-before-paying.test.ts`
  - מצופה: `Tests  5 passed (5)`.

- [ ] **Step 5: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/lib/course/ask-before-paying.ts src/lib/course/ask-before-paying.test.ts`
  - מצופה: בלי פלט.

- [ ] **Step 6: שורה ביומן.**

```md
50. **"מה לשאול לפני שמשלמים" (`web/src/lib/course/ask-before-paying.ts`):** עד 3 שאלות לפי כללים קבועים, בלי מודל, והשאלה על בוגרים כשיש מקום. **נבדק:** vitest, 5 בדיקות עוברות.
```

- [ ] **Step 7: קומיט.**

```bash
git add web/src/lib/course/ask-before-paying.ts web/src/lib/course/ask-before-paying.test.ts docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
מה לשאול לפני שמשלמים: עד 3 שאלות לפי כללים קבועים

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: הכלל "בלי ביקורת, בלי תיבת ציון"

**Files:**
- Create: `web/src/lib/course/score-shown.ts`
- Test: `web/src/lib/course/score-shown.test.ts`

- [ ] **Step 1: לכתוב את הבדיקה.** יוצרים את `web/src/lib/course/score-shown.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { showsScore } from './score-shown';

describe('showsScore', () => {
  it('hides the score until a course has one published review', () => {
    expect(showsScore(0)).toBe(false);
    expect(showsScore(1)).toBe(true);
    expect(showsScore(23)).toBe(true);
  });
});
```

- [ ] **Step 2: להריץ ולראות שנכשלת.**
  - הפקודה: `pnpm --dir web exec vitest run src/lib/course/score-shown.test.ts`
  - מצופה: FAIL, `Failed to resolve import "./score-shown"`.

- [ ] **Step 3: לכתוב את הקוד.** יוצרים את `web/src/lib/course/score-shown.ts`:

```ts
/** מכמה ביקורות מפורסמות מוצג ציון, או "עוד X ביקורות עד לציון". */
export const MIN_PUBLISHED_FOR_SCORE = 1;

/**
 * אין ציון בלי ביקורות (מסמך העיצוב 2026-11-17, עיקרון 1). הכלל היחיד לכל מקום שמציג ציון:
 * תיבת הציון בעמוד הקורס, הציון בשורה ברשימה, בעמודי מוסד ומרצה, בהשוואה, בתיאור הקישור ובתמונת השיתוף.
 * בלי ביקורת מפורסמת: "העובדות" ושורת העובדות במקום. מביקורת אחת: הכול כמו היום, כולל "עוד X ביקורות עד לציון".
 * publishedReviews: ביקורות שפורסמו (CoursePageData.reviewTotal, CourseSummary.verifiedCount).
 */
export function showsScore(publishedReviews: number): boolean {
  return publishedReviews >= MIN_PUBLISHED_FOR_SCORE;
}
```

- [ ] **Step 4: להריץ ולראות שעוברת.**
  - הפקודה: `pnpm --dir web exec vitest run src/lib/course/score-shown.test.ts`
  - מצופה: `Tests  1 passed (1)`.

- [ ] **Step 5: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/lib/course/score-shown.ts src/lib/course/score-shown.test.ts`

- [ ] **Step 6: שורה ביומן.**

```md
51. **הכלל "בלי ביקורת, בלי תיבת ציון" (`web/src/lib/course/score-shown.ts`):** ציון, או "עוד X ביקורות עד לציון", רק מביקורת מפורסמת אחת. **נבדק:** vitest, בדיקה אחת עוברת.
```

- [ ] **Step 7: קומיט.**

```bash
git add web/src/lib/course/score-shown.ts web/src/lib/course/score-shown.test.ts docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
הכלל: ציון רק מביקורת מפורסמת אחת

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: עמוד הקורס: "העובדות", "מה לשאול" ו"בקצרה" עם ערכים בלבד

**Files:**
- Create: `web/src/components/course/facts-box.tsx`
- Create: `web/src/components/course/ask-before-paying.tsx`
- Modify: `web/src/components/course/at-a-glance.tsx` (כל הקובץ)
- Modify: `web/src/app/courses/[slug]/page.tsx` (ה-imports, שורות 66–68, ה-`<aside>` בשורות 157–169)
- Test: בדיקה בעיניים. ה-e2e של קורס בלי ביקורות נכתב במשימה 17.

- [ ] **Step 1: התיבה "העובדות".** יוצרים את `web/src/components/course/facts-box.tsx`:

```tsx
import { Fragment } from 'react';
import { courseFacts, type FactSource } from '@/lib/course/facts';
import { Claim, Mark } from './marks';

/**
 * "העובדות" (מסמך העיצוב 2026-11-17, עמוד הקורס): במקום תיבת הציון, כשלקורס עוד אין ביקורת מפורסמת.
 * אותה מסגרת דיו כמו תיבת הציון (score-box.tsx), כדי שהעמוד ייפתח באותו מקום ובאותה צורה. לא כרטיס חדש.
 * ערך ידוע בסימון המקור שלו: קו כחול, כי זו טענת המוסד, או ירוק כשנבדק (המשך, כמו ב"על הקורס").
 * ערך חסר כתוב בעט, כמו "מה לא כתוב" במקרא של דף הבית. חוסר הוא נתון שאפשר להשוות לפיו, לא חור בעמוד.
 */
export function FactsBox({ course }: { course: FactSource }) {
  return (
    <section aria-labelledby="facts-title" className="mt-5 lg:mt-0">
      <div className="border-[1.5px] border-ink bg-white px-4 py-3 lg:px-5 lg:py-4">
        <h2 id="facts-title" className="font-sans text-[15px] font-bold lg:text-base">
          העובדות
        </h2>
        <dl className="mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 font-sans text-[15px] leading-snug lg:text-base">
          {courseFacts(course).map((fact) => (
            <Fragment key={fact.key}>
              <dt className="font-semibold text-ink-soft">{fact.label}</dt>
              <dd className="m-0">
                {!fact.known ? (
                  <span className="font-pen font-medium text-pen">{fact.missing}</span>
                ) : fact.source === 'verified' ? (
                  <Mark source="verified">{fact.text}</Mark>
                ) : (
                  <Claim>{fact.key === 'price' ? <bdi dir="rtl">{fact.text}</bdi> : fact.text}</Claim>
                )}
              </dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: "מה לשאול לפני שמשלמים".** יוצרים את `web/src/components/course/ask-before-paying.tsx`:

```tsx
import Link from 'next/link';
import { PenNumber } from '@/components/site/pen';
import { cn } from '@/lib/utils';

/**
 * השאלות, ממוספרות בעיגול של עט כמו השאלות בשוליים של המחברת. המספר בעט מוסתר מקורא מסך: הרשימה ממוספרת לבד.
 * ברשימת התוצאות הן בתוך "מה לשאול לפני שמשלמים" המקופל (results.tsx), ובעמוד הקורס מתחת ל"העובדות".
 */
export function AskList({ questions, className }: { questions: readonly string[]; className?: string }) {
  return (
    <ol className={cn('space-y-2 font-sans text-[15px] leading-snug lg:text-base', className)}>
      {questions.map((question, i) => (
        <li key={question} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-x-2">
          <PenNumber n={i + 1} className="size-6 text-[15px]" />
          <span className="pt-0.5 text-pretty">{question}</span>
        </li>
      ))}
    </ol>
  );
}

/** החלק בעמוד הקורס (מסמך העיצוב 2026-11-17): מתחת ל"העובדות", או מתחת ל"בקצרה" כשיש ציון. */
export function AskBeforePaying({ questions }: { questions: readonly string[] }) {
  return (
    <section aria-labelledby="before-paying-title" className="mt-6 font-sans lg:mt-8">
      <h2 id="before-paying-title" className="text-[15px] font-bold lg:text-base">
        מה לשאול לפני שמשלמים
      </h2>
      <AskList questions={questions} className="mt-2" />
      <p className="mt-1 text-[13px] text-ink-soft lg:text-sm">
        <Link
          href="/guides/questions-before-signing-up"
          className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[3px] hover:text-link-hover"
        >
          עוד שאלות, במדריך ״מה לשאול את המוסד לפני שנרשמים״
        </Link>
      </p>
    </section>
  );
}
```

- [ ] **Step 3: "בקצרה" רק עם שורות שיש להן ערך.** מחליפים את כל `web/src/components/course/at-a-glance.tsx` ב:

```tsx
import { showsScore } from '@/lib/course/score-shown';
import type { CoursePageData } from '@/lib/data/course-page';
import { PAID_RANGE_LEAD, formatIls, formatPaidRange, invoiceCountText, outcomeBasis, outcomeHeadline } from '@/lib/format';
import { Mark } from './marks';

/** החולשה הבולטת: הסיכום של הבוגרים, ואם אין, פרק שסומן כחלש בסילבוס. */
function topWeakness(course: CoursePageData): { label: string; text: string } | null {
  if (course.summaryWeak) return { label: 'חלש:', text: course.summaryWeak };
  const chapter = course.syllabus.find((item) => item.weak);
  return chapter ? { label: 'פרק חלש:', text: chapter.title } : null;
}

const sub = 'block text-[13px] leading-snug text-ink-soft lg:text-sm';

/**
 * "בקצרה": רק שורות שיש להן ערך (מסמך העיצוב 2026-11-17), כל אחת בצבע המקור שלה. מה שילמו בפועל (ירוק, מחמש
 * חשבוניות, כמו היום), מה קרה לבוגרים (צהוב) והחולשה הבולטת (ורוד). בלי אף אחת מהן, אין "בקצרה".
 * המחיר באתר המוסד מופיע כאן רק לקורס עם ביקורות ובלי חשבוניות. בלי ביקורות הוא כבר ב"העובדות".
 * בנייד מיד אחרי הציון, ובמחשב בעמודה הצדדית. הפירוט המלא נשאר בחלקים של העמוד.
 */
export function AtAGlance({ course }: { course: CoursePageData }) {
  const weak = topWeakness(course);
  const sitePrice = !course.paid && showsScore(course.reviewTotal) ? course.sitePrice : null;
  if (!course.paid && sitePrice === null && !course.outcome && !weak) return null;
  return (
    <section aria-labelledby="glance-title" className="mt-6 font-sans lg:mt-8">
      <h2 id="glance-title" className="text-[15px] font-bold lg:text-base">
        בקצרה
      </h2>
      <ul className="mt-1.5 space-y-2.5 text-[15px] leading-relaxed lg:text-base">
        {course.paid && (
          <li>
            <Mark source="verified">
              {PAID_RANGE_LEAD} <bdi dir="rtl">{formatPaidRange(course.paid)}</bdi>
            </Mark>
            <span className={sub}>
              {invoiceCountText(course.paid)}
              {course.sitePrice !== null && (
                <>
                  . באתר המוסד: <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
                </>
              )}
            </span>
          </li>
        )}
        {sitePrice !== null && (
          <li>
            באתר המוסד: <bdi dir="rtl">{formatIls(sitePrice)}</bdi>
          </li>
        )}
        {course.outcome && (
          <li>
            <Mark source="grads">{outcomeHeadline(course.outcome)}</Mark>
            {outcomeBasis(course.outcome) && <span className={sub}>{outcomeBasis(course.outcome)}.</span>}
          </li>
        )}
        {weak && (
          <li>
            <span className="font-bold">{weak.label}</span> <Mark source="weak">{weak.text}</Mark>
          </li>
        )}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: עמוד הקורס.** ב-`web/src/app/courses/[slug]/page.tsx`:
  - **ה-imports:** מוסיפים בסדר האלפביתי של הקובץ:

```tsx
import { AskBeforePaying } from '@/components/course/ask-before-paying';
import { FactsBox } from '@/components/course/facts-box';
import { askBeforePaying } from '@/lib/course/ask-before-paying';
import { showsScore } from '@/lib/course/score-shown';
import { cn } from '@/lib/utils';
```

  - **מתחת ל-`const reviewCount = course.reviewTotal;`** (שורה 66) מוסיפים:

```tsx
  // אין ציון בלי ביקורות (מסמך העיצוב 2026-11-17): בלי ביקורת מפורסמת, "העובדות" במקום תיבת הציון,
  // וגם בלי ההערה בעט "את הקורס עצמו עוד לא בדקנו", שתלויה על התיבה.
  const reviewed = showsScore(reviewCount);
  const questions = askBeforePaying(course);
```

  - **מחליפים את ה-`<aside>` כולו** (שורות 157–169, מ-`<aside` עד `</aside>`) ב:

```tsx
          <aside
            aria-label={reviewed ? 'הציון ובקצרה' : 'העובדות ומה לשאול'}
            className="lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:pt-3"
          >
            {/* בלי ביקורות העמודה ארוכה יותר (שש עובדות ושלוש שאלות), ובמסך של מחשב נייד היא לא נכנסת כולה.
                לכן היא נשארת במקום בגלילה רק כשיש ציון. */}
            <div className={cn('lg:pb-10', reviewed && 'lg:sticky lg:top-8')}>
              {reviewed ? <ScoreBox score={course.score} /> : <FactsBox course={course} />}
              <AtAGlance course={course} />
              <AskBeforePaying questions={questions} />
              {/* במחשב הפעולות כאן, תמיד בהישג יד. בנייד הן בסוף העמוד (החוזה של עמוד הקורס). */}
              <div className="hidden lg:block">
                <CourseActions courseId={course.id} slug={course.slug} title={course.title} share={share} stacked />
              </div>
            </div>
          </aside>
```

  - השורה "מאיפה הפרטים" (שורות 125–139) לא משתנה.

- [ ] **Step 5: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/components/course/facts-box.tsx src/components/course/ask-before-paying.tsx src/components/course/at-a-glance.tsx "src/app/courses/[slug]/page.tsx"`
  - מצופה: בלי פלט.

- [ ] **Step 6: בדיקה בעיניים** (שרת `web-dev-3100`), ב-375 ובמחשב:
  - **`/courses/home-cooking-sample`** (בלי ביקורות; עם הענן: קורס כלשהו מ-`/courses`):
    - אין תיבת ציון, ואין "את הקורס עצמו עוד לא בדקנו".
    - "העובדות" באותה מסגרת דיו כמו תיבת הציון: מחיר בקו כחול, משך במרקר ירוק עם הווי, ו"לא כתוב בדף" בעט.
    - "מה לשאול לפני שמשלמים" מתחת, עם מספרים מוקפים בעט.
    - "מאיפה הפרטים" במקומה.
    - במחשב: העמודה הצדדית לא נשארת במקום בגלילה, והפעולות מתחתיה.
  - **`/courses/full-stack-sample`** (23 ביקורות):
    - תיבת הציון, ההערה בעט ו"בקצרה" כמו היום.
    - "מה לשאול" מתחת ל"בקצרה", עם שאלה אחת על בוגרים.
  - **`/courses/ai-tools-sample`** (3 ביקורות): "עוד 2 ביקורות עד לציון." כמו היום, ו"בקצרה" עם "באתר המוסד: 2,900 ₪" בלי "עוד אין מספיק חשבוניות".
  - מריצים `/impeccable` על `facts-box.tsx`, `ask-before-paying.tsx` ו-`page.tsx` מול `.impeccable/surfaces/course-page.md`, ומתקנים רק מה שמחזיר לעולם הקיים.

- [ ] **Step 7: שורה ביומן.**

```md
52. **עמוד הקורס בלי ביקורות:** "העובדות" (קו כחול, משך בירוק, "לא כתוב בדף" בעט) במקום תיבת הציון וההערה, ו"מה לשאול לפני שמשלמים" מתחת. מביקורת אחת הכול כמו היום. "בקצרה" רק עם שורות שיש להן ערך. **נבדק:** tsc ו-eslint, ובשרת המקומי ב-375 ובמחשב על home-cooking-sample, full-stack-sample ו-ai-tools-sample (צילומי מסך).
```

- [ ] **Step 8: קומיט.**

```bash
git add web/src/components/course/facts-box.tsx web/src/components/course/ask-before-paying.tsx web/src/components/course/at-a-glance.tsx "web/src/app/courses/[slug]/page.tsx" docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
עמוד הקורס: העובדות ומה לשאול, בלי תיבת ציון ריקה

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: הקטלוג מקבל את שדות העובדות

**Files:**
- Modify: `web/src/lib/search/types.ts` (`CourseSummary`, שורות 55–74)
- Modify: `web/src/lib/data/catalog.ts` (השאילתה בשורות 42–52, המיפוי בשורות 95–98)
- Modify: `web/src/lib/search/match.test.ts` (שורות 5–23), `web/src/lib/search/top.test.ts` (שורות 5–23), `web/src/lib/search/keywords.test.ts` (שורות 70–87)
- Test: `pnpm --dir web exec vitest run` (כל הבדיקות)

- [ ] **Step 1: הטיפוס.** ב-`web/src/lib/search/types.ts`, ב-`CourseSummary`, מתחת ל-`sitePrice: number | null;` מוסיפים:

```ts
  /**
   * "העובדות" (lib/course/facts.ts): מה שהמוסד מפרסם על הקורס. משמשות לשורת העובדות, לשאלות ולסדר ברשימות.
   * אותם ערכים כמו בעמוד הקורס. בערך 30KB נוספים לכל הקטלוג, לפני דחיסה.
   */
  totalHours: number | null;
  durationMonths: number | null;
  region: string | null;
  certificate: string | null;
  nextCohortDate: string | null;
```

- [ ] **Step 2: השאילתה.** ב-`web/src/lib/data/catalog.ts` מחליפים את מחרוזת ה-select של `courses`:

```ts
        'id, slug, title, category_id, site_price_ils, formats, time_slots, product_type, updated_at, institutions(name), scores(status, value, reviews_needed, per_metric)',
```

ב:

```ts
        'id, slug, title, category_id, site_price_ils, total_hours, duration_months, formats, region, certificate, next_cohort_date, time_slots, product_type, updated_at, institutions(name), scores(status, value, reviews_needed, per_metric)',
```

ובמיפוי, מחליפים את `sitePrice: row.site_price_ils,` ב:

```ts
        sitePrice: row.site_price_ils,
        totalHours: row.total_hours,
        // numeric: כמו בעמוד הקורס, Number כדי שיגיע מספר גם כשהמסד מחזיר מחרוזת.
        durationMonths: row.duration_months === null ? null : Number(row.duration_months),
        region: row.region,
        certificate: row.certificate,
        nextCohortDate: row.next_cohort_date,
```

- [ ] **Step 3: הנתונים לדוגמה בבדיקות.**
  - **`web/src/lib/search/match.test.ts`:** בפונקציה `course`, מתחת ל-`sitePrice: 2000,` מוסיפים את השורות למטה. כל העובדות ידועות, ולכן הסדר בבדיקות הקיימות לא משתנה.

```ts
    totalHours: 30,
    durationMonths: 2,
    region: 'חיפה',
    certificate: 'תעודת השתתפות',
    nextCohortDate: '2027-01-11',
```

  - **`web/src/lib/search/top.test.ts` ו-`web/src/lib/search/keywords.test.ts`:** בפונקציה `course`, מתחת ל-`sitePrice: null,` מוסיפים:

```ts
    totalHours: null,
    durationMonths: null,
    region: null,
    certificate: null,
    nextCohortDate: null,
```

- [ ] **Step 4: טיפוסים.**
  - `pnpm --dir web exec tsc --noEmit`. מצופה: בלי פלט.
  - אם tsc מצביע על עוד מקום שבונה `CourseSummary` מלא, מוסיפים שם את חמשת השדות באותה צורה.

- [ ] **Step 5: כל בדיקות היחידה.**
  - `pnpm --dir web exec vitest run`. מצופה: הכול עובר (בערך 380 בדיקות, כולל 13 החדשות ממשימות 1–3).

- [ ] **Step 6: lint.**
  - `pnpm --dir web exec eslint src/lib/search/types.ts src/lib/data/catalog.ts src/lib/search/match.test.ts src/lib/search/top.test.ts src/lib/search/keywords.test.ts`

- [ ] **Step 7: בדיקה קצרה בשרת.** פותחים את `http://localhost:3100/categories/cooking`: העמוד נטען והרשימה כמו קודם (השדות עוד לא מוצגים). זה מוודא שהשאילתה החדשה עובדת מול המסד המקומי.

- [ ] **Step 8: שורה ביומן.**

```md
53. **הקטלוג מקבל את העובדות:** `total_hours`, `duration_months`, `region`, `certificate` ו-`next_cohort_date` בשאילתה של הקטלוג וב-`CourseSummary`. **נבדק:** tsc, כל בדיקות vitest, ועמוד בישול נטען בשרת המקומי.
```

- [ ] **Step 9: קומיט.**

```bash
git add web/src/lib/search/types.ts web/src/lib/data/catalog.ts web/src/lib/search/match.test.ts web/src/lib/search/top.test.ts web/src/lib/search/keywords.test.ts docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
הקטלוג: שדות העובדות לכל קורס

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: הסדר ברשימות לפי מספר העובדות הידועות

**Files:**
- Modify: `web/src/lib/search/match.ts` (`compareCourses`, שורות 24–39, וה-imports)
- Test: `web/src/lib/search/match.test.ts`

- [ ] **Step 1: לכתוב את הבדיקה.** ב-`web/src/lib/search/match.test.ts`, בתוך `describe('matchCourses', ...)`, אחרי הבדיקה הראשונה:

```ts
  it('puts courses whose institution publishes more facts first, and only then scored before unscored', () => {
    const courses = [
      course({ slug: 'scored-few-facts', score: { status: 'scored', value: 9.1 }, certificate: null, nextCohortDate: null }),
      course({ slug: 'unscored-all-facts' }),
      course({ slug: 'scored-all-facts', score: { status: 'scored', value: 7 } }),
      course({ slug: 'no-price', sitePrice: null }),
    ];
    // 6, 6, 5 ו-4 עובדות ידועות. בין שני השישה, הציון קובע.
    expect(rows(courses).map((r) => r[0])).toEqual(['scored-all-facts', 'unscored-all-facts', 'no-price', 'scored-few-facts']);
  });
```

- [ ] **Step 2: להריץ ולראות שנכשלת.**
  - `pnpm --dir web exec vitest run src/lib/search/match.test.ts`
  - מצופה: הבדיקה החדשה נכשלת. הסדר שמתקבל הוא `['scored-few-facts', 'scored-all-facts', ...]`.

- [ ] **Step 3: לכתוב את הקוד.** ב-`web/src/lib/search/match.ts`:
  - **import:** מוסיפים בראש הקובץ `import { knownFactsCount } from '@/lib/course/facts';`.
  - **`compareCourses`:** מחליפים את ההערה ואת השורה הראשונה של הפונקציה:

```ts
/** מסמך האם, סעיף 8: קודם קורסים עם ציון לפי הציון, אחריהם השאר לפי תאריך העדכון. */
export function compareCourses(a: CourseSummary, b: CourseSummary): number {
```

ב:

```ts
/**
 * הסדר ברשימות (מסמך העיצוב 2026-11-17, "הסדר"):
 * - קודם קורסים שהמוסד מפרסם בהם יותר פרטים: כמה מששת השדות של "העובדות" ידועים (lib/course/facts.ts);
 * - אחר כך קורס עם ציון לפני קורס בלי ציון, ובין קורסים עם ציון הציון קובע, כמו קודם;
 * - בלי ציון: החדש יותר קודם, ובסוף לפי slug.
 * עמודי מוסד ומרצה מסודרים אחרת (data/course-order.ts).
 */
export function compareCourses(a: CourseSummary, b: CourseSummary): number {
  const facts = knownFactsCount(b) - knownFactsCount(a);
  if (facts !== 0) return facts;
```

שאר הגוף לא משתנה.

- [ ] **Step 4: להריץ ולראות שעוברת.**
  - `pnpm --dir web exec vitest run src/lib/search/match.test.ts`. מצופה: כל הבדיקות בקובץ עוברות, כולל החדשה.
  - `pnpm --dir web exec vitest run`. מצופה: הכול עובר.

- [ ] **Step 5: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/lib/search/match.ts src/lib/search/match.test.ts`

- [ ] **Step 6: שורה ביומן.**

```md
54. **הסדר ברשימות:** קודם קורסים שהמוסד מפרסם בהם יותר פרטים (מתוך ששת השדות), אחר כך עם ציון לפני בלי, והציון קובע בין קורסים עם ציון. בעמודי מוסד ומרצה הסדר לא השתנה. **נבדק:** vitest, הבדיקה החדשה וכל השאר עוברות.
```

- [ ] **Step 7: קומיט.**

```bash
git add web/src/lib/search/match.ts web/src/lib/search/match.test.ts docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
הסדר ברשימות: קודם קורסים עם יותר פרטים מהמוסד

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: שורות הרשימה: שורת עובדות ו"מה לשאול"

**Files:**
- Modify: `web/src/components/notebook/results.tsx` (שורות 1–156, ותיאור הרשימה בשורות 199–205)
- Modify: `web/src/components/course/course-row.tsx` (ה-imports, ההערה בשורות 20–28, שורות 84–109)
- Test: בדיקה בעיניים. ה-e2e של עמוד התחום מתעדכן במשימה 17.

- [ ] **Step 1: `ResultRow` ו-`LedgerHead`.** ב-`web/src/components/notebook/results.tsx`:
  - **ה-imports** (שורות 1–10) נעשים:

```tsx
import Link from 'next/link';
import { Fragment } from 'react';
import { SaveButton } from '@/components/account/save-button';
import { AskList } from '@/components/course/ask-before-paying';
import { Mark, PenNote } from '@/components/course/marks';
import { PenArrow } from '@/components/site/pen';
import { askBeforePaying } from '@/lib/course/ask-before-paying';
import { factsLine } from '@/lib/course/facts';
import { showsScore } from '@/lib/course/score-shown';
import { formatIls, missingReviewsText, verifiedGraduatesText } from '@/lib/format';
import type { MatchResult } from '@/lib/search/match';
import { marginNotes } from '@/lib/search/notes';
import { PRODUCT_TYPE_LABEL } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { Advisor, AskLink, FirstAnswerSheet, askKey, type AdvisorApi } from './advisor';
```

  - **מוחקים** את השורה `const verifiedText = ...` (שורה 24). אחרי השינוי, שורה עם בוגרים תמיד מציגה מספר.
  - **מחליפים את `ResultRow` ואת `LedgerHead`** (שורות 32–156, מההערה שמעל `ResultRow` ועד סוף `LedgerHead`) ב:

```tsx
/**
 * שורת תוצאה בסגנון הסיכום: ההערה בעט בשוליים מימין, והקורס משמאלה.
 * ברוחב של 768 פיקסלים ומעלה (של הרשימה, לא של המסך) השורה נפרשת לעמודות, כמו בספר חשבונות.
 * באזור האישי, בעמודה צרה, היא נשארת כמו בנייד.
 * בלי ביקורת מפורסמת (מסמך העיצוב 2026-11-17): שורת עובדות קצרה במקום הציון והבוגרים, רק מה שידוע.
 * בכל שורה "מה לשאול לפני שמשלמים", מקופל, כדי שהרשימה תישאר קצרה.
 * note: ההערה בשוליים, כשהרשימה כבר כתבה את ההערה המשותפת פעם אחת (ראו marginNotes).
 * actions: הכפתורים בסוף השורה ("לשמור", ובאזור האישי גם "להשוואה").
 * highlight: באזור האישי השורה בלי העובדה המודגשת, כמו בציור (Me.dc.html).
 */
export function ResultRow({
  result,
  note = result.note,
  highlight = true,
  actions,
}: {
  result: MatchResult;
  note?: string;
  highlight?: boolean;
  actions?: React.ReactNode;
}) {
  const { course } = result;
  const product = PRODUCT_TYPE_LABEL[course.productType];
  const reviewed = showsScore(course.verifiedCount);
  return (
    <div className="@container">
      <article
        className={cn(
          'ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] pt-4',
          actions ? 'pb-3' : 'pb-[18px]',
          ledgerCols,
          '@3xl:pt-5 @3xl:pb-5',
        )}
      >
        {/* הקורס ראשון בקוד, כדי שקורא מסך יקרא את השם לפני ההערה. העמודות קובעות את המיקום. */}
        <div className="col-start-2 row-start-1 ps-3 @3xl:contents">
          <h3 className="text-[19px] leading-snug font-bold @3xl:col-start-2 @3xl:row-start-1 @3xl:ps-3 @3xl:text-[21px]">
            {/* יעד מגע של 44 פיקסלים, בלי להגדיל את השורה: השוליים השליליים מחזירים את הגובה. */}
            <Link
              href={`/courses/${course.slug}`}
              className="-my-2.5 inline-flex min-h-11 items-center transition-colors duration-150 hover:text-link-hover"
            >
              <span className="pen-under">{course.title}</span>
            </Link>
          </h3>
          <p className="mt-0.5 font-sans text-sm leading-normal text-ink-soft @3xl:col-start-2 @3xl:row-start-2 @3xl:ps-3 @3xl:text-[15px]">
            {course.institutionName}
            {product && ` · ${product}`}
          </p>
          {reviewed ? (
            <>
              {course.score.status === 'scored' ? (
                <p className="mt-2 flex items-baseline gap-1.5 font-sans text-sm leading-tight @3xl:col-start-3 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-0 @3xl:flex-col @3xl:items-start @3xl:gap-1">
                  <span aria-hidden="true" className="text-[26px] leading-none font-bold @3xl:text-[34px]">
                    {course.score.value.toFixed(1)}
                  </span>
                  <span aria-hidden="true" className="@3xl:text-[13px] @3xl:text-ink-soft">
                    ציון בוגרים מתוך 10
                  </span>
                  <span className="sr-only">ציון בוגרים {course.score.value.toFixed(1)} מתוך 10</span>
                </p>
              ) : (
                <p className="mt-2 font-sans text-[15px] leading-snug @3xl:col-start-3 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-1 @3xl:text-sm">
                  <strong>עוד אין ציון בוגרים.</strong>
                  {course.score.status === 'not_enough_reviews' && course.score.reviewsNeeded > 0 && (
                    <>
                      {' '}
                      <span className="text-ink-soft">{missingReviewsText(course.score.reviewsNeeded)}.</span>
                    </>
                  )}
                </p>
              )}
              <p className="mt-1.5 font-sans text-[15px] leading-normal tabular-nums @3xl:col-start-4 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-1">
                <span className="@3xl:block">{verifiedGraduatesText(course.verifiedCount)}</span>
                <span className="@3xl:hidden"> · </span>
                {course.sitePrice !== null ? (
                  <strong className="@3xl:mt-1 @3xl:block @3xl:text-[17px]">
                    <bdi dir="rtl">{formatIls(course.sitePrice)}</bdi>
                    <span className="hidden font-normal text-ink-soft @3xl:inline @3xl:text-[13px]"> באתר המוסד</span>
                  </strong>
                ) : (
                  <span className="text-ink-soft @3xl:mt-1 @3xl:block">המוסד לא מפרסם מחיר</span>
                )}
              </p>
            </>
          ) : (
            // בלי ביקורות: מחיר או "מחיר לא מפורסם", משך, מתכונת ומיקום. בדיו, כמו המחיר בשורה עם ציון.
            <p className="mt-2 font-sans text-[15px] leading-normal @3xl:col-span-2 @3xl:col-start-3 @3xl:row-span-3 @3xl:row-start-1 @3xl:mt-1">
              {factsLine(course).map((part, i) => (
                <Fragment key={part.key}>
                  {i > 0 && <span className="text-ink-soft"> · </span>}
                  {part.key !== 'price' ? (
                    part.text
                  ) : course.sitePrice !== null ? (
                    <strong className="tabular-nums">
                      <bdi dir="rtl">{part.text}</bdi>
                    </strong>
                  ) : (
                    <span className="text-ink-soft">{part.text}</span>
                  )}
                </Fragment>
              ))}
            </p>
          )}
          {highlight && course.highlight && (
            <p className="mt-1.5 font-sans text-[15px] leading-normal @3xl:col-start-2 @3xl:row-start-3 @3xl:mt-2 @3xl:ps-3">
              <Mark source="grads">
                {course.highlight.label}: {course.highlight.text}
              </Mark>
            </p>
          )}
          <details className="mt-1 font-sans @3xl:col-start-2 @3xl:row-start-4 @3xl:ps-3">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-pen text-[15px] font-medium text-pen transition-colors duration-150 hover:text-link-hover lg:text-base [&::-webkit-details-marker]:hidden">
              <PenArrow />
              מה לשאול לפני שמשלמים
            </summary>
            <AskList questions={askBeforePaying(course)} className="pb-2" />
          </details>
          {actions && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 @3xl:col-start-5 @3xl:row-span-4 @3xl:row-start-1 @3xl:mt-0 @3xl:self-start">
              {actions}
            </div>
          )}
        </div>
        <p className="col-start-1 row-start-1 pt-1.5 pe-2 font-pen text-sm leading-snug font-medium text-pen @3xl:row-span-4 lg:text-[15px]">
          {note && (
            <>
              <PenArrow />
              {note}
            </>
          )}
        </p>
      </article>
    </div>
  );
}

/**
 * שורת הכותרות של העמודות, רק כשהרשימה רחבה. קישוט: כל שורה אומרת את אותו דבר במילים.
 * reviewed: יש ברשימה קורס עם ביקורת. בלי אף אחד, שתי העמודות האמצעיות הן "מה המוסד מפרסם".
 */
function LedgerHead({ reviewed }: { reviewed: boolean }) {
  return (
    <div className="@container">
      <div
        aria-hidden="true"
        className={cn(
          'hidden pt-5 pb-1.5 font-sans text-[13px] leading-tight font-semibold text-ink-soft @3xl:grid',
          ledgerCols,
        )}
      >
        <span />
        <span className="ps-3">קורס</span>
        {reviewed ? (
          <>
            <span>ציון בוגרים</span>
            <span>בוגרים ומחיר</span>
          </>
        ) : (
          <span className="col-span-2">מה המוסד מפרסם</span>
        )}
        <span />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: מעל הרשימה.** באותו קובץ, ב-`Results`:
  - **התיאור:** מחליפים

```tsx
              : 'מסודר לפי ציון בוגרים. סופרים רק בוגרים שהעלו הוכחה, ואף מוכר לא שילם על מקום ברשימה.'}
```

ב:

```tsx
              : 'קודם קורסים שהמוסד מפרסם בהם יותר פרטים. אף מוכר לא שילם על מקום ברשימה.'}
```

  - **כותרות העמודות:** מחליפים `<LedgerHead />` ב-`<LedgerHead reviewed={results.some((r) => showsScore(r.course.verifiedCount))} />`.

- [ ] **Step 3: `CourseRow`.** ב-`web/src/components/course/course-row.tsx`:
  - **imports:** מוסיפים:

```tsx
import { factsLine } from '@/lib/course/facts';
import { showsScore } from '@/lib/course/score-shown';
```

  - **בהערה מעל `CourseRow`:** ממש לפני השורה ` * השורה נכתבת אל הדף כשהיא נכנסת למסך (data-anim="ink"), ובריחוף העט מותח קו מתחת לשם (.pen-under).` מוסיפים:

```tsx
 * קורס בלי ביקורת מפורסמת (מסמך העיצוב 2026-11-17): מה המוסד מפרסם (משך, מתכונת ומיקום) במקום "עוד אין ציון בוגרים".
 * המחיר בעמודה שלידו, כמו קודם.
```
  - **בגוף הפונקציה:** מתחת ל-`const removed = course.status === 'removed';` מוסיפים:

```tsx
  const facts = factsLine(course).filter((part) => part.key !== 'price');
```

  - **מחליפים את הבלוק של הציון** (שורות 84–109, מ-`{score.status === 'scored' ? (` עד ה-`)}` שלפני ה-`<p` של המחיר) ב:

```tsx
      {showsScore(course.reviewTotal) ? (
        score.status === 'scored' ? (
          <p className="flex items-center gap-x-2.5 font-sans text-sm leading-snug lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex-col lg:items-start lg:gap-y-1 lg:pt-1">
            <span aria-hidden="true" className="text-[28px] leading-none font-bold tabular-nums lg:text-[34px]">
              {score.value.toFixed(1)}
            </span>
            <span className="sr-only">
              {scoreLabel}: {score.value.toFixed(1)}.{' '}
            </span>
            <span>
              <span aria-hidden="true" className="block">
                {scoreLabel}
              </span>
              <span className="block text-ink-soft">{verifiedGraduatesText(score.reviewCount)}</span>
            </span>
          </p>
        ) : (
          <p className="font-sans text-sm leading-snug lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-1.5">
            <strong className="block text-[15px]">עוד אין ציון בוגרים</strong>
            {score.status === 'not_enough_reviews' && score.reviewCount > 0 && (
              <span className="block text-ink-soft">{verifiedReviewsText(score.reviewCount)}</span>
            )}
            {score.status === 'not_enough_reviews' && score.reviewsNeeded > 0 && (
              <span className="block text-ink-soft">{reviewsToScoreText(score.reviewsNeeded)}</span>
            )}
          </p>
        )
      ) : (
        facts.length > 0 && (
          <p className="font-sans text-[15px] leading-snug lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-1.5">
            {facts.map((part) => part.text).join(' · ')}
          </p>
        )
      )}
```

- [ ] **Step 4: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/components/notebook/results.tsx src/components/course/course-row.tsx`

- [ ] **Step 5: בדיקה בעיניים** (375 ומחשב):
  - **`/categories/cooking`:**
    - "בישול ביתי למתחילים" עם שורת עובדות: "1,800 ₪ · 2.5 חודשים, 30 שעות · בכיתה · חיפה", בלי "עוד אין ציון".
    - שני הקורסים עם הציון כמו קודם.
    - מעל הרשימה: "קודם קורסים שהמוסד מפרסם בהם יותר פרטים."
    - "מה לשאול לפני שמשלמים" נפתח ונסגר בכל שורה, בעט.
    - במחשב העמודות עומדות זו מתחת לזו.
  - **`/institutions/sample-college`:** הקורס בלי ביקורות מראה משך, מתכונת ומיקום בעמודה של הציון.
  - **`/me`** (אם מחובר מקומית): השורות השמורות לא נשברו.
  - מריצים `/impeccable` על `results.tsx` מול `.impeccable/surfaces/web-src-app-page-tsx.md`.

- [ ] **Step 6: שורה ביומן.**

```md
55. **השורות ברשימות:** קורס בלי ביקורות מקבל שורת עובדות (מחיר או "מחיר לא מפורסם", משך, מתכונת ומיקום) במקום "עוד אין ציון בוגרים". בכל שורה "מה לשאול לפני שמשלמים", מקופל, ומעל הרשימה "קודם קורסים שהמוסד מפרסם בהם יותר פרטים". גם בעמודי מוסד, מרצה והסבה. **נבדק:** tsc, eslint, ובשרת המקומי ב-375 ובמחשב (בישול, מוסד לדוגמה).
```

- [ ] **Step 7: קומיט.**

```bash
git add web/src/components/notebook/results.tsx web/src/components/course/course-row.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
הרשימות: שורת עובדות ומה לשאול, במקום עוד אין ציון

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: עמודי התחומים, כל הקורסים והמוסד

**Files:**
- Modify: `web/src/app/categories/[slug]/page.tsx` (התיאור בשורה 37, שורות 46–48, 95–122)
- Modify: `web/src/components/category/top-by-graduates.tsx` (ההערה בשורות 9–19, שורות 21–31)
- Modify: `web/src/app/courses/page.tsx` (כל הקובץ)
- Modify: `web/src/app/institutions/[slug]/page.tsx` (שורות 43–44, 85)
- Modify: `web/src/components/notebook/notebook.tsx` (כותרת הרשימה, שורות 699–705)
- Test: בדיקה בעיניים.

- [ ] **Step 1: עמוד תחום.** ב-`web/src/app/categories/[slug]/page.tsx`:
  - **התיאור (metadata):** מחליפים

```tsx
    description: `${category.description ? `${category.description} ` : ''}קורסים ב${category.name}, לפי ציון של בוגרים מאומתים בלבד. אף מוכר לא משלם לנו.`,
```

ב:

```tsx
    description: `${category.description ? `${category.description} ` : ''}קורסים ב${category.name}: מה כל מוסד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. אף מוכר לא משלם לנו.`,
```

  - **`gradsText`:** מחליפים את שתי השורות של `gradsText` ב:

```tsx
/** רק כשיש בוגרים: בלי "עוד אין בוגרים מאומתים" בפתיחה של תחום (מסמך העיצוב 2026-11-17). */
const gradsText = (n: number) => (n === 1 ? 'בוגר מאומת אחד' : `${n} בוגרים מאומתים`);
```

  - **הפתיחה:** מחליפים

```tsx
          {empty ? 'עוד אין בו קורסים באתר.' : 'כל הקורסים בתחום, לפי ציון הבוגרים. אפשר לצמצם בשורות 2 עד 4.'}
```

ב:

```tsx
          {empty ? 'עוד אין בו קורסים באתר.' : 'כל הקורסים בתחום. אפשר לצמצם בשורות 2 עד 4.'}
```

  - **ההערה בעט:** מחליפים את התוכן של `<div className="lg:pt-8">` עד לפני `{careerLink && ...}` ב:

```tsx
          {empty ? (
            <PenNote arrow className="text-base font-medium lg:text-lg">
              כשנוסיף קורס בתחום, הוא יופיע כאן.
            </PenNote>
          ) : (
            <>
              <PenNote arrow className="text-base font-medium lg:text-lg">
                בתחום: {coursesText(category.courseCount)}
                {category.gradCount > 0 && `, ${gradsText(category.gradCount)}`}.
              </PenNote>
              {/* "המובילים לפי בוגרים" מופיעים רק כשיש בתחום קורס עם ציון (top-by-graduates.tsx). */}
              <TopByGraduates courses={catalog.courses} categorySlug={category.slug} />
            </>
          )}
```

- [ ] **Step 2: "המובילים לפי בוגרים" רק כשיש ציון.** ב-`web/src/components/category/top-by-graduates.tsx`:
  - **ההערה:** מחליפים את המשפט `* אף פעם לא לפי מספר נרשמים. בלי קורס עם ציון: שורה אחת בעט, שמסבירה למה אין רשימה.` ב-`* אף פעם לא לפי מספר נרשמים. בלי קורס עם ציון בתחום, החלק לא מוצג בכלל (מסמך העיצוב 2026-11-17).`
  - **הגוף:** מחליפים את כל הגוף של `TopByGraduates`, מ-`const top = topByGraduates(courses, categorySlug);` (שורה 21) ועד ה-`}` שסוגר את הפונקציה, ב:

```tsx
  const top = topByGraduates(courses, categorySlug);
  if (top.length === 0) return null;
  return (
    <section aria-labelledby="top-title" className="mt-6 font-sans lg:mt-3">
      <h2 id="top-title" className="pen-rule text-[19px] leading-snug font-bold">
        המובילים לפי בוגרים
      </h2>
      <ol className="mt-3 space-y-3 lg:mt-2 lg:space-y-2.5">
        {top.map((course, i) => (
          <li key={course.slug} data-anim="ink" className="grid grid-cols-[30px_minmax(0,1fr)] items-start gap-x-2.5">
            <PenNumber n={i + 1} className="mt-0.5" />
            <div className="min-w-0">
              {/* יעד מגע של 44 פיקסלים בלי להגדיל את השורה: השוליים השליליים מחזירים את הגובה, כמו ברשימת הקורסים. */}
              <Link
                href={`/courses/${course.slug}`}
                className="-my-2.5 inline-flex min-h-11 items-center text-base leading-snug font-bold transition-colors duration-150 hover:text-link-hover"
              >
                <span className="pen-under">{course.title}</span>
              </Link>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft tabular-nums lg:mt-0">
                <span className="text-[17px] font-bold text-ink">{course.score.value.toFixed(1)}</span> ציון בוגרים,{' '}
                {verifiedGraduatesText(course.verifiedCount)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <PenNote arrow className="mt-2 hidden text-sm lg:block">
        רק קורסים עם {MIN_REVIEWS} ביקורות מאומתות ומעלה. לא לפי מספר נרשמים.
      </PenNote>
    </section>
  );
}
```

- [ ] **Step 3: כל הקורסים.** מחליפים את כל `web/src/app/courses/page.tsx` ב:

```tsx
import type { Metadata } from 'next';
import { NotebookPage } from '@/components/notebook/notebook-page';
import { SubjectsToc } from '@/components/site/subjects-toc';
import { getCatalog } from '@/lib/data/catalog';
import { EMPTY_QUERY } from '@/lib/search/types';
import { SITE_NAME } from '@/lib/site';

export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `כל הקורסים | ${SITE_NAME}`,
  alternates: { canonical: '/courses' },
  description: 'כל הקורסים באתר: מה כל מוסד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. אף מוכר לא משלם לנו.',
};

/**
 * אותה מחברת כמו בדף הבית, בלי אף שורה ממולאת, והרשימה המלאה מתחת.
 * בלי ספירה של כל הקורסים ובלי "עוד אין ציון" (מסמך העיצוב 2026-11-17, עיקרון 4): מספר מופיע רק כשהוא עוזר לבחור.
 */
export default async function CoursesPage() {
  const catalog = await getCatalog();
  return (
    <NotebookPage
      catalog={catalog}
      base={EMPTY_QUERY}
      fixedWhat={false}
      alwaysShowResults
      heading="כל הקורסים"
      intro="כל הקורסים באתר. אפשר לצמצם בארבע השורות."
      after={<SubjectsToc categories={catalog.categories} heading="לפי תחום" className="lg:max-w-[620px]" />}
    />
  );
}
```

- [ ] **Step 4: כותרת הרשימה בכל הקורסים.** ב-`web/src/components/notebook/notebook.tsx` מחליפים

```tsx
          heading={
            emptyCategory
              ? 'עוד אין קורסים בתחום'
              : active.length > 0
                ? coursesTitle(results.length)
                : allCoursesTitle(results.length)
          }
```

ב:

```tsx
          heading={
            emptyCategory
              ? 'עוד אין קורסים בתחום'
              : active.length > 0
                ? coursesTitle(results.length)
                : fixedWhat
                  ? allCoursesTitle(results.length)
                  : // כל הקורסים: בלי "563 קורסים" בכותרת (מסמך העיצוב 2026-11-17, עיקרון 4).
                    'הרשימה המלאה'
          }
```

- [ ] **Step 5: עמוד מוסד.** ב-`web/src/app/institutions/[slug]/page.tsx`:
  - **מוחקים** את השורה `const gradsText = (n: number) => (n === 0 ? 'עוד אין בוגרים מאומתים' : verifiedGraduatesText(n));`.
  - **מחליפים** `{coursesText(courses.length)}, {gradsText(grads)}` ב:

```tsx
                {coursesText(courses.length)}
                {grads > 0 && `, ${verifiedGraduatesText(grads)}`}
```

- [ ] **Step 6: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint "src/app/categories/[slug]/page.tsx" src/components/category/top-by-graduates.tsx src/app/courses/page.tsx "src/app/institutions/[slug]/page.tsx" src/components/notebook/notebook.tsx`

- [ ] **Step 7: בדיקה בעיניים** (375 ומחשב):
  - **`/categories/cooking`:** "בתחום: 3 קורסים, ... בוגרים מאומתים." ו"המובילים לפי בוגרים" כמו קודם.
  - **תחום בלי ציון** (למשל `/categories/photography` עם ה-seed): אין "המובילים לפי בוגרים", ואין "עוד אין בוגרים מאומתים".
  - **`/courses`:** אין "X קורסים ב-Y תחומים" ואין "לאף אחד מהם עוד אין ציון". כותרת הרשימה "הרשימה המלאה".
  - **`/institutions/sample-academy`:** בלי "עוד אין בוגרים מאומתים" כשאין.

- [ ] **Step 8: שורה ביומן.**

```md
56. **עמודי תחום, כל הקורסים ומוסד:** בלי "עוד אין בוגרים מאומתים" ובלי "לפי ציון הבוגרים" בפתיחה. "המובילים לפי בוגרים" רק כשיש בתחום קורס עם ציון. ב-/courses בלי ספירת כל הקורסים, וכותרת הרשימה "הרשימה המלאה". **נבדק:** tsc, eslint, ובשרת המקומי ב-375 ובמחשב.
```

- [ ] **Step 9: קומיט.**

```bash
git add "web/src/app/categories/[slug]/page.tsx" web/src/components/category/top-by-graduates.tsx web/src/app/courses/page.tsx "web/src/app/institutions/[slug]/page.tsx" web/src/components/notebook/notebook.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
תחומים, כל הקורסים ומוסד: בלי ציון ריק ובלי ספירה של הכול

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: ההשוואה ומגש ההשוואה, בלי "עוד אין ציון" לקורס בלי ביקורות

**Files:**
- Modify: `web/src/lib/compare/rows.ts` (`CompareCourse`, `toCompareCourse`, `scoreCell`, החלק `score`)
- Modify: `web/src/components/account/compare-tray.tsx` (שורות 72–81)
- Test: `web/src/lib/compare/rows.test.ts`

- [ ] **Step 1: לכתוב את הבדיקה.** ב-`web/src/lib/compare/rows.test.ts`, בתוך `describe('buildCompareRows', ...)`:

```ts
  it('leaves out the score when no course in the comparison has a published review', () => {
    const a = course({ reviewTotal: 0, score: { status: 'none' }, outcome: null });
    const b = course({
      id: 'b',
      slug: 'b-sample',
      reviewTotal: 0,
      score: { status: 'not_enough_reviews', reviewCount: 0, reviewsNeeded: 5 },
      outcome: null,
    });
    expect(buildCompareRows([a, b]).map((s) => s.key)).not.toContain('score');
  });

  it('says a course has no reviews yet, next to a course with a score', () => {
    const scored = course({ score: { status: 'scored', value: 7.9, reviewCount: 23, recommendPct: 91, stale: false } });
    const none = course({ id: 'b', slug: 'b-sample', reviewTotal: 0, score: { status: 'none' } });
    expect(rowOf(buildCompareRows([scored, none]), 'score')?.cells[1]).toEqual({ text: null, missing: 'עוד אין ביקורות' });
  });
```

- [ ] **Step 2: להריץ ולראות שנכשלת.**
  - `pnpm --dir web exec vitest run src/lib/compare/rows.test.ts`
  - מצופה: שתי הבדיקות החדשות נכשלות. החלק `score` קיים, והתא הוא `{ text: 'עוד אין ציון', ... }`.

- [ ] **Step 3: לכתוב את הקוד.** ב-`web/src/lib/compare/rows.ts`:
  - **import:** `import { showsScore } from '@/lib/course/score-shown';`
  - **`CompareCourse`:** ב-`Pick<CoursePageData, ...>` מוסיפים את השורה `| 'reviewTotal'` אחרי `| 'score'`.
  - **`toCompareCourse`:** מתחת ל-`score: page.score,` מוסיפים `reviewTotal: page.reviewTotal,`.
  - **`scoreCell`:** מחליפים את כל הפונקציה ב:

```ts
/**
 * כמו תיבת הציון בעמוד הקורס. בלי ביקורת מפורסמת אין ציון (lib/course/score-shown.ts): התא ריק,
 * וכשלאף קורס בהשוואה אין ביקורת, השורה והחלק יורדים לבד (buildCompareRows).
 */
function scoreCell(c: CompareCourse): CompareCell {
  const { score } = c;
  if (!showsScore(c.reviewTotal)) return { text: null, missing: 'עוד אין ביקורות' };
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
  return { text: 'עוד אין ציון', sub: verifiedReviewsText(c.reviewTotal) };
}
```

  - **בחלק `score`:** מחליפים

```ts
        row('score', 'ציון מתוך 10', 'figure', (c) => scoreCell(c.score)),
        row('recommend', 'ממליצים', 'figure', (c) =>
          c.score.status === 'scored' && c.score.recommendPct !== null
            ? { text: `${Math.round(c.score.recommendPct)}%` }
            : { text: null, missing: 'עוד אין ציון' },
        ),
```

ב:

```ts
        row('score', 'ציון מתוך 10', 'figure', scoreCell),
        row('recommend', 'ממליצים', 'figure', (c) =>
          c.score.status === 'scored' && c.score.recommendPct !== null
            ? { text: `${Math.round(c.score.recommendPct)}%` }
            : { text: null, missing: showsScore(c.reviewTotal) ? 'עוד אין ציון' : 'עוד אין ביקורות' },
        ),
```

- [ ] **Step 4: מגש ההשוואה.** ב-`web/src/components/account/compare-tray.tsx`:
  - **import:** `import { showsScore } from '@/lib/course/score-shown';`
  - **מחליפים** את ה-else של הציון:

```tsx
              ) : (
                <p className="mt-1 font-sans text-[13px] leading-tight text-ink-soft">עוד אין ציון</p>
              )}
```

ב:

```tsx
              ) : showsScore(course.verifiedCount) ? (
                <p className="mt-1 font-sans text-[13px] leading-tight text-ink-soft">עוד אין ציון</p>
              ) : null}
```

- [ ] **Step 5: להריץ ולראות שעוברת.**
  - `pnpm --dir web exec vitest run src/lib/compare/rows.test.ts`. מצופה: כל הבדיקות בקובץ עוברות, כולל שתי החדשות.

- [ ] **Step 6: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/lib/compare/rows.ts src/lib/compare/rows.test.ts src/components/account/compare-tray.tsx`

- [ ] **Step 7: בדיקה בעיניים.**
  - **`/compare?c=home-cooking-sample,phone-photo-sample`** (שניהם בלי ביקורות): אין החלק "ציון הבוגרים".
  - **`/compare?c=full-stack-sample,home-cooking-sample`:** בעמודה של הבישול כתוב "עוד אין ביקורות", ולא "עוד אין ציון".

- [ ] **Step 8: שורה ביומן.**

```md
57. **ההשוואה ומגש ההשוואה:** בלי "עוד אין ציון" לקורס בלי ביקורות. כשלאף קורס בהשוואה אין ביקורת, החלק "ציון הבוגרים" יורד. **נבדק:** vitest (2 בדיקות חדשות), tsc, ובשרת המקומי.
```

- [ ] **Step 9: קומיט.**

```bash
git add web/src/lib/compare/rows.ts web/src/lib/compare/rows.test.ts web/src/components/account/compare-tray.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
השוואה: בלי ציון ריק לקורס בלי ביקורות

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: דף הבית: תיבה אחת, "בשבילי" או "בשביל העובדים", והשורות מתחת

**Files:**
- Modify: `web/src/components/notebook/pen-example.tsx` (כל הקומפוננטה)
- Modify: `web/src/components/notebook/notebook.tsx` (הפרופס, המצב, הטופס)
- Modify: `web/src/components/notebook/results.tsx` (`Results`: הפרופ `forTeam`)
- Modify: `web/src/components/notebook/notebook-page.tsx` (כותרת ופתיח לא חובה)
- Modify: `web/src/app/page.tsx`
- Test: בדיקה בעיניים. ה-e2e של דף הבית מתעדכן במשימה 17.

- [ ] **Step 1: דוגמה אחת שלא מתחלפת.** ב-`web/src/components/notebook/pen-example.tsx` מחליפים את `PenExample` כולה ב:

```tsx
/**
 * הדוגמה בשורה הראשונה, כשהשורה ריקה: "למשל:" מודפס באפור, ואחריו דוגמה שנכתבת בעט בהיר ומתחלפת,
 * כאילו מישהו כותב בשוליים. העט בהיר, כדי שלא תיראה כמו תשובה שכבר נכתבה, אבל לא בהיר מדי:
 * בשקיפות 80% הניגודיות 5.2:1, מעל 4.5:1 של WCAG AA (ב-60% היא הייתה 3.2:1).
 * מוסתרת מקורא מסך: השדה עצמו נושא את הדוגמה המלאה ב-placeholder.
 * נעלמת כשכותבים או כשהשדה בפוקוס (globals.css, .pen-example). לא מתחלפת כשהיא מחוץ למסך,
 * כשהלשונית מוסתרת, או כשהמבקר ביקש פחות תנועה: אז נשארת הדוגמה הראשונה.
 * words: בדף הבית דוגמה אחת (התיבה הגדולה). עם דוגמה אחת אין החלפה ואין עמעום, אחרת היא הייתה נעלמת אחרי 3 שניות.
 */
export function PenExample({ words = WHAT_EXAMPLES, className }: { words?: readonly string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const rotates = words.length > 1;
  useEffect(() => {
    if (!rotates) return;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (ref.current) io.observe(ref.current);
    const timer = window.setInterval(() => {
      if (!visible || document.hidden) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      setIndex((n) => (n + 1) % words.length);
    }, CYCLE_MS);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
    };
  }, [rotates, words.length]);
  return (
    <span ref={ref} aria-hidden="true" className={cn('pen-example pointer-events-none', className)}>
      <span className="font-sans text-[15px] text-ink-soft lg:text-[17px]">למשל:</span>{' '}
      <span
        key={index}
        className={cn(
          'inline-block font-pen text-[21px] font-medium text-pen/80 lg:text-[23px]',
          rotates && 'pen-example-word',
        )}
      >
        {words[index % words.length]}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: פרופ חדש למחברת.** ב-`web/src/components/notebook/notebook.tsx`:
  - **ב-`NotebookProps`**, אחרי `advisor?: boolean;` מוסיפים:

```ts
  /**
   * דף הבית (מסמך העיצוב 2026-11-17): שורה 1 היא תיבה גדולה מעל השורות, ומעליה "בשבילי" או "בשביל העובדים".
   * הטקסט בתיבה עובר דרך /api/understand, כמו בשורה. השורות, עם התחומים לבחירה בשורה 1, מתחת לתיבה,
   * תחת "או בחרו בעצמכם".
   */
  whatBox?: boolean;
```

  - **ליד `WHAT_EXAMPLE`** (שורה 125) מוסיפים:

```ts
/** הדוגמה ליד הקו של התיבה הגדולה בדף הבית, במילים של מסמך העיצוב. */
const BOX_EXAMPLE = 'אני בעלת עסק, רוצה ללמוד לבנות סוכני AI לעסק שלי';
```

  - **בפרמטרים של `Notebook`:** אחרי `advisor = false,` מוסיפים `whatBox = false,`.
  - **במצב:** מתחת ל-`const [working, setWorking] = useState(false);` מוסיפים:

```ts
  // "בשבילי" או "בשביל העובדים", רק בדף הבית. בשלב 1 היא רק מוסיפה את "רוצים שנכין לכם רשימה?" מתחת לרשימה.
  // ברירת המחדל: בשבילי. לא נשמרת בכתובת: החיפוש לחברות, עם ברירות מחדל משלו, בא בשלב 2.
  const [forTeam, setForTeam] = useState(false);
```

  - **`shownWhat`:** מחליפים `const shownWhat = query.q || query.cats.map(nameOf).join(', ');` ב:

```ts
  // בתיבה של דף הבית רק המילים של המבקר. התחומים שנבחרו כתובים בשורה 1, מתחת לתיבה.
  const shownWhat = query.q || (whatBox ? '' : query.cats.map(nameOf).join(', '));
```

- [ ] **Step 3: חלקים משותפים לפני ה-`return`.** ב-`notebook.tsx`, ממש לפני `return (` של `Notebook` (שורה 338), מוסיפים את הקבועים למטה. ארבעת ה-JSX הם מה שכבר קיים בקובץ (שורות 367–397, 420–427, 631–682 ו-685–690). הם עוברים לקבועים, כדי שיופיעו במקום אחר בכל מצב. בצעדים 5 ו-6 המקומות הישנים מוחלפים בהם.

```tsx
  const whatExample = whatBox ? BOX_EXAMPLE : WHAT_EXAMPLE;
  // שורה 1: בדף הבית היא התיבה הגדולה, ובשאר העמודים השדה בשורה. אותו שדה, אותו name ואותה הבנה.
  const whatInput = (
    <div
      key={shownWhat}
      data-copy={shownWhat || whatExample}
      data-empty={shownWhat === '' ? '' : undefined}
      className={cn(
        growCopy,
        'grid min-w-0 self-stretch after:pt-4 after:ps-3 after:pb-1 after:pe-1',
        whatBox && 'min-h-[104px] lg:min-h-[112px]',
      )}
    >
      <textarea
        name="what"
        rows={1}
        defaultValue={shownWhat}
        maxLength={MAX_Q_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        aria-label="מה ללמוד"
        aria-describedby={advisor ? WHAT_NOTE_ID : undefined}
        placeholder={whatExample}
        // בתיבה הגדולה התחומים לבחירה בשורה 1 שמתחת, ולא נפתחים מהתיבה.
        onFocus={whatBox ? undefined : () => setOpen('what')}
        onInput={(event) => syncCopy(event.currentTarget, whatExample)}
        onKeyDown={submitOnEnter}
        onBlur={(event) => void commitWhat(event.currentTarget.value)}
        className={cn(
          'col-start-1 row-start-1 min-w-0 resize-none overflow-hidden pt-4 ps-3 pb-1 pe-1 text-start',
          penInput,
          inputExample,
          // הדוגמה המודפסת נשארת לקורא מסך ולמי שכבר בשדה. מחוץ לשדה מוצגת הדוגמה שנכתבת בעט.
          '[&:not(:focus)]:placeholder:text-transparent',
          isStruck('what') && struck,
        )}
      />
      <PenExample
        words={whatBox ? [BOX_EXAMPLE] : undefined}
        className="col-start-1 row-start-1 self-start pt-4 ps-3 pe-1 leading-normal"
      />
    </div>
  );
  // הערה של האתר בעט, על השורה שמתחת לשדה, עם חץ שעולה אליו: גם שאלה נכתבת שם.
  const advisorNote = (
    <div className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] pt-2.5 pb-2 lg:pt-3 lg:pb-2.5">
      <PenNote arrow="up" className="col-start-2 ms-3 font-medium text-pretty lg:text-base">
        <span id={WHAT_NOTE_ID}>אפשר לכתוב כאן גם שאלה. היועץ יענה מתוך מה שיש באתר.</span>
      </PenNote>
    </div>
  );
  // מה הבנו מהמילים, או הקורסים בשם הזה. בדף הבית מתחת לתיבה, ובשאר העמודים מתחת לשורות.
  const whatStatus = (
    <>
      <p role="status" className={cn(smallNote, 'mt-3')}>
        {working ? (
          <>מבינים את ״{query.q}״…</>
        ) : named ? null : query.q && query.cats.length > 0 ? (
          <>
            הבנו: {query.cats.map(nameOf).join(', ')}.{' '}
            <button type="button" className={smallLink} onClick={() => setOpen('what')}>
              לא מדויק?
            </button>
          </>
        ) : query.q ? (
          <>
            לא מצאנו תחום שמתאים ל״{query.q}״.{' '}
            <button type="button" className={smallLink} onClick={() => setOpen('what')}>
              לבחור מהרשימה
            </button>
          </>
        ) : null}
      </p>
      {named && !working && (
        <>
          {/* הערה של האתר: עט, עם חץ (מסמך העיצוב, 3א.2). */}
          <p className="font-pen text-[15px] leading-snug font-medium text-pen lg:text-[17px]">
            <PenArrow />
            {named.by === 'title' ? 'יש לנו קורס בשם הזה: ' : `יש לנו קורסים של ${named.courses[0].institutionName}: `}
            {named.courses.map((course, i) => (
              <Fragment key={course.slug}>
                {i > 0 && ', '}
                <Link href={`/courses/${course.slug}`} className={smallLink}>
                  {course.title}
                </Link>
              </Fragment>
            ))}
          </p>
          {similar.length > 0 && (
            <p className={cn(smallNote, 'mt-1')}>
              קורסים דומים:{' '}
              {similar.map((course, i) => (
                <Fragment key={course.slug}>
                  {i > 0 && ', '}
                  <Link href={`/courses/${course.slug}`} className={smallLink}>
                    {course.title}
                  </Link>
                </Fragment>
              ))}
            </p>
          )}
        </>
      )}
    </>
  );
  const submitButton = (
    <button
      type="submit"
      className={cn(
        buttonVariants(),
        'mt-3.5 h-[50px] w-full font-sans text-base font-bold lg:h-[54px] lg:max-w-[400px] lg:text-[17px]',
      )}
    >
      {buttonLabel}
    </button>
  );
```

- [ ] **Step 4: התיבה והבחירה מעל השורות.** ב-`notebook.tsx` מחליפים את השורה

```tsx
          <p className="ms-(--margin) pt-1 ps-3 pb-1.5 text-lg leading-normal lg:text-xl">אני רוצה ללמוד</p>
```

ב:

```tsx
          {whatBox ? (
            <>
              {/* בשביל מי: שתי דלתות שוות (עיקרון 5). בחירה אחת מתוך שתיים, כמו בשורה "למה". */}
              <div
                role="group"
                aria-label="בשביל מי"
                className="grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center pb-3"
              >
                <span className={cn(panelLabel, 'pt-0')}>בשביל מי?</span>
                <div className="flex flex-wrap gap-2 ps-3">
                  <ChoiceChip pressed={!forTeam} onClick={() => setForTeam(false)}>
                    בשבילי
                  </ChoiceChip>
                  <ChoiceChip pressed={forTeam} onClick={() => setForTeam(true)}>
                    בשביל העובדים
                  </ChoiceChip>
                </div>
              </div>
              {/* התיבה: שורה 1 של המחברת, גבוהה. השוליים ריקים: הכותרת שמעליה היא השאלה. */}
              <div className="ruled-top">
                <div className="ruled-row ruled-active grid grid-cols-[var(--margin)_minmax(0,1fr)]">
                  <span aria-hidden="true" />
                  {whatInput}
                </div>
                {advisor && advisorNote}
              </div>
              <div className="ms-(--margin) ps-3">
                {whatStatus}
                {submitButton}
              </div>
              <p className="ms-(--margin) mt-9 ps-3 pb-1.5 text-lg leading-normal lg:mt-12 lg:text-xl">או בחרו בעצמכם</p>
            </>
          ) : (
            <p className="ms-(--margin) pt-1 ps-3 pb-1.5 text-lg leading-normal lg:text-xl">אני רוצה ללמוד</p>
          )}
```

- [ ] **Step 5: שורה 1 בתוך השורות.** ב-`notebook.tsx`, בתוך ה-`AnswerLine` של שורה 1, מחליפים את כל ה-children (מ-`{fixedWhat ? (` עד ה-`)}` שלפני `</AnswerLine>`, שורות 362–398) ב:

```tsx
                {fixedWhat ? (
                  <p className={lineText}>
                    <PenAnswer>{shownWhat}</PenAnswer>
                  </p>
                ) : whatBox ? (
                  // בדף הבית: לבחור תחום בעצמכם. התחומים נפתחים מתחת לשורה, כמו "למה".
                  <button
                    type="button"
                    aria-expanded={open === 'what'}
                    aria-controls="what-options"
                    onClick={() => toggleOpen('what')}
                    className={lineText}
                  >
                    <span className="sr-only">מה: </span>
                    {query.cats.length > 0 ? (
                      <PenAnswer struck={isStruck('what')}>{query.cats.map(nameOf).join(', ')}</PenAnswer>
                    ) : (
                      <span className={example}>לבחור תחום מהרשימה</span>
                    )}
                  </button>
                ) : (
                  whatInput
                )}
```

  ועוד שלושה שינויים קטנים באותו `<li>`:
  - `{!fixedWhat && shownWhat === '' && open !== 'what' && (` נעשה `{!fixedWhat && !whatBox && shownWhat === '' && open !== 'what' && (`.
  - הבלוק `{advisor && !fixedWhat && ( ... )}` (שורות 420–427) מוחלף ב-`{advisor && !fixedWhat && !whatBox && advisorNote}`.
  - `<div role="group" aria-label="מה ללמוד: אפשר לבחור תחום" className={panel}>` נעשה `<div id="what-options" role="group" aria-label="מה ללמוד: אפשר לבחור תחום" className={panel}>`.

- [ ] **Step 6: מה שמתחת לשורות.** ב-`notebook.tsx`, מחליפים את כל ה-`<div className="ms-(--margin) ps-3">` שסוגר את הטופס (שורות 622–692, מ-`{fixedWhat ? (` של "לחפש בתחום אחר" ועד `{saveAnswers && ... <SaveAnswers query={query} />}` וה-`</div>` שלו) ב:

```tsx
          <div className="ms-(--margin) ps-3">
            {fixedWhat ? (
              <p className={cn(smallNote, 'mt-3')}>
                <Link href="/" className={smallLink}>
                  לחפש בתחום אחר
                </Link>
              </p>
            ) : whatBox ? null : (
              whatStatus
            )}
            <p className={cn(smallNote, whatBox ? 'mt-3' : 'mt-1')}>שורה בלי סימון לא מסננת את התוצאות.</p>
            {/* בדף הבית הכפתור מתחת לתיבה. הרשימה מתעדכנת לבד כשבוחרים בשורות. */}
            {!whatBox && submitButton}
            {saveAnswers && activeLines(query).length > 0 && <SaveAnswers query={query} />}
          </div>
```

  ובקריאה ל-`<Results`, אחרי `question={query.q}` מוסיפים `forTeam={whatBox && forTeam}`.

- [ ] **Step 7: "רוצים שנכין לכם רשימה?".** ב-`web/src/components/notebook/results.tsx`, ב-`Results`:
  - **בפרמטרים:** אחרי `emptyCategory = false,` מוסיפים `forTeam = false,`. בטיפוס, אחרי `question?: string;` מוסיפים:

```ts
  /** דף הבית, "בשביל העובדים": מתחת לרשימה, קישור לטופס בעמוד החברות. */
  forTeam?: boolean;
```

  - **ב-JSX:** אחרי ה-`</p>` של "לא מצאתם? בקשו שנבדוק קורס" ולפני `</section>`, מוסיפים:

```tsx
        {forTeam && (
          // "בשביל העובדים" (מסמך העיצוב 2026-11-17): החיפוש המותאם לחברות בא בשלב 2. בינתיים, הטופס.
          <p className="ms-(--margin) ps-3 font-sans text-[15px] font-semibold">
            <Link
              href="/companies#request"
              className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
            >
              רוצים שנכין לכם רשימה?
            </Link>
          </p>
        )}
```

- [ ] **Step 8: כותרת ופתיח לא חובה.** מחליפים את כל `web/src/components/notebook/notebook-page.tsx` ב:

```tsx
import { Suspense } from 'react';
import { Sheet } from '@/components/site/sheet';
import { cn } from '@/lib/utils';
import { Notebook, NotebookFromUrl, type NotebookProps } from './notebook';

/**
 * הדף של המחברת: דף הבית, עמוד תחום וכל הקורסים.
 * הדף סטטי. התשובות שבכתובת נקראות בדפדפן, בתוך <Suspense>.
 * עד אז מוצגת אותה מחברת עם מה שממולא מראש, כך שבכתובת בלי תשובות אין קפיצה.
 *
 * במחשב: הכותרת מימין והערה בעט משמאלה, המחברת על שורות שנמשכות עד קצה הנייר,
 * והרשימה רחבה, בעמודות. בדף הבית אין כותרת למחברת: ההבטחה ב-hero היא השאלה, והתיבה מיד אחריה.
 */
export function NotebookPage({
  heading,
  headingLevel = 1,
  intro,
  before,
  hero,
  headSide,
  headSideAlign = 'end',
  after,
  ...props
}: NotebookProps & {
  /** בלי כותרת (דף הבית, מסמך העיצוב 2026-11-17): אז גם intro, before ו-headSide לא מוצגים. */
  heading?: string;
  /** בדף הבית הכותרת הראשית היא ההבטחה, והמחברת מקבלת כותרת משנה. */
  headingLevel?: 1 | 2;
  intro?: React.ReactNode;
  /** לפני הכותרת. בעמוד תחום: פירורי הלחם. */
  before?: React.ReactNode;
  /** בדף הבית: ההבטחה, לפני המחברת. */
  hero?: React.ReactNode;
  /** ליד הכותרת, משמאל במחשב ומתחתיה בנייד: הערה קצרה בעט על מה שברשימה. */
  headSide?: React.ReactNode;
  /**
   * במחשב, איפה headSide עומד מול הכותרת. end: מול סוף הפתיח (הערה קצרה).
   * start: מול ראש העמודה, כשהוא גבוה מהכותרת, כדי שלא יעלה מעל פירורי הלחם (עמוד תחום עם המובילים).
   */
  headSideAlign?: 'end' | 'start';
  /** אחרי הרשימה. בדף הבית: "מה רואים כאן", הבוגרים והתחומים. */
  after?: React.ReactNode;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <Sheet>
      <main id="main">
        {hero}
        {heading !== undefined && (
          <div
            className={cn(
              'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:gap-x-16',
              headSideAlign === 'start' ? 'lg:items-start' : 'lg:items-end',
              hero ? 'mt-12 lg:mt-11' : 'lg:mt-4',
            )}
          >
            <div>
              {before}
              <Heading
                id="notebook-title"
                className={cn(
                  'leading-tight font-bold text-balance',
                  headingLevel === 1
                    ? 'mt-[22px] text-[30px] lg:mt-8 lg:text-[54px] lg:leading-[1.08] lg:font-bold'
                    : 'pen-rule text-[26px] lg:text-[38px]',
                )}
              >
                {heading}
              </Heading>
              {intro && (
                <p className="mt-2 max-w-[60ch] font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
                  {intro}
                </p>
              )}
            </div>
            {headSide && <div className="mt-3 lg:mt-0 lg:pb-1">{headSide}</div>}
          </div>
        )}
        {/* קו השוליים: לאורך המחברת, הרשימה והחלקים שאחריה, כמו בציור (HomeB). */}
        <div className={cn('margin-rule', heading === undefined ? 'mt-7 lg:mt-10' : 'mt-4 lg:mt-8')}>
          <Suspense fallback={<Notebook {...props} query={props.base} />}>
            <NotebookFromUrl {...props} />
          </Suspense>
          {after}
        </div>
      </main>
    </Sheet>
  );
}
```

- [ ] **Step 9: דף הבית.** ב-`web/src/app/page.tsx` מחליפים את ה-props של `NotebookPage` מ-`saveAnswers` עד `afterForm` ב:

```tsx
      saveAnswers
      whatBox
      advisor={advisorEnabled()}
      hero={<HomeHero example={example} />}
      afterForm={<SecondaryPaths />}
```

  כלומר: יורדים `heading`, `headingLevel` ו-`intro`, ונוסף `whatBox`. ה-`after` לא משתנה עד המשימה הבאה.

- [ ] **Step 10: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/components/notebook/pen-example.tsx src/components/notebook/notebook.tsx src/components/notebook/results.tsx src/components/notebook/notebook-page.tsx src/app/page.tsx`

- [ ] **Step 11: בדיקה בעיניים** (375 ומחשב), על `http://localhost:3100/`:
  - **מתחת להבטחה:** "בשביל מי?" עם "בשבילי" מסומן, ואז התיבה הגדולה עם "למשל: אני בעלת עסק, רוצה ללמוד לבנות סוכני AI לעסק שלי" בעט, ליד הקו. הדוגמה לא נעלמת אחרי 3 שניות.
  - **כתיבה:** "אפייה בבית" ו-Enter. מופיע "הבנו: בישול. לא מדויק?", הרשימה נפתחת באותו עמוד, והדף גולל אליה.
  - **מתחת לכפתור:** "או בחרו בעצמכם", וארבע השורות. בשורה 1 "לבחור תחום מהרשימה", והתחומים נפתחים בלחיצה.
  - **"בשביל העובדים":** מתחת לרשימה מופיע "רוצים שנכין לכם רשימה?", והקישור מוביל ל-`/companies#request`.
  - **`/categories/cooking` ו-`/courses`:** המחברת כמו קודם, עם השדה בשורה 1.
  - **מקלדת:** Tab עובר: בשבילי, בשביל העובדים, התיבה, הכפתור, ואז השורות.
  - מריצים `/impeccable` על `notebook.tsx` מול `.impeccable/surfaces/web-src-app-page-tsx.md`.

- [ ] **Step 12: שורה ביומן.**

```md
58. **דף הבית, התיבה:** "בשבילי" או "בשביל העובדים" מעל, תיבה אחת גדולה עם הדוגמה ליד הקו (דרך /api/understand, כמו השורה), וארבע השורות מתחת תחת "או בחרו בעצמכם". "בשביל העובדים" מוסיף מתחת לרשימה "רוצים שנכין לכם רשימה?" עם קישור לטופס בעמוד החברות. הבחירה לא נשמרת בכתובת בשלב 1. **נבדק:** tsc, eslint, ובשרת המקומי ב-375 ובמחשב, כולל מקלדת.
```

- [ ] **Step 13: קומיט.**

```bash
git add web/src/components/notebook/pen-example.tsx web/src/components/notebook/notebook.tsx web/src/components/notebook/results.tsx web/src/components/notebook/notebook-page.tsx web/src/app/page.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
דף הבית: תיבה אחת, בשבילי או בשביל העובדים, והשורות מתחת

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: דף הבית: הכותרת, "מה רואים כאן" ו"סיימתם קורס?"

**Files:**
- Modify: `web/src/components/home/home-hero.tsx` (כל הקובץ)
- Create: `web/src/components/home/what-you-see.tsx`
- Modify: `web/src/components/site/graduates-call.tsx` (ה-imports, תחילת `GraduatesCall`)
- Modify: `web/src/app/page.tsx` (ה-imports, `after`)
- Delete: `web/src/components/site/verification-steps.tsx`
- Test: בדיקה בעיניים.

- [ ] **Step 1: ההבטחה.** מחליפים את כל `web/src/components/home/home-hero.tsx` ב:

```tsx
import { PenArrow } from '@/components/site/pen';
import type { CoursePageData } from '@/lib/data/course-page';
import type { CourseSummary } from '@/lib/search/types';
import { cn } from '@/lib/utils';
import { ExampleCard } from './example-card';

/**
 * הפתיחה של דף הבית (מסמך העיצוב 2026-11-17): "לא יודעים למי לפנות?" ומשפט אחד, והתיבה מיד אחריהם (notebook.tsx).
 * "איך האימות עובד" ירד. במקומו "מה רואים כאן", אחרי הרשימה (what-you-see.tsx).
 * הסיכום לדוגמה מופיע רק כשיש קורס עם ציון, כמו קודם. במחשב: ההבטחה מימין והסיכום משמאל.
 */
export function HomeHero({ example }: { example: { course: CourseSummary; page: CoursePageData | null } | null }) {
  return (
    <section
      aria-labelledby="promise"
      className={cn('pt-6 lg:pt-11', example && 'lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-x-20')}
    >
      <div className={example ? 'lg:col-start-1 lg:row-start-1' : 'lg:max-w-[880px]'}>
        <h1
          id="promise"
          className="text-[33px] leading-[1.14] font-bold tracking-[-0.01em] text-balance lg:text-[54px] lg:leading-[1.08]"
        >
          לא יודעים למי לפנות? כתבו מה אתם צריכים.
        </h1>
        <p className="mt-4 max-w-[52ch] font-sans text-[17px] leading-normal text-pretty lg:mt-6 lg:text-xl">
          נראה לכם את האפשרויות זו לצד זו, מה כל אחד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים.
          <strong className="font-bold"> אף מוכר לא משלם לנו.</strong>
        </p>
        {example && (
          <p className="mt-5 hidden font-pen text-lg font-medium text-pen lg:block">
            <PenArrow />
            ככה נראה סיכום של קורס אצלנו
          </p>
        )}
      </div>
      {example && (
        <ExampleCard
          course={example.course}
          page={example.page}
          className="mt-9 lg:col-start-2 lg:row-start-1 lg:mt-2"
        />
      )}
    </section>
  );
}
```

- [ ] **Step 2: "מה רואים כאן".** יוצרים את `web/src/components/home/what-you-see.tsx`:

```tsx
import Link from 'next/link';
import { MarkSample } from '@/components/course/marks';

/**
 * "מה רואים כאן" (מסמך העיצוב 2026-11-17, דף הבית): במקום שלושת צעדי האימות. שלוש שורות, כל אחת בסימון שלה,
 * כמו בעמוד הקורס: קו כחול למה שהמוסד אומר, ירוק למה שנבדק מול מסמך, ובעט מה שלא כתוב.
 * הדוגמאות בלי תווית לקורא מסך (כמו MarkSample במקרא): המשמעות כתובה בהן עצמן.
 * לידן הדלת לבדיקה: מי שקיבל הצעה או ראה מודעה מדביק את הקישור ב-/request-course.
 * אחרי הרשימה, ולא לפני התיבה: בנייד התיבה צריכה להיות במסך הראשון.
 */
export function WhatYouSee() {
  return (
    <section aria-labelledby="what-you-see-title" className="mt-10 ms-(--margin) ps-3 lg:ms-0 lg:mt-16 lg:ps-0">
      <h2 id="what-you-see-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        מה רואים כאן
      </h2>
      <ul className="mt-3 space-y-2.5 font-sans text-[15px] leading-relaxed lg:mt-4 lg:text-[17px]">
        <li>
          <span className="claim">מה המוסד אומר</span>
        </li>
        <li>
          <MarkSample source="verified">מה נבדק מול מסמך</MarkSample>
        </li>
        <li>
          <span className="font-pen text-[17px] font-medium text-pen lg:text-lg">מה לא כתוב</span>
        </li>
      </ul>
      <p className="mt-4 font-sans text-[15px] font-semibold lg:text-base">
        <Link
          href="/request-course"
          className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover"
        >
          קיבלתם הצעה או ראיתם מודעה? הדביקו את הקישור
        </Link>
      </p>
    </section>
  );
}
```

- [ ] **Step 3: "סיימתם קורס?" באתר החי.** ב-`web/src/components/site/graduates-call.tsx`:
  - **import:** `import { ACCOUNTS_OPEN } from '@/lib/site';`
  - **בתחילת `GraduatesCall`**, לפני `const closest = closestToScore(courses, 3);`, מוסיפים:

```tsx
  // ההתחברות עוד לא פתוחה באתר החי (ACCOUNTS_OPEN), ובלעדיה אין ביקורת. "סיימתם קורס?" נשאר, עם "נפתחת בקרוב"
  // כמו בעמוד הביקורת, ובלי רשימת הקורסים שמחכים לביקורות (מסמך העיצוב 2026-11-17). מקומית וב-CI הכול כמו קודם.
  if (!ACCOUNTS_OPEN) {
    return (
      <section aria-labelledby="graduates-title" className="mt-10 ms-(--margin) ps-3 lg:ms-0 lg:mt-16 lg:ps-0">
        <h2 id="graduates-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
          סיימתם קורס?
        </h2>
        <p className="mt-2 font-sans text-[15px] leading-normal lg:text-[17px]">
          ביקורת שלכם יכולה לתת לקורס ציון. מספיקות {MIN_REVIEWS} ביקורות מאומתות.
        </p>
        <PenNote className="mt-2 lg:text-base">כתיבת ביקורות נפתחת בקרוב.</PenNote>
      </section>
    );
  }
```

- [ ] **Step 4: דף הבית.** ב-`web/src/app/page.tsx`:
  - **import:** `import { WhatYouSee } from '@/components/home/what-you-see';`
  - **מחליפים את ה-`after`** ב:

```tsx
      after={
        <>
          <div className="lg:ms-(--margin) lg:grid lg:grid-cols-2 lg:gap-x-16 lg:ps-3">
            <WhatYouSee />
            <GraduatesCall courses={catalog.courses} />
          </div>
          <SubjectsToc categories={catalog.categories} />
        </>
      }
```

- [ ] **Step 5: מוחקים את "איך האימות עובד".**
  - הפקודה: `git rm web/src/components/site/verification-steps.tsx`
  - בודקים שלא נשאר שימוש: Grep ל-`VerificationSteps` ב-`web/src`. מצופה: אין תוצאות.

- [ ] **Step 6: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/components/home/home-hero.tsx src/components/home/what-you-see.tsx src/components/site/graduates-call.tsx src/app/page.tsx`

- [ ] **Step 7: בדיקה בעיניים** (375 ומחשב):
  - **`http://localhost:3100/`:**
    - הכותרת "לא יודעים למי לפנות? כתבו מה אתם צריכים." והמשפט אחריה, ובנייד התיבה עוד במסך הראשון.
    - אחרי הרשימה (או אחרי השורות כשאין רשימה): "מה רואים כאן" עם קו כחול, מרקר ירוק עם הווי, ו"מה לא כתוב" בעט, והקישור "קיבלתם הצעה או ראיתם מודעה? הדביקו את הקישור".
    - במחשב, "סיימתם קורס?" לידו.
  - **השרת שמדמה את האתר החי** (הגדרה `web-closed-3200`, `http://localhost:3200/`): ב"סיימתם קורס?" כתוב בעט "כתיבת ביקורות נפתחת בקרוב.", בלי רשימת קורסים.
  - מריצים `/impeccable` על `home-hero.tsx` ו-`what-you-see.tsx`.

- [ ] **Step 8: שורה ביומן.**

```md
59. **דף הבית, הפתיחה:** "לא יודעים למי לפנות? כתבו מה אתם צריכים." עם משפט ההמשך. "איך האימות עובד" ירד, ובמקומו "מה רואים כאן" (קו כחול, ירוק, ומה לא כתוב בעט) עם "קיבלתם הצעה או ראיתם מודעה? הדביקו את הקישור". באתר החי "סיימתם קורס?" עם "כתיבת ביקורות נפתחת בקרוב". **נבדק:** tsc, eslint, ובשרת המקומי (3100 ו-3200) ב-375 ובמחשב.
```

- [ ] **Step 9: קומיט.**

```bash
git add web/src/components/home/home-hero.tsx web/src/components/home/what-you-see.tsx web/src/components/site/graduates-call.tsx web/src/app/page.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
דף הבית: לא יודעים למי לפנות, ומה רואים כאן

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

(הקובץ שנמחק כבר ב-index מ-`git rm`.)

---

## Task 12: "איך אנחנו משווים": התפריט ועמוד השיטה

**Files:**
- Modify: `web/src/components/site/site-header.tsx` (שורה 23)
- Modify: `web/src/components/site/site-footer.tsx` (שורה 26)
- Modify: `web/src/app/who-pays-us/page.tsx` (שורה 41)
- Modify: `web/src/app/method/page.tsx` (כל הקובץ)
- Modify: `web/src/app/globals.css` (אחרי `.text-page h2`, שורות 456–458)
- Test: בדיקה בעיניים.

- [ ] **Step 1: התפריט והקישורים.** בשלושת הקבצים מחליפים את הטקסט `איך אנחנו מדרגים` ב-`איך אנחנו משווים`: בכותרת (`<span className="pen-under">`), בתחתית, וב"מי משלם לנו". הכתובת `/method` לא משתנה.
  - אחר כך מריצים Grep ל-`איך אנחנו מדרגים` ב-`web/src`. מצופה: רק `method/page.tsx`, שמשתנה בצעד הבא.

- [ ] **Step 2: כותרת משנה בעמודי קריאה.** ב-`web/src/app/globals.css`, בתוך `@layer components` של "עמודי קריאה", אחרי הכלל `.text-page h2 { ... }` מוסיפים:

```css
  /* כותרת בתוך פרק: בשיטה, החלקים של חישוב הציון תחת "כשיהיו ביקורות". */
  .text-page h3 {
    @apply mt-8 text-[17px] leading-snug font-bold lg:mt-10 lg:text-[19px];
  }
```

- [ ] **Step 3: עמוד השיטה.** מחליפים את כל `web/src/app/method/page.tsx` ב:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { MarkSample } from '@/components/course/marks';
import { TextPage } from '@/components/site/text-page';
import { getMethodData } from '@/lib/data/method';
import { formatHebrewDate } from '@/lib/format';
import {
  CATEGORY_PRIOR_MIN_REVIEWS,
  MIN_OUTCOME_ANSWERS,
  MIN_REVIEWS,
  PRIOR_WEIGHT,
  STALE_MONTHS,
  WEIGHTS,
  WINDOW_MONTHS,
} from '@/lib/score/constants';
import type { CourseType } from '@/lib/score/types';
import { COURSE_TYPE_LABEL } from '@/lib/search/why';
import { SITE_NAME } from '@/lib/site';

export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: `איך אנחנו משווים | ${SITE_NAME}`,
  alternates: { canonical: '/method' },
  description: 'מאיפה הפרטים על כל קורס, מה כל סימון אומר, ואיך יחושב ציון הבוגרים כשיהיו ביקורות. אף מוכר לא משלם לנו.',
};

const TYPES: CourseType[] = ['career', 'exam', 'hobby'];

/**
 * השיטה (מסמך העיצוב 2026-11-17): קודם מאיפה הפרטים, מה הסימונים אומרים, ושאף מוכר לא משלם.
 * אחר כך ביקורות, שבאות בקרוב. השיטה של הציון נשארת, תחת "כשיהיו ביקורות".
 */
export default async function MethodPage() {
  const { changes, metricLabels } = await getMethodData();
  return (
    <TextPage title="איך אנחנו משווים">
      <p>
        הפרטים על כל קורס הם מה שהמוסד כותב על עצמו, בדף של הקורס באתר שלו. האוסף שלנו קורא את הדף פעם בשבוע, ובכל
        עמוד קורס יש קישור לדף ותאריך הקריאה. מה שהמוסד לא כותב, כתוב גם אצלנו: ״לא כתוב בדף״, או ״המוסד לא מפרסם
        מחיר״. כך אפשר להשוות גם לפי מה שחסר.
      </p>

      <h2>מה הסימונים אומרים</h2>
      <ul>
        <li>
          <span className="claim">קו כחול</span>: מה המוסד אומר. לא בדקנו את זה.
        </li>
        <li>
          <MarkSample source="verified">ירוק</MarkSample>: מה נבדק מול מסמך.
        </li>
        <li>
          <MarkSample source="grads">צהוב</MarkSample>: מה שבוגרים אמרו.
        </li>
        <li>
          <MarkSample source="weak">ורוד</MarkSample>: נקודת חולשה.
        </li>
        <li>
          <span className="font-pen font-medium text-pen">בעט</span>: מה שלא כתוב, וההערות שלנו.
        </li>
      </ul>
      <p>
        אף מוכר קורסים לא משלם לנו: לא על מקום ברשימה, לא על הסדר ולא על מה שכתוב.{' '}
        <Link href="/who-pays-us">מי משלם לנו</Link>
      </p>

      <h2>ביקורות</h2>
      <p>
        בקרוב: ביקורות רק ממי שהעלה הוכחה שלמד בקורס, כמו חשבונית, קבלה או תעודת סיום. ההוכחה נמחקת אחרי הבדיקה.
      </p>

      <h2>כשיהיו ביקורות</h2>
      <p>
        ציון הבוגרים יבוא רק מבוגרים שהעלו הוכחה שלמדו בקורס. את הקורסים עצמם לא בדקנו, וזה כתוב ליד כל ציון.
      </p>
      <p>הציון מחושב בקוד קבוע, לא על ידי מודל שפה. כל חישוב נשמר עם גרסת השיטה שלו, ושום חישוב לא נמחק.</p>

      <h3>מי נספר</h3>
      <ul>
        <li>רק ביקורות שאומתו ופורסמו ב-{WINDOW_MONTHS} החודשים האחרונים.</li>
        <li>ביקורת אחת לאדם, לקורס ולמחזור.</li>
        <li>כשמתגלה שמוכר נתן תמריץ על ביקורות, כל הביקורות מאותו מחזור יוצאות מהציון.</li>
      </ul>

      <h3>השאלות והמשקלות</h3>
      <p>כל בוגר עונה על שאלון לפי סוג הקורס. ״ממליץ״ לא נכנס לציון, ומוצג בנפרד כאחוז הממליצים.</p>
      {TYPES.map((type) => (
        <table key={type} className="w-full font-sans text-[15px] tabular-nums">
          <caption className="text-start font-bold">{COURSE_TYPE_LABEL[type]}</caption>
          <tbody>
            {Object.entries(WEIGHTS[type]).map(([key, weight]) => (
              <tr key={key} className="border-b border-rule">
                <th scope="row" className="py-1.5 text-start font-normal">
                  {metricLabels[key] ?? key}
                </th>
                <td className="w-16 py-1.5 text-end">{Math.round((weight ?? 0) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      <h3>החישוב</h3>
      <ul>
        <li>תשובת ״כן״ נספרת כ-5, ותשובת ״לא״ כ-1. שאר השאלות בסולם 1 עד 5.</li>
        <li>
          הממוצע של כל שאלה נמשך לממוצע התחום, כאילו נוספו {PRIOR_WEIGHT} ביקורות בגובה הממוצע. כך קורס עם שתי
          ביקורות נלהבות לא קופץ לראש הרשימה.
        </li>
        <li>
          ממוצע התחום מחושב מכל הביקורות בתחום. כשיש בתחום פחות מ-{CATEGORY_PRIOR_MIN_REVIEWS} ביקורות, משתמשים
          בממוצע של כל הקורסים מאותו סוג.
        </li>
        <li>כל שאלה מומרת לסולם 0 עד 10, והציון הוא הסכום המשוקלל לפי הטבלאות.</li>
        <li>
          על ״אחרי 3 חודשים״ צריך לפחות {MIN_OUTCOME_ANSWERS} תשובות. בלי זה, המשקל שלה מתחלק בין שאר השאלות.
        </li>
      </ul>

      <h3>מתי אין ציון</h3>
      <ul>
        <li>בלי ביקורת מפורסמת, אין לקורס ציון ואין תיבת ציון. במקומה מופיעות העובדות שהמוסד מפרסם.</li>
        <li>מתחת ל-{MIN_REVIEWS} ביקורות אין ציון. במקומו מופיעות הביקורות עצמן, ו״עוד X ביקורות עד לציון״.</li>
        <li>אם לא נכנסה ביקורת חדשה {STALE_MONTHS} חודשים, הציון מסומן ״ייתכן שהתיישן״.</li>
      </ul>

      <h3>יומן השינויים בשיטה</h3>
      {changes.length === 0 ? (
        <p>עוד אין שינויים.</p>
      ) : (
        <ol className="list-none">
          {changes.map((change) => (
            <li key={change.version}>
              <span className="block font-sans text-[13px] text-ink-soft">
                גרסה {change.version}, {formatHebrewDate(change.changedAt)}
              </span>
              {change.summary}. הסיבה: {change.reason}.
            </li>
          ))}
        </ol>
      )}

      <p>
        לפני שמשלמים על קורס אפשר גם לבדוק לבד: איך קוראים סילבוס, מה לשאול את המוסד, אילו תעודות מוכרות, איך
        מממנים, ומה הדגלים האדומים במודעות. על זה כתבנו{' '}
        <Link href="/guides" className="underline decoration-1 underline-offset-[3px] hover:text-link-hover">
          חמישה מדריכים קצרים
        </Link>
        , וכל עובדה בהם עם המקור שלה.
      </p>
    </TextPage>
  );
}
```

- [ ] **Step 4: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/components/site/site-header.tsx src/components/site/site-footer.tsx src/app/who-pays-us/page.tsx src/app/method/page.tsx`

- [ ] **Step 5: בדיקה בעיניים** (375 ומחשב):
  - **בכותרת ובתחתית של כל עמוד:** "איך אנחנו משווים".
  - **`/method`:**
    - הפתיחה החדשה, ואחריה "מה הסימונים אומרים" עם חמשת הסימונים בצורה שלהם.
    - "ביקורות" עם "בקרוב: ביקורות רק ממי שהעלה הוכחה...".
    - "כשיהיו ביקורות", עם כותרות המשנה (h3) קטנות מכותרות הפרקים, והטבלאות במקומן.

- [ ] **Step 6: שורה ביומן.**

```md
60. **"איך אנחנו משווים":** בתפריט, בתחתית וב"מי משלם לנו", והכתובת `/method` לא השתנתה. בעמוד השיטה פתיחה חדשה (מאיפה הפרטים, מה הסימונים אומרים, ואף מוכר לא משלם), "ביקורות: בקרוב", והשיטה של הציון תחת "כשיהיו ביקורות". **נבדק:** tsc, eslint, ובשרת המקומי ב-375 ובמחשב.
```

- [ ] **Step 7: קומיט.**

```bash
git add web/src/components/site/site-header.tsx web/src/components/site/site-footer.tsx web/src/app/who-pays-us/page.tsx web/src/app/method/page.tsx web/src/app/globals.css docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
איך אנחנו משווים: התפריט ועמוד השיטה

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: עמוד החברות: המחיר והביקורות ב"בקרוב"

**Files:**
- Modify: `web/src/app/companies/page.tsx` (התיאור בשורות 12–13, `OFFER` בשורות 16–29, הפתיח בשורות 44–46, השורה בשורות 71–73)
- Test: בדיקה בעיניים. ה-e2e של החברות לא משתנה, כי הכותרת והטופס נשארים.

- [ ] **Step 1: התיאור.** מחליפים את ה-`description` ב:

```tsx
  description:
    'עוזרים לחברות לבחור קורס, הרצאה או סדנה לעובדים: מה כל מוסד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. בקרוב גם המחיר ששילמו בפועל וביקורות מאומתות. אף מוסד או מרצה לא משלם לנו.',
```

- [ ] **Step 2: ההצעה.** מחליפים את `OFFER` ב:

```tsx
/**
 * מה החברה מקבלת, בשורות מחברת: הנושא בשוליים, והתשובה מודפסת על הקו.
 * soon: עוד לא קיים, כי עוד אין ביקורות וחשבוניות (מסמך העיצוב 2026-11-17). "בקרוב:" בעט, לפני התשובה.
 */
const OFFER: { label: string; text: string; soon?: boolean }[] = [
  { label: 'רשימה קצרה', text: 'קורסים, הרצאות או סדנאות מהקטלוג שלנו, שמתאימים למה שהעובדים צריכים ללמוד.' },
  {
    label: 'מחיר',
    soon: true,
    text: 'כמה שילמו עליהם בפועל, לפי חשבוניות של מי שלמדו בהם. עד אז, המחיר שהמוסד מפרסם, וכשהוא לא מפרסם, זה כתוב.',
  },
  { label: 'ביקורות', soon: true, text: 'רק ממי שהשתתפו והוכיחו את זה, בחשבונית, קבלה או תעודת סיום.' },
  {
    label: 'בלי עמלה',
    text: 'אף מוסד או מרצה לא משלם לנו, ואנחנו לא לוקחים עמלה ממי שתבחרו. ההסכם נחתם ישירות ביניכם.',
  },
  {
    label: 'אחרי ההכשרה',
    text: 'אם תרצו, נאסוף מהעובדים משוב על מה שלמדו. לציון הציבורי הוא נכנס רק במצטבר, בלי שם החברה ובהסכמתכם.',
  },
];
```

- [ ] **Step 3: הפתיח.** מחליפים את המשפט בפסקה שמתחת לכותרת ב:

```tsx
          אנחנו עוזרים לחברות לבחור הכשרה לעובדים: מה כל מוסד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. בקרוב גם
          המחיר ששילמו בפועל, וביקורות של מי שהשתתפו והוכיחו את זה.
```

- [ ] **Step 4: "בקרוב" בעט.** מחליפים את `{item.text}` בתוך ה-`<p className="pt-2.5 ps-3 ...">` ב:

```tsx
                      {item.soon && <span className="font-pen font-medium text-pen">בקרוב: </span>}
                      {item.text}
```

- [ ] **Step 5: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/app/companies/page.tsx`

- [ ] **Step 6: בדיקה בעיניים** (375 ומחשב), על `/companies`:
  - "מחיר" ו"ביקורות" מתחילים ב"בקרוב:" בעט.
  - הפתיח בלשון החדשה.
  - הכותרת והטופס כמו קודם.

- [ ] **Step 7: שורה ביומן.**

```md
61. **עמוד החברות:** "המחיר ששילמו בפועל" ו"ביקורות" עברו ל"בקרוב" (בעט), והפתיח מדבר על מה שכל מוסד מפרסם ומה לשאול. הכותרת והטופס לא השתנו. **נבדק:** tsc, eslint, ובשרת המקומי ב-375 ובמחשב.
```

- [ ] **Step 8: קומיט.**

```bash
git add web/src/app/companies/page.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
עמוד החברות: המחיר בפועל והביקורות בבקרוב

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: תמונת השיתוף והתיאור של דף הבית

**Files:**
- Modify: `web/src/app/_og/card.tsx` (`renderSiteCard`, שורות 424–432)
- Modify: `web/src/app/opengraph-image.tsx` (שורה 4)
- Modify: `web/src/app/layout.tsx` (`description`, שורות 29–30)
- Test: בדיקה בעיניים של התמונה.

- [ ] **Step 1: הטקסט בתמונה.** ב-`web/src/app/_og/card.tsx`, ב-`renderSiteCard`, מחליפים את שני ה-map (הכותרת ושורות ההמשך) ב:

```tsx
            {/* השורות שבורות ביד, כדי שאף שורה לא תישאר עם מילה אחת (מסמך העיצוב 2026-11-17). */}
            {['לא יודעים', 'למי לפנות?'].map((line) => (
              <Rtl key={line} text={line} size={66} style={{ fontFamily: 'IBM Plex Sans Hebrew', fontWeight: 700, lineHeight: 1.12, flexWrap: 'nowrap' }} />
            ))}
            {['נראה לכם את האפשרויות זו לצד זו,', 'מה כל אחד מפרסם ומה הוא לא כותב,', 'ומה לשאול לפני שמשלמים.'].map(
              (line, i) => (
                <Rtl key={line} text={line} size={28} style={{ color: INK_SOFT, lineHeight: 1.4, marginTop: i === 0 ? 26 : 0 }} />
              ),
            )}
```

"אף מוכר לא משלם לנו" כבר בכותרת הדף בתמונה (`SheetHeader`), והמקרא נשאר.

- [ ] **Step 2: ה-alt.** ב-`web/src/app/opengraph-image.tsx`:

```tsx
export const alt =
  'דף מודפס על שולחן: לא יודעים למי לפנות? נראה לכם את האפשרויות זו לצד זו, מה כל אחד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. אף מוכר לא משלם לנו.';
```

- [ ] **Step 3: התיאור של דף הבית** (גם התיאור של כל עמוד שאין לו משלו). ב-`web/src/app/layout.tsx`:

```tsx
  description:
    'לא יודעים למי לפנות? נראה לכם את האפשרויות זו לצד זו, מה כל אחד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. אף מוכר לא משלם לנו.',
```

- [ ] **Step 4: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/app/_og/card.tsx src/app/opengraph-image.tsx src/app/layout.tsx`

- [ ] **Step 5: בדיקה בעיניים.**
  - פותחים את `http://localhost:3100/opengraph-image`, וצילום מסך.
  - בודקים: שתי שורות כותרת בלי שבירה נוספת, שלוש שורות המשך שלא נוגעות במקרא, והמקרא בצד כמו קודם.

- [ ] **Step 6: שורה ביומן.**

```md
62. **תמונת השיתוף של דף הבית:** "לא יודעים למי לפנות?" ומשפט ההמשך במקום "מה אומרים בוגרים", וגם ה-alt והתיאור של דף הבית. **נבדק:** tsc, eslint, והתמונה בשרת המקומי (/opengraph-image).
```

- [ ] **Step 7: קומיט.**

```bash
git add web/src/app/_og/card.tsx web/src/app/opengraph-image.tsx web/src/app/layout.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
תמונת השיתוף של דף הבית: לא יודעים למי לפנות

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: קישור לקורס בלי ביקורות: התיאור ותמונת השיתוף

**Files:**
- Modify: `web/src/lib/og/share-text.ts` (`courseShareDescription`, `courseShareMessage`)
- Modify: `web/src/lib/og/share-text.test.ts`
- Modify: `web/src/app/_og/card.tsx` (ה-imports, פונקציה חדשה `FactsCard`, `renderCourseCard`)
- Modify: `web/src/app/courses/[slug]/opengraph-image.tsx` (שורה 7)
- Test: `web/src/lib/og/share-text.test.ts`

- [ ] **Step 1: לעדכן את הבדיקות.** ב-`web/src/lib/og/share-text.test.ts`:
  - **מתחת ל-imports:**

```ts
/** העובדות של קורס לדוגמה (lib/course/facts.ts). */
const FACTS = {
  sitePrice: 2600,
  totalHours: 30,
  durationMonths: 2,
  formats: ['in_person'],
  region: 'חיפה',
  certificate: null,
  nextCohortDate: null,
};
```

  - **בשתי הבדיקות של `courseShareDescription`:** מוסיפים לאובייקט `...FACTS` ו-`reviewTotal`. לראשונה `reviewTotal: 23`, ולשנייה `reviewTotal: 3`. התוצאות לא משתנות.
  - **בבדיקה של `courseShareMessage`:** האובייקט נעשה `{ title: 'אפייה', institutionName: 'סדנה לדוגמה', score: { status: 'none' }, paid: null, reviewTotal: 0, ...FACTS }`, והתוצאה:

```ts
      'אפייה, סדנה לדוגמה\n2,600 ₪ · 2 חודשים, 30 שעות · בכיתה · חיפה. אף מוכר לא משלם לנו.',
```

  - **בדיקה חדשה, בתוך `describe('courseShareDescription', ...)`:**

```ts
  it('lists the facts the institution publishes when there is no review yet, and says when there is no price', () => {
    expect(
      courseShareDescription({ score: { status: 'none' }, paid: null, reviewTotal: 0, ...FACTS, sitePrice: null }),
    ).toBe('מחיר לא מפורסם · 2 חודשים, 30 שעות · בכיתה · חיפה. אף מוכר לא משלם לנו.');
  });
```

- [ ] **Step 2: להריץ ולראות שנכשלת.**
  - `pnpm --dir web exec vitest run src/lib/og/share-text.test.ts`
  - מצופה: הבדיקה החדשה והבדיקה של `courseShareMessage` נכשלות. היום כתוב בהן "עוד אין ביקורות מאומתות על הקורס."

- [ ] **Step 3: הקוד.** ב-`web/src/lib/og/share-text.ts`:
  - **imports:** מוסיפים:

```ts
import { factsLine, type FactSource } from '@/lib/course/facts';
import { showsScore } from '@/lib/course/score-shown';
```

  - **מחליפים את `courseShareDescription` ואת `courseShareMessage`** ב:

```ts
/** מה שהתיאור צריך מקורס: הציון, מה ששולם, כמה ביקורות פורסמו, והעובדות. */
type ShareCourse = Pick<CoursePageData, 'score' | 'paid' | 'reviewTotal'> & FactSource;

/**
 * תיאור הקישור. קורס עם ביקורות: הציון ומספר המאומתים, אחר כך מה ששולם בפועל. בלי ביקורות (מסמך העיצוב 2026-11-17):
 * העובדות שהמוסד מפרסם, כמו השורה ברשימה, ולא "עוד אין". בסוף, מי משלם לנו.
 */
export function courseShareDescription(course: ShareCourse): string {
  const { score } = course;
  const parts: string[] = [];
  if (!showsScore(course.reviewTotal)) {
    parts.push(`${factsLine(course).map((part) => part.text).join(' · ')}.`);
  } else if (score.status === 'scored') {
    parts.push(`ציון בוגרים ${score.value.toFixed(1)} מתוך 10, לפי ${verifiedGraduatesText(score.reviewCount)}.`);
  } else if (score.status === 'not_enough_reviews' && score.reviewCount > 0) {
    parts.push(`עוד אין ציון בוגרים: ${verifiedReviewsText(score.reviewCount)}, ${reviewsToScoreText(score.reviewsNeeded)}.`);
  } else {
    parts.push(`${verifiedReviewsText(course.reviewTotal)}.`);
  }
  if (course.paid) parts.push(`${paidRangeSentence(course.paid)}, ${invoiceCountText(course.paid)}.`);
  parts.push('אף מוכר לא משלם לנו.');
  return parts.join(' ');
}

/** ההודעה בוואטסאפ: הכותרת של הקישור, ומתחתיה התיאור. אותו ניסוח כמו בתצוגה של הקישור עצמו. */
export function courseShareMessage(course: ShareCourse & Pick<CoursePageData, 'title' | 'institutionName'>): string {
  return `${courseShareTitle(course)}\n${courseShareDescription(course)}`;
}
```

- [ ] **Step 4: להריץ ולראות שעוברת.**
  - `pnpm --dir web exec vitest run src/lib/og/share-text.test.ts`. מצופה: כל הבדיקות בקובץ עוברות.

- [ ] **Step 5: תמונת השיתוף של קורס.** ב-`web/src/app/_og/card.tsx`:
  - **imports:** מוסיפים:

```tsx
import { courseFacts, type FactSource } from '@/lib/course/facts';
import { showsScore } from '@/lib/course/score-shown';
```

  - **אחרי הפונקציה `ScoreBox`** מוסיפים:

```tsx
/**
 * "העובדות", כמו בעמוד הקורס כשאין ביקורת מפורסמת (components/course/facts-box.tsx): אותה מסגרת כמו תיבת הציון.
 * ערך ידוע עם קו כחול (המוסד אומר), המשך במרקר ירוק, ומה שחסר בעט.
 */
function FactsCard({ course }: { course: FactSource }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        border: `3px solid ${INK}`,
        backgroundColor: '#ffffff',
        padding: '16px 24px 18px',
        minWidth: 380,
      }}
    >
      <Rtl text="העובדות" size={30} style={{ fontWeight: 700 }} />
      {courseFacts(course).map((fact) => (
        <div key={fact.key} style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', marginTop: 8 }}>
          <Rtl text={`${fact.label}:`} size={24} style={{ color: INK_SOFT, marginLeft: 10 }} />
          {!fact.known ? (
            <Rtl text={fact.missing} size={24} style={{ fontFamily: 'Rubik', fontWeight: 500, color: PEN }} />
          ) : fact.source === 'verified' ? (
            <Marked text={clip(fact.text, 22)} size={24} source="verified" />
          ) : (
            <div style={{ display: 'flex', borderBottom: `3px solid ${CLAIM}`, paddingBottom: 1 }}>
              <Rtl text={clip(fact.text, 22)} size={24} style={{ flexWrap: 'nowrap' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

  - **ב-`renderCourseCard`:** מחליפים

```tsx
            <ScoreBox score={course.score} />
            <Rtl
              text="את הקורס עצמו עוד לא בדקנו."
              size={26}
              style={{ fontFamily: 'Rubik', fontWeight: 500, color: PEN, marginTop: 14, marginRight: 6 }}
            />
```

ב:

```tsx
            {showsScore(course.reviewTotal) ? (
              <>
                <ScoreBox score={course.score} />
                <Rtl
                  text="את הקורס עצמו עוד לא בדקנו."
                  size={26}
                  style={{ fontFamily: 'Rubik', fontWeight: 500, color: PEN, marginTop: 14, marginRight: 6 }}
                />
              </>
            ) : (
              <FactsCard course={course} />
            )}
```

    ו-`<PriceLine course={course} />` נעשה `{showsScore(course.reviewTotal) && <PriceLine course={course} />}`. בלי ביקורות, המחיר כבר בתיבה.
  - **ההערה מעל `ScoreBox`:** מחליפים את `/** הציון בתיבה, כמו בעמוד הקורס. בלי ציון: כמה ביקורות יש וכמה חסרות. */` ב-`/** הציון בתיבה, כמו בעמוד הקורס. רק מביקורת מפורסמת אחת: כמה ביקורות יש וכמה חסרות. */`.

- [ ] **Step 6: ה-alt של תמונת קורס.** ב-`web/src/app/courses/[slug]/opengraph-image.tsx`:

```tsx
export const alt = 'סיכום הקורס על דף מודפס: העובדות שהמוסד מפרסם, או ציון הבוגרים וכמה שילמו בפועל כשיש ביקורות.';
```

- [ ] **Step 7: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`. עמוד הקורס מעביר `CoursePageData` מלא, ולכן `courseShareMessage(course)` ממשיך לעבוד.
  - `pnpm --dir web exec eslint src/lib/og/share-text.ts src/lib/og/share-text.test.ts src/app/_og/card.tsx "src/app/courses/[slug]/opengraph-image.tsx"`

- [ ] **Step 8: בדיקה בעיניים.**
  - **`http://localhost:3100/courses/home-cooking-sample/opengraph-image`:** "העובדות" בשש שורות, בלי "עוד אין ציון" ובלי שורת המחיר למטה, ושום שורה לא יוצאת מהדף.
  - **`/courses/full-stack-sample/opengraph-image`:** כמו קודם.
  - **בעמוד של `home-cooking-sample`:** "לשלוח בוואטסאפ" מכיל את שורת העובדות. בודקים ב-`href` של הקישור.

- [ ] **Step 9: שורה ביומן.**

```md
63. **קישור לקורס בלי ביקורות:** התיאור, ההודעה בוואטסאפ ותמונת השיתוף מראים את העובדות שהמוסד מפרסם, ולא "עוד אין ציון" או "את הקורס עצמו עוד לא בדקנו". עם ביקורות הכול כמו קודם. **נבדק:** vitest (share-text), tsc, והתמונות בשרת המקומי.
```

- [ ] **Step 10: קומיט.**

```bash
git add web/src/lib/og/share-text.ts web/src/lib/og/share-text.test.ts web/src/app/_og/card.tsx "web/src/app/courses/[slug]/opengraph-image.tsx" docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
קישור לקורס בלי ביקורות: העובדות בתיאור ובתמונה

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: מדידת כניסות (Vercel Web Analytics) ופרק בפרטיות

**Files:**
- Modify: `web/package.json`, `web/pnpm-lock.yaml` (תלות חדשה)
- Modify: `web/src/app/layout.tsx` (ה-imports, קבוע, `<Analytics />`)
- Modify: `web/src/app/privacy/page.tsx` (ההערה, "מי אחראי", פרק חדש, "מי עוד מקבל", "כמה זמן שומרים")
- Test: בדיקה מקומית שהרכיב נטען רק כשצריך.

**חשוב:** ההפעלה של Web Analytics בהגדרות הפרויקט ב-Vercel היא צעד נפרד, באישור של גל. מי שמבצע את התוכנית לא עושה אותו, ולא נוגע ב-Vercel. בלי ההפעלה, באתר החי הבקשה ל-`/_vercel/insights/script.js` תחזיר 404. לכן פורסים רק אחרי שגל הפעיל, או מיד לפני.

- [ ] **Step 1: התלות.**
  - הפקודה: `pnpm --dir web add @vercel/analytics`. מצופה: `web/package.json` מקבל `"@vercel/analytics": "^…"` ב-`dependencies`, ו-`web/pnpm-lock.yaml` מתעדכן.
  - מוודאים שיש `/next`: `node -e "console.log(Object.keys(require('./web/node_modules/@vercel/analytics/package.json').exports))"`. מצופה: ברשימה יש `'./next'`.

- [ ] **Step 2: ה-layout.** ב-`web/src/app/layout.tsx`:
  - **imports:** מוסיפים:

```tsx
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from 'react';
```

  - **מתחת ל-`MOTION_SCRIPT`:**

```tsx
/**
 * מדידת כניסות (Vercel Web Analytics, מסמך העיצוב 2026-11-17): בלי עוגיות ובלי זיהוי אישי (/privacy#analytics).
 * רק באתר החי. מקומית, ב-CI ובתצוגות מקדימות לא נטען כלום: שם אין /_vercel/insights, והבקשה הייתה נכשלת עם שגיאה
 * בקונסול (ובדיקת הקצה "בלי שגיאות בקונסול" הייתה נופלת). NEXT_PUBLIC_VERCEL_ENV נקבע ב-Vercel בבנייה (ראו lib/site.ts).
 * המדידה עצמה מתחילה רק אחרי שמפעילים את Web Analytics בהגדרות הפרויקט ב-Vercel, באישור של גל.
 */
const MEASURE_VISITS = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
```

  - **ב-`<body>`, אחרי `<FirstVisit />`:**

```tsx
        {MEASURE_VISITS && (
          // הרכיב קורא את הכתובת בדפדפן. בתוך Suspense, כדי שהעמודים יישארו סטטיים.
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        )}
```

- [ ] **Step 3: מה בדיוק Vercel מודדת.** קוראים, קריאה בלבד ובלי להתחבר, את https://vercel.com/docs/analytics/privacy-policy ואת https://vercel.com/docs/analytics/limits-and-pricing. מוודאים ארבעה דברים:
  1. אין עוגיות.
  2. המבקר נספר לפי טביעה של הבקשה, שנמחקת אחרי 24 שעות.
  3. הנתונים: העמוד, המדינה, סוג המכשיר, מערכת ההפעלה, הדפדפן, האתר שקישר, ופרמטרי utm.
  4. כמה זמן נשמרים הסיכומים בכל חבילה. מצופה: חודש ב-Hobby, ועד 24 חודשים בחבילות בתשלום.

  אם משהו שונה, מתקנים את המשפט המתאים בצעד הבא כך שיתאים לתיעוד, וכותבים את זה ביומן.

- [ ] **Step 4: הפרטיות.** ב-`web/src/app/privacy/page.tsx`:
  - **ההערה מעל `PrivacyPage`:** אחרי `lib/ad-check, scraper/lamadti_scraper/extract.py).` מוסיפים את השורה ` * מדידת הכניסות: app/layout.tsx (@vercel/analytics, רק באתר החי).`
  - **ב"מי אחראי על המידע":** מחליפים את הפסקה השנייה ב:

```tsx
      <p>
        אנחנו לא מוכרים מידע, לא משתמשים בו לפרסום, ולא מעבירים אותו למוסדות, למרצים או למוכרי קורסים. אין באתר
        פרסומות או כלי מעקב. יש מדידת כניסות בלי עוגיות ובלי לזהות אתכם (ראו <a href="#analytics">מדידת כניסות</a>).
      </p>
```

  - **פרק חדש:** אחרי ה-`</ul>` שסוגר את "בלי להתחבר" ולפני `<h2 id="advisor">`:

```tsx
      <h2 id="analytics">מדידת כניסות</h2>
      <dl>
        <dt>למה</dt>
        <dd>כדי לדעת כמה אנשים מגיעים, לאילו עמודים ומאיפה, ולשפר את האתר.</dd>
        <dt>חובה?</dt>
        <dd>אין מה למלא. המדידה בלי עוגיות, ולא מזהה אתכם.</dd>
        <dt>מי מקבל</dt>
        <dd>Vercel, שמגישה את האתר, דרך השירות Vercel Web Analytics.</dd>
      </dl>
      <ul>
        <li>
          בכל כניסה לעמוד נמדדים העמוד, המדינה, סוג המכשיר, מערכת ההפעלה והדפדפן, ומאיפה הגעתם: האתר שקישר אלינו, או
          פרמטרים של קמפיין בכתובת (כמו utm).
        </li>
        <li>
          אין עוגיות, ושום דבר לא נשמר בדפדפן שלכם. כדי לספור מבקר פעם אחת, Vercel יוצרת טביעה מהבקשה, והיא נמחקת
          אחרי 24 שעות.
        </li>
        <li>אנחנו רואים רק סיכומים, כמו כמה כניסות היו לעמוד ומאילו מדינות. לא מבקר מסוים.</li>
        <li>Vercel שומרת את הסיכומים לפי החבילה של האתר: חודש בחבילה החינמית, ועד 24 חודשים בחבילות בתשלום.</li>
        <li>המדידה פועלת רק באתר עצמו, ולא בגרסאות לבדיקה.</li>
      </ul>
```

  - **ב"מי עוד מקבל את המידע", בפריט של Vercel:** אחרי `ביומנים שלה.` מוסיפים ` היא גם מודדת כניסות לאתר, בלי עוגיות (ראו ״מדידת כניסות״).`
  - **ב"כמה זמן שומרים":** אחרי `<li>טביעות של כתובות IP, למגבלת הבקשות: יומיים.</li>` מוסיפים:

```tsx
        <li>
          מדידת כניסות: הטביעה שסופרת מבקר נמחקת אחרי 24 שעות. הסיכומים נשמרים אצל Vercel חודש בחבילה החינמית, ועד 24
          חודשים בחבילות בתשלום.
        </li>
```

- [ ] **Step 5: טיפוסים ו-lint.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint src/app/layout.tsx src/app/privacy/page.tsx`

- [ ] **Step 6: בדיקה מקומית.**
  - **`web-dev-3100`** (בלי `NEXT_PUBLIC_VERCEL_ENV`): ב-`read_network_requests` עם `urlPattern: "insights"` ו-`urlPattern: "vercel-scripts"` אין בקשות, וב-`read_console_messages` אין שגיאות.
  - **`web-closed-3200`** (מדמה את האתר החי): הרכיב נטען. בפיתוח זה הסקריפט לבדיקה מ-`va.vercel-scripts.com`, ובקונסול הודעה של Vercel Web Analytics על מצב דיבאג.
  - **`/privacy`:** הפרק "מדידת כניסות" במקומו, והקישור `#analytics` מהפסקה הראשונה מגיע אליו.

- [ ] **Step 7: שורה ביומן.**

```md
64. **מדידת כניסות:** `@vercel/analytics` ב-layout, רק כש-`NEXT_PUBLIC_VERCEL_ENV` הוא production, ובתוך Suspense. בפרטיות פרק "מדידת כניסות": מה נמדד, מי המעבד (Vercel), וכמה זמן נשמר. **לא נעשה, ומחכה לגל:** להפעיל את Web Analytics בהגדרות הפרויקט ב-Vercel. **נבדק:** tsc, eslint, ובשרת המקומי (3100 בלי סקריפט, 3200 עם).
```

- [ ] **Step 8: קומיט.**

```bash
git add web/package.json web/pnpm-lock.yaml web/src/app/layout.tsx web/src/app/privacy/page.tsx docs/sessions/2026-11-15-round-5.md
git commit -m "$(cat <<'EOF'
מדידת כניסות בלי עוגיות, ופרק בפרטיות

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: בדיקות הקצה לטקסטים החדשים, וסגירה

**Files:**
- Modify: `web/e2e/home.spec.ts` (בדיקה חדשה)
- Modify: `web/e2e/course-page.spec.ts` (בדיקה חדשה)
- Modify: `web/e2e/catalog.spec.ts` (שורות 3–14)
- Modify: `docs/sessions/2026-11-15-round-5.md` ("מה צריך לבדוק בסשן הבא"), `docs/STATUS.md`
- Test: e2e ו-axe רצים ב-CI.

ה-e2e לא רץ מקומית. הבדיקות הקיימות של דף הבית (הסדר ב-`/?cat=cooking&when=evening`), של עמוד הקורס (full-stack ו-ai-tools, שיש להם ביקורות), של היועץ (`textbox` בשם "מה ללמוד") ושל המוסד נשארות נכונות בלי שינוי:
- בשלושת קורסי הבישול ידועות 5 עובדות, ולכן הסדר נקבע כמו קודם, לפי הציון.
- `a11y.spec.ts` לא משתנה. הוא עובר על כל העמודים שהשתנו.

- [ ] **Step 1: דף הבית.** ב-`web/e2e/home.spec.ts`, בסוף הקובץ:

```ts
test('the home page opens with one box, and "for the team" adds a list request under the results', async ({ page }) => {
  await page.goto('/?cat=cooking');
  await expect(page.getByRole('heading', { level: 1, name: 'לא יודעים למי לפנות? כתבו מה אתם צריכים.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'מה ללמוד' })).toBeVisible();
  await expect(page.getByText('או בחרו בעצמכם')).toBeVisible();

  const forMe = page.getByRole('button', { name: 'בשבילי', exact: true });
  await expect(forMe).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: 'רוצים שנכין לכם רשימה?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'בשביל העובדים', exact: true }).click();
  await expect(page.getByRole('link', { name: 'רוצים שנכין לכם רשימה?' })).toHaveAttribute('href', '/companies#request');

  // "מה רואים כאן" במקום "איך האימות עובד", עם הדלת לבדיקת מודעה.
  await expect(page.getByRole('heading', { level: 2, name: 'מה רואים כאן' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'קיבלתם הצעה או ראיתם מודעה? הדביקו את הקישור' })).toHaveAttribute(
    'href',
    '/request-course',
  );
  await expect(page.getByRole('heading', { name: 'איך האימות עובד' })).toHaveCount(0);
});
```

- [ ] **Step 2: עמוד קורס בלי ביקורות.** ב-`web/e2e/course-page.spec.ts`, אחרי הבדיקה `'a course with too few reviews says how many are missing'`:

```ts
test('a course with no published review shows the facts and what to ask, not an empty score', async ({ page }) => {
  await page.goto('/courses/home-cooking-sample');
  await expect(page.getByTestId('score-value')).toHaveCount(0);
  await expect(page.getByText('עוד אין ציון בוגרים')).toHaveCount(0);
  await expect(page.getByText('את הקורס עצמו עוד לא בדקנו')).toHaveCount(0);

  const facts = page.getByRole('region', { name: 'העובדות' });
  await expect(facts).toContainText('1,800 ₪');
  await expect(facts).toContainText('חיפה');
  await expect(facts.locator('[data-source="claim"]').first()).toBeVisible();
  await expect(facts.locator('mark[data-source="verified"]')).toContainText('30 שעות');
  // לקורס הזה אין תעודה בדף.
  await expect(facts).toContainText('לא כתוב בדף');

  // המוסד מפרסם מחיר, משך, מקום ומחזור, ולכן נשארת רק השאלה על בוגרים.
  const ask = page.getByRole('region', { name: 'מה לשאול לפני שמשלמים' });
  await expect(ask.getByRole('listitem')).toHaveCount(1);
  await expect(ask).toContainText('אפשר לדבר עם שני בוגרים מהמחזור הקודם?');
});
```

- [ ] **Step 3: עמוד תחום.** ב-`web/e2e/catalog.spec.ts` מחליפים את הבדיקה הראשונה ב:

```ts
test('a category page lists its courses, with the facts for a course that has no review', async ({ page }) => {
  await page.goto('/categories/cooking');
  await expect(page.getByRole('heading', { level: 1, name: 'בישול' })).toBeVisible();
  // לשלושתם 5 עובדות ידועות, ולכן הציון קובע: האפייה, האיטלקי, ובסוף הקורס בלי ציון.
  await expect(page.locator('#results h3')).toHaveText([
    'אפייה ביתית: לחמים ועוגות',
    'בישול איטלקי',
    'בישול ביתי למתחילים',
  ]);
  await expect(page.locator('#results')).toContainText('קודם קורסים שהמוסד מפרסם בהם יותר פרטים');
  // בלי ביקורות: שורת עובדות במקום "עוד אין ציון בוגרים".
  const homeCooking = page.locator('#results article').filter({ hasText: 'בישול ביתי למתחילים' });
  await expect(homeCooking).toContainText('1,800 ₪');
  await expect(homeCooking).toContainText('חיפה');
  await expect(homeCooking).not.toContainText('עוד אין ציון');
  // סבב 4: המובילים לפי בוגרים, רק קורסים עם ציון, מהגבוה לנמוך. בישול ביתי למתחילים (בלי ציון) לא שם.
  await expect(page.locator('section[aria-labelledby="top-title"] li a')).toHaveText(['אפייה ביתית: לחמים ועוגות', 'בישול איטלקי']);
});
```

- [ ] **Step 4: טיפוסים ו-lint לבדיקות.**
  - `pnpm --dir web exec tsc --noEmit`
  - `pnpm --dir web exec eslint e2e/home.spec.ts e2e/course-page.spec.ts e2e/catalog.spec.ts`

- [ ] **Step 5: כל בדיקות היחידה, פעם אחרונה.**
  - `pnpm --dir web exec vitest run`. מצופה: הכול עובר.

- [ ] **Step 6: שורה ביומן, ו"מה צריך לבדוק בסשן הבא".**
  - **השורה, לפני `## החלטות`:**

```md
65. **בדיקות הקצה לשלב 1:** דף הבית (הכותרת, התיבה, "בשביל העובדים", "מה רואים כאן"), קורס בלי ביקורות ("העובדות" ו"מה לשאול"), ועמוד תחום (שורת העובדות והשורה מעל הרשימה). **נכתב, לא נבדק:** ה-e2e וה-axe רצים ב-CI, לא מקומית. **נבדק:** tsc, eslint וכל בדיקות vitest.
```

  - **ב"מה צריך לבדוק בסשן הבא",** אחרי פריט 6, מוסיפים:

```md
7. **שלב 1 של "לא יודעים למי לפנות?":** לבדוק שה-CI ירוק (e2e ו-axe). לפרוס רק באישור של גל, ואז לבדוק בטלפון (375) ובמחשב: דף הבית, קורס בלי ביקורות, תחום וההשוואה.
8. **מדידת כניסות:** גל מפעיל את Web Analytics בהגדרות הפרויקט ב-Vercel, לפני הפריסה או מיד אחריה. בלי זה, באתר החי הבקשה ל-`/_vercel/insights/script.js` מחזירה 404.
```

- [ ] **Step 7: המצב.** ב-`docs/STATUS.md`, בראש הרשימה של `## איפה אנחנו`, מוסיפים:

```md
- **המהות החדשה, שלב 1 (בענף, עוד לא באוויר):** "לא יודעים למי לפנות?", "העובדות" ו"מה לשאול לפני שמשלמים" בכל קורס, בלי תיבת ציון בלי ביקורות, וסדר לפי כמה פרטים המוסד מפרסם. גם "איך אנחנו משווים", החברות ב"בקרוב", תמונת השיתוף, ומדידת כניסות עם פרק בפרטיות. התוכנית: `docs/superpowers/plans/2026-11-17-who-to-turn-to-stage-1.md`. מחכה ל-CI, לאישור של גל לפרוס, ולהפעלת Web Analytics ב-Vercel באישור של גל.
```

- [ ] **Step 8: קומיט ודחיפה.**

```bash
git add web/e2e/home.spec.ts web/e2e/course-page.spec.ts web/e2e/catalog.spec.ts docs/sessions/2026-11-15-round-5.md docs/STATUS.md
git commit -m "$(cat <<'EOF'
בדיקות הקצה לשלב 1, והמצב

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
git push
```

  - מצופה: הדחיפה ל-`origin/plan-1-foundation` עוברת, וה-CI מתחיל. לפי `CLAUDE.md`, דוחפים בסוף הסשן.
  - **לא פורסים לאתר החי** בלי אישור מפורש של גל.

---

## Self-review: כיסוי של שלב 1 במסמך העיצוב

| דרישה בשלב 1 | משימה |
|---|---|
| **דף הבית:** הכותרת "לא יודעים למי לפנות? כתבו מה אתם צריכים." | 11 |
| **דף הבית:** משפט ההמשך, עם "אף מוכר לא משלם לנו" | 11 |
| **דף הבית:** "בשבילי" או "בשביל העובדים" מעל התיבה, וברירת המחדל "בשבילי" | 10 |
| **דף הבית:** תיבה גדולה אחת עם הדוגמה ליד הקו, דרך `/api/understand`, והתוצאות באותו עמוד | 10 |
| **דף הבית:** השורות מתחת לתיבה, תחת "או בחרו בעצמכם" | 10 |
| **דף הבית:** "בשביל העובדים": "רוצים שנכין לכם רשימה?" מתחת לתוצאות, עם קישור לטופס | 10 |
| **דף הבית:** "מה רואים כאן" במקום "איך האימות עובד" | 11 |
| **דף הבית:** הדלת "קיבלתם הצעה או ראיתם מודעה? הדביקו את הקישור" ל-`/request-course` | 11 |
| **דף הבית:** "סיימתם קורס?" נשאר, עם "כתיבת ביקורות נפתחת בקרוב" | 11 |
| **"מה לשאול לפני שמשלמים":** כללים קבועים בלי מודל, עד 3, בסדר הרשימה, והשאלה הקבועה כשיש מקום | 2 |
| **"מה לשאול":** לכל קורס בתוצאות | 7 |
| **"מה לשאול":** לכל קורס בעמוד הקורס, מתחת ל"העובדות" | 4 |
| **עמוד הקורס:** בלי ביקורת, תיבת הציון וההערה בעט יורדות | 3, 4 |
| **עמוד הקורס:** "העובדות" (שישה שדות, קו כחול או ירוק, "לא כתוב בדף", "המוסד לא מפרסם מחיר") | 1, 4 |
| **עמוד הקורס:** מביקורת אחת תיבת הציון חוזרת, כולל "עוד X ביקורות עד ציון" | 3, 4 |
| **עמוד הקורס:** "בקצרה" רק עם שורות שיש להן ערך, ו"כמה שילמו בפועל" מחמש חשבוניות | 4 |
| **עמוד הקורס:** "מאיפה הפרטים" נשאר כמו שהוא | 4 (לא נוגעים) |
| **הרשימות:** שורת עובדות בלי ביקורות (מחיר או "מחיר לא מפורסם", משך, מתכונת ומיקום) | 1, 7 |
| **הרשימות:** "המובילים לפי בוגרים" לא מוצג בלי קורס עם ציון | 8 |
| **הרשימות:** הפתיחה של תחום בלי "עוד אין בוגרים מאומתים" | 8 |
| **הרשימות:** הסדר לפי מספר העובדות הידועות, אחר כך ציון | 1, 5, 6 |
| **הרשימות:** מעל הרשימה "קודם קורסים שהמוסד מפרסם בהם יותר פרטים" | 7 |
| **מקומות נוספים עם "עוד אין ציון":** "סיימתם קורס?" | 11 |
| **מקומות נוספים:** עמודי מוסד, מרצה והסבה (CourseRow), כותרת המוסד | 7, 8 |
| **מקומות נוספים:** כל הקורסים | 8 |
| **מקומות נוספים:** ההשוואה ומגש ההשוואה | 9 |
| **מקומות נוספים:** התיאור ותמונת השיתוף של קורס | 15 |
| **התפריט:** "איך אנחנו משווים", הכתובת `/method` לא משתנה | 12 |
| **עמוד השיטה:** פתיחה חדשה, "בקרוב: ביקורות רק ממי שהעלה הוכחה", והשיטה תחת "כשיהיו ביקורות" | 12 |
| **עמוד החברות:** "המחיר ששילמו בפועל" ו"ביקורות" ב"בקרוב", והטופס לא משתנה | 13 |
| **תמונת השיתוף של דף הבית:** "לא יודעים למי לפנות?" ומשפט ההמשך | 14 |
| **מדידת כניסות:** `@vercel/analytics` ב-layout | 16 |
| **מדידת כניסות:** הפרק בפרטיות (מה נמדד, Vercel, זמן השמירה) | 16 |
| **מדידת כניסות:** ההפעלה ב-Vercel באישור של גל, ולא בתוכנית | 16 (מסומן), 17 (בבדיקה הבאה) |
| **בדיקות יחידה:** "מה לשאול", הסדר והכלל | 2, 6, 3 (ו-1, 9, 15) |
| **e2e:** דף הבית ועמוד הקורס בטקסטים החדשים, ו-axe ירוק | 17 |
| **בדיקה בעיניים:** 375 ומחשב, בכל משימת ממשק | 4, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 |

**מה בכוונה לא כאן**, לפי "מה לא בונים עכשיו" ושלבים 2–3:
- סינונים חדשים;
- חיפוש מותאם לחברות;
- "מחיר לא מפורסם" כערך במסד;
- אזור לפי המוסד;
- פתיחת ההתחברות;
- דגלים בעמוד הקורס.

**לא שונה, ושווה החלטה של גל:**
- **עמוד "הסבה להייטק":** משתנות רק השורות שלו, דרך `CourseRow`. הכותרות "לפי ציון הבוגרים" והטקסט על ציון נשארו.
- **ההיכרות למבקר ראשון:** נשאר "ביקורות רק ממי שלמד".
