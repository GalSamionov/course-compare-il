import type { Metadata } from 'next';
import { MeArea } from '@/components/account/me-area';
import { Sheet } from '@/components/site/sheet';
import { getCatalog } from '@/lib/data/catalog';
import { SITE_NAME } from '@/lib/site';

/**
 * העמוד סטטי, עם הקטלוג מהמטמון. מה ששמרתם נטען בדפדפן, עם ההרשאות שלכם במסד,
 * ולכן אף פעם לא נשמר במטמון בשרת. מי שלא מחובר עובר להתחברות.
 */
export const ensureStatic = 'navigation';

export const metadata: Metadata = { title: `האזור שלי | ${SITE_NAME}` };

export default async function MePage() {
  const catalog = await getCatalog();
  return (
    <Sheet>
      <main>
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold lg:mt-12 lg:text-[54px] lg:font-extrabold">האזור שלי</h1>
        <p className="mt-2 font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
          מה ששמרתם, ההשוואה והתשובות שלכם. רק אתם רואים את העמוד הזה.
        </p>
        <MeArea catalog={catalog} />
      </main>
    </Sheet>
  );
}
