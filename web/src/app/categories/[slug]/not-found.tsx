import Link from 'next/link';

export default function CategoryNotFound() {
  return (
    <main className="mx-auto max-w-[680px] px-[22px] py-16">
      <title>התחום לא נמצא | [שם האתר]</title>
      <h1 className="text-2xl font-bold">התחום לא נמצא</h1>
      <p className="mt-2 font-sans text-ink-soft">
        ייתכן שהקישור שגוי.{' '}
        <Link href="/courses" className="underline underline-offset-[3px]">
          לכל הקורסים
        </Link>
      </p>
    </main>
  );
}
