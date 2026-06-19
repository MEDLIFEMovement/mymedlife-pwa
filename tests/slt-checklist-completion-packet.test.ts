import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getSltChecklistCompletionPacket } from "@/services/slt-checklist-completion-packet";

describe("slt checklist completion packet", () => {
  it("hides the packet from operating roles", () => {
    const actor = getMockLocalActorContext("member.a@mymedlife.test");
    const packet = getSltChecklistCompletionPacket(actor);

    expect(packet.canReadPacket).toBe(false);
    expect(packet.status).toBe("hidden");
  });

  it("gives admin a preview-safe traveler completion packet", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getSltChecklistCompletionPacket(actor);

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Admin SLT checklist packet");
    expect(packet.status).toBe("evidence_observed");
    expect(packet.candidate).toMatchObject({
      travelerId: "sofia-alvarez",
      itemId: "flight-itinerary",
      mockSource: "myMEDLIFE mock",
      beforeReadinessScore: 68,
      afterReadinessScore: 77,
      readinessDelta: 9,
    });
    expect(packet.counts.browserWritesExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
    expect(packet.verificationPacket.canPromoteToStagingReview).toBe(true);
  });

  it("blocks an external-source checklist item from becoming the preferred preview candidate", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getSltChecklistCompletionPacket(actor, {
      travelerId: "sofia-alvarez",
      itemId: "second-installment",
    });

    expect(packet.status).toBe("blocked_until_preview_safe_item");
    expect(packet.candidate).toMatchObject({
      itemId: "second-installment",
      mockSource: "Shopify mock",
    });
    expect(packet.checks.find((check) => check.key === "preview_safe_source")?.passed).toBe(
      false,
    );
  });
});
