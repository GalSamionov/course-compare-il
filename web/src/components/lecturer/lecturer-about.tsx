import { Claim, Mark } from '@/components/course/marks';
import type { LecturerPageData } from '@/lib/data/lecturer-page';

/**
 * מה המוסד אומר (קו כחול, טענה שלא בדקנו), ומה בדקנו בעצמנו (מרקר ירוק, עם קישור למקור).
 * אותו ניסוח ואותם סימונים כמו ב"על המרצים" בעמוד הקורס. בלי ציון: הציון בעמוד הזה הוא רק של כל קורס.
 */
export function LecturerAbout({ lecturer }: { lecturer: LecturerPageData }) {
  return (
    <section id="about" aria-labelledby="about-title" className="mt-10 scroll-mt-6 lg:mt-14 lg:max-w-[68ch]">
      <h2 id="about-title" className="pen-rule text-[21px] font-bold lg:text-[28px]">
        מה ידוע
      </h2>
      {lecturer.institutionBio && (
        <p className="mt-3 text-[15px] leading-relaxed text-pretty lg:text-[17px]">
          <span className="font-sans font-bold">לפי המוסד:</span> <Claim>{lecturer.institutionBio}</Claim>
        </p>
      )}
      <p className="mt-2 text-[15px] leading-relaxed text-pretty lg:text-[17px]">
        <span className="font-sans font-bold">מה בדקנו:</span>{' '}
        {lecturer.verifiedFacts.length > 0 ? (
          lecturer.verifiedFacts.map((fact, i) => (
            <a
              key={`${i}-${fact.text}`}
              href={fact.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="me-1 transition-colors duration-150 hover:text-link-hover"
            >
              <Mark source="verified">{fact.text}</Mark>
              <span className="sr-only"> (נפתח בחלון חדש)</span>
            </a>
          ))
        ) : (
          <span className="text-ink-soft">לא מצאנו מידע ציבורי שאפשר לבדוק.</span>
        )}
      </p>
    </section>
  );
}
