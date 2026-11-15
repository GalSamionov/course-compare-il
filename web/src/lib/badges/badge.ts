import type { AuthorTitle } from '@/lib/reviews/types';

/**
 * "בוגר מאומת" ב-LinkedIn (docs/b2b/2026-11-15-go-to-market.md, מסלול 2): קישור לכרטיס, אחרי שביקורת מתפרסמת.
 * זו הכרה ולא תגמול: אין כאן ספירה של שיתופים או של צפיות.
 *
 * הקישור: /verified/<token>. הטוקן נוצר במסד (share_review_badge): 24 בתים אקראיים ב-base64url, בדיוק 32 תווים.
 * הכרטיס מראה רק את הקורס, את המוסד ו"בוגר/ת מאומת/ת". השם רק אם הכותב בחר בזה.
 */

/** בדיוק כמו הבדיקה במסד (review_badges.token). */
const TOKEN = /^[A-Za-z0-9_-]{32}$/;

export const isBadgeToken = (value: unknown): value is string => typeof value === 'string' && TOKEN.test(value);

/** הכתובת של הכרטיס באתר. */
export const BADGE_PREFIX = '/verified/';

export function badgePath(token: string): string {
  return `${BADGE_PREFIX}${token}`;
}

/** הכתובת המלאה, לשיתוף. origin: הכתובת של האתר, בלי / בסוף. */
export function badgeUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, '')}${badgePath(token)}`;
}

/**
 * הטוקן מתוך כתובת בקשה: /verified/<token> או כל מה שמתחתיו (התמונה, opengraph-image).
 * null: הכתובת לא של כרטיס, או שהטוקן לא בצורה הנכונה. ה-proxy מחזיר אז 404 בלי לשאול את המסד.
 */
export function tokenFromPath(pathname: string): string | null {
  if (!pathname.startsWith(BADGE_PREFIX)) return null;
  const token = pathname.slice(BADGE_PREFIX.length).split('/')[0];
  return isBadgeToken(token) ? token : null;
}

/** חלון השיתוף של LinkedIn. LinkedIn קורא את הכותרת והתמונה מהכתובת עצמה (og:title, og:image). */
export function linkedInShareHref(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/** הכרטיס כמו שהמסד מחזיר אותו (review_badge). */
export interface Badge {
  courseSlug: string;
  courseTitle: string;
  institutionName: string;
  /** רק אם הכותב בחר להראות את השם. */
  shownName: string | null;
  /** "בוגר" או "בוגרת", רק יחד עם השם. */
  shownTitle: AuthorTitle | null;
}

/** "בוגר/ת מאומת/ת" כשאין שם, ו"בוגרת מאומתת" או "בוגר מאומת" רק עם השם, כמו שהכותב בחר בביקורת. */
export function badgeTitle(badge: Pick<Badge, 'shownName' | 'shownTitle'>): string {
  if (badge.shownName && badge.shownTitle === 'graduate_f') return 'בוגרת מאומתת';
  if (badge.shownName && badge.shownTitle === 'graduate_m') return 'בוגר מאומת';
  return 'בוגר/ת מאומת/ת';
}

/** הכותרת של הכרטיס: "בוגר/ת מאומת/ת של <קורס>", ועם שם: "דנה כ., בוגרת מאומתת של <קורס>". */
export function badgeHeadline(badge: Pick<Badge, 'shownName' | 'shownTitle' | 'courseTitle'>): string {
  const title = `${badgeTitle(badge)} של ${badge.courseTitle}`;
  return badge.shownName ? `${badge.shownName}, ${title}` : title;
}
