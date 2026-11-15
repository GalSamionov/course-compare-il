/** איזה מוסד במסד שייך לקישור מבקשה של מוסד. בלי גישה למסד, כדי שאפשר יהיה לבדוק בבדיקת יחידה. */

/**
 * איזה מוסד להציע לבקשה. רק מוסד שהאתר שלו באותו מארח (המסד לא יקבל אחר).
 * כשכמה מוסדות על אותו מארח (למשל example.com ו-example.com/prep): קודם שם זהה למה שהמוסד כתב,
 * ואחריו המוסד שהנתיב של האתר שלו הוא הארוך ביותר שהקישור מתחיל בו.
 */
export function suggestInstitution(
  request: { institutionName: string; courseUrl: string },
  institutions: { id: string; name: string; website: string | null }[],
): string | null {
  const host = urlHost(request.courseUrl);
  if (!host) return null;
  const path = (url: string) => {
    try {
      return new URL(url).pathname.replace(/\/+$/, '');
    } catch {
      return '';
    }
  };
  const linkPath = path(request.courseUrl);
  const name = request.institutionName.replace(/\s+/g, ' ').trim();
  const candidates = institutions
    .filter((i) => urlHost(i.website) === host)
    .map((i) => {
      const sitePath = path(i.website ?? '');
      const underSite = sitePath === '' || linkPath === sitePath || linkPath.startsWith(`${sitePath}/`);
      return { id: i.id, score: (i.name.trim() === name ? 10_000 : 0) + (underSite ? 1 + sitePath.length : 0) };
    })
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.id ?? null;
}

/** המארח בלי www, כמו private.url_host במסד וכמו same_site באוסף. */
export function urlHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return host || null;
  } catch {
    return null;
  }
}
