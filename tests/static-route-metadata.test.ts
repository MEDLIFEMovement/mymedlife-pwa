import { describe, expect, it } from "vitest";
import {
  getStaticRouteMetadata,
  getStaticRouteMetadataEntries,
} from "@/services/static-route-metadata";

describe("static route metadata", () => {
  it("defines plain-English titles and descriptions for every core route", () => {
    const entries = getStaticRouteMetadataEntries();

    expect(entries).toHaveLength(27);
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
    expect(getStaticRouteMetadata("login")).toMatchObject({
      title: "Local Sign In",
    });
    expect(getStaticRouteMetadata("rushMonthReview")).toMatchObject({
      title: "HQ Proof Review",
    });
    expect(getStaticRouteMetadata("coach")).toMatchObject({
      title: "Coach Dashboard",
    });
  });
});
