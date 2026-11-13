'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginHref, useAccount } from '@/lib/account/store';

/**
 * הקישור האחרון בתפריט: "התחברות", ואחרי התחברות "האזור שלי".
 * הכותרת סטטית, ולכן ה-HTML מגיע עם "התחברות", והדפדפן מחליף מיד אחרי שקרא את ההתחברות.
 */
export function AccountLink({ className }: { className: string }) {
  const account = useAccount();
  const router = useRouter();
  if (account.status === 'signed-in') {
    return (
      <Link href="/me" className={className}>
        האזור שלי
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
      התחברות
    </Link>
  );
}
