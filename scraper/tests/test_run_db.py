"""שלושה שבועות של אתר הדוגמה מול המסד המקומי, דרך אותו קוד של הריצה האמיתית (בלי Claude)."""

from __future__ import annotations

import pytest

from lamadti_scraper.demo import run_demo

pytestmark = pytest.mark.db


def by_course(rows, slug_suffix):
    return [r for r in rows if r["courses"]["slug"].endswith(slug_suffix)]


def test_three_weeks(local_db):
    result = run_demo(local_db, log=lambda _: None)
    week1, week2, week3 = result.summaries
    db = local_db
    prefix = result.slug

    # שבוע 1: 27 דפי קורס ודף בלוג חדשים. הדף החסום ב-robots דולג.
    assert week1.status == "completed"
    assert week1.counts["pages_new"] == 28
    assert week1.counts["pages_skipped"] == 1
    pages = {p["url"].rsplit("/", 1)[-1]: p for p in db.select("scrape_pages", {"select": "url,state,missing_count,last_snapshot_id", "institution_id": f"eq.{result.institution_id}"})}
    assert "price-list.html" not in pages
    assert pages["how-to-choose-a-course.html"]["state"] == "not_course"
    js_snapshot = db.select("course_snapshots", {"select": "fetch_method", "id": f"eq.{pages['frontend-react.html']['last_snapshot_id']}"})
    assert js_snapshot == [{"fetch_method": "browser"}]

    queue = db.select("course_change_queue", {"select": "run_id,kind,field,status,reasons,courses(slug)", "course_id": "not.is.null", "order": "id"})
    queue = [q for q in queue if q["courses"]["slug"].startswith(prefix)]
    new_courses = [q for q in queue if q["kind"] == "new_course" and q["run_id"] == week1.run_id]
    # 20 פחות שלושה שכבר היו במסד, ועוד קורס אחד לסדרה (4 דפים) ואחד לבוקר וערב. האירוע שעבר לא נכנס.
    assert len(new_courses) == 19
    knife = by_course(new_courses, "")
    assert any("next_cohort_date:cohort_in_past" in q["reasons"] for q in knife)
    assert any("site_price_ils:price_out_of_range" in q["reasons"] for q in knife)

    fullstack_items = {q["field"]: q["reasons"] for q in by_course(queue, "fullstack-evening") if q["run_id"] == week1.run_id}
    assert fullstack_items == {"syllabus": ["syllabus_changed"], "institution_promises": ["promise_changed"]}

    # הסדרה: קורס אחד עם שם הבסיס, המפגשים כסילבוס, והמחזור הקרוב. שאר הדפים נשמרו בלי טיוטה.
    drafts = {c["title"]: c for c in db.select("courses", {"select": "title,syllabus,schedule,next_cohort_date,time_slots,page_url", "institution_id": f"eq.{result.institution_id}"})}
    series = drafts["יסודות האפייה"]
    assert [i["title"] for i in series["syllabus"]] == ["בצק פריך", "בצק עלים", "בצק רבוך"]
    assert series["schedule"] == "3 מפגשים" and series["next_cohort_date"] == "2027-01-05"
    assert series["page_url"].endswith("/baking-basics-c5-1.html")
    assert sorted(drafts["קורס פסטה טרייה"]["time_slots"]) == ["evening", "morning"]
    assert not any("ערב טעימות" in title or "מפגש" in title for title in drafts)
    for member in ("baking-basics-c4-1.html", "baking-basics-c4-2.html", "baking-basics-c4-3.html", "tasting-evening-2024.html"):
        assert pages[member]["state"] == "not_course", member

    # שבוע 2: שינוי קטן עלה לבד, קפיצה במחיר לתור, ניסוח אחר של אותו משפט לא נחשב.
    assert week2.counts["pages_changed"] == 4
    assert week2.counts["pages_unchanged"] == 23
    courses = {c["slug"].removeprefix(prefix + "-"): c for c in db.select("courses", {"select": "slug,status,site_price_ils,next_cohort_date,schedule", "institution_id": f"eq.{result.institution_id}"})}
    assert courses["fullstack-evening"]["site_price_ils"] == 26900
    assert courses["fullstack-evening"]["next_cohort_date"] == "2027-03-07"
    assert courses["python-basics"]["site_price_ils"] == 3900
    assert courses["python-basics"]["schedule"] == "בקצב אישי, השיעורים מוקלטים"
    python_week2 = [q for q in by_course(queue, "python-basics") if q["run_id"] == week2.run_id]
    assert [(q["field"], sorted(q["reasons"])) for q in python_week2] == [("site_price_ils", ["low_confidence", "price_jump"])]

    # שבוע 3: הדף נעלם פעם שנייה ברציפות.
    assert week3.counts["pages_unchanged"] == 27
    assert week3.counts["courses_missing"] == 1
    missing = [q for q in by_course(queue, "psychometric-intensive") if q["kind"] == "maybe_inactive"]
    assert missing and missing[0]["status"] == "pending"
    changes = db.select("course_changes", {"select": "field,new_value,source,courses(slug)", "field": "eq.status", "run_id": f"eq.{week3.run_id}"})
    assert [(c["courses"]["slug"], c["new_value"], c["source"]) for c in changes] == [(f"{prefix}-psychometric-intensive", "maybe_inactive", "auto")]

    # בסוף ההדגמה הקורסים מוסתרים מהאתר המקומי.
    assert {c["status"] for c in courses.values()} == {"draft"}
