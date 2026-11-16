"""קורס מאוחד מתעדכן כשאחד הדפים שלו משתנה, נוסף או נעלם (regroup.py). ארבעה שבועות, מסד בזיכרון.

הערה של Codex ב-PR 2 (run.py:205, P1): דף שאינו המוביל נשמר בלי course_id, ולכן שינוי בו, או מחזור חדש,
נזרקו, והמחזור הקרוב, המסלולים והסילבוס של הקורס לא חושבו שוב אחרי הריצה הראשונה.
"""

from __future__ import annotations

import html
from datetime import date

from lamadti_scraper.config import Config, InstitutionConfig
from lamadti_scraper.extract import PageInput, parse_extraction
from lamadti_scraper.fetch import FetchResult
from lamadti_scraper.politeness import HostLimiter, parse_robots
from lamadti_scraper.run import run_scraper
from tests.helpers import raw_response
from tests.memory_db import MemoryDb

SITE = "https://kitchen.example"
BASE = "יסודות האפייה"
SESSIONS = {1: "בצק פריך", 2: "בצק עלים", 3: "בצק רבוך"}


def course_page(session: int, cohort: int, opens: str) -> dict:
    title = f"{BASE} | {SESSIONS[session]} (מפגש {session} מתוך 3) מחזור {cohort}"
    return raw_response(
        category="cooking",
        title=(title, title),
        next_cohort_date=(opens, f"פתיחה: {opens}"),
        site_price_ils=(1200, 'מחיר הסדנה המלאה: 1,200 ש"ח'),
    )


class Site:
    """אתר מזויף: מפת אתר ודפים, שמשתנים משבוע לשבוע. הדף נבנה מהמשפטים של החילוץ שלו."""

    def __init__(self) -> None:
        self.pages: dict[str, dict] = {}

    def html(self, raw: dict) -> str:
        lines = [f"<p>{html.escape(f['quote'])}</p>" for f in raw["fields"].values() if f["found"]]
        return f"<html><head><title>{html.escape(raw['fields']['title']['value'])}</title></head><body><main>{''.join(lines)}</main></body></html>"

    def sitemap(self) -> bytes:
        urls = "".join(f"<url><loc>{SITE}/{path}</loc></url>" for path in self.pages)
        return f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'.encode()


class SiteFetcher:
    def __init__(self, site: Site) -> None:
        self.site = site
        self.robots = self

    # RobotsCache
    def rules(self, url):
        return parse_robots(404, "")

    def allowed(self, url):
        return True

    def get(self, url, kind="html"):
        path = url.removeprefix(SITE + "/")
        if path == "sitemap.xml":
            body = self.site.sitemap()
            return FetchResult(url, url, 200, body, "", "http")
        if path not in self.site.pages:
            return FetchResult(url, url, 404, b"", "", "http", "http_404")
        text = self.site.html(self.site.pages[path])
        return FetchResult(url, url, 200, text.encode(), text, "http")

    def render(self, url):
        return self.get(url)

    def close(self):
        return None


class SiteExtractor:
    """החילוץ "של המודל" הוא מה שהאתר המזויף מחזיק לכל דף."""

    model = "site"

    def __init__(self, site: Site) -> None:
        self.site = site

    def extract(self, page: PageInput):
        return parse_extraction(self.site.pages[page.url.removeprefix(SITE + "/")], ["cooking"], self.model)


def run(db: MemoryDb, site: Site, today: date):
    config = Config([InstitutionConfig(slug="sample-kitchen", website=SITE + "/", categories=("cooking",))])
    summary = run_scraper(
        config=config, db=db, extractor=SiteExtractor(site), today=today, trigger="local",
        limiter=HostLimiter(), workers=1, fetcher_factory=lambda limiter: SiteFetcher(site), log=lambda _: None,
    )
    assert summary.status == "completed"
    return summary


def last_payloads(db: MemoryDb, run_id: int) -> dict[str, dict]:
    return {p["url"].rsplit("/", 1)[-1]: p for p in db.payloads[-run_id:]}


