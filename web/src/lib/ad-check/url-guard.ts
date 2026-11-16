/**
 * מגן הכתובות של בדיקת הקישור (מסמך העיצוב, "אבטחה", SSRF): השרת קורא דף שמבקר הדביק, ולכן לא נותנים לו
 * להגיע לרשת הפנימית, ל-localhost או לשירות המטא-דאטה של הענן.
 *
 * שתי שכבות:
 * 1. checkTarget: הכתובת עצמה, לפני כל בקשה וגם אחרי כל הפניה. רק http(s), פורט 80 או 443, בלי שם משתמש,
 *    בלי IP כשם מארח, ורק שם עם נקודה (לא localhost). רשת חברתית לא נקראת.
 * 2. guardedLookup: בזמן החיבור עצמו (connect.lookup של undici). כל כתובת ש-DNS מחזיר נבדקת, ואם אחת מהן
 *    פרטית החיבור נכשל. כך DNS rebinding לא עוקף את הבדיקה: הכתובת נבדקת ברגע שמתחברים אליה.
 */
import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { isSocialUrl } from '@/lib/course-links/url';

/**
 * כתובות שאין סיבה שדף נחיתה יגיע אליהן. BlockList בודק גם IPv4 עטוף ב-IPv6 (::ffff:10.0.0.1) מול הטווחים
 * של IPv4.
 */
const BLOCKED = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8], // "הרשת הזו", ו-0.0.0.0
  ['10.0.0.0', 8], // פרטי
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, ושירות המטא-דאטה של הענן
  ['172.16.0.0', 12], // פרטי
  ['192.0.0.0', 24], // שמור ל-IETF
  ['192.0.2.0', 24], // לתיעוד
  ['192.88.99.0', 24], // ממסר 6to4
  ['192.168.0.0', 16], // פרטי
  ['198.18.0.0', 15], // מבחני ביצועים
  ['198.51.100.0', 24], // לתיעוד
  ['203.0.113.0', 24], // לתיעוד
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // שמור, ו-255.255.255.255
] as const) {
  BLOCKED.addSubnet(net, prefix, 'ipv4');
}
for (const [net, prefix] of [
  ['::', 96], // לא מוגדר, loopback (::1), ו-IPv4 "תואם" שכבר לא בשימוש
  ['64:ff9b::', 96], // NAT64: IPv4 בתוך IPv6
  ['64:ff9b:1::', 48], // NAT64 מקומי
  ['100::', 64], // discard
  ['2001::', 32], // Teredo: IPv4 בתוך IPv6
  ['2001:db8::', 32], // לתיעוד
  ['2002::', 16], // 6to4: IPv4 בתוך IPv6
  ['fc00::', 7], // ULA, הרשת הפרטית של IPv6
  ['fe80::', 10], // link-local
  ['fec0::', 10], // site-local, שכבר לא בשימוש
  ['ff00::', 8], // multicast
] as const) {
  BLOCKED.addSubnet(net, prefix, 'ipv6');
}

/** האם אסור להתחבר לכתובת. גם כתובת שאינה IP בכלל אסורה. */
export function isBlockedAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 0) return true;
  return BLOCKED.check(address, version === 4 ? 'ipv4' : 'ipv6');
}

export type TargetProblem = 'scheme' | 'credentials' | 'port' | 'host' | 'social';
export type TargetCheck = { ok: true; url: URL } | { ok: false; problem: TargetProblem };

/**
 * האם מותר לבקש את הכתובת. נבדק לפני הבקשה הראשונה, ושוב על כל הפניה (Location).
 * נקודה בסוף שם המארח יורדת לפני הבדיקה: "localhost." הוא localhost.
 */
export function checkTarget(href: string): TargetCheck {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { ok: false, problem: 'scheme' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { ok: false, problem: 'scheme' };
  if (url.username || url.password) return { ok: false, problem: 'credentials' };
  // URL מוריד את הפורט כשהוא ברירת המחדל של הסכמה. http על 443 או https על 80 גם מותרים: אותם שני פורטים.
  if (url.port !== '' && url.port !== '80' && url.port !== '443') return { ok: false, problem: 'port' };

  const host = url.hostname.replace(/\.+$/, '').toLowerCase();
  // IP כשם מארח: Node לא קורא ל-lookup בכלל, ולכן נדחה כאן. גם IPv6 בסוגריים.
  if (
    host === '' ||
    !host.includes('.') ||
    host.startsWith('[') ||
    isIP(host) !== 0 ||
    /^[\d.]+$/.test(host) ||
    host === 'localhost' ||
    host.endsWith('.localhost')
  ) {
    return { ok: false, problem: 'host' };
  }
  url.hostname = host;
  if (isSocialUrl(url.href)) return { ok: false, problem: 'social' };
  return { ok: true, url };
}

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;
type Resolver = (
  hostname: string,
  options: LookupOptions & { all: true },
  callback: (error: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void,
) => void;

function blockedError(hostname: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(`blocked address for ${hostname}`);
  error.code = 'EADDRBLOCKED';
  return error;
}

/**
 * lookup ל-net.connect ול-tls.connect (דרך connect.lookup של undici). מבקש את כל הכתובות, ודוחה את החיבור
 * אם אחת מהן אסורה. מחזיר בצורה שהמתקשר ביקש: מערך כש-all, וכתובת אחת אחרת.
 * resolve: dns.lookup, ובבדיקות פונקציה שמחזירה כתובות קבועות.
 */
export function makeGuardedLookup(resolve: Resolver = dnsLookup as unknown as Resolver) {
  return function guardedLookup(hostname: string, options: LookupOptions, callback: LookupCallback): void {
    resolve(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) return callback(error, '');
      const list = Array.isArray(addresses) ? addresses : [];
      if (list.length === 0) return callback(blockedError(hostname), '');
      if (list.some((a) => isBlockedAddress(a.address))) return callback(blockedError(hostname), '');
      if (options.all) return callback(null, list);
      return callback(null, list[0].address, list[0].family);
    });
  };
}

export const guardedLookup = makeGuardedLookup();
