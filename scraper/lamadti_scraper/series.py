"""כמה דפים באתר המוסד, קורס אחד אצלנו.

בריצה הראשונה (15.11.2026) כל מפגש בסדרת סדנאות נכנס כקורס נפרד: "בצק פריך (מפגש 1 מתוך 3) מחזור 7",
ועוד 11 כאלה. אותו דבר קורה עם מסלול בוקר ומסלול ערב ("- בוקר", "- ערב"), עם דף הרשמה ("רישום לסדנת ..."),
ועם אותו קורס בשתי כתובות. כאן:
- split_title: מה בשם הוא סימון של מפגש, מחזור, מסלול או תאריך, ומה השם של הקורס עצמו;
- decide_new_pages: דפים חדשים של אותו מוסד עם אותו שם בסיס הופכים לקורס אחד. דף אחד מוביל, והשאר נשמרים
  כעותקים בלי טיוטה משלהם. דף של אירוע שכבר עבר (תאריך מלא בשם) לא נהיה טיוטה.
"""

from __future__ import annotations

import calendar
import copy
import re
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from .extract import Extraction, FieldValue
from .fields import norm_text

# "(מפגש 1 מתוך 3)", "שיעור 2/8", "Session 1 of 4"
SESSION = re.compile(r"\(?\s*(?:מפגש|שיעור|חלק|session|lesson|part)\s*(\d{1,2})\s*(?:מתוך|/|of)\s*(\d{1,2})\s*\)?", re.I)
# "מחזור 7", "מחזור מס' 12", "Cohort #3"
COHORT = re.compile(r"\(?\s*(?:מחזור|cohort)\s*(?:מס['׳]\s*)?#?\s*(\d{1,3})\s*\)?", re.I)
SLOTS = {"בוקר": "morning", "ערב": "evening", "סופש": "weekend", "סוף שבוע": "weekend", "morning": "morning", "evening": "evening", "weekend": "weekend"}
_SLOT_WORD = r"(בוקר|ערב|סופ[\"״'׳]?ש|סוף שבוע|morning|evening|weekend)"
# מסלול רק אחרי מפריד ("- ערב"), כדי ש"סדנת ארוחת ערב" לא תאבד מילה.
SLOT_SUFFIX = re.compile(r"\s*(?:[-–—|,:])\s*" + _SLOT_WORD + r"\s*$", re.I)
MONTHS = {"ינואר": 1, "פברואר": 2, "מרץ": 3, "מרס": 3, "אפריל": 4, "מאי": 5, "יוני": 6, "יולי": 7, "אוגוסט": 8, "ספטמבר": 9, "אוקטובר": 10, "נובמבר": 11, "דצמבר": 12}
FULL_DATE = re.compile(r"(?<![\d.])(\d{1,2})[./](\d{1,2})[./](\d{4}|\d{2})(?![\d.])")
MONTH_DATE = re.compile(r"(?:(\d{1,2})\s+)?ב?(" + "|".join(MONTHS) + r")\s*(\d{4}|\d{2})(?!\d)")
# "6.8 ערב" בסוף השם: תאריך בלי שנה, ואחריו אולי מסלול. לא אחרי מילה לועזית ("Python 3.12").
SHORT_DATE_END = re.compile(r"(?<![A-Za-z]\s)(?<![\d.])(\d{1,2})[./](\d{1,2})(?:\s+" + _SLOT_WORD + r")?\s*$", re.I)
YEAR_END = re.compile(r"\s*[-–—]?\s*ב?-?(20\d{2})\s*$")
COPY = re.compile(r"\s*\((?:העתק|copy)\)\s*", re.I)
REGISTRATION = re.compile(r"^\s*(?:רישום|הרשמה)\s+ל-?\s*", re.I)
GENERIC_LEAD = re.compile(r"^(?:סדנת|סדנה|קורס|השתלמות)\s+", re.I)
SEPARATORS = re.compile(r"\s+[|–—-]\s+|\s*\|\s*")


@dataclass(frozen=True)
class TitleParts:
    base: str  # השם של הקורס עצמו, לתצוגה
    key: str  # להשוואה בין דפים: אותיות קטנות, בלי סימנים
    session: int | None = None
    sessions_total: int | None = None
    session_name: str | None = None  # השם של המפגש עצמו: "בצק פריך"
    cohort: int | None = None
    slot: str | None = None  # morning | evening | weekend
    event_date: date | None = None  # תאריך מלא בשם (או חודש ושנה, או שנה)
    registration: bool = False
    marked: bool = False  # היה בשם סימון כלשהו

    def past_event(self, today: date) -> bool:
        return self.event_date is not None and self.event_date < today


