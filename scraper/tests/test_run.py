"""הריצה בלי מסד אמיתי: מודל שלא זמין עוצר הכול בלי לכתוב, ובלי מוסדות לא נוגעים במסד."""

from __future__ import annotations

import threading
from datetime import date

from lamadti_scraper.config import Config, InstitutionConfig
from lamadti_scraper.decide import PageState
from lamadti_scraper.extract import ExtractionFailed, ModelUnavailable
from lamadti_scraper.fetch import Fetcher
from lamadti_scraper.fixtures import serve_fixtures
from lamadti_scraper.politeness import HostLimiter
from lamadti_scraper.run import InstitutionWork, process_institution, run_scraper


class FakeDb:
    def __init__(self) -> None:
        self.calls: list[str] = []
        self.finished: tuple | None = None

    def preflight(self) -> None:
        self.calls.append("preflight")

    def institution_ids(self, slugs):
        return {s: f"id-{s}" for s in slugs}

    def categories(self):
        return {"programming": ("cat-p", "תכנות")}

    def pages(self, institution_id):
        return {}

    def courses(self, institution_id):
        return {}

    def start_run(self, trigger, model):
        self.calls.append("start_run")
        return 7

    def apply_page(self, run_id, payload):
        self.calls.append("apply_page")
        return {"auto": 0, "queued": 0}

    def mark_missing(self, run_id, institution_id, seen):
        self.calls.append("mark_missing")
        return 0

    def finish_run(self, run_id, status, counts, report, abort_reason=None):
        self.finished = (status, abort_reason)


class DownExtractor:
    model = "claude-haiku-5-5"

    def extract(self, page):
        raise ModelUnavailable("APIConnectionError: connection refused")


def test_model_outage_writes_nothing():
    db = FakeDb()
    with serve_fixtures() as site:
        config = Config([InstitutionConfig(slug="scraper-demo", website=site.base + "/", categories=("programming",))])
        summary = run_scraper(
            config=config, db=db, extractor=DownExtractor(), today=date(2026, 11, 14), trigger="local",
            limiter=HostLimiter(local_interval=0.0), workers=1, log=lambda _: None,
        )
    assert summary.status == "aborted"
    assert "apply_page" not in db.calls and "mark_missing" not in db.calls
    assert db.finished[0] == "aborted"


def test_no_institutions_does_not_touch_the_database():
    db = FakeDb()
    summary = run_scraper(config=Config(), db=db, extractor=DownExtractor(), today=date(2026, 11, 14), trigger="local", log=lambda _: None)
    assert summary.status == "nothing"
    assert db.calls == []


class FailingExtractor:
    model = "replay"

    def extract(self, page):
        raise ExtractionFailed("not needed here")


def test_requested_page_is_read_even_when_discovery_misses_it():
    """דף שגל אישר מבקשה של מוסד נקרא, גם כשהגילוי לא מצא אותו. דף מבקשה מאתר אחר, או דף שנדחה, לא נקרא."""
    with serve_fixtures() as site:
        # include שלא מתאים לאף דף: הגילוי לא מוצא כלום.
        cfg = InstitutionConfig(slug="scraper-demo", website=site.base + "/", categories=("programming",), include="/nothing-here/")
        requested = site.base + "/courses/home-baking.html"
        ignored = site.base + "/courses/knife-skills.html"
        work = InstitutionWork(
            config=cfg,
            id="id-demo",
            pages={
                requested: PageState(url=requested, source="request"),
                ignored: PageState(url=ignored, source="request", state="ignored"),
                "https://elsewhere.example/course": PageState(url="https://elsewhere.example/course", source="request"),
            },
            courses={},
            categories=(("programming", "תכנות"),),
            category_ids={"programming": "cat-p"},
        )
        fetcher = Fetcher(HostLimiter(local_interval=0.0))
        try:
            result = process_institution(work, fetcher, FailingExtractor(), date(2026, 11, 15), threading.Event())
        finally:
            fetcher.close()
    assert [p.url for p in result.plans] == [requested]
    assert requested in result.discovery.seen


class CatalogDb(FakeDb):
    """מוסד אחד בטבלה, ומוסד מאושר שעוד לא בה. תחום אחד באתר."""

    def __init__(self) -> None:
        super().__init__()
        self.created: list[dict] = []
        self.known = {"inside": "id-inside"}

    def institution_ids(self, slugs):
        return {s: self.known[s] for s in slugs if s in self.known}

    def create_institutions(self, rows):
        self.created += rows
        for row in rows:
            self.known[row["slug"]] = f"id-{row['slug']}"
        return [r["slug"] for r in rows]


def test_approved_institutions_are_created_and_new_categories_are_dropped():
    db = CatalogDb()
    with serve_fixtures() as site:
        config = Config([
            InstitutionConfig(slug="inside", website=site.base + "/", categories=("programming", "ux-ui"), max_pages=1),
            InstitutionConfig(slug="outside", website=site.base + "/", categories=("programming",), name="מוסד", kind="school", max_pages=1),
            InstitutionConfig(slug="new-only", website=site.base + "/", categories=("ux-ui",), name="מוסד", kind="school"),
            InstitutionConfig(slug="no-name", website=site.base + "/", categories=("programming",)),
        ])
        summary = run_scraper(
            config=config, db=db, extractor=DownExtractor(), today=date(2026, 11, 14), trigger="local",
            limiter=HostLimiter(local_interval=0.0), workers=1, log=lambda _: None,
        )
    assert [r["slug"] for r in db.created] == ["outside"]
    assert db.created[0] == {"slug": "outside", "name": "מוסד", "kind": "school", "website": site.base + "/"}
    assert summary.report["dropped_categories"] == {"inside": ["ux-ui"]}
    assert set(summary.report["skipped_institutions"]) == {"new-only", "no-name"}


