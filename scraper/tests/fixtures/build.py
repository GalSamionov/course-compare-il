"""בונה את אתר הדוגמה ואת החילוץ הצפוי מתוך specs.py.

הרצה (מ-scraper/): uv run python -m tests.fixtures.build
הקבצים שנוצרים נשמרים במאגר, כדי שהבדיקות לא יהיו תלויות בהרצה הזו.
"""

from __future__ import annotations

import html
import json
import re
import shutil
from pathlib import Path

from lamadti_scraper.fields import FIELD_BY_NAME, FIELDS

from .specs import BLOG, COURSES, INSTITUTION, PRIVATE, WEEK2, WEEK2_REMOVED

ROOT = Path(__file__).parent
SITE = ROOT / "site"
SITE_WEEK2 = ROOT / "site-week2"
EXTRACTIONS = ROOT / "extractions"
EMPTY = {"text": "", "int": 0, "number": 0, "date": "", "choices": [], "syllabus": []}
LABELS_EN = {"site_price_ils": "Price", "total_hours": "Hours", "formats": "Format", "time_slots": "When", "schedule": "Schedule"}

INTRO_HE = (
    "בקורס הזה תלמדו מהבסיס ועד רמה מקצועית, עם מרצים מהתעשייה וליווי אישי לאורך כל הדרך. "
    "כל מפגש משלב הסבר קצר ותרגול מעשי, וכל משתתף מקבל משוב אישי על העבודות שלו."
)
TESTIMONIAL_HE = "״הקורס שינה לי את הדרך שבה אני עובדת״, בוגרת מחזור קודם (ציטוט לדוגמה)."
FAQ_HE = (
    '<section class="faq"><h2>שאלות נפוצות</h2>'
    "<details><summary>אפשר להצטרף באמצע?</summary><p>אפשר לשאול את צוות הייעוץ אם נשאר מקום ואם החומר שהוחמץ זמין בהקלטה.</p></details>"
    "<details><summary>איך נרשמים?</summary><p>משאירים פרטים בטופס, ויועץ לימודים חוזר תוך יום עבודה עם כל הפרטים על המחזור.</p></details>"
    "</section>"
)
INTRO_EN = (
    "In this hands-on workshop you will learn practical techniques step by step, with exercises in every session "
    "and personal feedback on your work from an experienced instructor."
)


def _e(text: str) -> str:
    return html.escape(text, quote=False)


