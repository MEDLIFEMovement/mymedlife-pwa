import { describe, expect, it } from "vitest";
import {
  buildLocalPreviewHref,
  buildStudentHomePreviewHref,
} from "@/services/local-preview-route";

describe("local preview route helpers", () => {
  it("defaults preview redirects to the selected role landing surface", () => {
    expect(buildLocalPreviewHref("leader.a@mymedlife.test")).toBe(
      "/local-preview?selectedEmail=leader.a%40mymedlife.test&returnTo=%2Fleader%3Fview%3Doverview",
    );
    expect(buildLocalPreviewHref("general.staff@mymedlife.test")).toBe(
      "/local-preview?selectedEmail=general.staff%40mymedlife.test&returnTo=%2Fstaff%3Fview%3Dchapters",
    );
  });

  it("preserves explicit return targets when they are provided", () => {
    expect(
      buildLocalPreviewHref(
        "coach@mymedlife.test",
        "/coach?view=chapters&source=member_home",
      ),
    ).toBe(
      "/local-preview?selectedEmail=coach%40mymedlife.test&returnTo=%2Fcoach%3Fview%3Dchapters%26source%3Dmember_home",
    );
    expect(buildStudentHomePreviewHref()).toBe(
      "/local-preview?selectedEmail=member.a%40mymedlife.test&returnTo=%2Fapp",
    );
  });
});
