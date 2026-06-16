# Goal 41: Coach Portfolio Readiness

## Purpose

Goal 41 adds a mock-safe coach portfolio readiness panel to `/coach`.

The user clarified that coaches can own portfolios of many universities, that
chapters may move from an expansion coach to a portfolio coach, and that coach
assignments may change year to year. This goal previews that operating model
without enabling real assignment edits.

## Role Behavior

- Coaches can see a local portfolio readiness list.
- Admins can see HQ coach support posture.
- Super admins can see the full local portfolio.
- General members, chapter leaders, and DS admins cannot see coach portfolio
  rows.

## What The Panel Shows

- chapter name and campus
- expansion coach / portfolio coach / handoff pending posture
- readiness score
- advance / hold / intervene decision
- low / medium / high risk
- proof pending
- open follow-ups
- the next coach support step
- coach assignment change posture as read-only

## Safety Boundary

This panel does not:

- change coach assignments
- create real coach portfolios
- enable production auth
- write to Supabase from the browser
- send escalation packets
- trigger n8n, HubSpot, Luma, warehouse, Power BI, SMS, email, or AI writes

Coach changes remain disabled and future admin-controlled.

## Implementation Notes

- `src/services/coach-portfolio-readiness.ts` owns portfolio visibility,
  sorting, counts, and fake local rows.
- `src/components/coach-portfolio-readiness-panel.tsx` renders the panel.
- `/coach` mounts the panel after the top readiness metrics.
- `tests/coach-portfolio-readiness.test.ts` covers role boundaries, sorting,
  handoff count, current chapter inclusion, and disabled coach changes.
