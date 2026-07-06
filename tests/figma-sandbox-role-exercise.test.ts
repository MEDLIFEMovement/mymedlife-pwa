import { describe, expect, it } from "vitest";

import {
  buildFigmaSandboxRoleExerciseReport,
  formatFigmaSandboxRoleExerciseMarkdown,
  getFigmaSandboxRoleExerciseDriftValidation,
} from "@/services/figma-sandbox-role-exercise";

describe("figma sandbox role exercise", () => {
  it("maps sandbox Test logins to launch-lane review routes by shell", () => {
    const report = buildFigmaSandboxRoleExerciseReport();

    expect(report.notProductionEvidence).toBe(true);
    expect(report.productionProofStatus).toBe("blocked_by_design");

    const memberRow = report.rows.find((row) => row.shell === "member_app");
    const leaderRow = report.rows.find(
      (row) => row.shell === "leader_command_center",
    );
    const staffRow = report.rows.find((row) => row.shell === "staff_command_center");
    const adminRow = report.rows.find((row) => row.shell === "admin_backend");
    const sltRow = report.rows.find((row) => row.shell === "slt_prep");

    expect(memberRow?.exerciseRoutes.map((route) => route.canonicalHref)).toEqual(
      expect.arrayContaining([
        "/app",
        "/app/events",
        "/app/events/chapter-event-ucla-kickoff",
        "/app/points",
        "/app/stories",
      ]),
    );
    expect(leaderRow?.exerciseRoutes.map((route) => route.canonicalHref)).toEqual([
      "/leader?view=overview",
    ]);
    expect(staffRow?.exerciseRoutes.map((route) => route.canonicalHref)).toEqual([
      "/staff?view=chapters",
    ]);
    expect(adminRow?.exerciseRoutes.map((route) => route.canonicalHref)).toEqual(
      expect.arrayContaining([
        "/admin",
        "/admin/users",
        "/admin/chapters",
        "/admin/launch-gate",
      ]),
    );
    expect(sltRow?.reviewMode).toBe("sandbox_review_alias");
    expect(sltRow?.exerciseRoutes.map((route) => route.canonicalHref)).toEqual(
      expect.arrayContaining(["/app/slt-prep"]),
    );
  });

  it("keeps sandbox exercise output clearly outside production proof", () => {
    const report = buildFigmaSandboxRoleExerciseReport();

    expect(report.validation.ready).toBe(true);
    expect(report.driftValidation.ready).toBe(true);
    expect(
      report.rows.every(
        (row) =>
          row.excludedFromProductionEvidence &&
          row.notProductionProofReason.includes(
            "Real production signed-in proof still requires approved production packet rows",
          ),
      ),
    ).toBe(true);
  });

  it("renders a reviewer-friendly markdown checklist with local-only commands", () => {
    const markdown = formatFigmaSandboxRoleExerciseMarkdown();

    expect(markdown).toContain("# myMEDLIFE Figma Sandbox Role Exercise");
    expect(markdown).toContain("`pnpm figma-seed:build`");
    expect(markdown).toContain("`pnpm figma-seed:proof`");
    expect(markdown).toContain("`pnpm figma-seed:exercise:check`");
    expect(markdown).toContain(
      "`MYMEDLIFE_TEST_PRODUCTION_CONFIRM=CREATE_TEST_DATA pnpm test-production:seed -- --local`",
    );
    expect(markdown).toContain("must not count as production signed-in route proof");
    expect(markdown).toContain("Route drift validation:");
    expect(markdown).toContain("## Member app");
    expect(markdown).toContain("## SLT Prep");
  });

  it("flags exercise route drift against launch-lane metadata", () => {
    const report = buildFigmaSandboxRoleExerciseReport();
    const staleReport = structuredClone(report);
    const memberRow = staleReport.rows.find((row) => row.shell === "member_app");

    memberRow?.exerciseRoutes.push({
      canonicalHref: "/app/deleted-route",
      label: "Deleted member route",
      workspace: "member",
      notes: "This stale sandbox route should be caught before it reaches an operator checklist.",
    });

    const validation = getFigmaSandboxRoleExerciseDriftValidation(staleReport);

    expect(validation.ready).toBe(false);
    expect(validation.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "member_app:/app/deleted-route",
          passed: false,
        }),
      ]),
    );
  });

  it("flags sandbox notes that sound like production proof", () => {
    const report = buildFigmaSandboxRoleExerciseReport();
    const unsafeReport = structuredClone(report);
    const memberRow = unsafeReport.rows.find((row) => row.shell === "member_app");

    if (memberRow) {
      memberRow.notProductionProofReason =
        "This local sandbox run counts as production proof.";
    }

    const validation = getFigmaSandboxRoleExerciseDriftValidation(unsafeReport);

    expect(validation.ready).toBe(false);
    expect(validation.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "member_app:proof-boundary",
          passed: false,
        }),
      ]),
    );
  });
});
