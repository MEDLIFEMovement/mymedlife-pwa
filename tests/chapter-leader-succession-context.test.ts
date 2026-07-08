import { describe, expect, it } from "vitest";

import { getChapterLeaderCommandCenter } from "@/services/chapter-leader-command-center";
import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

const data = getMockReadOnlyAppData("Testing leader succession continuity.");

describe("leader succession candidate continuity", () => {
  it("preserves member review query context when leaders opens succession candidate review", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "leaders",
      memberId: "member-ivy",
      pipeline: "follow_up",
      search: "Ivy",
    });

    expect(
      commandCenter.successionCandidates.find((candidate) => candidate.displayName === "Ivy Invite")
        ?.href,
    ).toBe("/leader?view=succession&member=member-ivy&pipeline=follow_up&q=Ivy");
    expect(
      commandCenter.successionCandidates.find((candidate) => candidate.displayName === "Zara Events")
        ?.href,
    ).toBe("/leader?view=succession&member=member-zara&pipeline=follow_up&q=Ivy");
  });

  it("keeps feed analytics review context attached when values opens succession candidate review", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "values",
      source: "feed_analytics",
      memberId: "member-maya",
      pipeline: "follow_up",
      search: "Sofia",
      feedPostId: "feed-post-slt-recap",
    });

    expect(
      commandCenter.successionCandidates.find(
        (candidate) => candidate.displayName === "Sofia Alvarez",
      )?.href,
    ).toBe(
      "/leader?view=succession&source=feed_analytics&member=member-maya&pipeline=follow_up&q=Sofia&feedPost=feed-post-slt-recap",
    );
    expect(
      commandCenter.successionCandidates.find((candidate) => candidate.displayName === "Ivy Invite")
        ?.href,
    ).toBe(
      "/leader?view=succession&source=feed_analytics&member=member-ivy&pipeline=follow_up&q=Sofia&feedPost=feed-post-slt-recap",
    );
  });

  it("keeps the plain succession dashboard route clean when no review context is active", () => {
    const actor = getMockLocalActorContext("leader.a@mymedlife.test");
    const commandCenter = getChapterLeaderCommandCenter(actor, data, {
      view: "succession",
    });

    expect(
      commandCenter.successionCandidates.find((candidate) => candidate.displayName === "Ivy Invite")
        ?.href,
    ).toBe("/leader?view=succession&member=member-ivy");
    expect(
      commandCenter.successionCandidates.find((candidate) => candidate.displayName === "Zara Events")
        ?.href,
    ).toBe("/leader?view=succession&member=member-zara");
  });
});
