import { describe, expect, it } from "vitest";
import {
  getStaticRouteMetadata,
  getStaticRouteMetadataEntries,
} from "@/services/static-route-metadata";

describe("static route metadata", () => {
  it("defines plain-English titles and descriptions for every core route", () => {
    const entries = getStaticRouteMetadataEntries();

    expect(entries).toHaveLength(19);
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
