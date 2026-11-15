import { textLink } from './controls';

/** הכתובת בלי https:// ו-www, לקריאה. */
export const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '');

/**
 * קישור לדף באתר של מוסד: בלשונית חדשה, בלי referrer ובלי nofollow לחיפוש. גל רואה את הכתובת לפני שהוא לוחץ,
 * כי היא מגיעה מהאוסף או מטופס ציבורי. href תמיד http(s): המסד בודק את זה (scrape_pages, institution_requests).
 */
export function PageLink({ url }: { url: string }) {
  // גם אם משהו עקף את הבדיקה במסד: כתובת שאינה http(s) מוצגת כטקסט, ולא כקישור.
  if (!/^https?:\/\//i.test(url)) return <bdi dir="ltr">{url}</bdi>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className={`${textLink} max-w-full`}>
      <bdi dir="ltr" className="truncate">
        {shortUrl(url)}
      </bdi>
      <span className="sr-only"> (בלשונית חדשה)</span>
    </a>
  );
}
