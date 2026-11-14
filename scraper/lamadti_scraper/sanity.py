"""בדיקות סבירות (מסמך העיצוב, סעיף 5.5, וההחלטה 3 בתוכנית).

בעיה "קשה" היא ערך שהמסד לא יקבל בכלל (מחוץ ל-check של courses). בעיה רגילה היא ערך חשוד.
כל בעיה שולחת את השדה לתור.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any
from urllib.parse import urlsplit

from .fields import quote_in_page

PRICE_MIN, PRICE_MAX = 50, 100_000
HOURS_MIN, HOURS_MAX = 1, 3_000
MAX_MONTHS = 60
MAX_FUTURE = timedelta(days=730)
VIDEO_HOSTS = {"youtube.com", "www.youtube.com", "youtu.be", "www.youtube-nocookie.com", "vimeo.com", "player.vimeo.com"}

HARD_ISSUES = {"price_out_of_range", "hours_out_of_range", "duration_out_of_range", "bad_date", "video_url_invalid"}


def check_field(name: str, value: Any, today: date, values: dict[str, Any]) -> list[str]:
    if value is None:
        return []
    if name == "site_price_ils" and not PRICE_MIN <= value <= PRICE_MAX:
        return ["price_out_of_range"]
    if name in ("total_hours", "lecture_hours", "hands_on_hours"):
        if not HOURS_MIN <= value <= HOURS_MAX:
            return ["hours_out_of_range"]
        total = values.get("total_hours")
        if name != "total_hours" and isinstance(total, int) and HOURS_MIN <= total <= HOURS_MAX and value > total:
            return ["hours_exceed_total"]
    if name == "duration_months" and not 0 < value <= MAX_MONTHS:
        return ["duration_out_of_range"]
    if name == "next_cohort_date":
        day = date.fromisoformat(value)
        if day < today:
            return ["cohort_in_past"]
        if day > today + MAX_FUTURE:
            return ["cohort_far_future"]
    if name == "video_url":
        parts = urlsplit(value)
        if parts.scheme != "https" or (parts.hostname or "").lower() not in VIDEO_HOSTS:
            return ["video_url_invalid"]
    return []


def check_extraction(fields: dict[str, Any], today: date, page_text: str) -> dict[str, list[str]]:
    """fields: שם השדה -> FieldValue. מחזיר את הבעיות לכל שדה שנמצא."""
    values = {name: fv.value for name, fv in fields.items() if fv.found}
    issues: dict[str, list[str]] = {}
    for name, fv in fields.items():
        found = list(fv.issues)
        if fv.found and fv.value is not None:
            found += check_field(name, fv.value, today, values)
            if not quote_in_page(fv.quote, page_text):
                found.append("quote_not_found")
        if found:
            issues[name] = found
    return issues


def is_hard(issues: list[str]) -> bool:
    return any(i in HARD_ISSUES for i in issues)
