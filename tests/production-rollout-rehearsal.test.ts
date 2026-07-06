import { describe, expect, it } from "vitest";
import {
  formatProductionRolloutRehearsal,
  getProductionRolloutRehearsal,
} from "@/services/production-rollout-rehearsal";

describe("production rollout rehearsal", () => {
  it("proves the 30-chapter and 500-student shape with generated Test data only", () => {
    const rehearsal = getProductionRolloutRehearsal();
    const report = formatProductionRolloutRehearsal(rehearsal);

    expect(rehearsal.ready).toBe(true);
    expect(rehearsal.counts).toEqual({
      chapters: 30,
      studentLeaderInvitees: 500,
      pilotReadyChapters: 5,
      plannedBatches: 8,
    });
    expect(rehearsal.preflight.stages.every((stage) => stage.ready)).toBe(true);
    expect(report).toContain("30-chapter rollout rehearsal: READY");
    expect(report).toContain("Uses generated Test data only");
    expect(report).toContain("Does not write or approve `production-rollout-packet.json`");
    expect(report).toContain("Batch 1 pilot: 5 chapter(s), 55 recipient(s)");
    expect(report).toContain("Real rollout remains blocked");
    expect(report).not.toContain("test.member.001@medlifemovement.org");
    expect(report).not.toContain("test.leader.01@medlifemovement.org");
    expect(report).not.toContain("test.coach@medlifemovement.org");
    expect(report).not.toContain("test.ds@medlifemovement.org");
  });

  it("fails the rehearsal when the reviewed batch cap is too low for batch 1", () => {
    const rehearsal = getProductionRolloutRehearsal({
      maxRecipientsPerBatch: 50,
    });
    const report = formatProductionRolloutRehearsal(rehearsal);

    expect(rehearsal.ready).toBe(false);
    expect(report).toContain("30-chapter rollout rehearsal: NOT READY");
    expect(report).toContain("Batch 1 has 55 invitees, which exceeds the cap of 50.");
  });
});
