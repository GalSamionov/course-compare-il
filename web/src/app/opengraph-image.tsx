import { OG_SIZE, renderSiteCard } from './_og/card';

/** תמונת השיתוף של האתר: דף הבית, עמודי התחומים וכל עמוד בלי תמונה משלו. */
export const alt =
  'דף מודפס על שולחן: לא יודעים למי לפנות? נראה לכם את האפשרויות זו לצד זו, מה כל אחד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים. אף מוכר לא משלם לנו.';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return renderSiteCard();
}
