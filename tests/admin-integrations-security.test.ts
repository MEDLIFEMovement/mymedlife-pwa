import { beforeEach, describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import {
  getIntegrationProvider,
  getIntegrationProviders,
} from "@/services/admin-integrations-registry";
import {
  getMaskedSecretHint,
  redactSensitiveText,
  sanitizeProviderError,
} from "@/services/admin-integrations-redaction";
import {
  listIntegrationAuditEvents,
  resetIntegrationStoreForTests,
  runMockConnectionTest,
  upsertIntegrationCredential,
} from "@/services/admin-integrations-store";
import { getAdminIntegrationProviderWorkspace } from "@/services/admin-integrations-workspace";

const actor = {
  actorUserId: "user-ds-admin",
  actorEmail: "ds.admin@mymedlife.test",
  actorRole: "ds_admin" as const,
};

describe("admin integrations security services", () => {
  beforeEach(() => {
    resetIntegrationStoreForTests();
  });

  it("loads the provider registry for all supported integrations", () => {
    expect(
      getIntegrationProviders().map((provider) => provider.key),
    ).toEqual([
      "hubspot",
      "luma",
      "power_bi",
      "bigquery",
      "openai",
      "n8n",
    ]);
    expect(getIntegrationProvider("openai")?.displayName).toBe("OpenAI Platform");
  });

  it("redacts common token and secret formats", () => {
    const raw = [
      "Authorization: Bearer sk-123456789abcdefghijkl",
      '{"private_key":"super-secret-value","refresh_token":"abc123xyz"}',
      "AIzaabcdefghijklmnopqrstuv",
    ].join("\n");

    const redacted = redactSensitiveText(raw);

    expect(redacted).not.toContain("sk-123456789abcdefghijkl");
    expect(redacted).not.toContain("super-secret-value");
    expect(redacted).not.toContain("abc123xyz");
    expect(redacted).toContain("[REDACTED]");
    expect(getMaskedSecretHint("my-secret-token")).toBe("••••oken");
    expect(sanitizeProviderError(new Error(raw)).detail).not.toContain("super-secret-value");
  });

  it("stores only masked metadata and keeps audit rows secret-free", () => {
    const result = upsertIntegrationCredential({
      actor,
      providerKey: "hubspot",
      environment: "staging",
      displayName: "HubSpot staging",
      ownerTeam: "Data Solutions",
      scopes: ["crm.objects.contacts.read"],
      metadata: {
        app_label: "HubSpot staging",
        scope_summary: "Read account metadata only",
      },
      secretValue: "Bearer sk-live-very-secret-token",
      reason: "Initial staging credential for safe DS review.",
      expiresAt: null,
    });

    expect(result.connection.maskedSecretHint).toBe("••••oken");
    expect(result.connection.metadata).toEqual({
      app_label: "HubSpot staging",
      scope_summary: "Read account metadata only",
    });
    expect(result.reference.secretStorePathOrKey).toContain("mock://hubspot/staging/");

    const auditRows = listIntegrationAuditEvents();
    const renderedAudit = JSON.stringify(auditRows);

    expect(renderedAudit).not.toContain("sk-live-very-secret-token");
    expect(renderedAudit).toContain("••••oken");
  });

  it("never returns raw secret values inside provider workspace data", async () => {
    upsertIntegrationCredential({
      actor,
      providerKey: "hubspot",
      environment: "staging",
      displayName: "HubSpot staging",
      ownerTeam: "Data Solutions",
      scopes: ["crm.objects.contacts.read"],
      metadata: {
        app_label: "HubSpot staging",
      },
      secretValue: "Bearer sk-live-very-secret-token",
      reason: "Testing browser-safe provider workspace data.",
      expiresAt: null,
    });

    const workspace = await getAdminIntegrationProviderWorkspace(
      getMockLocalActorContext("ds.admin@mymedlife.test"),
      "hubspot",
    );
    const renderedWorkspace = JSON.stringify(workspace);

    expect(renderedWorkspace).not.toContain("sk-live-very-secret-token");
    expect(renderedWorkspace).toContain("••••oken");
    expect(workspace.summary).toContain("masked hints");
  });

  it("sanitizes failed mock connection tests before returning or auditing them", () => {
    upsertIntegrationCredential({
      actor,
      providerKey: "openai",
      environment: "local",
      displayName: "OpenAI local",
      ownerTeam: "Data Solutions",
      scopes: ["models.read"],
      metadata: {
        project_label: "Agents sandbox",
      },
      secretValue: "invalid sk-123456789abcdefghijkl",
      reason: "Local credential rehearsal.",
      expiresAt: null,
    });

    const result = runMockConnectionTest({
      actor,
      providerKey: "openai",
      environment: "local",
      reason: "Safe read-only connection test from the console.",
    });

    expect(result.ok).toBe(false);
    expect(result.safeMessage).not.toContain("sk-123456789abcdefghijkl");

    const auditRows = listIntegrationAuditEvents();
    expect(JSON.stringify(auditRows)).not.toContain("sk-123456789abcdefghijkl");
  });
});
