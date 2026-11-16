"""מסד בזיכרון שמחקה את scraper_apply_page (המיגרציה 20261114200001), לבדיקות של כמה שבועות בלי Docker.

רק מה שהריצה צריכה: דפים, קורסים, תור ויומן. לא הרשאות ולא אכיפה של המסד האמיתי (את זה בודק pgTAP).
"""

from __future__ import annotations

import copy
from typing import Any

from lamadti_scraper.decide import PageState


class MemoryDb:
    def __init__(self, categories: list[str]) -> None:
        self._categories = categories
        self.page_rows: dict[str, dict[str, Any]] = {}
        self.course_rows: dict[str, dict[str, Any]] = {}
        self.queue: list[dict[str, Any]] = []
        self.changes: list[dict[str, Any]] = []
        self.snapshots: list[dict[str, Any]] = []
        self.payloads: list[dict[str, Any]] = []
        self.run_id = 0

    # ===== קריאה =====

    def preflight(self) -> None:
        return None

    def institution_ids(self, slugs):
        return {s: f"inst-{s}" for s in slugs}

    def create_institutions(self, rows):
        return []

    def categories(self):
        return {c: (f"cat-{c}", c) for c in self._categories}

    def pages(self, institution_id):
        return {
            url: PageState(url=url, course_id=row["course_id"], state=row["state"], last_hash=row["last_hash"],
                           last_extracted=copy.deepcopy(row["last_extracted"]), fail_count=row["fail_count"])
            for url, row in self.page_rows.items()
            if row["institution_id"] == institution_id
        }

    def courses(self, institution_id):
        return {cid: copy.deepcopy(c) for cid, c in self.course_rows.items() if c["institution_id"] == institution_id}

    # ===== כתיבה, כמו scraper_apply_page =====

    def start_run(self, trigger, model):
        self.run_id += 1
        return self.run_id

    def _enqueue(self, page_url: str, course_id: str | None, item: dict[str, Any]) -> int:
        key = (item["kind"], item.get("field") or "", course_id or f"page:{page_url}")
        for old in self.queue:
            if old["status"] == "pending" and (old["kind"], old.get("field") or "", old["course_id"] or f"page:{old['page']}") == key:
                old["status"] = "superseded"
        self.queue.append({**copy.deepcopy(item), "page": page_url, "course_id": course_id, "status": "pending", "run_id": self.run_id})
        return 1

    def apply_page(self, run_id, payload):
        self.payloads.append(copy.deepcopy(payload))
        url = payload["url"]
        row = self.page_rows.setdefault(url, {
            "institution_id": payload["institution_id"], "course_id": payload.get("course_id"), "state": "active",
            "last_hash": None, "last_extracted": None, "fail_count": 0,
        })
        outcome = payload["outcome"]
        if outcome == "failed":
            row["fail_count"] += 1
            return {"auto": 0, "queued": 0}
        row["fail_count"] = 0
        if outcome == "unchanged":
            return {"auto": 0, "queued": 0}
        course_id = row["course_id"]
        new = payload.get("new_course")
        if new and course_id is None:
            course_id = f"course-{len(self.course_rows) + 1}"
            self.course_rows[course_id] = {
                "id": course_id, "institution_id": payload["institution_id"], "title": new["title"], "status": "draft",
                "page_url": url, "formats": [], "time_slots": [], "syllabus": [], **copy.deepcopy(new["fields"]),
            }
            row["course_id"] = course_id
        snapshot = payload["snapshot"]
        self.snapshots.append({"url": url, "course_id": course_id, **copy.deepcopy(snapshot)})
        row["last_hash"] = snapshot["content_hash"]
        row["last_extracted"] = copy.deepcopy(snapshot["extracted"])
        row["state"] = "not_course" if outcome == "not_course" else "active"
        auto = queued = 0
        for change in payload.get("auto_changes", []):
            course = self.course_rows[course_id]
            if course.get(change["field"]) == change.get("old"):
                course[change["field"]] = copy.deepcopy(change["new"])
                self.changes.append({"course_id": course_id, **copy.deepcopy(change), "source": "auto"})
                auto += 1
            else:
                queued += self._enqueue(url, course_id, {"kind": "field", "field": change["field"], "old": course.get(change["field"]), "new": change["new"], "reasons": ["changed_since_read"]})
        for item in payload.get("queue", []):
            if course_id is None and item["kind"] != "fetch_failed":
                continue
            queued += self._enqueue(url, course_id, item)
        return {"auto": auto, "queued": queued}

    def mark_missing(self, run_id, institution_id, seen):
        return 0

    def finish_run(self, run_id, status, counts, report, abort_reason=None):
        self.finished = (status, abort_reason)

    # ===== עזרים לבדיקות =====

    def approve_new_courses(self) -> None:
        """כמו approve_course_change על כל הקורסים החדשים: הטיוטה עולה לאתר."""
        for item in self.queue:
            if item["kind"] == "new_course" and item["status"] == "pending":
                item["status"] = "approved"
                self.course_rows[item["course_id"]]["status"] = "active"
