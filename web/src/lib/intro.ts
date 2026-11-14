/** ההיכרות למבקר ראשון (components/site/first-visit.tsx): המפתח בדפדפן, והאירוע שפותח אותה שוב. */
export const INTRO_SEEN_KEY = 'lamadti:intro-seen';
export const INTRO_OPEN_EVENT = 'lamadti:open-intro';

/** עמודים שבהם ההיכרות לא נפתחת לבד: התחברות, האזור האישי וכתיבת ביקורת. */
export function introAllowedOn(pathname: string) {
  return !/^\/(login|me)(\/|$)/.test(pathname) && !/\/review(\/|$)/.test(pathname);
}

/** סרטון ההדרכה (video/ במאגר): 9:16 לטלפון ו-16:9 למחשב, באורך 47 שניות. */
export const WALKTHROUGH = {
  wide: { src: '/video/lamadti-walkthrough-16x9.mp4', poster: '/video/lamadti-walkthrough-16x9.jpg' },
  tall: { src: '/video/lamadti-walkthrough-9x16.mp4', poster: '/video/lamadti-walkthrough-9x16.jpg' },
  seconds: 47,
} as const;

export function hasSeenIntro() {
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // בלי אחסון (גלישה פרטית חסומה): ההיכרות תופיע שוב בטעינה הבאה, וזה בסדר.
  }
}

export function openIntro() {
  window.dispatchEvent(new Event(INTRO_OPEN_EVENT));
}
