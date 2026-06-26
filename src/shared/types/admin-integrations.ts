export type IntegrationProviderKey =
  | "hubspot"
  | "luma"
  | "power_bi"
  | "bigquery"
  | "openai"
  | "n8n";

export type IntegrationEnvironment = "local" | "staging" | "production";

export type IntegrationConnectionStatus =
  | "not_configured"
  | "configured"
  | "disabled"
  | "error"
  | "expired";

export type StepUpMethod = "local_password_reauth";

export type SecretStoreType = "mock";

export type IntegrationProviderFieldType =
  | "text"
  | "password"
  | "textarea"
  | "url"
  | "date";

export type IntegrationProviderFieldDefinition = {
  key: string;
  label: string;
  type: IntegrationProviderFieldType;
  required: boolean;
  helpText: string;
};

export type IntegrationProvider = {
  key: IntegrationProviderKey;
  displayName: string;
  description: string;
  ownerTeam: string;
  supportedEnvironments: readonly IntegrationEnvironment[];
  safeTestDescription: string;
  risks: readonly string[];
  metadataFields: readonly IntegrationProviderFieldDefinition[];
};

export type IntegrationConnection = {
  id: string;
  providerKey: IntegrationProviderKey;
  environment: IntegrationEnvironment;
  status: IntegrationConnectionStatus;
  displayName: string;
  ownerUserId: string;
  ownerTeam: string;
  metadata: Record<string, string>;
  scopes: readonly string[];
  secretReferenceId: string | null;
  maskedSecretHint: string | null;
  secretVersion: number | null;
  lastTestedAt: string | null;
  lastTestStatus: "not_run" | "success" | "failed";
  lastTestMessage: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type SecretReference = {
  id: string;
  providerKey: IntegrationProviderKey;
  environment: IntegrationEnvironment;
  secretStoreType: SecretStoreType;
  secretStorePathOrKey: string;
  secretVersion: number;
  maskedHint: string;
  createdBy: string;
  rotatedBy: string | null;
  rotatedAt: string | null;
  expiresAt: string | null;
  disabledAt: string | null;
};

export type IntegrationAuditAction =
  | "integrations_console_viewed"
  | "step_up_success"
  | "step_up_failed"
  | "connector_created"
  | "connector_metadata_updated"
  | "secret_added"
  | "secret_rotated"
  | "secret_disabled"
  | "connector_disabled"
  | "connector_tested"
  | "production_change_attempted"
  | "breakglass_used";

export type IntegrationAuditEvent = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: "ds_admin" | "super_admin";
  action: IntegrationAuditAction;
  providerKey: IntegrationProviderKey | null;
  environment: IntegrationEnvironment | null;
  result: "success" | "failure" | "blocked";
  reason: string;
  correlationId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadataSummary: Record<string, string>;
};

export type RedactedProviderError = {
  code: string;
  safeMessage: string;
  detail: string;
};

export type DsSecretStepUpPayload = {
  userId: string;
  email: string;
  method: StepUpMethod;
  sessionId: string;
  verifiedAt: string;
  expiresAt: string;
};

export type DsSecretStepUpState = {
  isVerified: boolean;
  status: "missing" | "verified" | "expired" | "invalid" | "blocked";
  method: StepUpMethod | null;
  sessionId: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  failureCount: number;
  blockedUntil: string | null;
  message: string;
};

export type IntegrationMutationResultCode =
  | "success"
  | "missing_auth"
  | "role_blocked"
  | "step_up_required"
  | "step_up_expired"
  | "rate_limited"
  | "provider_not_found"
  | "environment_not_allowed"
  | "secret_required"
  | "reason_required"
  | "production_confirmation_required"
  | "not_configured"
  | "audit_failed"
  | "test_failed";

export type IntegrationMutationResult = {
  success: boolean;
  code: IntegrationMutationResultCode;
  title: string;
  plainEnglishMessage: string;
  providerKey: IntegrationProviderKey | null;
  environment: IntegrationEnvironment | null;
};
