"""השדות שהאוסף ממלא ב-courses (מסמך העיצוב, סעיף 4), איך כל אחד נשמר ואיך משווים אותו.

הרשימה כאן חייבת להתאים לרשימה הסגורה ב-private.scraper_set_course_field במיגרציה.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from typing import Any

_SPACES = re.compile(r"\s+")
_QUOTES = str.maketrans({"״": '"', "”": '"', "“": '"', "׳": "'", "’": "'", "‘": "'", "–": "-", "—": "-"})


@dataclass(frozen=True)
class Field:
    name: str
    kind: str  # text | int | number | date | choices | syllabus
    label: str  # בעברית, לדוח ולתור
    rule: str  # ההנחיה למודל
    choices: tuple[str, ...] = ()
    max_chars: int = 200


FIELDS: tuple[Field, ...] = (
    Field("title", "text", "שם הקורס", "The course name exactly as the institution writes it.", max_chars=120),
    Field(
        "site_price_ils",
        "int",
        "מחיר באתר",
        "The full price of the whole course in Israeli shekels, as listed on the page. If a sale price is shown next to a "
        "crossed-out regular price, use the regular price. If only installments are listed (for example 12 x 990), multiply "
        "and set confidence to medium. A price per lesson or per month is not the course price unless the page also gives "
        "the number of lessons or months; then multiply and set confidence to medium.",
    ),
    Field("total_hours", "int", "סך השעות", "Total hours of the course (academic or regular hours, as written)."),
    Field("lecture_hours", "int", "שעות הרצאה", "Hours of frontal or recorded lectures, only if the page splits the hours."),
    Field("hands_on_hours", "int", "שעות עשייה", "Hours of practice, labs, projects or hands-on work, only if the page splits the hours."),
    Field("duration_months", "number", "משך בחודשים", "How many months the course lasts. Convert weeks to months (4.3 weeks = 1 month)."),
    Field("schedule", "text", "ימים ושעות", "When the meetings take place: days and hours."),
    Field("formats", "choices", "פורמט", "online when the course is taught online (live or recorded), in_person when it meets in a classroom. Both when both.", choices=("online", "in_person")),
    Field("region", "text", "אזור", "The city or area where the classes meet, in Hebrew. Leave empty for online-only courses.", max_chars=60),
    Field("time_slots", "choices", "מתי", "morning, evening and/or weekend, only when the page says when the meetings are.", choices=("morning", "evening", "weekend")),
    Field(
        "next_cohort_date",
        "date",
        "המחזור הבא",
        "The start date of the next cohort, as YYYY-MM-DD. If several cohorts are listed, the earliest one that has not started "
        "yet. If the year is missing, use the next such date after today and set confidence to medium.",
    ),
    Field("syllabus", "syllabus", "סילבוס", "The list of topics or modules, in order, each as a short title in the page's language (at most 12 words each)."),
    Field("admission", "text", "תנאי קבלה", "Admission requirements: prior knowledge, interview, test, minimum age."),
    Field("class_size_note", "text", "גודל כיתה", "How many students are in a class or cohort."),
    Field("certificate", "text", "תעודה", "Which certificate graduates receive and who issues it."),
    Field(
        "institution_promises",
        "text",
        "הבטחות המוסד",
        "Concrete promises the institution makes: job placement, money back, guaranteed internship, free retake. Only promises, not descriptions.",
    ),
    Field("video_url", "text", "סרטון", "A YouTube or Vimeo link to the institution's own video about this course, from the embedded videos list.", max_chars=300),
)
FIELD_BY_NAME = {f.name: f for f in FIELDS}
TEXT_FIELDS = {f.name for f in FIELDS if f.kind == "text"}


def norm_text(value: str) -> str:
    return _SPACES.sub(" ", value.translate(_QUOTES)).strip()


def same_quote(a: str | None, b: str | None) -> bool:
    return bool(a) and bool(b) and norm_text(a).casefold() == norm_text(b).casefold()


def quote_in_page(quote: str, page_text: str) -> bool:
    if not quote:
        return False
    return norm_text(quote).casefold() in norm_text(page_text).casefold()


def clean_value(field: Field, raw: Any) -> tuple[Any, list[str]]:
    """ערך מהמודל לערך שנשמר. מחזיר (ערך או None כשאין ערך, בעיות)."""
    if field.kind == "text":
        text = norm_text(raw) if isinstance(raw, str) else ""
        return (text[: field.max_chars] or None), []
    if field.kind == "int":
        if isinstance(raw, bool) or not isinstance(raw, (int, float)) or raw <= 0:
            return None, []
        return int(round(raw)), []
    if field.kind == "number":
        if isinstance(raw, bool) or not isinstance(raw, (int, float)) or raw <= 0:
            return None, []
        return round(float(raw), 1), []
    if field.kind == "date":
        if not isinstance(raw, str) or not raw.strip():
            return None, []
        try:
            return date.fromisoformat(raw.strip()[:10]).isoformat(), []
        except ValueError:
            return None, ["bad_date"]
    if field.kind == "choices":
        items = raw if isinstance(raw, list) else []
        return (sorted({i for i in items if i in field.choices}) or None), []
    if field.kind == "syllabus":
        items = raw if isinstance(raw, list) else []
        titles = [norm_text(i)[:120] for i in items if isinstance(i, str) and norm_text(i)]
        return (titles[:40] or None), []
    raise ValueError(field.kind)


def _titles(value: Any) -> list[str]:
    return [norm_text(i["title"] if isinstance(i, dict) else str(i)) for i in (value or [])]


def is_empty(value: Any) -> bool:
    return value is None or value == "" or value == [] or value == {}


def same_value(field: Field, a: Any, b: Any) -> bool:
    """השוואה של ערך במסד או בחילוץ קודם לערך חדש, לפי סוג השדה."""
    if is_empty(a) or is_empty(b):
        return is_empty(a) and is_empty(b)
    if field.kind == "text":
        return norm_text(str(a)) == norm_text(str(b))
    if field.kind == "choices":
        return set(a) == set(b)
    if field.kind == "syllabus":
        return _titles(a) == _titles(b)
    if field.kind == "number":
        return abs(float(a) - float(b)) < 0.05
    return a == b


def to_db(field: Field, value: Any, current: Any = None) -> Any:
    """הערך כפי שנכתב ל-courses. בסילבוס נשמר הסימון "חלש" של נושא שכבר היה."""
    if field.kind == "syllabus" and value is not None:
        weak = {norm_text(i.get("title", "")): bool(i.get("weak")) for i in (current or []) if isinstance(i, dict)}
        return [{"title": t, "weak": weak.get(norm_text(t), False)} for t in value]
    if field.kind == "choices" and value is None:
        return []  # formats ו-time_slots לא יכולים להיות null במסד
    return value
