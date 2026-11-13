import Link from 'next/link';

/** עמוד בית זמני. העמוד הראשי ייבנה בהמשך. */
export default function Home() {
  return (
    <main className="mx-auto max-w-[680px] px-[22px] py-16">
      <h1 className="text-2xl font-bold">[שם האתר]</h1>
      <p className="mt-2 font-sans text-ink-soft">השוואת קורסים עצמאית. העמוד הראשי ייבנה בהמשך.</p>
      <p className="mt-4 font-sans">
        <Link href="/courses/full-stack-sample" className="underline underline-offset-4">
          עמוד קורס לדוגמה
        </Link>
      </p>
    </main>
  );
}
