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


def test_subdomains_known_pages_and_default_excludes():
    inst = institution(include=None, course_urls=["https://blog.a.example/sblog/full-stack"])
    assert inst.same_site("https://blog.a.example/x") is True
    assert inst.same_site("https://a.example.evil.com/x") is False
    assert inst.wants("https://a.example/blog/how-to-choose") is False
    assert inst.wants("https://a.example/wp-content/uploads/syllabus.pdf") is False
    assert inst.wants("https://a.example/about") is False
    assert inst.wants("https://a.example/about-the-course-x") is True
    sitemap = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + b"".join(
        f"<url><loc>https://a.example/{p}</loc></url>".encode() for p in ("about", "misc/one", "sblog/data", "blog/post")
    ) + b"</urlset>"
    result = discover(inst, FakeFetcher({"https://a.example/sitemap.xml": sitemap}), FakeRobots())
    # הדף הידוע ראשון, אחריו מה שבאותה תיקייה שלו, ואז השאר.
    assert result.urls == ["https://blog.a.example/sblog/full-stack", "https://a.example/sblog/data", "https://a.example/misc/one"]


def test_blog_sitemaps_are_skipped():
    index = b"""<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>https://a.example/post-sitemap.xml</loc></sitemap>
<sitemap><loc>https://a.example/course-sitemap.xml</loc></sitemap></sitemapindex>"""
    posts = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://a.example/courses/blog-like</loc></url></urlset>'
    courses = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://a.example/courses/x</loc></url></urlset>'
    fetcher = FakeFetcher({"https://a.example/sitemap.xml": index, "https://a.example/post-sitemap.xml": posts, "https://a.example/course-sitemap.xml": courses})
    result = discover(institution(), fetcher, FakeRobots())
    assert result.urls == ["https://a.example/courses/x"]
    assert "https://a.example/post-sitemap.xml" not in fetcher.calls


def test_huge_sitemaps_stop_and_mark_discovery_incomplete(monkeypatch):
    import lamadti_scraper.discover as module

    monkeypatch.setattr(module, "MAX_DISCOVERED", 2)
    index = b"""<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>https://a.example/a.xml</loc></sitemap><sitemap><loc>https://a.example/b.xml</loc></sitemap></sitemapindex>"""
    three = b'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + b"".join(
        f"<url><loc>https://a.example/courses/{i}</loc></url>".encode() for i in range(3)
    ) + b"</urlset>"
    fetcher = FakeFetcher({"https://a.example/sitemap.xml": index, "https://a.example/a.xml": three, "https://a.example/b.xml": three})
    result = discover(institution(), fetcher, FakeRobots())
    assert result.complete is False
    assert "https://a.example/b.xml" not in fetcher.calls
