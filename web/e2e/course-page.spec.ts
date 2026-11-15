import { expect, test } from '@playwright/test';

test('course page shows the score, the legend and every section', async ({ page }) => {
  await page.goto('/courses/full-stack-sample');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1, name: 'פיתוח Full Stack' })).toBeVisible();
  await expect(page.getByTestId('score-value')).toHaveText(/^\d{1,2}\.\d$/);
  await expect(page.getByText('23 בוגרים מאומתים')).toBeVisible();
  await expect(page.getByText('את הקורס עצמו עוד לא בדקנו')).toBeVisible();
  await expect(page.getByLabel('מקרא הסימונים')).toBeVisible();
  for (const name of ['על הקורס', 'על המרצים', 'מחיר', 'מה הבוגרים אומרים', 'ביקורות']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole('heading', { level: 3, name: 'יעל כהן' })).toBeVisible();
  await expect(page.getByText('מרצה גם בקורס נוסף אחד באתר')).toBeVisible();
  await expect(page.getByText('לא מצאנו מידע ציבורי שאפשר לבדוק.')).toBeVisible();
  await expect(page.getByText('נועה ר.')).toBeVisible();
  await expect(page.getByText('פרק הענן עודכן במחזור ספטמבר.')).toBeVisible();
  await expect(page.getByText('לכל 23 הביקורות')).toBeVisible();
  await expect(page.locator('#reviews article')).toHaveCount(3);
  await expect(page.getByText('ביקורת מאומתת').first()).toBeVisible();
  await expect(page.getByText('התחלתי לעבוד כמפתחת ג׳וניור')).toBeVisible();
  // הטווח מופיע גם ב"בקצרה" ליד הציון. כאן בודקים את חלק המחיר.
  // מסבב 3: החצי האמצעי, מ-5 חשבוניות, מעוגל החוצה ל-2,000. מספר החשבוניות בקפיצות של 5.
  await expect(page.locator('#price').getByText('חצי מהבוגרים שילמו בין 12,000 ל-16,000 ₪')).toBeVisible();
  // סבב 4: "לשלוח בוואטסאפ", עם הטקסט של קישור משותף והכתובת של הקורס. בנייד רק הפעולות שבסוף העמוד גלויות.
  const whatsapp = page.getByRole('link', { name: /לשלוח בוואטסאפ/ });
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent((await whatsapp.getAttribute('href')) ?? '')).toContain('/courses/full-stack-sample');
});

test('a course with too few reviews says how many are missing', async ({ page }) => {
  await page.goto('/courses/ai-tools-sample');
  await expect(page.getByText('עוד 2 ביקורות עד לציון.')).toBeVisible();
  await expect(page.getByTestId('score-value')).toHaveCount(0);
});

test('an unknown course returns 404', async ({ page }) => {
  const response = await page.goto('/courses/no-such-course');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'הקורס לא נמצא' })).toBeVisible();
});

test('course page loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/courses/full-stack-sample');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
