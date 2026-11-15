import { formatIls } from '../format';
import { PROOF_KIND_LABEL, type DisplayMode, type ProofKind } from './types';

/** סוגי המסמך שהמודל בוחר מהם. "other": אף אחד מאלה. */
export const DOCUMENT_TYPES = [
  'invoice_or_receipt',
  'certificate',
  'enrollment_email',
  'employer_letter',
  'course_screenshot',
  'project',
  'other',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

const KIND_OF: Record<DocumentType, ProofKind | null> = {
  invoice_or_receipt: 'invoice',
  certificate: 'certificate',
  enrollment_email: 'enrollment_email',
  employer_letter: 'employer_letter',
  course_screenshot: 'screenshot',
  project: 'project',
  other: null,
};

/** מה המודל קרא מהמסמך. '' או 0: לא מופיע במסמך. */
export interface ExtractedProof {
  institutionName: string;
  businessNumber: string;
  /** 'YYYY-MM-DD'. */
  documentDate: string;
  amountIls: number;
  nameOnDocument: string;
  documentType: DocumentType;
}

/** מה אמור להיות במסמך, לפי הקורס והביקורת. */
export interface ProofExpectations {
  institutionName: string;
  businessNumber: string | null;
  cohortMonth: string;
  finishedMonth: string | null;
  sitePrice: number | null;
  displayName: string;
  displayMode: DisplayMode;
  claimedKind: ProofKind;
}

export type MismatchField = 'institution' | 'business_number' | 'date' | 'amount' | 'name' | 'document_type';

export interface Mismatch {
  field: MismatchField;
  /** משפט לגל, בעברית. */
  message: string;
}

/** נשמר ב-proofs.check_result עד ההחלטה. */
export type CheckResult =
  | { found: ExtractedProof; mismatches: Mismatch[] }
  | { skipped: 'no_key' | 'too_large' | 'quota' | 'error' };

/**
 * תווי בקרה (\p{Cc}) ותווי עיצוב בלתי נראים (\p{Cf}: סימני כיוון, היפוך RLO, רוחב אפס).
 * טקסט מוסתר במסמך יכול להגיע דרכם לתור, ולהיראות שם אחרת ממה שהוא.
 * תו בקרה (גם שורה חדשה) הופך לרווח, כדי ששתי מילים לא יתחברו. תו עיצוב פשוט יורד.
 */
function stripInvisible(value: string): string {
  return value.replace(/\p{Cc}/gu, ' ').replace(/\p{Cf}/gu, '');
}

/** גם עם פלט מובנה, מה שחוזר מהמודל נבדק שוב: רק ערכים נקיים, בלי תווים נסתרים, בגבולות אורך. */
export function sanitizeExtracted(raw: unknown): ExtractedProof {
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) =>
    typeof value === 'string' ? stripInvisible(value).trim().slice(0, max) : '';
  const date = text(o.document_date, 10);
  const amount = o.amount_ils;
  return {
    institutionName: text(o.institution_name, 200),
    businessNumber: text(o.business_number, 30).replace(/\D/g, ''),
    documentDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    amountIls: typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0,
    nameOnDocument: text(o.name_on_document, 100),
    documentType: (DOCUMENT_TYPES as readonly unknown[]).includes(o.document_type)
      ? (o.document_type as DocumentType)
      : 'other',
  };
}

