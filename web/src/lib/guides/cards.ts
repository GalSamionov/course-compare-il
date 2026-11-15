import { getGuides } from './guides';

/**
 * מה שתמונת השיתוף של מדריך צריכה: כותרת, תיאור, המקום בסדרה, וכמה עובדות נבדקו מול מסמך.
 * נשמר ב-cards.json שבאותה תיקייה, ותמונת השיתוף קוראת משם ולא מ-content/guides:
 * התוכן נמצא מחוץ ל-web ולא נארז עם הפונקציה בשרת, ותמונה שנבנית בבקשה לא הייתה מוצאת אותו.
 * אחרי שינוי בכותרת, בתיאור או במספר העובדות: pnpm guides:cards. בדיקת היחידה נכשלת עד שמריצים.
 */
export interface GuideCard {
  slug: string;
  title: string;
  description: string;
  order: number;
  total: number;
  verifiedCount: number;
}

export function guideCards(): GuideCard[] {
  const guides = getGuides();
  return guides.map((g) => ({
    slug: g.slug,
    title: g.title,
    description: g.description,
    order: g.order,
    total: guides.length,
    verifiedCount: g.refs.length,
  }));
}