def test_grouped_course_follows_its_pages():
    db = MemoryDb(["cooking"])
    site = Site()
    site.pages = {"c7-1": course_page(1, 7, "2026-12-01"), "c7-2": course_page(2, 7, "2026-12-08"), "c8-1": course_page(1, 8, "2027-02-02")}

    # שבוע 1: קורס אחד, שהמוביל שלו הוא המחזור האחרון.
    run(db, site, date(2026, 11, 16))
    [course_id] = db.course_rows
    course = db.course_rows[course_id]
    assert course["title"] == BASE and course["next_cohort_date"] == "2026-12-01"
    assert [i["title"] for i in course["syllabus"]] == ["בצק פריך", "בצק עלים"]
    assert db.page_rows[f"{SITE}/c8-1"]["course_id"] == course_id
    db.approve_new_courses()

    # שבוע 2: מחזור 7 נפתח, מפגש 2 שלו זז, ונוסף מפגש 3 של מחזור 9.
    site.pages["c7-2"] = course_page(2, 7, "2026-12-09")
    site.pages["c9-3"] = course_page(3, 9, "2027-04-20")
    before = len(db.payloads)
    run(db, site, date(2026, 12, 3))
    week2 = {p["url"].rsplit("/", 1)[-1]: p for p in db.payloads[before:]}
    assert len(db.course_rows) == 1, "דף חדש של הסדרה לא יוצר טיוטה"
    assert week2["c9-3"]["outcome"] == "not_course" and week2["c9-3"]["snapshot"]["extracted"]["series"] == {"member_of_course": course_id}
    assert week2["c7-2"]["outcome"] == "not_course" and week2["c7-2"]["snapshot"]["extracted"]["series"] == {"member_of_course": course_id}
    lead = week2["c8-1"]
    assert lead["outcome"] == "changed" and lead["course_id"] == course_id
    assert db.course_rows[course_id]["next_cohort_date"] == "2026-12-09"  # המחזור הקרוב, עלה לבד כרגיל
    syllabus = [q for q in db.queue if q["kind"] == "field" and q["field"] == "syllabus" and q["status"] == "pending"]
    assert [i["title"] for i in syllabus[0]["new"]] == ["בצק פריך", "בצק עלים", "בצק רבוך"]
    assert {"syllabus_changed", "grouped_pages"} <= set(syllabus[0]["reasons"])
    assert not [q for q in db.queue if q["kind"] == "new_course" and q["status"] == "pending"]

    # שבוע 3: שום דבר לא השתנה. אין חישוב, ואין עותק כפול של המוביל.
    before = len(db.payloads)
    snapshots = len(db.snapshots)
    run(db, site, date(2026, 12, 3))
    assert {p["outcome"] for p in db.payloads[before:]} == {"unchanged"}
    assert len(db.snapshots) == snapshots

    # שבוע 4: מפגש 2 של מחזור 7 ירד מהאתר, ומחזור 7 כבר עבר. המחזור הקרוב הוא 8.
    del site.pages["c7-2"]
    run(db, site, date(2026, 12, 10))
    assert db.course_rows[course_id]["next_cohort_date"] == "2027-02-02"
    assert len(db.course_rows) == 1


def test_member_page_that_is_no_longer_a_course_does_not_break_the_course():
    db = MemoryDb(["cooking"])
    site = Site()
    site.pages = {"c7-1": course_page(1, 7, "2026-12-01"), "c8-1": course_page(1, 8, "2027-02-02")}
    run(db, site, date(2026, 11, 16))
    db.approve_new_courses()
    site.pages["c7-1"] = raw_response(category="cooking", is_course=False)
    site.pages["c7-1"]["fields"]["title"] = {"found": True, "value": "הסדנה הסתיימה", "quote": "הסדנה הסתיימה", "confidence": "high"}
    run(db, site, date(2026, 11, 20))
    assert len(db.course_rows) == 1
    assert db.page_rows[f"{SITE}/c7-1"]["state"] == "not_course"