/** אותיות ומספרים בלבד: בלי ניקוד, גרשיים, סימני פיסוק ו"בע"מ". */
export function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .toLowerCase()
    .replace(/בע["״']?מ|\bltd\b|\binc\b/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** שם של מוסד: אחד מכיל את השני, או לפחות חצי מהמילים של השם באתר מופיעות במסמך. */
function sameInstitution(onDocument: string, onSite: string): boolean {
  const doc = normalizeName(onDocument);
  const site = normalizeName(onSite);
  if (!doc || !site) return false;
  if (doc.includes(site) || site.includes(doc)) return true;
  const docWords = new Set(doc.split(' '));
  const siteWords = site.split(' ').filter((w) => w.length >= 2);
  return siteWords.length > 0 && siteWords.filter((w) => docWords.has(w)).length * 2 >= siteWords.length;
}

/** "נועה ר." מול "נועה רוזן": השם הפרטי במסמך, ומילה אחרת שמתחילה באות. שם מלא: כל המילים במסמך. */
function sameName(onDocument: string, displayName: string, mode: DisplayMode): boolean {
  const doc = normalizeName(onDocument).split(' ');
  const shown = normalizeName(displayName).split(' ').filter(Boolean);
  if (shown.length === 0) return false;
  if (mode === 'full') return shown.every((w) => doc.includes(w));
  const [first, initial] = shown;
  return doc.includes(first) && (initial === undefined || doc.some((w) => w !== first && w.startsWith(initial)));
}

const monthIndex = (iso: string) => {
  const [year, month] = iso.split('-').map(Number);
  return year * 12 + (month - 1);
};

/**
 * אי-ההתאמות בין מה שהמודל קרא לבין הקורס. רק מסמנת: ההחלטה אצל גל.
 * - תאריך: עד שנה לפני חודש ההתחלה, ועד שנה אחרי חודש הסיום (או ההתחלה, כשאין סיום).
 * - סכום: רק בחשבונית, ורק כשיש מחיר באתר. מחוץ ל-30% עד 150% מהמחיר מסומן (הנחות קורות).
 * - שם: לא נבדק בביקורת אנונימית. אין שם בחשבון, ולכן ההשוואה היא לשם שהכותב בחר.
 */
export function compareProof(found: ExtractedProof, expected: ProofExpectations): Mismatch[] {
  const out: Mismatch[] = [];

  if (!found.institutionName) {
    out.push({ field: 'institution', message: 'לא נמצא שם של מוסד במסמך.' });
  } else if (!sameInstitution(found.institutionName, expected.institutionName)) {
    out.push({
      field: 'institution',
      message: `במסמך: "${found.institutionName}". הקורס באתר: "${expected.institutionName}".`,
    });
  }

  const siteNumber = expected.businessNumber?.replace(/\D/g, '') ?? '';
  if (found.businessNumber && siteNumber && found.businessNumber !== siteNumber) {
    out.push({ field: 'business_number', message: `מספר העוסק במסמך ${found.businessNumber}, ובאתר ${siteNumber}.` });
  }

  if (!found.documentDate) {
    out.push({ field: 'date', message: 'לא נמצא תאריך במסמך.' });
  } else {
    const doc = monthIndex(found.documentDate);
    const start = monthIndex(expected.cohortMonth);
    const end = monthIndex(expected.finishedMonth ?? expected.cohortMonth);
    if (doc < start - 12 || doc > end + 12) {
      out.push({ field: 'date', message: `התאריך במסמך (${found.documentDate}) רחוק ביותר משנה מהמחזור.` });
    }
  }

  if (expected.claimedKind === 'invoice') {
    if (found.amountIls === 0) {
      out.push({ field: 'amount', message: 'לא נמצא סכום בחשבונית.' });
    } else if (
      expected.sitePrice !== null &&
      (found.amountIls < expected.sitePrice * 0.3 || found.amountIls > expected.sitePrice * 1.5)
    ) {
      out.push({
        field: 'amount',
        message: `הסכום במסמך ${formatIls(found.amountIls)}, והמחיר באתר ${formatIls(expected.sitePrice)}.`,
      });
    }
  }

  if (expected.displayMode !== 'anonymous') {
    if (!found.nameOnDocument) {
      out.push({ field: 'name', message: 'לא נמצא שם על המסמך.' });
    } else if (!sameName(found.nameOnDocument, expected.displayName, expected.displayMode)) {
      out.push({
        field: 'name',
        message: `על המסמך: "${found.nameOnDocument}". השם שהכותב בחר: "${expected.displayName}".`,
      });
    }
  }

  const kind = KIND_OF[found.documentType];
  if (kind !== expected.claimedKind) {
    out.push({
      field: 'document_type',
      message: `המסמך נראה כמו ${kind ? PROOF_KIND_LABEL[kind] : 'משהו אחר'}, ונשלח כ${PROOF_KIND_LABEL[expected.claimedKind]}.`,
    });
  }

  return out;
}
