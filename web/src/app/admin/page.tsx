import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { DecisionLog } from '@/components/admin/decision-log';
import { QueueItemView } from '@/components/admin/queue-item';
import { Sheet } from '@/components/site/sheet';
import { adminGate } from '@/lib/admin/gate';
import { loadQueue } from '@/lib/admin/queue';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: `תור האימות | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/**
 * הכול בבקשה: העמוד קורא את ההתחברות, ולכן אין לו מעטפת סטטית (instant.md, "Disabling instant").
 * ה-proxy כבר החזיר 404 לכל מי שאינו מנהל. כאן בודקים שוב, ומי שאינו מנהל מקבל את עמוד ה-404.
 * גם הכותרת בתוך Suspense: מי שאינו מנהל לא רואה שום דבר מהעמוד, אפילו אם ה-proxy לא רץ.
 */
export const instant = false;

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminQueue />
    </Suspense>
  );
}

function countLine(count: number): string {
  if (count === 0) return 'אין ביקורות שמחכות לבדיקה. ביקורת חדשה מופיעה כאן כשבוגר שולח אותה עם הוכחה.';
  if (count === 1) return 'ביקורת אחת מחכה. היעד: תשובה תוך 48 שעות.';
  return `${count} ביקורות מחכות, הישנה ראשונה. היעד: תשובה תוך 48 שעות.`;
}

async function AdminQueue() {
  // הכול בבקשה, לפני שנוגעים בשעון: getUser של Supabase בודק תפוגה עם Date.now(), והתור מחשב כמה זמן כל
  // ביקורת מחכה (08-caching.md, "Random values and timestamps").
  await connection();
  const gate = await adminGate({ readOnly: true });
  if (gate.kind === 'not-admin') notFound();
  const items = gate.kind === 'ok' ? await loadQueue(gate.db) : [];
  return (
    <Sheet>
      <main className="pb-10 lg:pb-14">
        <h1 className="mt-[22px] text-[30px] leading-tight font-bold lg:mt-12 lg:text-[48px]">
          תור האימות
        </h1>
        {gate.kind === 'no-key' ? (
          <div role="alert" className="mt-4 max-w-[60ch] space-y-2 font-sans text-[15px] leading-normal">
            <p className="font-bold">חסר SUPABASE_SECRET_KEY בשרת. בלעדיו אי אפשר לפתוח הוכחות או להחליט.</p>
            <p>אחרי שמוסיפים אותו ב-Vercel, צריך לפרוס מחדש. עד אז שום ביקורת לא מתפרסמת ושום קובץ לא נמחק.</p>
          </div>
        ) : (
          <>
            <p className="mt-2 font-sans text-[15px] leading-normal text-ink-soft lg:mt-3">{countLine(items.length)}</p>
            <DecisionLog>
              <div className="mt-6">
                {items.map((item) => (
                  <QueueItemView key={item.reviewId} item={item} />
                ))}
              </div>
            </DecisionLog>
          </>
        )}
      </main>
    </Sheet>
  );
}
