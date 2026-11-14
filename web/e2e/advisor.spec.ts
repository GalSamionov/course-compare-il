import { expect, test } from '@playwright/test';

test('without an Anthropic key the advisor row is hidden, and the route answers 503', async ({ page, request }) => {
  // הנתיב בודק את המפתח לפני כל דבר אחר. גם כשיש מפתח, רשימה ריקה נעצרת ב-400 ולא מגיעה למודל.
  const probe = await request.post('/api/advise', { data: { question: 'בדיקה', courseSlugs: [] } });
  test.skip(probe.status() !== 503, 'יש ANTHROPIC_API_KEY בסביבה של השרת, ולכן השורה אמורה להופיע.');
  expect(await probe.json()).toEqual({ error: 'not_configured' });

  await page.goto('/?cat=cooking&when=evening');
  await expect(page.locator('#results h3')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'לשאול על הקורסים האלה' })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'מה לשאול?' })).toHaveCount(0);
});
