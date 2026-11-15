"""החילוץ האמיתי עם Claude מול 20 דפי הדוגמה. רץ רק עם -m live ו-ANTHROPIC_API_KEY (עולה כמה סנטים)."""

import os

import pytest

from lamadti_scraper.check import check_fixtures
from lamadti_scraper.extract import ClaudeExtractor

pytestmark = pytest.mark.live


@pytest.mark.skipif(not os.environ.get("ANTHROPIC_API_KEY"), reason="no ANTHROPIC_API_KEY")
def test_real_extraction_matches_the_fixtures():
    assert check_fixtures(ClaudeExtractor()) == 0
