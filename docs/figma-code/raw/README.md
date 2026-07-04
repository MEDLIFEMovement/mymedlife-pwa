# Raw Figma Code Archive

Date: 2026-07-04

The raw local Figma export code for this parity pass is stored in:

`figma-export-source-redacted-2026-07-04.zip`

The archive contains the exported code used as reference input for:

- role-based login
- general student/member app
- Student Leadership Command Center
- Staff Command Center Dashboard
  - the Staff shell is now copied into `src/components/figma-staff-command-center.tsx`
    and guarded by `docs/figma-staff-command-center-button-map.md`
  - includes the DS Admin `AdminPanel` shell now used by `/admin`

The staff export included demo strings that looked like provider API keys,
tokens, and a demo password. Those values were replaced with obvious
`REDACTED_DEMO_*` placeholders before this archive was committed.

The archive is reference-only. Production code should use the cleaned
components and services under `src/`, not import from this archive.
