'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { formatAmount, formatIls } from '@/lib/format';
import { matchKeywords, matchNames, type KeywordCategory } from '@/lib/search/keywords';
import { matchCourses, similarTo } from '@/lib/search/match';
import {
  MAX_Q_LENGTH,
  activeLines,
  applyUnderstanding,
  hasAnswer,
  parsePrice,
  parseQuery,
  serializeQuery,
  toggleIn,
  toggleLine,
  whenHowWords,
} from '@/lib/search/query';
import {
  COURSE_FORMATS,
  FORMAT_LABEL,
  TIME_SLOTS,
  TIME_SLOT_LABEL,
  type Catalog,
  type LineKey,
  type SearchQuery,
  type Understanding,
} from '@/lib/search/types';
import { COURSE_TYPE_LABEL, WHY_OPTIONS, courseTypeForWhy, whyOption } from '@/lib/search/why';
import { cn } from '@/lib/utils';
import { AnswerLine, PenAnswer } from './answer-line';
import { ChoiceChip } from './choice-chip';
import { Results, allCoursesTitle, coursesTitle } from './results';

/** שינוי בתשובות: מקבל את התשובות העדכניות מהכתובת, ומחזיר את החדשות. */
type Update = (change: (current: SearchQuery) => SearchQuery) => void;

export interface NotebookProps {
  catalog: Catalog;
  /** מה שממולא מראש: ריק בדף הבית ובכל הקורסים, התחום בעמוד תחום. */
  base: SearchQuery;
  /** בעמוד תחום שורה 1 קבועה: התחום של העמוד. */
  fixedWhat: boolean;
  /** בעמוד תחום ובכל הקורסים, הרשימה מוצגת גם כשאף שורה לא מסננת. */
  alwaysShowResults: boolean;
  /** מוצג מתחת לטופס, בתוך קו השוליים. בדף הבית: "או" והמסלולים. */
  afterForm?: React.ReactNode;
}

/**
 * המחברת, עם התשובות מהכתובת. חייבת להיות בתוך <Suspense>: בדף שנבנה מראש,
 * useSearchParams ידוע רק בדפדפן (use-search-params.md, "Prerendering").
 */
export function NotebookFromUrl(props: NotebookProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const { base } = props;
  const query = useMemo(() => parseQuery(params, base), [params, base]);
  const update = useCallback<Update>(
    (change) => {
      // הכתובת היא מקור האמת. קוראים אותה מחדש בכל שינוי, כדי שתשובה שמגיעה אחרי המתנה (ה-AI)
      // לא תדרוס שינוי שהמבקר עשה בינתיים.
      const current = parseQuery(new URLSearchParams(window.location.search), base);
      const search = serializeQuery(change(current), base);
      // replaceState משתלב בנתב של Next: useSearchParams מתעדכן בלי בקשה לשרת.
      window.history.replaceState(null, '', search ? `${pathname}?${search}` : pathname);
    },
    [base, pathname],
  );
  return <Notebook {...props} query={query} update={update} />;
}

