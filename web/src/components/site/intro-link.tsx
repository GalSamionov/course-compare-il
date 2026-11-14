'use client';

import { openIntro } from '@/lib/intro';

/** "איך משתמשים בלמדתי" בכותרת התחתונה: פותח שוב את ההיכרות למבקר ראשון, עם הסרטון. */
export function IntroLink({ className }: { className: string }) {
  return (
    <button type="button" onClick={openIntro} className={className}>
      איך משתמשים בלמדתי
    </button>
  );
}
