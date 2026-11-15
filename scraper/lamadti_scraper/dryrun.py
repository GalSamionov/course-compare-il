"""גילוי יבש: לכל מוסד, אילו דפים נמצאו ומאיפה. בלי מודל ובלי מסד.

קורא רק robots.txt, מפות אתר ועמודי רשימה, באותו נימוס של הריצה האמיתית (בקשה לשנייה לכל אתר).
התוצאה עוזרת לכוון את institutions.yaml (include, exclude, max_pages) לפני ריצה אמיתית.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from .config import Config, InstitutionConfig
from .discover import Discovery, discover
from .fetch import Fetcher
from .politeness import HostLimiter

SAMPLE = 5


def _one(inst: InstitutionConfig, limiter: HostLimiter) -> tuple[InstitutionConfig, Discovery | None, str | None]:
    fetcher = Fetcher(limiter)
    try:
        return inst, discover(inst, fetcher, fetcher.robots), None
    except Exception as error:  # מוסד אחד שנכשל לא עוצר את הדוח
        return inst, None, f"{type(error).__name__}: {str(error)[:150]}"
    finally:
        fetcher.close()


def discover_all(config: Config, workers: int = 6, only: list[str] | None = None) -> str:
    targets = [i for i in config.institutions if not only or i.slug in only]
    limiter = HostLimiter()
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        results = list(pool.map(lambda inst: _one(inst, limiter), targets))
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# גילוי יבש של דפי קורסים",
        "",
        f"**נוצר:** {stamp}, עם `uv run python -m lamadti_scraper discover`. בלי מודל ובלי מסד.",
        "",
        "| מוסד | נמצאו | ייקראו | מקורות | בעיות |",
        "|---|---|---|---|---|",
    ]
    details: list[str] = []
    for inst, found, error in sorted(results, key=lambda r: r[0].slug):
        if found is None:
            lines.append(f"| {inst.slug} | | | | נכשל: {error} |")
            continue
        sources = ", ".join(s.replace("https://", "").replace("http://", "") for s in found.sources[:3])
        if len(found.sources) > 3:
            sources += f" ועוד {len(found.sources) - 3}"
        problems = "; ".join(e.replace("|", "/") for e in found.errors[:2])
        lines.append(f"| {inst.slug} | {len(found.seen)} | {len(found.urls)} | {sources} | {problems} |")
        if found.urls:
            details += [f"### {inst.slug}", ""] + [f"- {u}" for u in found.urls[:SAMPLE]] + [""]
    total_read = sum(len(f.urls) for _, f, _ in results if f)
    lines += ["", f"**סך הכול ייקראו בריצה הראשונה:** {total_read} דפים, מ-{len(results)} מוסדות.", "", "## דוגמאות: הדפים הראשונים בתור לכל מוסד", ""]
    return "\n".join(lines + details)
