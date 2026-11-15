"""דוח הריצה בסוף (סעיף 5, "סיכום הריצה"): ליומן של GitHub Actions ולמסוף. הדוח המלא נשמר ב-scrape_runs."""

from __future__ import annotations

import os
from pathlib import Path

from .run import RunSummary

LABELS = (
    ("pages_checked", "דפים שנבדקו"),
    ("pages_unchanged", "לא השתנו"),
    ("pages_changed", "השתנו"),
    ("pages_new", "דפים חדשים"),
    ("pages_failed", "נכשלו"),
    ("pages_skipped", "דולגו (robots או נדחו)"),
    ("changes_auto", "שינויים שעלו לבד"),
    ("changes_queued", "פריטים לתור האישור"),
    ("courses_missing", "קורסים שסומנו \"ייתכן שאינו פעיל\""),
)
STATUS = {"completed": "הסתיימה", "aborted": "נעצרה בלי לשנות כלום", "failed": "נכשלה באמצע הכתיבה", "nothing": "לא היה מה לאסוף"}


def format_report(summary: RunSummary) -> str:
    lines = [f"## האוסף השבועי: {STATUS.get(summary.status, summary.status)}"]
    if summary.run_id is not None:
        lines.append(f"ריצה מספר {summary.run_id}.")
    if summary.abort_reason:
        lines.append(f"סיבה: {summary.abort_reason}")
    if summary.status in ("completed", "failed"):
        lines += ["", "| | |", "|---|---|"]
        lines += [f"| {label} | {summary.counts.get(key, 0)} |" for key, label in LABELS]
    institutions = summary.report.get("institutions", {})
    if institutions:
        lines += ["", "### לפי מוסד", "", "| מוסד | נמצאו | נבדקו | השתנו | חדשים | נכשלו | לבד | לתור |", "|---|---|---|---|---|---|---|---|"]
        for slug, item in sorted(institutions.items()):
            if "error" in item:
                lines.append(f"| {slug} | נכשל: {item['error']} | | | | | | |")
                continue
            lines.append(
                f"| {slug} | {item.get('discovered', 0)} | {item.get('pages_checked', 0)} | {item.get('pages_changed', 0)} | "
                f"{item.get('pages_new', 0)} | {item.get('pages_failed', 0)} | {item.get('changes_auto', 0)} | {item.get('changes_queued', 0)} |"
            )
        problems = [(slug, e) for slug, item in sorted(institutions.items()) for e in item.get("errors", [])]
        if problems:
            lines += ["", "### תקלות", ""] + [f"- {slug}: {e}" for slug, e in problems[:50]]
    created = summary.report.get("created_institutions", [])
    if created:
        lines += ["", "### מוסדות שנוספו לטבלה (מהרשימה המאושרת)", ""] + [f"- {slug}" for slug in created]
    dropped = summary.report.get("dropped_categories", {})
    if dropped:
        lines += ["", "### תחומים שעוד אין באתר, ולכן לא נאספו", ""] + [f"- {slug}: {', '.join(c)}" for slug, c in sorted(dropped.items())]
    skipped = summary.report.get("skipped_institutions", {})
    if skipped:
        lines += ["", "### מוסדות שדולגו", ""] + [f"- {slug}: {reason}" for slug, reason in sorted(skipped.items())]
    return "\n".join(lines)


def publish_report(summary: RunSummary, echo=print) -> None:
    text = format_report(summary)
    echo(text)
    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with Path(target).open("a", encoding="utf-8") as handle:
            handle.write(text + "\n")
