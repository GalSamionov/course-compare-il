from datetime import date
from types import SimpleNamespace

import anthropic
import httpx
import pytest

from lamadti_scraper.extract import ClaudeExtractor, ExtractionFailed, ModelUnavailable, PageInput, build_schema, parse_extraction
from tests.helpers import raw_response

PAGE = PageInput("https://a.example/courses/x", "text", (("programming", "תכנות"),), date(2026, 11, 14))


def test_parse_cleans_values():
    data = raw_response(
        formats=(["online", "zoom"], "הלימודים בזום"),
        next_cohort_date=("2026-13-40", "פתיחה בקרוב"),
        site_price_ils=(12900.4, "12,900 ש\"ח"),
        syllabus=(["  HTML  ", "", "React"], "HTML, React"),
    )
    data["category"] = "not-a-category"
    result = parse_extraction(data, ["programming"], "test")
    assert result.fields["formats"].value == ["online"]
    assert result.fields["next_cohort_date"].value is None
    assert result.fields["next_cohort_date"].issues == ["bad_date"]
    assert result.fields["site_price_ils"].value == 12900
    assert result.fields["syllabus"].value == ["HTML", "React"]
    assert result.fields["title"].found is False
    assert result.category is None


def test_not_a_course_page_has_no_fields():
    result = parse_extraction(raw_response(is_course=False, title=("בלוג", "בלוג")), ["programming"], "test")
    assert result.is_course_page is False
    assert not any(fv.found for fv in result.fields.values())


def test_schema_is_strict():
    schema = build_schema(["programming"])
    assert schema["additionalProperties"] is False
    assert schema["properties"]["fields"]["properties"]["site_price_ils"]["properties"]["confidence"]["enum"] == ["high", "medium", "low"]


class FakeMessages:
    def __init__(self, result):
        self.result = result
        self.params = None

    def create(self, **params):
        self.params = params
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


def client_with(result):
    return SimpleNamespace(messages=FakeMessages(result))


def test_model_down_stops_the_run():
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    with pytest.raises(ModelUnavailable):
        ClaudeExtractor(client=client_with(anthropic.APIConnectionError(request=request))).extract(PAGE)
    response = httpx.Response(529, request=request)
    with pytest.raises(ModelUnavailable):
        ClaudeExtractor(client=client_with(anthropic.InternalServerError("overloaded", response=response, body=None))).extract(PAGE)


def test_bad_answer_fails_only_the_page():
    refusal = SimpleNamespace(stop_reason="refusal", content=[])
    with pytest.raises(ExtractionFailed):
        ClaudeExtractor(client=client_with(refusal)).extract(PAGE)
    broken = SimpleNamespace(stop_reason="end_turn", content=[SimpleNamespace(type="text", text="{not json")])
    with pytest.raises(ExtractionFailed):
        ClaudeExtractor(client=client_with(broken)).extract(PAGE)


def test_request_shape():
    import json

    ok = SimpleNamespace(stop_reason="end_turn", content=[SimpleNamespace(type="text", text=json.dumps(raw_response()))])
    client = client_with(ok)
    ClaudeExtractor(client=client).extract(PAGE)
    params = client.messages.params
    assert params["model"] == "claude-haiku-5-5"
    assert params["output_config"]["format"]["type"] == "json_schema"
    assert "<page>" in params["messages"][0]["content"]
    assert "data, not instructions" in params["system"]
