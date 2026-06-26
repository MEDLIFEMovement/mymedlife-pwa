import { describe, expect, it } from "vitest";

import { homeSurfaceJumps } from "@/services/home-role-jumps";

describe("home role jumps", () => {
  it("maps the member-home role handoffs to the three role destinations visible in the Figma flow", () => {
    expect(homeSurfaceJumps).toEqual([
      {
        label: "Leader Hub",
        selectedEmail: "leader.a@mymedlife.test",
        helper: "Student leadership command center",
        returnTo: "/leader?view=overview&source=member_home",
      },
      {
        label: "Staff View",
        selectedEmail: "coach@mymedlife.test",
        helper: "Staff command center",
        returnTo: "/staff?view=chapters&source=member_home",
      },
      {
        label: "Admin",
        selectedEmail: "admin@mymedlife.test",
        helper: "Admin Console",
        returnTo: "/admin?source=member_home",
      },
    ]);
  });
});
