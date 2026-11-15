"""הריצה בלי מסד אמיתי: מודל שלא זמין עוצר הכול בלי לכתוב, ובלי מוסדות לא נוגעים במסד."""

from __future__ import annotations

from datetime import date

from lamadti_scraper.config import Config, InstitutionConfig
from lamadti_scraper.extract import ModelUnavailable
from lamadti_scraper.fixtures import serve_fixtures
from lamadti_scraper.politeness import HostLimiter
from lamadti_scraper.run import run_scraper


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