/** שואל את השרת מה הבנו. בלי רשת, או כשהשרת לא עונה, התאמת מילים כאן בדפדפן. */
async function understandText(text: string, categories: KeywordCategory[]): Promise<Understanding> {
  try {
    const response = await fetch('/api/understand', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (response.ok) return (await response.json()) as Understanding;
  } catch {
    // ממשיכים להתאמת מילים.
  }
  return matchKeywords(text, categories);
}

/** סכומים מוכנים מתחת לשורה 4, כמו באב-טיפוס. */
const BUDGET_PRESETS = [3000, 5000, 10000, 15000];

const lineText = 'self-stretch pt-4 ps-3 pb-1 pe-1 text-start text-lg leading-normal';
/** מה שהמבקר מקליד: עט כחול, מוטה מעט כמו בציור. הדוגמה (placeholder) נשארת ישרה. */
const penInput =
  'bg-transparent font-pen text-[21px] font-medium leading-normal text-pen caret-pen outline-none not-placeholder-shown:-rotate-1';
const inputExample = 'placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft';
/**
 * שדה שגדל עם מה שכותבים, כמו כתב יד על הקו. עותק בלתי נראה של הטקסט (::after) יושב באותו תא של
 * הגריד וקובע את הגודל, ולכן תשובה או דוגמה ארוכה עוברת לשורה שנייה במקום להיחתך.
 * הגופן של העותק זהה לשדה: עט כשיש תשובה, ובגופן המודפס כשמוצגת הדוגמה (data-empty).
 */
const growCopy =
  'after:invisible after:col-start-1 after:row-start-1 after:whitespace-pre-wrap after:break-words after:content-[attr(data-copy)] after:font-pen after:text-[21px] after:font-medium after:leading-normal data-empty:after:font-sans data-empty:after:text-[15px] data-empty:after:font-normal';
const WHAT_EXAMPLE = 'למשל: לבנות אתרים, אקסל לעבודה, עוגות';
const BUDGET_EXAMPLE = '10,000';

/**
 * מעדכן את העותק שקובע את גודל השדה. נוגע רק במאפיינים של העטיפה, ש-React לא משנה עד שה-key שלה
 * מתחלף, ולכן אין התנגשות עם הרינדור.
 */
function syncCopy(field: HTMLInputElement | HTMLTextAreaElement, fallback: string) {
  const box = field.parentElement;
  if (!box) return;
  box.dataset.copy = field.value || fallback;
  box.toggleAttribute('data-empty', field.value === '');
}

/** שורה 1 היא textarea כדי שתשובה ארוכה תישבר, אבל היא שורה אחת: Enter שולח, כמו בשדה רגיל. */
function submitOnEnter(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }
}
/** דוגמה בשורה ריקה: בגופן המודפס ובאפור, כדי שלא תיראה כמו תשובה בעט (מסמך העיצוב, 3א.4). */
const example = 'font-sans text-[15px] font-normal text-ink-soft';
/** תשובה בשורה שהווי שלה הוסר: מחוקה, כמו באב-טיפוס. */
const struck = 'line-through decoration-[1.5px] opacity-50';
const panel = 'grid grid-cols-[70px_minmax(0,1fr)] gap-y-2.5 border-b border-line pt-3.5 pb-4 font-sans';
const panelLabel = 'pt-[11px] text-[13px] leading-snug text-ink-soft';
const smallNote = 'font-sans text-[13px] leading-normal text-ink-soft';
const smallLink = 'underline underline-offset-[3px] hover:text-link-hover';

/**
 * ארבע השורות של "שאלה בשוליים", והרשימה מתחתן.
 * הבחירות של כל שורה נפתחות בתוך המחברת, מתחת לשורה, כמו באב-טיפוס (design/prototypes/home-prototype.html).
 * בלי update (הגיבוי של ה-Suspense, לפני שהדפדפן קרא את הכתובת) המחברת מוצגת אבל לא משנה כלום.
 */
