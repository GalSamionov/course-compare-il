"""ריצה שבועית אחת (סעיף 5): גילוי, הורדה, השוואה, חילוץ והחלטה לכל מוסד, ורק בסוף כתיבה למסד.

המודל לא זמין באמצע: שום דף לא נכתב, והריצה נרשמת כ"נעצרה" (סעיף 5, "כשמשהו נכשל").
"""

from __future__ import annotations

import threading
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any, Callable

from .config import Config, InstitutionConfig
from .db import Db
from .decide import PagePlan, PageState, decide_changed
from .discover import Discovery, discover
from .extract import Extractor, ExtractionFailed, ModelUnavailable, PageInput
from .fetch import Fetcher
from .pagetext import extract_page, needs_browser
from .politeness import HostLimiter

DEFAULT_WORKERS = 4


@dataclass
class InstitutionWork:
    config: InstitutionConfig
    id: str
    pages: dict[str, PageState]
    courses: dict[str, dict[str, Any]]
    categories: tuple[tuple[str, str], ...]  # (slug, name)
    category_ids: dict[str, str]

    def course_for(self, url: str, page: PageState | None) -> str | None:
        if page and page.course_id:
            return page.course_id
        # קורס שגל הזין ידנית, עם אותה כתובת: מקשרים אותו לדף.
        linked = {p.course_id for p in self.pages.values() if p.course_id}
        return next((cid for cid, c in self.courses.items() if c.get("page_url") == url and cid not in linked), None)


@dataclass
class InstitutionResult:
    slug: str
    institution_id: str
    discovery: Discovery
    plans: list[PagePlan] = field(default_factory=list)
    counts: Counter = field(default_factory=Counter)
    errors: list[str] = field(default_factory=list)
    known_active: int = 0


@dataclass
class RunSummary:
    status: str  # nothing | completed | aborted | failed
    run_id: int | None = None
    counts: Counter = field(default_factory=Counter)
    report: dict[str, Any] = field(default_factory=dict)
    abort_reason: str | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def process_institution(
    work: InstitutionWork, fetcher: Any, extractor: Extractor, today: date, stop: threading.Event
) -> InstitutionResult:
    cfg = work.config
    discovery = discover(cfg, fetcher, fetcher.robots)
    result = InstitutionResult(
        slug=cfg.slug,
        institution_id=work.id,
        discovery=discovery,
        errors=list(discovery.errors),
        known_active=sum(1 for p in work.pages.values() if p.state == "active"),
    )
    for url in discovery.urls:
        if stop.is_set():
            raise ModelUnavailable("stopped: another institution hit the model outage")
        page = work.pages.get(url)
        if page and page.state == "ignored":
            result.counts["pages_skipped"] += 1
            continue
        course_id = work.course_for(url, page)
        fetched_at = _now()
        response = fetcher.render(url) if cfg.render == "browser" else fetcher.get(url)
        content = extract_page(response.html, response.final_url) if response.ok else None
        if response.ok and cfg.render != "browser" and needs_browser(response.html, content):
            rendered = fetcher.render(url)
            if rendered.ok:
                response, content = rendered, extract_page(rendered.html, rendered.final_url)
        if response.error == "robots_disallowed":
            result.counts["pages_skipped"] += 1
            continue
        result.counts["pages_checked"] += 1
        if not response.ok or content is None:
            result.counts["pages_failed"] += 1
            result.plans.append(PagePlan(url=url, outcome="failed", fetched_at=fetched_at, course_id=course_id, error=response.error))
            continue
        content_hash = content.hash
        if page and page.last_hash == content_hash:
            result.counts["pages_unchanged"] += 1
            result.plans.append(PagePlan(url=url, outcome="unchanged", fetched_at=fetched_at, course_id=course_id))
            continue
        text = content.for_model()
        try:
            extraction = extractor.extract(PageInput(url=url, text=text, categories=work.categories, today=today))
        except ExtractionFailed as error:
            result.counts["pages_failed"] += 1
            result.plans.append(PagePlan(url=url, outcome="failed", fetched_at=fetched_at, course_id=course_id, error=f"extract: {error}"))
            continue
        result.counts["pages_new" if page is None else "pages_changed"] += 1
        plan = PagePlan(
            url=url,
            outcome="changed",
            fetched_at=fetched_at,
            course_id=course_id,
            snapshot={
                "fetch_method": response.method,
                "content_hash": content_hash,
                "page_text": text,
                "extracted": extraction.to_json(),
                "model": extractor.model,
            },
        )
        decide_changed(
            plan=plan,
            extraction=extraction,
            page_text=text,
            page_title=content.title,
            page=page,
            course=work.courses.get(course_id) if course_id else None,
            today=today,
            institution_slug=cfg.slug,
            category_ids=work.category_ids,
            institution_categories=cfg.categories,
        )
        result.plans.append(plan)
    return result


