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
