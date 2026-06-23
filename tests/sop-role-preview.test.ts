import { describe, expect, it } from "vitest";

import {
  buildSopRolePreviewHref,
  getLocalPreviewEmailForSopRole,
  getSopRolePreviewLabel,
} from "@/services/sop-role-preview";

describe("SOP role preview helpers", () => {
  it("maps canonical SOP roles into the correct local preview actors", () => {
    expect(getLocalPreviewEmailForSopRole("student_member")).toBe("member.a@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("traveler")).toBe("traveler.a@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("committee_chair")).toBe("committee.chair@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("vice_president")).toBe("vice.president@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("president")).toBe("leader.a@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("coach")).toBe("coach@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("sales_coach")).toBe("sales.coach@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("department_staff")).toBe("admin@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("sales_admin")).toBe("sales.admin@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("ds_admin")).toBe("ds.admin@mymedlife.test");
    expect(getLocalPreviewEmailForSopRole("super_admin")).toBe("super.admin@mymedlife.test");
  });

  it("builds role-correct local preview routes for SOP route checks", () => {
    expect(buildSopRolePreviewHref("student_member", "/rush-month")).toBe(
      "/local-preview?selectedEmail=member.a%40mymedlife.test&returnTo=%2Frush-month",
    );
    expect(buildSopRolePreviewHref("department_staff", "/staff?view=campaigns")).toBe(
      "/local-preview?selectedEmail=admin%40mymedlife.test&returnTo=%2Fstaff%3Fview%3Dcampaigns",
    );
  });

  it("keeps preview labels human-readable", () => {
    expect(getSopRolePreviewLabel("student_member")).toBe("student member");
    expect(getSopRolePreviewLabel("department_staff")).toBe("department staff");
  });
});