def title_key(text: str) -> str:
    """כמו private.course_title_key במסד: אותיות קטנות, וכל רצף שאינו אות או ספרה הופך לרווח."""
    return re.sub(r"[\W_]+", " ", text.lower()).strip()


def _year(text: str) -> int:
    year = int(text)
    return year + 2000 if year < 100 else year


def _clean(text: str) -> str:
    text = re.sub(r"\(\s*\)", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" \t|-–—:,.")


def split_title(title: str) -> TitleParts:
    raw = norm_text(title or "")
    text = raw
    marked = False
    registration = bool(REGISTRATION.search(text))
    if registration:
        text = REGISTRATION.sub("", text)
        marked = True
    if COPY.search(text):
        text = COPY.sub(" ", text)
        marked = True

    # המחזור נקרא לפני שמקטע המפגש יורד מהשם, כי לפעמים הוא באותו מקטע ("בצק פריך (מפגש 1 מתוך 3) מחזור 7").
    match = COHORT.search(text)
    cohort = int(match.group(1)) if match else None

    session = sessions_total = None
    session_name = None
    match = SESSION.search(text)
    if match:
        session, sessions_total = int(match.group(1)), int(match.group(2))
        marked = True
        segments = [s for s in SEPARATORS.split(text) if s.strip()]
        holder = next((i for i, s in enumerate(segments) if SESSION.search(s)), None)
        if holder is not None and len(segments) > 1:
            # "בסיס | בצק פריך (מפגש 1 מתוך 3) מחזור 7": המקטע עם המפגש הוא השם של המפגש.
            name = _clean(COHORT.sub(" ", SESSION.sub(" ", segments[holder])))
            session_name = name or None
            text = " | ".join(s for i, s in enumerate(segments) if i != holder)
        else:
            text = SESSION.sub(" ", text)

    if cohort is not None:
        text = COHORT.sub(" ", text)
        marked = True

    slot = None
    event: date | None = None
    match = SLOT_SUFFIX.search(text)
    if match:
        slot = SLOTS.get(match.group(1).replace('"', "").replace("״", "").replace("'", "").replace("׳", "").lower())
        text = text[: match.start()]
        marked = True

    match = FULL_DATE.search(text)
    if match:
        day, month, year = int(match.group(1)), int(match.group(2)), _year(match.group(3))
        try:
            event = date(year, month, day)
        except ValueError:
            event = None
        text = text[: match.start()] + " " + text[match.end():]
        marked = True
    else:
        match = MONTH_DATE.search(text)
        if match:
            month, year = MONTHS[match.group(2)], _year(match.group(3))
            day = int(match.group(1)) if match.group(1) else calendar.monthrange(year, month)[1]
            try:
                event = date(year, month, day)
            except ValueError:
                event = None
            text = text[: match.start()] + " " + text[match.end():]
            marked = True
        else:
            match = SHORT_DATE_END.search(text)
            if match and 1 <= int(match.group(1)) <= 31 and 1 <= int(match.group(2)) <= 12:
                if match.group(3):
                    slot = slot or SLOTS.get(match.group(3).replace('"', "").replace("״", "").lower())
                text = text[: match.start()]
                marked = True
            else:
                match = YEAR_END.search(text)
                if match:
                    event = date(int(match.group(1)), 12, 31)
                    text = text[: match.start()]
                    marked = True

    base = _clean(text) or _clean(raw)
    key = title_key(GENERIC_LEAD.sub("", base) if registration else base)
    return TitleParts(
        base=base, key=key, session=session, sessions_total=sessions_total, session_name=session_name, cohort=cohort,
        slot=slot, event_date=event, registration=registration, marked=marked,
    )


@dataclass
class NewPage:
    """דף שהתוכן שלו חדש או השתנה, שעוד אין לו קורס. ההחלטה עליו נדחית עד שכל הדפים של המוסד נקראו."""

    url: str
    fetched_at: str
    content_hash: str
    text: str
    page_title: str
    method: str
    extraction: Extraction
    page: Any = None  # PageState או None
    parts: TitleParts | None = None
    series: dict[str, Any] = field(default_factory=dict)

    @property
    def title(self) -> str:
        fv = self.extraction.fields.get("title")
        return (fv.value if fv and fv.found and fv.value else None) or self.page_title or self.url


def _lead_rank(page: NewPage) -> tuple:
    """הדף שמוביל את הקורס: דף בלי סימון (דף האב), אחריו דף הרשמה, אחריו המחזור האחרון (הוא יחיה הכי הרבה)."""
    parts = page.parts
    assert parts is not None
    return (
        0 if not parts.marked else 1 if parts.registration else 2,
        -(parts.cohort or 0),
        -(parts.session or 0),
        len(page.url),
        page.url,
    )


