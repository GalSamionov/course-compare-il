/**
 * האם מה שנכתב בשורה 1 הוא שאלה ליועץ, ולא נושא ללמוד.
 * שאלה: יש בה סימן שאלה, או שהיא פותחת במילת שאלה נפוצה. "בישול איטלקי" הוא נושא,
 * ו"איזה קורס בישול מתאים לי" היא שאלה. משותף לשרת ולדפדפן, בלי שום import.
 */

/** מילות שאלה נפוצות, כשהן המילה הראשונה. מילה שלמה בלבד: "מהנדס" לא פותח שאלה. */
export const QUESTION_WORDS: readonly string[] = [
  'איזה',
  'איזו',
  'אילו',
  'מה',
  'האם',
  'איך',
  'כמה',
  'למה',
  'מתי',
  'כדאי',
  'שווה',
  'מי',
  'היכן',
  'איפה',
];

/** המילה הראשונה: בלי ניקוד, ובלי רווחים, מירכאות או סוגריים לפניה. */
function firstWord(text: string): string {
  const plain = text.normalize('NFD').replace(/[֑-ׇ]/g, '');
  return plain.match(/[א-תa-zA-Z0-9]+/)?.[0] ?? '';
}

export function isQuestion(text: string): boolean {
  if (text.includes('?')) return true;
  return QUESTION_WORDS.includes(firstWord(text));
}