def _plain(fragment: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", fragment))


def detail_quotes(spec: dict) -> list[tuple[str, str]]:
    """(שם השדה, המשפט) לכל שדה שמוצג כשורה. משפט שכבר מופיע ב-extra או ב-JSON-LD לא חוזר."""
    extra_text = " ".join(_plain(x) for x in spec.get("extra", []))
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for f in FIELDS:
        if f.name in ("title", "syllabus", "video_url") or f.name not in spec:
            continue
        quote = spec[f.name][1]
        if quote in seen or quote in extra_text or quote.startswith('"price"'):
            continue
        seen.add(quote)
        out.append((f.name, quote))
    return out


def chrome(body: str, title: str, lang: str = "he", head: str = "") -> str:
    direction = "rtl" if lang == "he" else "ltr"
    return (
        f'<!doctype html>\n<html lang="{lang}" dir="{direction}"><head><meta charset="utf-8"><title>{_e(title)} | {_e(INSTITUTION["name"])}</title>'
        '<link rel="stylesheet" href="/static/site.css">' + head + "</head><body>"
        '<header class="site-header"><nav><a href="/">דף הבית</a> <a href="/courses/">כל הקורסים</a> <a href="/blog/">בלוג</a> <a href="/contact">צרו קשר</a></nav></header>'
        f"<main>{body}{FAQ_HE if lang == 'he' else ''}</main>"
        '<footer class="site-footer"><p>מכללת הדגמה. כל הזכויות שמורות. אתר לדוגמה בלבד.</p></footer>'
        "</body></html>\n"
    )


def layout_classic(spec: dict) -> str:
    en = spec.get("lang") == "en"
    title = spec["title"][1]
    parts = [f"<article><header><h1>{_e(title)}</h1></header>", f"<p>{_e(INTRO_EN if en else INTRO_HE)}</p>"]
    parts += spec.get("extra", [])
    parts.append(f"<section><h2>{'Details' if en else 'פרטים'}</h2>")
    parts += [f"<p>{_e(q)}</p>" for _, q in detail_quotes(spec)]
    parts.append("</section>")
    if "syllabus" in spec:
        parts.append("<section><h2>סילבוס</h2><ul>" + "".join(f"<li>{_e(t)}</li>" for t in spec["syllabus"][0]) + "</ul></section>")
    if "video_url" in spec:
        parts.append(f'<iframe src="{spec["video_url"][0]}" title="video"></iframe>')
    if not en:
        parts.append(f"<blockquote>{_e(TESTIMONIAL_HE)}</blockquote>")
    parts.append("</article>")
    return chrome("".join(parts), title, "en" if en else "he")


def layout_cards(spec: dict) -> str:
    title = spec["title"][1]
    cards = "".join(
        f'<div class="card"><h3>{_e(FIELD_BY_NAME[name].label)}</h3><p>{_e(q)}</p></div>' for name, q in detail_quotes(spec)
    )
    body = f'<div class="hero"><h1>{_e(title)}</h1><p>{_e(INTRO_HE)}</p></div>' + "".join(spec.get("extra", []))
    body += f'<div class="cards">{cards}</div>'
    if "syllabus" in spec:
        body += '<div class="syllabus"><h2>מה לומדים</h2><ol>' + "".join(f"<li>{_e(t)}</li>" for t in spec["syllabus"][0]) + "</ol></div>"
    return chrome(body, title)


def layout_table(spec: dict) -> str:
    title = spec["title"][1]
    rows = "".join(f"<tr><th>{_e(FIELD_BY_NAME[name].label)}</th><td>{_e(q)}</td></tr>" for name, q in detail_quotes(spec))
    body = f"<h1>{_e(title)}</h1><p>{_e(INTRO_HE)}</p>" + "".join(spec.get("extra", []))
    body += f'<table class="details"><tbody>{rows}</tbody></table>'
    if "syllabus" in spec:
        body += '<h2>תוכנית הלימודים</h2><table class="syllabus"><tbody>' + "".join(
            f"<tr><td>{i}</td><td>{_e(t)}</td></tr>" for i, t in enumerate(spec["syllabus"][0], 1)
        ) + "</tbody></table>"
    body += f"<p>{_e(TESTIMONIAL_HE)}</p>"
    return chrome(body, title)


def layout_landing(spec: dict) -> str:
    title = spec["title"][1]
    body = (
        f'<section class="hero"><h1>{_e(title)}</h1><p class="slogan">הצעד הבא שלכם מתחיל כאן!</p>'
        '<button class="cta">להרשמה עכשיו</button></section>'
    )
    body += "".join(spec.get("extra", []))
    body += '<ul class="features">' + "".join(f'<li><span class="icon">✓</span> {_e(q)}</li>' for _, q in detail_quotes(spec)) + "</ul>"
    if "syllabus" in spec:
        body += '<div class="accordion">' + "".join(f'<button aria-expanded="false">{_e(t)}</button>' for t in spec["syllabus"][0]) + "</div>"
    body += f'<section class="reviews"><p>{_e(TESTIMONIAL_HE)}</p></section><p>{_e(INTRO_HE)}</p>'
    return chrome(body, title)


def layout_jsonld(spec: dict) -> str:
    title = spec["title"][1]
    data = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": title,
        "provider": {"@type": "Organization", "name": INSTITUTION["name"]},
        "offers": {"@type": "Offer", "price": str(spec["site_price_ils"][0]), "priceCurrency": "ILS"},
    }
    head = f'<script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>'
    body = f"<h1>{_e(title)}</h1><p>{_e(INTRO_HE)}</p>" + "".join(f"<p>{_e(q)}</p>" for _, q in detail_quotes(spec))
    return chrome(body, title, head=head)


