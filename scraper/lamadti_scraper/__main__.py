"""uv run python -m lamadti_scraper <פקודה>

run              הריצה השבועית. צריך SUPABASE_SECRET_KEY, ANTHROPIC_API_KEY, ו-SUPABASE_URL (או NEXT_PUBLIC_SUPABASE_URL).
demo             שלושה שבועות של אתר הדוגמה מול המסד המקומי, עם חילוץ מוקלט. בלי מפתח Anthropic.
discover         גילוי בלבד, בלי מודל ובלי מסד: כמה דפים נמצאו לכל מוסד ומאיפה. לכיוון ההגדרות.
check-fixtures   חילוץ אמיתי עם Claude של 20 דפי הדוגמה, מול החילוץ הצפוי. בלי מסד.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date
from pathlib import Path

from .config import load_config
from .db import Db, SchemaMissing
from .extract import ClaudeExtractor, ReplayExtractor
from .report import publish_report
from .run import run_scraper

DEFAULT_CONFIG = Path(__file__).resolve().parent.parent / "institutions.yaml"


def _db_from_env() -> Db:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        sys.exit("חסר SUPABASE_URL (או NEXT_PUBLIC_SUPABASE_URL) או SUPABASE_SECRET_KEY")
    return Db(url, key)


def cmd_run(args: argparse.Namespace) -> int:
    config = load_config(Path(args.config))
    if args.only:
        wanted = set(args.only)
        unknown = wanted - {i.slug for i in config.institutions}
        if unknown:
            sys.exit(f"לא ב-institutions.yaml: {', '.join(sorted(unknown))}")
        config.institutions = [i for i in config.institutions if i.slug in wanted]
    if not config.institutions:
        print("אין מוסדות מאושרים ב-institutions.yaml. אין מה לאסוף.")
        return 0
    if args.replay:
        extractor = ReplayExtractor(Path(args.replay), args.variant)
    else:
        if not os.environ.get("ANTHROPIC_API_KEY"):
            sys.exit("חסר ANTHROPIC_API_KEY")
        extractor = ClaudeExtractor()
    db = _db_from_env()
    print(f"target: {db.url}")
    try:
        summary = run_scraper(config=config, db=db, extractor=extractor, today=date.today(), trigger=args.trigger, workers=args.workers)
    except SchemaMissing as error:
        print(f"::warning::המיגרציה של האוסף עוד לא הוחלה על המסד הזה ({error}). דילוג.")
        return 0
    publish_report(summary)
    # ריצה שנעצרה (המודל לא זמין) נכשלת ב-Actions, כדי שגל יקבל הודעה. היא תנסה שוב בשבוע הבא.
    return 1 if summary.status in ("aborted", "failed") else 0


def cmd_demo(args: argparse.Namespace) -> int:
    from .demo import run_demo

    db = _db_from_env()
    result = run_demo(db, keep_visible=args.keep_visible)
    print(f"\nמוסד הדוגמה: {result.slug}. הקורסים שלו {'נשארו' if args.keep_visible else 'הוסתרו (טיוטה)'}.")
    return 0


def cmd_discover(args: argparse.Namespace) -> int:
    from .dryrun import discover_all

    config = load_config(Path(args.config))
    if not config.institutions:
        print("אין מוסדות ב-institutions.yaml.")
        return 0
    text = discover_all(config, workers=args.workers, only=args.only)
    if args.out:
        Path(args.out).write_bytes(text.encode("utf-8"))
        print(f"נכתב: {args.out}")
    else:
        print(text)
    return 0


def cmd_check_fixtures(args: argparse.Namespace) -> int:
    from .check import check_fixtures

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("::notice::אין ANTHROPIC_API_KEY. דילוג על בדיקת החילוץ.")
        return 0
    return check_fixtures(ClaudeExtractor())


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")  # מסוף של Windows לא מדפיס עברית בלי זה
    parser = argparse.ArgumentParser(prog="lamadti_scraper")
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run")
    run.add_argument("--config", default=str(DEFAULT_CONFIG))
    run.add_argument("--trigger", default="manual", choices=["schedule", "manual", "local"])
    run.add_argument("--workers", type=int, default=4)
    run.add_argument("--only", nargs="*", help="רק המוסדות האלה (slug), למשל לריצת ניסיון")
    run.add_argument("--replay", help="תיקייה עם חילוץ מוקלט, במקום Claude")
    run.add_argument("--variant")
    run.set_defaults(func=cmd_run)
    demo = sub.add_parser("demo")
    demo.add_argument("--keep-visible", action="store_true", help="לא להסתיר את קורסי הדוגמה בסוף")
    demo.set_defaults(func=cmd_demo)
    dry = sub.add_parser("discover", help="גילוי בלבד: אילו דפים נמצאו לכל מוסד. בלי מודל ובלי מסד")
    dry.add_argument("--config", default=str(DEFAULT_CONFIG))
    dry.add_argument("--workers", type=int, default=6)
    dry.add_argument("--only", nargs="*", help="רק המוסדות האלה (slug)")
    dry.add_argument("--out", help="קובץ Markdown לדוח")
    dry.set_defaults(func=cmd_discover)
    check = sub.add_parser("check-fixtures")
    check.set_defaults(func=cmd_check_fixtures)
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
