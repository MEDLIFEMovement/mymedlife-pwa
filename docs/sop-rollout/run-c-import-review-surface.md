# myMEDLIFE SOP Rollout Run C Import Review Surface

Status: in progress

Updated: 2026-06-23

## Purpose

Run C makes imported SOP structure visible in the existing admin SOP library and
builder without opening editing, publishing, or external writes.

## What This Slice Adds

- structured draft-import posture in the SOP library
- review-warning visibility for imported templates
- source-reference, phase, and step counts for imported templates
- builder-level import posture for campaigns that now exist in the template
  registry

## Current Imported Campaign Coverage

Structured import review is now visible for:

- `planning-goal-setting`

Current visible import-review metadata includes:

- template version label
- import status
- source reference count
- phase count
- structured step count
- unresolved ambiguity warnings
- sensitive data warnings
- suggested rollout order
- coach and chapter/platform PDF page references

## Important Boundary

This slice does not make the current SOP builder fully workflow-driven yet.

It still uses:

- the existing review-ready builder definition model for most tab content
- the new template registry for imported-template review metadata

That split is intentional for now. It keeps the admin surfaces readable while
the workflow-runtime and deeper builder-tab migration still remain ahead.

## What Still Remains

- map builder tabs directly to template-registry structures instead of only the
  older builder definition model
- add richer phase/step review surfaces for imported templates
- import more campaigns after Planning / Goal Setting
- adapt Rush Month into the first strong runtime/UI workflow-driven lane
