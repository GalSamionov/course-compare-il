"""גישה למסד דרך PostgREST, עם המפתח הסודי. אותו מפתח שהאתר והניקוי היומי כבר משתמשים בו,
כך שלא צריך סיסמה נוספת למסד ב-GitHub Secrets.
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlsplit

import httpx

from .decide import PageState
from .fields import FIELDS

PAGE_SIZE = 1000
COURSE_COLUMNS = ",".join(["id", "status", "page_url"] + [f.name for f in FIELDS])


class DbError(RuntimeError):
    pass


def active_categories(rows: list[dict[str, Any]]) -> dict[str, tuple[str, str]]:
    """שורות של categories -> { slug: (id, תווית) }.

    תחום שיצא משימוש (replaced_by לא ריק, למשל ai מ-16.11.2026) לא נכנס: קורס חדש לא נכנס אליו, ומוסד
    שעוד מופיע איתו ב-institutions.yaml מקבל אותו בדוח, כמו תחום שלא קיים.
    התווית היא השם, ואחריו התיאור אם יש. לפיה המודל מבחין, למשל, בין ארבעת תחומי ה-AI.
    """
    result: dict[str, tuple[str, str]] = {}
    for row in rows:
        if row.get("replaced_by"):
            continue
        description = (row.get("description") or "").strip()
        result[row["slug"]] = (row["id"], f"{row['name']}: {description}" if description else row["name"])
    return result


class SchemaMissing(DbError):
    """המיגרציה של האוסף עוד לא הוחלה על המסד הזה."""


class Db:
    def __init__(self, url: str, key: str, client: httpx.Client | None = None) -> None:
        self.url = url.rstrip("/")
        self._client = client or httpx.Client(
            base_url=self.url + "/rest/v1",
            headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            timeout=60.0,
        )

    @property
    def is_local(self) -> bool:
        return (urlsplit(self.url).hostname or "") in ("127.0.0.1", "localhost")

    def _check(self, response: httpx.Response) -> Any:
        if response.status_code >= 400:
            try:
                body = response.json()
                message = body.get("message") or body
                code = body.get("code")
            except ValueError:
                message, code = response.text[:300], None
            if code in ("PGRST205", "42P01", "PGRST202"):
                raise SchemaMissing(f"{code}: {message}")
            raise DbError(f"{response.request.method} {response.request.url.path}: {response.status_code} {code} {message}")
        return response.json() if response.content else None

    def rpc(self, fn: str, args: dict[str, Any]) -> Any:
        return self._check(self._client.post(f"/rpc/{fn}", json=args))

    def select(self, table: str, params: dict[str, str]) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        offset = 0
        while True:
            page = self._check(self._client.get(f"/{table}", params={**params, "limit": str(PAGE_SIZE), "offset": str(offset)}))
            rows.extend(page)
            if len(page) < PAGE_SIZE:
                return rows
            offset += PAGE_SIZE

    def insert(self, table: str, rows: list[dict[str, Any]], on_conflict: str | None = None) -> list[dict[str, Any]]:
        params = {"on_conflict": on_conflict} if on_conflict else {}
        prefer = "return=representation" + (",resolution=merge-duplicates" if on_conflict else "")
        return self._check(self._client.post(f"/{table}", params=params, json=rows, headers={"Prefer": prefer}))

    def insert_missing(self, table: str, rows: list[dict[str, Any]], on_conflict: str) -> list[dict[str, Any]]:
        """מוסיף רק שורות שעוד אין. שורה קיימת לא משתנה. מחזיר את מה שנוסף."""
        prefer = "return=representation,resolution=ignore-duplicates"
        return self._check(self._client.post(f"/{table}", params={"on_conflict": on_conflict}, json=rows, headers={"Prefer": prefer}))

    def update(self, table: str, filters: dict[str, str], values: dict[str, Any]) -> None:
        self._check(self._client.patch(f"/{table}", params=filters, json=values))

    # ===== קריאת המצב לפני הריצה =====

    def preflight(self) -> None:
        self.select("scrape_runs", {"select": "id", "order": "id.desc"})[:1]

    def institution_ids(self, slugs: list[str]) -> dict[str, str]:
        if not slugs:
            return {}
        rows = self.select("institutions", {"select": "id,slug", "slug": f"in.({','.join(slugs)})"})
        return {r["slug"]: r["id"] for r in rows}

    def create_institutions(self, rows: list[dict[str, str]]) -> list[str]:
        """מוסדות מהרשימה המאושרת שעוד לא בטבלה. מוסד קיים לא משתנה. מחזיר את ה-slug של מי שנוסף."""
        added: list[str] = []
        for row in rows:  # שורה אחת לבקשה: PostgREST דורש את אותם מפתחות בכל השורות
            added += [r["slug"] for r in self.insert_missing("institutions", [row], on_conflict="slug")]
        return added

    def categories(self) -> dict[str, tuple[str, str]]:
        """התחומים הפעילים: slug -> (מזהה, השם והתיאור כמו שהמודל רואה אותם)."""
        return active_categories(self.select("categories", {"select": "id,slug,name,description,replaced_by"}))

    def pages(self, institution_id: str) -> dict[str, PageState]:
        rows = self.select(
            "scrape_pages",
            {"select": "url,course_id,state,last_hash,last_extracted,fail_count,source", "institution_id": f"eq.{institution_id}"},
        )
        return {r["url"]: PageState(**r) for r in rows}

    def courses(self, institution_id: str) -> dict[str, dict[str, Any]]:
        rows = self.select("courses", {"select": COURSE_COLUMNS, "institution_id": f"eq.{institution_id}"})
        return {r["id"]: r for r in rows}

    # ===== הכתיבה =====

    def start_run(self, trigger: str, model: str) -> int:
        return int(self.rpc("scraper_start_run", {"p_trigger": trigger, "p_model": model}))

    def apply_page(self, run_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        return self.rpc("scraper_apply_page", {"p_run_id": run_id, "p_page": payload})

    def mark_missing(self, run_id: int, institution_id: str, seen_urls: list[str]) -> int:
        return int(self.rpc("scraper_mark_missing", {"p_run_id": run_id, "p_institution_id": institution_id, "p_seen_urls": seen_urls}))

    def finish_run(self, run_id: int, status: str, counts: dict[str, int], report: dict[str, Any], abort_reason: str | None = None) -> None:
        self.rpc(
            "scraper_finish_run",
            {"p_run_id": run_id, "p_status": status, "p_counts": counts, "p_report": report, "p_abort_reason": abort_reason},
        )

    def close(self) -> None:
        self._client.close()
