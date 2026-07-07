# Figma DS Admin Panel Button Map

Date: 2026-07-04

Source: copied/redacted Figma admin shell embedded from the Staff Command Center export.

Implementation copy:

- `src/components/figma-admin-panel.tsx`
- Route owner: `/admin`
- Staff overlay owner: `/staff` internal Admin screen after DS Admin / Super Admin role gate

This map documents the visible admin controls without changing the Figma layout.
Controls that would imply production writes, provider writes, secret handling, or
external sends are visibly disabled unless an audited server route already owns
the action.

| Label / control | Screen / route | Component file | Intended role | Expected action | Current behavior | Target route / service / modal | Required permission | Required feature flag | Status |
|---|---|---|---|---|---|---|---|---|---|
| Admin vertical nav: Overview | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Switch to admin overview | Local Figma shell screen state | `/admin` | DS Admin / Super Admin | none | `wired_staging` |
| Admin vertical nav: Users | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Switch to user directory | Local Figma shell screen state | `/admin/users` for audited user management | DS Admin / Super Admin | admin write flags for mutation | `wired_staging` |
| Admin vertical nav: Chapters | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Switch to chapter directory | Local Figma shell screen state | `/admin/chapters` for audited chapter management | DS Admin / Super Admin | admin write flags for mutation | `wired_staging` |
| Admin vertical nav: Modules | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review module posture | Local Figma shell screen state; module toggles are blocked | future audited feature-flag workflow | DS Admin / Super Admin | feature flag admin approval | `disabled_visible` |
| Admin vertical nav: Luma Events | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review Luma posture | Local Figma shell screen state; live writes are off | `/admin/integrations/luma`, `admin-luma-integration-status.ts` | DS Admin / Super Admin | Luma staging flags | `wired_staging` |
| Admin vertical nav: Points | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review point rules and ledger posture | Local Figma shell screen state | `/admin/points-write`, points/KPI services | DS Admin / Super Admin | points write flags | `wired_staging` |
| Admin vertical nav: Integrations | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review provider catalog | Local Figma shell screen state; provider tests/enables are blocked | `/admin/integration-outbox`, future provider setup | DS Admin / Super Admin | provider approval flags | `disabled_visible` |
| Admin vertical nav: Audit Logs | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review audit events | Local Figma shell screen state | `/admin/audit-log`, `admin-audit-log-review.ts` | DS Admin / Super Admin | none | `wired_staging` |
| Admin vertical nav: System Health | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review app health posture | Local Figma shell screen state; external systems shown as disabled/readback-only | `/admin/system-health` | DS Admin / Super Admin | none | `wired_staging` |
| Admin vertical nav: API Keys | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review secret references | Local Figma shell screen state with secret refs only; rotate/revoke controls remain local/blocked unless gated | future server-only secret abstraction | DS Admin / Super Admin + step-up | provider secret flags | `placeholder_blocked` |
| Admin vertical nav: MCP Connections | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review MCP provider posture and access policy | Local Figma shell screen state; connection changes and write access remain blocked | future audited MCP policy service | DS Admin / Super Admin | MCP admin flags | `placeholder_blocked` |
| Admin vertical nav: Settings | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Review admin controls | Local Figma shell screen state | future admin settings workflow | DS Admin / Super Admin | admin settings flags | `wired_staging` |
| Disabled modules group: SOP Builder, Task Assignment, UGC / Feed, MCP Analytics | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Communicate unavailable modules | Visible disabled items only | future approved module routes | DS Admin / Super Admin | per-module flags | `disabled_visible` |
| Notification bell | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Open admin notifications | Visible disabled control with blocked tooltip | future notification center | DS Admin / Super Admin | notification flags | `disabled_visible` |
| User chip / logout icon | `/admin` | `figma-admin-panel.tsx` | DS Admin / Super Admin | Account/session affordance | Informational row only; no faux logout click target | top-right account menu / sign-out action | signed-in admin | none | `disabled_visible` |
| User search input | Users screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Filter users | Local Figma filter | `/admin/users` directory/search service | DS Admin / Super Admin | none | `wired_staging` |
| Role filter select | Users screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Filter users by role | Local Figma filter | `/admin/users` directory/search service | DS Admin / Super Admin | none | `wired_staging` |
| User table row | Users screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Open user detail drawer | Local Figma drawer | `/admin/users` audited user management | DS Admin / Super Admin | admin write flags for mutation | `wired_staging` |
| Change Role / Edit Modules / Resend Invite / Disable User | User detail drawer | `figma-admin-panel.tsx` | DS Admin / Super Admin | Mutate user access or send invite | Visible disabled controls with blocked tooltips | `/admin/users`, `admin-management-write.ts` | DS Admin / Super Admin | admin write / external-send flags | `disabled_visible` |
| Chapter search input | Chapters screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Filter chapters | Local Figma filter | `/admin/chapters`, admin chapter services | DS Admin / Super Admin | none | `wired_staging` |
| Chapter table row | Chapters screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Open chapter detail drawer | Local Figma drawer | `/admin/chapters` audited chapter management | DS Admin / Super Admin | admin chapter write flags for mutation | `wired_staging` |
| View Events / Edit Modules / Audit History | Chapter detail drawer | `figma-admin-panel.tsx` | DS Admin / Super Admin | Drill into chapter actions | Visible disabled controls with blocked tooltips | staff event view, module workflow, `/admin/audit-log` | DS Admin / Super Admin | admin/module flags | `disabled_visible` |
| Module Enable / Disable buttons | Modules screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Toggle feature modules | Visible disabled controls; no production toggle from static shell | future audited feature-flag workflow | DS Admin / Super Admin + approval | feature flag admin approval | `disabled_visible` |
| Luma Live Writes Off | Luma Events screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Show Luma write posture | Visible disabled control; no live Luma call | `/admin/integrations/luma` | DS Admin / Super Admin | Luma staging flags | `disabled_visible` |
| Test Connection / Sync Mock Event / View Outbox | Luma Events screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Test or inspect Luma/outbox | Visible disabled controls pointing to audited setup/readback surfaces | `/admin/integrations/luma`, `/admin/integration-outbox` | DS Admin / Super Admin | Luma/outbox flags | `disabled_visible` |
| Points global toggle / role toggles / rule inputs | Points screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Adjust points rules | Local Figma state only; no ledger materialization | `/admin/points-write`, points/KPI services | DS Admin / Super Admin | points write flags | `placeholder_blocked` |
| Integration card Test / View Logs / Enable | Integrations screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Test or enable providers | Visible disabled controls; external providers stay off | `/admin/integration-outbox`, future provider setup | DS Admin / Super Admin | provider approval flags | `disabled_visible` |
| Audit search / status filter | Audit Logs screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Filter audit rows | Local Figma filter | `/admin/audit-log`, `admin-audit-log-review.ts` | DS Admin / Super Admin | none | `wired_staging` |
| System Health Refresh | System Health screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Refresh status | Visible disabled control with blocked tooltip | `/admin/system-health` | DS Admin / Super Admin | none | `disabled_visible` |
| API-key show/hide / copy / rotate / revoke / add key | API Keys screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Manage provider secrets | Local/redacted secret-ref posture; no raw key exposure | future server-only secret abstraction with step-up | DS Admin / Super Admin + step-up | provider secret flags | `placeholder_blocked` |
| MCP test / connect / disconnect / write-access controls | MCP Connections screen | `figma-admin-panel.tsx` | DS Admin / Super Admin | Manage MCP connections | Local Figma state; write access is disabled unless explicitly enabled later | future audited MCP policy service | DS Admin / Super Admin | MCP admin flags | `placeholder_blocked` |

## Safety Notes

- Luma, HubSpot, warehouse, Power BI, n8n, outbox, and API-key controls do not
  perform production writes from this shell.
- The copied admin shell is covered by `tests/figma-shell-cta-safety.test.ts`,
  which blocks fake links, empty click handlers, JavaScript void links, raw
  buttons without handler/submit/disabled state, and copied production-live
  integration copy.
- `/admin/integrations/luma` is the audited provider-status route for this run.
  It exposes mode, test posture, last test/sync readback, error log, outbox
  status, and blocked controls without rendering raw secrets.
