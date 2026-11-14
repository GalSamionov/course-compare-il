import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // כל הבדיקות רצות כמבקר שכבר ראה את ההיכרות, כדי שהכרטיס לא יכסה כפתורים. intro.spec.ts בודקת אותו עם דפדפן נקי.
  use: { baseURL: 'http://localhost:3000', storageState: 'e2e/intro-seen.json' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    // בנייה מלאה ולא dev, כי ההתנהגות של המטמון וסטטוס ה-404 נראים רק בבנייה לייצור.
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
