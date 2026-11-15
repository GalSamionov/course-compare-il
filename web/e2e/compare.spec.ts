import { expect, test } from '@playwright/test';

test('a shared link shows the courses side by side, with the same marks as the course page', async ({ page }) => {
  await page.goto('/compare?c=full-stack-sample,baking-sample');
  await expect(page.getByRole('columnheader', { name: /פיתוח Full Stack/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /אפייה ביתית/ })).toBeVisible();
  // מבקר בלי השוואה משלו: שורה ניטרלית, בלי "ההשוואה שלכם לא השתנתה". המקרא רק כשיש טבלה.
  await expect(page.getByText('השוואה שמישהו שלח לכם')).toBeVisible();
  await expect(page.getByText(/ההשוואה שלכם לא השתנתה/)).toHaveCount(0);
  await expect(page.getByLabel('מקרא הסימונים')).toBeVisible();

  // מה ששולם בפועל בירוק, בשני הקורסים. מה שהמוסד מבטיח בקו כחול.
  await expect(page.locator('[data-row="paid"] mark[data-source="verified"]')).toHaveCount(2);
  await expect(page.locator('[data-row="promises"] [data-source="claim"]').first()).toBeVisible();

  // להוציא בקישור משנה רק את הכתובת, והקורס מחכה בתחתית.
  await page.getByRole('button', { name: 'להוציא את אפייה ביתית: לחמים ועוגות מההשוואה' }).click();
  await expect(page).toHaveURL(/\/compare\?c=full-stack-sample$/);
  await page.getByRole('button', { name: 'להחזיר את אפייה ביתית: לחמים ועוגות להשוואה' }).click();
  await expect(page).toHaveURL(/\/compare\?c=full-stack-sample,baking-sample$/);
});

test('a link whose courses are gone says so in one line, without the legend or the link note', async ({ page }) => {
  await page.goto('/compare?c=no-such-course-sample');
  await expect(page.getByText('הקורס מהקישור כבר לא באתר.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'לכל הקורסים' })).toBeVisible();
  // אין השוואה במגש, ולכן אין קישור אליה. אין שורת "כבר לא באתר" נוספת ואין הערה בעט על הקישור.
  await expect(page.getByRole('link', { name: 'להשוואה שלכם' })).toHaveCount(0);
  await expect(page.getByText(/מהקישור כבר לא באתר/)).toHaveCount(1);
  await expect(page.getByText('השוואה שמישהו שלח לכם')).toHaveCount(0);
  await expect(page.getByLabel('מקרא הסימונים')).toHaveCount(0);
});

test('a visitor who did not log in sees the comparison from this browser, and can take a course out and back', async ({
  page,
}) => {
  await page.goto('/courses/italian-sample');
  const compareButton = page.getByRole('checkbox', { name: 'להשוואה (עד 3)' });
  // עד שהדפדפן יודע שהמבקר לא מחובר, הלחיצה לא עושה כלום. מנסים שוב עד שהקורס בפנים.
  await expect(async () => {
    await compareButton.click();
    await expect(compareButton).toBeChecked({ timeout: 1000 });
  }).toPass();
  await page.getByRole('link', { name: 'לעמוד ההשוואה' }).click();

  await expect(page).toHaveURL(/\/compare$/);
  await expect(page.getByRole('columnheader', { name: /בישול איטלקי/ })).toBeVisible();
  await expect(page.getByText(/נשארו 2 מקומות/)).toBeVisible();

  await page.getByRole('button', { name: 'להוציא את בישול איטלקי מההשוואה' }).click();
  await expect(page.getByText('עוד לא בחרתם קורסים להשוואה.')).toBeVisible();
  await page.getByRole('button', { name: 'להחזיר את בישול איטלקי להשוואה' }).click();
  await expect(page.getByRole('columnheader', { name: /בישול איטלקי/ })).toBeVisible();
});
