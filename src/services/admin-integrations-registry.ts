import type {
  IntegrationProvider,
  IntegrationProviderKey,
} from "@/shared/types/admin-integrations";

const providerRegistry = [
  {
    key: "hubspot",
    displayName: "HubSpot",
    description: "CRM sync, contact lifecycle, and chapter operations mapping.",
    ownerTeam: "Data Solutions",
    supportedEnvironments: ["local", "staging", "production"],
    safeTestDescription: "Read account or app metadata only.",
    risks: [
      "Overbroad CRM scopes",
      "Contact data exposure",
      "Accidental workflow or lifecycle triggers",
    ],
    metadataFields: [
      {
        key: "app_label",
        label: "App label",
        type: "text",
        required: true,
        helpText: "Friendly internal name for this HubSpot connection.",
      },
      {
        key: "scope_summary",
        label: "Scope summary",
        type: "textarea",
        required: true,
        helpText: "Describe the least-privilege scopes requested for this token.",
      },
      {
        key: "expires_at",
        label: "Expires at",
        type: "date",
        required: false,
        helpText: "Optional known expiry date for the credential.",
      },
    ],
  },
  {
    key: "luma",
    displayName: "Luma",
    description: "Event and attendance configuration with writes still disabled.",
    ownerTeam: "Programs",
    supportedEnvironments: ["local", "staging", "production"],
    safeTestDescription: "Read organizer or event metadata only.",
    risks: [
      "Attendee data exposure",
      "Accidental event mutation",
      "Production key mixups across environments",
    ],
    metadataFields: [
      {
        key: "organizer_label",
        label: "Organizer label",
        type: "text",
        required: true,
        helpText: "Friendly label for the Luma organizer or workspace.",
      },
      {
        key: "scope_summary",
        label: "Scope summary",
        type: "textarea",
        required: true,
        helpText: "Describe which read endpoints this credential should reach.",
      },
    ],
  },
  {
    key: "power_bi",
    displayName: "Power BI",
    description: "Workspace and dataset metadata for analytics reporting.",
    ownerTeam: "Data Solutions",
    supportedEnvironments: ["local", "staging", "production"],
    safeTestDescription: "Read workspace and dataset metadata only.",
    risks: [
      "Broad tenant permissions",
      "Dataset refresh abuse",
      "Reporting data leakage",
    ],
    metadataFields: [
      {
        key: "tenant_id",
        label: "Tenant ID",
        type: "text",
        required: true,
        helpText: "Azure tenant tied to this Power BI connection.",
      },
      {
        key: "workspace_scope",
        label: "Workspace scope",
        type: "textarea",
        required: true,
        helpText: "List the workspaces or datasets this connection may reach.",
      },
    ],
  },
  {
    key: "bigquery",
    displayName: "BigQuery / GCP",
    description: "Warehouse metadata and dataset access without raw JSON leakage.",
    ownerTeam: "Data Solutions",
    supportedEnvironments: ["local", "staging", "production"],
    safeTestDescription: "Read dataset metadata only.",
    risks: [
      "Service account JSON leakage",
      "Overbroad IAM roles",
      "Data exfiltration from warehouse projects",
    ],
    metadataFields: [
      {
        key: "project_id",
        label: "Project ID",
        type: "text",
        required: true,
        helpText: "Warehouse project or billing project tied to this connection.",
      },
      {
        key: "dataset_scope",
        label: "Dataset scope",
        type: "textarea",
        required: true,
        helpText: "List the datasets or views this connection may read.",
      },
    ],
  },
  {
    key: "openai",
    displayName: "OpenAI Platform",
    description: "Project-scoped API access for future agent infrastructure.",
    ownerTeam: "Data Solutions",
    supportedEnvironments: ["local", "staging", "production"],
    safeTestDescription: "Read project or capability metadata only.",
    risks: [
      "Spend abuse",
      "Prompt or data leakage",
      "Overbroad tool access through future agents",
    ],
    metadataFields: [
      {
        key: "project_label",
        label: "Project label",
        type: "text",
        required: true,
        helpText: "Friendly label for the OpenAI project or bounded agent lane.",
      },
      {
        key: "budget_notes",
        label: "Budget notes",
        type: "textarea",
        required: false,
        helpText: "Optional notes about budget, rate limit, or model policy.",
      },
    ],
  },
  {
    key: "n8n",
    displayName: "n8n",
    description: "Automation processor with signed-webhook and run control posture.",
    ownerTeam: "Operations",
    supportedEnvironments: ["local", "staging", "production"],
    safeTestDescription: "Read workflow metadata or verify a safe endpoint.",
    risks: [
      "Arbitrary automation execution",
      "Webhook abuse",
      "Production run enablement without approval",
    ],
    metadataFields: [
      {
        key: "workspace_url",
        label: "Workspace URL",
        type: "url",
        required: true,
        helpText: "Environment-specific n8n workspace or API endpoint.",
      },
      {
        key: "workflow_scope",
        label: "Workflow scope",
        type: "textarea",
        required: true,
        helpText: "Describe which workflow IDs or webhook paths this credential can touch.",
      },
    ],
  },
] as const satisfies readonly IntegrationProvider[];

export function getIntegrationProviders(): readonly IntegrationProvider[] {
  return providerRegistry;
}

export function getIntegrationProvider(
  providerKey: string,
): IntegrationProvider | null {
  return (
    providerRegistry.find((provider) => provider.key === providerKey) ?? null
  );
}

export function isIntegrationProviderKey(
  providerKey: string,
): providerKey is IntegrationProviderKey {
  return providerRegistry.some((provider) => provider.key === providerKey);
}