def _counts_payload(counts: Counter) -> dict[str, int]:
    keys = (
        "pages_checked", "pages_unchanged", "pages_changed", "pages_new", "pages_failed", "pages_skipped",
        "changes_auto", "changes_queued", "courses_missing",
    )
    return {k: int(counts.get(k, 0)) for k in keys}


def run_scraper(
    *,
    config: Config,
    db: Db,
    extractor: Extractor,
    today: date,
    trigger: str,
    limiter: HostLimiter | None = None,
    workers: int = DEFAULT_WORKERS,
    fetcher_factory: Callable[[HostLimiter], Any] = Fetcher,
    log: Callable[[str], None] = print,
) -> RunSummary:
    if not config.institutions:
        log("אין מוסדות מאושרים ב-institutions.yaml. אין מה לאסוף, והמסד לא נפתח.")
        return RunSummary(status="nothing")
    db.preflight()
    limiter = limiter or HostLimiter()
    ids = db.institution_ids([i.slug for i in config.institutions])
    all_categories = db.categories()
    report: dict[str, Any] = {"institutions": {}, "skipped_institutions": {}}
    works: list[InstitutionWork] = []
    for inst in config.institutions:
        if inst.slug not in ids:
            report["skipped_institutions"][inst.slug] = "not in the institutions table"
            continue
        unknown = [c for c in inst.categories if c not in all_categories]
        if unknown:
            report["skipped_institutions"][inst.slug] = f"unknown categories: {', '.join(unknown)}"
            continue
        works.append(
            InstitutionWork(
                config=inst,
                id=ids[inst.slug],
                pages=db.pages(ids[inst.slug]),
                courses=db.courses(ids[inst.slug]),
                categories=tuple((c, all_categories[c][1]) for c in inst.categories),
                category_ids={c: all_categories[c][0] for c in inst.categories},
            )
        )
    for slug, reason in report["skipped_institutions"].items():
        log(f"דילוג על {slug}: {reason}")
    if not works:
        log("אף מוסד מהרשימה לא מוכן לאיסוף.")
        return RunSummary(status="nothing", report=report)

    run_id = db.start_run(trigger, extractor.model)
    summary = RunSummary(status="completed", run_id=run_id, report=report)
    stop = threading.Event()
    results: list[InstitutionResult] = []

    def work_on(work: InstitutionWork) -> InstitutionResult:
        fetcher = fetcher_factory(limiter)
        try:
            return process_institution(work, fetcher, extractor, today, stop)
        finally:
            fetcher.close()

    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = {pool.submit(work_on, w): w for w in works}
        for future in as_completed(futures):
            work = futures[future]
            try:
                results.append(future.result())
            except ModelUnavailable as error:
                if summary.abort_reason is None:
                    summary.abort_reason = f"model unavailable: {error}"
                stop.set()
            except Exception as error:  # תקלה במוסד אחד לא מפילה את האחרים
                report["institutions"][work.config.slug] = {"error": f"{type(error).__name__}: {str(error)[:300]}"}
                log(f"{work.config.slug}: נכשל, {type(error).__name__}: {error}")

    if summary.abort_reason:
        summary.status = "aborted"
        db.finish_run(run_id, "aborted", {}, report, summary.abort_reason)
        log(f"הריצה נעצרה בלי לשנות כלום: {summary.abort_reason}")
        return summary

    try:
        for result in results:
            inst_counts = result.counts
            for plan in result.plans:
                outcome = db.apply_page(run_id, plan.payload(result.institution_id))
                inst_counts["changes_auto"] += int(outcome.get("auto", 0))
                inst_counts["changes_queued"] += int(outcome.get("queued", 0))
            seen = result.discovery.seen
            known = set(p for p, s in next(w for w in works if w.id == result.institution_id).pages.items() if s.state == "active")
            # הגנה: גילוי שמצא פחות מחצי מהדפים המוכרים הוא תקלה בגילוי, לא קורסים שנעלמו (ההחלטה 8).
            if result.discovery.ok and len(known & set(seen)) * 2 >= len(known):
                inst_counts["courses_missing"] += db.mark_missing(run_id, result.institution_id, seen)
            elif known:
                result.errors.append("discovery incomplete: missing pages were not counted this week")
            summary.counts.update(inst_counts)
            report["institutions"][result.slug] = {
                "discovered": len(result.discovery.urls),
                "sources": result.discovery.sources,
                "errors": result.errors[:20],
                **_counts_payload(inst_counts),
            }
    except Exception as error:
        summary.status = "failed"
        summary.abort_reason = f"write failed: {type(error).__name__}: {str(error)[:300]}"
        db.finish_run(run_id, "failed", _counts_payload(summary.counts), report, summary.abort_reason)
        raise
    db.finish_run(run_id, "completed", _counts_payload(summary.counts), report)
    return summary
