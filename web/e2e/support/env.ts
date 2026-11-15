import { readFileSync } from 'node:fs';

/** ערך מהסביבה, או מ-web/.env.local (הבדיקות רצות מתוך web/). לא מדפיסים אותו. */
export function localEnv(name: string): string {
  const fromEnv = process.env[name];
  if (fromEnv) return fromEnv;
  let text = '';
  try {
    text = readFileSync('.env.local', 'utf8');
  } catch {
    // אין קובץ: נכשל למטה, עם השם בלבד.
  }
  const line = text.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  const value = line?.slice(name.length + 1).trim().replace(/^"|"$/g, '');
  if (!value) throw new Error(`${name} is missing in web/.env.local`);
  return value;
}
