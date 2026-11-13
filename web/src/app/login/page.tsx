import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm, LoginFromUrl } from '@/components/account/login-form';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';

/** העמוד סטטי. לאן לחזור (next) נקרא בדפדפן, בתוך <Suspense>, כמו התשובות בדף הבית. */
export const ensureStatic = 'navigation';

export const metadata: Metadata = {
  title: 'התחברות | [שם האתר]',
  description: 'התחברות בקישור למייל, בלי סיסמה. כדי לשמור קורסים, השוואה ותשובות.',
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-[680px] px-[22px]">
      <SiteHeader />
      {/* בלי ריווח תחתון: בציור הכותרת התחתונה 26 פיקסלים מתחת לטופס, ו-SiteFooter כבר מוסיף 32. */}
      <main>
        <Suspense fallback={<LoginForm next="/" linkFailed={false} />}>
          <LoginFromUrl />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
