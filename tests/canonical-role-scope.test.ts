import { describe, expect, it } from "vitest";
import {
  getCanonicalLandingSurface,
  getCanonicalRoleAssignments,
  getCanonicalRoles,
  getCanonicalScopes,
  getHighestOperationalCanonicalRole,
} from "@/services/canonical-role-scope";

describe("canonical role and scope mapping", () => {
  it("maps chapter leadership and committee labels into canonical roles", () => {
    const assignments = getCanonicalRoleAssignments({
      audience: "chapter_leader",
      chapterRoles: ["Action Committee Chair", "President / VP"],
      staffRoles: [],
    });

    expect(assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "committee_chair",
          scope: "committee",
          source: "chapter_role_label",
        }),
        expect.objectContaining({
          role: "president",
          scope: "chapter",
          source: "chapter_role_label",
        }),
      ]),
    );
    expect(getCanonicalRoles(assignments)).toEqual(["committee_chair", "president"]);
    expect(getCanonicalScopes(assignments)).toEqual(["committee", "chapter"]);
    expect(getHighestOperationalCanonicalRole(assignments)).toBe("president");
    expect(getCanonicalLandingSurface("president")).toBe(
      "student_leadership_command_center",
    );
  });

  it("maps database role keys and staff roles into operational scopes", () => {
    const assignments = getCanonicalRoleAssignments({
      audience: "super_admin",
      chapterRoles: [],
      staffRoles: ["Super Admin"],
      databaseRoleKeys: ["super_admin", "coach"],
    });

    expect(assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "super_admin",
          scope: "all_platform",
        }),
        expect.objectContaining({
          role: "coach",
          scope: "assigned_coach_portfolio",
        }),
      ]),
    );
    expect(getHighestOperationalCanonicalRole(assignments)).toBe("super_admin");
  });

  it("keeps sales-coach routing and scope aligned with coach portfolio ownership", () => {
    const assignments = getCanonicalRoleAssignments({
      audience: "coach",
      chapterRoles: [],
      staffRoles: ["Sales Coach"],
    });

    expect(assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "coach",
          scope: "assigned_coach_portfolio",
          source: "actor_audience",
        }),
        expect.objectContaining({
          role: "sales_coach",
          scope: "assigned_coach_portfolio",
          source: "staff_role_label",
        }),
      ]),
    );
    expect(getCanonicalScopes(assignments)).toContain("assigned_coach_portfolio");
    expect(getHighestOperationalCanonicalRole(assignments)).toBe("sales_coach");
    expect(getCanonicalLandingSurface("sales_coach")).toBe("staff_hq_command_center");
  });
});