export function Notebook({
  catalog,
  fixedWhat,
  alwaysShowResults,
  afterForm,
  query,
  update,
}: NotebookProps & { query: SearchQuery; update?: Update }) {
  const router = useRouter();
  // השורה שהבחירות שלה פתוחות עכשיו מתחתיה.
  const [open, setOpen] = useState<LineKey | null>(null);
  // מה שמוקלד עכשיו בשורת התקציב, לפני שנשמר בכתובת. כך הספירה על הכפתור חיה.
  const [budgetTyping, setBudgetTyping] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  // הטקסט האחרון שנשלח להבנה. כך יציאה מהשדה ולחיצה על הכפתור לא שולחות אותו פעמיים.
  const lastCommitted = useRef<string | null>(null);

  const change: Update = update ?? (() => {});
  // מה שה-AI והתאמת המילים יכולים להחזיר: כל תחום עם קורסים, כולל תחומי אב.
  const understandOptions = useMemo(
    () => catalog.categories.filter((c) => c.courseCount > 0).map(({ slug, name }) => ({ slug, name })),
    [catalog.categories],
  );
  // הכפתורים מתחת לשורה 1: רק תחומים בלי תחומי משנה, כדי שלא יופיעו גם האב וגם הבן.
  const pickable = useMemo(
    () => catalog.categories.filter((c) => c.courseCount > 0 && c.isLeaf),
    [catalog.categories],
  );
  const nameOf = (slug: string) => catalog.categories.find((c) => c.slug === slug)?.name ?? slug;
  const shownWhat = query.q || query.cats.map(nameOf).join(', ');
  const named = query.q ? matchNames(query.q, catalog.courses) : null;
  const similar = named ? similarTo(named.courses, catalog.courses) : [];
  const why = query.why ? whyOption(query.why) : null;
  const whenHow = whenHowWords(query.when, query.how);

  const effective = budgetTyping === null ? query : { ...query, maxPrice: parsePrice(budgetTyping) };
  const active = activeLines(effective);
  const results = matchCourses(catalog.courses, effective);
  const showResults = alwaysShowResults || active.length > 0;
  const typeFirst =
    effective.why && active.includes('why') ? COURSE_TYPE_LABEL[courseTypeForWhy(effective.why)] : null;
  const buttonLabel = !showResults
    ? 'לראות קורסים'
    : results.length === 0
      ? 'אין קורסים מתאימים'
      : results.length === 1
        ? 'לראות קורס אחד'
        : `לראות ${results.length} קורסים`;

  const ticked = (line: LineKey) => hasAnswer(query, line) && !query.off.includes(line);
  const isStruck = (line: LineKey) => hasAnswer(query, line) && query.off.includes(line);
  const toggle = (line: LineKey) => change((c) => toggleLine(c, line));
  const toggleOpen = (line: LineKey) => setOpen(open === line ? null : line);
  /** תשובה חדשה בשורה מחזירה לה את הווי. */
  const answer = (line: LineKey, edit: (c: SearchQuery) => SearchQuery) =>
    change((c) => {
      const next = edit(c);
      return { ...next, off: next.off.filter((l) => l !== line) };
    });

  async function commitWhat(raw: string) {
    // שורה אחת: ירידת שורה שהודבקה הופכת לרווח.
    const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_Q_LENGTH);
    if (text === shownWhat || text === lastCommitted.current) return;
    lastCommitted.current = text;
    if (text === '') {
      change((c) => ({ ...c, q: '', cats: [] }));
      return;
    }
    // שם של קורס או מוסד: התחום ידוע מהקטלוג, בלי לשאול את ה-AI (מסמך העיצוב, 3א.2).
    const byName = matchNames(text, catalog.courses);
    if (byName) {
      const cats = [...new Set(byName.courses.map((c) => c.categorySlug))];
      answer('what', (c) => ({ ...c, q: text, cats }));
      return;
    }
    change((c) => ({ ...c, q: text, cats: [] }));
    setWorking(true);
    const found = await understandText(text, understandOptions);
    setWorking(false);
    change((c) => applyUnderstanding(c, text, found));
  }

  function commitBudget(raw: string) {
    setBudgetTyping(null);
    const maxPrice = parsePrice(raw);
    if (maxPrice !== query.maxPrice) answer('budget', (c) => ({ ...c, maxPrice }));
  }

  function pickCategory(slug: string) {
    lastCommitted.current = null;
    const order = pickable.map((p) => p.slug);
    answer('what', (c) => ({ ...c, q: '', cats: toggleIn(c.cats, slug, order) }));
  }

  function pickBudget(amount: number) {
    setBudgetTyping(null);
    answer('budget', (c) => ({ ...c, maxPrice: c.maxPrice === amount ? null : amount }));
  }

  function scrollToResults() {
    // הרשימה מופיעה רק אחרי שהכתובת התעדכנה, ולכן מחכים לציור הבא.
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('results')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(null);
    const form = new FormData(event.currentTarget);
    const what = String(form.get('what') ?? '');
    const budget = String(form.get('budget') ?? '');
    // בלי אף תשובה, הכפתור מוביל לרשימה המלאה.
    if (!showResults && what.trim() === '' && budget.trim() === '') {
      router.push('/courses');
      return;
    }
    if (form.has('budget')) commitBudget(budget);
    if (form.has('what')) await commitWhat(what);
    scrollToResults();
  }

  return (
    <>
      {/* קו השוליים של המחברת מצויר ב-NotebookPage, כדי שימשיך לאורך הרשימה והחלקים שאחריה, כמו בציור. */}
      <div>
        <form aria-label="אני מחפש קורס" onSubmit={(event) => void submit(event)}>
          <p className="ms-[70px] pt-1 ps-3 pb-1.5 text-lg leading-normal">אני רוצה ללמוד</p>
          <ol className="border-t border-line">
            <li>
              <AnswerLine
                number={1}
                question="מה?"
                ticked={ticked('what')}
                canTick={!fixedWhat && hasAnswer(query, 'what')}
                onTick={() => toggle('what')}
                open={open === 'what'}
              >
                {fixedWhat ? (
                  <p className={lineText}>
                    <PenAnswer>{shownWhat}</PenAnswer>
                  </p>
                ) : (
                  <div
                    key={shownWhat}
                    data-copy={shownWhat || WHAT_EXAMPLE}
                    data-empty={shownWhat === '' ? '' : undefined}
                    className={cn(growCopy, 'grid min-w-0 self-stretch after:pt-4 after:ps-3 after:pb-1 after:pe-1')}
                  >
                    <textarea
                      name="what"
                      rows={1}
                      defaultValue={shownWhat}
                      maxLength={MAX_Q_LENGTH}
                      autoComplete="off"
                      enterKeyHint="search"
                      aria-label="מה ללמוד"
                      placeholder={WHAT_EXAMPLE}
                      onFocus={() => setOpen('what')}
                      onInput={(event) => syncCopy(event.currentTarget, WHAT_EXAMPLE)}
                      onKeyDown={submitOnEnter}
                      onBlur={(event) => void commitWhat(event.currentTarget.value)}
                      className={cn(
                        'col-start-1 row-start-1 min-w-0 resize-none overflow-hidden pt-4 ps-3 pb-1 pe-1 text-start',
                        penInput,
                        inputExample,
                        isStruck('what') && struck,
                      )}
                    />
                  </div>
                )}
              </AnswerLine>
              {!fixedWhat && open === 'what' && (
                <div role="group" aria-label="מה ללמוד: אפשר לבחור תחום" className={panel}>
                  <span className={panelLabel}>או לבחור</span>
                  <div className="flex flex-wrap gap-2 ps-3">
                    {pickable.map((category) => (
                      <ChoiceChip
                        key={category.slug}
                        checked={query.cats.includes(category.slug)}
                        onClick={() => pickCategory(category.slug)}
                      >
                        {category.name}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
              )}
            </li>

            <li>
              <AnswerLine
                number={2}
                question="למה?"
                ticked={ticked('why')}
                canTick={hasAnswer(query, 'why')}
                onTick={() => toggle('why')}
                open={open === 'why'}
              >
                <button
                  type="button"
                  aria-expanded={open === 'why'}
                  aria-controls="why-options"
                  onClick={() => toggleOpen('why')}
                  className={lineText}
                >
                  <span className="sr-only">למה: </span>
                  {why ? (
                    <>
                      {why.prefix && `${why.prefix} `}
                      <PenAnswer struck={isStruck('why')}>{why.label}</PenAnswer>,
                    </>
                  ) : (
                    <>
                      כדי <span className={example}>להחליף מקצוע? לקבל תעודה?</span>
                    </>
                  )}
                </button>
              </AnswerLine>
              {open === 'why' && (
                <div id="why-options" role="group" aria-label="למה: בוחרים תשובה אחת" className={panel}>
                  <span className={panelLabel}>כדי</span>
                  <div className="flex flex-wrap gap-2 ps-3">
                    {WHY_OPTIONS.map((option) => (
                      <ChoiceChip
                        key={option.key}
                        pressed={query.why === option.key}
                        onClick={() => {
                          answer('why', (c) => ({ ...c, why: c.why === option.key ? null : option.key }));
                          setOpen(null);
                        }}
                      >
                        {option.label}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
              )}
            </li>

            <li>
              <AnswerLine
                number={3}
                question="מתי ואיך?"
                ticked={ticked('whenhow')}
                canTick={hasAnswer(query, 'whenhow')}
                onTick={() => toggle('whenhow')}
                open={open === 'whenhow'}
              >
                <button
                  type="button"
                  aria-expanded={open === 'whenhow'}
                  aria-controls="whenhow-options"
                  onClick={() => toggleOpen('whenhow')}
                  className={lineText}
                >
                  <span className="sr-only">מתי ואיך: </span>
                  {whenHow.words.length > 0 ? (
                    <>
                      {whenHow.prefix}
                      <PenAnswer struck={isStruck('whenhow')}>{whenHow.words.join(', ')}</PenAnswer>,
                    </>
                  ) : (
                    <span className={example}>ערבים? סופ״ש? אונליין?</span>
                  )}
                </button>
              </AnswerLine>
              {open === 'whenhow' && (
                <div id="whenhow-options" role="group" aria-label="מתי ואיך: אפשר לבחור כמה" className={panel}>
                  <span className={panelLabel}>מתי</span>
                  <div className="flex flex-wrap gap-2 ps-3">
                    {TIME_SLOTS.map((slot) => (
                      <ChoiceChip
                        key={slot}
                        checked={query.when.includes(slot)}
                        onClick={() => answer('whenhow', (c) => ({ ...c, when: toggleIn(c.when, slot, TIME_SLOTS) }))}
                      >
                        {TIME_SLOT_LABEL[slot]}
                      </ChoiceChip>
                    ))}
                  </div>
                  <span className={panelLabel}>איך</span>
                  <div className="flex flex-wrap gap-2 ps-3">
                    {COURSE_FORMATS.map((format) => (
                      <ChoiceChip
                        key={format}
                        checked={query.how.includes(format)}
                        onClick={() =>
                          answer('whenhow', (c) => ({ ...c, how: toggleIn(c.how, format, COURSE_FORMATS) }))
                        }
                      >
                        {FORMAT_LABEL[format]}
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
              )}
            </li>

            <li>
              <AnswerLine
                number={4}
                question="כמה?"
                ticked={ticked('budget')}
                canTick={hasAnswer(query, 'budget')}
                onTick={() => toggle('budget')}
                open={open === 'budget'}
              >
                {/* כל השורה היא התווית של השדה: נגיעה בכל מקום עליה מתחילה לכתוב (יעד מגע של 60 פיקסלים). */}
                <label className={cn(lineText, 'flex cursor-text items-baseline')}>
                  <span>עד</span>
                  {/* השדה ברוחב המספר, כמו "עד 15,000 ₪" בציור, ולא שדה רחב עם רווחים סביב. */}
                  <span
                    key={query.maxPrice ?? 'none'}
                    data-copy={query.maxPrice === null ? BUDGET_EXAMPLE : formatAmount(query.maxPrice)}
                    data-empty={query.maxPrice === null ? '' : undefined}
                    // השדה מונח מעל העותק (absolute), כי לשדה יש רוחב מינימלי משלו, רחב מהמספר.
                    className={cn(growCopy, 'relative mx-1.5 inline-block min-w-[2ch] after:whitespace-pre')}
                  >
                    <input
                      name="budget"
                      size={1}
                      defaultValue={query.maxPrice === null ? '' : formatAmount(query.maxPrice)}
                      inputMode="numeric"
                      autoComplete="off"
                      aria-label="תקציב בשקלים"
                      placeholder={BUDGET_EXAMPLE}
                      onFocus={() => setOpen('budget')}
                      onChange={(event) => {
                        syncCopy(event.currentTarget, BUDGET_EXAMPLE);
                        setBudgetTyping(event.currentTarget.value);
                      }}
                      onBlur={(event) => commitBudget(event.currentTarget.value)}
                      className={cn(
                        penInput,
                        inputExample,
                        'absolute inset-0 w-full min-w-0 text-center',
                        isStruck('budget') && struck,
                      )}
                    />
                  </span>
                  <span>₪</span>
                </label>
              </AnswerLine>
              {open === 'budget' && (
                <div role="group" aria-label="כמה: סכומים מוכנים" className={panel}>
                  <span className={panelLabel}>או</span>
                  <div className="flex flex-wrap gap-2 ps-3">
                    {BUDGET_PRESETS.map((amount) => (
                      <ChoiceChip key={amount} pressed={query.maxPrice === amount} onClick={() => pickBudget(amount)}>
                        עד <bdi dir="rtl">{formatIls(amount)}</bdi>
                      </ChoiceChip>
                    ))}
                  </div>
                </div>
              )}
            </li>
          </ol>

          <div className="ms-[70px] ps-3">
            {fixedWhat ? (
              <p className={cn(smallNote, 'mt-3')}>
                <Link href="/" className={smallLink}>
                  לחפש בתחום אחר
                </Link>
              </p>
            ) : (
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
                    <p className="font-pen text-[15px] leading-snug font-medium text-pen">
                      <span aria-hidden="true">← </span>
                      {named.by === 'title'
                        ? 'יש לנו קורס בשם הזה: '
                        : `יש לנו קורסים של ${named.courses[0].institutionName}: `}
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
            )}
            <p className={cn(smallNote, 'mt-1')}>שורה בלי סימון לא מסננת את התוצאות.</p>
            <button type="submit" className={cn(buttonVariants(), 'mt-3.5 h-[50px] w-full text-base font-bold')}>
              {buttonLabel}
            </button>
          </div>
        </form>
        {afterForm}
      </div>

      {showResults && (
        <Results
          heading={active.length > 0 ? coursesTitle(results.length) : allCoursesTitle(results.length)}
          results={results}
          typeFirst={typeFirst}
        />
      )}
    </>
  );
}
