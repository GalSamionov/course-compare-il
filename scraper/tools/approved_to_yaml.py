"""הופך את רשימת המוסדות המאושרת (Markdown) ל-institutions.yaml.

הרצה (מ-scraper/): uv run python -m tools.approved_to_yaml ../docs/institutions/2026-11-14-proposed-institutions.md
שורה שמסומנת ❌ לא נכנסת. מוסד אחד לכל אתר רשמי, עם כל התחומים שבהם הוא הופיע.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

from lamadti_scraper.config import load_config

SECTION = re.compile(r"^## \d+\. .*\(([a-z0-9-]+)\)\s*$")
LINK = re.compile(r"\]\((https?://[^)\s]+)\)")
KIND = {"מכללה": "college", "בית ספר": "school", "מרצה עצמאי": "independent"}
SUFFIXES_2 = {"co.il", "org.il", "ac.il", "gov.il", "net.il", "muni.il", "k12.il"}
MAX_PAGES = 60
# תחום ברשימה המאושרת שבאתר התחלק לכמה תחומים (20261116040001_new_categories.sql). מוסד שאושר בתחום
# מקבל את כל התחומים שבמקומו, והמודל בוחר ביניהם לכל קורס לפי התיאור.
SPLIT: dict[str, list[str]] = {
    "ai": ["ai-at-work", "ai-automation", "ai-no-code", "ai-content"],
}
# מההערות ברשימה המאושרת ומהגילוי היבש של 15.11.2026: מה לסרוק ומה לא, לכל מוסד.
OVERRIDES: dict[str, dict] = {
    # "בית הספר נמצא בנתיב /school/ בתוך אתר prog.co.il; לסרוק רק את הנתיב הזה". מפת האתר: מיליון כתובות של פורום.
    "prog": {"sitemap": "none", "listing_urls": ["https://www.prog.co.il/school/courses/advertising-digital-marketing/"], "include": "/school/"},
    # "קטלוג כללי: /catalog". "jobs.johnbryce.co.il הוא לוח משרות; לא לסרוק".
    "johnbryce": {"listing_urls": ["https://www.johnbryce.co.il/catalog"], "include": "/catalog/", "exclude": r"^https?://jobs\."},
    # "dev.geva.co.il נראה כמו סביבת פיתוח; לא לסרוק".
    "geva": {"exclude": r"^https?://dev\."},
    # "old.itsafe.co.il (גרסה ישנה) ו-platform.itsafe.co.il (התחברות); לסרוק רק את www".
    "itsafe": {"exclude": r"^https?://(old|platform)\."},
    # "עמוד ארכיון (קורסים לא פעילים)".
    "hackeru": {"exclude": "/archive-courses"},
}


@dataclass
class Entry:
    name: str
    website: str
    kind: str
    categories: list[str] = field(default_factory=list)
    course_urls: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)


def base_host(url: str) -> str:
    return (urlsplit(url).hostname or "").lower().removeprefix("www.")


def slug_for(host: str) -> str:
    labels = host.split(".")
    if ".".join(labels[-2:]) in SUFFIXES_2:
        labels = labels[:-2]
    elif len(labels) > 1:
        labels = labels[:-1]
    return re.sub(r"[^a-z0-9]+", "-", "-".join(labels)).strip("-")


def kind_for(text: str) -> str:
    if text.startswith("אוניברסיטה"):
        return "university"
    return KIND.get(text.strip(), "other")


def parse(markdown: str) -> list[Entry]:
    entries: dict[str, Entry] = {}
    category: str | None = None
    for line in markdown.splitlines():
        heading = SECTION.match(line)
        if heading:
            category = heading.group(1)
            continue
        if line.startswith("# "):
            category = None  # טבלת הסיכום ו"מה לא בדקתי" אינן תחום
        if not category or not line.startswith("| ") or line.startswith("| אישור") or line.startswith("|---"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        if len(cells) < 6 or "❌" in cells[0]:
            continue
        _, name, site_cell, course_cell, kind_cell, notes = cells[:6]
        site = LINK.search(site_cell)
        if not site:
            continue
        website = site.group(1)
        host = base_host(website)
        entry = entries.setdefault(host, Entry(name=name, website=website, kind=kind_for(kind_cell)))
        for slug in SPLIT.get(category, [category]):
            if slug not in entry.categories:
                entry.categories.append(slug)
        for url in LINK.findall(course_cell):
            course_host = base_host(url)
            if course_host == host or course_host.endswith("." + host):
                if url not in entry.course_urls:
                    entry.course_urls.append(url)
            else:
                entry.notes.append(f"דף הקורס לא באתר הרשמי, ולא נקרא: {url}")
        if "לא אומת" in notes and "לא אומת" not in " ".join(entry.notes):
            entry.notes.append("ברשימה המוצעת: (לא אומת)")
    return list(entries.values())


def to_yaml(entries: list[Entry], source: str) -> str:
    out = [
        "# המוסדות שהאוסף השבועי קורא מהאתרים שלהם.",
        "#",
        f"# נוצר מהרשימה שגל אישר ב-15.11.2026 ({source}), עם tools/approved_to_yaml.py.",
        "# מותר לערוך ידנית אחרי זה, למשל include או max_pages למוסד מסוים.",
        "#",
        "# מוסד שעוד לא בטבלה institutions נוצר בריצה הראשונה, מ-name ו-kind. בלי קורס שאינו טיוטה אין לו עמוד באתר.",
        "# תחום שעוד אין באתר (למשל ux-ui) מדולג בריצה ומופיע בדוח. מוסד שכל התחומים שלו כאלה מדולג כולו.",
        "#",
        "# השדות:",
        "#   slug          חובה. ה-slug של המוסד בטבלה institutions.",
        "#   name, kind    השם והסוג (college, school, university, independent, other), ליצירת המוסד.",
        "#   website       חובה. האתר של המוסד עצמו. האוסף לא יוצא ממנו ומתת-הדומיינים שלו.",
        "#   categories    חובה. התחומים (slug מ-categories) שהקורסים של המוסד יכולים להיכנס אליהם.",
        "#   course_urls   דפי קורס ידועים. תמיד נקראים, וכתובות באותה תיקייה קודמות בתור.",
        "#   sitemap       auto (מ-robots.txt או /sitemap.xml), none, או כתובת של מפת אתר.",
        "#   listing_urls  עמודים שמקשרים לכל הקורסים, כשאין מפת אתר טובה.",
        "#   include       ביטוי רגולרי: רק כתובות שמתאימות לו הן דפי קורס. למשל '/courses/'.",
        "#   exclude       ביטוי רגולרי: כתובות שלא קוראים. בלוג, תגיות, אודות וקבצים מסוננים תמיד.",
        "#   render        auto (דפדפן רק כשהדף ריק בלי JavaScript) או browser (תמיד דפדפן).",
        "#   max_pages     כמה דפים לכל היותר בכל ריצה. ברירת מחדל 100, תקרה 500.",
        "",
        "institutions:",
    ]
    used: set[str] = set()
    for entry in sorted(entries, key=lambda e: slug_for(base_host(e.website))):
        slug = slug_for(base_host(entry.website))
        while slug in used:
            slug += "-2"
        used.add(slug)
        out.append("")
        for note in entry.notes:
            out.append(f"  # {note}")
        out += [
            f"  - slug: {json.dumps(slug)}",
            f"    name: {json.dumps(entry.name, ensure_ascii=False)}",
            f"    kind: {entry.kind}",
            f"    website: {json.dumps(entry.website)}",
            f"    categories: [{', '.join(entry.categories)}]",
        ]
        if entry.course_urls:
            out.append("    course_urls:")
            out += [f"      - {json.dumps(u)}" for u in entry.course_urls]
        for key, value in OVERRIDES.get(slug, {}).items():
            if isinstance(value, list):
                out.append(f"    {key}:")
                out += [f"      - {json.dumps(v)}" for v in value]
            else:
                out.append(f"    {key}: {json.dumps(value)}")
        out.append(f"    max_pages: {MAX_PAGES}")
    return "\n".join(out) + "\n"


def main() -> None:
    source = Path(sys.argv[1])
    target = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "institutions.yaml"
    entries = parse(source.read_text(encoding="utf-8"))
    target.write_bytes(to_yaml(entries, f"docs/institutions/{source.name}").encode("utf-8"))
    config = load_config(target)  # בדיקה שהקובץ נטען
    print(f"{len(config.institutions)} institutions, {sum(len(e.course_urls) for e in entries)} known course pages -> {target}")


if __name__ == "__main__":
    main()
