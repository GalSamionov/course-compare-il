"""ריצה שבועית אחת (סעיף 5): גילוי, הורדה, השוואה, חילוץ והחלטה לכל מוסד, ורק בסוף כתיבה למסד.

המודל לא זמין באמצע: שום דף לא נכתב, והריצה נרשמת כ"נעצרה" (סעיף 5, "כשמשהו נכשל").
"""

from __future__ import annotations

import threading
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, replace
from datetime import date, datetime, timezone
from typing import Any, Callable

from .config import Config, InstitutionConfig
from .db import Db, DbError
from .decide import PagePlan, PageState, decide_changed
from .discover import Discovery, discover
from .extract import Extractor, ExtractionFailed, ModelUnavailable, PageInput
from .fetch import Fetcher
from .pagetext import extract_page, needs_browser
from .politeness import HostLimiter
from .regroup import Fetched, SeriesIndex, member_plan, recompute_course
from .series import NewPage, group_new_pages, merge_group, series_info, split_title, title_key

DEFAULT_WORKERS = 4


@dataclass
class InstitutionWork:
    config: InstitutionConfig
    id: str
    pages: dict[str, PageState]
    courses: dict[str, dict[str, Any]]
    categories: tuple[tuple[str, str], ...]  # (slug, השם והתיאור: db.active_categories)
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


def add_requested(discovery: Discovery, work: InstitutionWork) -> None:
    """דפים שגל אישר מבקשה של מוסד: נקראים בכל ריצה, גם כשהם לא במפת האתר, מעבר ל-max_pages או מחוץ ל-include.
    רק מהאתר של המוסד עצמו (גם המסד בודק את זה באישור). הם גם "נראו", ולכן לא נספרים כדף שנעלם.
    """
    for url, page in work.pages.items():
        if page.source != "request" or page.state != "active" or not work.config.same_site(url):
            continue
        if url not in discovery.seen:
            discovery.seen.append(url)
        if url not in discovery.urls:
            discovery.urls.append(url)


# קורס שמוצג באתר (ברשימות או בעמוד שלו). --reextract קורא מחדש רק את הדפים שלהם.
PUBLIC_STATUSES = ("active", "maybe_inactive")


def reextract_wanted(work: InstitutionWork, url: str, page: PageState | None, index: SeriesIndex) -> bool:
    """דף של קורס שמוצג באתר, כולל דף נוסף של קורס מאוחד (regroup.py). דף בלי קורס, או של טיוטה, לא."""
    if page is None:
        return False
    course_id = work.course_for(url, page) or index.course_of_member.get(url)
    course = work.courses.get(course_id) if course_id else None
    return course is not None and course.get("status") in PUBLIC_STATUSES


