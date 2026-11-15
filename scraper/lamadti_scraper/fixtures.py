"""אתר הדוגמה, מוגש מקומית ל-127.0.0.1 (לבדיקות ולהדגמה בלבד).

שבוע 1: tests/fixtures/site. משבוע 2: tests/fixtures/site-week2 מעל site, ודפים שב-_removed.txt מחזירים 404.
{{BASE}} בקבצי xml ו-txt מוחלף בכתובת של השרת. השבוע משתנה בלי להחליף את השרת, כך שהכתובות נשארות.
"""

from __future__ import annotations

import threading
from contextlib import contextmanager
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Iterator
from urllib.parse import unquote, urlsplit

FIXTURES = Path(__file__).resolve().parent.parent / "tests" / "fixtures"
TYPES = {".html": "text/html; charset=utf-8", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8"}


@dataclass
class FixtureSite:
    base: str = ""
    week: int = 1
    requests: int = 0


def _handler(site_state: FixtureSite) -> type[BaseHTTPRequestHandler]:
    site = FIXTURES / "site"
    overlay = FIXTURES / "site-week2"
    removed = set((overlay / "_removed.txt").read_text(encoding="utf-8").split())

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            site_state.requests += 1
            week = site_state.week
            path = unquote(urlsplit(self.path).path)
            if ".." in path or (week >= 2 and path in removed):
                self.send_error(404)
                return
            candidates = ([overlay / path.lstrip("/")] if week >= 2 else []) + [site / path.lstrip("/")]
            target = next((p for p in candidates if p.is_file() and not p.name.startswith("_")), None)
            if target is None:
                self.send_error(404)
                return
            body = target.read_bytes()
            if target.suffix in (".xml", ".txt"):
                body = body.replace(b"{{BASE}}", site_state.base.encode())
            self.send_response(200)
            self.send_header("Content-Type", TYPES.get(target.suffix, "application/octet-stream"))
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args: object) -> None:
            return

    return Handler


@contextmanager
def serve_fixtures(port: int = 0) -> Iterator[FixtureSite]:
    """מגיש את אתר הדוגמה. site.week קובע איזה שבוע מוגש."""
    state = FixtureSite()
    server = ThreadingHTTPServer(("127.0.0.1", port), _handler(state))
    state.base = f"http://127.0.0.1:{server.server_address[1]}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield state
    finally:
        server.shutdown()
        server.server_close()
