import type { Metadata } from 'next';
import { MeArea } from '@/components/account/me-area';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { getCatalog } from '@/lib/data/catalog';

/**
 * העמוד סטטי, עם הקטלוג מהמטמון. מה ששמרתם נטען בדפדפן, עם ההרשאות שלכם במסד,
 * ולכן אף פעם לא נשמר במטמון בשרת. מי שלא מחובר עובר להתחברות.
 */
export const ensureStatic = 'navigation';

export const metadata: Metadata = { title: 'האזור שלי | [שם האתר]' };

export default async function MePage() {
  const catalog = await getCatalog();
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      <main>
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold">האזור שלי</h1>
        <p className="mt-2 font-sans text-[15px] leading-normal text-ink-soft">
          מה ששמרתם, ההשוואה והתשובות שלכם. רק אתם רואים את העמוד הזה.
        </p>
        <MeArea catalog={catalog} />
      </main>
      <SiteFooter />
    </div>
  );
}
