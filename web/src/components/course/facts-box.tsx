import { Fragment } from 'react';
import { courseFacts, type FactSource } from '@/lib/course/facts';
import { Claim, Mark } from './marks';

/**
 * "העובדות" (מסמך העיצוב 2026-11-17, עמוד הקורס): במקום תיבת הציון, כשלקורס עוד אין ביקורת מפורסמת.
 * אותה מסגרת דיו כמו תיבת הציון (score-box.tsx), כדי שהעמוד ייפתח באותו מקום ובאותה צורה. לא כרטיס חדש.
 * ערך ידוע בסימון המקור שלו: קו כחול, כי זו טענת המוסד, או ירוק כשנבדק (המשך, כמו ב"על הקורס").
 * ערך חסר כתוב בעט, כמו "מה לא כתוב" במקרא של דף הבית. חוסר הוא נתון שאפשר להשוות לפיו, לא חור בעמוד.
 * מיקום שבא מהמוסד ולא מהדף של הקורס (שלב 3): תווית מקור קטנה אחרי הערך, "לפי כתובת המוסד",
 * כמו "מאיפה הפרטים" בראש העמוד. לא בעט: היא מקור, לא הערה.
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
                ) : (
                  <>
                    {fact.source === 'verified' ? (
                      <Mark source="verified">{fact.text}</Mark>
                    ) : (
                      <Claim>{fact.key === 'price' ? <bdi dir="rtl">{fact.text}</bdi> : fact.text}</Claim>
                    )}
                    {fact.note && <span className="ms-2 text-[13px] text-ink-soft lg:text-sm">{fact.note}</span>}
                  </>
                )}
              </dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </section>
  );
}
