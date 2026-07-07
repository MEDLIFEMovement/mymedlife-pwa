import { describe, expect, it } from "vitest";

import {
  formatActionCommitteeLeadershipRoleSafetyContract,
  getActionCommitteeLeadershipRoleSafetyContract,
} from "@/services/action-committee-leadership-role-safety-contract";

describe("action committee / chapter leadership role safety contract", () => {
  it("keeps committee and leadership review surfaces read-only while acknowledging the reviewed write lanes", () => {
    const contract = getActionCommitteeLeadershipRoleSafetyContract();

    expect(contract.validation.ready).toBe(true);
    expect(contract.validation.checks.every((check) => check.passed)).toBe(true);
    expect(contract.currentReviewedWritePaths.map((path) => path.route)).toEqual([
      "/chapter/members",
      "/admin/assignment-write",
    ]);
    expect(
      contract.lanes.find((lane) => lane.key === "chapter_membership_review"),
    ).toMatchObject({
      route: "/chapter/members",
      status: "read_only_preview",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "membership_approval_write"),
    ).toMatchObject({
      route: "/chapter/members",
      status: "implemented_hosted_staging_only",
    });
    expect(
      contract.lanes.find((lane) => lane.key === "promotion_and_succession"),
    ).toMatchObject({
      route: "/campaigns/leadership-transition",
      status: "blocked_pending_future_lane",
    });
  });

  it("pins fake-live committee, promotion, task, points, and rollout behavior as blocked", () => {
    const contract = getActionCommitteeLeadershipRoleSafetyContract();

    expect(
      contract.lanes.find((lane) => lane.key === "committee_role_focus")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake chair promotion.",
        "No hidden permission expansion from role guidance copy.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "points_authority")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No fake points award from committee membership.",
        "No browser-only points mutation.",
      ]),
    );
    expect(
      contract.lanes.find((lane) => lane.key === "production_rollout_evidence")
        ?.forbiddenSideEffects,
    ).toEqual(
      expect.arrayContaining([
        "No Test/Figma/sandbox/mock committee row counts as production proof.",
        "No localhost or staging membership-approval screenshot counts as rollout evidence.",
      ]),
    );
  });

  it("formats the contract in plain English for operators", () => {
    const output = formatActionCommitteeLeadershipRoleSafetyContract();

    expect(output).toContain(
      "Action committee / chapter leadership role-scope safety contract: READ-ONLY readiness spec",
    );
    expect(output).toContain("/chapter/members");
    expect(output).toContain("/admin/assignment-write");
    expect(output).toContain("enabled modes: localhost, hosted staging");
    expect(output).toContain("Chair, president, and succession planning");
    expect(output).toContain("Provider, outbox, and committee follow-up delivery");
    expect(output).toContain(
      "Committee labels, chair titles, and chapter-leadership planning copy must not silently grant task authority, points authority, or ownership-transfer power.",
    );
  });
});
