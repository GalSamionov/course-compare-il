from lamadti_scraper.config import parse_config
from lamadti_scraper.discover import discover, parse_sitemap
from lamadti_scraper.fetch import FetchResult
from lamadti_scraper.politeness import parse_robots

INDEX = b"""<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>https://a.example/course-sitemap.xml</loc></sitemap></sitemapindex>"""
COURSES = b"""<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://a.example/courses/one</loc></url><url><loc>https://a.example/courses/two#top</loc></url>
<url><loc>https://a.example/blog/post</loc></url><url><loc>https://other.example/courses/three</loc></url></urlset>"""


class FakeFetcher:
    def __init__(self, pages: dict[str, bytes]) -> None:
        self.pages = pages
        self.calls: list[str] = []

    def get(self, url: str, kind: str = "html") -> FetchResult:
        self.calls.append(url)
        if url not in self.pages:
            return FetchResult(url, url, 404, b"", "", "http", "http_404")
        body = self.pages[url]
        return FetchResult(url, url, 200, body, body.decode(), "http")

    def render(self, url: str) -> FetchResult:
        return self.get(url)


class FakeRobots:
    def __init__(self, text: str = "") -> None:
        self._rules = parse_robots(200, text)

    def rules(self, url: str):
        return self._rules


def institution(**extra):
    item = {"slug": "sample-college", "website": "https://a.example/", "categories": ["programming"], "include": "/courses/"}
    item.update(extra)
    return parse_config({"institutions": [item]}).institutions[0]


def test_parse_sitemap_index_and_urlset():
    assert parse_sitemap(INDEX) == ([], ["https://a.example/course-sitemap.xml"])
    pages, nested = parse_sitemap(COURSES)
    assert len(pages) == 4 and nested == []


def test_sitemap_from_robots_with_filters():
    fetcher = FakeFetcher({"https://a.example/sitemap_index.xml": INDEX, "https://a.example/course-sitemap.xml": COURSES})
    result = discover(institution(), fetcher, FakeRobots("Sitemap: https://a.example/sitemap_index.xml"))
    assert result.ok is True
    assert result.urls == ["https://a.example/courses/one", "https://a.example/courses/two"]


def test_listing_page_links():
    listing = b'<html><body><a href="/courses/x">x</a><a href="/about">about</a><a href="https://other.example/courses/y">y</a></body></html>'
    fetcher = FakeFetcher({"https://a.example/all-courses": listing})
    result = discover(institution(sitemap="none", listing_urls=["https://a.example/all-courses"]), fetcher, FakeRobots())
    assert result.urls == ["https://a.example/courses/x"]


def test_nothing_found_is_not_ok():
    result = discover(institution(), FakeFetcher({}), FakeRobots())
    assert result.ok is False
    assert result.errors


def test_max_pages():
    many = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + b"".join(
        f"<url><loc>https://a.example/courses/{i}</loc></url>".encode() for i in range(10)
    ) + b"</urlset>"
    result = discover(institution(max_pages=3), FakeFetcher({"https://a.example/sitemap.xml": many}), FakeRobots())
    assert len(result.urls) == 3
