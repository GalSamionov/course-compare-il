"""עזרים לבדיקות: תשובת מודל מומצאת, בפורמט של הסכמה."""

from __future__ import annotations

from typing import Any

from lamadti_scraper.extract import parse_extraction
from lamadti_scraper.fields import FIELDS

EMPTY = {"text": "", "int": 0, "number": 0, "date": "", "choices": [], "syllabus": []}


def raw_response(category: str = "programming", is_course: bool = True, **fields: Any) -> dict[str, Any]:
    """fields: name=(value, quote) או name=(value, quote, confidence)."""
    out: dict[str, Any] = {}
    for f in FIELDS:
        if f.name in fields:
            value, quote, *rest = fields[f.name]
            out[f.name] = {"found": True, "value": value, "quote": quote, "confidence": rest[0] if rest else "high"}
        else:
            out[f.name] = {"found": False, "value": EMPTY[f.kind], "quote": "", "confidence": "low"}
    return {"is_course_page": is_course, "category": category, "fields": out}


def extraction(category: str = "programming", is_course: bool = True, **fields: Any):
    return parse_extraction(raw_response(category, is_course, **fields), ["programming", "ai"], "test")
