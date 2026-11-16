import type { Metadata } from 'next';
import { RequestCourseForm } from '@/components/request-course/request-course-form';
import { Sheet } from '@/components/site/sheet';
import { adCheckEnabled } from '@/lib/ad-check/server';
import { SITE_NAME } from '@/lib/site';

/** בדיקת הקישור: עד 8 שניות לקריאת הדף, ועד 30 למודל (lib/ad-check). */
export const maxDuration = 60;

export const metadata: Metadata = {
  title: `בקשו שנבדוק קורס | ${SITE_NAME}`,
  description: 'ראיתם קורס במודעה או בדף נחיתה, והוא לא באתר? שולחים קישור, ואנחנו בודקים את הקורס לפני שהוא עולה.',
};

/**
 * "בקשו שנבדוק קורס" (מסמך העיצוב, 3א.6): כל אחד, בלי התחברות, שולח קישור למודעה, לדף נחיתה או לדף בפייסבוק.
 * העמוד סטטי: הטופס בדפדפן, והשליחה בפעולת שרת (actions.ts). הבקשה מגיעה לתור ב-/admin.
 * עם מפתח למודל, הטופס הוא גם בדיקת הקישור: "ראיתם מודעה? הדביקו את הקישור" (lib/ad-check).
 */
export default function RequestCoursePage() {
  return (
    <Sheet>
      <main id="main" className="pb-6">
        <RequestCourseForm checkEnabled={adCheckEnabled()} />
      </main>
    </Sheet>
  );
}
