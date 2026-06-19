import { describe, expect, it } from "vitest";
import {
  getStaticRouteMetadata,
  getStaticRouteMetadataEntries,
} from "@/services/static-route-metadata";

describe("static route metadata", () => {
  it("defines plain-English titles and descriptions for every core route", () => {
    const entries = getStaticRouteMetadataEntries();

    expect(entries).toHaveLength(55);
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
    expect(getStaticRouteMetadata("adminIntegrationOutbox")).toMatchObject({
      title: "Admin Integration Outbox",
    });
    expect(getStaticRouteMetadata("adminMasterData")).toMatchObject({
      title: "Admin Master Data",
    });
    expect(getStaticRouteMetadata("adminDatabaseSecurity")).toMatchObject({
      title: "Admin Database Security",
    });
    expect(getStaticRouteMetadata("adminSystemHealth")).toMatchObject({
      title: "Admin System Health",
    });
    expect(getStaticRouteMetadata("adminPhase2Review")).toMatchObject({
      title: "Admin Phase 2 Review",
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
      title: "HQ Proof Decision Packet",
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
      title: "Coach Dashboard",
    });
    expect(getStaticRouteMetadata("staff")).toMatchObject({
      title: "Staff Command Center",
    });
  });
});
