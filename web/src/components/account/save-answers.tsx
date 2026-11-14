'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PenNote } from '@/components/course/marks';
import { loginHref, rememberForLogin, saveAnswers, useAccount } from '@/lib/account/store';
import { parseQuery, serializeQuery } from '@/lib/search/query';
import type { SearchQuery } from '@/lib/search/types';

const textButton =
  'inline-flex min-h-11 items-center font-sans text-[15px] font-semibold underline underline-offset-[3px] hover:text-link-hover';

/**
 * "לשמור את התשובות" מתחת לכפתור של דף הבית. התשובות נשמרות באותה צורה כמו בכתובת,
 * ו"התשובות שלי" באזור האישי קוראות אותן עם parseQuery.
 */
export function SaveAnswers({ query }: { query: SearchQuery }) {
  const account = useAccount();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const search = serializeQuery(query);
  // השוואה דרך parseQuery: המסד לא שומר את סדר המפתחות.
  const saved =
    account.status === 'signed-in' &&
    account.answers !== null &&
    serializeQuery(parseQuery(new URLSearchParams(account.answers.params))) === search;

  if (saved) {
    return (
      <PenNote arrow className="mt-2.5">
        התשובות נשמרו.{' '}
        <Link href="/me#answers" className="underline underline-offset-[3px]">
          לאזור שלי
        </Link>
      </PenNote>
    );
  }

  async function onClick() {
    const params = Object.fromEntries(new URLSearchParams(search));
    if (account.status === 'signed-out') {
      rememberForLogin({ answers: params });
      router.push(loginHref());
      return;
    }
    if (account.status !== 'signed-in') return;
    setBusy(true);
    const result = await saveAnswers(params);
    setBusy(false);
    setFailed(result !== 'ok');
  }

  return (
    <p className="mt-1.5">
      <button type="button" disabled={busy} onClick={() => void onClick()} className={textButton}>
        לשמור את התשובות באזור שלי
      </button>
      {failed && (
        <span role="status" className="ms-2 font-sans text-[13px] text-ink-soft">
          לא הצלחנו לשמור. נסו שוב.
        </span>
      )}
    </p>
  );
}
