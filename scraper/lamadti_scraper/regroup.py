"""קורס שאוחד מכמה דפים (series.py) מתעדכן כשאחד הדפים שלו משתנה, נוסף או נעלם.

בריצה הראשונה של קורס מאוחד, דף אחד מוביל (scrape_pages.course_id), ולכל שאר הדפים נשמר עותק בלי קורס.
הקשר נשמר בעותק עצמו, ב-extracted["series"]: אצל המוביל grouped_pages ו-merged (מה שחושב מכל הדפים),
ואצל כל דף אחר member_of (הכתובת של המוביל) או member_of_course (ה-id של הקורס). בלי שינוי במסד.

בכל ריצה כל הדפים נקראים מחדש. כשאחד מהם השתנה, נוסף דף חדש עם אותו שם בסיס, או שדף נעלם, החילוץ המאוחד
מחושב שוב מכל הדפים שעדיין באתר: החילוץ החדש לדף שהשתנה, והאחרון ששמור לכל השאר. התוצאה עוברת את ההחלטה
הרגילה (decide.py) כשינוי בקורס הקיים, דרך הדף המוביל, עם הסיבה grouped_pages. אף פעם לא טיוטה חדשה.

מוגבלת: אם הדף המוביל עצמו נעלם או לא נטען, אין חישוב מחדש (אין דף שהשינוי עובר דרכו). הקורס יסומן
"ייתכן שאינו פעיל" כרגיל, וגל מחליט.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any

from .decide import PagePlan, PageState, decide_changed
from .extract import Extraction, parse_extraction
from .series import NewPage, merge_group, split_title, title_key

GROUPED_REASON = "grouped_pages"


@dataclass
class Fetched:
    """דף שנקרא בהצלחה בריצה הזו. extraction: רק כשהתוכן השתנה (אחרת משתמשים בחילוץ ששמור במסד)."""

    url: str
    fetched_at: str
    content_hash: str
    text: str
    page_title: str
    method: str
    changed: bool
    extraction: Extraction | None = None


def _series(page: PageState | None) -> dict[str, Any]:
    data = (page.last_extracted or {}) if page else {}
    series = data.get("series") if isinstance(data, dict) else None
    return series if isinstance(series, dict) else {}


def _own_title(page: PageState) -> str:
    fields = (page.last_extracted or {}).get("fields") or {}
    title = fields.get("title") or {}
    return str(title.get("value") or "") if title.get("found") else ""


@dataclass
class SeriesIndex:
    """מי מוביל איזה קורס מאוחד, ומי עוד שייך אליו, לפי המצב במסד בתחילת הריצה."""

    lead_of_course: dict[str, str] = field(default_factory=dict)  # course_id -> כתובת המוביל
    course_of_member: dict[str, str] = field(default_factory=dict)  # כתובת -> course_id
    members_of_course: dict[str, list[str]] = field(default_factory=dict)

    @classmethod
    def build(cls, pages: dict[str, PageState], courses: dict[str, dict[str, Any]]) -> "SeriesIndex":
        index = cls()
        course_of_page = {url: p.course_id for url, p in pages.items() if p.course_id and p.course_id in courses}
        for url, page in pages.items():
            if page.state == "ignored":
                continue
            series = _series(page)
            course = series.get("member_of_course")
            if not course and series.get("member_of"):
                course = course_of_page.get(series["member_of"])
            if course and course in courses and page.course_id is None:
                index.course_of_member[url] = course
                index.members_of_course.setdefault(course, []).append(url)
        for url, course_id in course_of_page.items():
            page = pages[url]
            if page.state == "ignored":
                continue
            grouped = course_id in index.members_of_course or bool(_series(page).get("grouped_pages"))
            if not grouped:
                parts = split_title(_own_title(page))
                grouped = parts.marked and parts.key == title_key(courses[course_id].get("title") or "")
            if grouped:
                index.lead_of_course[course_id] = url
        # חבר של קורס שאין לו מוביל (המוביל נדחה או נעלם מהמסד): לא שייך לשום דבר.
        for course_id in list(index.members_of_course):
            if course_id not in index.lead_of_course:
                for url in index.members_of_course.pop(course_id):
                    index.course_of_member.pop(url, None)
        return index

    def lead_course(self, url: str) -> str | None:
        return next((c for c, lead in self.lead_of_course.items() if lead == url), None)


def member_plan(fetched: Fetched, course_id: str, model: str) -> PagePlan:
    """דף של קורס מאוחד שהשתנה: העותק נשמר, בלי טיוטה ובלי פריט בתור משלו."""
    assert fetched.extraction is not None
    extracted = fetched.extraction.to_json()
    extracted["series"] = {"member_of_course": course_id}
    return PagePlan(
        url=fetched.url,
        outcome="not_course",
        fetched_at=fetched.fetched_at,
        snapshot={"fetch_method": fetched.method, "content_hash": fetched.content_hash, "page_text": fetched.text, "extracted": extracted, "model": model},
    )


def _as_new_page(fetched: Fetched, page: PageState | None, category_slugs: list[str]) -> NewPage | None:
    if fetched.extraction is not None:
        extraction = fetched.extraction
    elif page and page.last_extracted:
        extraction = parse_extraction(page.last_extracted, category_slugs, "stored")
        if not extraction.is_course_page:
            return None
    else:
        return None
    new = NewPage(fetched.url, fetched.fetched_at, fetched.content_hash, fetched.text, fetched.page_title, fetched.method, extraction, page)
    new.parts = split_title(new.title)
    return new


def recompute_course(
    *,
    course_id: str,
    index: SeriesIndex,
    pages: dict[str, PageState],
    course: dict[str, Any],
    fetched: dict[str, Fetched],
    new_members: list[NewPage],
    today: date,
    model: str,
    institution_slug: str,
    category_ids: dict[str, str],
    institution_categories: tuple[str, ...],
) -> PagePlan | None:
    """החילוץ המאוחד מכל הדפים שעדיין באתר, וההחלטה עליו מול הקורס. None: אין מה לכתוב דרך המוביל."""
    lead_url = index.lead_of_course[course_id]
    lead_fetched = fetched.get(lead_url)
    lead_page = pages[lead_url]
    if lead_fetched is None:
        return None
    slugs = list(category_ids)
    lead = _as_new_page(lead_fetched, lead_page, slugs)
    if lead is None or not lead.extraction.is_course_page:
        return None  # המוביל כבר לא דף של קורס: ההחלטה הרגילה על הדף
    group = [lead]
    for url in index.members_of_course.get(course_id, []):
        if url in fetched:
            member = _as_new_page(fetched[url], pages.get(url), slugs)
            if member is not None:
                group.append(member)
    for member in new_members:
        member.parts = member.parts or split_title(member.title)
        group.append(member)

    merged = merge_group(group, lead, today)
    lead_own = lead.extraction.to_json()
    lead_own["series"] = {"grouped_pages": [p.url for p in group], "merged": merged.to_json()["fields"]}
    plan = PagePlan(
        url=lead_url,
        outcome="changed",
        fetched_at=lead_fetched.fetched_at,
        course_id=course_id,
        snapshot={"fetch_method": lead_fetched.method, "content_hash": lead_fetched.content_hash, "page_text": lead_fetched.text, "extracted": lead_own, "model": model},
    )
    # ההשוואה ל"שבוע הקודם" היא מול החילוץ המאוחד הקודם, ולא מול הדף המוביל לבדו.
    previous_merged = _series(lead_page).get("merged")
    baseline = PageState(url=lead_url, course_id=course_id, last_extracted={"fields": previous_merged} if isinstance(previous_merged, dict) else None)
    decide_changed(
        plan=plan,
        extraction=merged,
        page_text="\n\n".join(p.text for p in group),
        page_title=lead_fetched.page_title,
        page=baseline,
        course=course,
        today=today,
        institution_slug=institution_slug,
        category_ids=category_ids,
        institution_categories=institution_categories,
        # שם הקורס נשאר כמו שהוא: גל יכול היה לתקן אותו, ושם הבסיס כבר נקבע בריצה הראשונה.
        skip_fields=frozenset({"title"}),
    )
    for queued in plan.queue:
        if GROUPED_REASON not in queued.get("reasons", []):
            queued.setdefault("reasons", []).append(GROUPED_REASON)
    if plan.outcome != "changed":
        return None
    if not lead_fetched.changed and not plan.auto_changes and not plan.queue:
        return None  # שום דבר לא השתנה בקורס, והמוביל עצמו לא השתנה: לא שומרים עותק כפול.
    return plan