class RecordingDb(FakeDb):
    """מסד ריק שרושם מה הריצה שולחת לכל דף."""

    def __init__(self) -> None:
        super().__init__()
        self.payloads: list[dict] = []

    def categories(self):
        from tests.fixtures import specs

        return {c: (f"cat-{c}", c) for c in specs.CATEGORIES}

    def apply_page(self, run_id, payload):
        self.payloads.append(payload)
        return {"auto": 0, "queued": len(payload["queue"])}


def test_fixture_site_series_become_one_course_without_a_database():
    """השבוע הראשון של אתר הדוגמה, כמו test_run_db, אבל בלי מסד: מה נשלח לכל דף."""
    from lamadti_scraper.extract import ReplayExtractor
    from lamadti_scraper.fixtures import FIXTURES
    from tests.fixtures import specs

    db = RecordingDb()
    with serve_fixtures() as site:
        config = Config([InstitutionConfig(slug="scraper-demo", website=site.base + "/", categories=tuple(specs.CATEGORIES))])
        summary = run_scraper(
            config=config, db=db, extractor=ReplayExtractor(FIXTURES / "extractions"), today=date(2026, 11, 14),
            trigger="local", limiter=HostLimiter(local_interval=0.0), workers=1, log=lambda _: None,
        )
    assert summary.status == "completed"
    by_page = {p["url"].rsplit("/", 1)[-1]: p for p in db.payloads}
    drafts = {p["new_course"]["title"]: p for p in db.payloads if p["new_course"]}
    assert len(drafts) == 22  # 27 דפי קורס: 4 דפים של הסדרה הם קורס אחד, בוקר וערב קורס אחד, והאירוע שעבר לא נכנס
    series = drafts["יסודות האפייה"]
    assert series["url"].endswith("/baking-basics-c5-1.html")
    assert series["new_course"]["fields"]["schedule"] == "3 מפגשים"
    assert series["new_course"]["fields"]["next_cohort_date"] == "2027-01-05"
    assert "grouped_pages" in series["queue"][0]["reasons"]
    assert sorted(drafts["קורס פסטה טרייה"]["new_course"]["fields"]["time_slots"]) == ["evening", "morning"]
    for member in ("baking-basics-c4-1.html", "baking-basics-c4-2.html", "baking-basics-c4-3.html", "tasting-evening-2024.html"):
        assert by_page[member]["outcome"] == "not_course" and not by_page[member]["queue"], member
    assert by_page["baking-basics-c4-2.html"]["snapshot"]["page_text"]  # העותק של מפגש נשמר
    assert by_page["tasting-evening-2024.html"]["snapshot"]["extracted"]["series"]["past_event"] is True


def test_reextract_sends_an_unchanged_page_of_a_public_course_back_to_the_model():
    """שלב 3, החלטה 5: אחרי שינוי בהנחיה, דף שלא השתנה של קורס שמוצג באתר נקרא שוב. בלי הדגל, או בטיוטה, הוא מדולג."""
    from lamadti_scraper.extract import ReplayExtractor
    from lamadti_scraper.fixtures import FIXTURES
    from lamadti_scraper.pagetext import extract_page

    with serve_fixtures() as site:
        url = site.base + "/courses/python-basics.html"
        cfg = InstitutionConfig(slug="scraper-demo", website=site.base + "/", categories=("programming",), include="/courses/python-basics")
        fetcher = Fetcher(HostLimiter(local_interval=0.0))
        try:
            response = fetcher.get(url)
            content_hash = extract_page(response.html, response.final_url).hash

            def work(status: str) -> InstitutionWork:
                return InstitutionWork(
                    config=cfg,
                    id="id-demo",
                    pages={url: PageState(url=url, course_id="c1", last_hash=content_hash)},
                    courses={"c1": {"id": "c1", "status": status, "title": "Python למתחילים", "page_url": url, "formats": [], "time_slots": [], "syllabus": []}},
                    categories=(("programming", "תכנות"),),
                    category_ids={"programming": "cat-p"},
                )

            extractor = ReplayExtractor(FIXTURES / "extractions")
            today = date(2026, 11, 19)
            plain = process_institution(work("active"), fetcher, extractor, today, threading.Event())
            forced = process_institution(work("active"), fetcher, extractor, today, threading.Event(), reextract=True)
            draft = process_institution(work("draft"), fetcher, extractor, today, threading.Event(), reextract=True)
        finally:
            fetcher.close()
    assert [p.outcome for p in plain.plans] == ["unchanged"]
    assert [p.outcome for p in forced.plans] == ["changed"]
    assert forced.counts["pages_reextracted"] == 1 and forced.counts["pages_changed"] == 0
    # הקורס ריק בבדיקה: שדות עם משפט מהדף עולים לבד (משימה 3).
    assert forced.plans[0].auto_changes
    assert [p.outcome for p in draft.plans] == ["unchanged"]


def test_a_new_institution_gets_its_city_from_the_config():
    """שלב 3: מוסד חדש נוצר עם העיר שלו. מוסד בלי city נוצר כמו קודם, בלי המפתח."""
    db = CatalogDb()
    with serve_fixtures() as site:
        config = Config([
            InstitutionConfig(slug="online-school", website=site.base + "/", categories=("programming",), name="בית ספר", kind="school", city="אונליין", max_pages=1),
        ])
        run_scraper(
            config=config, db=db, extractor=DownExtractor(), today=date(2026, 11, 19), trigger="local",
            limiter=HostLimiter(local_interval=0.0), workers=1, log=lambda _: None,
        )
    assert db.created == [{"slug": "online-school", "name": "בית ספר", "kind": "school", "website": site.base + "/", "city": "אונליין"}]
