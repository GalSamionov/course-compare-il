import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'בקשו שנבדוק קורס | [שם האתר]' };

/** "בקשו שנבדוק קורס" (מסמך העיצוב, 3א.6). עד שיהיה מסד לבקשות. */
export default function RequestCoursePage() {
  return (
    <ComingSoon
      title="בקשו שנבדוק קורס"
      line="לא מצאתם את הקורס? כאן תוכלו לבקש שנוסיף אותו. אנחנו בודקים את פרטי הקורס מול אתר המוסד לפני שהוא עולה."
    />
  );
}
