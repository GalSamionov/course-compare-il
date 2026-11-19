"""המחקר על הערים של המוסדות לקובץ SQL (שלב 3, החלטה 1)."""

from tools.cities_to_sql import city_rows, to_sql

CSV = """slug,name,city,source_url,quote,note
alpha,מכללה א,תל אביב,https://a.example/,"רחוב 1, תל אביב",
beta,מכללה ב,כמה סניפים,https://b.example/,,"חיפה, תל אביב"
gamma,מכללה ג,אונליין,https://c.example/,,
delta,מכללה ד,לא נמצא,https://d.example/,,
eps,מכללה ה,ג'סר א-זרקה,https://e.example/,,
Bad Slug,מכללה ו,חיפה,https://f.example/,,
zeta,מכללה ז,Tel Aviv,https://g.example/,,
alpha,מכללה א,חיפה,https://a.example/,,
"""


def test_only_one_city_or_online_goes_in():
    rows, skipped = city_rows(CSV)
    assert rows == [("alpha", "תל אביב"), ("gamma", "אונליין"), ("eps", "ג'סר א-זרקה")]
    assert len(skipped) == 3  # slug לא תקין, עיר באנגלית, ו-alpha פעם שנייה


def test_the_sql_updates_only_institutions_without_a_city():
    rows, skipped = city_rows(CSV)
    sql = to_sql(rows, skipped, "docs/research/x.csv")
    statement = sql.split("update institutions", 1)[1]
    assert "('eps', 'ג''סר א-זרקה')" in statement
    assert statement.rstrip().endswith("where i.slug = v.slug and i.city is null;")
    assert "כמה סניפים" not in statement and "לא נמצא" not in statement
    assert "Tel Aviv" in sql.split("update institutions", 1)[0]  # מה שלא נכנס כתוב בראש הקובץ
