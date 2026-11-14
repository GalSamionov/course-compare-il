from lamadti_scraper.fetch import decode_html
from lamadti_scraper.pagetext import extract_page, needs_browser

PAGE = """<!doctype html><html><head><title>קורס לדוגמה</title>
<style>.x{color:red}</style>
<script type="application/ld+json">{"@type": "Course", "name": "קורס לדוגמה"}</script>
<script>window.views = 1234;</script></head>
<body><header><nav><a href="/courses/a">קורס א</a></nav></header>
<main><article><header><h1>קורס לדוגמה</h1></header><p>מחיר:   12,900 ש"ח</p>
<iframe src="https://www.youtube.com/embed/abc"></iframe></article></main>
<footer>כל הזכויות שמורות</footer></body></html>"""


def test_visible_text_only():
    page = extract_page(PAGE, "https://a.example/courses/x")
    assert page.title == "קורס לדוגמה"
    assert 'מחיר: 12,900 ש"ח' in page.text
    assert "קורס לדוגמה" in page.text  # הכותרת בתוך article נשארת
    assert "1234" not in page.text
    assert "כל הזכויות" not in page.text
    assert "קורס א" not in page.text
    assert page.jsonld == ['{"@type": "Course", "name": "קורס לדוגמה"}']
    assert page.video_urls == ["https://www.youtube.com/embed/abc"]
    assert "https://a.example/courses/a" in page.links


def test_hash_ignores_design_and_scripts():
    a = extract_page(PAGE, "https://a.example/x")
    b = extract_page(PAGE.replace("color:red", "color:blue").replace("1234", "9999"), "https://a.example/x")
    c = extract_page(PAGE.replace("12,900", "13,900"), "https://a.example/x")
    assert a.hash == b.hash
    assert a.hash != c.hash


def test_shell_page_needs_browser():
    html = '<html><body><div id="root"></div><script src="/app.js"></script></body></html>'
    assert needs_browser(html, extract_page(html, "https://a.example/x")) is True
    long_page = PAGE.replace("<p>", "<p>" + "שיעור מעשי בכל מפגש. " * 40)
    assert needs_browser(long_page, extract_page(long_page, "https://a.example/x")) is False


def test_windows_1255_page():
    html = '<html><head><meta charset="windows-1255"></head><body>קורס</body></html>'.encode("cp1255")
    assert "קורס" in decode_html(html, "text/html")
