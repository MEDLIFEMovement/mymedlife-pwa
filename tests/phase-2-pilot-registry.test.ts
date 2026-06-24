import { describe, expect, it } from "vitest";
import { getPhase2PilotRegistry } from "@/services/phase-2-pilot-registry";

describe("phase 2 pilot registry", () => {
  it("starts with recommended defaults and pending owner slots", () => {
    const registry = getPhase2PilotRegistry({});

    expect(registry.counts.defaultsRecorded).toBe(0);
    expect(registry.counts.defaultsPending).toBe(7);
    expect(registry.counts.ownersRecorded).toBe(0);
    expect(registry.counts.ownersPending).toBe(6);
    expect(
      registry.defaults.find((item) => item.key === "pilot_chapter")?.value,
    ).toBe("UCLA MEDLIFE");
    expect(
      registry.owners.find((item) => item.key === "rollback_owner")?.value,
    ).toBe("pending Kiomi");
    expect(registry.approvalReplyBlock[0]).toBe("approved as written");
  });

  it("records final answers when explicit pilot values are supplied", () => {
    const registry = getPhase2PilotRegistry({
      MYMEDLIFE_PILOT_CHAPTER: "Boston College MEDLIFE",
      MYMEDLIFE_PILOT_FIRST_HOSTED_WRITE: "`action_started`",
      MYMEDLIFE_PILOT_COACH_OWNER: "Priya Coach",
      MYMEDLIFE_PILOT_SUPPORT_PAUSE_CHANNEL: "#mymedlife-pilot-watch",
    });

    expect(registry.counts.defaultsRecorded).toBe(2);
    expect(registry.counts.ownersRecorded).toBe(2);
    expect(
      registry.defaults.find((item) => item.key === "pilot_chapter")?.status,
    ).toBe("recorded_final");
    expect(
      registry.defaults.find((item) => item.key === "pilot_chapter")?.value,
    ).toBe("Boston College MEDLIFE");
    expect(
      registry.owners.find((item) => item.key === "coach_owner")?.status,
    ).toBe("recorded_owner");
    expect(
      registry.owners.find((item) => item.key === "support_pause_channel")?.value,
    ).toBe("#mymedlife-pilot-watch");
    expect(registry.approvalReplyBlock.join("\n")).toContain(
      "Coach owner: Priya Coach",
    );
  });
});
