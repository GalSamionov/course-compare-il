#!/usr/bin/env bash
# Hook של SessionStart.
# רושם מאיזה קומיט הסשן התחיל, ומזכיר ל-Claude לנהל את קובץ הסשן.
# מה שהסקריפט מדפיס נכנס להקשר של הסשן.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

input="$(cat 2>/dev/null || true)"
sid="$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
[ -n "$sid" ] || sid="unknown"

mkdir -p .claude/state
head_sha="$(git rev-parse HEAD 2>/dev/null || echo none)"
printf '%s %s\n' "$head_sha" "$(date '+%Y-%m-%d_%H:%M')" > ".claude/state/session-$sid"

echo "תיעוד סשנים: לפי CLAUDE.md, אם הסשן כולל עבודה של ממש, צרו או המשיכו את קובץ הסשן של היום ב-docs/sessions/ (לפי docs/sessions/TEMPLATE.md) ועדכנו אותו תוך כדי העבודה."
if [ -f docs/STATUS.md ]; then
  echo "המצב הנוכחי של הפרויקט: docs/STATUS.md"
fi

latest="$(ls -1 docs/sessions/20*.md 2>/dev/null | sort | tail -n 1)"
if [ -n "$latest" ]; then
  echo "הסשן הקודם: $latest"
  sed -n '/^## מה צריך לבדוק בסשן הבא/,/^## [^מ]/p' "$latest" | head -n 20
fi
exit 0
