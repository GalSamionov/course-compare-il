"""מציאת דפי הקורסים של מוסד: מפת האתר (sitemap) ועמודי רשימת הקורסים (סעיף 5.1)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol
from urllib.parse import urljoin, urlsplit

from lxml import etree

from .config import InstitutionConfig
from .fetch import FetchResult
from .pagetext import extract_page, needs_browser

MAX_SITEMAP_FILES = 50
MAX_SITEMAP_DEPTH = 2


class PageGetter(Protocol):
    def get(self, url: str, kind: str = "html") -> FetchResult: ...
    def render(self, url: str) -> FetchResult: ...


class RobotsSource(Protocol):
    def rules(self, url: str): ...


@dataclass
class Discovery:
    urls: list[str] = field(default_factory=list)
    # כל מה שנמצא, גם מעבר ל-max_pages. דף שנמצא לא נחשב "נעלם", גם אם לא נקרא השבוע.
    seen: list[str] = field(default_factory=list)
    ok: bool = False
    sources: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def parse_sitemap(body: bytes) -> tuple[list[str], list[str]]:
    """מחזיר (דפים, מפות אתר נוספות). לא תלוי ב-namespace, ולא טוען ישויות חיצוניות."""
    parser = etree.XMLParser(resolve_entities=False, no_network=True, recover=True, huge_tree=False)
    try:
        root = etree.fromstring(body, parser=parser)
    except etree.XMLSyntaxError:
        return [], []
    if root is None:
        return [], []
    pages: list[str] = []
    nested: list[str] = []
    for element in root.iter():
        if not isinstance(element.tag, str) or etree.QName(element).localname != "loc":
            continue
        parent = element.getparent()
        url = (element.text or "").strip()
        if not url or parent is None:
            continue
        kind = etree.QName(parent).localname
        if kind == "sitemap":
            nested.append(url)
        elif kind == "url":
            pages.append(url)
    return pages, nested


def _first_segment(url: str) -> str:
    parts = [p for p in urlsplit(url).path.split("/") if p]
    return parts[0].lower() if len(parts) > 1 else ""


def prioritize(urls: list[str], known: tuple[str, ...]) -> list[str]:
    """כש-max_pages חותך, קודם הדפים הידועים, אחריהם כתובות באותה תיקייה שלהם (/courses/...), ואז השאר.
    הסדר בתוך כל קבוצה נשמר."""
    segments = {_first_segment(u) for u in known} - {""}
    known_set = set(known)
    return sorted(urls, key=lambda u: 0 if u in known_set else 1 if _first_segment(u) in segments else 2)


def _clean(url: str) -> str:
    return url.split("#", 1)[0].strip()


def _sitemap_roots(institution: InstitutionConfig, robots: RobotsSource) -> list[str]:
    if institution.sitemap == "none":
        return []
    if institution.sitemap != "auto":
        return [institution.sitemap]
    listed = [u for u in robots.rules(institution.website).sitemaps if institution.same_site(u)]
    if listed:
        return listed
    parts = urlsplit(institution.website)
    return [f"{parts.scheme}://{parts.netloc}/sitemap.xml"]


def discover(institution: InstitutionConfig, fetcher: PageGetter, robots: RobotsSource) -> Discovery:
    result = Discovery()
    found: list[str] = []
    seen: set[str] = set()

    def add(url: str) -> None:
        url = _clean(url)
        if url and url not in seen and institution.wants(url):
            seen.add(url)
            found.append(url)

    for known in institution.course_urls:
        add(known)
    if institution.course_urls:
        result.ok = True
        result.sources.append("course_urls")

    queue: list[tuple[str, int]] = [(u, 0) for u in _sitemap_roots(institution, robots)]
    fetched = 0
    while queue and fetched < MAX_SITEMAP_FILES:
        url, depth = queue.pop(0)
        if not institution.same_site(url):
            continue
        fetched += 1
        response = fetcher.get(url, kind="xml")
        if not response.ok:
            result.errors.append(f"sitemap {url}: {response.error}")
            continue
        pages, nested = parse_sitemap(response.body)
        if not pages and not nested:
            result.errors.append(f"sitemap {url}: empty or not a sitemap")
            continue
        result.ok = True
        result.sources.append(url)
        for page in pages:
            add(page)
        if depth < MAX_SITEMAP_DEPTH:
            queue.extend((n, depth + 1) for n in nested)

    for listing in institution.listing_urls:
        response = fetcher.render(listing) if institution.render == "browser" else fetcher.get(listing)
        if response.ok and institution.render != "browser":
            content = extract_page(response.html, response.final_url)
            if needs_browser(response.html, content) and not content.links:
                response = fetcher.render(listing)
        if not response.ok:
            result.errors.append(f"listing {listing}: {response.error}")
            continue
        result.ok = True
        result.sources.append(listing)
        for link in extract_page(response.html, response.final_url).links:
            add(urljoin(response.final_url, link))

    result.seen = list(found)
    found = prioritize(found, institution.course_urls)
    result.urls = found[: institution.max_pages]
    if len(found) > institution.max_pages:
        result.errors.append(f"found {len(found)} pages, kept the first {institution.max_pages}")
    return result
