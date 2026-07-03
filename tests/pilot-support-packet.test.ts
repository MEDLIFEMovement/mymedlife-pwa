import { describe, expect, it } from "vitest";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getPilotSupportPacket } from "@/services/pilot-support-packet";

describe("pilot support packet", () => {
  it("gives admins a review-safe pilot support packet", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getPilotSupportPacket(actor);

    expect(packet.canReadPacket).toBe(true);
    expect(packet.title).toBe("Admin pilot support and stop-rules packet");
    expect(packet.pilotConstraints).toContain("One chapter only.");
    expect(packet.pilotConstraints).toContain("Five to fifteen students.");
    expect(packet.counts.browserWritesExpected).toBe(0);
    expect(packet.counts.externalWritesExpected).toBe(0);
  });

  it("names owner lanes and keeps only DS ownership review-ready", () => {
    const actor = getMockLocalActorContext("super.admin@mymedlife.test");
    const packet = getPilotSupportPacket(actor);

    expect(packet.ownerChecklist.map((item) => item.key)).toEqual([
      "pilot_group",
      "coach_owner",
      "hq_owner",
      "ds_owner",
    ]);
    expect(
      packet.ownerChecklist.find((item) => item.key === "ds_owner")?.status,
    ).toBe("review_ready");
    expect(
      packet.ownerChecklist.filter((item) => item.status === "needs_decision")
        .length,
    ).toBe(3);
  });

  it("shows review-ready drills, hosted staging proof, and keeps device smoke blocked before live", () => {
    const actor = getMockLocalActorContext("ds.admin@mymedlife.test");
    const packet = getPilotSupportPacket(actor);

    expect(packet.title).toBe("DS Admin pilot support and recovery packet");
    expect(
      packet.readinessChecks.find((item) => item.key === "staff_dry_run")?.status,
    ).toBe("review_ready");
    expect(
      packet.readinessChecks.find((item) => item.key === "hosted_staging_review")
        ?.status,
    ).toBe("review_ready");
    expect(
      packet.readinessChecks.find((item) => item.key === "rollback_drill")?.status,
    ).toBe("review_ready");
    expect(
      packet.readinessChecks.find((item) => item.key === "device_accessibility")
        ?.status,
    ).toBe("blocked_before_live");
  });

  it("defines stop rules for role drift, uploads, writes, and support overload", () => {
    const actor = getMockLocalActorContext("admin@mymedlife.test");
    const packet = getPilotSupportPacket(actor);

    expect(packet.stopRules.map((rule) => rule.key)).toEqual([
      "wrong_role_or_chapter",
      "unexpected_upload_or_send",
      "write_readback_mismatch",
      "support_load_exceeds_capacity",
    ]);
    expect(packet.studentCommsPolicy.join(" ")).toContain("approved MEDLIFE channels");
    expect(packet.summary).toContain("production schema can stay deferred");
  });

  it("hides the pilot support packet from student, leader, and coach roles", () => {
    const member = getMockLocalActorContext("member.a@mymedlife.test");
    const leader = getMockLocalActorContext("leader.a@mymedlife.test");
    const coach = getMockLocalActorContext("coach@mymedlife.test");

    expect(getPilotSupportPacket(member).canReadPacket).toBe(false);
    expect(getPilotSupportPacket(leader).canReadPacket).toBe(false);
    expect(getPilotSupportPacket(coach).canReadPacket).toBe(false);
  });
});
