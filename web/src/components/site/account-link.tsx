'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginHref, useAccount } from '@/lib/account/store';
import { ACCOUNTS_OPEN } from '@/lib/site';

/**
 * הקישור האחרון בתפריט: "התחברות", ואחרי התחברות "האזור שלי".
 * הכותרת סטטית, ולכן ה-HTML מגיע עם "התחברות", והדפדפן מחליף מיד אחרי שקרא את ההתחברות.
 */
export function AccountLink({ className }: { className: string }) {
  const account = useAccount();
  const router = useRouter();
  // ההתחברות עוד לא פתוחה באתר החי (ACCOUNTS_OPEN): רק מי שכבר מחובר רואה כאן משהו.
  if (!ACCOUNTS_OPEN && account.status !== 'signed-in') return null;
  if (account.status === 'signed-in') {
    return (
      <Link href="/me" className={className}>
        <span className="pen-under">האזור שלי</span>
      </Link>
    );
  }
  return (
    <Link
      href="/login"
      className={className}
      onClick={(event) => {
        // חוזרים לעמוד הזה אחרי ההתחברות, עם התשובות שבכתובת.
        event.preventDefault();
        router.push(loginHref());
      }}
    >
      <span className="pen-under">התחברות</span>
    </Link>
  );
}
