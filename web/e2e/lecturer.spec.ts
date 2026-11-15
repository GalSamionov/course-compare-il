import { expect, test } from '@playwright/test';

test('the lecturer page shows what the institution says, what we checked, and the courses, with no score for the lecturer', async ({
  page,
}) => {
  // מהשם ב"על המרצים" בעמוד הקורס.
  await page.goto('/courses/full-stack-sample');
  await page.getByRole('link', { name: 'יעל כהן' }).click();
  await expect(page).toHaveURL(/\/lecturers\/yael-cohen-sample$/);

  await expect(page.getByRole('heading', { level: 1, name: 'יעל כהן' })).toBeVisible();
  await expect(page.getByText('אין כאן ציון למרצה. המרצים מתחלפים בין מחזורים, ולכל קורס יש ציון משלו.')).toBeVisible();
  // בתוך "מה ידוע": עמוד הקורס שממנו הגענו נשאר מוסתר ב-DOM אחרי הניווט (Next שומר אותו לחזרה), ושם אותה טענה.
  await expect(page.locator('#about [data-source="claim"]', { hasText: 'מפתחת בכירה עם 10 שנות ניסיון בתעשייה' })).toBeVisible();
  await expect(page.getByRole('link', { name: /בנתה ומתחזקת ספריית קוד פתוח/ })).toHaveAttribute(
    'href',
    'https://example.com/open-source-sample',
  );

  await expect(page.locator('#courses h3')).toHaveText(['פיתוח Full Stack', 'כלי AI לעבודה יומיומית']);
  await expect(page.getByText('התפקיד בקורס: מרצה ראשית, מלמדת 4 מתוך 7 הפרקים')).toBeVisible();
  await expect(page.locator('#courses').getByText(/יעל מסבירה מצוין/)).toBeVisible();
});

test('an unknown lecturer returns 404', async ({ page }) => {
  const response = await page.goto('/lecturers/no-such-lecturer');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'לא מצאנו את המרצה' })).toBeVisible();
});
