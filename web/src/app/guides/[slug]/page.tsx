import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Blocks, textLink } from '@/components/guides/guide-content';
import { GuideLegend } from '@/components/guides/guide-legend';
import { RelatedGuides } from '@/components/guides/related-guides';
import { TocSpy } from '@/components/guides/toc-spy';
import { PenArrowDown } from '@/components/site/pen';
import { Sheet } from '@/components/site/sheet';
import { type Guide, formatGuideDate, getGuide, getGuides } from '@/lib/guides/guides';
import { SITE_NAME } from '@/lib/site';

/** העמוד נבנה כולו בזמן הבנייה, מהקובץ ב-content/guides. בלי שום דבר שנקבע בבקשה. */
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return getGuides().map((g) => ({ slug: g.slug }));
}

type Props = { params: Promise<{ slug: string }> };

/** הכותרת לגוגל מ-seo_title, והתיאור מ-description (content/guides/README.md). התמונה מ-opengraph-image.tsx. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const url = `/guides/${guide.slug}`;
  return {
    title: `${guide.seoTitle} | ${SITE_NAME}`,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { type: 'article', locale: 'he_IL', siteName: SITE_NAME, url, title: guide.title, description: guide.description },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.description },
  };
}

/** ניווט בתוך המדריך: "N פרקים בעמוד" בעט, ומתחתיו הפרקים. במחשב הוא נשאר במקום בגלילה, ליד המקרא. */
function GuideToc({ guide, className }: { guide: Guide; className?: string }) {
  // הפרק שקוראים עכשיו: העט מותח קו מתחת לשם שלו (TocSpy), כמו בעמוד הנוכחי בתפריט.
  const link =
    'inline-flex min-h-11 items-center py-1 text-start leading-snug aria-[current=location]:[&_.pen-under]:[background-size:calc(100%+0.15em)_0.32em]';
  return (
    <nav id="guide-toc" aria-label="בעמוד הזה" className={className}>
      <TocSpy navId="guide-toc" ids={[...guide.sections.map((s) => s.id), 'sources']} />
      <p className="flex items-center gap-1.5 font-pen text-[15px] font-medium text-pen lg:text-base">
        {guide.sections.length} פרקים בעמוד
        <PenArrowDown />
      </p>
      <ol className="mt-1 font-sans text-[15px] font-semibold">
        {guide.sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className={link}>
              <span className="pen-under">{s.title}</span>
            </a>
          </li>
        ))}
        <li>
          <a href="#sources" className={`${link} font-normal text-ink-soft`}>
            <span className="pen-under">המקורות ({guide.sources.length})</span>
          </a>
        </li>
      </ol>
    </nav>
  );
}

/** רשימת המקורות בסוף המדריך: מספר, שם, מה מצוטט ממנו כאן, קישור ותאריך הבדיקה. המספרים הם אלה שבטקסט. */
function Sources({ guide }: { guide: Guide }) {
  return (
    <section id="sources" aria-labelledby="sources-title" className="mt-12 scroll-mt-6 lg:mt-16">
      <h2 id="sources-title" className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
        מקורות
      </h2>
      <p className="mt-4 font-sans text-[14px] text-ink-soft text-pretty lg:text-[15px]">
        כל המקורות נבדקו ב-{formatGuideDate(guide.checked)}, ונבדוק אותם שוב עד {formatGuideDate(guide.nextReview)}.
      </p>
      <ol className="mt-5 flex flex-col gap-4 font-sans text-[14px] leading-normal lg:text-[15px]">
        {guide.sources.map((s) => (
          <li key={s.id} id={`source-${s.id}`} className="flex scroll-mt-6 gap-3">
            <span className="w-6 flex-none font-bold tabular-nums">{s.n}.</span>
            <div className="min-w-0">
              <p className="font-semibold text-pretty">{s.title}</p>
              {s.cited.length > 0 && <p className="text-ink-soft text-pretty">מה מצוטט כאן: {s.cited.join('; ')}</p>}
              <p className="flex flex-wrap items-center gap-x-4 text-ink-soft">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-11 items-center font-semibold text-ink ${textLink}`}
                >
                  לפתוח את המקור<span className="sr-only"> (בחלון חדש)</span>
                </a>
                {s.checked && <span>נבדק ב-{s.checked}</span>}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const all = getGuides();
  const related = guide.related.map((r) => all.find((g) => g.slug === r)).filter((g): g is Guide => Boolean(g));

  return (
    <Sheet>
      <main id="main">
        <nav aria-label="מיקום" className="mt-2 font-sans text-[13px] text-ink-soft lg:mt-6 lg:text-sm">
          <Link href="/guides" className={`inline-flex min-h-11 items-center ${textLink}`}>
            מדריכים לפני שמשלמים
          </Link>
        </nav>
        {/*
          במחשב: עמודת קריאה אחת מימין, עד 64ch, ומשמאל עמודה צרה שנשארת במקום בגלילה: הפרקים והמקרא.
          בנייד: הכותרת והפתיחה, המקרא, הפרקים, ואז המדריך עצמו.
        */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_232px] lg:gap-x-12 xl:grid-cols-[minmax(0,1fr)_264px] xl:gap-x-20">
          <header className="lg:col-start-1 lg:row-start-1 lg:max-w-[64ch]">
            <h1 className="mt-0.5 text-[30px] leading-tight font-bold text-balance lg:text-[50px] lg:leading-[1.08]">
              {guide.title}
            </h1>
            <p className="mt-2.5 font-sans text-[13px] text-ink-soft lg:mt-4 lg:text-sm">
              מדריך {guide.order} מתוך {all.length} · נבדק מול המקורות ב-{formatGuideDate(guide.checked)}
            </p>
            {guide.legalReview && (
              <p className="mt-2 inline-block border border-ink px-2 py-0.5 font-sans text-[13px] font-bold">
                טיוטה, לפני בדיקה של עורך דין
              </p>
            )}
            <div className="mt-6 text-[17px] leading-[1.7] lg:mt-8 lg:text-[19px]">
              <Blocks nodes={guide.intro} guide={guide} />
            </div>
          </header>

          <aside aria-label="המקרא והפרקים" className="mt-9 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-3">
            <div className="flex flex-col gap-8 lg:sticky lg:top-8 lg:gap-10 lg:pb-10">
              <GuideLegend className="lg:order-2" />
              <GuideToc guide={guide} className="lg:order-1" />
            </div>
          </aside>

          <article className="text-[16px] leading-[1.75] lg:col-start-1 lg:row-start-2 lg:max-w-[64ch] lg:text-[17px]">
            {guide.sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-10 scroll-mt-6 lg:mt-14">
                <h2 id={`${s.id}-title`} className="pen-rule text-[21px] leading-snug font-bold lg:text-[28px]">
                  {s.title}
                </h2>
                <div className="mt-4 lg:mt-5">
                  <Blocks nodes={s.nodes} guide={guide} />
                </div>
              </section>
            ))}
            <Sources guide={guide} />
          </article>
        </div>
        <RelatedGuides guides={related} total={all.length} />
      </main>
    </Sheet>
  );
}
