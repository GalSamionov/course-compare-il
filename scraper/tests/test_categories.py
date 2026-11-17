"""התחומים שהאוסף רואה (20261116040001_new_categories.sql): רק פעילים, עם התיאור, ו-ai מחולק לארבעה."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from lamadti_scraper.config import load_config
from lamadti_scraper.db import active_categories
from lamadti_scraper.extract import SYSTEM, PageInput, user_message
from tools.approved_to_yaml import SPLIT, parse

AI = ["ai-at-work", "ai-automation", "ai-no-code", "ai-content"]

ROWS = [
    {"id": "c-ai", "slug": "ai", "name": "בינה מלאכותית", "description": "התחום הישן", "replaced_by": AI},
    {"id": "c-auto", "slug": "ai-automation", "name": "אוטומציות וסוכני AI", "description": "תהליכים שרצים לבד וסוכני AI, בכלים כמו n8n ו-Make.", "replaced_by": []},
    {"id": "c-p", "slug": "programming", "name": "תכנות", "description": None, "replaced_by": []},
]


def test_a_retired_category_is_not_offered():
    assert "ai" not in active_categories(ROWS)


def test_the_label_is_the_name_and_the_description():
    categories = active_categories(ROWS)
    assert categories["ai-automation"] == ("c-auto", "אוטומציות וסוכני AI: תהליכים שרצים לבד וסוכני AI, בכלים כמו n8n ו-Make.")
    assert categories["programming"] == ("c-p", "תכנות")


def test_the_model_sees_the_descriptions_and_the_rule_for_ai():
    page = PageInput(url="https://example.test/c", text="דף", categories=tuple((s, label) for s, (_, label) in active_categories(ROWS).items()), today=date(2026, 11, 16))
    content, _ = user_message(page)
    assert "- ai-automation: אוטומציות וסוכני AI: תהליכים שרצים לבד" in content
    assert "- ai:" not in content
    assert "Choose by what most of the course teaches" in SYSTEM
    assert "a digital-marketing course with AI tools is digital marketing" in SYSTEM


MARKDOWN = """# תחומים שכבר באתר

## 2. בינה מלאכותית (ai)

| אישור | שם המוסד | האתר הרשמי | עמוד הקורסים בתחום | סוג | הערות |
|---|---|---|---|---|---|
| ✅ | מכללה לדוגמה | [example.co.il](https://www.example.co.il/) | [קורס AI](https://www.example.co.il/ai/) | מכללה | |

## 9. ניתוח נתונים (data-analysis)

| אישור | שם המוסד | האתר הרשמי | עמוד הקורסים בתחום | סוג | הערות |
|---|---|---|---|---|---|
| ✅ | מכללה לדוגמה | [example.co.il](https://www.example.co.il/) | [דאטה](https://www.example.co.il/data/) | מכללה | |
"""


def test_an_institution_approved_in_ai_gets_the_four_ai_categories():
    assert SPLIT["ai"] == AI
    [entry] = parse(MARKDOWN)
    assert entry.categories == [*AI, "data-analysis"]


def test_no_institution_in_the_config_still_uses_ai():
    config = load_config(Path(__file__).resolve().parent.parent / "institutions.yaml")
    assert not [i.slug for i in config.institutions if "ai" in i.categories]
    # 13 המוסדות שהיו ב-ai קיבלו את כל ארבעת התחומים. מוכרים שנוספו אחר כך (17.11.2026) בוחרים רק חלק מהם.
    split = [i.slug for i in config.institutions if set(AI) <= set(i.categories)]
    assert len(split) == 13
