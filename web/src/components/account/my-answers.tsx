import { PenArrow } from '@/components/site/pen';
import Link from 'next/link';
import { PenAnswer } from '@/components/notebook/answer-line';
import { PenNumber } from '@/components/site/pen';
import { buttonVariants } from '@/components/ui/button';
import { formatAmount, formatHebrewDate } from '@/lib/format';
import { matchCourses } from '@/lib/search/match';
import { activeLines, hasAnswer, serializeQuery, whenHowWords } from '@/lib/search/query';
import type { Catalog, LineKey, SearchQuery } from '@/lib/search/types';
import { whyOption } from '@/lib/search/why';
import { cn } from '@/lib/utils';
import { MeSection, marginNote } from './me-section';

function AnswerRow({ number, question, children }: { number: number; question: string; children?: React.ReactNode }) {
  return (
    <li data-anim="ink" className="ruled-row grid min-h-[58px] grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
      <span className="flex flex-col items-start gap-0.5 font-sans text-[13px] leading-tight text-ink-soft lg:flex-row lg:items-center lg:gap-2.5 lg:text-[15px]">
        <PenNumber n={number} className="lg:size-[34px] lg:text-[19px]" />
        {question}
      </span>
      <p className="pt-3.5 ps-3 pb-0.5 text-lg leading-normal">{children}</p>
    </li>
  );
}

const fitsText = (n: number) => (n === 0 ? 'היום אין קורס מתאים' : n === 1 ? 'היום מתאים קורס אחד' : `היום מתאימים ${n}`);

/**
 * "התשובות שלי": ארבע השורות מדף הבית, לקריאה בלבד, ו"לחזור לרשימה" עם אותן תשובות בכתובת.
 * תשובה בשורה שהווי שלה הוסר מוצגת מחוקה, כמו בדף הבית.
 */
export function MyAnswers({
  catalog,
  query,
  savedAt,
}: {
  catalog: Catalog;
  query: SearchQuery | null;
  savedAt: string | null;
}) {
  if (!query || !savedAt) {
    return (
      <MeSection id="answers" title="התשובות שלי" sub="עוד לא שמרתם תשובות מדף הבית.">
        <p className="ms-(--margin) mt-2 ps-3 font-sans text-[15px] font-semibold">
          <Link href="/" className="inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover">
            לענות על ארבע השאלות בדף הבית
          </Link>
        </p>
      </MeSection>
    );
  }

  const struck = (line: LineKey) => hasAnswer(query, line) && query.off.includes(line);
  const nameOf = (slug: string) => catalog.categories.find((c) => c.slug === slug)?.name ?? slug;
  const what = query.q || query.cats.map(nameOf).join(', ');
  const why = query.why ? whyOption(query.why) : null;
  const whenHow = whenHowWords(query.when, query.how);
  const filtering = activeLines(query).length > 0;
  const search = serializeQuery(query);

  return (
    <MeSection
      id="answers"
      title="התשובות שלי"
      sub={`מהשאלות בדף הבית. שמרתם אותן ב-${formatHebrewDate(savedAt)}.`}
    >
      <p className="ms-(--margin) mt-2.5 pt-1 ps-3 pb-1.5 text-lg leading-normal">אני רוצה ללמוד</p>
      <ol className="ruled-top">
        <AnswerRow number={1} question="מה?">
          {what && <PenAnswer struck={struck('what')}>{what}</PenAnswer>}
        </AnswerRow>
        <AnswerRow number={2} question="למה?">
          {why && (
            <>
              {why.prefix && `${why.prefix} `}
              <PenAnswer struck={struck('why')}>{why.label}</PenAnswer>,
            </>
          )}
        </AnswerRow>
        <AnswerRow number={3} question="מתי ואיך?">
          {whenHow.words.length > 0 && (
            <>
              {whenHow.prefix}
              <PenAnswer struck={struck('whenhow')}>{whenHow.words.join(', ')}</PenAnswer>,
            </>
          )}
        </AnswerRow>
        <AnswerRow number={4} question="כמה?">
          {query.maxPrice !== null && (
            <>
              עד <PenAnswer struck={struck('budget')}>{formatAmount(query.maxPrice)}</PenAnswer> ₪
            </>
          )}
        </AnswerRow>
      </ol>
      <div className="mt-3.5 grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
        <p className={marginNote}>
          {filtering && (
            <>
              <PenArrow />
              {fitsText(matchCourses(catalog.courses, query).length)}
            </>
          )}
        </p>
        <div className="ps-3">
          <Link
            href={search ? `/?${search}` : '/'}
            className={cn(buttonVariants(), 'h-[50px] w-full font-sans text-base font-bold')}
          >
            לחזור לרשימה
          </Link>
        </div>
      </div>
    </MeSection>
  );
}
