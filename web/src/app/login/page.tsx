import type { Metadata } from 'next';
import { ComingSoon } from '@/components/site/coming-soon';

export const metadata: Metadata = { title: 'התחברות | [שם האתר]' };

/** הקישור "התחברות" בתפריט העליון. תוכנית 2ב מחליפה את העמוד הזה בהתחברות אמיתית. */
export default function LoginPage() {
  return (
    <ComingSoon
      title="התחברות"
      line="התחברות בקישור שנשלח למייל, בלי סיסמה. אחריה אפשר יהיה לשמור קורסים ולהשוות עד שלושה."
    />
  );
}
