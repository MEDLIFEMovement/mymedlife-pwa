import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getPhase2CloseoutReview } from "@/services/phase-2-closeout-review";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("phase 2 closeout review", () => {
  it("gives admin one review-first route for the remaining Phase 2 packet decisions", () => {
    const review = getPhase2CloseoutReview(
      getMockLocalActorContext("admin@mymedlife.test"),
      getMockReadOnlyAppData("Testing Phase 2 closeout review."),
    );

    expect(review.canReadReview).toBe(true);
    expect(review.title).toBe("Admin Phase 2 closeout review");
    expect(review.packetPath).toBe(
      "docs/review/2026-06-24-phase-2-live-mvp-pilot-closeout-packet.md",
    );
    expect(review.counts.lanes).toBe(7);
    expect(review.counts.reviewNow).toBeGreaterThan(0);
    expect(review.counts.awaitingHumanConfirmation).toBeGreaterThan(0);
    expect(review.counts.blockedBeforePilot).toBeGreaterThan(0);
    expect(review.counts.browserWritesExpected).toBe(0);
    expect(review.counts.externalWritesExpected).toBe(0);
    expect(review.approvalReplyHint).toContain("Human approval is still required");

    const laneHrefs = review.lanes.map((lane) => lane.href);
    expect(laneHrefs).toEqual(
      expect.arrayContaining([
        "/admin/release-readiness",
        "/admin/staff-dry-run",
        "/admin/design-qa",
        "/onboarding",
        "/admin/pilot-scope",
        "/admin/first-write",
        "/admin",
      ]),
    );

    expect(
      review.lanes.find((lane) => lane.key === "pilot_scope")?.evidence.join(" "),
    ).toContain("UCLA MEDLIFE");
    expect(
      review.lanes.find((lane) => lane.key === "pilot_scope")?.evidence.join(" "),
    ).toContain("owner slots");
    expect(
      review.lanes.find((lane) => lane.key === "first_hosted_write")?.summary,
    ).toContain("action_started");
    expect(review.reviewerAction).toContain("approved as written");
  });

  it("keeps member actors out of the Phase 2 closeout packet", () => {
    const review = getPhase2CloseoutReview(
      getMockLocalActorContext("member.a@mymedlife.test"),
      getMockReadOnlyAppData("Testing hidden Phase 2 closeout review."),
    );

    expect(review.canReadReview).toBe(false);
    expect(review.lanes).toEqual([]);
  });
});
