"""רשימת המוסדות המאושרים: scraper/institutions.yaml (ההחלטה 1 בתוכנית).

מוסד נכנס לקובץ רק אחרי אישור של גל, והוא חייב כבר להיות בטבלה institutions במסד.
האוסף לא יוצר מוסדות.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit

import yaml

SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
DEFAULT_MAX_PAGES = 100
HARD_MAX_PAGES = 500
KINDS = ("college", "school", "independent", "university", "other")
# העיר של המוסד (institutions.city, שלב 3): עיר אחת בעברית, או "אונליין" למוסד שמלמד רק אונליין.
# "כמה סניפים" ו"לא נמצא" מהמחקר הם לא עיר: אז פשוט בלי city. אותו כלל כמו בבדיקה במסד (2 עד 40 תווים).
CITY = re.compile(r"^[֐-׿][֐-׿\s\-'\"׳״]{1,39}$")
NOT_A_CITY = frozenset({"כמה סניפים", "לא נמצא"})
# כתובות שכמעט אף פעם אינן דף של קורס. חלות על כל מוסד, לפני ההגדרה שלו, כדי לא לשלם על בלוג ותגיות.
DEFAULT_EXCLUDE = re.compile(
    r"/(blog|blogs|news|articles?|magazine|tag|tags|category|categories|author|authors|wp-content|wp-json|feed|"
    r"cart|checkout|my-account|login|privacy|terms|accessibility|careers|jobs|contact|about|search)(/|$|\?)"
    r"|\.(pdf|jpe?g|png|gif|webp|svg|mp4|mp3|zip|docx?|xlsx?)($|\?)",
    re.I,
)


class ConfigError(ValueError):
    pass


@dataclass(frozen=True)
class InstitutionConfig:
    slug: str
    website: str
    categories: tuple[str, ...]
    sitemap: str = "auto"  # auto | none | כתובת
    listing_urls: tuple[str, ...] = ()
    include: str | None = None
    exclude: str | None = None
    render: str = "auto"  # auto | browser
    max_pages: int = DEFAULT_MAX_PAGES
    # דפי קורס שכבר ידועים (מהרשימה המאושרת). תמיד נקראים, וכתובות דומות להן קודמות בתור.
    course_urls: tuple[str, ...] = ()
    # השם והסוג, כדי שהאוסף ייצור את המוסד בטבלה אם הוא עוד לא שם. המוסד אושר כבר כשנכנס לקובץ.
    name: str | None = None
    kind: str | None = None
    # נכתבת רק כשהאוסף יוצר את המוסד. מוסד שכבר בטבלה לא משתנה (העיר שלו מ-supabase/fixes).
    city: str | None = None

    @property
    def host(self) -> str:
        return (urlsplit(self.website).hostname or "").lower()

    def same_site(self, url: str) -> bool:
        """האתר של המוסד או תת-דומיין שלו (blog.example.co.il), עם או בלי www. סעיף 5, כללים."""
        host = (urlsplit(url).hostname or "").lower().removeprefix("www.")
        base = self.host.removeprefix("www.")
        return bool(base) and (host == base or host.endswith("." + base))

    def wants(self, url: str) -> bool:
        if not self.same_site(url):
            return False
        if url in self.course_urls:
            return True
        if DEFAULT_EXCLUDE.search(urlsplit(url).path):
            return False
        if self.include and not re.search(self.include, url):
            return False
        if self.exclude and re.search(self.exclude, url):
            return False
        return True


@dataclass
class Config:
    institutions: list[InstitutionConfig] = field(default_factory=list)


def _url(value: object, where: str) -> str:
    if not isinstance(value, str) or urlsplit(value).scheme not in ("http", "https") or not urlsplit(value).hostname:
        raise ConfigError(f"{where}: expected an http(s) URL, got {value!r}")
    return value


def _regex(value: object, where: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ConfigError(f"{where}: expected a regex string")
    try:
        re.compile(value)
    except re.error as error:
        raise ConfigError(f"{where}: bad regex: {error}") from error
    return value


def parse_config(data: object) -> Config:
    if data is None:
        return Config()
    if not isinstance(data, dict):
        raise ConfigError("the file must be a mapping with an 'institutions' list")
    items = data.get("institutions") or []
    if not isinstance(items, list):
        raise ConfigError("'institutions' must be a list")
    seen: set[str] = set()
    result: list[InstitutionConfig] = []
    for index, item in enumerate(items):
        where = f"institutions[{index}]"
        if not isinstance(item, dict):
            raise ConfigError(f"{where}: expected a mapping")
        slug = item.get("slug")
        if not isinstance(slug, str) or not SLUG.match(slug):
            raise ConfigError(f"{where}: bad slug {slug!r}")
        if slug in seen:
            raise ConfigError(f"{where}: duplicate slug {slug}")
        seen.add(slug)
        where = f"institutions[{slug}]"
        categories = item.get("categories")
        if not isinstance(categories, list) or not categories or not all(isinstance(c, str) and SLUG.match(c) for c in categories):
            raise ConfigError(f"{where}: 'categories' must be a non-empty list of category slugs")
        sitemap = item.get("sitemap", "auto")
        if sitemap not in ("auto", "none"):
            sitemap = _url(sitemap, f"{where}.sitemap")
        render = item.get("render", "auto")
        if render not in ("auto", "browser"):
            raise ConfigError(f"{where}.render: expected auto or browser")
        max_pages = item.get("max_pages", DEFAULT_MAX_PAGES)
        if not isinstance(max_pages, int) or not 1 <= max_pages <= HARD_MAX_PAGES:
            raise ConfigError(f"{where}.max_pages: expected 1..{HARD_MAX_PAGES}")
        listing = item.get("listing_urls") or []
        if not isinstance(listing, list):
            raise ConfigError(f"{where}.listing_urls: expected a list")
        course_urls = item.get("course_urls") or []
        if not isinstance(course_urls, list):
            raise ConfigError(f"{where}.course_urls: expected a list")
        name = item.get("name")
        if name is not None and (not isinstance(name, str) or not name.strip()):
            raise ConfigError(f"{where}.name: expected text")
        kind = item.get("kind")
        if kind is not None and kind not in KINDS:
            raise ConfigError(f"{where}.kind: expected one of {', '.join(KINDS)}")
        city = item.get("city")
        if city is not None:
            if not isinstance(city, str) or city.strip() in NOT_A_CITY or not CITY.match(city.strip()):
                raise ConfigError(f"{where}.city: expected one city in Hebrew, or אונליין")
            city = city.strip()
        institution = InstitutionConfig(
            slug=slug,
            course_urls=tuple(_url(u, f"{where}.course_urls") for u in course_urls),
            name=name.strip() if name else None,
            kind=kind,
            city=city,
            website=_url(item.get("website"), f"{where}.website"),
            categories=tuple(categories),
            sitemap=sitemap,
            listing_urls=tuple(_url(u, f"{where}.listing_urls") for u in listing),
            include=_regex(item.get("include"), f"{where}.include"),
            exclude=_regex(item.get("exclude"), f"{where}.exclude"),
            render=render,
            max_pages=max_pages,
        )
        for url in institution.listing_urls + institution.course_urls + ((sitemap,) if sitemap not in ("auto", "none") else ()):
            if not institution.same_site(url):
                raise ConfigError(f"{where}: {url} is not on the institution's own site")
        if sitemap == "none" and not institution.listing_urls and not institution.course_urls:
            raise ConfigError(f"{where}: needs a sitemap, listing_urls or course_urls")
        result.append(institution)
    return Config(institutions=result)


def load_config(path: Path) -> Config:
    return parse_config(yaml.safe_load(path.read_text(encoding="utf-8")))
