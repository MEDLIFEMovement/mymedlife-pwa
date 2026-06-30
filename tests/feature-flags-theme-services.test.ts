import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  canManageFeatureFlags,
  featureFlagEnvironments,
  featureFlagStatuses,
  getFeatureFlagDefinitions,
  getFeatureResolvedState,
  getFeatureStatus,
  getModuleFeatureAvailability,
  isFeatureEnabled,
  listFeatureFlagAuditRecords,
  requireFeature,
  resetFeatureFlagStoreForTests,
  updateFeatureFlagStatus,
} from "@/modules/feature-flags";
import {
  canManageTheme,
  getPublishedThemeCssVariables,
  getThemeContrastResults,
  getThemeSnapshot,
  listThemeAuditRecords,
  publishThemeDraft,
  resetThemeStoreForTests,
  restoreDefaultTheme,
  rollbackTheme,
  saveThemeDraft,
} from "@/modules/theme";
import { getAssignmentCreateWriteConfig } from "@/services/assignment-create-write";
import { getEvidenceSubmissionWorkspace } from "@/services/evidence-submission-workspace";
import { createOrUpdateLumaEvent } from "@/services/luma-live-pilot";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getSopWorkflowRuntime } from "@/services/sop-workflow-runtime";

const dsAdmin = () => getMockLocalActorContext("ds.admin@mymedlife.test");
const superAdmin = () => getMockLocalActorContext("super.admin@mymedlife.test");
const member = () => getMockLocalActorContext("member.a@mymedlife.test");

const lumaEnabledEnv = {
  LUMA_API_KEY: "secret-example-do-not-return",
  LUMA_CALENDAR_ID: "cal-7WNftYCpBJclZyG",
  MYMEDLIFE_ENABLE_LUMA_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_EVENT_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_RSVP_WRITES: "true",
  MYMEDLIFE_ENABLE_LUMA_ATTENDANCE_IMPORT: "true",
  MYMEDLIFE_LUMA_ENVIRONMENT: "staging",
  VERCEL_ENV: "preview",
};

