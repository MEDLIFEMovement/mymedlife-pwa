import { describe, expect, it } from "vitest";

import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing leader member-home return-path continuity.");

describe("leader member-home return-path continuity", () => {
  it("keeps a chapter-home return action visible after the member-home handoff opens events", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "events",
      source: "member_home",
      quickAction: "assign_action",
    });

    expect(commandCenter.sourceContext?.actions?.[0]).toMatchObject({
      label: "Back to chapter home",
      href: "/leader?view=overview&source=member_home",
    });
    expect(commandCenter.sourceContext?.actions?.[1]).toMatchObject({
      label: "Review members",
      href: "/leader?view=members&source=member_home&quickAction=review_members",
    });
  });

  it("keeps a chapter-home return action visible after the member-home handoff opens member review", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "members",
      source: "member_home",
      quickAction: "review_members",
    });

    expect(commandCenter.sourceContext?.actions?.[0]).toMatchObject({
      label: "Back to chapter home",
      href: "/leader?view=overview&source=member_home",
    });
    expect(commandCenter.sourceContext?.actions?.some((action) => action.label === "Student view")).toBe(
      true,
    );
  });
});
