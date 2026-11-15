import pytest

from lamadti_scraper.fetch import Fetcher
from lamadti_scraper.fixtures import serve_fixtures
from lamadti_scraper.pagetext import extract_page, needs_browser
from lamadti_scraper.politeness import HostLimiter


def test_http_fetch_respects_robots():
    with serve_fixtures() as site:
        fetcher = Fetcher(HostLimiter(local_interval=0.0))
        try:
            ok = fetcher.get(f"{site.base}/courses/qa-automation.html")
            blocked = fetcher.get(f"{site.base}/private/price-list.html")
            missing = fetcher.get(f"{site.base}/courses/nothing.html")
        finally:
            fetcher.close()
    assert ok.ok and "14,500" in extract_page(ok.html, ok.url).text
    assert blocked.error == "robots_disallowed"
    assert missing.error == "http_404"


def test_script_only_page_is_read_in_a_browser():
    pytest.importorskip("playwright")
    with serve_fixtures() as site:
        fetcher = Fetcher(HostLimiter(local_interval=0.0))
        try:
            url = f"{site.base}/courses/frontend-react.html"
            plain = fetcher.get(url)
            assert needs_browser(plain.html, extract_page(plain.html, url))
            try:
                rendered = fetcher.render(url)
            except Exception as error:  # Chromium לא מותקן: uv run playwright install chromium
                pytest.skip(f"no browser: {error}")
        finally:
            fetcher.close()
    assert rendered.method == "browser"
    assert 'מחיר הקורס: 9,800 ש"ח' in extract_page(rendered.html, url).text
