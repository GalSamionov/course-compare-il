# למדתי

אתר עצמאי להשוואת קורסים בישראל. Next.js ב-`web/`, ‏Supabase ב-`supabase/`, ‏אוסף שבועי ב-`scraper/`.

- **מה המוצר:** `PRODUCT.md`.
- **איפה הפרויקט עומד:** `docs/STATUS.md`.
- **איך עובדים עם Claude:** `CLAUDE.md`.

## סביבת הפיתוח: Supabase על הרספברי פיי

Supabase לפיתוח לא רץ במחשב של גל. Docker במחשב תקע אותו, ולכן Supabase רץ בפיי (`tjr-multi-bot.local`, ברשת הביתית).

- **בפיי:**
  - Supabase "רזה": מסד, API, התחברות, אחסון ו-Mailpit, בלי Studio, Realtime, Edge Functions ו-analytics;
  - Docker פותח פורטים רק ל-127.0.0.1 של הפיי (`/etc/docker/daemon.json`), אז המסד לא חשוף לרשת.
- **במחשב:** מנהרת SSH מעבירה את `127.0.0.1:54321` (API),‏ `54322` (Postgres) ו-`54324` (Mailpit) לפיי.
  - `web/.env.local` נשאר עם `http://127.0.0.1:54321`;
  - ההגנות של "רק מסד מקומי" בסקריפטים לא השתנו;
  - בלי מנהרה, הכתובת פשוט לא עונה, ושום דבר לא מגיע לענן.

### הפעלה

מתיקיית הפרויקט:

```bash
pnpm db:start
```

מפעיל את Supabase בפיי, ופותח את המנהרה ברקע. מספיק פעם אחת, כל עוד הפיי דלוק.

```bash
pnpm db:tunnel
```

רק המנהרה, למשל אחרי אתחול של המחשב. `pnpm db tunnel status` בודק אותה, ו-`pnpm db tunnel stop` סוגר.

### הפקודות

| פקודה | מה היא עושה |
|---|---|
| `pnpm db:reset` | מאפס את המסד בפיי מהמיגרציות וה-seed של הענף הנוכחי |
| `pnpm db:test` | בדיקות pgTAP (`supabase/tests`), רצות בפיי |
| `pnpm db:migrate` | מיגרציות חדשות בלי איפוס (`supabase migration up`) |
| `pnpm db:types` | מייצר מחדש את `web/src/lib/database.types.ts` |
| `pnpm db:status` | מצב השירותים בפיי |
| `pnpm db:stop` | עוצר את Supabase בפיי ואת המנהרה. הנתונים נשמרים |
| `pnpm db <פקודה>` | כל פקודה אחרת של `supabase`, בפיי |

- **מה כל פקודה עושה:** מעתיקה לפיי את התיקייה `supabase/` מהתיקייה הנוכחית, ומריצה שם את ה-CLI.
  - לכן היא תמיד רצה עם המיגרציות של הענף שעליו עובדים.
  - יש נעילה, אז שני סשנים לא מאפסים בבת אחת. אבל המסד אחד ומשותף: איפוס בסשן אחד מוחק גם מה שסשן אחר הכניס.
- **בדיקות היחידה והקצה** רצות במחשב כרגיל (`pnpm --dir web test`, `pnpm --dir web e2e`), וצריכות מנהרה פתוחה.
  - **אחרי `pnpm db:reset`,** לפני בדיקות הקצה, מריצים `pnpm --dir web score:recompute`, כמו ב-CI. אחרת אין ציונים, וחמש בדיקות נכשלות.

### כשמשהו לא עובד

- **"could not reach the Pi":** הפיי כבוי, או שהמחשב לא ברשת הביתית.
  - בודקים: `ssh -i ~/.ssh/id_ed25519_pi gsamionov@tjr-multi-bot.local`.
- **"the API does not answer":** Supabase בפיי לא רץ. מריצים `pnpm db:start`.
- **"another db command is still running on the Pi":** סשן אחר באמצע איפוס או בדיקות. מחכים ומנסים שוב.
- **מחוץ לבית:** מתחברים מרחוק למחשב שבבית, והוא מגיע לפיי. חיבור ישיר מהנייד דורש Tailscale מחובר בפיי ובנייד.

### חזרה ל-Docker מקומי

רק אם הפיי לא זמין ואין ברירה. Docker במחשב של גל תקע אותו בעבר.

1. מפעילים את Docker Desktop.
2. מריצים את אותן פקודות עם `LAMADTI_DB=docker`.

   **PowerShell:**

   ```powershell
   $env:LAMADTI_DB = 'docker'; pnpm db:start
   ```

   **bash:**

   ```bash
   LAMADTI_DB=docker pnpm db:start
   ```

   במצב הזה `pnpm db:*` מריצות את `supabase` מקומית, כמו קודם, עם כל השירותים. ב-CI זה קורה אוטומטית (`CI=true`).
3. **בסוף:** `pnpm db:stop` עם אותו משתנה, ואז סוגרים את Docker Desktop.

### הגדרות

- **משתני סביבה אפשריים:**
  - `LAMADTI_PI_HOST`: ברירת מחדל `gsamionov@tjr-multi-bot.local`;
  - `LAMADTI_PI_KEY`: ברירת מחדל `~/.ssh/id_ed25519_pi`.
- **הקוד:** `scripts/pi-db.mjs`.
- **בפיי:**
  - ה-CLI ב-`~/.local/bin/supabase`, בגרסה 3.1.0, כמו ב-`package.json`;
  - התיקייה המועתקת ב-`~/lamadti-dev`.
