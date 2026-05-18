#!/usr/bin/env bash
# Stop hook: block the turn end if a client folder was touched but its PROJECT.md wasn't updated.
# Rule lives in ~/.claude/CLAUDE.md ("PROJECT.md — every project gets a living context doc").
# Detection: git status --porcelain. Session starts clean, so dirty == "touched this turn".

set -uo pipefail

# Drain stdin (Stop hook payload is {}; we don't need it)
cat > /dev/null 2>&1 || true

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$ROOT" ] && exit 0

porcelain="$(git -C "$ROOT" status --porcelain 2>/dev/null || true)"
[ -z "$porcelain" ] && exit 0

# Extract paths. Handles "XY path", "XY old -> new" (renames keep the new path).
modified="$(printf '%s\n' "$porcelain" | awk '
{
  rest = substr($0, 4)
  if (match(rest, / -> /)) print substr(rest, RSTART + 4)
  else print rest
}' | sed 's/^"//;s/"$//')"

# Utility folders that are NOT client projects.
EXCLUDE='^(\.claude|\.git|\.github|references|uploads)/'

# Top-level client folders that have any dirty file.
touched="$(printf '%s\n' "$modified" | grep -E '^[^/]+/' | grep -vE "$EXCLUDE" | awk -F/ '{print $1}' | sort -u)"

needs=()
for folder in $touched; do
  # Anything dirty OTHER than the PROJECT.md itself?
  non_project="$(printf '%s\n' "$modified" | grep -E "^${folder}/" | grep -vE "^${folder}/PROJECT\.md$" || true)"
  [ -z "$non_project" ] && continue
  # Was PROJECT.md also touched? If yes, the convention is satisfied.
  if printf '%s\n' "$modified" | grep -qE "^${folder}/PROJECT\.md$"; then continue; fi
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
