'use client';

import { PenArrow } from '@/components/site/pen';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { TickMark } from '@/components/notebook/tick';
import { buttonVariants } from '@/components/ui/button';
import { CALLBACK_PATH, NEXT_COOKIE, safeNextPath } from '@/lib/account/next-path';
import { useAccount } from '@/lib/account/store';
import { createBrowserSupabase } from '@/lib/supabase/browser-client';
import { cn } from '@/lib/utils';

/** "פעם בדקה" בציור. גם Supabase בענן לא שולח קישור נוסף לאותו מייל לפני שעברה דקה. */
const RESEND_SECONDS = 60;

/** "0:42", ובהתחלה "1:00". */
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const REASONS = [
  'לשמור קורסים ולחזור אליהם',
  'לשמור את ההשוואה שלכם, עד 3 קורסים',
  'לשמור את התשובות מדף הבית',
  'לכתוב ביקורת על קורס שסיימתם',
];

const marginLabel = 'font-sans text-[13px] leading-tight text-ink-soft lg:text-[15px]';
/** הערה של האתר בשוליים: עט כחול, עם חץ (מסמך העיצוב, סעיף 8). */
const marginNote = ' pe-1.5 font-pen text-sm leading-snug font-medium text-pen lg:text-base';
const smallLink = 'inline-flex min-h-11 items-center underline underline-offset-[3px] hover:text-link-hover';

type SendError = 'rate' | 'not-allowed' | 'failed';

const SEND_ERROR_TEXT: Record<SendError, string> = {
  rate: 'שלחנו כבר כמה קישורים בשעה האחרונה. נסו שוב בעוד כמה דקות.',
  'not-allowed': 'עד ההשקה אפשר להתחבר רק עם המיילים של צוות האתר.',
  failed: 'לא הצלחנו לשלוח את הקישור. נסו שוב בעוד דקה.',
};

function sendErrorOf(error: { code?: string; status?: number }): SendError {
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') return 'rate';
  if (error.code === 'email_address_not_authorized') return 'not-allowed';
  return 'failed';
}

/** מה שבכתובת: לאן לחזור, והאם הקישור מהמייל לא עבד. בתוך <Suspense>, כמו המחברת. */
export function LoginFromUrl() {
  const params = useSearchParams();
  return <LoginForm next={safeNextPath(params.get('next'))} linkFailed={params.get('error') === 'link'} />;
}

/**
 * ההתחברות בקישור למייל, לפי הציור (Login.dc.html): הטופס, ואחרי השליחה "עכשיו לתיבת המייל"
 * באותו עמוד, עם המייל בעט ווי. Google לא בסבב הזה.
 */
