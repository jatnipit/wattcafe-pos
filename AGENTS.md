<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Environment files (hard rule)

Never read, write, create, copy, diff, or print any `.env` file. This covers `.env`, `.env.local`, `.env.hosted`, `.env.production`, and every other `.env.*` path, plus any command that would surface their contents (`Get-Content`, `cat`, `Select-String`, `git diff`, `git show`, printing process env, etc.).

The single exception is `.env.example`, which agents may read and edit freely. It holds placeholders only, never real secrets.

When the work needs a new environment variable:

1. Add it to `.env.example` with an empty value and a short comment saying where the value comes from.
2. Document the manual step in `docs/setup-checklist.md`: which dashboard screen produces the value, which file it belongs in, and how to verify it.
3. Ask the user to write the real value themselves.

The user fills real files. If a command fails because a value is missing or malformed, report the variable name and point at the matching checklist step. Do not open the file to check it, and do not ask the user to paste secrets into the chat.

This applies indirectly too: do not generate setup scripts, wizards, or shell snippets that write `.env` files. Such a script may open the dashboard, describe the step, and update `.env.example`; the user types the real value into the real file themselves.

## Agent skills

### Issue tracker

Issues and specs live as markdown under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five default roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the root and ADRs in `docs/adr/`. See `docs/agents/domain.md`.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
