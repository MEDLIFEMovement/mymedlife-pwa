# Claude PR Review Playbook

This file defines the Claude Desktop PR review pilot for
`MEDLIFEMovement/mymedlife-pwa`.

## Pilot Boundaries

- Claude reviews Codex-authored PRs before human review.
- Claude returns a draft review summary first.
- Codex or a human decides what to post, fix, or ignore.
- Claude does not merge, approve, push, or post direct GitHub review comments.

## Current Prerequisites

- Claude must have its own GitHub token set as `GH_TOKEN` in the Claude
  environment.
- The SessionStart hook should authenticate `gh` automatically in a new Claude
  session.
- `main` should be protected before this process expands. Current live GitHub
  checks on June 19, 2026 showed `main` is not protected in this repo yet.

## Invocation Prompt

Use a prompt like this in Claude Desktop:

```text
Review PR #<number> in MEDLIFEMovement/mymedlife-pwa.
You are review-only. Read the PR description, diff, linked issue context, and
validation notes. Use docs/review/claude-pr-review-template.md and return
findings first, ordered by severity. Do not push, merge, approve, or post
direct GitHub comments.
```

## Review Workflow

1. Codex opens or updates a PR.
2. Claude reviews the PR against the repo guardrails in `AGENTS.md`.
3. Claude drafts findings using
   `docs/review/claude-pr-review-template.md`.
4. The draft is pasted into the PR body, a shared note, or Codex chat before
   human review.
5. Human review stays authoritative.

## Repo-Specific Review Focus

- permission and role boundary regressions
- write-path safety, especially around local Supabase writes and future
  activation gates
- RLS or auth assumptions that are not covered by tests
- accidental stack drift or over-complex abstractions
- missing rollout, audit, or rollback evidence for sensitive changes