def process_institution(
    work: InstitutionWork, fetcher: Any, extractor: Extractor, today: date, stop: threading.Event, reextract: bool = False
) -> InstitutionResult:
    cfg = work.config
    discovery = discover(cfg, fetcher, fetcher.robots)
    add_requested(discovery, work)
    result = InstitutionResult(
        slug=cfg.slug,
        institution_id=work.id,
        discovery=discovery,
        errors=list(discovery.errors),
        known_active=sum(1 for p in work.pages.values() if p.state == "active"),
    )
    deferred: list[NewPage] = []
    # קורסים מאוחדים (regroup.py): מי מוביל, מי שייך, ומה צריך לחשב מחדש בסוף.
    index = SeriesIndex.build(work.pages, work.courses)
    fetched: dict[str, Fetched] = {}
    recompute: set[str] = set()
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
        text = content.for_model()
        same = bool(page and page.last_hash == content_hash)
        # --reextract (שלב 3): אחרי שינוי בהנחיה, דף שלא השתנה של קורס שמוצג באתר נשלח שוב למודל.
        forced = same and reextract and reextract_wanted(work, url, page, index)
        unchanged = same and not forced
        fetched[url] = Fetched(url, fetched_at, content_hash, text, content.title, response.method, changed=not unchanged)
        if unchanged:
            result.counts["pages_unchanged"] += 1
            result.plans.append(PagePlan(url=url, outcome="unchanged", fetched_at=fetched_at, course_id=course_id))
            continue
        try:
            extraction = extractor.extract(PageInput(url=url, text=text, categories=work.categories, today=today))
        except ExtractionFailed as error:
            result.counts["pages_failed"] += 1
            result.plans.append(PagePlan(url=url, outcome="failed", fetched_at=fetched_at, course_id=course_id, error=f"extract: {error}"))
            continue
        result.counts["pages_reextracted" if forced else "pages_new" if page is None else "pages_changed"] += 1
        fetched[url].extraction = extraction
        series_course = index.lead_course(url) or index.course_of_member.get(url)
        if series_course and extraction.is_course_page:
            # דף של קורס מאוחד השתנה: הקורס מחושב מחדש מכל הדפים שלו, בסוף.
            recompute.add(series_course)
            if url in index.course_of_member:
                result.plans.append(member_plan(fetched[url], series_course, extractor.model))
            continue
        course = work.courses.get(course_id) if course_id else None
        if course is None and extraction.is_course_page and extraction.category is not None:
            # דף חדש שהוא קורס: ההחלטה אחרי שכל הדפים של המוסד נקראו, כדי לאחד מפגשים, מחזורים ומסלולים.
            deferred.append(NewPage(url, fetched_at, content_hash, text, content.title, response.method, extraction, page))
            continue
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
            course=course,
            today=today,
            institution_slug=cfg.slug,
            category_ids=work.category_ids,
            institution_categories=cfg.categories,
            skip_fields=grouped_fields(extraction, content.title, course),
        )
        if plan.outcome == "not_course":
            # דף שאינו קורס: רק הטביעה נשמרת, כדי לדלג עליו בשבוע הבא. הטקסט לא נחוץ ותופס מקום במסד.
            plan.snapshot["page_text"] = ""
        result.plans.append(plan)
    new_plans, joined = decide_new_pages(deferred, work, today, extractor.model)
    result.plans += new_plans
    recompute.update(joined)
    # דף של קורס מאוחד שנעלם מהאתר: המחזור הקרוב או המסלולים אולי היו ממנו.
    if discovery.ok and discovery.complete:
        seen = set(discovery.seen)
        recompute.update(c for c, urls in index.members_of_course.items() if any(u not in seen for u in urls))
    for course_id in sorted(recompute):
        update_series_course(course_id, index, work, fetched, joined.get(course_id, []), today, extractor.model, result)
    return result


def update_series_course(
    course_id: str,
    index: SeriesIndex,
    work: InstitutionWork,
    fetched: dict[str, Fetched],
    new_members: list[NewPage],
    today: date,
    model: str,
    result: InstitutionResult,
) -> None:
    """קורס מאוחד שאחד הדפים שלו השתנה, נוסף או נעלם: חישוב מחדש (regroup.py), והתוכנית של הדף המוביל."""
    lead_url = index.lead_of_course.get(course_id)
    if lead_url is None:
        return
    cfg = work.config
    plan = recompute_course(
        course_id=course_id,
        index=index,
        pages=work.pages,
        course=work.courses[course_id],
        fetched=fetched,
        new_members=new_members,
        today=today,
        model=model,
        institution_slug=cfg.slug,
        category_ids=work.category_ids,
        institution_categories=cfg.categories,
    )
    lead = fetched.get(lead_url)
    if plan is None and lead is not None and lead.changed and lead.extraction is not None:
        # אין חישוב מאוחד (למשל המוביל כבר לא דף של קורס): ההחלטה הרגילה על הדף המוביל.
        plan = PagePlan(
            url=lead_url,
            outcome="changed",
            fetched_at=lead.fetched_at,
            course_id=course_id,
            snapshot={"fetch_method": lead.method, "content_hash": lead.content_hash, "page_text": lead.text, "extracted": lead.extraction.to_json(), "model": model},
        )
        decide_changed(
            plan=plan,
            extraction=lead.extraction,
            page_text=lead.text,
            page_title=lead.page_title,
            page=work.pages.get(lead_url),
            course=work.courses[course_id],
            today=today,
            institution_slug=cfg.slug,
            category_ids=work.category_ids,
            institution_categories=cfg.categories,
            skip_fields=GROUPED_FIELDS,
        )
        if plan.outcome == "not_course":
            plan.snapshot["page_text"] = ""
    if plan is not None:
        # אם רק דף אחר השתנה, המוביל כבר ברשימה כ"לא השתנה": מחליפים אותו.
        result.plans = [p for p in result.plans if p.url != lead_url] + [plan]