describe("feature flag services", () => {
  beforeEach(() => {
    resetFeatureFlagStoreForTests();
    resetThemeStoreForTests();
  });

  it("defines every required module and provider flag with supported statuses and environments", () => {
    expect(featureFlagEnvironments).toEqual([
      "local",
      "preview",
      "staging",
      "production",
    ]);
    expect(featureFlagStatuses).toEqual([
      "enabled",
      "disabled",
      "staging_only",
      "mock_only",
      "internal_only",
      "scheduled",
      "emergency_disabled",
    ]);
    expect(getFeatureFlagDefinitions().map((flag) => flag.key)).toEqual([
      "events_luma_points",
      "ugc_feed_proof",
      "task_assignment",
      "sop_workflows_next_action",
      "staff_analytics_reporting",
      "integrations_outbox",
      "mcp_read_only_analytics",
      "ds_admin_controls",
      "theme_design_system",
      "integration_luma",
      "integration_hubspot",
      "integration_shopify",
      "integration_givelively",
      "integration_bigquery",
      "integration_powerbi",
      "integration_n8n",
      "integration_openai",
    ]);
  });

  it("allows only DS Admin and Super Admin to manage flags and audits changes with reasons", () => {
    expect(canManageFeatureFlags(member())).toBe(false);
    expect(canManageFeatureFlags(dsAdmin())).toBe(true);
    expect(canManageFeatureFlags(superAdmin())).toBe(true);

    expect(() =>
      updateFeatureFlagStatus({
        actor: member(),
        environment: "staging",
        key: "integration_luma",
        nextStatus: "disabled",
        reason: "Member should not manage flags.",
      }),
    ).toThrow("Only DS Admin or Super Admin");

    const record = updateFeatureFlagStatus({
      actor: dsAdmin(),
      environment: "staging",
      key: "integration_luma",
      nextStatus: "disabled",
      reason: "Temporarily pause Luma staging calls.",
    });

    expect(record).toMatchObject({
      actorEmail: "ds.admin@mymedlife.test",
      actorRole: "ds_admin",
      environment: "staging",
      key: "integration_luma",
      oldStatus: "staging_only",
      newStatus: "disabled",
      reason: "Temporarily pause Luma staging calls.",
    });
    expect(listFeatureFlagAuditRecords()).toHaveLength(1);
  });

  it("keeps events enabled when SOP, task assignment, and UGC are disabled", () => {
    for (const key of [
      "sop_workflows_next_action",
      "task_assignment",
      "ugc_feed_proof",
    ] as const) {
      updateFeatureFlagStatus({
        actor: dsAdmin(),
        environment: "staging",
        key,
        nextStatus: "disabled",
        reason: `Disable ${key} without blocking events.`,
      });
    }

    expect(isFeatureEnabled("events_luma_points", { environment: "staging" })).toBe(true);
    expect(isFeatureEnabled("staff_analytics_reporting", { environment: "staging" })).toBe(true);
    expect(getFeatureStatus("sop_workflows_next_action", { environment: "staging" })).toBe("disabled");
    expect(() =>
      requireFeature("sop_workflows_next_action", { environment: "staging" }),
    ).toThrow("SOP Workflows and Next Action");
  });

  it("returns server-side graceful fallbacks for disabled SOP, task, and UGC modules", () => {
    for (const key of [
      "sop_workflows_next_action",
      "task_assignment",
      "ugc_feed_proof",
    ] as const) {
      updateFeatureFlagStatus({
        actor: dsAdmin(),
        environment: "local",
        key,
        nextStatus: "disabled",
        reason: `Pause ${key} during module gate review.`,
      });
    }

    const sopAvailability = getModuleFeatureAvailability("sop_workflows_next_action", {
      environment: "local",
    });
    const taskConfig = getAssignmentCreateWriteConfig({
      MYMEDLIFE_FEATURE_ENVIRONMENT: "local",
      MYMEDLIFE_ALLOW_LOCAL_SUPABASE_WRITES: "true",
      MYMEDLIFE_ENABLE_ASSIGNMENT_CREATE_WRITE: "true",
    });
    const proofWorkspace = getEvidenceSubmissionWorkspace(member());

    expect(isFeatureEnabled("events_luma_points", { environment: "local" })).toBe(true);
    expect(sopAvailability.enabled).toBe(false);
    expect(sopAvailability.blockedControls.join(" ")).toContain("campaign routes");
    expect(getSopWorkflowRuntime("rush-month")).toBeNull();
    expect(taskConfig).toMatchObject({
      enabled: false,
      reason:
        "Keep events, points, and role dashboards visible while assignment creation controls are disabled.",
    });
    expect(proofWorkspace).toMatchObject({
      canReadWorkspace: true,
      title: "Proof and UGC review is paused",
      rows: [],
    });
    expect(proofWorkspace.safetyNotes.join(" ")).toContain(
      "Events, RSVP, attendance, points, and leaderboards remain available.",
    );
  });

  it("blocks disabled Luma before any external API call can run", async () => {
    updateFeatureFlagStatus({
      actor: superAdmin(),
      environment: "staging",
      key: "integration_luma",
      nextStatus: "disabled",
      reason: "Emergency pause during staging review.",
    });
    const fetchImpl = vi.fn();

    const result = await createOrUpdateLumaEvent(
      {
        name: "Should not call Luma",
        startAt: "2026-07-20T23:00:00.000Z",
        timezone: "America/Los_Angeles",
      },
      { env: lumaEnabledEnv, fetchImpl },
    );

    expect(result.status).toBe("blocked");
    expect(result.externalWrites).toBe(0);
    expect(result.safeMessage).toContain("manual RSVP posture");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("blocks dependent provider flags when the parent event loop is disabled", async () => {
    updateFeatureFlagStatus({
      actor: dsAdmin(),
      environment: "staging",
      key: "events_luma_points",
      nextStatus: "disabled",
      reason: "Pause the broader event loop during pilot review.",
    });

    const lumaState = getFeatureResolvedState("integration_luma", {
      environment: "staging",
    });
    const fetchImpl = vi.fn();

    const result = await createOrUpdateLumaEvent(
      {
        name: "Should stay blocked by dependency",
        startAt: "2026-07-20T23:00:00.000Z",
        timezone: "America/Los_Angeles",
      },
      { env: lumaEnabledEnv, fetchImpl },
    );

    expect(lumaState.status).toBe("staging_only");
    expect(lumaState.enabled).toBe(false);
    expect(lumaState.reason).toContain("blocked because Events, Luma, and Points");
    expect(isFeatureEnabled("integration_luma", { environment: "staging" })).toBe(
      false,
    );
    expect(result.status).toBe("blocked");
    expect(result.safeMessage).toContain("manual RSVP posture");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("theme admin services", () => {
  beforeEach(() => {
    resetFeatureFlagStoreForTests();
    resetThemeStoreForTests();
  });

  it("allows only DS Admin and Super Admin to manage theme tokens", () => {
    expect(canManageTheme(member())).toBe(false);
    expect(canManageTheme(dsAdmin())).toBe(true);
    expect(canManageTheme(superAdmin())).toBe(true);

    expect(() =>
      saveThemeDraft({
        actor: member(),
        environment: "staging",
        tokenKey: "primaryButton",
        hex: "#004aad",
        pantoneLabel: "MEDLIFE Blue",
        pantoneCode: "PMS 2935 C",
        reason: "Member cannot edit theme.",
      }),
    ).toThrow("Only DS Admin or Super Admin");
  });

  it("saves draft tokens, publishes CSS variables, and audits each action", () => {
    const draft = saveThemeDraft({
      actor: dsAdmin(),
      environment: "staging",
      tokenKey: "primaryButton",
      hex: "#004aad",
      pantoneLabel: "MEDLIFE Blue",
      pantoneCode: "PMS 2935 C",
      reason: "Match the MEDLIFE blue button color.",
    });

    expect(draft.status).toBe("draft");
    expect(draft.tokens.primaryButton).toMatchObject({
      hex: "#004aad",
      pantoneLabel: "MEDLIFE Blue",
      pantoneCode: "PMS 2935 C",
    });

    const published = publishThemeDraft({
      actor: superAdmin(),
      environment: "staging",
      reason: "Publish reviewed MEDLIFE theme.",
    });

    expect(published.status).toBe("published");
    expect(getPublishedThemeCssVariables("staging")).toContain(
      "--mymedlife-primary-button: #004aad;",
    );
    expect(listThemeAuditRecords().map((record) => record.action)).toEqual([
      "theme_published",
      "theme_draft_saved",
    ]);
  });

  it("blocks unreadable contrast unless Super Admin overrides with a reason", () => {
    expect(() =>
      saveThemeDraft({
        actor: dsAdmin(),
        environment: "staging",
        tokenKey: "font",
        hex: "#ffffff",
        reason: "Try unreadable body copy.",
      }),
    ).toThrow("Theme contrast is unreadable");

    const overridden = saveThemeDraft({
      actor: superAdmin(),
      environment: "staging",
      tokenKey: "font",
      hex: "#ffffff",
      reason: "Temporary visual QA override for staging.",
      overrideContrast: true,
    });

    expect(getThemeContrastResults(overridden).some((item) => item.severity === "block")).toBe(true);
    expect(listThemeAuditRecords()[0]).toMatchObject({
      action: "theme_contrast_override",
      actorRole: "super_admin",
      contrastOverride: true,
    });
  });

  it("rolls back and restores the default MEDLIFE theme", () => {
    saveThemeDraft({
      actor: dsAdmin(),
      environment: "staging",
      tokenKey: "primaryButton",
      hex: "#004aad",
      reason: "Prepare first published theme.",
    });
    publishThemeDraft({
      actor: superAdmin(),
      environment: "staging",
      reason: "Publish first theme.",
    });
    saveThemeDraft({
      actor: dsAdmin(),
      environment: "staging",
      tokenKey: "primaryButton",
      hex: "#1d4ed8",
      reason: "Prepare second published theme.",
    });
    publishThemeDraft({
      actor: superAdmin(),
      environment: "staging",
      reason: "Publish second theme.",
    });

    const rolledBack = rollbackTheme({
      actor: superAdmin(),
      environment: "staging",
      reason: "Rollback to previous reviewed theme.",
    });
    expect(rolledBack.status).toBe("rolled_back");
    expect(rolledBack.tokens.primaryButton.hex).toBe("#004aad");

    const restored = restoreDefaultTheme({
      actor: dsAdmin(),
      environment: "staging",
      reason: "Restore default MEDLIFE theme.",
    });
    expect(restored.status).toBe("published");
    expect(getThemeSnapshot("staging", "published").tokens.primaryButton.hex).toBe("#2563eb");
  });

  it("routes common legacy color utility classes through theme CSS variables", () => {
    const css = readFileSync("src/app/globals.css", "utf8");

    expect(css).toContain(".text-slate-950");
    expect(css).toContain("color: var(--foreground);");
    expect(css).toContain(".bg-white");
    expect(css).toContain("background-color: var(--mymedlife-card-block);");
    expect(css).toContain(".border-slate-200");
    expect(css).toContain("border-color: color-mix(in srgb, var(--mymedlife-border)");
    expect(css).toContain(".bg-rose-50");
    expect(css).toContain("var(--danger)");
  });
});
