"""מפגשים, מחזורים ומסלולים של אותו קורס (series.py). השמות מומצאים, באותו מבנה כמו בריצה האמיתית הראשונה."""

from __future__ import annotations

from datetime import date

from lamadti_scraper.config import InstitutionConfig
from lamadti_scraper.run import InstitutionWork, decide_new_pages, grouped_fields
from lamadti_scraper.series import NewPage, group_new_pages, split_title
from lamadti_scraper.extract import parse_extraction
from tests.helpers import raw_response

TODAY = date(2026, 11, 15)
BASE = "יסודות האפייה"


def test_session_and_cohort_titles():
    parts = split_title(f"{BASE} | בצק פריך (מפגש 1 מתוך 3) מחזור 7")
    assert (parts.base, parts.session, parts.sessions_total, parts.session_name, parts.cohort) == (BASE, 1, 3, "בצק פריך", 7)
    parts = split_title(f"{BASE} | בצק עלים מחזור 8 (מפגש 2 מתוך 3)")
    assert (parts.base, parts.session, parts.session_name, parts.cohort) == (BASE, 2, "בצק עלים", 8)
    assert split_title(f"{BASE} | בצק רבוך (מפגש 3 מתוך 3)").key == split_title(f"רישום לסדנת {BASE}").key
    assert split_title("קורס צילום מחזור 12").base == "קורס צילום"
    assert split_title("Photo course - Session 2 of 6").sessions_total == 6


def test_slots_dates_and_copies():
    assert split_title("קורס פסטה טרייה - ערב").slot == "evening"
    assert split_title("קורס פסטה טרייה - בוקר").key == split_title("קורס פסטה טרייה - ערב").key
    assert split_title("סדנה עם השף 6.8 ערב").base == "סדנה עם השף"
    assert split_title("סדנת עוגות (העתק)").key == split_title("סדנת עוגות").key
    assert split_title("ערב טעימות - 1 מאי 2024").past_event(TODAY) is True
    assert split_title("וובינר ינואר 23").past_event(TODAY) is True
    assert split_title("קורס קונדיטוריה ב2024").past_event(TODAY) is True
    assert split_title("סדנה - 3.2.2027").past_event(TODAY) is False


def test_titles_that_are_not_markers():
    for title in ("סדנת ארוחת ערב", "Python 3.12", "תוכנית לימודים - קורס אמנות הצילום", "קורס Data Analyst"):
        assert split_title(title).marked is False, title
        assert split_title(title).base == title


def page(url: str, title: str, cohort_date: str | None = None, **fields) -> NewPage:
    values = {"title": (title, title)}
    if cohort_date:
        values["next_cohort_date"] = (cohort_date, f"פתיחה: {cohort_date}")
    values.update(fields)
    ext = parse_extraction(raw_response(category="cooking", **values), ["cooking"], "test")
    text = "\n".join(q for _, q, *_ in values.values())
    return NewPage(url=url, fetched_at="2026-11-16T00:00:00Z", content_hash="a" * 64, text=text, page_title=title, method="http", extraction=ext)


def series_pages() -> list[NewPage]:
    return [
        page("https://a.example/c7-1", f"{BASE} | בצק פריך (מפגש 1 מתוך 3) מחזור 7", "2026-12-01", site_price_ils=(1200, 'מחיר: 1,200 ש"ח')),
        page("https://a.example/c7-2", f"{BASE} | בצק עלים (מפגש 2 מתוך 3) מחזור 7", "2026-12-08"),
        page("https://a.example/c7-3", f"{BASE} | בצק רבוך (מפגש 3 מתוך 3) מחזור 7", "2026-12-15"),
        page("https://a.example/c8-1", f"{BASE} | בצק פריך (מפגש 1 מתוך 3) מחזור 8", "2027-02-02", site_price_ils=(1200, 'מחיר: 1,200 ש"ח')),
        page("https://a.example/c6-1", f"{BASE} | בצק פריך (מפגש 1 מתוך 3) מחזור 6", "2026-09-01"),
    ]


def test_one_course_per_series():
    items = group_new_pages(series_pages(), {}, TODAY)
    leads = [i for i in items if i.role == "lead"]
    assert len(leads) == 1 and len([i for i in items if i.role == "member"]) == 4
    assert leads[0].page.url == "https://a.example/c8-1"  # המחזור האחרון חי הכי הרבה


def work(courses: dict | None = None) -> InstitutionWork:
    cfg = InstitutionConfig(slug="sample-kitchen", website="https://a.example/", categories=("cooking",))
    return InstitutionWork(config=cfg, id="inst", pages={}, courses=courses or {}, categories=(("cooking", "בישול"),), category_ids={"cooking": "cat-c"})


def test_series_becomes_one_draft_with_sessions_and_nearest_cohort():
    plans = decide_new_pages(series_pages(), work(), TODAY, "test")
    drafts = [p for p in plans if p.new_course]
    assert len(drafts) == 1
    draft = drafts[0].new_course
    assert draft["title"] == BASE
    assert draft["fields"]["next_cohort_date"] == "2026-12-01"  # הקרוב שעוד לא עבר, לא מחזור 6
    assert [i["title"] for i in draft["fields"]["syllabus"]] == ["בצק פריך", "בצק עלים", "בצק רבוך"]
    assert draft["fields"]["schedule"] == "3 מפגשים"
    assert draft["fields"]["site_price_ils"] == 1200
    [queued] = drafts[0].queue
    assert "grouped_pages" in queued["reasons"]
    members = [p for p in plans if not p.new_course]
    assert len(members) == 4 and all(p.outcome == "not_course" and not p.queue for p in members)
    assert all(p.snapshot["page_text"] for p in members)  # העותק של כל דף נשמר
    assert all(p.snapshot["extracted"]["series"]["member_of"] == "https://a.example/c8-1" for p in members)


def test_morning_and_evening_tracks_are_one_course():
    pages = [
        page("https://a.example/pasta-am", "קורס פסטה טרייה - בוקר", time_slots=(["morning"], "בבקרים")),
        page("https://a.example/pasta-pm", "קורס פסטה טרייה - ערב", time_slots=(["evening"], "בערבים")),
    ]
    [draft] = [p for p in decide_new_pages(pages, work(), TODAY, "test") if p.new_course]
    assert draft.new_course["title"] == "קורס פסטה טרייה"
    assert draft.new_course["fields"]["time_slots"] == ["evening", "morning"]


def test_past_event_and_existing_course():
    pages = [
        page("https://a.example/tasting", "ערב טעימות - 1 מאי 2024"),
        page("https://a.example/c9-1", f"{BASE} | בצק פריך (מפגש 1 מתוך 3) מחזור 9", "2027-04-06"),
    ]
    plans = decide_new_pages(pages, work({"course-1": {"title": BASE, "status": "active"}}), TODAY, "test")
    assert [p.outcome for p in plans] == ["not_course", "not_course"]
    assert not any(p.new_course or p.queue for p in plans)
    assert plans[0].snapshot["extracted"]["series"]["past_event"] is True
    assert plans[1].snapshot["extracted"]["series"]["member_of_course"] == "course-1"


def test_lead_page_of_a_grouped_course_does_not_rename_it():
    ext = parse_extraction(raw_response(category="cooking", title=(f"{BASE} | בצק פריך (מפגש 1 מתוך 3) מחזור 8", "x")), ["cooking"], "test")
    assert grouped_fields(ext, "", {"title": BASE}) == {"title", "syllabus", "schedule", "time_slots"}
    assert grouped_fields(ext, "", {"title": "קורס אחר"}) == frozenset()
