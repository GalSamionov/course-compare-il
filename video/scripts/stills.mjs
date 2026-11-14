// פריימים בודדים לבדיקה בעין, בלי לרנדר את כל הסרטון: node scripts/stills.mjs wide 80 157 217
// התמונות נשמרות ב-out/stills.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [layout = 'wide', ...frames] = process.argv.slice(2);
const id = layout === 'wide' ? 'Walkthrough-16x9' : 'Walkthrough-9x16';
const out = join(root, 'out', 'stills');
mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: join(root, 'src', 'index.ts'), publicDir: join(root, 'public') });
const composition = await selectComposition({ serveUrl, id });
for (const f of frames.map(Number)) {
  const output = join(out, `${layout}-${String(f).padStart(4, '0')}.png`);
  await renderStill({ serveUrl, composition, frame: f, output, imageFormat: 'png' });
  console.log(output);
}
