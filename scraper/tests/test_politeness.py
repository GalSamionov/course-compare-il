from lamadti_scraper.politeness import HostLimiter, RobotsCache, parse_robots


class FakeClock:
    def __init__(self) -> None:
        self.now = 100.0
        self.slept: list[float] = []

    def clock(self) -> float:
        return self.now

    def sleep(self, seconds: float) -> None:
        self.slept.append(round(seconds, 3))
        self.now += seconds


def test_one_request_per_second_per_host():
    t = FakeClock()
    limiter = HostLimiter(clock=t.clock, sleep=t.sleep)
    limiter.wait("a.example")
    limiter.wait("b.example")  # אתר אחר: בלי המתנה
    t.now += 0.25
    limiter.wait("a.example")
    assert t.slept == [0.75]


def test_interval_never_below_one_second_for_real_sites():
    t = FakeClock()
    limiter = HostLimiter(min_interval=0.1, local_interval=0.0, clock=t.clock, sleep=t.sleep)
    assert limiter.interval_for("a.example") == 1.0
    assert limiter.interval_for("127.0.0.1") == 0.0


def test_crawl_delay_is_respected():
    t = FakeClock()
    limiter = HostLimiter(clock=t.clock, sleep=t.sleep)
    robots = RobotsCache(lambda url: (200, "User-agent: *\nCrawl-delay: 5\nDisallow: /private/\n"), limiter)
    assert robots.allowed("https://a.example/courses/x") is True
    assert robots.allowed("https://a.example/private/x") is False
    assert limiter.interval_for("a.example") == 5.0


def test_robots_status_rules():
    assert parse_robots(404, "").allowed("https://a.example/x") is True
    assert parse_robots(503, "").allowed("https://a.example/x") is False
    assert parse_robots(None, "").allowed("https://a.example/x") is False
    assert parse_robots(403, "").allowed("https://a.example/x") is False


def test_robots_specific_agent_and_sitemaps():
    rules = parse_robots(
        200,
        "User-agent: CourseCatalogBot\nDisallow: /\n\nUser-agent: *\nAllow: /\nSitemap: https://a.example/sitemap_index.xml\n",
    )
    assert rules.allowed("https://a.example/courses/x") is False
    assert rules.sitemaps == ["https://a.example/sitemap_index.xml"]
