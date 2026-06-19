import { describe, expect, it } from "vitest";
import { campaignShells } from "@/data/mock-campaigns";
import {
  getAdminControlCenterSummary,
  getAudienceLabels,
} from "@/services/admin-control-center";
import { localActorOptions } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";
import type { AuditLogRow } from "@/shared/types/persistence";

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
    expect(summary.namedRoleCount).toBe(9);
    expect(summary.campaignTemplateCount).toBe(campaignShells.length);
    expect(summary.disabledOutboxCount).toBe(
      data.outboxItems.filter((item) => item.status === "disabled").length,
    );
    expect(summary.auditLogCount).toBe(0);
  });

  it("exposes read-only master data inventory for admin review", () => {
    const data = getMockReadOnlyAppData("Testing admin master data inventory.");
    const summary = getAdminControlCenterSummary(data);

    expect(summary.masterDataInventory.mutationControlsEnabled).toBe(0);
    expect(summary.masterDataInventory.externalWritesExpected).toBe(0);
    expect(summary.masterDataInventory.users).toHaveLength(localActorOptions.length);
    expect(summary.masterDataInventory.roles).toEqual(summary.roleCoverage);
    expect(summary.masterDataInventory.chapters).toEqual([
      expect.objectContaining({
        id: data.chapter.id,
        name: data.chapter.name,
        campus: data.chapter.campus,
        status: "mock_only",
      }),
    ]);
    expect(summary.masterDataInventory.campaignTemplates).toHaveLength(
      campaignShells.length,
    );
    expect(summary.masterDataInventory.campaignTemplates[0]).toEqual(
      expect.objectContaining({
        slug: "rush-month",
        name: "Rush Month",
        status: "active",
        adminStatus: "ready_readonly",
        integrationPosture: expect.stringContaining("No live external send"),
      }),
    );
    expect(summary.masterDataInventory.users.find((user) => user.email === "leader.a@mymedlife.test")).toEqual(
      expect.objectContaining({
        displayName: "Priya President",
        audience: "chapter_leader",
        chapterRoles: ["President / VP"],
        status: "mock_only",
      }),
    );
  });

  it("proves each named MVP role has a local review persona", () => {
    const summary = getAdminControlCenterSummary(
      getMockReadOnlyAppData("Testing role coverage."),
    );

    expect(summary.roleCoverage.map((item) => item.role)).toEqual([
      "General Member",
      "Action Committee Member",
      "Action Committee Chair",
      "E-Board Member",
      "President / VP",
      "Coach",
      "Admin",
      "DS Admin",
      "Super Admin",
    ]);
    expect(summary.roleCoverage.every((item) => item.status === "ready_readonly")).toBe(
      true,
    );
    expect(
      summary.roleCoverage.find((item) => item.role === "Action Committee Member"),
    ).toEqual(
      expect.objectContaining({
        audience: "chapter_member",
        localActorEmail: "committee.member@mymedlife.test",
      }),
    );
    expect(
      summary.roleCoverage.find((item) => item.role === "Action Committee Chair"),
    ).toEqual(
      expect.objectContaining({
        audience: "chapter_leader",
        localActorEmail: "committee.chair@mymedlife.test",
      }),
    );
    expect(summary.roleCoverage.find((item) => item.role === "E-Board Member")).toEqual(
      expect.objectContaining({
        audience: "chapter_leader",
        localActorEmail: "eboard.a@mymedlife.test",
      }),
    );
    expect(summary.roleCoverage.find((item) => item.role === "President / VP")).toEqual(
      expect.objectContaining({
        audience: "chapter_leader",
        localActorEmail: "leader.a@mymedlife.test",
      }),
    );
  });

  it("summarizes write-sequence role responsibility on the admin overview", () => {
    const summary = getAdminControlCenterSummary(
      getMockReadOnlyAppData("Testing admin responsibility summary."),
    );
    const assignment = summary.operatingResponsibilities.find(
      (item) => item.operationKey === "action_assigned",
    );

    expect(summary.operatingResponsibilities).toHaveLength(9);
    expect(summary.operatingResponsibilities.map((item) => item.operationKey)).toEqual(
      expect.arrayContaining([
        "action_started",
        "evidence_submitted",
        "hq_sharing_decision_logged",
        "points_kpi_materialized",
        "slt_checklist_completed",
        "leader_proof_decision_logged",
        "action_assigned",
        "coach_decision_logged",
        "membership_approved",
      ]),
    );
    expect(
      summary.operatingResponsibilities.every(
        (item) =>
          item.responsibleRole.length > 0 &&
          item.reviewPrompt.length > 20 &&
          item.safetyBoundary.length > 20,
      ),
    ).toBe(true);
    expect(assignment).toEqual(
      expect.objectContaining({
        responsibleRole: "President / VP + E-Board + Action Committee Chair",
        responsibility: "Approve, hand off, and coordinate assignment work",
        route: "/admin/assignment-write",
      }),
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
        primaryMetric: "0 visible rows",
        nextAction: expect.stringContaining("write/readback drills"),
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

  it("marks audit logs read-only ready when persisted rows are visible", () => {
    const summary = getAdminControlCenterSummary({
      ...getMockReadOnlyAppData("Testing admin audit rows."),
      auditLogs: [auditLog()],
    });

    expect(summary.auditLogCount).toBe(1);
    expect(summary.areas.find((area) => area.key === "audit_logs")).toEqual(
      expect.objectContaining({
        status: "ready_readonly",
        primaryMetric: "1 visible rows",
        detail: expect.stringContaining("persisted local audit rows"),
      }),
    );
  });
});

function auditLog(): AuditLogRow {
  return {
    id: "audit-1",
    actor_user_id: "member-1",
    chapter_id: "chapter-1",
    action: "action_started",
    target_table: "assignments",
    target_id: "assignment-1",
    before_value: {
      status: "not_started",
    },
    after_value: {
      status: "in_progress",
    },
    reason: "Local action start test.",
    created_at: "2026-06-15T00:00:00Z",
  };
}
