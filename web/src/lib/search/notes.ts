import type { MatchResult } from './match';

export interface MarginNotes {
  /** הערה שנכונה לכמה שורות ברצף מראש הרשימה, ונכתבת פעם אחת מעל הרשימה. */
  shared: string | null;
  /** לכמה שורות מראש הרשימה ההערה המשותפת נכונה. */
  sharedCount: number;
  /** ההערה בשוליים של כל שורה, באותו סדר. ריקה כשאין מה להוסיף. */
  notes: string[];
}

/**
 * הערות העט בשוליים צריכות לומר משהו. כשכל הקורסים המתאימים מקבלים אותה הערה,
 * היא נכתבת פעם אחת מעל הרשימה, ובשוליים נשארות רק ההערות ששונות משורה לשורה.
 * כשאין אף הערה והרשימה כוללת כמה תחומים, השוליים אומרים את התחום של כל קורס.
 */
export function marginNotes(results: readonly MatchResult[]): MarginNotes {
  const notes = results.map((r) => r.note);
  const full = results.filter((r) => r.full);
  const first = full[0]?.note ?? '';
  // הקורסים המתאימים במלואם באים ראשונים ברשימה (matchCourses), ולכן הם רצף מראש הרשימה.
  if (full.length >= 2 && first !== '' && full.every((r) => r.note === first)) {
    return {
      shared: first,
      sharedCount: full.length,
      notes: results.map((r) => (r.full ? '' : r.note)),
    };
  }
  if (notes.every((n) => n === '') && new Set(results.map((r) => r.course.categorySlug)).size > 1) {
    return { shared: null, sharedCount: 0, notes: results.map((r) => r.course.categoryName) };
  }
  return { shared: null, sharedCount: 0, notes };
}
