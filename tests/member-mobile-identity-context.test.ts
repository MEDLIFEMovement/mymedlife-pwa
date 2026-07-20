import { describe, expect, it } from "vitest";

import { getMockLocalActorContext } from "@/services/local-actor-context";
import { getMemberRecognitionSummary } from "@/services/member-recognition";
import {
  buildMemberIdentityContext,
  getVisibleMemberGreetingName,
} from "@/services/member-mobile-identity-context";
import { getMvpMemberHome } from "@/services/mvp-event-tracking-workspace";
import { getMockReadOnlyAppData } from "@/services/read-only-app-data";

describe("member mobile identity context", () => {
  it("keeps real member and chapter identity clean outside TEST preview data", () => {
    const actor = {
      ...getMockLocalActorContext("member.a@mymedlife.test"),
      user: {
        ...getMockLocalActorContext("member.a@mymedlife.test").user,
        displayName: "Nick Ellis",
      },
    };
    const data = getMockReadOnlyAppData("Testing production identity labels.");
    const studentHome = {
      ...getMvpMemberHome(actor, data),
      chapterName: "New York University MEDLIFE",
    };
    const recognition = getMemberRecognitionSummary(actor, data);

    const context = buildMemberIdentityContext(
      actor,
      studentHome,
      recognition,
      "New York University",
      { testPreview: false },
    );

    expect(context.displayName).toBe("Nick Ellis");
    expect(context.firstName).toBe("Nick");
    expect(context.chapterName).toBe("New York University MEDLIFE");
    expect(context.campusName).toBe("New York University");
  });

  it("preserves an explicit TEST label even outside preview mode", () => {
    expect(getVisibleMemberGreetingName("TEST Review Member", false)).toBe("TEST Review");
  });
});
