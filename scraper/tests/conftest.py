"""המסד המקומי לבדיקות db: מ-SUPABASE_URL ו-SUPABASE_SECRET_KEY, או מ-supabase status. בלעדיו הבדיקות מדולגות."""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

import pytest

from lamadti_scraper.db import Db, DbError


def _supabase_cli() -> str | None:
    found = shutil.which("supabase")
    if found:
        return found
    for parent in Path(__file__).resolve().parents:
        for name in ("supabase.cmd", "supabase.CMD", "supabase"):
            candidate = parent / "node_modules" / ".bin" / name
            if candidate.exists():
                return str(candidate)
    return None


def _local_env() -> tuple[str, str] | None:
    url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SECRET_KEY")
    if url and key:
        return url, key
    cli = _supabase_cli()
    if not cli:
        return None
    repo = Path(__file__).resolve().parents[2]
    try:
        out = subprocess.run([cli, "status", "-o", "env"], cwd=repo, capture_output=True, text=True, timeout=60, check=True).stdout
    except (subprocess.SubprocessError, OSError):
        return None
    values = dict(line.split("=", 1) for line in out.splitlines() if "=" in line)
    url = values.get("API_URL", "").strip('"')
    key = (values.get("SECRET_KEY") or values.get("SERVICE_ROLE_KEY") or "").strip('"')
    return (url, key) if url and key else None


@pytest.fixture(scope="session")
def local_db() -> Db:
    env = _local_env()
    if env is None:
        pytest.skip("no local Supabase (pnpm db:start)")
    db = Db(*env)
    if not db.is_local:
        pytest.skip("db tests only run against the local database")
    try:
        db.preflight()
    except DbError as error:
        pytest.skip(f"scraper migration not applied locally: {error}")
    return db
