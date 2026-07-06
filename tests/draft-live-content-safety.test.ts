import { describe, expect, it } from "vitest";

import {
  getDraftLiveContentFieldEvidenceReason,
  getDraftLiveContentObjectEvidenceReason,
  getDraftLiveContentStringEvidenceReason,
  isLiveDraftContentStatus,
  normalizeDraftLiveContentStatus,
} from "@/services/draft-live-content-safety";

describe("draft live content safety", () => {
  it("defines the local draft/live status vocabulary", () => {
    expect(normalizeDraftLiveContentStatus("draft")).toBe("draft");
    expect(normalizeDraftLiveContentStatus("reviewed")).toBe("reviewed");
    expect(normalizeDraftLiveContentStatus("scheduled")).toBe("scheduled");
    expect(normalizeDraftLiveContentStatus("live")).toBe("live");
    expect(normalizeDraftLiveContentStatus("archived")).toBe("archived");
    expect(normalizeDraftLiveContentStatus("template")).toBeNull();
  });

  it("treats only live content as live-launch eligible", () => {
    expect(isLiveDraftContentStatus("live")).toBe(true);
    expect(isLiveDraftContentStatus("draft")).toBe(false);
    expect(isLiveDraftContentStatus("reviewed")).toBe(false);
    expect(isLiveDraftContentStatus("scheduled")).toBe(false);
    expect(isLiveDraftContentStatus("archived")).toBe(false);
  });

  it("flags draft/template/sample evidence in packet-like fields", () => {
    expect(
      getDraftLiveContentFieldEvidenceReason({
        tableName: "campaigns",
        header: "status",
        value: "draft",
      }),
    ).toBe("campaigns.status is marked draft");

    expect(
      getDraftLiveContentFieldEvidenceReason({
        tableName: "pilotEventProof",
        header: "notes",
        value: "SOP sample content only",
      }),
    ).toBe("pilotEventProof.notes contains sop sample");
  });

  it("reuses the string-level sample marker guard for manifest-style checks", () => {
    expect(
      getDraftLiveContentStringEvidenceReason(
        "SOP sample content only",
        "manifest.name",
      ),
    ).toBe("manifest.name contains sop sample");
  });

  it("flags draft/template/sample evidence in packet-like objects", () => {
    expect(
      getDraftLiveContentObjectEvidenceReason({
        campaigns: [{ status: "draft" }],
      }),
    ).toBe("packet.campaigns[0].status is marked draft");

    expect(
      getDraftLiveContentObjectEvidenceReason({
        workflowSnapshot: { sourceKind: "template_version" },
      }),
    ).toBe("packet.workflowSnapshot.sourceKind is marked template_version");

    expect(
      getDraftLiveContentObjectEvidenceReason({
        notes: "Review only SOP sample",
      }),
    ).toBe("packet.notes contains sop sample");
  });
});
