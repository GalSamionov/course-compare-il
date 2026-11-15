"""הדגמה מול המסד המקומי בלבד: שלושה שבועות של אתר הדוגמה, עם חילוץ מוקלט.

שבוע 1: קורסים חדשים לתור, ושלושה קורסים קיימים (כאילו גל הזין אותם) מתקשרים לדפים שלהם.
שבוע 2: שינוי קטן עולה לבד, שינוי חריג לתור, ודף אחד נעלם.
שבוע 3: הדף נעלם פעם שנייה, והקורס מסומן "ייתכן שאינו פעיל".

בכל הרצה נוצר מוסד דוגמה חדש (scraper-demo-xxxxxx), כי היומן והעותקים לא נמחקים. בסוף, הקורסים
שלו הופכים לטיוטה, כדי שלא יופיעו באתר המקומי.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from datetime import date
from typing import Callable

from .config import Config, InstitutionConfig
from .db import Db
from .extract import ReplayExtractor
from .fixtures import FIXTURES, serve_fixtures
from .politeness import HostLimiter
from .run import RunSummary, run_scraper

# התאריכים באתר הדוגמה נכתבו מול היום הזה (למשל מחזור שכבר עבר).
DEMO_TODAY = date(2026, 11, 14)


@dataclass
class DemoResult:
    institution_id: str
    slug: str
    base: str
    summaries: list[RunSummary] = field(default_factory=list)


def seed(db: Db, base: str) -> tuple[str, str]:
    from tests.fixtures import specs

    slug = f"scraper-demo-{secrets.token_hex(3)}"
    [institution] = db.insert(
        "institutions", [{"slug": slug, "name": specs.INSTITUTION["name"], "kind": specs.INSTITUTION["kind"], "website": base + "/"}]
    )
    categories = db.categories()
    by_key = {c["key"]: c for c in specs.COURSES}
    rows = []
    for key, values in specs.SEEDED.items():
        rows.append(
            {
                "slug": f"{slug}-{key}",
                "institution_id": institution["id"],
                "category_id": categories[by_key[key]["category"]][0],
                "status": "active",
                "page_url": f"{base}/courses/{key}.html",
                **values,
            }
        )
    for row in rows:  # PostgREST דורש את אותם מפתחות בכל השורות של בקשה אחת
        db.insert("courses", [row])
    return institution["id"], slug


def hide(db: Db, institution_id: str) -> None:
    db.update("courses", {"institution_id": f"eq.{institution_id}"}, {"status": "draft"})


def run_demo(db: Db, weeks: tuple[int, ...] = (1, 2, 3), log: Callable[[str], None] = print, keep_visible: bool = False) -> DemoResult:
    if not db.is_local:
        raise RuntimeError("the demo writes sample data, so it only runs against the local database (127.0.0.1)")
    from tests.fixtures import specs

    with serve_fixtures() as site:
        institution_id, slug = seed(db, site.base)
        result = DemoResult(institution_id=institution_id, slug=slug, base=site.base)
        config = Config(
            institutions=[InstitutionConfig(slug=slug, website=site.base + "/", categories=tuple(specs.CATEGORIES))]
        )
        try:
            for week in weeks:
                site.week = week
                log(f"\n===== שבוע {week} =====")
                extractor = ReplayExtractor(FIXTURES / "extractions", variant="week2" if week >= 2 else None)
                summary = run_scraper(
                    config=config,
                    db=db,
                    extractor=extractor,
                    today=DEMO_TODAY,
                    trigger="local",
                    limiter=HostLimiter(local_interval=0.0),
                    workers=1,
                    log=log,
                )
                result.summaries.append(summary)
                from .report import format_report

                log(format_report(summary))
        finally:
            if not keep_visible:
                hide(db, institution_id)
    return result
