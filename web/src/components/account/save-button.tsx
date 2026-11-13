'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChoiceChip } from '@/components/notebook/choice-chip';
import { loginHref, rememberForLogin, toggleSaved, useAccount } from '@/lib/account/store';

/**
 * "לשמור": כפתור עם ריבוע ווי בעט, כמו "להשוואה" בציור של האזור האישי (Me.dc.html).
 * מבקר שלא התחבר עובר להתחברות, והקורס נשמר מיד כשהוא חוזר.
 */
export function SaveButton({ courseId, title }: { courseId: string; title: string }) {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const saved = account.status === 'signed-in' && account.saved.includes(courseId);

  async function onClick() {
    if (account.status === 'signed-out') {
      rememberForLogin({ save: courseId });
      router.push(loginHref());
      return;
    }
    if (account.status !== 'signed-in') return;
    setBusy(true);
    const result = await toggleSaved(courseId);
    setBusy(false);
    setFailed(result !== 'ok');
  }

  return (
    <>
      <ChoiceChip checked={saved} disabled={busy} onClick={() => void onClick()}>
        לשמור<span className="sr-only"> את {title}</span>
      </ChoiceChip>
      {failed && (
        <span role="status" className="font-sans text-[13px] text-ink-soft">
          לא הצלחנו לשמור. נסו שוב.
        </span>
      )}
    </>
  );
}
