import { textLink } from './controls';

/**
 * הכתובת בלי https:// ו-www, לקריאה. נתיב בעברית מפוענח, ולא %d7%a1%d7%93.
 * רק לתצוגה: הקישור עצמו נשאר כמו שהוא. קידוד שבור: הכתובת כמו שהיא.
 */
export const shortUrl = (url: string) => {
  const short = url.replace(/^https?:\/\/(www\.)?/, '');
  try {
    return decodeURI(short);
  } catch {
    return short;
  }
};

/**
 * קישור לדף באתר של מוסד: בלשונית חדשה, בלי referrer ובלי nofollow לחיפוש. גל רואה את הכתובת לפני שהוא לוחץ,
 * כי היא מגיעה מהאוסף או מטופס ציבורי. href תמיד http(s): המסד בודק את זה (scrape_pages, institution_requests).
 * className: למשל min-w-0, כשהקישור בשורה אחת עם עוד טקסט ונקטע בסוף.
 */
export function PageLink({ url, className }: { url: string; className?: string }) {
  // גם אם משהו עקף את הבדיקה במסד: כתובת שאינה http(s) מוצגת כטקסט, ולא כקישור.
  if (!/^https?:\/\//i.test(url)) return <bdi dir="ltr">{url}</bdi>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className={`${textLink} max-w-full ${className ?? ''}`}>
      <bdi dir="ltr" className="truncate">
        {shortUrl(url)}
      </bdi>
      <span className="sr-only"> (בלשונית חדשה)</span>
    </a>
  );
}
