/**
 * הפתיחה של דף הבית (מסמך העיצוב 2026-11-17): "לא יודעים למי לפנות?" ומשפט אחד, והתיבה מיד אחריהם (notebook.tsx).
 * "איך האימות עובד" ירד. במקומו "מה רואים כאן", אחרי הרשימה (what-you-see.tsx).
 * הסיכום לדוגמה כבר לא כאן: גם במחשב הוא דחף את התיבה אל מתחת למסך הראשון (1280 על 900, כשיש קורס עם ציון).
 * הוא עבר ליד "מה רואים כאן", אחרי הרשימה (app/page.tsx). המהות של הדף היא התיבה.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="promise" className="pt-6 lg:max-w-[880px] lg:pt-11">
      <h1
        id="promise"
        className="text-[33px] leading-[1.14] font-bold tracking-[-0.01em] text-balance lg:text-[54px] lg:leading-[1.08]"
      >
        לא יודעים למי לפנות? כתבו מה אתם צריכים.
      </h1>
      <p className="mt-4 max-w-[52ch] font-sans text-[17px] leading-normal text-pretty lg:mt-6 lg:text-xl">
        נראה לכם את האפשרויות זו לצד זו, מה כל אחד מפרסם ומה הוא לא כותב, ומה לשאול לפני שמשלמים.
        <strong className="font-bold"> אף מוכר לא משלם לנו.</strong>
      </p>
    </section>
  );
}
