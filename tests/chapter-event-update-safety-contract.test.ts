import { describe, expect, it } from "vitest";
import {
  formatChapterEventUpdateSafetyContract,
  getChapterEventUpdateSafetyContract,
} from "@/services/chapter-event-update-safety-contract";

describe("chapter-event update safety contract", () => {
  it("defines future audited paths without enabling browser or provider writes", () => {
    const contract = getChapterEventUpdateSafetyContract();

    expect(contract.paths.map((path) => path.key)).toEqual([
      "authoritative_fields",
      "narrative_fields",
    ]);
    expect(contract.paths.every((path) => path.browserControlEnabled === false)).toBe(true);
    expect(contract.paths.every((path) => path.externalWritesEnabled === false)).toBe(true);
  });

  it("keeps authoritative and narrative fields separated", () => {
    const contract = getChapterEventUpdateSafetyContract();
    const authoritativePath = contract.paths.find(
      (path) => path.key === "authoritative_fields",
    );
    const narrativePath = contract.paths.find(
      (path) => path.key === "narrative_fields",
    );

    expect(contract.authoritativeFields).toEqual(
      expect.arrayContaining([
        "status",
        "starts_at",
        "ends_at",
        "attendance_count",
        "attendance_rate",
        "nps_score",
        "warehouse_status",
        "luma_event_link_id",
      ]),
    );
    expect(contract.narrativeCandidateFields).toEqual([
      "promotion_summary",
      "feedback_summary",
    ]);
    expect(authoritativePath?.blockedActors).toEqual(
      expect.arrayContaining(["chapter_event_owner_or_planner", "general_member"]),
    );
    expect(narrativePath?.allowedFields).toEqual([
      "promotion_summary",
      "feedback_summary",
    ]);
  });

  it("keeps side effects limited to internal events plus audit rows", () => {
    const contract = getChapterEventUpdateSafetyContract();

    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    for (const path of contract.paths) {
      expect(path.forbiddenSideEffects).toEqual(
        expect.arrayContaining([
          "No points_events write.",
          "No automation_outbox write.",
          "No provider call or Luma mutation.",
        ]),
      );
    }
  });

  it("formats a concise read-only implementation spec", () => {
    const formatted = formatChapterEventUpdateSafetyContract();

    expect(formatted).toContain(
      "Chapter-event update safety contract: READ-ONLY implementation spec",
    );
    expect(formatted).toContain("Current direct owner/planner table updates");
    expect(formatted).toContain("Authoritative chapter-event update path");
    expect(formatted).toContain("Narrative chapter-event owner/planner helper");
    expect(formatted).toContain("app.update_chapter_event_authoritative_fields");
    expect(formatted).toContain("app.update_chapter_event_narrative_fields");
    expect(formatted).toContain("No points_events write.");
    expect(formatted).toContain("No automation_outbox write.");
  });
});
