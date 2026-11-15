import { courseTitleKey } from './url';

export interface KnownCourse {
  slug: string;
  title: string;
  institutionName: string;
}

const words = (text: string) => new Set((courseTitleKey(text) ?? '').split(' ').filter((w) => w.length >= 2));

/** אותו מוסד: אותו שם אחרי נרמול, או שכל המילים של השם הקצר נמצאות בארוך ("מכללת X לדוגמה" ו-"X לדוגמה"). */
export function sameInstitution(a: string, b: string): boolean {
  const [short, long] = [words(a), words(b)].sort((x, y) => x.size - y.size);
  return short.size > 0 && [...short].every((w) => long.has(w));
}

/**
 * קורס מהקטלוג שכנראה זה הוא: אותו שם אחרי נרמול, אצל אותו מוסד. רמז בלבד, לפני השליחה: המסד בודק שוב,
 * גם לפי הקישור (submit_course_link), ומחזיר את הקורס שכבר באתר.
 */
export function findLikelyCourse(
  input: { title: string; institutionName: string },
  courses: readonly KnownCourse[],
): KnownCourse | null {
  const title = courseTitleKey(input.title);
  if (!title || !courseTitleKey(input.institutionName)) return null;
  return (
    courses.find((c) => courseTitleKey(c.title) === title && sameInstitution(c.institutionName, input.institutionName)) ??
    null
  );
}
