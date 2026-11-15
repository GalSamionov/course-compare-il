#!/usr/bin/env bash
# Hook של SessionEnd: רשת ביטחון לתיעוד ולגיבוי.
# 1. מוסיף ל-docs/sessions/LOG.md רשומה אוטומטית: הקומיטים מהסשן והקבצים שעוד לא נשמרו.
# 2. שומר את כל השינויים בקומיט גיבוי ודוחף ל-GitHub.
# לא כותב כלום אם בסשן לא השתנה דבר.
set -u
input="$(cat 2>/dev/null || true)"

# כל סשן מגבה רק את התיקייה שבה הוא עבד (cwd מה-hook), ולא את התיקייה הראשית של הפרויקט.
# סשן שעובד ב-worktree נפרד היה אחרת שומר ודוחף עבודה לא גמורה של סשן אחר בתיקייה הראשית.
cwd="$(printf '%s' "$input" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1 | sed 's#\\\\#/#g')"
if [ -n "$cwd" ] && [ -d "$cwd" ]; then
  cd "$cwd" || exit 0
else
  cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
fi
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
cd "$(git rev-parse --show-toplevel)" || exit 0

sid="$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
[ -n "$sid" ] || sid="unknown"

state=".claude/state/session-$sid"
start_sha=""
if [ -f "$state" ]; then
  read -r start_sha _ < "$state" || true
fi

commits=""
if [ -n "$start_sha" ] && [ "$start_sha" != "none" ]; then
  commits="$(git log --oneline "$start_sha"..HEAD 2>/dev/null)"
fi
changed="$(git status --porcelain 2>/dev/null | cut -c4- | head -n 50)"

if [ -z "$commits" ] && [ -z "$changed" ]; then
  rm -f "$state"
  exit 0
fi

now="$(date '+%Y-%m-%d %H:%M')"
log="docs/sessions/LOG.md"
mkdir -p docs/sessions
if [ ! -f "$log" ]; then
  printf '# יומן סשנים אוטומטי\n\nנכתב אוטומטית בסוף כל סשן. הסיכום המלא של כל סשן נמצא בקובץ הסשן שלו בתיקייה הזאת.\n' > "$log"
fi

{
  printf '\n## %s (סשן %s)\n\n' "$now" "${sid:0:8}"
  if [ -n "$commits" ]; then
    printf 'קומיטים בסשן:\n\n'
    printf '%s\n' "$commits" | sed 's/^/- /'
    printf '\n'
  fi
  if [ -n "$changed" ]; then
    printf 'קבצים שלא נשמרו בקומיט עד סוף הסשן, ונשמרו עכשיו בגיבוי:\n\n'
    printf '%s\n' "$changed" | sed 's/^/- /'
    printf '\n'
  fi
} >> "$log"

rm -f "$state"
git add -A >/dev/null 2>&1
git commit -q -m "chore: גיבוי אוטומטי בסוף סשן ($now)" >/dev/null 2>&1 || true
if git remote get-url origin >/dev/null 2>&1; then
  git push -q origin HEAD >/dev/null 2>&1 || true
fi
exit 0
