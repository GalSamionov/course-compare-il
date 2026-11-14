"""נימוס כלפי אתרי המוסדות: בקשה אחת לשנייה לכל אתר, robots.txt, ושם כללי.

הכללים (מסמך העיצוב, סעיף 5): מכבדים את robots.txt, לא יותר מבקשה אחת לשנייה לכל אתר,
והאוסף מזדהה בשם כללי, בלי פרטים אישיים.
"""

from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass, field
from typing import Callable
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser

# שם כללי. בלי מייל, בלי שם של אדם, ובלי דומיין שעוד לא שלנו.
USER_AGENT = os.environ.get("SCRAPER_USER_AGENT", "CourseCatalogBot/0.1")
# המוצר בלבד, לפי מה ש-robots.txt משווה מול User-agent.
ROBOTS_AGENT = USER_AGENT.split("/")[0]

MIN_INTERVAL_SECONDS = 1.0
# Crawl-delay ארוך מזה כנראה שגוי. מכבדים עד הגבול הזה.
MAX_CRAWL_DELAY_SECONDS = 60.0
LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}


def host_of(url: str) -> str:
    return (urlsplit(url).hostname or "").lower()


def is_local(url: str) -> bool:
    return host_of(url) in LOCAL_HOSTS


class HostLimiter:
    """מרווח מינימלי בין תחילת בקשות לאותו אתר. בטוח בין תהליכונים.

    הנעילה לכל אתר מוחזקת בזמן ההמתנה, כך ששני תהליכונים שפונים לאותו אתר עומדים בתור.
    אתר מקומי (בדיקות בלבד) יכול לקבל מרווח קטן יותר. כל אתר אחר מקבל לפחות שנייה, תמיד.
    """

    def __init__(
        self,
        min_interval: float = MIN_INTERVAL_SECONDS,
        local_interval: float | None = None,
        clock: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        self._min_interval = max(min_interval, MIN_INTERVAL_SECONDS)
        self._local_interval = self._min_interval if local_interval is None else max(local_interval, 0.0)
        self._clock = clock
        self._sleep = sleep
        self._last: dict[str, float] = {}
        self._extra: dict[str, float] = {}
        self._locks: dict[str, threading.Lock] = {}
        self._guard = threading.Lock()

    def set_crawl_delay(self, host: str, seconds: float) -> None:
        with self._guard:
            self._extra[host] = min(max(seconds, 0.0), MAX_CRAWL_DELAY_SECONDS)

    def interval_for(self, host: str) -> float:
        base = self._local_interval if host in LOCAL_HOSTS else self._min_interval
        return max(base, self._extra.get(host, 0.0))

    def _lock(self, host: str) -> threading.Lock:
        with self._guard:
            return self._locks.setdefault(host, threading.Lock())

    def wait(self, host: str) -> None:
        with self._lock(host):
            last = self._last.get(host)
            if last is not None:
                remaining = last + self.interval_for(host) - self._clock()
                if remaining > 0:
                    self._sleep(remaining)
            self._last[host] = self._clock()


@dataclass
class RobotsRules:
    allow_all: bool = False
    deny_all: bool = False
    parser: RobotFileParser | None = None
    sitemaps: list[str] = field(default_factory=list)
    reason: str = ""

    def allowed(self, url: str) -> bool:
        if self.deny_all:
            return False
        if self.allow_all or self.parser is None:
            return True
        return self.parser.can_fetch(ROBOTS_AGENT, url)


def parse_robots(status: int | None, text: str) -> RobotsRules:
    """status=None: תקלת רשת. ההחלטה 6 בתוכנית.

    - 2xx: לפי הקובץ.
    - 401 או 403: אסור הכול (urllib נוהג כך, וזה השמרני).
    - 4xx אחר (בעיקר 404): אין כללים, הכול מותר.
    - 5xx או תקלת רשת: אסור הכול בריצה הזו.
    """
    if status is None or status >= 500:
        return RobotsRules(deny_all=True, reason="robots_unreachable")
    if status in (401, 403):
        return RobotsRules(deny_all=True, reason=f"robots_{status}")
    if status >= 400:
        return RobotsRules(allow_all=True, reason="no_robots")
    parser = RobotFileParser()
    lines = text.splitlines()
    parser.parse(lines)
    sitemaps = [
        line.split(":", 1)[1].strip()
        for line in lines
        if line.lower().startswith("sitemap:") and line.split(":", 1)[1].strip()
    ]
    return RobotsRules(parser=parser, sitemaps=sitemaps)


def robots_url(url: str) -> str:
    parts = urlsplit(url)
    return f"{parts.scheme}://{parts.netloc}/robots.txt"


class RobotsCache:
    """robots.txt אחד לכל אתר בריצה. הקריאה עצמה עוברת דרך הקצב, כמו כל בקשה."""

    def __init__(self, fetch_text: Callable[[str], tuple[int | None, str]], limiter: HostLimiter) -> None:
        self._fetch_text = fetch_text
        self._limiter = limiter
        self._rules: dict[str, RobotsRules] = {}
        self._guard = threading.Lock()

    def rules(self, url: str) -> RobotsRules:
        key = robots_url(url)
        with self._guard:
            cached = self._rules.get(key)
        if cached is not None:
            return cached
        host = host_of(url)
        self._limiter.wait(host)
        status, text = self._fetch_text(key)
        rules = parse_robots(status, text)
        if rules.parser is not None:
            delay = rules.parser.crawl_delay(ROBOTS_AGENT)
            if delay:
                self._limiter.set_crawl_delay(host, float(delay))
        with self._guard:
            self._rules[key] = rules
        return rules

    def allowed(self, url: str) -> bool:
        return self.rules(url).allowed(url)
