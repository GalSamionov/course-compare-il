/**
 * כותב את src/lib/guides/cards.json מהמדריכים ב-content/guides: הנתונים של תמונות השיתוף.
 * מריצים אחרי שינוי בכותרת, בתיאור או במספר העובדות של מדריך: pnpm guides:cards
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { guideCards } from '../src/lib/guides/cards';

const file = join(process.cwd(), 'src/lib/guides/cards.json');
writeFileSync(file, `${JSON.stringify(guideCards(), null, 2)}\n`);
console.log(`נכתב: ${file}`);
