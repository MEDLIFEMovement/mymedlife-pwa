import type {
  FeatureFlagDefinition,
  FeatureFlagEnvironment,
  FeatureFlagKey,
  FeatureFlagStatus,
} from "./types";

export const featureFlagEnvironments = [
  "local",
  "preview",
  "staging",
  "production",
] as const satisfies readonly FeatureFlagEnvironment[];

export const featureFlagStatuses = [
  "enabled",
  "disabled",
  "staging_only",
  "mock_only",
  "internal_only",
  "scheduled",
  "emergency_disabled",
] as const satisfies readonly FeatureFlagStatus[];

const enabledEverywhere = {
  local: "enabled",
  preview: "enabled",
  staging: "enabled",
  production: "enabled",
} as const satisfies Record<FeatureFlagEnvironment, FeatureFlagStatus>;

const stagingOnly = {
  local: "mock_only",
  preview: "staging_only",
  staging: "staging_only",
  production: "disabled",
} as const satisfies Record<FeatureFlagEnvironment, FeatureFlagStatus>;

const disabledEverywhere = {
  local: "disabled",
  preview: "disabled",
  staging: "disabled",
  production: "disabled",
} as const satisfies Record<FeatureFlagEnvironment, FeatureFlagStatus>;

export const featureFlagRegistry = [
  {
    key: "events_luma_points",
    kind: "module",
    label: "Events, Luma, and Points",
    description:
      "The chapter event loop: event visibility, Luma read/write gates, RSVP posture, attendance import, points, and leaderboards.",
    owner: "Product",
    defaultStatusByEnvironment: enabledEverywhere,
    dependencies: [],
    gracefulFallback:
      "Show existing app-owned event cards, manual attendance copy, and local leaderboard state.",
    externalApiBoundary: false,
  },
  {
    key: "ugc_feed_proof",
    kind: "module",
    label: "UGC Feed and Proof",
    description:
      "Proof/UGC capture, review, and feed publishing surfaces.",
    owner: "HQ",
    defaultStatusByEnvironment: enabledEverywhere,
    dependencies: [],
    gracefulFallback:
      "Show proof review disabled copy and route users back to the event/action loop.",
    externalApiBoundary: false,
  },
  {
    key: "task_assignment",
    kind: "module",
    label: "Task Assignment",
    description:
      "Leader-created assignments, member action state, and proof requests.",
    owner: "Product",
    defaultStatusByEnvironment: enabledEverywhere,
    dependencies: [],
    gracefulFallback:
      "Keep events, points, and role dashboards visible while assignment creation controls are disabled.",
    externalApiBoundary: false,
  },
  {
    key: "sop_workflows_next_action",
    kind: "module",
    label: "SOP Workflows and Next Action",
    description:
      "Workflow-template runtime, SOP builder, role matrix, and next-action resolution.",
    owner: "DS",
    defaultStatusByEnvironment: {
      local: "mock_only",
      preview: "mock_only",
      staging: "mock_only",
      production: "disabled",
    },
    dependencies: [],
    gracefulFallback:
      "Show campaign routes from static/mock services; do not block events, Luma, points, or leaderboards.",
    externalApiBoundary: false,
  },
  {
    key: "staff_analytics_reporting",
    kind: "module",
    label: "Staff Analytics and Reporting",
    description:
      "Staff portfolio analytics, feed analytics, organization leaderboard, and reporting read models.",
    owner: "HQ",
    defaultStatusByEnvironment: enabledEverywhere,
    dependencies: [],
    gracefulFallback:
      "Show simplified chapter health cards and route to event/points review.",
    externalApiBoundary: false,
  },
  {
    key: "integrations_outbox",
    kind: "module",
    label: "Integrations Outbox",
    description:
      "Internal integration events, automation outbox visibility, and live-send preflight review.",
    owner: "DS",
    defaultStatusByEnvironment: enabledEverywhere,
    dependencies: [],
    gracefulFallback:
      "Show disabled integration posture and zero-send summary without queue mutation controls.",
    externalApiBoundary: false,
  },
  {
    key: "mcp_read_only_analytics",
    kind: "module",
    label: "MCP Read-Only Analytics",
    description:
      "Future read-only analytics connector surfaces for DS inspection.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: [],
    gracefulFallback: "Hide MCP analytics routes and keep built-in staff reporting visible.",
    externalApiBoundary: true,
  },
  {
    key: "ds_admin_controls",
    kind: "module",
    label: "DS Admin Controls",
    description:
      "Secure DS/Super Admin backend controls for flags, theme, integrations, permissions, and audit posture.",
    owner: "DS",
    defaultStatusByEnvironment: enabledEverywhere,
    dependencies: [],
    gracefulFallback: "Keep admin review packets read-only and hide mutation controls.",
    externalApiBoundary: false,
  },
  {
    key: "theme_design_system",
    kind: "module",
    label: "Theme and Design System",
    description:
      "Backend-managed MEDLIFE theme tokens, drafts, previews, publish, rollback, and accessibility checks.",
    owner: "Product",
    defaultStatusByEnvironment: enabledEverywhere,
    dependencies: ["ds_admin_controls"],
    gracefulFallback: "Use the default MEDLIFE blue/yellow/white token set.",
    externalApiBoundary: false,
  },
  {
    key: "integration_luma",
    kind: "provider",
    label: "Luma",
    description:
      "Server-only Luma calendar, event, RSVP, and attendance API boundary.",
    owner: "DS",
    defaultStatusByEnvironment: stagingOnly,
    dependencies: ["events_luma_points"],
    gracefulFallback:
      "Use app-owned events, manual RSVP posture, and no external attendee calls.",
    externalApiBoundary: true,
  },
  {
    key: "integration_hubspot",
    kind: "provider",
    label: "HubSpot",
    description: "CRM contact/follow-up integration boundary.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: ["integrations_outbox"],
    gracefulFallback: "Keep HubSpot follow-up manual and show disabled outbox rows.",
    externalApiBoundary: true,
  },
  {
    key: "integration_shopify",
    kind: "provider",
    label: "Shopify",
    description: "SLT payment status integration boundary.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: ["integrations_outbox"],
    gracefulFallback: "Use manually reviewed SLT payment status.",
    externalApiBoundary: true,
  },
  {
    key: "integration_givelively",
    kind: "provider",
    label: "GiveLively",
    description: "Donation/fundraising integration boundary.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: ["integrations_outbox"],
    gracefulFallback: "Keep fundraising data outside myMEDLIFE.",
    externalApiBoundary: true,
  },
  {
    key: "integration_bigquery",
    kind: "provider",
    label: "BigQuery",
    description: "Warehouse export integration boundary.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: ["staff_analytics_reporting", "integrations_outbox"],
    gracefulFallback: "Use in-app read models and manual reporting.",
    externalApiBoundary: true,
  },
  {
    key: "integration_powerbi",
    kind: "provider",
    label: "Power BI",
    description: "Governed dashboard export integration boundary.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: ["staff_analytics_reporting", "integrations_outbox"],
    gracefulFallback: "Use myMEDLIFE staff analytics until governed exports are approved.",
    externalApiBoundary: true,
  },
  {
    key: "integration_n8n",
    kind: "provider",
    label: "n8n",
    description: "Automation consumer boundary; never source of truth.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: ["integrations_outbox"],
    gracefulFallback: "Keep automation outbox rows disabled and manual.",
    externalApiBoundary: true,
  },
  {
    key: "integration_openai",
    kind: "provider",
    label: "OpenAI",
    description: "AI recommendation and assistant integration boundary.",
    owner: "DS",
    defaultStatusByEnvironment: disabledEverywhere,
    dependencies: ["integrations_outbox"],
    gracefulFallback: "Keep recommendations human-authored and logged manually.",
    externalApiBoundary: true,
  },
] as const satisfies readonly FeatureFlagDefinition[];

export const featureFlagKeys = featureFlagRegistry.map((flag) => flag.key) as FeatureFlagKey[];
