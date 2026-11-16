import { notFound } from 'next/navigation';

/**
 * לכאן ה-proxy מפנה קישור "בוגר מאומת" שכבר לא עובד, עם סטטוס 404 (src/proxy.ts).
 * כתובת קבועה גוברת על [token], ו-notFound() מציג את not-found.tsx של /verified.
 */
export default function BadgeGone(): never {
  notFound();
}
