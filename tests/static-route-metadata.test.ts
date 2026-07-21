import { describe, expect, it } from "vitest";
import {
  getStaticRouteMetadata,
  getStaticRouteMetadataEntries,
} from "@/services/static-route-metadata";

describe("static route metadata", () => {
  it("defines plain-English titles and descriptions for every core route", () => {
    const entries = getStaticRouteMetadataEntries();

    expect(entries).toHaveLength(76);
    expect(entries.every((entry) => typeof entry.metadata.title === "string")).toBe(
      true,
    );
    expect(
      entries.every((entry) => typeof entry.metadata.description === "string"),
    ).toBe(true);
  });

  it("keeps safety-sensitive reviewer routes named clearly", () => {
    expect(getStaticRouteMetadata("admin")).toMatchObject({
      title: "Admin",
    });
    expect(getStaticRouteMetadata("adminPhase2")).toMatchObject({
      title: "Admin Phase 2",
    });
    expect(getStaticRouteMetadata("adminReviewPath")).toMatchObject({
      title: "Admin Review Path",
    });
    expect(getStaticRouteMetadata("adminNickReview")).toMatchObject({
      title: "Nick Final Review",
    });
    expect(getStaticRouteMetadata("adminReleaseReadiness")).toMatchObject({
      title: "Admin Release Readiness",
    });
    expect(getStaticRouteMetadata("adminLaunchGate")).toMatchObject({
      title: "Admin Launch Gate",
    });
    expect(getStaticRouteMetadata("adminAuditLog")).toMatchObject({
      title: "Admin Audit Log",
    });
    expect(getStaticRouteMetadata("adminIntegrations")).toMatchObject({
      title: "Admin Integrations",
    });
    expect(getStaticRouteMetadata("adminFeatureFlags")).toMatchObject({
      title: "Admin Feature Flags",
      description: expect.stringContaining("Supabase-backed rollout controls"),
    });
    expect(getStaticRouteMetadata("adminTheme")).toMatchObject({
      title: "Admin Theme Settings",
      description: expect.stringContaining("white-blue app shell"),
    });
    expect(getStaticRouteMetadata("adminLumaLivePilot")).toMatchObject({
      title: "Admin Luma Live Pilot",
      description: expect.stringContaining("Staging-only Luma event"),
    });
    expect(getStaticRouteMetadata("adminIntegrationOutbox")).toMatchObject({
      title: "Admin Integration Outbox",
    });
    expect(getStaticRouteMetadata("adminMasterData")).toMatchObject({
      title: "Admin Master Data",
    });
    expect(getStaticRouteMetadata("adminPermissions")).toMatchObject({
      title: "Admin Permissions",
    });
    expect(getStaticRouteMetadata("adminCommittees")).toMatchObject({
      title: "Admin Committees",
    });
    expect(getStaticRouteMetadata("adminWorkflows")).toMatchObject({
      title: "Admin Workflows",
    });
    expect(getStaticRouteMetadata("adminSopLibrary")).toMatchObject({
      title: "Admin SOP Library",
    });
    expect(getStaticRouteMetadata("adminSopBuilder")).toMatchObject({
      title: "Admin SOP Builder",
    });
    expect(getStaticRouteMetadata("adminDatabaseSecurity")).toMatchObject({
      title: "Admin Database Security",
    });
    expect(getStaticRouteMetadata("adminSystemHealth")).toMatchObject({
      title: "Admin System Health",
    });
    expect(getStaticRouteMetadata("adminDesignQa")).toMatchObject({
      title: "Admin Design QA",
    });
    expect(getStaticRouteMetadata("adminOperations")).toMatchObject({
      title: "Admin Operations",
    });
    expect(getStaticRouteMetadata("adminFirstWrite")).toMatchObject({
      title: "First Write Drill",
    });
    expect(getStaticRouteMetadata("adminWriteSequence")).toMatchObject({
      title: "Write Sequence",
    });
    expect(getStaticRouteMetadata("adminProofWrite")).toMatchObject({
      title: "Proof Metadata Packet",
    });
    expect(getStaticRouteMetadata("adminHqProofWrite")).toMatchObject({
      title: "HQ Story Review",
    });
    expect(getStaticRouteMetadata("adminAssignmentWrite")).toMatchObject({
      title: "Leader Assignment Packet",
    });
    expect(getStaticRouteMetadata("adminCoachWrite")).toMatchObject({
      title: "Coach Decision Packet",
    });
    expect(getStaticRouteMetadata("adminStaffDryRun")).toMatchObject({
      title: "Staff Dry Run",
    });
    expect(getStaticRouteMetadata("adminPilotScope")).toMatchObject({
      title: "Pilot Scope",
    });
    expect(getStaticRouteMetadata("profile")).toMatchObject({
      title: "Profile",
    });
    expect(getStaticRouteMetadata("app")).toMatchObject({
      title: "Member App",
    });
    expect(getStaticRouteMetadata("appStories")).toMatchObject({
      title: "MEDLIFE Stories",
      description: expect.stringContaining("Read-only member stories feed"),
    });
    expect(getStaticRouteMetadata("leader")).toMatchObject({
      title: "Leader Command Center",
    });
    expect(getStaticRouteMetadata("onboarding")).toMatchObject({
      title: "Onboarding",
    });
    expect(getStaticRouteMetadata("login")).toMatchObject({
      title: "Local Sign In",
    });
    expect(getStaticRouteMetadata("rushMonthReview")).toMatchObject({
      title: "HQ Proof Review",
    });
    expect(getStaticRouteMetadata("sltPrep")).toMatchObject({
      title: "SLT Trip Prep",
    });
    expect(getStaticRouteMetadata("sltPrepChecklist")).toMatchObject({
      title: "SLT Checklist",
    });
    expect(getStaticRouteMetadata("sltPrepFlights")).toMatchObject({
      title: "SLT Flights",
    });
    expect(getStaticRouteMetadata("sltPrepProfile")).toMatchObject({
      title: "SLT Profile",
      description: expect.stringContaining("alerts"),
    });
    expect(getStaticRouteMetadata("sltPrepStaff")).toMatchObject({
      title: "SLT Staff Dashboard",
    });
    expect(getStaticRouteMetadata("rushMonthLeaderboard")).toMatchObject({
      title: "Rush Month Leaderboard",
    });
    expect(getStaticRouteMetadata("rushMonthEventDetail")).toMatchObject({
      title: "Rush Month Event Detail",
    });
    expect(getStaticRouteMetadata("rushMonthEvidence")).toMatchObject({
      title: "Proof And Evidence",
      description: expect.stringContaining("proof prep checklist"),
    });
    expect(getStaticRouteMetadata("coach")).toMatchObject({
      title: "Staff Command Center",
    });
    expect(getStaticRouteMetadata("chapter")).toMatchObject({
      title: "Student Leadership Command Center",
      description: expect.stringContaining("member pipeline"),
    });
    expect(getStaticRouteMetadata("staff")).toMatchObject({
      title: "Staff Command Center",
    });
  });
});
