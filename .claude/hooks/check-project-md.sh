#!/usr/bin/env bash
# Stop hook: block the turn end if a client folder was touched but its PROJECT.md wasn't updated.
# Rule lives in ~/.claude/CLAUDE.md ("PROJECT.md — every project gets a living context doc").
#
# Detection: git status --porcelain, MINUS a per-repo baseline snapshot of files
# that were already dirty when the current session started. This makes the hook
# care about "files I modified during this conversation" rather than
# "any dirty file in this repo right now" — the latter false-positives whenever
# concurrent sessions on the same machine leave uncommitted WIP behind.
#
# Baseline lifecycle:
#   * Stored at $ROOT/.claude/.dirty-baseline
#   * Refreshed if missing OR older than 6 hours (proxy for "new session")
#   * Format: one path per line, as emitted by porcelain-path extraction below

set -uo pipefail

# Drain stdin (Stop hook payload is {}; we don't need it)
cat > /dev/null 2>&1 || true

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$ROOT" ] && exit 0

porcelain="$(git -C "$ROOT" status --porcelain 2>/dev/null || true)"
[ -z "$porcelain" ] && exit 0

# Extract paths. Handles "XY path", "XY old -> new" (renames keep the new path).
extract_paths() {
  awk '
  {
    rest = substr($0, 4)
    if (match(rest, / -> /)) print substr(rest, RSTART + 4)
    else print rest
  }' | sed 's/^"//;s/"$//'
}

modified="$(printf '%s\n' "$porcelain" | extract_paths)"

# ── Baseline: files that were already dirty when this session started ───────
BASELINE_DIR="$ROOT/.claude"
BASELINE="$BASELINE_DIR/.dirty-baseline"
mkdir -p "$BASELINE_DIR" 2>/dev/null || true

# Refresh baseline if missing or stale (>6h old). Use stat with a portable fallback.
baseline_age_secs() {
  if [ ! -f "$BASELINE" ]; then echo 999999999; return; fi
  local mtime
  mtime="$(stat -c %Y "$BASELINE" 2>/dev/null || stat -f %m "$BASELINE" 2>/dev/null || echo 0)"
  echo $(( $(date +%s) - mtime ))
}

if [ "$(baseline_age_secs)" -gt 21600 ]; then
  printf '%s\n' "$porcelain" | extract_paths | sort -u > "$BASELINE" 2>/dev/null || true
fi

# Subtract baseline from current dirty set → leaves only files modified this session.
if [ -f "$BASELINE" ]; then
  new_dirty="$(comm -23 <(printf '%s\n' "$modified" | sort -u) <(sort -u "$BASELINE"))"
else
  new_dirty="$modified"
fi

# Nothing new this session → done.
[ -z "$new_dirty" ] && exit 0

# Utility folders that are NOT client projects.
EXCLUDE='^(\.claude|\.git|\.github|references|uploads)/'

# Top-level client folders that have any dirty file modified this session.
touched="$(printf '%s\n' "$new_dirty" | grep -E '^[^/]+/' | grep -vE "$EXCLUDE" | awk -F/ '{print $1}' | sort -u)"

needs=()
for folder in $touched; do
  # Among THIS-SESSION dirty files: anything other than the PROJECT.md itself?
  non_project="$(printf '%s\n' "$new_dirty" | grep -E "^${folder}/" | grep -vE "^${folder}/PROJECT\.md$" || true)"
  [ -z "$non_project" ] && continue
  # Was PROJECT.md also touched in this session (dirty or already-committed)?
  # We check both the live dirty set AND the git log for commits in the
  # baseline window so an already-committed PROJECT.md update counts.
  if printf '%s\n' "$new_dirty" | grep -qE "^${folder}/PROJECT\.md$"; then continue; fi
  if git -C "$ROOT" log --since="6 hours ago" --name-only --pretty=format: -- "${folder}/PROJECT.md" 2>/dev/null | grep -q .; then continue; fi
  needs+=("$folder")
done

[ ${#needs[@]} -eq 0 ] && exit 0

joined="$(printf '%s, ' "${needs[@]}" | sed 's/, $//')"
today="$(date +%Y-%m-%d)"
reason="PROJECT.md update required before finishing. You modified files in: ${joined}. Per the rule in ~/.claude/CLAUDE.md (\"PROJECT.md — every project gets a living context doc\"), every project folder's PROJECT.md must be updated at end of every turn that touched it. For each folder above: open <folder>/PROJECT.md, append a dated changelog entry (## ${today} — short summary of what changed), refresh Architecture/Conventions/Open threads if anything structural changed, then finish. If a folder is brand new and has no PROJECT.md yet, create one."

# Encode reason as JSON-safe string and emit the block decision.
if command -v jq >/dev/null 2>&1; then
  jq -nc --arg reason "$reason" '{decision:"block", reason:$reason}'
else
  # Fallback: minimal manual escape (no newlines, no embedded double quotes in $reason — safe by construction).
  esc="$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  printf '{"decision":"block","reason":"%s"}\n' "$esc"
fi