def _with(fields: dict[str, FieldValue], name: str, value: Any, quote: str, confidence: str = "high") -> None:
    fields[name] = FieldValue(found=True, value=value, quote=quote, confidence=confidence)


def merge_group(group: list[NewPage], lead: NewPage, today: date) -> Extraction:
    """החילוץ של הקורס המאוחד: השם בלי סימונים, המחזור הקרוב, כל המסלולים, והמפגשים כסילבוס."""
    merged = copy.deepcopy(lead.extraction)
    fields = merged.fields
    parts = lead.parts
    assert parts is not None
    title_quote = lead.extraction.fields["title"].quote or lead.title
    _with(fields, "title", parts.base, title_quote)

    upcoming = [
        (p.extraction.fields["next_cohort_date"].value, p.extraction.fields["next_cohort_date"].quote)
        for p in group
        if p.extraction.fields["next_cohort_date"].found
        and p.extraction.fields["next_cohort_date"].value
        and date.fromisoformat(p.extraction.fields["next_cohort_date"].value) >= today
    ]
    if upcoming:
        value, quote = min(upcoming)
        _with(fields, "next_cohort_date", value, quote)

    slots: set[str] = set()
    slot_quote = ""
    for p in group:
        fv = p.extraction.fields["time_slots"]
        if fv.found and fv.value:
            slots.update(fv.value)
            slot_quote = slot_quote or fv.quote
        if p.parts and p.parts.slot:
            slots.add(p.parts.slot)
            slot_quote = slot_quote or p.extraction.fields["title"].quote or p.title
    if slots:
        _with(fields, "time_slots", sorted(slots), slot_quote)

    sessions = sorted({(p.parts.session, p.parts.session_name) for p in group if p.parts and p.parts.session and p.parts.session_name})
    names = [name for _, name in sessions]
    names = [n for i, n in enumerate(names) if n not in names[:i]]
    if len(names) >= 2:
        first = next(p for p in group if p.parts and p.parts.session_name == names[0])
        _with(fields, "syllabus", names, first.extraction.fields["title"].quote or first.title)
    total = max((p.parts.sessions_total or 0 for p in group if p.parts), default=0)
    if total and not fields["schedule"].found:
        holder = next(p for p in group if p.parts and p.parts.sessions_total == total)
        _with(fields, "schedule", f"{total} מפגשים", holder.extraction.fields["title"].quote or holder.title)
    return merged


@dataclass
class Grouped:
    """מה לעשות בכל דף חדש: lead (מוביל קורס), member (חלק מקורס אחר), past_event (אירוע שעבר)."""

    role: str
    page: NewPage
    lead: NewPage | None = None
    group: list[NewPage] = field(default_factory=list)
    existing_course_id: str | None = None


def group_new_pages(pages: list[NewPage], existing_keys: dict[str, str], today: date) -> list[Grouped]:
    """existing_keys: title_key של השם המלא של כל קורס שכבר קיים אצל המוסד (גם טיוטה) -> id.
    דף חדש ששם הבסיס שלו שווה לשם של קורס קיים לא יוצר קורס חדש: הוא עוד דף של אותו קורס (מחזור חדש,
    מסלול, או אותו קורס בכתובת אחרת). השם המלא, ולא הבסיס שלו: טיוטה ישנה בשם "... (מפגש 1 מתוך 3)" לא תבלע סדרה."""
    out: list[Grouped] = []
    groups: dict[str, list[NewPage]] = {}
    for page in pages:
        page.parts = split_title(page.title)
        if page.parts.past_event(today):
            out.append(Grouped(role="past_event", page=page))
            continue
        groups.setdefault(page.parts.key, []).append(page)
    for key, group in groups.items():
        existing = existing_keys.get(key)
        if existing:
            out += [Grouped(role="member", page=p, existing_course_id=existing) for p in group]
            continue
        lead = min(group, key=_lead_rank)
        out.append(Grouped(role="lead", page=lead, lead=lead, group=group))
        out += [Grouped(role="member", page=p, lead=lead, group=group) for p in group if p is not lead]
    return out


def series_info(item: Grouped) -> dict[str, Any]:
    """מה נשמר בעותק של הדף על האיחוד. דף מוביל: כל הדפים. דף חבר: מי מוביל."""
    if item.role == "past_event":
        return {"past_event": True, "event_date": item.page.parts.event_date.isoformat() if item.page.parts and item.page.parts.event_date else None}
    if item.role == "lead":
        return {"grouped_pages": [p.url for p in item.group]} if len(item.group) > 1 else {}
    if item.existing_course_id:
        return {"member_of_course": item.existing_course_id}
    return {"member_of": item.lead.url if item.lead else None}

