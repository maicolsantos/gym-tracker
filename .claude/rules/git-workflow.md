# Git Workflow

## Commit Message Format

```
type(scope): message
```

- **Language**: English
- **Subject**: max 50 characters, no body needed
- **No Co-Authored-By** tags
- Attribution disabled globally via `~/.claude/settings.json`

### Types

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance (deps, config) |
| `refactor` | Code refactoring |
| `style` | Formatting, no logic change |
| `docs` | Documentation |
| `test` | Tests |

---

## Pull Request Workflow

Use the `/mrcreate` skill to generate PR title and description.

### Title
- Start with an action verb
- Under 72 characters
- No emojis

### Description Sections
- **Overview** — what and why
- **Key Changes** — bullet list of significant changes
- **Technical Details** _(if needed)_ — implementation notes
- **Breaking Changes** _(if needed)_ — migration steps
- **Testing Notes** _(if needed)_ — how to verify

Output is ready to copy-paste into GitHub/GitLab.

### Pre-PR Checklist
1. Analyze full commit history (not just latest commit)
2. Run `git diff [base-branch]...HEAD` to see all changes
3. Push with `-u` flag if new branch

---

> For the full development process (planning, TDD, code review) before git operations,
> see [development-workflow.md](./development-workflow.md).
