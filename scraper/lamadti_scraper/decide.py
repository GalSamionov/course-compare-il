"""ההחלטה מה עולה לבד ומה עובר לתור (סעיף 5.6, וההחלטה 2 בתוכנית). פונקציות טהורות. שדה ריק שהתמלא: FILL_IN_CONFIDENCE.

התוצאה היא PagePlan, ש-scraper_apply_page במסד כותב בטרנזקציה אחת.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field
from datetime import date
from typing import Any
from urllib.parse import unquote, urlsplit

from .extract import Extraction
from .fields import FIELD_BY_NAME, FIELDS, is_empty, same_quote, same_value, to_db
from .sanity import check_extraction, is_hard

PRICE_AUTO_MAX_RATIO = 0.20
# שדות שתמיד עוברים לתור כשהם משתנים. ההחלטה 2.
ALWAYS_QUEUE = {
    "syllabus": "syllabus_changed",
    "institution_promises": "promise_changed",
    "title": "title_changed",
}
# שדה שהיה ריק בקורס ומקבל ערך: עולה לבד גם בביטחון בינוני, כל עוד המשפט נמצא בדף והערך סביר
# (שלב 3, החלטה 5, 19.11.2026). אחרי החילוץ מחדש של כל הקורסים, השדות שהתמלאו לא מחכים כולם בתור.
# ביטחון נמוך, מחיר ראשון (price_new), וסילבוס, הבטחות ושם הקורס (ALWAYS_QUEUE) עוברים לתור כמו קודם.
FILL_IN_CONFIDENCE = frozenset({"high", "medium"})


@dataclass
class PageState:
    """שורה מ-scrape_pages, ולצידה הסטטוס של הקורס המקושר."""

    url: str
    course_id: str | None = None
    state: str = "active"
    last_hash: str | None = None
    last_extracted: dict[str, Any] | None = None
    fail_count: int = 0
    # request: גל אישר את הדף מבקשה של מוסד (/institutions/join). נקרא בכל ריצה, גם כשהוא לא במפת האתר.
    source: str = "discovered"


@dataclass
class PagePlan:
    url: str
    outcome: str  # unchanged | changed | not_course | failed
    fetched_at: str
    course_id: str | None = None
    error: str | None = None
    snapshot: dict[str, Any] | None = None
    new_course: dict[str, Any] | None = None
    auto_changes: list[dict[str, Any]] = field(default_factory=list)
    queue: list[dict[str, Any]] = field(default_factory=list)

    def payload(self, institution_id: str) -> dict[str, Any]:
        return {
            "institution_id": institution_id,
            "url": self.url,
            "outcome": self.outcome,
            "fetched_at": self.fetched_at,
            "course_id": self.course_id,
            "error": self.error,
            "snapshot": self.snapshot,
            "new_course": self.new_course,
            "auto_changes": self.auto_changes,
            "queue": self.queue,
        }


def make_slug(institution_slug: str, url: str) -> str:
    """slug של טיוטה: המוסד, החלק האחרון בכתובת (אם הוא באנגלית), וקיצור של הכתובת. גל יכול לשנות באישור."""
    last = unquote(urlsplit(url).path.rstrip("/").rsplit("/", 1)[-1]).lower().removesuffix(".html")
    words = re.sub(r"[^a-z0-9]+", "-", last).strip("-")[:40].strip("-") or "course"
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:6]
    return f"{institution_slug}-{words}-{digest}"


def _reasons(name: str, fv: Any, issues: dict[str, list[str]]) -> list[str]:
    reasons = list(issues.get(name, []))
    if fv.confidence != "high":
        reasons.append("low_confidence")
    return reasons


def _new_course(
    *,
    plan: PagePlan,
    extraction: Extraction,
    issues: dict[str, list[str]],
    page_title: str,
    institution_slug: str,
    category_ids: dict[str, str],
    institution_categories: tuple[str, ...],
    existing_course: dict[str, Any] | None,
) -> None:
    """קורס חדש: טיוטה עם השדות הנקיים, ופריט אחד לתור עם כל השדות והסיבות."""
    clean: dict[str, Any] = {}
    reasons = ["new_course"]
    summary: dict[str, Any] = {}
    for f in FIELDS:
        fv = extraction.fields[f.name]
        if not fv.found:
            continue
        summary[f.name] = {"value": fv.value, "quote": fv.quote, "confidence": fv.confidence, "issues": issues.get(f.name, [])}
        field_reasons = _reasons(f.name, fv, issues)
        reasons += [f"{f.name}:{r}" for r in field_reasons]
        if fv.value is not None and not field_reasons:
            clean[f.name] = to_db(f, fv.value, (existing_course or {}).get(f.name))
    title = clean.pop("title", None) or (extraction.fields["title"].value if not is_hard(issues.get("title", [])) else None) or page_title or plan.url
    category = extraction.category if extraction.category in institution_categories else institution_categories[0]
    if existing_course is not None:
        # טיוטה שעוד מחכה לאישור: מעדכנים אותה, ופריט חדש בתור מחליף את הקודם.
        for name, value in clean.items():
            old = existing_course.get(name)
            if not same_value(FIELD_BY_NAME[name], old, value):
                plan.auto_changes.append({"field": name, "old": old, "new": value, "quote": summary[name]["quote"]})
        plan.queue.append({"kind": "new_course", "field": None, "old": None, "new": summary, "quote": None, "confidence": None, "reasons": reasons})
        return
    plan.new_course = {
        "slug": make_slug(institution_slug, plan.url),
        "category_id": category_ids[category],
        "title": str(title)[:120],
        "fields": clean,
    }
    plan.queue.append({"kind": "new_course", "field": None, "old": None, "new": summary, "quote": None, "confidence": None, "reasons": reasons})


def decide_changed(
    *,
    plan: PagePlan,
    extraction: Extraction,
    page_text: str,
    page_title: str,
    page: PageState | None,
    course: dict[str, Any] | None,
    today: date,
    institution_slug: str,
    category_ids: dict[str, str],
    institution_categories: tuple[str, ...],
    skip_fields: frozenset[str] = frozenset(),
) -> PagePlan:
    """דף שהתוכן שלו השתנה (או חדש), אחרי החילוץ. course: השורה הנוכחית מ-courses, כולל status.
    skip_fields: שדות שלא משווים בקורס קיים. בקורס שאוחד מכמה דפים (series.py) הדף המוביל הוא רק מפגש או מסלול
    אחד, והשם, הסילבוס, הימים והמסלולים של הקורס באו מכל הדפים יחד."""
    if not extraction.is_course_page:
        plan.outcome = "not_course"
        if course is not None and course.get("status") in ("active", "maybe_inactive"):
            plan.queue.append({"kind": "maybe_inactive", "field": None, "old": None, "new": None, "quote": None, "confidence": None, "reasons": ["page_not_course"]})
        return plan

    if course is None and extraction.category is None:
        # קורס בתחום שהמוסד לא אושר בו (המודל ענה "none"): לא יוצרים טיוטה.
        plan.outcome = "not_course"
        return plan

    plan.outcome = "changed"
    issues = check_extraction(extraction.fields, today, page_text)
    common = dict(
        plan=plan,
        extraction=extraction,
        issues=issues,
        page_title=page_title,
        institution_slug=institution_slug,
        category_ids=category_ids,
        institution_categories=institution_categories,
    )
    if course is None:
        _new_course(**common, existing_course=None)
        return plan
    if course.get("status") == "draft":
        _new_course(**common, existing_course=course)
        return plan
    if course.get("status") == "removed":
        return plan  # רק העותק נשמר

    previous = ((page.last_extracted if page else None) or {}).get("fields") or {}
    for f in FIELDS:
        if f.name in skip_fields:
            continue
        fv = extraction.fields[f.name]
        prev = previous.get(f.name)
        old = course.get(f.name)
        # מה שלא השתנה בחילוץ מאז השבוע הקודם לא נוגעים בו. כך תיקון ידני של גל, או שינוי
        # שנדחה בתור, לא חוזר כל שבוע.
        if prev is not None:
            if not prev.get("found") and not fv.found:
                continue
            if prev.get("found") and fv.found and same_value(f, prev.get("value"), fv.value):
                continue
            if f.kind == "text" and prev.get("found") and fv.found and same_quote(prev.get("quote"), fv.quote):
                continue  # רק ניסוח אחר של אותו משפט
        if not fv.found or fv.value is None:
            if fv.found and issues.get(f.name):
                plan.queue.append({"kind": "field", "field": f.name, "old": old, "new": None, "quote": fv.quote, "confidence": fv.confidence, "reasons": issues[f.name]})
            elif not is_empty(old):
                # אישור בתור ימחק את הערך. ברשימות זה [] ולא null, כי העמודה לא מקבלת null.
                plan.queue.append({"kind": "field", "field": f.name, "old": old, "new": to_db(f, None), "quote": None, "confidence": None, "reasons": ["not_on_page"]})
            continue
        new = to_db(f, fv.value, old)
        if same_value(f, old, new):
            continue
        reasons = _reasons(f.name, fv, issues)
        if is_empty(old) and fv.confidence in FILL_IN_CONFIDENCE:
            reasons = [r for r in reasons if r != "low_confidence"]
        if f.name == "site_price_ils":
            if is_empty(old):
                reasons.append("price_new")
            elif abs(new - old) / old > PRICE_AUTO_MAX_RATIO:
                reasons.append("price_jump")
        if f.name in ALWAYS_QUEUE:
            reasons.append(ALWAYS_QUEUE[f.name])
        change = {"field": f.name, "old": old, "new": new, "quote": fv.quote}
        if reasons:
            plan.queue.append({"kind": "field", **change, "confidence": fv.confidence, "reasons": reasons})
        else:
            plan.auto_changes.append(change)
    return plan
