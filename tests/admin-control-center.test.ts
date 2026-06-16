import { describe, expect, it } from "vitest";
import { campaignShells } from "@/data/mock-campaigns";
import {
  getAdminControlCenterSummary,
  getAudienceLabels,
} from "@/services/admin-control-center";
import { localActorOptions } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("admin control center", () => {
  it("covers the required admin MVP surfaces without enabling writes", () => {
    const summary = getAdminControlCenterSummary(
      getMockReadOnlyAppData("Testing admin control center."),
    );

    expect(summary.canWriteAdminChanges).toBe(false);
    expect(summary.productionAuthEnabled).toBe(false);
    expect(summary.externalWritesEnabled).toBe(false);
    expect(summary.areas.map((area) => area.key)).toEqual([
      "users",
      "roles",
      "chapters",
      "campaign_templates",
      "integration_outbox",
      "audit_logs",
      "system_health",
    ]);
  });

  it("summarizes fake users, role audiences, campaign shells, and disabled outbox rows", () => {
    const data = getMockReadOnlyAppData("Testing admin metrics.");
    const summary = getAdminControlCenterSummary(data);

    expect(summary.userCount).toBe(localActorOptions.length);
    expect(summary.roleAudienceCount).toBe(6);
    expect(summary.campaignTemplateCount).toBe(campaignShells.length);
    expect(summary.disabledOutboxCount).toBe(
      data.outboxItems.filter((item) => item.status === "disabled").length,
    );
  });

  it("marks admin mutation areas as mock-only or blocked when production systems are not active", () => {
    const summary = getAdminControlCenterSummary(
      getMockReadOnlyAppData("Testing admin statuses."),
    );

    expect(summary.areas.find((area) => area.key === "users")).toEqual(
      expect.objectContaining({
        status: "mock_only",
        nextAction: expect.stringContaining("Supabase Auth"),
      }),
    );
    expect(summary.areas.find((area) => area.key === "audit_logs")).toEqual(
      expect.objectContaining({
        status: "mock_only",
        nextAction: expect.stringContaining("persisted audit rows"),
      }),
    );
    expect(summary.healthItems.find((item) => item.key === "external_writes")).toEqual(
      expect.objectContaining({
        status: "blocked",
      }),
    );
    expect(
      summary.healthItems.find((item) => item.key === "admin_write_controls"),
    ).toEqual(
      expect.objectContaining({
        status: "blocked",
      }),
    );
  });

  it("exposes all local actor audiences for admin review", () => {
    expect(getAudienceLabels()).toEqual([
      "chapter_member",
      "chapter_leader",
      "coach",
      "admin",
      "ds_admin",
      "super_admin",
    ]);
  });
});
