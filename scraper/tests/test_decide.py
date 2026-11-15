from datetime import date

from lamadti_scraper.decide import PagePlan, PageState, decide_changed, make_slug
from lamadti_scraper.sanity import check_field
from tests.helpers import extraction

TODAY = date(2026, 11, 14)
PAGE_TEXT = """פיתוח תוכנה לדוגמה
מחיר: 11,000 ש"ח
מחיר: 13,000 ש"ח
מחיר: 12,000 ש"ח
120 שעות
פתיחה ב-1.2.2027
פתיחה ב-1.3.2027
פתיחה ב-1.1.2026
מפגשים בימי שני ורביעי בערב
מפגשים בימי שני ורביעי, 18:00-21:30
HTML, React
HTML, React, Node
הבטחת השמה"""
CATS = {"programming": "cat-p", "ai": "cat-ai"}


def run(ext, course=None, page=None):
    plan = PagePlan(url="https://a.example/courses/web-dev", outcome="changed", fetched_at="2026-11-14T00:00:00Z")
    return decide_changed(
        plan=plan,
        extraction=ext,
        page_text=PAGE_TEXT,
        page_title="פיתוח תוכנה",
        page=page,
        course=course,
        today=TODAY,
        institution_slug="sample-college",
        category_ids=CATS,
        institution_categories=("programming", "ai"),
    )


def course(**values):
    base = {"status": "active", "title": "פיתוח תוכנה לדוגמה", "formats": [], "time_slots": [], "syllabus": []}
    base.update(values)
    return base


def test_new_course_is_a_draft_and_goes_to_the_queue():
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), site_price_ils=(12000, 'מחיר: 12,000 ש"ח'), total_hours=(120, "120 שעות", "medium")))
    assert plan.new_course["title"] == "פיתוח תוכנה לדוגמה"
    assert plan.new_course["category_id"] == "cat-p"
    assert plan.new_course["fields"] == {"site_price_ils": 12000}  # שעות בביטחון בינוני לא נכנסות לטיוטה
    assert plan.new_course["slug"].startswith("sample-college-web-dev-")
    [item] = plan.queue
    assert item["kind"] == "new_course"
    assert "total_hours:low_confidence" in item["reasons"]


def test_small_price_change_goes_up_alone():
    plan = run(extraction(site_price_ils=(11000, 'מחיר: 11,000 ש"ח')), course=course(site_price_ils=10000))
    assert plan.auto_changes == [{"field": "site_price_ils", "old": 10000, "new": 11000, "quote": 'מחיר: 11,000 ש"ח'}]
    # השם נעלם מהדף: לא מוחקים לבד, שואלים את גל.
    assert plan.queue == [{"kind": "field", "field": "title", "old": "פיתוח תוכנה לדוגמה", "new": None, "quote": None, "confidence": None, "reasons": ["not_on_page"]}]


def test_price_jump_goes_to_the_queue():
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), site_price_ils=(13000, 'מחיר: 13,000 ש"ח')), course=course(site_price_ils=10000))
    assert plan.auto_changes == []
    assert plan.queue[0]["reasons"] == ["price_jump"]


def test_cohort_date_change_goes_up_alone_but_past_date_is_queued():
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), next_cohort_date=("2027-03-01", "פתיחה ב-1.3.2027")), course=course(next_cohort_date="2027-02-01"))
    assert [c["field"] for c in plan.auto_changes] == ["next_cohort_date"]
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), next_cohort_date=("2026-01-01", "פתיחה ב-1.1.2026")), course=course(next_cohort_date="2027-02-01"))
    assert plan.queue[0]["reasons"] == ["cohort_in_past"]


def test_syllabus_and_promises_always_queued():
    plan = run(
        extraction(
            title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"),
            syllabus=(["HTML", "React", "Node"], "HTML, React, Node"),
            institution_promises=("המוסד מבטיח עזרה בהשמה", "הבטחת השמה"),
        ),
        course=course(syllabus=[{"title": "HTML", "weak": False}, {"title": "React", "weak": True}]),
    )
    reasons = {item["field"]: item["reasons"] for item in plan.queue}
    assert reasons == {"syllabus": ["syllabus_changed"], "institution_promises": ["promise_changed"]}
    syllabus = next(i for i in plan.queue if i["field"] == "syllabus")
    assert syllabus["new"][1] == {"title": "React", "weak": True}  # הסימון "חלש" נשמר


def test_unsure_or_unquoted_field_is_queued():
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), total_hours=(120, "120 שעות", "low")), course=course())
    assert plan.queue[0]["reasons"] == ["low_confidence"]
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), total_hours=(120, "משפט שלא קיים בדף")), course=course())
    assert plan.queue[0]["reasons"] == ["quote_not_found"]


def test_unchanged_extraction_does_not_undo_a_manual_fix():
    previous = {"fields": {"site_price_ils": {"found": True, "value": 12000, "quote": 'מחיר: 12,000 ש"ח', "confidence": "high"}}}
    page = PageState(url="https://a.example/courses/web-dev", course_id="c1", last_extracted=previous)
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), site_price_ils=(12000, 'מחיר: 12,000 ש"ח')), course=course(site_price_ils=9500), page=page)
    assert plan.auto_changes == [] and plan.queue == []


def test_rewording_of_the_same_sentence_is_not_a_change():
    previous = {"fields": {"schedule": {"found": True, "value": "שני ורביעי בערב", "quote": "מפגשים בימי שני ורביעי בערב", "confidence": "high"}}}
    page = PageState(url="u", course_id="c1", last_extracted=previous)
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), schedule=("ימי שני ורביעי, בערבים", "מפגשים בימי שני ורביעי בערב")), course=course(schedule="שני ורביעי בערב"), page=page)
    assert plan.auto_changes == [] and plan.queue == []
    plan = run(extraction(title=("פיתוח תוכנה לדוגמה", "פיתוח תוכנה לדוגמה"), schedule=("שני ורביעי 18:00-21:30", "מפגשים בימי שני ורביעי, 18:00-21:30")), course=course(schedule="שני ורביעי בערב"), page=page)
    assert [c["field"] for c in plan.auto_changes] == ["schedule"]


def test_page_that_is_no_longer_a_course():
    plan = run(extraction(is_course=False), course=course())
    assert plan.outcome == "not_course"
    assert plan.queue[0]["kind"] == "maybe_inactive"


def test_sanity_rules():
    assert check_field("site_price_ils", 40, TODAY, {}) == ["price_out_of_range"]
    assert check_field("site_price_ils", 100_001, TODAY, {}) == ["price_out_of_range"]
    assert check_field("total_hours", 3001, TODAY, {}) == ["hours_out_of_range"]
    assert check_field("hands_on_hours", 200, TODAY, {"total_hours": 120}) == ["hours_exceed_total"]
    assert check_field("next_cohort_date", "2030-01-01", TODAY, {}) == ["cohort_far_future"]
    assert check_field("video_url", "http://example.com/v", TODAY, {}) == ["video_url_invalid"]
    assert check_field("video_url", "https://www.youtube.com/embed/abc", TODAY, {}) == []


def test_slug_matches_the_database_rule():
    import re

    assert re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", make_slug("sample-college", "https://a.example/%D7%A7%D7%95%D7%A8%D7%A1"))
    assert make_slug("sample-college", "https://a.example/courses/Full_Stack.html").startswith("sample-college-full-stack-")
