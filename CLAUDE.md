# Claude Code — Project Instructions

## Preferences

### GitHub Pages Links
Whenever the user asks for a public link or GitHub Pages link, always return it wrapped in the GHL iframe embed code (never a bare URL) so it can be pasted directly into GoHighLevel.

See `.claude/commands/ghl-embed.md` for the full template.

---

## Custom Skills
Custom slash commands live in `.claude/commands/`. Each `.md` file becomes a `/command-name` skill.

| Command | Description |
|---|---|
| `/ghl-embed` | Wraps a GitHub Pages URL in the full GHL-compatible iframe embed code |
