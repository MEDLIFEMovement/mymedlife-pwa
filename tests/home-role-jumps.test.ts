import { describe, expect, it } from "vitest";

import { homeSurfaceJumps } from "@/services/home-role-jumps";

describe("home role jumps", () => {
  it("maps the member-home switch controls to the three role handoffs visible in the Figma flow", () => {
    expect(homeSurfaceJumps).toEqual([
      {
        label: "Leader Hub",
        selectedEmail: "leader.a@mymedlife.test",
        helper: "Chapter command center",
        returnTo: "/chapter?view=overview&source=member_home",
      },
      {
        label: "Coach View",
        selectedEmail: "coach@mymedlife.test",
        helper: "Portfolio support view",
        returnTo: "/coach?view=chapters&source=member_home",
      },
      {
        label: "Admin",
        selectedEmail: "admin@mymedlife.test",
        helper: "Admin Console",
        returnTo: "/staff?view=admin&source=member_home",
      },
    ]);
  });
});