# בקורס שאוחד מכמה דפים, השדות האלה באו מכל הדפים. הדף המוביל לבדו לא משנה אותם.
GROUPED_FIELDS = frozenset({"title", "syllabus", "schedule", "time_slots"})


def grouped_fields(extraction: Any, page_title: str, course: dict[str, Any] | None) -> frozenset[str]:
    """הדף מקושר לקורס שהשם שלו הוא שם הבסיס של הדף ("בצק פריך (מפגש 1 מתוך 3)" מול "יסודות האפייה")."""
    if not course or not course.get("title"):
        return frozenset()
    fv = extraction.fields.get("title")
    parts = split_title((fv.value if fv and fv.found and fv.value else None) or page_title)
    return GROUPED_FIELDS if parts.marked and parts.key == title_key(course["title"]) else frozenset()


def decide_new_pages(pages: list[NewPage], work: InstitutionWork, today: date, model: str) -> tuple[list[PagePlan], dict[str, list[NewPage]]]:
    """דפים חדשים של המוסד: קורס אחד לכל קבוצה של אותו שם בסיס (series.py), ואירוע שעבר לא נהיה טיוטה.
    מחזיר גם את הדפים החדשים שהצטרפו לקורס קיים (course_id -> דפים), כדי לחשב אותו מחדש (regroup.py)."""
    existing = {title_key(c["title"]): cid for cid, c in work.courses.items() if c.get("title")}
    plans: list[PagePlan] = []
    joined: dict[str, list[NewPage]] = {}
    for item in group_new_pages(pages, existing, today):
        page = item.page
        extracted = page.extraction.to_json()
        info = series_info(item)
        if info:
            extracted["series"] = info
        plan = PagePlan(
            url=page.url,
            outcome="changed",
            fetched_at=page.fetched_at,
            snapshot={"fetch_method": page.method, "content_hash": page.content_hash, "page_text": page.text, "extracted": extracted, "model": model},
        )
        if item.role == "past_event":
            plan.outcome = "not_course"
            plan.snapshot["page_text"] = ""
        elif item.role == "member":
            # עוד דף של קורס: העותק נשמר, בלי טיוטה ובלי פריט בתור משלו.
            plan.outcome = "not_course"
            if item.existing_course_id:
                joined.setdefault(item.existing_course_id, []).append(page)
        else:
            grouped = len(item.group) > 1
            extraction = merge_group(item.group, page, today) if grouped or (page.parts and page.parts.marked) else page.extraction
            decide_changed(
                plan=plan,
                extraction=extraction,
                # המשפטים של השדות המאוחדים באים מכל הדפים, ולכן הבדיקה שהמשפט בדף רצה על כולם.
                page_text="\n\n".join(p.text for p in item.group),
                page_title=page.page_title,
                page=page.page,
                course=None,
                today=today,
                institution_slug=work.config.slug,
                category_ids=work.category_ids,
                institution_categories=work.config.categories,
            )
            if grouped:
                for queued in plan.queue:
                    if queued["kind"] == "new_course":
                        queued["reasons"].append("grouped_pages")
            if grouped or (page.parts and page.parts.marked):
                # הבסיס לשבוע הבא: מה שחושב מכל הדפים (regroup.py).
                extracted["series"] = {"grouped_pages": [p.url for p in item.group], "merged": extraction.to_json()["fields"]}
        plans.append(plan)
    return plans, joined


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
    reextract: bool = False,
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
    report: dict[str, Any] = {"institutions": {}, "skipped_institutions": {}, "created_institutions": [], "dropped_categories": {}, "reextract": reextract}
    works: list[InstitutionWork] = []
    ready: list[tuple[InstitutionConfig, tuple[str, ...]]] = []
    for inst in config.institutions:
        known = tuple(c for c in inst.categories if c in all_categories)
        unknown = [c for c in inst.categories if c not in all_categories]
        if not known:
            report["skipped_institutions"][inst.slug] = f"no category of this institution is on the site yet: {', '.join(unknown)}"
            continue
        if unknown:
            report["dropped_categories"][inst.slug] = unknown
        if inst.slug not in ids and not (inst.name and inst.kind):
            report["skipped_institutions"][inst.slug] = "not in the institutions table, and no name and kind to create it"
            continue
        ready.append((inst, known))
    # מוסד מהרשימה המאושרת שעוד לא בטבלה נוצר כאן. בלי קורס שאינו טיוטה אין לו עמוד באתר.
    # העיר נשלחת רק כשיש: מוסד בלעדיה נוצר בדיוק כמו קודם.
    missing = [
        {"slug": inst.slug, "name": inst.name, "kind": inst.kind, "website": inst.website, **({"city": inst.city} if inst.city else {})}
        for inst, _ in ready
        if inst.slug not in ids
    ]
    if missing:
        report["created_institutions"] = db.create_institutions(missing)
        ids = db.institution_ids([inst.slug for inst, _ in ready])
    for inst, known in ready:
        works.append(
            InstitutionWork(
                config=replace(inst, categories=known),
                id=ids[inst.slug],
                pages=db.pages(ids[inst.slug]),
                courses=db.courses(ids[inst.slug]),
                categories=tuple((c, all_categories[c][1]) for c in known),
                category_ids={c: all_categories[c][0] for c in known},
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
            return process_institution(work, fetcher, extractor, today, stop, reextract)
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
                try:
                    outcome = db.apply_page(run_id, plan.payload(result.institution_id))
                except DbError as error:
                    # דף אחד שהמסד דוחה (למשל slug שכבר קיים) לא מפיל את הריצה, ולא מבטל את כל מה שכבר חולץ
                    # מהמודל (הריצה המלאה ב-19.11.2026 נפלה כך באמצע השמירה). הדף נרשם בדוח, ונבדק שוב בשבוע הבא.
                    result.errors.append(f"{plan.url}: {str(error)[:200]}")
                    inst_counts["pages_failed"] += 1
                    continue
                inst_counts["changes_auto"] += int(outcome.get("auto", 0))
                inst_counts["changes_queued"] += int(outcome.get("queued", 0))
            known = set(p for p, s in next(w for w in works if w.id == result.institution_id).pages.items() if s.state == "active")
            # רק הדפים המוכרים שנמצאו: מפת אתר יכולה להכיל מאות אלפי כתובות, והמסד צריך רק את אלה.
            seen_known = sorted(known & set(result.discovery.seen)) + [p.url for p in result.plans if p.url not in known]
            # הגנה: גילוי שמצא פחות מחצי מהדפים המוכרים, או שנעצר באמצע, הוא תקלה בגילוי ולא קורסים שנעלמו (ההחלטה 8).
            if result.discovery.ok and result.discovery.complete and len(known & set(result.discovery.seen)) * 2 >= len(known):
                inst_counts["courses_missing"] += db.mark_missing(run_id, result.institution_id, seen_known)
            elif known:
                result.errors.append("discovery incomplete: missing pages were not counted this week")
            summary.counts.update(inst_counts)
            report["institutions"][result.slug] = {
                "discovered": len(result.discovery.urls),
                "sources": result.discovery.sources,
                "errors": result.errors[:20],
                "reextracted": int(inst_counts.get("pages_reextracted", 0)),
                **_counts_payload(inst_counts),
            }
    except Exception as error:
        summary.status = "failed"
        summary.abort_reason = f"write failed: {type(error).__name__}: {str(error)[:300]}"
        db.finish_run(run_id, "failed", _counts_payload(summary.counts), report, summary.abort_reason)
        raise
    db.finish_run(run_id, "completed", _counts_payload(summary.counts), report)
    return summary
