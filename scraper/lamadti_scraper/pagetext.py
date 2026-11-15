"""HTML לטקסט הנראה בדף, וטביעת האצבע שלו.

טביעת האצבע היא SHA-256 של הטקסט ושל ה-JSON-LD בלבד (ההחלטה 5 בתוכנית). סקריפטים, עיצוב,
תפריט וכותרת תחתונה לא נכנסים, כך ששינוי בעיצוב או במונה צפיות בתפריט לא נחשב שינוי בקורס.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from urllib.parse import urljoin, urlsplit

from bs4 import BeautifulSoup, Comment

# פחות טקסט מזה: כנראה הדף נבנה רק בדפדפן (ההחלטה 7).
MIN_TEXT_CHARS = 200

DROP_TAGS = ("script", "style", "noscript", "svg", "template", "iframe")
# תפריט, כותרת וכותרת תחתונה של האתר יורדים, אבל לא בתוך <main> או <article>:
# שם <header> הוא לפעמים הכותרת של הקורס עצמו. <form> ו-<button> נשארים, כי יש אתרים
# (ASP.NET) שכל הדף בתוך <form>, וסילבוס באקורדיון כתוב על כפתורים.
SITE_CHROME_TAGS = ("header", "nav", "footer")
BLOCK_TAGS = (
    "p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "tr", "section", "article", "main", "aside", "header",
    "footer", "ul", "ol", "dl", "dt", "dd", "table", "blockquote", "figcaption", "summary", "details", "button",
    "label", "option", "pre", "address",
)
VIDEO_HOSTS = ("youtube.com", "www.youtube.com", "youtu.be", "www.youtube-nocookie.com", "youtube-nocookie.com", "vimeo.com", "player.vimeo.com")
_SPACES = re.compile(r"[ \t ‏‎‪-‮]+")


@dataclass
class PageContent:
    title: str
    text: str
    jsonld: list[str] = field(default_factory=list)
    video_urls: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)

    @property
    def hash(self) -> str:
        return content_hash(self.text, self.jsonld)

    def for_model(self) -> str:
        """מה שהמודל קורא: הכותרת, הטקסט, הסרטונים וה-JSON-LD, בחלקים מסומנים."""
        parts = [f"# כותרת הדף\n{self.title}", f"# הטקסט בדף\n{self.text}"]
        if self.video_urls:
            parts.append("# סרטונים מוטמעים בדף\n" + "\n".join(self.video_urls))
        if self.jsonld:
            parts.append("# נתונים מובנים בדף (JSON-LD)\n" + "\n".join(self.jsonld))
        return "\n\n".join(parts)


def normalize_line(line: str) -> str:
    return _SPACES.sub(" ", line).strip()


def content_hash(text: str, jsonld: list[str] | None = None) -> str:
    payload = text + "\n\x00\n" + "\n".join(jsonld or [])
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _jsonld_blocks(soup: BeautifulSoup) -> list[str]:
    blocks: list[str] = []
    for tag in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = tag.string or tag.get_text() or ""
        try:
            # נרמול: אותו תוכן עם רווחים אחרים נותן אותה טביעה.
            blocks.append(json.dumps(json.loads(raw), ensure_ascii=False, sort_keys=True))
        except (ValueError, TypeError):
            continue
    return blocks


def _video_urls(soup: BeautifulSoup, base_url: str) -> list[str]:
    found: list[str] = []
    for tag in soup.find_all(["iframe", "a"]):
        src = tag.get("src") or tag.get("href") or ""
        if not src:
            continue
        url = urljoin(base_url, src)
        host = (urlsplit(url).hostname or "").lower()
        if host in VIDEO_HOSTS and url not in found:
            found.append(url)
    return found


def _links(soup: BeautifulSoup, base_url: str) -> list[str]:
    links: list[str] = []
    seen: set[str] = set()
    for tag in soup.find_all("a", href=True):
        url = urljoin(base_url, tag["href"]).split("#", 1)[0]
        if url.startswith(("http://", "https://")) and url not in seen:
            seen.add(url)
            links.append(url)
    return links


def extract_page(html: str, url: str) -> PageContent:
    soup = BeautifulSoup(html, "lxml")
    jsonld = _jsonld_blocks(soup)
    # הקישורים נאספים לפני שמורידים את התפריט: עמוד רשימה מקשר לקורסים גם משם.
    links = _links(soup, url)
    videos = _video_urls(soup, url)
    title = normalize_line(soup.title.get_text()) if soup.title else ""

    for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
        comment.extract()
    for tag in soup.find_all(DROP_TAGS):
        tag.decompose()
    for tag in soup.find_all(SITE_CHROME_TAGS):
        if not tag.decomposed and tag.find_parent(["main", "article"]) is None:
            tag.decompose()
    body = soup.body or soup
    # שורה חדשה רק אחרי אלמנט של בלוק. כך "מחיר: <b>12,900</b>" נשאר שורה אחת, ותא בטבלה מופרד ב-|.
    for tag in body.find_all("br"):
        tag.replace_with("\n")
    for tag in body.find_all(BLOCK_TAGS):
        tag.append("\n")
    for tag in body.find_all(["td", "th"]):
        tag.append(" | ")
    lines: list[str] = []
    for raw in body.get_text("").splitlines():
        line = normalize_line(raw)
        if line and (not lines or lines[-1] != line):
            lines.append(line)
    return PageContent(title=title, text="\n".join(lines), jsonld=jsonld, video_urls=videos, links=links)


_SHELL_MARKERS = (
    re.compile(r"<div[^>]+id=[\"'](root|app|__next|__nuxt)[\"'][^>]*>\s*</div>", re.I),
    re.compile(r"enable javascript|please turn on javascript|יש לאפשר javascript", re.I),
)


def needs_browser(html: str, content: PageContent) -> bool:
    """הדף נבנה רק בדפדפן: מעט טקסט, או שלד של אפליקציה."""
    if len(content.text) < MIN_TEXT_CHARS:
        return True
    return any(marker.search(html) for marker in _SHELL_MARKERS) and len(content.text) < MIN_TEXT_CHARS * 3
