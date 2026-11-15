/** תאריך ושעה בשעון ישראל, קצר: "15.11.2026, 3:00". כמו "נשלחה" בתור הביקורות. */
export const dateTimeLabel = (iso: string) =>
  new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(new Date(iso));

/** ספירה בעברית: "דף אחד", "3 דפים". אפס: "0 דפים", כי בדוח הריצה אפס הוא נתון. */
export const counted = (n: number, one: string, many: string) => (n === 1 ? one : `${new Intl.NumberFormat('he-IL').format(n)} ${many}`);
