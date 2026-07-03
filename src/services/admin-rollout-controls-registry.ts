import type {
  FeatureFlagDefinition,
  FeatureFlagKey,
  RolloutEnvironment,
  ThemeSettingDefinition,
  ThemeSettingKey,
} from "@/shared/types/admin-rollout-controls";

const environments: readonly RolloutEnvironment[] = ["local", "staging", "production"];

const featureFlagDefinitions = [
  {
    key: "staging_review_auth",
    label: "Staging review auth",
    description:
      "Lets approved reviewers sign in to the hosted staging app instead of staying locked at the review gate.",
    category: "review",
    controlsExternalWrite: false,
    approvalPolicy: "standard",
    defaultEnabledByEnvironment: {
      local: true,
      staging: false,
      production: false,
    },
  },
  {
    key: "action_started_write",
    label: "Action started write",
    description:
      "Turns on the narrow student-side action_started save path with audit and integration-event readback.",
    category: "writes",
    controlsExternalWrite: false,
    approvalPolicy: "production_confirmation",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "proof_metadata_write",
    label: "Proof metadata write",
    description:
      "Allows the smallest proof metadata submission loop while uploads and public sharing remain off.",
    category: "writes",
    controlsExternalWrite: false,
    approvalPolicy: "production_confirmation",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "leader_review_write",
    label: "Leader review write",
    description:
      "Allows leader review decisions for proof metadata without widening into HQ proof, messaging, or external sends.",
    category: "writes",
    controlsExternalWrite: false,
    approvalPolicy: "production_confirmation",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "membership_approval_write",
    label: "Membership approval write",
    description:
      "Opens the chapter membership approval path once role, roster, and audit coverage are approved.",
    category: "writes",
    controlsExternalWrite: false,
    approvalPolicy: "production_confirmation",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "luma_event_create",
    label: "Luma event create",
    description:
      "Allows myMEDLIFE to create Luma events from the chapter event flow.",
    category: "events",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "luma_event_update",
    label: "Luma event update",
    description:
      "Allows myMEDLIFE to update Luma event details after event creation is approved.",
    category: "events",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "luma_rsvp_writeback",
    label: "Luma RSVP writeback",
    description:
      "Writes RSVP intent from myMEDLIFE back to Luma while reminders and broadcasts stay off.",
    category: "events",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "luma_attendance_import",
    label: "Luma attendance import",
    description:
      "Imports checked-in attendance from Luma so points and leaderboard movement can read back inside the app.",
    category: "events",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "hubspot_write",
    label: "HubSpot writes",
    description:
      "Allows contact or chapter updates to flow from myMEDLIFE into HubSpot.",
    category: "integrations",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "n8n_send",
    label: "n8n sends",
    description:
      "Allows automation outbox items to move from review-only posture into active n8n execution.",
    category: "integrations",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "warehouse_export",
    label: "Warehouse export",
    description:
      "Allows governed exports from myMEDLIFE into the reporting warehouse or Power BI pipeline.",
    category: "integrations",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
  {
    key: "ai_actions",
    label: "AI actions",
    description:
      "Allows AI-driven recommendations or actions beyond read-only suggestions.",
    category: "integrations",
    controlsExternalWrite: true,
    approvalPolicy: "production_blocked",
    defaultEnabledByEnvironment: {
      local: false,
      staging: false,
      production: false,
    },
  },
] as const satisfies readonly FeatureFlagDefinition[];

const themeSettingDefinitions = [
  {
    key: "background",
    label: "Background",
    description: "Primary app background token.",
    inputType: "color",
    group: "core",
    defaultValueByEnvironment: {
      local: "#f8fbff",
      staging: "#f8fbff",
      production: "#f8fbff",
    },
  },
  {
    key: "foreground",
    label: "Foreground",
    description: "Primary text color token.",
    inputType: "color",
    group: "core",
    defaultValueByEnvironment: {
      local: "#10223f",
      staging: "#10223f",
      production: "#10223f",
    },
  },
  {
    key: "panel",
    label: "Panel",
    description: "Default surface background token.",
    inputType: "text",
    group: "core",
    defaultValueByEnvironment: {
      local: "rgba(255, 255, 255, 0.88)",
      staging: "rgba(255, 255, 255, 0.88)",
      production: "rgba(255, 255, 255, 0.88)",
    },
  },
  {
    key: "panel_strong",
    label: "Panel strong",
    description: "Stronger surface background token for dense cards.",
    inputType: "text",
    group: "core",
    defaultValueByEnvironment: {
      local: "rgba(255, 255, 255, 0.96)",
      staging: "rgba(255, 255, 255, 0.96)",
      production: "rgba(255, 255, 255, 0.96)",
    },
  },
  {
    key: "line",
    label: "Line",
    description: "Shared border and separator token.",
    inputType: "text",
    group: "core",
    defaultValueByEnvironment: {
      local: "rgba(93, 143, 246, 0.14)",
      staging: "rgba(93, 143, 246, 0.14)",
      production: "rgba(93, 143, 246, 0.14)",
    },
  },
  {
    key: "accent",
    label: "Accent",
    description: "Primary action color token.",
    inputType: "color",
    group: "core",
    defaultValueByEnvironment: {
      local: "#5d8ff6",
      staging: "#5d8ff6",
      production: "#5d8ff6",
    },
  },
  {
    key: "accent_strong",
    label: "Accent strong",
    description: "Pressed and emphasized action color token.",
    inputType: "color",
    group: "core",
    defaultValueByEnvironment: {
      local: "#3b73e7",
      staging: "#3b73e7",
      production: "#3b73e7",
    },
  },
] as const satisfies readonly ThemeSettingDefinition[];

export function getFeatureFlagDefinitions(): readonly FeatureFlagDefinition[] {
  return featureFlagDefinitions;
}

export function getFeatureFlagDefinition(
  key: string | null | undefined,
): FeatureFlagDefinition | null {
  if (!key) {
    return null;
  }

  return featureFlagDefinitions.find((definition) => definition.key === key) ?? null;
}

export function getThemeSettingDefinitions(): readonly ThemeSettingDefinition[] {
  return themeSettingDefinitions;
}

export function getThemeSettingDefinition(
  key: string | null | undefined,
): ThemeSettingDefinition | null {
  if (!key) {
    return null;
  }

  return themeSettingDefinitions.find((definition) => definition.key === key) ?? null;
}

export function getRolloutEnvironments(): readonly RolloutEnvironment[] {
  return environments;
}

export function isFeatureFlagKey(value: string): value is FeatureFlagKey {
  return getFeatureFlagDefinition(value) !== null;
}

export function isThemeSettingKey(value: string): value is ThemeSettingKey {
  return getThemeSettingDefinition(value) !== null;
}
