"""הורדת דפים: קודם בקשה רגילה, ודף שנבנה רק בדפדפן נפתח ב-Playwright (סעיף 5.2).

כל בקשה לאתר של המוסד עוברת דרך robots.txt ודרך הקצב, גם הבקשות שהדפדפן שולח בעצמו.
"""

from __future__ import annotations

import gzip
import re
from dataclasses import dataclass
from typing import Any

import httpx
from bs4 import UnicodeDammit

from .politeness import USER_AGENT, HostLimiter, RobotsCache, host_of

MAX_BYTES = 3_000_000
TIMEOUT_SECONDS = 20.0
BROWSER_TIMEOUT_MS = 90_000
HTML_TYPES = ("text/html", "application/xhtml+xml")
XML_TYPES = ("application/xml", "text/xml", "application/x-gzip", "application/gzip", "application/octet-stream", "text/plain")
# בדפדפן: רק מה שצריך כדי שהטקסט ייבנה. תמונות, גופנים, וידאו ועיצוב לא נטענים.
BLOCKED_RESOURCES = {"image", "media", "font", "stylesheet"}
_CHARSET = re.compile(r"charset=([\w-]+)", re.I)


@dataclass
class FetchResult:
    url: str
    final_url: str
    status: int | None
    body: bytes
    html: str
    method: str  # http | browser
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None


def _same_site(a: str, b: str) -> bool:
    return host_of(a).removeprefix("www.") == host_of(b).removeprefix("www.")


def decode_html(body: bytes, content_type: str) -> str:
    match = _CHARSET.search(content_type or "")
    if match:
        try:
            return body.decode(match.group(1), errors="replace")
        except LookupError:
            pass
    # בלי charset בכותרת: לפי <meta charset> בדף. יש אתרים בעברית שעדיין ב-windows-1255.
    return UnicodeDammit(body, is_html=True).unicode_markup or ""


def maybe_gunzip(body: bytes) -> bytes:
    if body[:2] == b"\x1f\x8b":
        try:
            return gzip.decompress(body)
        except OSError:
            return body
    return body


class Fetcher:
    """מוריד בשם האוסף. מופע אחד לכל תהליכון: httpx ו-Playwright לא משותפים בין תהליכונים."""

    def __init__(self, limiter: HostLimiter, *, timeout: float = TIMEOUT_SECONDS, transport: httpx.BaseTransport | None = None) -> None:
        self.limiter = limiter
        self._client = httpx.Client(
            headers={"User-Agent": USER_AGENT, "Accept-Language": "he,en;q=0.8"},
            timeout=timeout,
            follow_redirects=True,
            max_redirects=5,
            transport=transport,
        )
        self.robots = RobotsCache(self._robots_text, limiter)
        self._browser: _Browser | None = None

    def _robots_text(self, url: str) -> tuple[int | None, str]:
        try:
            response = self._client.get(url)
        except httpx.HTTPError:
            return None, ""
        return response.status_code, response.text if response.status_code < 300 else ""

    def get(self, url: str, kind: str = "html") -> FetchResult:
        if not self.robots.allowed(url):
            return FetchResult(url, url, None, b"", "", "http", "robots_disallowed")
        self.limiter.wait(host_of(url))
        try:
            with self._client.stream("GET", url) as response:
                final_url = str(response.url)
                if not _same_site(url, final_url):
                    return FetchResult(url, final_url, response.status_code, b"", "", "http", "offsite_redirect")
                if response.status_code >= 400:
                    return FetchResult(url, final_url, response.status_code, b"", "", "http", f"http_{response.status_code}")
                content_type = response.headers.get("content-type", "").lower()
                allowed = HTML_TYPES if kind == "html" else XML_TYPES + HTML_TYPES
                if content_type and not content_type.startswith(allowed):
                    return FetchResult(url, final_url, response.status_code, b"", "", "http", "not_html")
                chunks: list[bytes] = []
                size = 0
                for chunk in response.iter_bytes():
                    size += len(chunk)
                    if size > MAX_BYTES:
                        return FetchResult(url, final_url, response.status_code, b"", "", "http", "too_large")
                    chunks.append(chunk)
        except httpx.TimeoutException:
            return FetchResult(url, url, None, b"", "", "http", "timeout")
        except httpx.HTTPError as error:
            return FetchResult(url, url, None, b"", "", "http", f"network: {type(error).__name__}")
        body = b"".join(chunks)
        if kind == "xml":
            body = maybe_gunzip(body)
            return FetchResult(url, final_url, response.status_code, body, "", "http")
        return FetchResult(url, final_url, response.status_code, body, decode_html(body, content_type), "http")

    def render(self, url: str) -> FetchResult:
        if not self.robots.allowed(url):
            return FetchResult(url, url, None, b"", "", "browser", "robots_disallowed")
        if self._browser is None:
            self._browser = _Browser(self)
        return self._browser.render(url)

    def close(self) -> None:
        self._client.close()
        if self._browser is not None:
            self._browser.close()
            self._browser = None


class _Browser:
    """Chromium אחד לכל Fetcher, נפתח רק כשצריך."""

    def __init__(self, fetcher: Fetcher) -> None:
        from playwright.sync_api import sync_playwright

        self._fetcher = fetcher
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.launch(headless=True)
        self._context = self._browser.new_context(user_agent=USER_AGENT, locale="he-IL", java_script_enabled=True)

    def render(self, url: str) -> FetchResult:
        from playwright.sync_api import Error as PlaywrightError
        from playwright.sync_api import TimeoutError as PlaywrightTimeout

        fetcher = self._fetcher
        page = self._context.new_page()

        def handle(route: Any) -> None:
            request = route.request
            if request.resource_type in BLOCKED_RESOURCES:
                route.abort()
                return
            if _same_site(request.url, url):
                if not fetcher.robots.allowed(request.url):
                    route.abort()
                    return
                fetcher.limiter.wait(host_of(request.url))
            route.continue_()

        page.route("**/*", handle)
        status: int | None = None
        error: str | None = None
        try:
            try:
                response = page.goto(url, wait_until="networkidle", timeout=BROWSER_TIMEOUT_MS)
                status = response.status if response else None
            except PlaywrightTimeout:
                # הדף לא נרגע בזמן. מה שכבר נבנה עדיין שימושי.
                error = None
            final_url = page.url
            if not _same_site(url, final_url):
                return FetchResult(url, final_url, status, b"", "", "browser", "offsite_redirect")
            if status is not None and status >= 400:
                return FetchResult(url, final_url, status, b"", "", "browser", f"http_{status}")
            html = page.content()
        except PlaywrightError as caught:
            return FetchResult(url, url, status, b"", "", "browser", f"browser: {str(caught).splitlines()[0][:120]}")
        finally:
            page.close()
        return FetchResult(url, final_url, status, html.encode("utf-8"), html, "browser", error)

    def close(self) -> None:
        try:
            self._context.close()
            self._browser.close()
        finally:
            self._playwright.stop()
