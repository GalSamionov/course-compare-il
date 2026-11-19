"""הופך את המחקר על הערים של המוסדות לקובץ SQL שמעדכן את institutions.city (שלב 3, החלטה 1).

הרצה (מ-scraper/):
  uv run python -m tools.cities_to_sql ../docs/research/2026-11-19-institution-cities.csv ../supabase/fixes/2026-11-19-institution-cities.sql

נכנסות רק שורות עם עיר אחת, או "אונליין" (מוסד שמלמד רק אונליין). "כמה סניפים" ו"לא נמצא" נשארים null.
שורה עם slug או עיר שלא נראים תקינים לא נכנסת. היא מופיעה בראש הקובץ ובפלט, כדי שמישהו יבדוק אותה במחקר.
אותו כלל לעיר כמו ב-institutions.yaml (lamadti_scraper.config.CITY) וכמו בבדיקה במסד.
"""

from __future__ import annotations

import csv
import io
import sys
from pathlib import Path

from lamadti_scraper.config import CITY, NOT_A_CITY, SLUG


def city_rows(csv_text: str) -> tuple[list[tuple[str, str]], list[str]]:
    """(slug, עיר) לכל שורה שנכנסת, ומה לא נכנס ולמה. slug שחוזר: השורה הראשונה קובעת."""
    rows: list[tuple[str, str]] = []
    skipped: list[str] = []
    seen: set[str] = set()
    for line, row in enumerate(csv.DictReader(io.StringIO(csv_text)), start=2):
        slug = (row.get("slug") or "").strip()
        city = (row.get("city") or "").strip()
        if city == "" or city in NOT_A_CITY:
            continue
        if not SLUG.match(slug):
            skipped.append(f"line {line}: bad slug {slug!r}")
        elif not CITY.match(city):
            skipped.append(f"line {line}: {slug}: not one city in Hebrew: {city!r}")
        elif slug in seen:
            skipped.append(f"line {line}: {slug}: appears twice, the first row counts")
        else:
            seen.add(slug)
            rows.append((slug, city))
    return rows, skipped


def _literal(text: str) -> str:
    return "'" + text.replace("'", "''") + "'"


def to_sql(rows: list[tuple[str, str]], skipped: list[str], source: str) -> str:
    lines = [
        '-- העיר של כל מוסד (institutions.city), שלב 3 של "לא יודעים למי לפנות?". התוכנית: docs/superpowers/plans/2026-11-19-stage-3-data.md.',
        f"-- נוצר מ-{source} עם scraper/tools/cities_to_sql.py. לא עורכים ביד: מתקנים את המחקר ומריצים שוב.",
        '-- רק מוסדות בעיר אחת, ו"אונליין" למוסד שמלמד רק אונליין. "כמה סניפים" ו"לא נמצא" נשארים null.',
        "-- מעדכן רק מוסד שעוד אין לו עיר: בטוח להריץ שוב, ותיקון ביד לא נדרס. מוסד שעוד לא בטבלה לא משתנה.",
        "--",
        "-- הרצה, באישור של גל, אחרי שהמיגרציה 20261119000001_stage3_data.sql עלתה לענן:",
        "--   pnpm exec supabase db query --remote --yes -f supabase/fixes/2026-11-19-institution-cities.sql",
        "-- בדיקה אחרי, לקריאה בלבד:",
        "--   pnpm exec supabase db query --remote --read-only \"select count(*) filter (where city is not null) as with_city, count(*) filter (where city = 'אונליין') as online from institutions\"",
    ]
    if skipped:
        lines += ["--", "-- לא נכנסו (לבדוק במחקר):"] + [f"--   {s}" for s in skipped]
    values = ",\n".join(f"  ({_literal(slug)}, {_literal(city)})" for slug, city in rows)
    lines += [
        "",
        "update institutions i",
        "set city = v.city",
        "from (values",
        values,
        ") as v(slug, city)",
        "where i.slug = v.slug and i.city is null;",
        "",
    ]
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: uv run python -m tools.cities_to_sql <cities.csv> <out.sql>")
        return 2
    source, out = Path(argv[0]), Path(argv[1])
    rows, skipped = city_rows(source.read_text(encoding="utf-8"))
    out.write_bytes(to_sql(rows, skipped, source.as_posix().removeprefix("../")).encode("utf-8"))
    print(f"{len(rows)} institutions, {sum(1 for _, c in rows if c == 'אונליין')} of them online only -> {out}")
    for s in skipped:
        print(f"skipped: {s}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