export function LoginForm({ next, linkFailed }: { next: string; linkFailed: boolean }) {
  const account = useAccount();
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<SendError | null>(null);

  // מי שכבר מחובר לא צריך את העמוד הזה.
  useEffect(() => {
    if (account.status === 'signed-in') router.replace(next);
  }, [account.status, next, router]);

  // השעון של "לשלוח שוב בעוד".
  useEffect(() => {
    if (sentAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [sentAt]);

  const waitSeconds = sentAt === null ? 0 : Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000));

  async function send() {
    if (sending) return;
    setSending(true);
    setError(null);
    // לאן לחזור: בעוגייה לנתיב ההתחברות בלבד, לשעה, כמו תוקף הקישור.
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(next)}; Path=${CALLBACK_PATH}; Max-Age=3600; SameSite=Lax${secure}`;
    const { error: sendError } = await createBrowserSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${CALLBACK_PATH}`, shouldCreateUser: true },
    });
    setSending(false);
    if (sendError) {
      setError(sendErrorOf(sendError));
      return;
    }
    setSentAt(Date.now());
    setNow(Date.now());
    // הכותרת מתחלפת. מעבירים אליה את הפוקוס, כדי שקורא מסך יקרא את המצב החדש.
    requestAnimationFrame(() => heading.current?.focus());
  }

  const sent = sentAt !== null;

  return (
    <>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mt-[22px] text-[30px] leading-tight font-bold text-balance outline-none lg:mt-12 lg:text-[54px] lg:font-extrabold"
      >
        {sent ? 'עכשיו לתיבת המייל' : 'להתחבר בלי סיסמה'}
      </h1>
      <p className="mt-2 font-sans text-[15px] leading-normal text-ink-soft lg:mt-3 lg:text-lg">
        {sent
          ? 'שלחנו קישור כניסה. לוחצים עליו, וחוזרים לעמוד שבו הייתם, מחוברים.'
          : 'שולחים לכם קישור למייל. לוחצים עליו, ואתם בפנים.'}
      </p>
      {linkFailed && !sent && (
        <p role="alert" className="mt-3 font-sans text-[15px] leading-normal font-bold">
          הקישור לא עבד. אולי עברה שעה, אולי כבר השתמשו בו, או שנפתח בדפדפן אחר. אפשר לבקש קישור חדש.
        </p>
      )}

      {/* במחשב שני עמודים: מימין למה להתחבר (או מה נשלח), משמאל הטופס. לכל אחד קו שוליים משלו. */}
      <div className="mt-[18px] lg:mt-12 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-20">
        {sent ? (
          <>
            <div className="margin-rule">
            <div
              role="status"
              className="ruled-top ruled-row grid min-h-16 grid-cols-[var(--margin)_minmax(0,1fr)_44px] items-center"
            >
              <span className={marginLabel}>לאן לשלוח?</span>
              <p className="min-w-0 self-stretch pt-5 ps-3 pb-1 text-lg leading-normal">
                {/* מייל ארוך נשבר לשורה שנייה, ולא נכנס לעמודת הווי. */}
                <span
                  dir="ltr"
                  className="inline-block max-w-full font-pen text-xl font-medium [overflow-wrap:anywhere] text-pen"
                >
                  {email.trim()}
                </span>
              </p>
              <span className="justify-self-center">
                <TickMark className="size-[30px]" />
                <span className="sr-only">נשלח</span>
              </span>
            </div>
            <div className="grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start pt-3">
              <p className={cn(marginNote, 'pt-0.5')}>
                <PenArrow />נשלח עכשיו
              </p>
              <div className="ps-3 font-sans text-[15px] leading-normal">
                <p className="font-bold">לא מוצאים אותו?</p>
                {/* המייל עדיין יוצא מהשולח של Supabase עם הנושא באנגלית. כשיהיה שירות מייל אמיתי (סבב ההשקה), הנושא יישא את שם האתר. */}
                <p className="mt-1">
                  חפשו מייל עם הנושא ״<bdi dir="ltr">Your Magic Link</bdi>״ (בפעם הראשונה ״
                  <bdi dir="ltr">Confirm Your Signup</bdi>״), ובדקו גם בספאם.
                </p>
                <p className="mt-1.5">פותחים את הקישור באותו טלפון ובאותו דפדפן שבהם ביקשתם אותו.</p>
                <p className="mt-1.5">הקישור תקף לשעה, ועובד פעם אחת.</p>
              </div>
            </div>
            </div>
            <div className="margin-rule lg:[--bleed:0px]">
            <div className="mt-[18px] grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center lg:mt-0">
              <p className={marginNote}>
                <PenArrow />פעם בדקה
              </p>
              <div className="ps-3">
                <button
                  type="button"
                  disabled={waitSeconds > 0 || sending}
                  onClick={() => void send()}
                  className={cn(
                    'block h-[50px] w-full rounded-[4px] border-[1.5px] bg-white font-sans text-base font-bold tabular-nums',
                    waitSeconds > 0 ? 'cursor-not-allowed border-line text-ink-soft' : 'border-ink text-ink',
                  )}
                >
                  {waitSeconds > 0 ? `לשלוח שוב בעוד ${clock(waitSeconds)}` : 'לשלוח שוב'}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="ms-(--margin) mt-2 ps-3 font-sans text-[15px] font-bold">
                {SEND_ERROR_TEXT[error]}
              </p>
            )}
            <div className="ms-(--margin) mt-1.5 ps-3 font-sans text-[15px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSentAt(null);
                  setError(null);
                }}
                className={smallLink}
              >
                טעיתי במייל
              </button>
            </div>
            </div>
          </>
        ) : (
          <>
            <div className="margin-rule">
            <ul className="ruled-top">
              {REASONS.map((reason, i) => (
                <li
                  key={reason}
                  className="ruled-row grid grid-cols-[var(--margin)_minmax(0,1fr)] items-start"
                >
                  <span className={cn(marginLabel, 'pt-3')}>{i === 0 ? 'למה להתחבר?' : ''}</span>
                  <p className="pt-2.5 ps-3 pb-[7px] text-base leading-normal lg:pt-3.5 lg:pb-2 lg:text-lg">{reason}</p>
                </li>
              ))}
            </ul>
            </div>
            <div className="margin-rule lg:[--bleed:0px]">
            <form
              aria-label="כניסה עם קישור במייל"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <div className="ruled-row grid min-h-16 grid-cols-[var(--margin)_minmax(0,1fr)] items-center after:h-0.5 after:bg-ink lg:min-h-[72px]">
                <label htmlFor="email" className={marginLabel}>
                  לאן לשלוח?
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  dir="ltr"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="send"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={cn(
                    'min-w-0 self-stretch bg-transparent pt-5 pr-3 pb-1 pl-1 text-right outline-none',
                    'font-pen text-xl font-medium text-pen caret-pen lg:text-[23px]',
                    'placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:text-ink-soft',
                  )}
                />
              </div>
              <p className="ms-(--margin) mt-3 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
                אין סיסמה לזכור. אם עוד אין לכם חשבון, הקישור פותח אחד.
              </p>
              {error && (
                <p role="alert" className="ms-(--margin) mt-2 ps-3 font-sans text-[15px] font-bold">
                  {SEND_ERROR_TEXT[error]}
                </p>
              )}
              <div className="mt-3.5 grid grid-cols-[var(--margin)_minmax(0,1fr)] items-center">
                <p className={marginNote}>
                  <PenArrow />תקף לשעה
                </p>
                <div className="ps-3">
                  <button
                    type="submit"
                    disabled={sending}
                    className={cn(buttonVariants(), 'h-[50px] w-full font-sans text-base font-bold')}
                  >
                    לשלוח לי קישור
                  </button>
                </div>
              </div>
            </form>
            <div className="ms-(--margin) mt-4 ps-3 font-sans text-[13px] leading-normal text-ink-soft">
              <p className="text-pretty">שומרים אצלנו רק שלושה דברים: המייל, הקורסים ששמרתם והתשובות שלכם.</p>
              <Link href="/privacy" className={smallLink}>
                מדיניות הפרטיות
              </Link>
            </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
