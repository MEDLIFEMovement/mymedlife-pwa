import { describe, expect, it } from "vitest";

import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing selected-member continuity across leader routes.");

describe("leader selected-member nav continuity", () => {
  it.each(["member_profile", "leaders", "values", "training"] as const)(
    "keeps the selected member attached to leader nav links for %s",
    (view) => {
      const actor = getMockLocalActorContext("leader.a@mymedlife.test");
      const commandCenter = getChapterLeaderCommandCenter(actor, data, { view });
      const selectedMemberId = commandCenter.selectedMember?.id;

      expect(selectedMemberId).toBeTruthy();
      expect(commandCenter.navigationMemberId).toBe(selectedMemberId);
      expect(commandCenter.viewOptions.find((item) => item.key === "member_profile")?.href).toBe(
        `/leader?view=member_profile&member=${selectedMemberId}`,
      );
      expect(commandCenter.viewOptions.find((item) => item.key === "leaders")?.href).toBe(
        `/leader?view=leaders&member=${selectedMemberId}`,
      );
      expect(commandCenter.viewOptions.find((item) => item.key === "values")?.href).toBe(
        `/leader?view=values&member=${selectedMemberId}`,
      );
      expect(commandCenter.viewOptions.find((item) => item.key === "training")?.href).toBe(
        `/leader?view=training&member=${selectedMemberId}`,
      );
    },
  );

  it("keeps the plain succession route in dashboard mode until a candidate is explicitly selected", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "succession",
    });

    expect(commandCenter.hasExplicitMemberSelection).toBe(false);
    expect(commandCenter.navigationMemberId).toBeNull();
    expect(commandCenter.viewOptions.find((item) => item.key === "succession")?.href).toBe(
      "/leader?view=succession",
    );
  });
});