def layout_js(spec: dict) -> str:
    """דף שנבנה רק בדפדפן: בהורדה רגילה יש בו כמעט רק שלד."""
    title = spec["title"][1]
    inner = f"<h1>{_e(title)}</h1><p>{_e(INTRO_HE)}</p>" + "".join(f"<p>{_e(q)}</p>" for _, q in detail_quotes(spec))
    script = f"document.getElementById('root').innerHTML = {json.dumps(inner, ensure_ascii=False)};"
    return (
        f'<!doctype html>\n<html lang="he" dir="rtl"><head><meta charset="utf-8"><title>{_e(title)}</title></head>'
        f'<body><div id="root"></div><noscript>יש לאפשר JavaScript</noscript><script>{script}</script></body></html>\n'
    )


LAYOUTS = {"classic": layout_classic, "cards": layout_cards, "table": layout_table, "landing": layout_landing, "jsonld": layout_jsonld, "js": layout_js}


def expected(spec: dict) -> dict:
    fields = {}
    for f in FIELDS:
        if f.name in spec:
            value, quote, *rest = spec[f.name]
            fields[f.name] = {"found": True, "value": value, "quote": quote, "confidence": rest[0] if rest else "high"}
        else:
            fields[f.name] = {"found": False, "value": EMPTY[f.kind], "quote": "", "confidence": "low"}
    return {"is_course_page": True, "category": spec["category"], "fields": fields}


def blog_page() -> str:
    body = (
        f"<article><h1>{_e(BLOG['title'])}</h1>"
        "<p>לפני שנרשמים לקורס כדאי לבדוק את הסילבוס, לשאול כמה שעות תרגול יש, ולדבר עם בוגרים.</p>"
        "<p>במכללת הדגמה יש עשרות קורסים בתחומים שונים. רשימת כל הקורסים מופיעה בעמוד הקורסים.</p></article>"
    )
    return chrome(body, BLOG["title"])


def blog_expected() -> dict:
    data = expected({"category": "programming"})
    data["is_course_page"] = False
    return data


def sitemap(keys: list[str]) -> str:
    urls = [f"{{{{BASE}}}}/courses/{k}.html" for k in keys]
    urls += [f"{{{{BASE}}}}/guides/{BLOG['key']}.html", f"{{{{BASE}}}}/private/{PRIVATE['key']}.html"]
    items = "".join(f"<url><loc>{u}</loc></url>" for u in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{items}</urlset>\n'


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text.encode("utf-8"))


def main() -> None:
    for folder in (SITE, SITE_WEEK2, EXTRACTIONS):
        shutil.rmtree(folder, ignore_errors=True)
    write(SITE / "robots.txt", "User-agent: *\nDisallow: /private/\n\nSitemap: {{BASE}}/sitemap.xml\n")
    write(SITE / "sitemap.xml", sitemap([c["key"] for c in COURSES]))
    write(SITE / "guides" / f"{BLOG['key']}.html", blog_page())
    write(SITE / "private" / f"{PRIVATE['key']}.html", chrome("<h1>מחירון פנימי</h1>", "מחירון"))
    write(EXTRACTIONS / f"{BLOG['key']}.json", json.dumps(blog_expected(), ensure_ascii=False, indent=1))
    for spec in COURSES:
        write(SITE / "courses" / f"{spec['key']}.html", LAYOUTS[spec["layout"]](spec))
        write(EXTRACTIONS / f"{spec['key']}.json", json.dumps(expected(spec), ensure_ascii=False, indent=1))
    by_key = {c["key"]: c for c in COURSES}
    for key, changes in WEEK2.items():
        spec = {**by_key[key], **changes}
        page = LAYOUTS[spec["layout"]](spec)
        # שינוי בדף שלא קשור לשדות, כדי שגם שינוי ניסוח בלבד יגיע לחילוץ.
        page = page.replace("</main>", "<p>ההרשמה למחזור הבא פתוחה.</p></main>")
        write(SITE_WEEK2 / "courses" / f"{key}.html", page)
        write(EXTRACTIONS / "week2" / f"{key}.json", json.dumps(expected(spec), ensure_ascii=False, indent=1))
    write(SITE_WEEK2 / "sitemap.xml", sitemap([c["key"] for c in COURSES if c["key"] not in WEEK2_REMOVED]))
    write(SITE_WEEK2 / "_removed.txt", "\n".join(f"/courses/{k}.html" for k in WEEK2_REMOVED) + "\n")
    print(f"{len(COURSES)} courses, {len(WEEK2)} changed in week 2, {len(WEEK2_REMOVED)} removed")


if __name__ == "__main__":
    main()
