/**
 * סיבות דחייה. הנוסח הוא מה שהכותב רואה ב"הביקורות שלי" (reviews.decision_note).
 * אף סיבה לא מגלה לכותב שהקובץ כבר הוגש בידי מישהו אחר (notes-for-plan-2.md, פרטיות): כפילות היא "other".
 */
export const REJECT_REASONS = {
  unreadable: 'לא הצלחנו לקרוא את ההוכחה.',
  other_course: 'ההוכחה לא קשורה לקורס הזה.',
  not_enough: 'ההוכחה לא מספיקה לבד.',
  name: 'השם על ההוכחה לא מתאים לשם בביקורת.',
  content: 'יש בביקורת משהו שאסור לפרסם, כמו שם של אדם פרטי או פרטי קשר.',
  other: 'לא הצלחנו לאמת את ההוכחה.',
} as const;

export type RejectReason = keyof typeof REJECT_REASONS;

export const isRejectReason = (value: string): value is RejectReason => Object.hasOwn(REJECT_REASONS, value);

/** ההודעה לכותב. הטקסט של גל מצורף אחרי הסיבה, בשורה אחת, עד 600 תווים. */
export function decisionNote(action: 'reject' | 'request_more', reason: RejectReason, note: string): string {
  const extra = note.trim().replace(/\s+/g, ' ').slice(0, 600);
  if (action === 'request_more') return `נשמח להוכחה נוספת: ${extra}`;
  return [REJECT_REASONS[reason], extra, 'אפשר להעלות הוכחה אחרת.'].filter(Boolean).join(' ');
}
